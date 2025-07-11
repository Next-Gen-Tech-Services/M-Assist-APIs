const userService = require("../services/user.service");

class UserController {
    async getAllDetails(req, res) {
        try {
            const result = await userService.getAllDetailsService(req, res);
            return result;
        } catch (error) {
            throw error;
        }
    }
    async updateUser(req, res) {
        try {
            const result = await userService.updateUserService(req, res);
            return result;
        } catch (error) {
            throw error;
        }
    }
}

module.exports = new UserController();