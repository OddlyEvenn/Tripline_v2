const { getConnection } = require('../config/db');
const { getRedisClient } = require('../config/redis');

const LOCK_DURATION_SECONDS = 300; // 5 minutes

/**
 * Pre-generate seats when a trip is created (called asynchronously)
 */
async function generateSeatsForTrip(tripId, transportMode) {
  const conn = await getConnection();

  try {
    // 1. Fetch trip and vehicle details
    const tripResult = await conn.execute(
      `SELECT t.id, t.price, v.seat_layout, v.seat_classes, v.capacity, v.total_seats
       FROM trips t
       JOIN vehicles v ON t.vehicle_id = v.id
       WHERE t.id = :tripId`,
      [tripId]
    );

    if (tripResult.rows.length === 0) {
      console.warn(`Trip ${tripId} not found, skipping seat generation.`);
      return;
    }

    const trip = tripResult.rows[0];
    const layout = JSON.parse(trip.SEAT_LAYOUT || '{}');
    const seatClassesPricing = JSON.parse(trip.SEAT_CLASSES || '{}');
    const basePrice = trip.PRICE;

    if (transportMode === 'FLIGHT') {
      // Check if seats already exist
      const existing = await conn.execute('SELECT id FROM flight_seats WHERE trip_id = :tripId FETCH FIRST 1 ROWS ONLY', [tripId]);
      if (existing.rows.length > 0) return;

      const rows = layout.rows || 30;
      const columns = layout.columns || ['A', 'B', 'C', 'D', 'E', 'F'];
      const classConfig = layout.seat_classes || {};

      // Parse row ranges for classes
      const rowToClass = [];
      for (const [clsName, config] of Object.entries(classConfig)) {
        if (config && typeof config === 'object' && config.rows) {
          const [start, end] = config.rows.split('-').map(Number);
          rowToClass.push({ start, end, className: clsName });
          // Save class price if available and not set in main pricing
          if (config.price && !seatClassesPricing[clsName]) {
            seatClassesPricing[clsName] = config.price;
          }
        } else if (typeof config === 'string') {
          // Format B: range is key ("1-5"), class name is value
          const [start, end] = clsName.split('-').map(Number);
          rowToClass.push({ start, end, className: config });
        }
      }

      // Generate seats
      for (let r = 1; r <= rows; r++) {
        // Determine class
        let seatClass = 'Economy';
        for (const range of rowToClass) {
          if (r >= range.start && r <= range.end) {
            seatClass = range.className;
            break;
          }
        }

        const price = seatClassesPricing[seatClass] || basePrice;

        for (const col of columns) {
          const seatNo = `${r}${col}`;
          await conn.execute(
            `INSERT INTO flight_seats (trip_id, seat_no, row_no, column_no, seat_class, status, price)
             VALUES (:tripId, :seatNo, :r, :col, :seatClass, 'AVAILABLE', :price)`,
            { tripId, seatNo, r, col, seatClass, price }
          );
        }
      }
    } 
    else if (transportMode === 'BUS') {
      const existing = await conn.execute('SELECT id FROM bus_seats WHERE trip_id = :tripId FETCH FIRST 1 ROWS ONLY', [tripId]);
      if (existing.rows.length > 0) return;

      const rows = layout.rows || 12;
      const columns = layout.columns || ['A', 'B', 'C', 'D'];
      const windowCols = new Set([columns[0], columns[columns.length - 1]]);

      for (let r = 1; r <= rows; r++) {
        for (const col of columns) {
          const seatNo = `${r}${col}`;
          const seatType = windowCols.has(col) ? 'Window' : 'Aisle';
          await conn.execute(
            `INSERT INTO bus_seats (trip_id, seat_no, row_no, column_no, seat_type, status, price)
             VALUES (:tripId, :seatNo, :r, :col, :seatType, 'AVAILABLE', :price)`,
            { tripId, seatNo, r, col, seatType, price: basePrice }
          );
        }
      }
    } 
    else if (transportMode === 'TRAIN') {
      const existing = await conn.execute('SELECT id FROM train_seats WHERE trip_id = :tripId FETCH FIRST 1 ROWS ONLY', [tripId]);
      if (existing.rows.length > 0) return;

      const coaches = layout.coaches || [{ coach_no: 'B1', class: 'Sleeper', seats: 72 }];
      const berthPattern6 = ['L', 'M', 'U', 'L', 'M', 'U'];
      const sidePattern = ['SL', 'SU'];

      for (const coach of coaches) {
        const coachNo = coach.coach_no || coach.coachNo || 'B1';
        const seatClass = coach.class || 'Sleeper';
        const totalSeats = coach.seats || 72;
        const price = seatClassesPricing[seatClass] || coach.price || basePrice;

        for (let seatNum = 1; seatNum <= totalSeats; seatNum++) {
          const posInComp = (seatNum - 1) % 8;
          const berthType = posInComp < 6 ? berthPattern6[posInComp] : sidePattern[posInComp - 6];

          await conn.execute(
            `INSERT INTO train_seats (trip_id, coach_no, seat_no, berth_type, seat_class, status, price)
             VALUES (:tripId, :coachNo, :seatNumStr, :berthType, :seatClass, 'AVAILABLE', :price)`,
            {
              tripId,
              coachNo,
              seatNumStr: String(seatNum),
              berthType,
              seatClass,
              price
            }
          );
        }
      }
    }

    await conn.commit();
    console.log(`Successfully generated seats for trip ${tripId} (${transportMode})`);
  } catch (err) {
    await conn.rollback();
    console.error(`Failed generating seats for trip ${tripId}:`, err.message);
  } finally {
    await conn.close();
  }
}

