const imageDao = require("../daos/image.dao");
const Image = require("../models/image.model");
const { compareItems, hashItem } = require("../utils/helpers/bcrypt.util");
const log = require("../configs/logger.config");
const { createToken } = require("../utils/helpers/tokenHelper.util");
const { validateEmail } = require("../utils/helpers/validator.util");
const { removeNullUndefined, randomString } = require("../utils/helpers/common.util");
const { sendMail } = require("../utils/helpers/email.util");
const { s3 } = require("../configs/aws.config");
const { UPLOADED, PENDING, FAILED, PROCESSING } = require("../utils/constants/status.constant");
const crypto = require("crypto");
const Shelf = require("../models/shelf.model"); // adjust path as needed
const FormData = require("form-data");
const axios = require("axios");
const { v4: uuidv4 } = require("uuid");
const shelfDao = require("../daos/shelf.dao");
const mongoose = require("mongoose");

const EXTERNAL_IMAGE_API = process.env.EXTERNAL_IMAGE_API;

// Todo:
/**
 * copy uploadService code once all changes done then syncOfflineUploadService
 */

// utility function
function splitBufferByBoundary(buffer, boundary) {
    const boundaryStr = boundary.toString("binary");
    const bufferStr = buffer.toString("binary");
    const rawParts = bufferStr.split(boundaryStr);
    return rawParts
        .map(p => Buffer.from(p, "binary"))
        .filter(p => p.length && !p.equals(Buffer.from("--\r\n")));
}

async function uploadToS3(file, folder) {
    const key = `${folder}/${uuidv4()}-${file.originalname}`;

    const params = {
        Bucket: process.env.AWS_BUCKET_NAME,
        Key: key,
        Body: file.buffer,
        ContentType: file.mimetype,
        ACL: "public-read",
    };

    return s3.upload(params).promise(); // returns { Location, Key, Bucket, etc. }
}


class ImageService {
    async uploadService(req, res) {
        try {
            const { userId } = req;
            const { location, captureDateTime } = req.body;
            const files = req.files;

            if (!userId || !location || !captureDateTime || !files?.length) {
                return res.status(400).json({
                    message: "userId, location, captureDateTime and at least 1 image file are required",
                    status: "fail",
                });
            }

            // === Parse & Validate Location ===
            const locationParts = location.split(",").map(s => s.trim());
            if (locationParts.length !== 2) {
                return res.status(400).json({ message: "Invalid location format", status: "fail" });
            }

            const [longitude, latitude] = locationParts.map(Number);
            if (
                isNaN(longitude) || isNaN(latitude) ||
                longitude < -180 || longitude > 180 ||
                latitude < -90 || latitude > 90
            ) {
                return res.status(400).json({ message: "Invalid longitude or latitude", status: "fail" });
            }

            // === Validate captureDateTime ===
            const parsedCaptureDateTime = new Date(captureDateTime);
            if (isNaN(parsedCaptureDateTime.getTime())) {
                return res.status(400).json({ message: "Invalid captureDateTime", status: "fail" });
            }

            const firstImage = files[0];

            // === Step 1: Upload original image to S3 tmp ===
            const tmpUpload = await uploadToS3(firstImage, "tmp");

            // === Step 2: Save DB entry with status PROCESSING ===
            const imageSizeInKB = Math.ceil(firstImage.size / 1024);
            const { data: savedImage } = await imageDao.createImage({
                userId,
                imageUrl: tmpUpload.Location,
                location: {
                    type: "Point",
                    coordinates: [longitude, latitude],
                },
                captureDateTime: parsedCaptureDateTime,
                imageSizeInKB,
                status: PROCESSING,
            });

            // === Step 3: Respond immediately to client ===
            res.status(202).json({
                message: "Image uploaded. Processing will continue in background.",
                status: "success",
                data: {
                    imageId: savedImage._id,
                }
            });

            // === Phase 2: Background processing ===
            setImmediate(async () => {
                try {
                    const formData = new FormData();
                    formData.append("imageUrl", tmpUpload.Location);

                    const mlResponse = await axios.post(EXTERNAL_IMAGE_API, formData, {
                        responseType: "arraybuffer",
                        headers: formData.getHeaders(),
                    });

                    const contentType = mlResponse.headers["content-type"];
                    const boundaryMatch = contentType.match(/boundary=(.*)$/);
                    if (!boundaryMatch) throw new Error("No boundary in ML API response");

                    const boundary = `--${boundaryMatch[1]}`;
                    const parts = mlResponse.data.toString().split(boundary);

                    let processedImageBuffer = null;
                    let metricsData = null;

                    for (const part of parts) {
                        if (part.includes("Content-Type: image/png")) {
                            const binaryData = part.split("\r\n\r\n")[1];
                            processedImageBuffer = Buffer.from(binaryData, "binary");
                        } else if (part.includes("Content-Type: application/json")) {
                            const jsonStr = part.split("\r\n\r\n")[1];
                            metricsData = JSON.parse(jsonStr.trim());
                        }
                    }

                    if (!processedImageBuffer || !metricsData) throw new Error("Failed to parse ML API response");

                    const processedUpload = await uploadToS3(
                        {
                            buffer: processedImageBuffer,
                            mimetype: "image/png",
                            originalname: "processed.png"
                        },
                        "M-Assists-Processed-Image"
                    );

                    const Decimal128 = mongoose.Types.Decimal128;
                    const shelfMetrics = {
                        OSA: Decimal128.fromString(metricsData.osa.toFixed(2)),
                        SOS: Decimal128.fromString(metricsData.sos.toFixed(2)),
                        PGC: Decimal128.fromString(metricsData.pgc.toFixed(2)),
                    };

                    const { data: newShelf } = await shelfDao.createShelf({
                        userId,
                        imageUrls: [savedImage._id],
                        metricSummary: shelfMetrics,
                    });

                    // Update image
                    savedImage.imageUrl = processedUpload.Location;
                    savedImage.shelfId = newShelf._id;
                    savedImage.status = UPLOADED;
                    await savedImage.save();

                    console.log("Background processing complete for image:", savedImage._id);
                } catch (err) {
                    console.error("Background processing failed:", err.message);
                    // Optionally update image status to FAILED
                    savedImage.status = "FAILED";
                    await savedImage.save();
                }
            });

        } catch (error) {
            console.error("Error in uploadService:", error);
            return res.status(500).json({ message: "Internal Server Error", status: "error" });
        }
    }

