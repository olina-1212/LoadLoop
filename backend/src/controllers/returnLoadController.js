
const mongoose = require("mongoose");
const { findReturnLoads } = require("../services/returnLoadService");

const getReturnLoads = async (req, res) => {
  try {
    if (req.user.role !== "DRIVER") {
      return res.status(403).json({
        message: "Only drivers can view return loads"
      });
    }

    const { truckId } = req.params;

    if (!mongoose.isValidObjectId(truckId)) {
      return res.status(400).json({
        message: "Invalid truck ID"
      });
    }

    const matches = await findReturnLoads(
      truckId,
      req.user.id
    );

    return res.status(200).json({
      truckId,
      totalMatches: matches.length,
      matches
    });

  } catch (error) {
    const knownErrors = [
      "Truck not found or access denied",
      "Truck is not available"
    ];

    return res.status(
      knownErrors.includes(error.message) ? 400 : 500
    ).json({
      message: error.message
    });
  }
};

module.exports = { getReturnLoads };
