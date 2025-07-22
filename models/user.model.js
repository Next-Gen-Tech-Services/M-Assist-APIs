const mongoose = require("mongoose");
const { FIELD_AGENT, ADMIN } = require("../utils/constants/user.constant");

const userSchema = mongoose.Schema(
  {
    profilePic: {
      type: String,
      required: false,
      default: ""
    },
    fullName: {
      type: String,
      trim: true,
      required: false,
    },
    mobileNumber: {
      type: String,
      required: true,
    },
    email: {
      type: String,
      required: true,
      unique: true,
    },
    password: {
      type: String,
      required: true,
    },
    role: {
      type: String,
      enum: [FIELD_AGENT, ADMIN],
      default: FIELD_AGENT,
    },
    resetToken: {
      type: String,
      required: false,
    },
  },
  { timestamps: true } // adds createdAt and updatedAt automatically
);

module.exports = mongoose.model("User", userSchema);
