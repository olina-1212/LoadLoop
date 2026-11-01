const express = require("express");
const cors = require("cors");
require("dotenv").config();

const connectDB = require("./config/db");

const authRoutes = require("./routes/authRoutes");
const truckRoutes = require("./routes/truckRoutes");
const loadRoutes = require("./routes/loadRoutes");
const bidRoutes = require("./routes/bidRoutes");
const tripRoutes = require("./routes/tripRoutes");
const returnLoadRoutes = require("./routes/returnLoadRoutes");

const app = express();

app.use(cors());
app.use(express.json());

connectDB();

app.use("/api/auth", authRoutes);
app.use("/api/trucks", truckRoutes);
app.use("/api/loads", loadRoutes);
app.use("/api/bids", bidRoutes);
app.use("/api/trips", tripRoutes);
app.use("/api/return-loads", returnLoadRoutes);

app.get("/", (req, res) => {
    res.json({
        message: "LoadLoop Backend is running"
    });
});

const PORT = process.env.PORT || 5000;

app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
});