const express = require("express");

const {
  getReturnLoads
} = require("../controllers/returnLoadController");

const protect = require("../middleware/authMiddleware");

const router = express.Router();

router.get("/:truckId", protect, getReturnLoads);

module.exports = router;