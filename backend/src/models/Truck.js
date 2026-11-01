const mongoose = require("mongoose");

const truckSchema = new mongoose.Schema(
    {
        driverId: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "User",
            required: true
        },

        truckType: {
            type: String,
            required: true
        },

        capacity: {
            type: Number,
            required: true
        },

        currentLocation: {
            lat: {
                type: Number,
                required: true
            },
            lng: {
                type: Number,
                required: true
            },
            address: {
                type: String
            }
        },

        availableFrom: {
            type: Date,
            required: true
        },

        availableTo: {
            type: Date,
            required: true
        },

        status: {
            type: String,
            enum: ["AVAILABLE", "BUSY", "OFFLINE"],
            default: "AVAILABLE"
        }
    },
    {
        timestamps: true
    }
);

module.exports = mongoose.model("Truck", truckSchema);