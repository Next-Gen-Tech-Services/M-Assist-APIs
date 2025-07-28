const adminService = require("../services/admin.service.js");

class AdminController {
    async dashboard(req, res) {
        try {
            const result = await adminService.dashboardService(req, res);
            return result;
        } catch (error) {
            throw error;
        }
    }
    async getAllSheleves(req, res) {
        try {
            const result = await adminService.getAllShelevesService(req, res);
            return result;
        } catch (error) {
            throw error;
        }
    }
    async getAllUsers(req, res) {
        try {
            const result = await adminService.getAllUsersService(req, res);
            return result;
        } catch (error) {
            throw error;
        }
    }
}

module.exports = new AdminController();