/**
 * Returns available class seat counts for a trip (search results)
 */
async function getClassAvailability(tripId, transportMode) {
  const conn = await getConnection();
  const availability = {};

  try {
    if (transportMode === 'FLIGHT') {
      const result = await conn.execute(
        `SELECT seat_class, COUNT(*) as count 
         FROM flight_seats 
         WHERE trip_id = :tripId AND status = 'AVAILABLE' 
         GROUP BY seat_class`,
        [tripId]
      );
      for (const row of result.rows) {
        availability[row.SEAT_CLASS] = Number(row.COUNT);
      }
    } 
    else if (transportMode === 'BUS') {
      const result = await conn.execute(
        `SELECT COUNT(*) as count 
         FROM bus_seats 
         WHERE trip_id = :tripId AND status = 'AVAILABLE'`,
        [tripId]
      );
      const count = Number(result.rows[0]?.COUNT || 0);
      if (count > 0) availability['Standard'] = count;
    } 
    else if (transportMode === 'TRAIN') {
      const result = await conn.execute(
        `SELECT seat_class, COUNT(*) as count 
         FROM train_seats 
         WHERE trip_id = :tripId AND status = 'AVAILABLE' 
         GROUP BY seat_class`,
        [tripId]
      );
      for (const row of result.rows) {
        availability[row.SEAT_CLASS] = Number(row.COUNT);
      }
    }
  } catch (err) {
    console.error(`Error getting class availability for trip ${tripId}:`, err.message);
  } finally {
    await conn.close();
  }

  return availability;
}

/**
 * Prepares and returns seat map structure. Generates seats proactively if none exist.
 */
