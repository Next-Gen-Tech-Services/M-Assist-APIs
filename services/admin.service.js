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
const adminDao = require("../daos/admin.dao");

class AdminService {
    async dashboardService(req, res) {
        try {
            const mongooseId = req.userId;
            // const stats = await adminDao.fetchDashboardStats(adminId);
            // return stats;
            return null;
        } catch (error) {
            console.error("Dashboard Service Error:", error);
            throw error;
        }
    }
    async getAllShelevesService(req, res) {
        try {
            const userId = req.userId;

            // Step 1: Admin access check
            const { isAdmin, error } = await adminDao.isAdmin(userId);
            if (error || !isAdmin) {
                log.error("[Admin Service] Unauthorized access attempt by user:", userId);
                return res.status(403).json({
                    message: "Only admins can access shelf data",
                    status: "fail",
                    code: 403,
                    data: null
                });
            }

            // Step 2: Fetch all shelves
            const shelves = await Shelf.find({}).lean();

            // Step 3: Collect only the first imageId from each shelf
            const firstImageIds = shelves
                .map(shelf => shelf.imageUrls?.[0])
                .filter(Boolean); // Remove null/undefined

            // Step 4: Get image documents
            const { data: imageDocs } = await adminDao.getImagesByIds(firstImageIds);

            // Step 5: Map imageId to image document
            const imageMap = {};
            imageDocs.forEach(img => {
                imageMap[img._id.toString()] = img;
            });

            // Step 6: Format response
            const responseData = shelves.map((shelf) => {
                const {
                    metricSummary: { OSA = 0, SOS = 0, PGC = 0 },
                    imageUrls = []
                } = shelf;

                const imageCount = imageUrls.length;
                const firstImageId = imageUrls[0]?.toString();
                const firstImage = imageMap[firstImageId];

                let storename = { lat: null, long: null };
                let city = { lat: null, long: null };

                if (firstImage?.location?.coordinates?.length === 2) {
                    const [lng, lat] = firstImage.location.coordinates;

                    storename = {
                        lat: parseFloat(lat.toFixed(4)),
                        long: parseFloat(lng.toFixed(4))
                    };

                    city = {
                        lat: parseFloat(lat.toFixed(4)),
                        long: parseFloat(lng.toFixed(4))
                    };
                }

                return {
                    storename,
                    city,
                    OSA: parseFloat(OSA).toFixed(2),
                    SOS: parseFloat(SOS).toFixed(2),
                    PGC: parseFloat(PGC).toFixed(2),
                    imageCount
                };
            });

            // Final response
            return res.status(200).json({
                message: "All shelves fetched successfully",
                status: "success",
                code: 200,
                data: responseData
            });

        } catch (error) {
            log.error("Error from [AdminService.getAllShelevesService]:", error);
            return res.status(500).json({
                message: "Internal Server Error",
                status: "fail",
                code: 500,
                data: null
            });
        }
    }
    async getAllUsersService(req, res) {
        try {
            const userId = req.userId;

            // Step 1: Verify admin using isAdmin()
            const { isAdmin: isAdminUser, error: adminCheckError } = await adminDao.isAdmin(userId);
            if (adminCheckError || !isAdminUser) {
                return res.status(403).json({
                    message: "Access denied. Admins only.",
                    status: "fail",
                    code: 403,
                    data: null,
                });
            }

            // Step 2: Fetch all users
            const { data: users, error } = await adminDao.getAllUsers();
            if (error) {
                return res.status(500).json({
                    message: "Failed to fetch users",
                    status: "error",
                    code: 500,
                    data: null,
                });
            }

            // Step 3: Format result with userId
            const formatted = users.map(({ _id, fullName, email, role, status, createdAt }) => ({
                userId: _id,
                fullName,
                email,
                role,
                status,
                createdOn: createdAt,
            }));

            return res.status(200).json({
                message: "Users fetched successfully",
                status: "success",
                code: 200,
                data: formatted,
            });
        } catch (error) {
            log.error("[AdminService.getAllUsersService]:", error);
            return res.status(500).json({
                message: "Internal server error",
                status: "error",
                code: 500,
                data: null,
            });
        }
    }
};

module.exports = new AdminService();