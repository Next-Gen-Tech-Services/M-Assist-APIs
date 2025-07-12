const mongoose = require("mongoose");

const shelfSchema = mongoose.Schema({
    userId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "User",
        required: true
    },
    imageUrls: [{
        type: mongoose.Schema.Types.ObjectId,
        ref: "Image",
        required: true
    }],
    metricSummary: {
        OSA: {
            type: Number,
            min: 0,
            max: 100,
            default: 0,
            required: true
        },
        SOS: {
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
    }
}, {
    timestamps: true
});

module.exports = mongoose.model("Shelf", shelfSchema);
