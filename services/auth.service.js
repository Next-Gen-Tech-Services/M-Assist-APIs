const userDao = require("../daos/user.dao");
const { compareItems, hashItem } = require("../utils/helpers/bcrypt.util");
const log = require("../configs/logger.config");
const { createToken } = require("../utils/helpers/tokenHelper.util");
const { validateEmail, validateIndianMobileNumber } = require("../utils/helpers/validator.util");
const {
  removeNullUndefined,
  randomString,
} = require("../utils/helpers/common.util");
const { sendMail } = require("../utils/helpers/email.util");
const { FIELD_AGENT } = require("../utils/constants/user.constant");

class AuthService {
  async loginService(req, res) {
    try {
      const { email, password } = req.body;

      const normalizedEmail = email?.toLowerCase().trim();

      if (!normalizedEmail || !password) {
        log.error("Error from [Auth SERVICE]: Missing email or password");
        return res.status(400).json({
          message: "Email and password are required",
          status: "failed",
          code: 400,
          data: null,
        });
      }

      if (!validateEmail(normalizedEmail)) {
        log.error("[Auth SERVICE]: Invalid email format");
        return res.status(400).json({
          message: "Invalid email format",
          status: "failed",
          code: 400,
          data: null,
        });
      }

      const userResponse = await userDao.getUserByEmail(normalizedEmail);

      if (!userResponse.data) {
        return res.status(userResponse.code || 404).json({
          message: userResponse.message || "Account does not exist",
          status: userResponse.status || "not_found",
          code: userResponse.code || 404,
          data: null,
        });
      }

      const user = userResponse.data;

      const isPasswordMatch = await compareItems(password, user.password);
      if (!isPasswordMatch) {
        log.error("Error from [Auth SERVICE]: Invalid password");
        return res.status(401).json({
          message: "Invalid password",
          status: "unauthorized",
          code: 401,
          data: null,
        });
      }

      log.info("[Auth SERVICE]: User verified successfully");
      const token = createToken(user._id);

      return res.status(200).json({
        message: "User logged in successfully",
        status: "success",
        code: 200,
        data: {
          user: {
            userId: user._id,
            profilePic: user.profilePic,
            fullName: user.fullName,
            email: user.email,
            role: user.role,
          },
          token,
        },
      });

    } catch (error) {
      log.error("Error from [Auth SERVICE]:", error);
      return res.status(500).json({
        message: "Internal server error",
        status: "error",
        code: 500,
        data: null,
      });
    }
  }

  async signupService(req, res) {
    try {
      const { fullName, email, mobileNumber, password, role } = req.body;

      // Normalize email
      const normalizedEmail = email?.toLowerCase().trim();

      if (!normalizedEmail || !password) {
        log.error("[User SERVICE]: Missing required fields - email or password");
        return res.status(400).json({
          message: "Email and password are required",
          status: "failed",
          code: 400,
          data: null,
        });
      }

      if (!validateEmail(normalizedEmail)) {
        log.error("[Auth SERVICE]: Invalid email format");
        return res.status(400).json({
          message: "Invalid email format",
          status: "failed",
          code: 400,
          data: null,
        });
      }

      const emailExists = await userDao.isEmailExists(normalizedEmail);
      if (emailExists?.data) {
        return res.status(409).json({
          message: "User with this email already exists",
          status: "failed",
          code: 409,
          data: null,
        });
      }

      if (mobileNumber) {
        if (!validateIndianMobileNumber(mobileNumber)) {
          log.error("[Auth SERVICE]: Invalid mobile number format");
          return res.status(400).json({
            message: "Invalid mobile number format",
            status: "failed",
            code: 400,
            data: null,
          });
        }

        const mobileExists = await userDao.getUserByMobileNumber(mobileNumber);
        if (mobileExists?.data) {
          return res.status(409).json({
            message: "User with this mobile number already exists",
            status: "failed",
            code: 409,
            data: null,
          });
        }
      }

      const hashedPassword = await hashItem(password);

      const user = await userDao.createUser({
        fullName,
        email: normalizedEmail,
        mobileNumber,
        password: hashedPassword,
        role: role || FIELD_AGENT
      });

      if (!user.data) {
        return res.status(user.code || 500).json({
          message: user.message || "User creation failed",
          status: user.status || "error",
          code: user.code || 500,
          data: null,
        });
      }

      log.info("[Auth SERVICE]: User created successfully");

      return res.status(201).json({
        message: "User created successfully",
        status: "success",
        code: 201,
        data: {
          user: {
            id: user.data._id,
            profilePic: user.data.profilePic,
            fullName: user.data.fullName,
            email: user.data.email,
            mobileNumber: user.data.mobileNumber,
            role: user.data.role,
          },
        },
      });

    } catch (error) {
      log.error("[Auth SERVICE]: Signup failed", error);
      return res.status(500).json({
        message: "Internal server error",
        status: "error",
        code: 500,
        data: null,
      });
    }
  }
};

module.exports = new AuthService();
