
const mongoose = require("mongoose");
const Load = require("../models/Load");
const { findMatchingTrucks } = require("../services/matchingService");

const getMatchingTrucks = async (req, res) => {
    try {
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

        if (String(load.shipperId) !== String(req.user.id)) {
            return res.status(403).json({
                message: "You can only view matches for your own loads"
            });
        }

        if (load.status !== "OPEN") {
            return res.status(400).json({
                message: "Matching is only available for open loads"
            });
        }

        const matches = await findMatchingTrucks(load);

        res.json({
            loadId: load._id,
            totalMatches: matches.length,
            matches
        });

    } catch (error) {
        res.status(500).json({
            message: "Matching failed",
            error: error.message
        });
    }
};

module.exports = { getMatchingTrucks };
