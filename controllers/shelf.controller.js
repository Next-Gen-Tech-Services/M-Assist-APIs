const shelfService = require("../services/shelf.service");

class ShelfController {
    async getAllSheleves(req, res) {
        try {
            const result = await shelfService.getAllShelevesService(req, res);
            return result;
        } catch (error) {
            throw error;
        }
    }
    async deleteShelf(req, res) {
        try {
            const result = await shelfService.deleteShelfService(req, res);
            return result;
        } catch (error) {
            throw error;
        }
    }
}

module.exports = new ShelfController();
