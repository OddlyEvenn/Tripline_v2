const { getConnection } = require('../config/db');
const { generateTicketPdf } = require('../utils/pdfGenerator');

async function downloadTicket(req, res, next) {
  const conn = await getConnection();
  try {
    const id = parseInt(req.params.id, 10);
    const userEmail = req.user.email;

    // Fetch ticket details
    const ticketRes = await conn.execute(
      `SELECT t.id, t.passenger_name, t.seat_number, t.coach_number, t.seat_class, t.berth_type, t.qr_code,
              tr.departure_time, tr.arrivalTime as arrival_time, tr.transport_mode,
              o.city AS origin_city, d.city AS dest_city,
              b.id AS booking_id, u.email AS user_email
       FROM tickets t
       JOIN bookings b ON t.booking_id = b.id
       JOIN users u ON b.user_id = u.id
       JOIN trips tr ON t.trip_id = tr.id
       JOIN stations o ON tr.origin_station_id = o.id
       JOIN stations d ON tr.destination_station_id = d.id
       WHERE t.id = :id`,
      [id]
    );

    if (ticketRes.rows.length === 0) {
      return res.status(404).json({ error: 'Ticket not found' });
    }

    const t = ticketRes.rows[0];

    // Security Check: Only the booking owner can download the ticket
    if (t.USER_EMAIL !== userEmail) {
      return res.status(400).json({ error: 'Access denied' });
    }

    if (!t.QR_CODE) {
      return res.status(400).json({ error: 'Ticket is not yet confirmed or QR code is missing' });
    }

    // Format dates for display on PDF
    const formatDate = (dateStr) => {
      const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
      const d = new Date(dateStr);
      return `${d.getDate()} ${months[d.getMonth()]} ${d.getFullYear()}`;
    };

    const formatTime = (dateStr) => {
      const d = new Date(dateStr);
      let hours = d.getHours();
      const minutes = String(d.getMinutes()).padStart(2, '0');
      const ampm = hours >= 12 ? 'PM' : 'AM';
      hours = hours % 12;
      hours = hours ? hours : 12;
      return `${hours}:${minutes} ${ampm}`;
    };

    const pdfData = {
      ticketId: t.ID,
      passengerName: t.PASSENGER_NAME,
      seatNumber: t.SEAT_NUMBER,
      coachNumber: t.COACH_NUMBER,
      seatClass: t.SEAT_CLASS,
      berthType: t.BERTH_TYPE,
      qrCode: t.QR_CODE,
      originCity: t.ORIGIN_CITY,
      destinationCity: t.DEST_CITY,
      departureTime: `${formatDate(t.DEPARTURE_TIME)} at ${formatTime(t.DEPARTURE_TIME)}`,
      arrivalTime: `${formatDate(t.ARRIVAL_TIME)} at ${formatTime(t.ARRIVAL_TIME)}`,
      transportMode: t.TRANSPORT_MODE,
      bookingId: t.BOOKING_ID
    };

    const pdfBuffer = await generateTicketPdf(pdfData);

    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', `attachment; filename=ticket_${id}.pdf`);
    res.status(200).send(pdfBuffer);
  } catch (err) {
    next(err);
  } finally {
    await conn.close();
  }
}

module.exports = {
  downloadTicket
};
