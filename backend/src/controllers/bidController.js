
const mongoose = require("mongoose");

const Bid = require("../models/Bid");
const Load = require("../models/Load");
const Truck = require("../models/Truck");

// 1. DRIVER: Submit a bid for a load
const createBid = async (req, res) => {
    try {
        if (req.user.role !== "DRIVER") {
            return res.status(403).json({
                message: "Only drivers can submit bids"
            });
        }

        const { loadId, truckId, amount } = req.body;

        // Validate IDs
        if (
            !mongoose.isValidObjectId(loadId) ||
            !mongoose.isValidObjectId(truckId)
        ) {
            return res.status(400).json({
                message: "Invalid load or truck ID"
            });
        }

        // Validate bid amount
        if (
            typeof amount !== "number" ||
            !Number.isFinite(amount) ||
            amount <= 0
        ) {
            return res.status(400).json({
                message: "Amount must be a positive number"
            });
        }

        // Check whether load exists and is open
        const load = await Load.findById(loadId);

        if (!load || load.status !== "OPEN") {
            return res.status(400).json({
                message: "Load is not available for bidding"
            });
        }

        // Check whether truck exists
        const truck = await Truck.findById(truckId);

        if (!truck) {
            return res.status(404).json({
                message: "Truck not found"
            });
        }

        // Verify truck ownership
        if (String(truck.driverId) !== String(req.user.id)) {
            return res.status(403).json({
                message: "You can only bid using your own truck"
            });
        }

        // Check truck compatibility
        if (
            truck.status !== "AVAILABLE" ||
            truck.truckType !== load.requiredTruckType ||
            truck.capacity < load.weight ||
            truck.availableFrom > load.pickupFrom ||
            truck.availableTo < load.pickupFrom
        ) {
            return res.status(400).json({
                message: "Truck is not eligible for this load"
            });
        }

        // Prevent duplicate bids
        const existingBid = await Bid.findOne({
            loadId,
            truckId
        });

        if (existingBid) {
            return res.status(409).json({
                message: "This truck has already bid on this load"
            });
        }

        // Save bid
        const bid = await Bid.create({
            loadId,
            driverId: req.user.id,
            truckId,
            amount
        });

        return res.status(201).json({
            message: "Bid submitted successfully",
            bid
        });

    } catch (error) {
        if (error.code === 11000) {
            return res.status(409).json({
                message: "This truck has already bid on this load"
            });
        }

        return res.status(500).json({
            message: "Failed to submit bid",
            error: error.message
        });
    }
};

// 2. SHIPPER: View bids for their load
const getLoadBids = async (req, res) => {
    try {
        if (req.user.role !== "SHIPPER") {
            return res.status(403).json({
                message: "Only shippers can view received bids"
            });
        }

        const { loadId } = req.params;

        if (!mongoose.isValidObjectId(loadId)) {
            return res.status(400).json({
                message: "Invalid load ID"
            });
        }

        const load = await Load.findById(loadId);

        if (!load) {
            return res.status(404).json({
                message: "Load not found"
            });
        }

        // Verify load ownership
        if (String(load.shipperId) !== String(req.user.id)) {
            return res.status(403).json({
                message: "You can only view bids for your own loads"
            });
        }

        const bids = await Bid.find({ loadId })
            .populate("driverId", "name email")
            .populate(
                "truckId",
                "truckType capacity currentLocation"
            )
            .sort({ createdAt: -1 });

        return res.status(200).json({
            loadId,
            totalBids: bids.length,
            bids
        });

    } catch (error) {
        return res.status(500).json({
            message: "Failed to fetch bids",
            error: error.message
        });
    }
};

// 3. DRIVER: View their submitted bids
const getMyBids = async (req, res) => {
    try {
        if (req.user.role !== "DRIVER") {
            return res.status(403).json({
                message: "Only drivers can view their bids"
            });
        }

        const bids = await Bid.find({
            driverId: req.user.id
        })
            .populate(
                "loadId",
                "pickupLocation dropLocation weight status"
            )
            .sort({ createdAt: -1 });

        return res.status(200).json({
            bids
        });

    } catch (error) {
        return res.status(500).json({
            message: "Failed to fetch bids",
            error: error.message
        });
    }
};


const acceptBid = async (req, res) => {
  try {
    if (req.user.role !== "SHIPPER") {
      return res.status(403).json({
        message: "Only shippers can accept bids"
      });
    }

    const bid = await Bid.findById(req.params.bidId);

    if (!bid) {
      return res.status(404).json({
        message: "Bid not found"
      });
    }

    const load = await Load.findById(bid.loadId);

    if (!load) {
      return res.status(404).json({
        message: "Load not found"
      });
    }

    if (load.shipperId.toString() !== req.user.id.toString()) {
      return res.status(403).json({
        message: "You cannot accept bids for this load"
      });
    }

    if (load.status !== "OPEN" || bid.status !== "PENDING") {
      return res.status(400).json({
        message: "Load or bid is no longer available"
      });
    }

    const truck = await Truck.findById(bid.truckId);

    if (!truck || truck.status !== "AVAILABLE") {
      return res.status(400).json({
        message: "Truck is no longer available"
      });
    }

    // Atomically claim the load so competing requests
    // cannot both accept different bids.
    const bookedLoad = await Load.findOneAndUpdate(
      { _id: load._id, status: "OPEN" },
      { $set: { status: "BOOKED" } },
      { new: true }
    );

    if (!bookedLoad) {
      return res.status(409).json({
        message: "Load has already been booked"
      });
    }

    const reservedTruck = await Truck.findOneAndUpdate(
      { _id: truck._id, status: "AVAILABLE" },
      { $set: { status: "BUSY" } },
      { new: true }
    );

    if (!reservedTruck) {
      await Load.updateOne(
        { _id: load._id, status: "BOOKED" },
        { $set: { status: "OPEN" } }
      );

      return res.status(409).json({
        message: "Truck was booked by another request"
      });
    }

    bid.status = "ACCEPTED";
    await bid.save();

    await Bid.updateMany(
      {
        loadId: load._id,
        _id: { $ne: bid._id },
        status: "PENDING"
      },
      { $set: { status: "REJECTED" } }
    );

    return res.status(200).json({
      message: "Bid accepted and load booked successfully",
      bid,
      load: bookedLoad,
      truck: reservedTruck
    });

  } catch (error) {
    return res.status(500).json({
      message: "Failed to accept bid",
      error: error.message
    });
  }
};

module.exports.acceptBid = acceptBid;


module.exports = {
  createBid,
  getLoadBids,
  getMyBids,
  acceptBid
};