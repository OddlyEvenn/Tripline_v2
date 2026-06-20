const { getConnection } = require('../config/db');
const seatManagementService = require('./seatManagementService');
const QRCode = require('qrcode');

// Helper to format Date objects as 'dd MMM yyyy, hh:mm a'
function formatDateTime(dateStr) {
  if (!dateStr) return null;
  const d = new Date(dateStr);
  const pad = (n) => String(n).padStart(2, '0');
  const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
  
  let hours = d.getHours();
  const ampm = hours >= 12 ? 'PM' : 'AM';
  hours = hours % 12;
  hours = hours ? hours : 12; // 0 should be 12
  
  return `${pad(d.getDate())} ${months[d.getMonth()]} ${d.getFullYear()}, ${pad(hours)}:${pad(d.getMinutes())} ${ampm}`;
}

// Map database booking and ticket records to response JSON
function mapBookingToResponse(b, tickets = []) {
  return {
    bookingId: b.ID,
    status: b.STATUS,
    totalPrice: Number(b.TOTAL_PRICE),
    createdAt: formatDateTime(b.CREATED_AT),
    tickets: tickets.map(t => ({
      ticketId: t.TICKET_ID,
      passengerName: t.PASSENGER_NAME,
      passengerEmail: t.PASSENGER_EMAIL,
      passengerPhone: t.PASSENGER_PHONE,
      seatNumber: t.SEAT_NUMBER,
      coachNumber: t.COACH_NUMBER,
      seatClass: t.SEAT_CLASS,
      berthType: t.BERTH_TYPE,
      legOrder: String(t.LEG_ORDER),
      legPrice: Number(t.LEG_PRICE),
      qrCode: t.QR_CODE,
      originCity: t.ORIGIN_CITY,
      destinationCity: t.DEST_CITY,
      departureTime: formatDateTime(t.DEPARTURE_TIME),
      arrivalTime: formatDateTime(t.ARRIVAL_TIME),
      transportMode: t.TRANSPORT_MODE,
      carrierName: t.CARRIER_NAME
    }))
  };
}

/**
 * Fetch seat price if seat is assigned, otherwise default to trip price
 */
async function resolveLegPrice(conn, tripId, transportMode, seatNumber, coachNumber, defaultPrice) {
  if (!seatNumber) return defaultPrice;

  try {
    if (transportMode === 'FLIGHT') {
      const res = await conn.execute(
        'SELECT price FROM flight_seats WHERE trip_id = :tripId AND seat_no = :seatNumber',
        [tripId, seatNumber]
      );
      if (res.rows.length > 0) return Number(res.rows[0].PRICE);
    } 
    else if (transportMode === 'BUS') {
      const res = await conn.execute(
        'SELECT price FROM bus_seats WHERE trip_id = :tripId AND seat_no = :seatNumber',
        [tripId, seatNumber]
      );
      if (res.rows.length > 0) return Number(res.rows[0].PRICE);
    } 
    else if (transportMode === 'TRAIN') {
      const res = await conn.execute(
        'SELECT price FROM train_seats WHERE trip_id = :tripId AND coach_no = :coachNumber AND seat_no = :seatNumber',
        [tripId, coachNumber || 'B1', seatNumber]
      );
      if (res.rows.length > 0) return Number(res.rows[0].PRICE);
    }
  } catch (err) {
    console.warn(`Error resolving leg price for trip ${tripId}:`, err.message);
  }

  return defaultPrice;
}

/**
 * Create a new PENDING booking
 */
