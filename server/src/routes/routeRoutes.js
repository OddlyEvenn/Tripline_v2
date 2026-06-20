const express = require('express');
const router = express.Router();
const popularRoutesController = require('../controllers/popularRoutesController');

router.get('/popular', popularRoutesController.getPopularRoutes);

module.exports = router;
