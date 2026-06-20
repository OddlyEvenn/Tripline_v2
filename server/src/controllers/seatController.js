const seatManagementService = require('../services/seatManagementService');
const { getConnection } = require('../config/db');

async function getTransportMode(tripId) {
  const conn = await getConnection();
  try {
    const res = await conn.execute('SELECT transport_mode FROM trips WHERE id = :tripId', [tripId]);
    if (res.rows.length === 0) {
      const err = new Error('Trip not found');
      err.status = 404;
      throw err;
    }
    return res.rows[0].TRANSPORT_MODE;
  } finally {
    await conn.close();
  }
}

async function getSeatMap(req, res, next) {
  try {
    const tripId = parseInt(req.params.tripId, 10);
    const result = await seatManagementService.getSeatMap(tripId);
    res.status(200).json(result);
  } catch (err) {
    next(err);
  }
}

async function getCoachSeats(req, res, next) {
  try {
    const tripId = parseInt(req.params.tripId, 10);
    const coachNo = req.params.coachNo;
    const result = await seatManagementService.getTrainCoachSeats(tripId, coachNo);
    res.status(200).json(result);
  } catch (err) {
    next(err);
  }
}

async function lockSeat(req, res, next) {
  try {
    const { tripId, seatNo } = req.body;
    if (!tripId || !seatNo) {
      return res.status(400).json({ error: 'tripId and seatNo are required' });
    }

    const email = req.user.email; // Authentication username (email)
    const mode = await getTransportMode(tripId);
    
    const locked = await seatManagementService.lockSeat(tripId, seatNo, email, mode);

    if (locked) {
      const remaining = await seatManagementService.getRemainingLockSeconds(tripId, seatNo);
      res.status(200).json({
        locked: true,
        seatNo,
        tripId,
        remainingSeconds: remaining,
        message: `Seat locked for ${remaining} seconds`
      });
    } else {
      res.status(409).json({
        locked: false,
        seatNo,
        message: 'Seat is already locked or booked by another user'
      });
    }
  } catch (err) {
    next(err);
  }
}

async function unlockSeat(req, res, next) {
  try {
    const { tripId, seatNo } = req.body;
    if (!tripId || !seatNo) {
      return res.status(400).json({ error: 'tripId and seatNo are required' });
    }

    const email = req.user.email;
    const mode = await getTransportMode(tripId);

    await seatManagementService.unlockSeat(tripId, seatNo, email, mode);
    res.status(200).json({ unlocked: true, seatNo });
  } catch (err) {
    next(err);
  }
}

async function getLockTimer(req, res, next) {
  try {
    const tripId = parseInt(req.params.tripId, 10);
    const seatNo = req.params.seatNo;
    const remaining = await seatManagementService.getRemainingLockSeconds(tripId, seatNo);
    res.status(200).json({ tripId, seatNo, remainingSeconds: remaining });
  } catch (err) {
    next(err);
  }
}

module.exports = {
  getSeatMap,
  getCoachSeats,
  lockSeat,
  unlockSeat,
  getLockTimer
};
