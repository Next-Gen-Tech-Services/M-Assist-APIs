const imageDao = require("../daos/image.dao");
const Image = require("../models/image.model");
const { compareItems, hashItem } = require("../utils/helpers/bcrypt.util");
const log = require("../configs/logger.config");
const { createToken } = require("../utils/helpers/tokenHelper.util");
const { validateEmail } = require("../utils/helpers/validator.util");
const { removeNullUndefined, randomString } = require("../utils/helpers/common.util");
const { sendMail } = require("../utils/helpers/email.util");
const { s3 } = require("../configs/aws.config");
const { UPLOADED, PENDING, FAILED } = require("../utils/constants/status.constant");
const crypto = require("crypto");
const Shelf = require("../models/shelf.model"); // adjust path as needed
const FormData = require("form-data");
const axios = require("axios");
const { v4: uuidv4 } = require("uuid");
const shelfDao = require("../daos/shelf.dao");
const mongoose = require("mongoose");

const EXTERNAL_IMAGE_API = process.env.EXTERNAL_IMAGE_API;


// utility function
function splitBufferByBoundary(buffer, boundary) {
    const boundaryStr = boundary.toString("binary");
    const bufferStr = buffer.toString("binary");
    const rawParts = bufferStr.split(boundaryStr);
    return rawParts
        .map(p => Buffer.from(p, "binary"))
        .filter(p => p.length && !p.equals(Buffer.from("--\r\n")));
}
async function uploadToS3(buffer, key, contentType) {
    const params = {
        Bucket: process.env.AWS_BUCKET_NAME,
        Key: key,
        Body: buffer,
        ContentType: contentType,
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

            // === Initial Checks ===
            if (!userId || !location || !captureDateTime || !files?.length) {
                return res.status(400).json({
                    message: "userId, location, captureDateTime and at least 1 image file are required",
                    status: "fail",
                });
            }

            // === Validate and Parse Location ===
            const locationParts = location.split(",").map(s => s.trim());
            if (locationParts.length !== 2) {
                return res.status(400).json({
                    message: "location must be in 'longitude, latitude' format",
                    status: "fail",
                });
            }

            const [longitude, latitude] = locationParts.map(Number);
            if (
                isNaN(longitude) || isNaN(latitude) ||
                longitude < -180 || longitude > 180 ||
                latitude < -90 || latitude > 90
            ) {
                return res.status(400).json({
                    message: "Invalid longitude or latitude values",
                    status: "fail",
                });
            }

            // === Validate captureDateTime ===
            const parsedCaptureDateTime = new Date(captureDateTime);
            if (isNaN(parsedCaptureDateTime.getTime())) {
                return res.status(400).json({
                    message: "Invalid captureDateTime value",
                    status: "fail",
                });
            }

            const firstImage = files[0];

            // === STEP 1: Call ML API ===
            const form = new FormData();
            form.append("file", firstImage.buffer, {
                filename: firstImage.originalname,
                contentType: firstImage.mimetype,
            });

            let mlResponse;
            try {
                mlResponse = await axios.post(EXTERNAL_IMAGE_API, form, {
                    headers: form.getHeaders(),
                    responseType: "arraybuffer",
                });

            } catch (error) {
                log.error("Error in hitting M.L API:", error);
                throw error;
            }
            const contentType = mlResponse.headers["content-type"];
            const boundaryMatch = contentType.match(/boundary=(.*)$/);
            if (!boundaryMatch) throw new Error("Boundary not found in ML API response");

            const boundaryBuffer = Buffer.from(`--${boundaryMatch[1]}`, "binary");
            const parts = splitBufferByBoundary(mlResponse.data, boundaryBuffer);

            let processedImageBuffer = null;
            let metricsData = null;

            for (const part of parts) {
                const headerEnd = part.indexOf("\r\n\r\n");
                if (headerEnd === -1) continue;

                const headers = part.slice(0, headerEnd).toString("utf-8");
                const body = part.slice(headerEnd + 4);

                if (headers.includes("Content-Type: image/png")) {
                    processedImageBuffer = body;
                } else if (headers.includes("Content-Type: application/json")) {
                    const jsonStr = body.toString("utf-8").trim();
                    metricsData = JSON.parse(jsonStr);
                }
            }

            if (!processedImageBuffer || !metricsData) {
                return res.status(500).json({
                    message: "Failed to parse ML API response",
                    status: "error",
                });
            }

            // === STEP 2: Upload processed image to S3 ===
            const s3Key = `clipverse/images/${uuidv4()}.png`;
            const { Location: imageUrl } = await uploadToS3(processedImageBuffer, s3Key, "image/png");

            // === STEP 3: Save image document ===
            const imageSizeInKB = Math.ceil(firstImage.size / 1024);
            const { data: savedImage } = await imageDao.createImage({
                userId,
                imageUrl,
                location: {
                    type: "Point",
                    coordinates: [longitude, latitude],
                },
                captureDateTime: parsedCaptureDateTime,
                imageSizeInKB,
                status: PENDING,
            });

            // === STEP 4: Save shelf with metrics ===
            const Decimal128 = mongoose.Types.Decimal128;

            console.log("=== Metrics from ML API ===");
            console.log("ML API Raw Response:", metricsData);

            const { osa, sos, pgc } = metricsData;

            console.log("Parsed metrics:");
            console.log("OSA:", osa);
            console.log("SOS:", sos);
            console.log("PGC :", pgc);

            const shelfMetrics = {
                OSA: Decimal128.fromString(osa.toFixed(2)),
                SOS: Decimal128.fromString(sos.toFixed(2)),
                PGC: Decimal128.fromString(pgc.toFixed(2))
            };

            console.log("Metrics to be stored in DB:", shelfMetrics);


            const { data: newShelf } = await shelfDao.createShelf({
                userId,
                imageUrls: [savedImage._id],
                metricSummary: shelfMetrics,
            });

            // === STEP 5: Update image with shelf reference ===
            savedImage.shelfId = newShelf._id;
            savedImage.status = UPLOADED;
            await savedImage.save();

            return res.status(201).json({
                message: "Image uploaded and shelf created successfully",
                status: "success",
                data: {
                    shelfId: newShelf._id,
                    images: [savedImage._id],
                },
            });
        } catch (error) {
            log.error("Error in uploadSingleImageAndCreateShelf:", error);
            return res.status(500).json({
                message: "Internal server error",
                status: "error",
            });
        }
    }
    async syncOfflineUploadService(req, res) {
        try {
            const { userId } = req;
            const { location, captureDateTime } = req.body;
            const files = req.files;

            // === Initial Checks ===
            if (!userId || !location || !captureDateTime || !files?.length) {
                return res.status(400).json({
                    message: "userId, location, captureDateTime and at least 1 image file are required",
                    status: "fail",
                });
            }

            // === Validate and Parse Location ===
            const locationParts = location.split(",").map(s => s.trim());
            if (locationParts.length !== 2) {
                return res.status(400).json({
                    message: "location must be in 'longitude, latitude' format",
                    status: "fail",
                });
            }

            const [longitude, latitude] = locationParts.map(Number);
            if (
                isNaN(longitude) || isNaN(latitude) ||
                longitude < -180 || longitude > 180 ||
                latitude < -90 || latitude > 90
            ) {
                return res.status(400).json({
                    message: "Invalid longitude or latitude values",
                    status: "fail",
                });
            }

            // === Validate captureDateTime ===
            const parsedCaptureDateTime = new Date(captureDateTime);
            if (isNaN(parsedCaptureDateTime.getTime())) {
                return res.status(400).json({
                    message: "Invalid captureDateTime value",
                    status: "fail",
                });
            }

            const firstImage = files[0];

            // === STEP 1: Call ML API ===
            const form = new FormData();
            form.append("file", firstImage.buffer, {
                filename: firstImage.originalname,
                contentType: firstImage.mimetype,
            });

            const mlResponse = await axios.post(EXTERNAL_IMAGE_API, form, {
                headers: form.getHeaders(),
                responseType: "arraybuffer",
            });

            const contentType = mlResponse.headers["content-type"];
            const boundaryMatch = contentType.match(/boundary=(.*)$/);
            if (!boundaryMatch) throw new Error("Boundary not found in ML API response");

            const boundaryBuffer = Buffer.from(`--${boundaryMatch[1]}`, "binary");
            const parts = splitBufferByBoundary(mlResponse.data, boundaryBuffer);

            let processedImageBuffer = null;
            let metricsData = null;

            for (const part of parts) {
                const headerEnd = part.indexOf("\r\n\r\n");
                if (headerEnd === -1) continue;

                const headers = part.slice(0, headerEnd).toString("utf-8");
                const body = part.slice(headerEnd + 4);

                if (headers.includes("Content-Type: image/png")) {
                    processedImageBuffer = body;
                } else if (headers.includes("Content-Type: application/json")) {
                    const jsonStr = body.toString("utf-8").trim();
                    metricsData = JSON.parse(jsonStr);
                }
            }

            if (!processedImageBuffer || !metricsData) {
                return res.status(500).json({
                    message: "Failed to parse ML API response",
                    status: "error",
                });
            }

            // === STEP 2: Upload processed image to S3 ===
            const s3Key = `clipverse/images/${uuidv4()}.png`;
            const { Location: imageUrl } = await uploadToS3(processedImageBuffer, s3Key, "image/png");

            // === STEP 3: Save image document ===
            const imageSizeInKB = Math.ceil(firstImage.size / 1024);
            const { data: savedImage } = await imageDao.createImage({
                userId,
                imageUrl,
                location: {
                    type: "Point",
                    coordinates: [longitude, latitude],
                },
                captureDateTime: parsedCaptureDateTime,
                imageSizeInKB,
                status: PENDING,
            });

            // === STEP 4: Save shelf with metrics ===
            const Decimal128 = mongoose.Types.Decimal128;

            console.log("=== Metrics from ML API ===");
            console.log("ML API Raw Response:", metricsData);

            const { osa, sos, pgc } = metricsData;

            console.log("Parsed metrics:");
            console.log("OSA:", osa);
            console.log("SOS:", sos);
            console.log("PGC :", pgc);

            const shelfMetrics = {
                OSA: Decimal128.fromString(osa.toFixed(2)),
                SOS: Decimal128.fromString(sos.toFixed(2)),
                PGC: Decimal128.fromString(pgc.toFixed(2))
            };

            console.log("Metrics to be stored in DB:", shelfMetrics);


            const { data: newShelf } = await shelfDao.createShelf({
                userId,
                imageUrls: [savedImage._id],
                metricSummary: shelfMetrics,
            });

            // === STEP 5: Update image with shelf reference ===
            savedImage.shelfId = newShelf._id;
            savedImage.status = UPLOADED;
            await savedImage.save();

            return res.status(201).json({
                message: "Image uploaded and shelf created successfully",
                status: "success",
                data: {
                    shelfId: newShelf._id,
                    images: [savedImage._id],
                },
            });
        } catch (error) {
            log.error("Error in uploadSingleImageAndCreateShelf:", error);
            return res.status(500).json({
                message: "Internal server error",
                status: "error",
            });
        }
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