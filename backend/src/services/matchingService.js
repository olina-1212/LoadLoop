
const Truck = require("../models/Truck");

// Calculate approximate straight-line distance in kilometres
const calculateDistance = (lat1, lon1, lat2, lon2) => {
    const R = 6371;

    const dLat = (lat2 - lat1) * Math.PI / 180;
    const dLon = (lon2 - lon1) * Math.PI / 180;

    const a =
        Math.sin(dLat / 2) ** 2 +
        Math.cos(lat1 * Math.PI / 180) *
        Math.cos(lat2 * Math.PI / 180) *
        Math.sin(dLon / 2) ** 2;

    return 2 * R * Math.atan2(
        Math.sqrt(a),
        Math.sqrt(1 - a)
    );
};

const findMatchingTrucks = async (load) => {
    const trucks = await Truck.find({
        status: "AVAILABLE",
        truckType: load.requiredTruckType,
        capacity: { $gte: load.weight },
        availableFrom: { $lte: load.pickupFrom },
        availableTo: { $gte: load.pickupFrom }
    });

    const matches = trucks.map((truck) => {
        const distance = calculateDistance(
            load.pickupLocation.lat,
            load.pickupLocation.lng,
            truck.currentLocation.lat,
            truck.currentLocation.lng
        );

        // Capacity score: 30 points for sufficient capacity
        const capacityScore = 30;

        // Proximity score: 30 points at 0 km,
        // decreasing to 0 points at 100 km
        const proximityScore = Math.max(
            0,
            30 * (1 - distance / 100)
        );

        // Availability and truck type already verified
        const timingScore = 20;
        const typeScore = 20;

        const matchScore = Math.round(
            capacityScore +
            proximityScore +
            timingScore +
            typeScore
        );

        return {
            truckId: truck._id,
            driverId: truck.driverId,
            truckType: truck.truckType,
            capacity: truck.capacity,
            distanceKm: Number(distance.toFixed(2)),
            matchScore,
            reasons: [
                "Truck type matches the required type",
                "Truck has sufficient capacity",
                `Truck is approximately ${distance.toFixed(2)} km from pickup`,
                "Truck is available at the pickup start time"
            ]
        };
    });

    return matches.sort(
        (a, b) => b.matchScore - a.matchScore
    );
};

module.exports = { findMatchingTrucks };
