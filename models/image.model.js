const mongoose = require("mongoose");
const { IN_PROGRESS, PROCESSED } = require("../utils/constants/status.constant");

const imageSchema = mongoose.Schema(
    {
        name: {
            type: String,
        },
        location: {
            type: String,
            required: true,
        },
        captureDateTime: {
            type: Date, // Proper Date object for sorting
            required: true,
        },
        status: {
            type: String,
            enum: [IN_PROGRESS, IN_PROGRESS],
            default: IN_PROGRESS
        },
        metricSummary: {
            OSA: {
                type: Number,
                min: 0,
                max: 100,
                required: true,
                default: 0
            },
            Sos: {
                type: Number,
                min: 0,
                max: 100,
                required: true,
                default: 0
            },
            PGC: {
                type: Number,
                min: 0,
                max: 100,
                required: true,
                default: 0
            },
        },
        imageUrl: {
            type: String,
            required: true,
        },
        belongsTo: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'User',
        },
    },
    { timestamps: true }
);

module.exports = mongoose.model("Image", imageSchema);
