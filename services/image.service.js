const imageDAO = require("../daos/image.dao");
const { compareItems, hashItem } = require("../utils/helpers/bcrypt.util");
const log = require("../configs/logger.config");
const { createToken } = require("../utils/helpers/tokenHelper.util");
const { validateEmail } = require("../utils/helpers/validator.util");
const { removeNullUndefined, randomString } = require("../utils/helpers/common.util");
const { sendMail } = require("../utils/helpers/email.util");
const { s3 } = require("../configs/aws.config");
const { IN_PROGRESS } = require("../utils/constants/status.constant");


class ImageService {
    async uploadService(req, res) {
        try {
            const userId = req.userId;

            if (!userId) {
                return res.status(401).json({
                    message: "Unauthorized To Upload: User ID missing in request.",
                    status: "failed",
                    data: null,
                    code: 401,
                });
            }

            const { location, captureDateTime } = req.body;
            const file = req.file;

            if (!location || !captureDateTime || !file) {
                return res.status(400).json({
                    message: "Missing required fields or image file.",
                    status: "failed",
                    data: null,
                    code: 400,
                });
            }

            const parsedDate = new Date(captureDateTime);
            if (isNaN(parsedDate)) {
                return res.status(400).json({
                    message: "Invalid captureDateTime format.",
                    status: "failed",
                    data: null,
                    code: 400,
                });
            }

            // Parse location
            const [lng, lat] = location.split(",").map(Number);
            if (isNaN(lng) || isNaN(lat)) {
                return res.status(400).json({
                    message: "Invalid location coordinates.",
                    status: "failed",
                    data: null,
                    code: 400,
                });
            }

            const geoLocation = {
                type: "Point",
                coordinates: [lng, lat],
            };

            // Prepare upload key (used for deletion too)
            const s3Key = `images/${Date.now()}_${file.originalname.replace(/\s+/g, "_")}`;

            // Upload to S3
            const s3UploadParams = {
                Bucket: process.env.AWS_BUCKET_NAME,
                Key: s3Key,
                Body: file.buffer,
                ContentType: file.mimetype,
                ACL: "public-read",
            };

            const s3UploadResult = await new Promise((resolve, reject) => {
                s3.upload(s3UploadParams, (err, data) => {
                    if (err) return reject(err);
                    resolve(data);
                });
            });

            const imageUrl = s3UploadResult.Location;

            // Try to save image doc
            try {
                const imageDoc = await imageDAO.uploadImageDetails({
                    location: geoLocation,
                    captureDateTime: parsedDate,
                    imageUrl,
                    userId,
                });

                return res.status(200).json({
                    message: "Image uploaded successfully",
                    data: imageDoc,
                    status: "success",
                    code: 200,
                });

            } catch (dbError) {
                log.error("Image Doc. creation failed at mongoDB");

                // Cleanup orphaned image on S3
                await s3.deleteObject({
                    Bucket: process.env.AWS_BUCKET_NAME,
                    Key: s3Key
                }).promise();

                return res.status(500).json({
                    message: "Image upload failed during DB save. Cleanup complete.",
                    status: "failed",
                    data: null,
                    code: 500,
                });
            }

        } catch (error) {
            log.error("Error from [Image Service]:", error);
            let errorMessage = "Server Error during image upload.";
            if (error.code === "NetworkingError" || error.statusCode === 403) {
                errorMessage = "S3 upload failed. Check AWS credentials or bucket permissions.";
            }
            return res.status(500).json({
                message: errorMessage,
                status: "failed",
                data: null,
                code: 500,
            });
        }
    }
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
}

module.exports = new ImageService();