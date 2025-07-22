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

  async forgetPassword(req, res) {
    try {
      const result = await authService.forgetPasswordService(req, res);
      return result;
    } catch (error) {
      throw error;
    }
  }

  async resendEmail(req, res) {
    try {
      const result = await authService.resendEmailService(req, res);
      return result;
    } catch (error) {
      throw error;
    }
  }

  async resetPassword(req, res) {
    try {
      const result = await authService.resetPasswordService(req, res);
      return result;
    } catch (error) {
      throw error;
    }
  }
}

module.exports = new AuthController();