async function createBooking(userEmail, request) {
  const conn = await getConnection();

  try {
    // 1. Fetch User
    const userRes = await conn.execute('SELECT id FROM users WHERE email = :userEmail', [userEmail]);
    if (userRes.rows.length === 0) {
      const err = new Error('User not found');
      err.status = 404;
      throw err;
    }
    const userId = userRes.rows[0].ID;

    // 2. Fetch all Trips
    const trips = [];
    for (const tripId of request.tripIds) {
      const tripRes = await conn.execute(
        'SELECT id, price, transport_mode, available_seats FROM trips WHERE id = :tripId',
        [tripId]
      );
      if (tripRes.rows.length === 0) {
        const err = new Error(`Trip ${tripId} not found`);
        err.status = 404;
        throw err;
      }
      const trip = tripRes.rows[0];
      if (Number(trip.AVAILABLE_SEATS) < 1) {
        const err = new Error(`No available seats on trip ${tripId}`);
        err.status = 400;
        throw err;
      }
      trips.push(trip);
    }

    // 3. Resolve pricing
    let totalPrice = 0;
    const ticketDetails = [];

    for (let i = 0; i < trips.size || i < request.tripIds.length; i++) {
      const trip = trips[i];
      const passenger = request.passengers[i] || request.passengers[0];
      
      const legPrice = await resolveLegPrice(
        conn,
        trip.ID,
        trip.TRANSPORT_MODE,
        passenger.seatNumber,
        passenger.coachNumber,
        Number(trip.PRICE)
      );

      totalPrice += legPrice;
      ticketDetails.push({
        tripId: trip.ID,
        passengerName: passenger.name,
        passengerEmail: passenger.email,
        passengerPhone: passenger.phone,
        seatNumber: passenger.seatNumber,
        coachNumber: passenger.coachNumber,
        seatClass: passenger.seatClass,
        berthType: passenger.berthType,
        legPrice,
        legOrder: i + 1
      });
    }

    // 4. Insert Booking
    const bookingRes = await conn.execute(
      `INSERT INTO bookings (user_id, total_price, status)
       VALUES (:userId, :totalPrice, 'PENDING')
       RETURNING id INTO :id`,
      {
        userId,
        totalPrice,
        id: { type: require('oracledb').NUMBER, dir: require('oracledb').BIND_OUT }
      }
    );
    const bookingId = bookingRes.outBinds.id[0];

    // 5. Insert Tickets
    for (const ticket of ticketDetails) {
      await conn.execute(
        `INSERT INTO tickets (booking_id, trip_id, passenger_name, passenger_email, passenger_phone, seat_number, coach_number, seat_class, berth_type, leg_price, leg_order)
         VALUES (:bookingId, :tripId, :passengerName, :passengerEmail, :passengerPhone, :seatNumber, :coachNumber, :seatClass, :berthType, :legPrice, :legOrder)`,
        {
          bookingId,
          tripId: ticket.tripId,
          passengerName: ticket.passengerName,
          passengerEmail: ticket.passengerEmail,
          passengerPhone: ticket.passengerPhone,
          seatNumber: ticket.seatNumber,
          coachNumber: ticket.coachNumber,
          seatClass: ticket.seatClass,
          berthType: ticket.berthType,
          legPrice: ticket.legPrice,
          legOrder: ticket.legOrder
        }
      );
    }

    await conn.commit();

    // Return the created booking response
    return await getBookingById(bookingId, userEmail);
  } catch (err) {
    await conn.rollback();
    throw err;
  } finally {
    await conn.close();
  }
}

/**
 * Confirm Booking upon payment receipt
 */
async function confirmBooking(bookingId, stripePaymentIntentId) {
  const conn = await getConnection();

  try {
    const bookingRes = await conn.execute('SELECT id, status FROM bookings WHERE id = :bookingId', [bookingId]);
    if (bookingRes.rows.length === 0) {
      const err = new Error(`Booking ${bookingId} not found`);
      err.status = 404;
      throw err;
    }

    // Update status to PAID
    await conn.execute(
      `UPDATE bookings 
       SET status = 'PAID', stripe_payment_intent_id = :stripePaymentIntentId 
       WHERE id = :bookingId`,
      [stripePaymentIntentId, bookingId]
    );

    // Fetch tickets to update trip available seats, lock status, and QR codes
    const ticketsRes = await conn.execute(
      `SELECT t.id, t.seat_number, t.coach_number, t.passenger_name,
              tr.id AS trip_id, tr.transport_mode, tr.available_seats
       FROM tickets t
       JOIN trips tr ON t.trip_id = tr.id
       WHERE t.booking_id = :bookingId`,
      [bookingId]
    );

    for (const t of ticketsRes.rows) {
      // 1. Decrement available seats
      const newAvail = Math.max(0, Number(t.AVAILABLE_SEATS) - 1);
      await conn.execute('UPDATE trips SET available_seats = :newAvail WHERE id = :tripId', [newAvail, t.TRIP_ID]);

      // 2. Confirm seat booked in seats table
      if (t.SEAT_NUMBER) {
        try {
          let seatKey = t.SEAT_NUMBER;
          if (t.TRANSPORT_MODE === 'TRAIN' && t.COACH_NUMBER) {
            seatKey = `${t.COACH_NUMBER}:${t.SEAT_NUMBER}`;
          }
          await seatManagementService.confirmSeatBooked(t.TRIP_ID, seatKey, t.TRANSPORT_MODE);
        } catch (seatErr) {
          console.error(`Seat confirm failed for ticket ${t.ID}:`, seatErr.message);
        }
      }

      // 3. Generate QR code Base64
      try {
        const qrContent = `TRIPLINE|TICKET:${t.ID}|BOOKING:${bookingId}|PASSENGER:${t.PASSENGER_NAME}|TRIP:${t.TRIP_ID}|SEAT:${t.SEAT_NUMBER || 'General'}${t.COACH_NUMBER ? `|COACH:${t.COACH_NUMBER}` : ''}`;
        
        // qrcode.toDataURL generates string containing data:image/png;base64,...
        // We strip the header to match Java's raw Base64 string storage
        const fullDataUrl = await QRCode.toDataURL(qrContent, { width: 300 });
        const rawBase64 = fullDataUrl.replace(/^data:image\/png;base64,/, '');

        await conn.execute('UPDATE tickets SET qr_code = :rawBase64 WHERE id = :ticketId', [rawBase64, t.ID]);
      } catch (qrErr) {
        console.error(`QR Code generation failed for ticket ${t.ID}:`, qrErr.message);
      }
    }

    await conn.commit();
  } catch (err) {
    await conn.rollback();
    throw err;
  } finally {
    await conn.close();
  }
}

