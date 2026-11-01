const Truck = require("../models/Truck");

const createTruck = async (req, res) => {
    try {
        const {
            truckType,
            capacity,
            currentLocation,
            availableFrom,
            availableTo
        } = req.body;

        const truck = await Truck.create({
            driverId: req.user.id,
            truckType,
            capacity,
            currentLocation,
            availableFrom,
            availableTo
        });

        res.status(201).json({
            message: "Truck added successfully",
            truck
        });

    } catch (error) {
        res.status(500).json({
            message: "Failed to add truck",
            error: error.message
        });
    }
};


const getMyTrucks = async (req, res) => {
    try {
        const trucks = await Truck.find({
            driverId: req.user.id
        });

        res.json({
            trucks
        });

    } catch (error) {
        res.status(500).json({
            message: "Failed to fetch trucks",
            error: error.message
        });
    }
};


module.exports = {
    createTruck,
    getMyTrucks
};