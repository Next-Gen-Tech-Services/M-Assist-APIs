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
const ShelfDao = require("../daos/shelf.dao");
const shelfDao = require("../daos/shelf.dao");



class ShelfService {
    async getAllShelevesService(req, res) {
        try {
            // Step 1: Fetch shelves from DAO
            const { data: shelves, error } = await shelfDao.getAllShelves();

            if (error) {
                return res.status(500).json({
                    message: "Failed to fetch shelves",
                    status: "fail",
                    error,
                });
            }

            // Step 2: Format metrics to "97.00" style strings
            const formattedShelves = shelves.map((shelf) => ({
                ...shelf,
                metricSummary: {
                    OSA: shelf.metricSummary?.OSA ? Number(shelf.metricSummary.OSA.toString()).toFixed(2) : "0.00",
                    SOS: shelf.metricSummary?.SOS ? Number(shelf.metricSummary.SOS.toString()).toFixed(2) : "0.00",
                    PGC: shelf.metricSummary?.PGC ? Number(shelf.metricSummary.PGC.toString()).toFixed(2) : "0.00",
                },
            }));

            // Step 3: Return formatted shelves
            return res.status(200).json({
                message: "Shelves fetched successfully",
                status: "success",
                code: 200,
                data: formattedShelves,
            });
        } catch (error) {
            console.error("Error in getAllShelvesService:", error);
            return res.status(500).json({
                message: "Internal server error",
                status: "fail",
                error: error.message,
            });
        }
    }

    async deleteShelfService(req, res) {
        try {
            const { shelfId } = req.params;
            const userId = req.userId;

            if (!shelfId) {
                return res.status(400).json({
                    message: "Shelf ID is required",
                    status: "failed",
                    code: 400,
                });
            }

            // Fetch shelf and validate ownership
            const shelf = await Shelf.findOne({ _id: shelfId, userId }).populate("imageUrls");
            if (!shelf) {
                return res.status(404).json({
                    message: "Shelf not found or unauthorized access",
                    status: "failed",
                    code: 404,
                });
            }

            const images = shelf.imageUrls;

            // Delete each image from S3
            for (const image of images) {
                if (image.imageUrl) {
                    const s3Key = image.imageUrl.split(".com/")[1];
                    if (s3Key) {
                        try {
                            await s3
                                .deleteObject({
                                    Bucket: process.env.AWS_BUCKET_NAME,
                                    Key: s3Key,
                                })
                                .promise();
                        } catch (err) {
                            console.error(`Failed to delete image from S3: ${s3Key}`, err);
                        }
                    }
                }
            }

            // Delete image documents
            const imageIds = images.map((img) => img._id);
            await Image.deleteMany({ _id: { $in: imageIds } });

            // Delete the shelf
            await Shelf.deleteOne({ _id: shelfId });

            return res.status(200).json({
                message: "Shelf and associated images deleted successfully",
                status: "success",
                code: 200,
                data: {
                    shelfId,
                    deletedImages: imageIds,
                },
            });
        } catch (error) {
            console.error("Error in deleteShelfService:", error);
            return res.status(500).json({
                message: "Internal Server Error",
                status: "failed",
                code: 500,
            });
        }
    }
}

module.exports = new ShelfService();