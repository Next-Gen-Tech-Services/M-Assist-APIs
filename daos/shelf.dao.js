const Image = require("../models/image.model");
const getNextSequenceValue = require("../utils/helpers/counter.util");
const log = require("../configs/logger.config");
const { hashItem } = require("../utils/helpers/bcrypt.util");
const shelfModel = require("../models/shelf.model");


class ShelfDAO {
    async createShelf(shelfData) {
        try {
            const newShelf = await shelfModel.create(shelfData);
            return {
                status: "success",
                code: 201,
                data: newShelf,
            };
        } catch (error) {
            log.error("Error in [ShelfDAO.createShelf]:", error);
            return {
                status: "error",
                code: 500,
                message: "Failed to create shelf",
                data: null,
            };
        }
    }
    async getAllShelves(filter = {}) {
        try {
            const shelves = await shelfModel.find(filter)
                .populate("imageUrls")
                .lean();

            return {
                status: "success",
                code: 200,
                data: shelves,
            };
        } catch (error) {
            console.error("Error in ShelfDao.getAllShelves:", error);
            return {
                status: "failed",
                code: 500,
                data: null,
                error: error.message,
            };
        }
    }
}

module.exports = new ShelfDAO();
