const mongoose = require("mongoose");
const { UPLOADED, PENDING, FAILED } = require("../utils/constants/status.constant");

const imageSchema = mongoose.Schema(
    {
        userId: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "User"
        },
        shelfId: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "Shelf"
        },
        captureDateTime: {
            type: Date,
            required: true
        },
        imageSizeInKB: {
            type: Number
        },
        location: {
            type: {
                type: String,
                enum: ["Point"],
                required: true,
                default: "Point"
            },
            coordinates: {
                type: [Number], // [longitude, latitude]
                required: true
            }
        },
        status: {
            type: String,
            enum: [UPLOADED, PENDING, FAILED],
            default: PENDING
        },
        imageUrl: {
            type: String,
            required: true
        },
        fileHash: {
            type: String,
            required: false,
            index: true
        }
    },
    { timestamps: true }
);

// Add geospatial index for location-based queries
imageSchema.index({ location: "2dsphere" });

module.exports = mongoose.model("Image", imageSchema);
