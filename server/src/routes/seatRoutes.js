const express = require('express');
const router = express.Router();
const seatController = require('../controllers/seatController');
const { protect } = require('../middlewares/authMiddleware');

// Public routes (search/browse)
router.get('/:tripId', seatController.getSeatMap);
router.get('/:tripId/coach/:coachNo', seatController.getCoachSeats);
router.get('/:tripId/lock-timer/:seatNo', seatController.getLockTimer);

// Protected routes (locking/booking)
router.post('/lock', protect, seatController.lockSeat);
router.post('/unlock', protect, seatController.unlockSeat);

module.exports = router;
