const User = require("../models/user.model");
const getNextSequenceValue = require("../utils/helpers/counter.util");
const log = require("../configs/logger.config");
const { hashItem } = require("../utils/helpers/bcrypt.util");
class UserDao {
  async createUser(data) {
    try {
      let user = new User(data);
      user = await user.save();

      return {
        message: "User created successfully",
        status: "success",
        data: user,
        code: 201, // Created
      };
    } catch (error) {
      log.error("Error from [USER DAO - createUser]:", error);
      return {
        message: "Internal server error",
        status: "error",
        data: null,
        code: 500,
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
          code: 200,
        };
      } else {
        return {
          message: "User not found",
          status: "fail",
          data: null,
          code: 404,
        };
      }
    } catch (error) {
      log.error("Error from [USER DAO - getUserByMobileNumber]:", error);
      return {
        message: "Internal server error",
        status: "error",
        data: null,
        code: 500,
      };
    }
  }

  async getUserByEmail(email) {
    try {
      const user = await User.findOne({ email });

      if (user) {
        return {
          message: "User found successfully",
          status: "success",
          data: user,
          code: 200,
        };
      } else {
        return {
          message: "User not found",
          status: "fail",
          data: null,
          code: 404,
        };
      }
    } catch (error) {
      log.error("Error from [USER DAO - getUserByEmail]:", error);
      return {
        message: "Internal server error",
        status: "error",
        data: null,
        code: 500,
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
          code: 200,
        };
      } else {
        return {
          message: "User not found",
          status: "fail",
          data: null,
          code: 404,
        };
      }
    } catch (error) {
      log.error("Error from [USER DAO - getUser]:", error);
      return {
        message: "Internal server error",
        status: "error",
        data: null,
        code: 500,
      };
    }
  }

  async isEmailExists(email, userId = null) {
    try {
      const query = { email };
      if (userId) {
        query._id = { $ne: userId };
      }

      const user = await User.findOne(query);

      return {
        message: "Email existence check completed",
        status: "success",
        data: !!user, // true or false
        code: 200,
      };
    } catch (error) {
      log.error("Error from [USER DAO - isEmailExists]:", error);
      return {
        message: "Internal server error",
        status: "error",
        data: null,
        code: 500,
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

      if (!updatedUser) {
        return {
          message: "User not found or update failed",
          status: "fail",
          code: 404,
          data: null,
        };
      }

      return {
        message: "User updated successfully",
        status: "success",
        code: 200,
        data: updatedUser,
      };
    } catch (error) {
      log.error("Error from [USER DAO - updateUserProfile]:", error);
      return {
        message: "Internal server error",
        status: "error",
        code: 500,
        data: null,
      };
    }
  }

  async updateUserByEmail(email, updateData) {
    try {
      const result = await User.findOneAndUpdate(
        { email: email.toLowerCase().trim() },
        { $set: updateData },
        { new: true }
      );

      if (!result) {
        log.error("Error from [USER DAO]: No user found to update with email:", email);
        return { status: "fail", code: 404, data: null };
      }

      console.log("After inserting token: ");
      console.log(result);

      log.info("User updated successfully by email:", email);
      return { status: "success", code: 200, data: result };
    } catch (error) {
      log.error("Error from [USER DAO]: updateUserByEmail", error);
      return { status: "error", code: 500, data: null };
    }
  }

  async updateUser(data) {
    try {
      if (data?.password) {
        data.password = await hashItem(data.password);
      }
      let result;
      result = await User.findOneAndUpdate({ email: data.email }, data, {
        new: true,
      });

      log.info("User saved");
      if (!result) {
        log.error("Error from [USER DAO]: User updation error");
        return {
          message: "Something went wrong",
          data: null,
          status: "fail",
          code: 201,
        };
      } else {
        return {
          message: "User updated successfully",
          data: result,
          status: "success",
          code: 200,
        };
      }
    } catch (error) {
      log.error("Error from [USER DAO]: ", error);
      throw error;
    }
  }

  async getUserByResetToken(resetToken) {
    try {
      const userExist = await User.findOne({
        resetToken,
      });
      if (userExist != null) {
        return {
          message: "Successfully",
          status: "success",
          data: userExist,
          code: 200,
        };
      } else {
        return {
          message: "User not found",
          status: "failed",
          data: null,
          code: 201,
        };
      }
    } catch (error) {
      log.error("Error from [USER DAO]: ", error);
      throw error;
    }
  }

}

module.exports = new UserDao();
