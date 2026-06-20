const adminService = require('../services/adminService');

// ---- Carriers ----

async function createCarrier(req, res, next) {
  try {
    const { name, contactEmail, contactPhone, logoUrl } = req.body;
    if (!name) return res.status(400).json({ error: 'Name is required' });
    const result = await adminService.createCarrier(name, contactEmail, contactPhone, logoUrl);
    res.status(201).json(result);
  } catch (err) {
    next(err);
  }
}

async function getCarriers(req, res, next) {
  try {
    const page = parseInt(req.query.page, 10) || 0;
    const size = parseInt(req.query.size, 10) || 20;
    const result = await adminService.getAllCarriers(page, size);
    res.status(200).json(result);
  } catch (err) {
    next(err);
  }
}

async function deleteCarrier(req, res, next) {
  try {
    const id = parseInt(req.params.id, 10);
    await adminService.deleteCarrier(id);
    res.status(204).end();
  } catch (err) {
    next(err);
  }
}

// ---- Vehicles ----

async function createVehicle(req, res, next) {
  try {
    const { name, vehicleNumber, transportMode, capacity, seatLayout, seatClasses, totalSeats, carrierId } = req.body;
    if (!name || !transportMode || !capacity || !carrierId) {
      return res.status(400).json({ error: 'Name, transportMode, capacity, and carrierId are required' });
    }
    const result = await adminService.createVehicle(
      name,
      vehicleNumber,
      transportMode,
      parseInt(capacity, 10),
      seatLayout,
      seatClasses,
      totalSeats ? parseInt(totalSeats, 10) : null,
      parseInt(carrierId, 10)
    );
    res.status(201).json(result);
  } catch (err) {
    next(err);
  }
}

async function getVehicles(req, res, next) {
  try {
    const page = parseInt(req.query.page, 10) || 0;
    const size = parseInt(req.query.size, 10) || 20;
    const result = await adminService.getAllVehicles(page, size);
    res.status(200).json(result);
  } catch (err) {
    next(err);
  }
}

async function deleteVehicle(req, res, next) {
  try {
    const id = parseInt(req.params.id, 10);
    await adminService.deleteVehicle(id);
    res.status(204).end();
  } catch (err) {
    next(err);
  }
}

// ---- Stations ----

async function createStation(req, res, next) {
  try {
    const { name, city, state, country, type, latitude, longitude } = req.body;
    if (!name || !city || !type) {
      return res.status(400).json({ error: 'Name, city, and type are required' });
    }
    const result = await adminService.createStation(
      name,
      city,
      state,
      country,
      type,
      latitude !== undefined ? Number(latitude) : null,
      longitude !== undefined ? Number(longitude) : null
    );
    res.status(201).json(result);
  } catch (err) {
    next(err);
  }
}

async function getStations(req, res, next) {
  try {
    const page = parseInt(req.query.page, 10) || 0;
    const size = parseInt(req.query.size, 10) || 20;
    const result = await adminService.getAllStations(page, size);
    res.status(200).json(result);
  } catch (err) {
    next(err);
  }
}

async function deleteStation(req, res, next) {
  try {
    const id = parseInt(req.params.id, 10);
    await adminService.deleteStation(id);
    res.status(204).end();
  } catch (err) {
    next(err);
  }
}

// ---- Trips ----

async function createTrip(req, res, next) {
  try {
    const { vehicleId, originStationId, destinationStationId, departureTime, arrivalTime, price, distance, availableSeats } = req.body;
    if (!vehicleId || !originStationId || !destinationStationId || !departureTime || !arrivalTime || price === undefined || distance === undefined || availableSeats === undefined) {
      return res.status(400).json({ error: 'All fields are required to create a trip' });
    }
    const result = await adminService.createTrip(
      parseInt(vehicleId, 10),
      parseInt(originStationId, 10),
      parseInt(destinationStationId, 10),
      departureTime,
      arrivalTime,
      Number(price),
      Number(distance),
      parseInt(availableSeats, 10)
    );
    res.status(201).json(result);
  } catch (err) {
    next(err);
  }
}

async function getTrips(req, res, next) {
  try {
    const page = parseInt(req.query.page, 10) || 0;
    const size = parseInt(req.query.size, 10) || 20;
    const result = await adminService.getAllTrips(page, size);
    res.status(200).json(result);
  } catch (err) {
    next(err);
  }
}

async function deleteTrip(req, res, next) {
  try {
    const id = parseInt(req.params.id, 10);
    await adminService.deleteTrip(id);
    res.status(204).end();
  } catch (err) {
    next(err);
  }
}

// ---- Bookings ----

async function getBookings(req, res, next) {
  try {
    const page = parseInt(req.query.page, 10) || 0;
    const size = parseInt(req.query.size, 10) || 20;
    const result = await adminService.getAllBookings(page, size);
    res.status(200).json(result);
  } catch (err) {
    next(err);
  }
}

// ---- System Config ----

async function upsertConfig(req, res, next) {
  try {
    const { configKey, configValue, description } = req.body;
    if (!configKey || !configValue) {
      return res.status(400).json({ error: 'configKey and configValue are required' });
    }
    const result = await adminService.upsertConfig(configKey, configValue, description);
    res.status(200).json(result);
  } catch (err) {
    next(err);
  }
}

async function getConfigs(req, res, next) {
  try {
    const result = await adminService.getAllConfigs();
    res.status(200).json(result);
  } catch (err) {
    next(err);
  }
}

module.exports = {
  createCarrier,
  getCarriers,
  deleteCarrier,
  createVehicle,
  getVehicles,
  deleteVehicle,
  createStation,
  getStations,
  deleteStation,
  createTrip,
  getTrips,
  deleteTrip,
  getBookings,
  upsertConfig,
  getConfigs
};
