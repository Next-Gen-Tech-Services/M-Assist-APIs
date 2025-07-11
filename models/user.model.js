const mongoose = require("mongoose");

const userSchema = mongoose.Schema({
  profilePic: {
    type: String,
    required: false
  },
  fullName: {
    type: String,
    trim: true,
    required: false
  },
  mobileNumber: {
    type: String,
    required: true
  },
  email: {
    type: String,
    required: false,
    unique: true,
  },
  password: {
    type: String,
    required: false,
  },
},
  { timestamps: true }
);

module.exports = mongoose.model("User", userSchema);
