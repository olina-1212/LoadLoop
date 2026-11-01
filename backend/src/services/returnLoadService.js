
const Load = require("../models/Load");
const Truck = require("../models/Truck");

// Calculate straight-line distance in kilometres
const calculateDistance = (lat1, lng1, lat2, lng2) => {
  const R = 6371;

  const dLat = (lat2 - lat1) * Math.PI / 180;
  const dLng = (lng2 - lng1) * Math.PI / 180;

  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(lat1 * Math.PI / 180) *
    Math.cos(lat2 * Math.PI / 180) *
    Math.sin(dLng / 2) ** 2;

  return 2 * R * Math.atan2(
    Math.sqrt(a),
    Math.sqrt(1 - a)
  );
};

const findReturnLoads = async (truckId, driverId) => {
  const truck = await Truck.findOne({
    _id: truckId,
    driverId
  });

  if (!truck) {
    throw new Error("Truck not found or access denied");
  }

  if (truck.status !== "AVAILABLE") {
    throw new Error("Truck is not available");
  }

  const loads = await Load.find({
    status: "OPEN",
    requiredTruckType: truck.truckType,
    weight: { $lte: truck.capacity },
    pickupTo: { $gte: new Date() }
  });

  const matches = [];

  for (const load of loads) {
    const distance = calculateDistance(
      truck.currentLocation.lat,
      truck.currentLocation.lng,
      load.pickupLocation.lat,
      load.pickupLocation.lng
    );

    // Only recommend loads within 100 km
    if (distance > 100) continue;

    // Truck must be ready before the pickup window closes
    const readyAt = new Date(
      Math.max(Date.now(), new Date(truck.availableFrom).getTime())
    );

    if (readyAt > load.pickupTo) continue;

    const proximityScore = Math.max(0, 100 - distance);

    matches.push({
      loadId: load._id,
      pickupLocation: load.pickupLocation,
      dropLocation: load.dropLocation,
      weight: load.weight,
      cargoType: load.cargoType,
      minRate: load.minRate,
      maxRate: load.maxRate,
      pickupFrom: load.pickupFrom,
      pickupTo: load.pickupTo,
      distanceFromTruckKm: Number(distance.toFixed(2)),
      score: Number(proximityScore.toFixed(2))
    });
  }

  matches.sort((a, b) => b.score - a.score);

  return matches;
};

module.exports = { findReturnLoads };
