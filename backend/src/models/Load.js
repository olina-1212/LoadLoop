const mongoose = require("mongoose");

const loadSchema = new mongoose.Schema(
    {
        shipperId: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "User",
            required: true
        },

        pickupLocation: {
            lat: {
                type: Number,
                required: true
            },
            lng: {
                type: Number,
                required: true
            },
            address: {
                type: String,
                required: true
            }
        },

        dropLocation: {
            lat: {
                type: Number,
                required: true
            },
            lng: {
                type: Number,
                required: true
            },
            address: {
                type: String,
                required: true
            }
        },

        weight: {
            type: Number,
            required: true
        },

        cargoType: {
            type: String,
            required: true
        },

        requiredTruckType: {
            type: String,
            required: true
        },

        pickupFrom: {
            type: Date,
            required: true
        },

        pickupTo: {
            type: Date,
            required: true
        },

        minRate: {
            type: Number,
            required: true
        },

        maxRate: {
            type: Number,
            required: true
        },

        status: {
  type: String,
  enum: [
    "OPEN",
    "BOOKED",
    "IN_TRANSIT",
    "COMPLETED",
    "CANCELLED"
  ],
  default: "OPEN"
}
    },
    {
        timestamps: true
    }
);

module.exports = mongoose.model("Load", loadSchema);