const express = require('express');
const router = express.Router();
const adminController = require('../controllers/adminController');
const { protect, adminOnly } = require('../middlewares/authMiddleware');

// Protect all routes in this router with protect & adminOnly middleware
router.use(protect, adminOnly);

// Carriers
router.post('/carriers', adminController.createCarrier);
router.get('/carriers', adminController.getCarriers);
router.delete('/carriers/:id', adminController.deleteCarrier);

// Vehicles
router.post('/vehicles', adminController.createVehicle);
router.get('/vehicles', adminController.getVehicles);
router.delete('/vehicles/:id', adminController.deleteVehicle);

// Stations
router.post('/stations', adminController.createStation);
router.get('/stations', adminController.getStations);
router.delete('/stations/:id', adminController.deleteStation);

// Trips
router.post('/trips', adminController.createTrip);
router.get('/trips', adminController.getTrips);
router.delete('/trips/:id', adminController.deleteTrip);

// Bookings
router.get('/bookings', adminController.getBookings);

// System Config
router.post('/config', adminController.upsertConfig);
router.get('/config', adminController.getConfigs);

module.exports = router;
