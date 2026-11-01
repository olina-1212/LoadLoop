const express = require("express");

const {
    createTruck,
    getMyTrucks
} = require("../controllers/truckController");

const protect = require("../middleware/authMiddleware");

const router = express.Router();

router.post("/", protect, createTruck);

router.get("/my", protect, getMyTrucks);

module.exports = router;