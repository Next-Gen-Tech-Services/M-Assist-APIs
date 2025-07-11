const userDao = require("../daos/user.dao");
const { compareItems, hashItem } = require("../utils/helpers/bcrypt.util");
const log = require("../configs/logger.config");
const { createToken } = require("../utils/helpers/tokenHelper.util");
const { validateEmail } = require("../utils/helpers/validator.util");
const {
  removeNullUndefined,
  randomString,
} = require("../utils/helpers/common.util");
const { sendMail } = require("../utils/helpers/email.util");

class AuthService {
  async loginService(req, res) {
    try {
      const { mobileNumber, password } = req.body;

      if (!mobileNumber || !password) {
        log.error("Error from [User SERVICE]: Missing mobile number or password");
        return res.status(400).json({
          message: "Mobile number and password are required",
          status: "failed",
          code: 400,
          data: null,
        });
      }

      const user = await userDao.getUserByMobileNumber(mobileNumber);

      if (!user || !user.data) {
        return res.status(404).json({
          message: "Account does not exist",
          status: "not_found",
          code: 404,
          data: null,
        });
      }

      // Temporary password check (to be replaced with proper hash check later)
      if (user.data.password !== password) {
        log.error("Error from [Auth SERVICE]: Invalid password");
        return res.status(401).json({
          message: "Invalid password",
          status: "unauthorized",
          code: 401,
          data: null,
        });
      }

      // Successful login
      log.info("[Auth SERVICE]: User verified successfully");
      const token = createToken(user.data._id);
      return res.status(200).json({
        message: "User logged in successfully",
        status: "success",
        code: 200,
        data: {
          user: {
            profilePic: user.data.profilePic,
            fullName: user.data.fulleName,
            userId: user.data._id // I can take mobile number but CRUD operation regarding user will be slow because, by default indexing is created for _id field hence  if Sir guide I'll change
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
  // below I created for testing consistency 
  async signupService(req, res) {
    try {
      const { profilePic, fullName, email, mobileNumber, password } = req.body;

      // Basic validation
      if (!mobileNumber || !password) {
        log.error("[User SERVICE]: Missing required fields - mobileNumber or password");
        return res.status(400).json({
          message: "Mobile number and password are required",
          status: "failed",
          code: 400,
          data: null,
        });
      }

      // Check if user with the same mobile number already exists
      const existingUserByMobile = await userDao.getUserByMobileNumber(mobileNumber);
      if (existingUserByMobile?.data) {
        return res.status(409).json({
          message: "User with this mobile number already exists",
          status: "failed",
          code: 409,
          data: null,
        });
      }

      // Check if email already exists
      if (email) {
        const emailExists = await userDao.isEmailExists(email);
        if (emailExists?.data) {
          return res.status(409).json({
            message: "User with this email already exists",
            status: "failed",
            code: 409,
            data: null,
          });
        }
      }

      // Create and save the user
      const user = await userDao.createUser({
        profilePic,
        fullName,
        email,
        mobileNumber,
        password,
      });

      if (!user || !user.data) {
        return res.status(500).json({
          message: "User creation failed",
          status: "error",
          code: 500,
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
