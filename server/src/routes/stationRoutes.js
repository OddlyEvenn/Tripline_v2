const express = require('express');
const router = express.Router();
const stationController = require('../controllers/stationController');

router.get('/search', stationController.searchStations);
router.get('/cities', stationController.getCities);

module.exports = router;
