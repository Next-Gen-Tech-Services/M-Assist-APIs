const User = require("../models/user.model");
const getNextSequenceValue = require("../utils/helpers/counter.util");
const log = require("../configs/logger.config");
const { hashItem } = require("../utils/helpers/bcrypt.util");
class UserDao {
  async createUser(data) {
    try {
      let user = new User(data);
      user = await user.save();
      return user;
    } catch (error) {
      log.error("Error from [USER DAO]: ", error);
      return {
        message: "Internal server error",
        status: "error",
        data: null,
        code: 500, // Internal Server Error
      };
    }
  }
  async getUserByMobileNumber(mobileNumber) {
    try {
      const userExist = await User.findOne({ mobileNumber });

      if (userExist) {
        return {
          message: "User found successfully",
          status: "success",
          data: userExist,
          code: 200, // OK
        };
      } else {
        return {
          message: "User not found",
          status: "fail",
          data: null,
          code: 404, // Not Found
        };
      }
    } catch (error) {
      log.error("Error from [USER DAO]: ", error);
      return {
        message: "Internal server error",
        status: "error",
        data: null,
        code: 500, // Internal Server Error
      };
    }
  }

  async getUser(id) {
    try {
      const userExist = await User.findById(id);

      if (userExist) {
        return {
          message: "User found successfully",
          status: "success",
          data: userExist,
          code: 200, // OK
        };
      } else {
        return {
          message: "User not found",
          status: "fail",
          data: null,
          code: 404, // Not Found
        };
      }
    } catch (error) {
      log.error("Error from [USER DAO]: ", error);
      return {
        message: "Internal server error",
        status: "error",
        data: null,
        code: 500, // Internal Server Error
      };
    }
  }
  async updateUserProfile(userId, updateFields) {
    try {
      const updatedUser = await User.findByIdAndUpdate(
        userId,
        { $set: updateFields },
        { new: true }
      );
      return updatedUser;
    } catch (error) {
      log.error("Error from [UserDAO - updateUserProfile]:", error);
      throw error;
    }
  }
  async isEmailExists(email, userId = null) {
    try {
      const query = { email };
      if (userId) {
        query._id = { $ne: userId }; // Exclude current user if ID is given
      }

      const user = await User.findOne(query);
      return !!user;
    } catch (error) {
      log.error("Error in [isEmailExists]:", error);
      throw error;
    }
  }
}

module.exports = new UserDao();
