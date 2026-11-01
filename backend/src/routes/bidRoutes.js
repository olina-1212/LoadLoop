
const express = require("express");

const {
    createBid,
    getLoadBids,
    getMyBids,
      acceptBid
} = require("../controllers/bidController");

const protect = require("../middleware/authMiddleware");

const router = express.Router();

router.post("/", protect, createBid);

router.get("/my", protect, getMyBids);

router.get("/load/:loadId", protect, getLoadBids);
router.patch("/:bidId/accept", protect, acceptBid);
module.exports = router;
