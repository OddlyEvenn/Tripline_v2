const bookingService = require('../services/bookingService');

async function createBooking(req, res, next) {
  try {
    const { tripIds, passengers } = req.body;
    if (!tripIds || !passengers || tripIds.length === 0 || passengers.length === 0) {
      return res.status(400).json({ error: 'tripIds and passengers are required' });
    }

    const email = req.user.email;
    const result = await bookingService.createBooking(email, { tripIds, passengers });
    res.status(201).json(result);
  } catch (err) {
    next(err);
  }
}

async function getUserBookings(req, res, next) {
  try {
    const email = req.user.email;
    const result = await bookingService.getUserBookings(email);
    res.status(200).json(result);
  } catch (err) {
    next(err);
  }
}

async function getBookingById(req, res, next) {
  try {
    const id = parseInt(req.params.id, 10);
    const email = req.user.email;
    const result = await bookingService.getBookingById(id, email);
    res.status(200).json(result);
  } catch (err) {
    next(err);
  }
}

async function cancelBooking(req, res, next) {
  try {
    const id = parseInt(req.params.id, 10);
    const email = req.user.email;
    await bookingService.cancelBooking(id, email);
    res.status(204).end();
  } catch (err) {
    next(err);
  }
}

module.exports = {
  createBooking,
  getUserBookings,
  getBookingById,
  cancelBooking
};
