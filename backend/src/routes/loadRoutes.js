
const express = require("express");

const {
    createLoad,
    getMyLoads,
    cancelLoad
} = require("../controllers/loadController");

const {
    getMatchingTrucks
} = require("../controllers/matchingController");

const protect = require("../middleware/authMiddleware");

const router = express.Router();

router.post("/", protect, createLoad);

router.get("/my", protect, getMyLoads);

router.get("/:loadId/matches", protect, getMatchingTrucks);
router.patch("/:loadId/cancel", protect, cancelLoad);

module.exports = router;
