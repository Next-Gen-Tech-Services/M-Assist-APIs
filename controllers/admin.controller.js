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
    async toggleUserStatus(req, res) {
        try {
            const result = await adminService.toggleUserStatusService(req, res);
            return result;
        } catch (error) {
            throw error;
        }
    }
    async deleteUser(req, res) {
        try {
            const result = await adminService.deleteUserService(req, res);
            return result;
        } catch (error) {
            throw error;
        }
    }
    async getAllImages(req, res) {
        try {
            const result = await adminService.getAllImagesService(req, res);
            return result;
        } catch (error) {
            throw error;
        }
    }
}

module.exports = new AdminController();