async function getSeatMap(tripId) {
  const conn = await getConnection();

  try {
    // 1. Fetch Trip details
    const tripRes = await conn.execute('SELECT transport_mode FROM trips WHERE id = :tripId', [tripId]);
    if (tripRes.rows.length === 0) {
      const err = new Error('Trip not found');
      err.status = 404;
      throw err;
    }

    const transportMode = tripRes.rows[0].TRANSPORT_MODE;

    // Check if seats exist
    let hasSeats = false;
    if (transportMode === 'FLIGHT') {
      const countRes = await conn.execute('SELECT COUNT(*) as count FROM flight_seats WHERE trip_id = :tripId', [tripId]);
      hasSeats = Number(countRes.rows[0].COUNT) > 0;
    } else if (transportMode === 'BUS') {
      const countRes = await conn.execute('SELECT COUNT(*) as count FROM bus_seats WHERE trip_id = :tripId', [tripId]);
      hasSeats = Number(countRes.rows[0].COUNT) > 0;
    } else if (transportMode === 'TRAIN') {
      const countRes = await conn.execute('SELECT COUNT(*) as count FROM train_seats WHERE trip_id = :tripId', [tripId]);
      hasSeats = Number(countRes.rows[0].COUNT) > 0;
    }

    if (!hasSeats) {
      console.log(`Generating seats proactively for trip ${tripId}`);
      await generateSeatsForTrip(tripId, transportMode);
    }

    const response = {
      tripId,
      transportMode
    };

    if (transportMode === 'FLIGHT') {
      const seatsRes = await conn.execute(
        `SELECT id, seat_no, row_no, column_no, seat_class, status, price 
         FROM flight_seats 
         WHERE trip_id = :tripId 
         ORDER BY row_no ASC, column_no ASC`,
        [tripId]
      );
      
      response.seats = seatsRes.rows.map(s => ({
        id: s.ID,
        seatNo: s.SEAT_NO,
        rowNo: Number(s.ROW_NO),
        columnNo: s.COLUMN_NO,
        seatClass: s.SEAT_CLASS,
        status: s.STATUS,
        price: Number(s.PRICE)
      }));

      // Calculate availability and class prices
      const avail = {};
      const prices = {};
      for (const s of response.seats) {
        if (s.status === 'AVAILABLE') {
          avail[s.seatClass] = (avail[s.seatClass] || 0) + 1;
        }
        if (!prices[s.seatClass] || s.price < prices[s.seatClass]) {
          prices[s.seatClass] = s.price;
        }
      }
      response.availability = avail;
      response.classPrices = prices;
    } 
    else if (transportMode === 'BUS') {
      const seatsRes = await conn.execute(
        `SELECT id, seat_no, row_no, column_no, seat_type, status, price 
         FROM bus_seats 
         WHERE trip_id = :tripId 
         ORDER BY row_no ASC, column_no ASC`,
        [tripId]
      );

      response.seats = seatsRes.rows.map(s => ({
        id: s.ID,
        seatNo: s.SEAT_NO,
        rowNo: Number(s.ROW_NO),
        columnNo: s.COLUMN_NO,
        seatType: s.SEAT_TYPE,
        status: s.STATUS,
        price: Number(s.PRICE)
      }));

      response.totalAvailable = response.seats.filter(s => s.status === 'AVAILABLE').length;
    } 
    else if (transportMode === 'TRAIN') {
      // Find distinct coach numbers
      const coachRes = await conn.execute(
        `SELECT DISTINCT coach_no 
         FROM train_seats 
         WHERE trip_id = :tripId 
         ORDER BY coach_no ASC`,
        [tripId]
      );
      response.coaches = coachRes.rows.map(c => c.COACH_NO);

      const seatsRes = await conn.execute(
        `SELECT id, coach_no, seat_no, berth_type, seat_class, status, price 
         FROM train_seats 
         WHERE trip_id = :tripId 
         ORDER BY coach_no ASC, TO_NUMBER(seat_no) ASC`,
        [tripId]
      );

      const allSeats = seatsRes.rows.map(s => ({
        id: s.ID,
        coachNo: s.COACH_NO,
        seatNo: s.SEAT_NO,
        berthType: s.BERTH_TYPE,
        seatClass: s.SEAT_CLASS,
        status: s.STATUS,
        price: Number(s.PRICE)
      }));

      response.totalAvailable = allSeats.filter(s => s.status === 'AVAILABLE').length;

      // Class availability & lowest price
      const avail = {};
      const prices = {};
      for (const s of allSeats) {
        if (s.status === 'AVAILABLE') {
          avail[s.seatClass] = (avail[s.seatClass] || 0) + 1;
        }
        if (!prices[s.seatClass] || s.price < prices[s.seatClass]) {
          prices[s.seatClass] = s.price;
        }
      }
      response.availability = avail;
      response.classPrices = prices;
    }

    return response;
  } finally {
    await conn.close();
  }
}

/**
 * Returns seats for a specific train coach
 */
async function getTrainCoachSeats(tripId, coachNo) {
  const conn = await getConnection();

  try {
    const seatsRes = await conn.execute(
      `SELECT id, coach_no, seat_no, berth_type, seat_class, status, price 
       FROM train_seats 
       WHERE trip_id = :tripId AND coach_no = :coachNo 
       ORDER BY TO_NUMBER(seat_no) ASC`,
      [tripId, coachNo]
    );

    return seatsRes.rows.map(s => ({
      id: s.ID,
      coachNo: s.COACH_NO,
      seatNo: s.SEAT_NO,
      berthType: s.BERTH_TYPE,
      seatClass: s.SEAT_CLASS,
      status: s.STATUS,
      price: Number(s.PRICE)
    }));
  } finally {
    await conn.close();
  }
}

/**
 * Acquire Redis Seat Lock
 */