/**
 * Cancel booking
 */
async function cancelBooking(bookingId, userEmail) {
  const conn = await getConnection();

  try {
    const result = await conn.execute(
      `SELECT b.id, b.status, u.email 
       FROM bookings b 
       JOIN users u ON b.user_id = u.id 
       WHERE b.id = :bookingId`,
      [bookingId]
    );

    if (result.rows.length === 0) {
      const err = new Error('Booking not found');
      err.status = 404;
      throw err;
    }

    const booking = result.rows[0];

    if (booking.EMAIL !== userEmail) {
      const err = new Error('You are not authorized to cancel this booking');
      err.status = 400;
      throw err;
    }

    if (booking.STATUS === 'CANCELLED') {
      const err = new Error('Booking is already cancelled');
      err.status = 400;
      throw err;
    }

    await conn.execute("UPDATE bookings SET status = 'CANCELLED' WHERE id = :bookingId", [bookingId]);
    await conn.commit();
  } catch (err) {
    await conn.rollback();
    throw err;
  } finally {
    await conn.close();
  }
}

/**
 * Get user booking history
 */
async function getUserBookings(userEmail) {
  const conn = await getConnection();

  try {
    // Fetch bookings
    const bookingsRes = await conn.execute(
      `SELECT b.id, b.total_price, b.status, b.created_at
       FROM bookings b
       JOIN users u ON b.user_id = u.id
       WHERE u.email = :userEmail
       ORDER BY b.created_at DESC`,
      [userEmail]
    );

    const responses = [];
    for (const b of bookingsRes.rows) {
      // Fetch tickets for this booking
      const ticketsRes = await conn.execute(
        `SELECT t.id AS ticket_id, t.passenger_name, t.passenger_email, t.passenger_phone, t.seat_number, t.coach_number, t.seat_class, t.berth_type, t.leg_price, t.leg_order, t.qr_code,
                tr.departure_time, tr.arrivalTime as arrival_time, tr.transport_mode,
                o.city AS origin_city, d.city AS dest_city,
                c.name AS carrier_name
         FROM tickets t
         JOIN trips tr ON t.trip_id = tr.id
         JOIN stations o ON tr.origin_station_id = o.id
         JOIN stations d ON tr.destination_station_id = d.id
         JOIN vehicles v ON tr.vehicle_id = v.id
         JOIN carriers c ON v.carrier_id = c.id
         WHERE t.booking_id = :bookingId
         ORDER BY t.leg_order ASC`,
        { bookingId: b.ID }
      );

      responses.push(mapBookingToResponse(b, ticketsRes.rows));
    }

    return responses;
  } finally {
    await conn.close();
  }
}

/**
 * Retrieve booking details by ID
 */
async function getBookingById(bookingId, userEmail) {
  const conn = await getConnection();

  try {
    const bookingRes = await conn.execute(
      `SELECT b.id, b.total_price, b.status, b.created_at, u.email
       FROM bookings b
       JOIN users u ON b.user_id = u.id
       WHERE b.id = :bookingId`,
      [bookingId]
    );

    if (bookingRes.rows.length === 0) {
      const err = new Error('Booking not found');
      err.status = 404;
      throw err;
    }

    const b = bookingRes.rows[0];

    // Access control: Only booking owner can view
    if (b.EMAIL !== userEmail) {
      const err = new Error('Access denied');
      err.status = 400;
      throw err;
    }

    const ticketsRes = await conn.execute(
      `SELECT t.id AS ticket_id, t.passenger_name, t.passenger_email, t.passenger_phone, t.seat_number, t.coach_number, t.seat_class, t.berth_type, t.leg_price, t.leg_order, t.qr_code,
              tr.departure_time, tr.arrivalTime as arrival_time, tr.transport_mode,
              o.city AS origin_city, d.city AS dest_city,
              c.name AS carrier_name
       FROM tickets t
       JOIN trips tr ON t.trip_id = tr.id
       JOIN stations o ON tr.origin_station_id = o.id
       JOIN stations d ON tr.destination_station_id = d.id
       JOIN vehicles v ON tr.vehicle_id = v.id
       JOIN carriers c ON v.carrier_id = c.id
       WHERE t.booking_id = :bookingId
       ORDER BY t.leg_order ASC`,
      { bookingId }
    );

    return mapBookingToResponse(b, ticketsRes.rows);
  } finally {
    await conn.close();
  }
}

module.exports = {
  createBooking,
  confirmBooking,
  cancelBooking,
  getUserBookings,
  getBookingById
};