    async syncOfflineUploadService(req, res) {
        try {
            const { userId } = req;
            const { location, captureDateTime } = req.body;
            const files = req.files;

            if (!userId || !location || !captureDateTime || !files?.length) {
                return res.status(400).json({
                    message: "userId, location, captureDateTime and at least 1 image file are required",
                    status: "fail",
                });
            }

            // === Parse & Validate Location ===
            const locationParts = location.split(",").map(s => s.trim());
            if (locationParts.length !== 2) {
                return res.status(400).json({ message: "Invalid location format", status: "fail" });
            }

            const [longitude, latitude] = locationParts.map(Number);
            if (
                isNaN(longitude) || isNaN(latitude) ||
                longitude < -180 || longitude > 180 ||
                latitude < -90 || latitude > 90
            ) {
                return res.status(400).json({ message: "Invalid longitude or latitude", status: "fail" });
            }

            // === Validate captureDateTime ===
            const parsedCaptureDateTime = new Date(captureDateTime);
            if (isNaN(parsedCaptureDateTime.getTime())) {
                return res.status(400).json({ message: "Invalid captureDateTime", status: "fail" });
            }

            const firstImage = files[0];

            // === Step 1: Upload original image to S3 tmp ===
            const tmpUpload = await uploadToS3(firstImage, "tmp");

            // === Step 2: Save DB entry with status PROCESSING ===
            const imageSizeInKB = Math.ceil(firstImage.size / 1024);
            const { data: savedImage } = await imageDao.createImage({
                userId,
                imageUrl: tmpUpload.Location,
                location: {
                    type: "Point",
                    coordinates: [longitude, latitude],
                },
                captureDateTime: parsedCaptureDateTime,
                imageSizeInKB,
                status: "PROCESSING",
            });

            // === Step 3: Respond immediately to client ===
            res.status(202).json({
                message: "Image uploaded. Processing will continue in background.",
                status: "success",
                data: {
                    imageId: savedImage._id,
                }
            });

            // === Phase 2: Background processing ===
            setImmediate(async () => {
                try {
                    const formData = new FormData();
                    formData.append("imageUrl", tmpUpload.Location);

                    const mlResponse = await axios.post(EXTERNAL_IMAGE_API, formData, {
                        responseType: "arraybuffer",
                        headers: formData.getHeaders(),
                    });

                    const contentType = mlResponse.headers["content-type"];
                    const boundaryMatch = contentType.match(/boundary=(.*)$/);
                    if (!boundaryMatch) throw new Error("No boundary in ML API response");

                    const boundary = `--${boundaryMatch[1]}`;
                    const parts = mlResponse.data.toString().split(boundary);

                    let processedImageBuffer = null;
                    let metricsData = null;

                    for (const part of parts) {
                        if (part.includes("Content-Type: image/png")) {
                            const binaryData = part.split("\r\n\r\n")[1];
                            processedImageBuffer = Buffer.from(binaryData, "binary");
                        } else if (part.includes("Content-Type: application/json")) {
                            const jsonStr = part.split("\r\n\r\n")[1];
                            metricsData = JSON.parse(jsonStr.trim());
                        }
                    }

                    if (!processedImageBuffer || !metricsData) {
                        throw new Error("Failed to parse both processed image and metrics JSON");
                    }

                    const processedUpload = await uploadToS3(
                        {
                            buffer: processedImageBuffer,
                            mimetype: "image/png",
                            originalname: "processed.png"
                        },
                        "M-Assists-Processed-Image"
                    );

                    const Decimal128 = mongoose.Types.Decimal128;
                    const shelfMetrics = {
                        OSA: Decimal128.fromString(metricsData.osa.toFixed(2)),
                        SOS: Decimal128.fromString(metricsData.sos.toFixed(2)),
                        PGC: Decimal128.fromString(metricsData.pgc.toFixed(2)),
                    };

                    const { data: newShelf } = await shelfDao.createShelf({
                        userId,
                        imageUrls: [savedImage._id],
                        metricSummary: shelfMetrics,
                    });

                    savedImage.imageUrl = processedUpload.Location;
                    savedImage.shelfId = newShelf._id;
                    savedImage.status = "UPLOADED";
                    await savedImage.save();

                    console.log(`✅ Background processing complete for image: ${savedImage._id}`);
                } catch (err) {
                    console.error(`❌ Error during background processing for image ${savedImage?._id || "unknown"}:`, err?.message || err);
                    try {
                        if (savedImage) {
                            savedImage.status = "FAILED";
                            await savedImage.save();
                        }
                    } catch (saveErr) {
                        console.error("❌ Failed to update image status to FAILED:", saveErr.message || saveErr);
                    }
                }
            });

        } catch (error) {
            console.error("❌ syncOfflineUploadService error:", error.message || error);
            return res.status(500).json({ message: "Internal Server Error", status: "error" });
        }
    }