async function lockSeat(tripId, seatNo, userId, transportMode) {
  const redis = getRedisClient();
  const redisKey = `seat_lock:${tripId}:${seatNo}`;

  // setIfAbsent equivalent in node-redis: set with NX and EX options
  const acquired = await redis.set(redisKey, userId, { NX: true, EX: LOCK_DURATION_SECONDS });

  if (acquired === 'OK') {
    try {
      await updateSeatStatusInDb(tripId, seatNo, transportMode, 'LOCK');
    } catch (err) {
      await redis.del(redisKey);
      throw err;
    }
    console.log(`Seat ${seatNo} on trip ${tripId} locked by user ${userId}`);
    return true;
  }

  console.warn(`Seat ${seatNo} on trip ${tripId} already locked`);
  return false;
}

/**
 * Release Redis Seat Lock
 */
async function unlockSeat(tripId, seatNo, userId, transportMode) {
  const redis = getRedisClient();
  const redisKey = `seat_lock:${tripId}:${seatNo}`;
  const currentOwner = await redis.get(redisKey);

  if (String(userId) === String(currentOwner)) {
    await redis.del(redisKey);
    await updateSeatStatusInDb(tripId, seatNo, transportMode, 'UNLOCK');
    console.log(`Seat ${seatNo} on trip ${tripId} unlocked by user ${userId}`);
  } else {
    console.warn(`User ${userId} tried to unlock seat ${seatNo} owned by ${currentOwner}`);
    const err = new Error(`You do not own the lock for seat ${seatNo}`);
    err.status = 400;
    throw err;
  }
}

/**
 * Confirm seat booked (clears Redis lock & marks DB as BOOKED)
 */
async function confirmSeatBooked(tripId, seatNo, transportMode) {
  const redis = getRedisClient();
  const redisKey = `seat_lock:${tripId}:${seatNo}`;

  await redis.del(redisKey);
  await updateSeatStatusInDb(tripId, seatNo, transportMode, 'BOOK');
  console.log(`Seat ${seatNo} on trip ${tripId} confirmed as BOOKED`);
}

/**
 * Get TTL for locked seat
 */
async function getRemainingLockSeconds(tripId, seatNo) {
  const redis = getRedisClient();
  const redisKey = `seat_lock:${tripId}:${seatNo}`;
  const ttl = await redis.ttl(redisKey);
  return ttl > 0 ? ttl : 0;
}

/**
 * Updates DB seat status
 */
async function updateSeatStatusInDb(tripId, seatNo, transportMode, action) {
  const conn = await getConnection();

  try {
    const status = action === 'LOCK' ? 'LOCKED' : (action === 'BOOK' ? 'BOOKED' : 'AVAILABLE');
    const lockedUntil = action === 'LOCK' ? new Date(Date.now() + LOCK_DURATION_SECONDS * 1000) : null;

    if (transportMode === 'FLIGHT') {
      await conn.execute(
        `UPDATE flight_seats 
         SET status = :status, locked_until = :lockedUntil 
         WHERE trip_id = :tripId AND seat_no = :seatNo`,
        { status, lockedUntil, tripId, seatNo }
      );
    } 
    else if (transportMode === 'BUS') {
      await conn.execute(
        `UPDATE bus_seats 
         SET status = :status, locked_until = :lockedUntil 
         WHERE trip_id = :tripId AND seat_no = :seatNo`,
        { status, lockedUntil, tripId, seatNo }
      );
    } 
    else if (transportMode === 'TRAIN') {
      const parts = seatNo.split(':');
      const coach = parts.length === 2 ? parts[0] : 'B1';
      const actualSeatNo = parts.length === 2 ? parts[1] : seatNo;

      await conn.execute(
        `UPDATE train_seats 
         SET status = :status, locked_until = :lockedUntil 
         WHERE trip_id = :tripId AND coach_no = :coach AND seat_no = :actualSeatNo`,
        { status, lockedUntil, tripId, coach, actualSeatNo }
      );
    }

    await conn.commit();
  } catch (err) {
    await conn.rollback();
    throw err;
  } finally {
    await conn.close();
  }
}

module.exports = {
  generateSeatsForTrip,
  getClassAvailability,
  getSeatMap,
  getTrainCoachSeats,
  lockSeat,
  unlockSeat,
  confirmSeatBooked,
  getRemainingLockSeconds
};
