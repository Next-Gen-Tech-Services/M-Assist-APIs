const mongoose = require("mongoose");
const { IN_PROGRESS, PROCESSED } = require("../utils/constants/status.constant");

const imageSchema = mongoose.Schema(
    {
        name: {
            type: String,
        },
        location: {
            type: {
                type: String,
                enum: ['Point'],
                required: true,
                default: 'Point'
            },
            coordinates: {
                type: [Number], // [longitude, latitude]
                required: true
            }
        },
        captureDateTime: {
            type: Date,
            required: true
        },
        status: {
            type: String,
            enum: [IN_PROGRESS, PROCESSED],
            default: IN_PROGRESS
        },
        metricSummary: {
            OSA: {
                type: Number,
                min: 0,
                max: 100,
                default: 0,
                required: true
            },
            Sos: {
                type: Number,
                min: 0,
                max: 100,
                default: 0,
                required: true
            },
            PGC: {
                type: Number,
                min: 0,
                max: 100,
                default: 0,
                required: true
            }
        },
        imageUrl: {
            type: String,
            required: true
        },
        belongsTo: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'User'
        }
    },
    { timestamps: true }
);

// This following line will create index, So that if we give feature of find nearby stores around 2km then it will quickly fetch the data from mongoDB.
// Add geospatial index
imageSchema.index({ location: '2dsphere' });

module.exports = mongoose.model("Image", imageSchema);
