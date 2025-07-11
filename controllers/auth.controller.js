const authService = require("../services/auth.service");

class AuthController {
  async signup(req, res) {
    try {
      const result = await authService.signupService(req, res);
      return result;
    } catch (error) {
      throw error;
    }
  }
  async login(req, res) {
    try {
      const result = await authService.loginService(req, res);
      return result;
    } catch (error) {
      throw error;
    }
  }
}

module.exports = new AuthController();
