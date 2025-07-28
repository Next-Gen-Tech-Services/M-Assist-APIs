const imageDAO = require("../daos/image.dao");
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

class ImageService {
    async uploadService(req, res) {
        try {
            const userId = req.userId;
            const { location, captureDateTime } = req.body;
            const files = req.files;

            if (!userId || !location || !captureDateTime || !files || files.length === 0) {
                return res.status(400).json({
                    message: "Missing required fields or image files.",
                    status: "failed",
                    code: 400,
                    data: null,
                });
            }

            const parsedDate = new Date(captureDateTime);
            if (isNaN(parsedDate)) {
                return res.status(400).json({
                    message: "Invalid captureDateTime format.",
                    status: "failed",
                    code: 400,
                    data: null,
                });
            }

            const [lng, lat] = location.split(",").map(Number);
            if (isNaN(lng) || isNaN(lat)) {
                return res.status(400).json({
                    message: "Invalid location coordinates.",
                    status: "failed",
                    code: 400,
                    data: null,
                });
            }

            const geoLocation = {
                type: "Point",
                coordinates: [lng, lat],
            };

            const imageIds = [];

            for (const file of files) {
                const fileHash = crypto.createHash("sha256").update(file.buffer).digest("hex");
                const imageSizeInKB = Math.round(file.size / 1024);

                const s3Key = `images/${Date.now()}_${file.originalname.replace(/\s+/g, "_")}`;

                let imageUrl = "";
                let status = UPLOADED;

                try {
                    const s3UploadParams = {
                        Bucket: process.env.AWS_BUCKET_NAME,
                        Key: s3Key,
                        Body: file.buffer,
                        ContentType: file.mimetype,
                        ACL: "public-read",
                    };

                    const s3UploadResult = await s3.upload(s3UploadParams).promise();
                    imageUrl = s3UploadResult.Location;
                } catch (err) {
                    console.error("S3 upload failed:", err);
                    status = FAILED;
                    imageUrl = "";
                }

                const newImage = new Image({
                    userId,
                    location: geoLocation,
                    captureDateTime: parsedDate,
                    imageSizeInKB,
                    imageUrl,
                    fileHash,
                    status,
                });

                const savedImage = await newImage.save();
                imageIds.push(savedImage._id);
            }

            // Create new Shelf with image references and userId
            const shelf = await Shelf.create({
                userId,
                imageUrls: imageIds,
                metricSummary: {
                    OSA: "0.00",
                    SOS: "0.00",
                    PGC: "0.00"
                }
            });

            // Update shelfId in images
            await Image.updateMany(
                { _id: { $in: imageIds } },
                { $set: { shelfId: shelf._id } }
            );

            return res.status(200).json({
                message: "Upload completed",
                status: "success",
                code: 200,
                data: {
                    shelfId: shelf._id,
                    images: imageIds,
                },
            });

        } catch (error) {
            console.error("Error from [uploadService]:", error);
            return res.status(500).json({
                message: "Internal server error during upload.",
                status: "failed",
                code: 500,
                data: null,
            });
        }
    }
    async syncOfflineUploadService(req, res) {
        try {
            const userId = req.userId;
            const { location, captureDateTime } = req.body;
            const files = req.files;

            // Basic validation
            if (!location || !captureDateTime || !files || files.length === 0) {
                return res.status(400).json({
                    message: "Missing required fields or images.",
                    status: "failed",
                    code: 400,
                });
            }

            const parsedDate = new Date(captureDateTime);
            const [lng, lat] = location.split(",").map(Number);
            const geoLocation = { type: "Point", coordinates: [lng, lat] };

            const imageIds = [];

            for (const file of files) {
                const fileHash = crypto.createHash("sha256").update(file.buffer).digest("hex");
                const imageSizeInKB = Math.round(file.size / 1024);

                const existing = await Image.findOne({
                    userId,
                    fileHash,
                    captureDateTime: parsedDate,
                });

                // Skip if image already successfully uploaded
                if (existing && existing.status === UPLOADED) {
                    console.log("Image exists not need to upload");
                    imageIds.push(existing._id);
                    continue;
                }

                let status = UPLOADED;
                let imageUrl = "";

                try {
                    const s3Key = `images/${Date.now()}_${file.originalname.replace(/\s+/g, "_")}`;
                    const upload = await s3.upload({
                        Bucket: process.env.AWS_BUCKET_NAME,
                        Key: s3Key,
                        Body: file.buffer,
                        ContentType: file.mimetype,
                        ACL: "public-read",
                    }).promise();

                    imageUrl = upload.Location;
                } catch (err) {
                    console.error("S3 upload failed:", err);
                    status = FAILED;
                }

                let imageDoc;

                if (existing) {
                    existing.imageUrl = imageUrl;
                    existing.status = status;
                    existing.imageSizeInKB = imageSizeInKB;
                    imageDoc = await existing.save();
                } else {
                    const newImage = new Image({
                        userId,
                        location: geoLocation,
                        captureDateTime: parsedDate,
                        imageSizeInKB,
                        imageUrl,
                        fileHash,
                        status,
                    });

                    imageDoc = await newImage.save();
                }

                imageIds.push(imageDoc._id);
            }

            // Check if a shelf exists for this user with any of these images
            let shelf = await Shelf.findOne({ userId, imageUrls: { $in: imageIds } });

            if (!shelf) {
                // Create new Shelf
                const shelf = await Shelf.create({
                    userId,
                    imageUrls: imageIds,
                    metricSummary: {
                        OSA: "0.00",
                        SOS: "0.00",
                        PGC: "0.00"
                    }
                });

            } else {
                // Merge existing and new image IDs, avoiding duplicates
                const mergedImageIds = Array.from(new Set([...shelf.imageUrls.map(id => id.toString()), ...imageIds.map(id => id.toString())]));
                shelf.imageUrls = mergedImageIds;
                await shelf.save();
            }

            // Update each image with shelfId
            await Image.updateMany(
                { _id: { $in: imageIds } },
                { $set: { shelfId: shelf._id } }
            );

            return res.status(200).json({
                message: "Offline sync completed",
                status: "success",
                code: 200,
                data: {
                    shelfId: shelf._id,
                    images: imageIds,
                },
            });

        } catch (error) {
            console.error("Error from [syncOfflineUpload]:", error);
            return res.status(500).json({
                message: "Internal server error during offline sync.",
                status: "failed",
                code: 500,
                data: null,
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