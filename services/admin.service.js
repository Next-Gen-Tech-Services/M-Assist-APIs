const imageDAO = require("../daos/image.dao");
const userDao = require("../daos/user.dao");
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
const { ACTIVE, IN_ACTIVE } = require("../utils/constants/user.constant");
const imageDao = require("../daos/image.dao");
const userModel = require("../models/user.model");
const shelfModel = require("../models/shelf.model");

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
    async toggleUserStatusService(req, res) {
        try {
            console.log("/api/admin/user/toggle-status service invoked");
            const requesterId = req.userId;
            const targetUserId = req.params.userId;

            // Step 1: Verify admin
            const { isAdmin: isAdminUser, error: adminCheckError } = await adminDao.isAdmin(requesterId);
            if (adminCheckError || !isAdminUser) {
                return res.status(403).json({
                    message: "Access denied. Admins only.",
                    status: "fail",
                    code: 403,
                    data: null,
                });
            }

            // Step 2: Fetch target user
            const { data: user, status: userStatus } = await userDao.getUser(targetUserId);
            if (!user || userStatus === "fail") {
                return res.status(404).json({
                    message: "User not found",
                    status: "fail",
                    code: 404,
                    data: null,
                });
            }

            // Step 3: Toggle status
            const newStatus = user.status === ACTIVE ? IN_ACTIVE : ACTIVE;

            // Step 4: Update user status
            const { data: updatedUser, code, status } = await userDao.updateUserProfile(targetUserId, { status: newStatus });

            if (!updatedUser) {
                return res.status(500).json({
                    message: "Failed to update user status",
                    status: "error",
                    code: 500,
                    data: null,
                });
            }

            // Step 5: Respond with updated user
            return res.status(200).json({
                message: `User status updated to ${newStatus}`,
                status: "success",
                code: 200,
                data: {
                    user: {
                        status: newStatus
                    },
                }
            });

        } catch (error) {
            log.error("Error in [toggleUserStatusService]:", error);
            return res.status(500).json({
                message: "Internal Server Error",
                status: "error",
                code: 500,
                data: null,
            });
        }
    }
    async deleteUserService(req, res) {
        try {
            const userIdToDelete = req.params.userId;
            const requesterId = req.userId;

            // Prevent self-deletion
            if (userIdToDelete === requesterId) {
                return res.status(400).json({
                    message: "You cannot delete your own account.",
                    status: "fail",
                    code: 400,
                    data: null,
                });
            }

            // Step 1: Verify admin
            const { isAdmin: isAdminUser, error: adminCheckError } = await adminDao.isAdmin(requesterId);
            if (adminCheckError || !isAdminUser) {
                return res.status(403).json({
                    message: "Access denied. Admins only.",
                    status: "fail",
                    code: 403,
                    data: null,
                });
            }

            // Step 2: Ensure target user exists
            const { data: userToDelete } = await userDao.getUser(userIdToDelete);
            if (!userToDelete) {
                return res.status(404).json({
                    message: "User to delete not found.",
                    status: "fail",
                    code: 404,
                    data: null,
                });
            }

            // Step 3: Check for image references
            const hasLinkedImages = await imageDao.hasImagesByUserId(userIdToDelete);
            if (hasLinkedImages) {
                return res.status(409).json({
                    message: "This user cannot be deleted. Please remove their associated image submissions first.",
                    status: "fail",
                    code: 409,
                    data: null,
                });
            }

            // Step 4: Delete user
            const { code, status, message, data } = await userDao.deleteUserById(userIdToDelete);
            return res.status(code).json({ message, status, code, data });

        } catch (error) {
            log.error("Error from [ADMIN SERVICE - deleteUserService]:", error);
            return res.status(500).json({
                message: "Internal server error",
                status: "error",
                code: 500,
                data: null,
            });
        }
    }
    async getAllImagesService(req, res) {
        try {
            const images = await imageDao.getAllImagesWithShelfAndUser();

            const enrichedImages = images.map((img) => {
                const uploadedBy = img.userId?.fullName || "Unknown User";
                const coordinates = img.location?.coordinates || [];
                const storeName = coordinates.length === 2
                    ? `${coordinates[1]}, ${coordinates[0]}`
                    : "Unknown Location";

                const uploadedDate = img.captureDateTime || img.createdAt;

                const metrics = img.shelfId?.metricSummary || {};
                const OSA = metrics.OSA ? parseFloat(metrics.OSA) : 0.0;
                const SOS = metrics.SOS ? parseFloat(metrics.SOS) : 0.0;
                const PGC = metrics.PGC ? parseFloat(metrics.PGC) : 0.0;

                return {
                    shelfId: img.shelfId?._id || null,
                    imageUrl: img.imageUrl,
                    uploadedBy,
                    storeName,
                    uploadedDate,
                    OSA,
                    SOS,
                    PGC,
                };
            });

            return res.status(200).json({
                message: enrichedImages.length ? "Images retrieved successfully" : "No images found",
                status: "success",
                code: 200,
                data: enrichedImages,
            });
        } catch (error) {
            log.error("Error in [getAllImagesService]:", error);
            return res.status(500).json({
                message: "Something went wrong while fetching images",
                status: "error",
                code: 500,
                data: null,
            });
        }
    }
};

module.exports = new AdminService();