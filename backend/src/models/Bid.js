
const mongoose = require("mongoose");

const bidSchema = new mongoose.Schema(
    {
        loadId: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "Load",
            required: true
        },

        driverId: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "User",
            required: true
        },

        truckId: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "Truck",
            required: true
        },

        amount: {
            type: Number,
            required: true,
            min: 1
        },

        status: {
            type: String,
            enum: ["PENDING", "ACCEPTED", "REJECTED", "CANCELLED"],
            default: "PENDING"
        }
    },
    {
        timestamps: true
    }
);

// Prevent the same truck from bidding twice on the same load
bidSchema.index(
    { loadId: 1, truckId: 1 },
    { unique: true }
);

module.exports = mongoose.model("Bid", bidSchema);