    async imageProcessingStatusService(req, res) {
        const { imageId } = req.params;
        const image = await imageDao.getImageById(imageId);
        if (!image) return res.status(404).json({ message: "Image not found" });

        res.json({
            status: image.status,
            shelfId: image.shelfId || null,
            imageUrl: image.imageUrl,
        });
    }
    /*
    async getAllImagesService(req, res) {
        try {
            const images = await imageDAO.getAllImagesSortedByDate();

            return res.status(200).json({
                message: "Images fetched successfully",
                data: images,
                status: "success",
                code: 200,
            });
        } catch (error) {
            log.error("Error from [Image Service - getAllImagesService]:", error);
            return res.status(500).json({
                message: "Failed to fetch images",
                status: "failed",
                data: null,
                code: 500,
            });
        }
    }
    async deleteImageService(req, res) {
        try {
            const { imageId } = req.params;

            if (!imageId) {
                return res.status(400).json({
                    message: "Image ID is required.",
                    status: "failed",
                    data: null,
                    code: 400,
                });
            }

            const imageDoc = await imageDAO.deleteImage(imageId);

            if (!imageDoc) {
                return res.status(404).json({
                    message: "Image not found.",
                    status: "failed",
                    data: null,
                    code: 404,
                });
            }

            // Extract S3 key from URL
            const s3Key = imageDoc.imageUrl.split('.com/')[1];

            if (s3Key) {
                const s3DeleteParams = {
                    Bucket: process.env.AWS_BUCKET_NAME,
                    Key: s3Key,
                };

                await new Promise((resolve, reject) => {
                    s3.deleteObject(s3DeleteParams, (err, data) => {
                        if (err) return reject(err);
                        resolve(data);
                    });
                });
            }

            return res.status(200).json({
                message: "Image deleted successfully.",
                status: "success",
                data: null,
                code: 200,
            });
        } catch (error) {
            log.error("Error from [Image Service - deleteImageService]:", error);
            return res.status(500).json({
                message: "Server error while deleting image.",
                status: "failed",
                data: null,
                code: 500,
            });
        }
    }
    */
}


module.exports = new ImageService();