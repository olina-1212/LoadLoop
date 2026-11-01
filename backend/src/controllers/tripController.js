
const mongoose = require("mongoose");
const Load = require("../models/Load");
const Truck = require("../models/Truck");
const Bid = require("../models/Bid");

// DRIVER STARTS TRIP
const startTrip = async (req, res) => {
  try {
    if (req.user.role !== "DRIVER") {
      return res.status(403).json({
        message: "Only drivers can start trips"
      });
    }

    const { loadId } = req.params;

    if (!mongoose.isValidObjectId(loadId)) {
      return res.status(400).json({
        message: "Invalid load ID"
      });
    }

    const bid = await Bid.findOne({
      loadId,
      driverId: req.user.id,
      status: "ACCEPTED"
    });

    if (!bid) {
      return res.status(403).json({
        message: "No accepted bid found for this driver"
      });
    }

    const load = await Load.findOneAndUpdate(
      { _id: loadId, status: "BOOKED" },
      { $set: { status: "IN_TRANSIT" } },
      { new: true }
    );

    if (!load) {
      return res.status(409).json({
        message: "Load is not in BOOKED status"
      });
    }

    return res.status(200).json({
      message: "Trip started successfully",
      load
    });

  } catch (error) {
    return res.status(500).json({
      message: "Failed to start trip",
      error: error.message
    });
  }
};

// DRIVER COMPLETES TRIP
const completeTrip = async (req, res) => {
  try {
    if (req.user.role !== "DRIVER") {
      return res.status(403).json({
        message: "Only drivers can complete trips"
      });
    }

    const { loadId } = req.params;

    if (!mongoose.isValidObjectId(loadId)) {
      return res.status(400).json({
        message: "Invalid load ID"
      });
    }

    const bid = await Bid.findOne({
      loadId,
      driverId: req.user.id,
      status: "ACCEPTED"
    });

    if (!bid) {
      return res.status(403).json({
        message: "No accepted bid found for this driver"
      });
    }

    const load = await Load.findById(loadId);

    if (!load || load.status !== "IN_TRANSIT") {
      return res.status(409).json({
        message: "Trip must be IN_TRANSIT before completion"
      });
    }

    const truck = await Truck.findOne({
      _id: bid.truckId,
      driverId: req.user.id,
      status: "BUSY"
    });

    if (!truck) {
      return res.status(409).json({
        message: "Assigned truck is not BUSY"
      });
    }

    // Both updates must succeed together.
    const session = await mongoose.startSession();
    let completedLoad;

    try {
      await session.withTransaction(async () => {
        completedLoad = await Load.findOneAndUpdate(
          { _id: loadId, status: "IN_TRANSIT" },
          { $set: { status: "COMPLETED" } },
          { new: true, session }
        );

        if (!completedLoad) {
          throw new Error("Trip status changed during completion");
        }

        const updatedTruck = await Truck.findOneAndUpdate(
          { _id: bid.truckId, status: "BUSY" },
          {
            $set: {
              status: "AVAILABLE",
              currentLocation: load.dropLocation,
              availableFrom: new Date()
            }
          },
          { new: true, session }
        );

        if (!updatedTruck) {
          throw new Error("Truck could not be released");
        }
      });
    } finally {
      await session.endSession();
    }

    return res.status(200).json({
      message: "Trip completed successfully",
      load: completedLoad
    });

  } catch (error) {
    return res.status(500).json({
      message: "Failed to complete trip",
      error: error.message
    });
  }
};

module.exports = {
  startTrip,
  completeTrip
};
