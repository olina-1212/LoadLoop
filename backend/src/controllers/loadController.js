
const mongoose = require("mongoose");
const Load = require("../models/Load");
const Truck = require("../models/Truck");
const Bid = require("../models/Bid");

// ==========================================
// CREATE LOAD - Existing functionality
// ==========================================

const createLoad = async (req, res) => {
    try {
        const {
            pickupLocation,
            dropLocation,
            weight,
            cargoType,
            requiredTruckType,
            pickupFrom,
            pickupTo,
            minRate,
            maxRate
        } = req.body;

        const load = await Load.create({
            shipperId: req.user.id,
            pickupLocation,
            dropLocation,
            weight,
            cargoType,
            requiredTruckType,
            pickupFrom,
            pickupTo,
            minRate,
            maxRate
        });

        res.status(201).json({
            message: "Load posted successfully",
            load
        });

    } catch (error) {
        res.status(500).json({
            message: "Failed to create load",
            error: error.message
        });
    }
};

// ==========================================
// GET MY LOADS - Existing functionality
// ==========================================

const getMyLoads = async (req, res) => {
    try {
        const loads = await Load.find({
            shipperId: req.user.id
        }).sort({ createdAt: -1 });

        res.json({
            loads
        });

    } catch (error) {
        res.status(500).json({
            message: "Failed to fetch loads",
            error: error.message
        });
    }
};

// ==========================================
// CANCEL LOAD - New functionality
// ==========================================

const cancelLoad = async (req, res) => {
    if (req.user.role !== "SHIPPER") {
        return res.status(403).json({
            message: "Only shippers can cancel loads"
        });
    }

    const { loadId } = req.params;

    if (!mongoose.isValidObjectId(loadId)) {
        return res.status(400).json({
            message: "Invalid load ID"
        });
    }

    try {
        const load = await Load.findById(loadId);

        if (!load) {
            return res.status(404).json({
                message: "Load not found"
            });
        }

        if (load.shipperId.toString() !== req.user.id.toString()) {
            return res.status(403).json({
                message: "You cannot cancel another shipper's load"
            });
        }

        if (!["OPEN", "BOOKED"].includes(load.status)) {
            return res.status(409).json({
                message: "Only OPEN or BOOKED loads can be cancelled"
            });
        }

        const session = await mongoose.startSession();

        try {
            await session.withTransaction(async () => {
                const updatedLoad = await Load.findOneAndUpdate(
                    {
                        _id: loadId,
                        status: load.status
                    },
                    {
                        $set: { status: "CANCELLED" }
                    },
                    {
                        new: true,
                        session
                    }
                );

                if (!updatedLoad) {
                    throw new Error(
                        "Load status changed during cancellation"
                    );
                }

                if (load.status === "BOOKED") {
                    const acceptedBid = await Bid.findOne({
                        loadId: loadId,
                        status: "ACCEPTED"
                    }).session(session);

                    if (!acceptedBid) {
                        throw new Error(
                            "Accepted bid not found for booked load"
                        );
                    }

                    const releasedTruck = await Truck.findOneAndUpdate(
                        {
                            _id: acceptedBid.truckId,
                            status: "BUSY"
                        },
                        {
                            $set: { status: "AVAILABLE" }
                        },
                        {
                            new: true,
                            session
                        }
                    );

                    if (!releasedTruck) {
                        throw new Error(
                            "Assigned truck could not be released"
                        );
                    }
                }

                await Bid.updateMany(
                    {
                        loadId: loadId,
                        status: {
                            $in: ["PENDING", "ACCEPTED"]
                        }
                    },
                    {
                        $set: { status: "CANCELLED" }
                    },
                    {
                        session
                    }
                );
            });

        } finally {
            await session.endSession();
        }

        return res.status(200).json({
            message: "Load cancelled successfully",
            loadId: loadId,
            status: "CANCELLED"
        });

    } catch (error) {
        console.error("Cancel load error:", error);

        return res.status(500).json({
            message: "Failed to cancel load",
            error: error.message
        });
    }
};

// ==========================================
// EXPORT CONTROLLERS
// ==========================================

module.exports = {
    createLoad,
    getMyLoads,
    cancelLoad
};
