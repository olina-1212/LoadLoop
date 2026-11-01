const express = require("express");

const {
  startTrip,
  completeTrip
} = require("../controllers/tripController");

const protect = require("../middleware/authMiddleware");

const router = express.Router();

router.patch("/:loadId/start", protect, startTrip);
router.patch("/:loadId/complete", protect, completeTrip);

module.exports = router;