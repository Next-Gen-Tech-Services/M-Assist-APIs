const mongoose = require("mongoose");

const counterSchema = new mongoose.Schema(
  {
    _id: { type: String, required: true },
    seq: { type: Number, default: 1000 },
  },
  { timestamps: true }
);
module.exports.counter = mongoose.model("Counter", counterSchema);