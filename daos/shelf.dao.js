const Image = require("../models/image.model");
const getNextSequenceValue = require("../utils/helpers/counter.util");
const log = require("../configs/logger.config");
const { hashItem } = require("../utils/helpers/bcrypt.util");
const shelfModel = require("../models/shelf.model");


class ShelfDAO {
    async getAllShelves(filter = {}) {
        try {
            const shelves = await shelfModel.find(filter)
                .populate("imageUrls") // Populate image documents
                .lean().select(" imgUrls");

            return {
                status: "success",
                code: 200,
                data: shelves
            };
        } catch (error) {
            console.error("Error in ShelfDao.getAllShelves:", error);
            return {
                status: "failed",
                code: 500,
                data: null,
                error: error.message
            };
        }
    }
}

module.exports = new ShelfDAO();
