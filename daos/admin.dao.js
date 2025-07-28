const User = require("../models/user.model");
const Image = require("../models/image.model");

class AdminDAO {
    async isAdmin(userId) {
        try {
            const user = await User.findById(userId);
            if (user && user.role === "ADMIN") {
                return { isAdmin: true };
            }
            return { isAdmin: false };
        } catch (error) {
            log.error("Error in [AdminDao.isAdmin]:", error);
            return { isAdmin: false, error };
        }
    }
    async getImagesByIds(imageIds) {
        try {
            if (!imageIds || imageIds.length === 0) {
                return { status: "success", data: [] };
            }

            const images = await Image.find({ _id: { $in: imageIds } }).lean();

            return {
                status: "success",
                data: images
            };
        } catch (error) {
            log.error("[ADMIN DAO] Error in getImagesByIds:", error);
            return {
                status: "error",
                message: "Failed to fetch images",
                data: []
            };
        }
    }
    async getUserById(userId) {
        try {
            const user = await User.findById(userId);
            return { data: user, error: null };
        } catch (error) {
            log.error("[AdminDao] Error in getUserById:", error);
            return { data: null, error };
        }

    }
    async getAllUsers() {
        try {
            const users = await User.find().lean();
            return { data: users, error: null };
        } catch (error) {
            log.error("[AdminDao] Error in getAllUsers:", error);
            return { data: null, error };
        }
    }

}

module.exports = new AdminDAO();