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
            type: mongoose.Schema.Types.Decimal128,
            min: 0,
            max: 1,
            default: 0.0,
            required: true
        },
        SOS: {
            type: mongoose.Schema.Types.Decimal128,
            min: 0,
            max: 1,
            default: 0.0,
            required: true
        },
        PGC: {
            type: mongoose.Schema.Types.Decimal128,
            min: 0,
            max: 1,
            default: 0.0,
            required: true
        }
    }
}, {
    timestamps: true
});

module.exports = mongoose.model("Shelf", shelfSchema);
