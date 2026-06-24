const stripe = require('stripe')(process.env.STRIPE_SECRET_KEY);
const { getConnection } = require('../config/db');
const bookingService = require('./bookingService');
const emailService = require('./emailService');
const { generateTicketPdf } = require('../utils/pdfGenerator');

const STRIPE_WEBHOOK_SECRET = process.env.STRIPE_WEBHOOK_SECRET;
const FRONTEND_URL = process.env.FRONTEND_URL || 'http://localhost:5173';
const successUrl = `${FRONTEND_URL}/booking-confirmation`;
const cancelUrl = `${FRONTEND_URL}/payment-cancelled`;

/**
 * Helper to build journey summary for emails
 */
function buildJourneySummary(tickets) {
  if (!tickets || tickets.length === 0) return '';
  return tickets
    .map(t => `${t.originCity} → ${t.destinationCity} (${t.transportMode})`)
    .join('\n');
}

/**
 * Create Stripe Checkout Session
 */
async function createCheckoutSession(userEmail, bookingId, frontendUrl) {
  if (!bookingId) {
    const err = new Error('Booking ID is required');
    err.status = 400;
    throw err;
  }

  const conn = await getConnection();

  try {
    // 1. Fetch Booking and User details
    const bookingRes = await conn.execute(
      `SELECT b.id, b.total_price, b.status, u.email
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

    const booking = bookingRes.rows[0];

    // Access control
    if (booking.EMAIL !== userEmail) {
      const err = new Error('Access denied');
      err.status = 400;
      throw err;
    }

    if (booking.STATUS !== 'PENDING' && booking.STATUS !== 'PAYMENT_INITIATED') {
      const err = new Error(`This booking is not in a payable state (Current status: ${booking.STATUS})`);
      err.status = 400;
      throw err;
    }

    // Amount in minor units (paise)
    const amountInMinorUnit = Math.round(Number(booking.TOTAL_PRICE) * 100);

    console.log(`Creating Stripe session for booking ${bookingId} with amount ${amountInMinorUnit} paise`);

    // 2. Create Stripe Session
    const baseFrontendUrl = frontendUrl || FRONTEND_URL;
    const dynamicSuccessUrl = `${baseFrontendUrl}/booking-confirmation`;
    const dynamicCancelUrl = `${baseFrontendUrl}/payment-cancelled`;

    const session = await stripe.checkout.sessions.create({
      mode: 'payment',
      success_url: `${dynamicSuccessUrl}?session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: dynamicCancelUrl,
      line_items: [
        {
          quantity: 1,
          price_data: {
            currency: 'inr',
            unit_amount: amountInMinorUnit,
            product_data: {
              name: `Tripline Journey - Booking #${bookingId}`
            }
          }
        }
      ],
      metadata: {
        bookingId: String(bookingId)
      },
      customer_email: userEmail
    });

    // 3. Update Booking
    await conn.execute(
      `UPDATE bookings 
       SET stripe_session_id = :sessionId, status = 'PAYMENT_INITIATED' 
       WHERE id = :bookingId`,
      [session.id, bookingId]
    );
    await conn.commit();

    return {
      sessionId: session.id,
      url: session.url,
      sessionUrl: session.url
    };
  } catch (err) {
    await conn.rollback();
    throw err;
  } finally {
    await conn.close();
  }
}

/**
 * Handle Stripe Webhook Events
 */
async function handleWebhook(rawBody, sigHeader) {
  console.log('Received Stripe Webhook');

  let event;
  try {
    event = stripe.webhooks.constructEvent(rawBody, sigHeader, STRIPE_WEBHOOK_SECRET);
  } catch (err) {
    console.error('Stripe webhook verification failed:', err.message);
    const error = new Error('Invalid Stripe signature');
    error.status = 400;
    throw error;
  }

  console.log(`Verified Stripe Webhook event: ${event.type}`);

  try {
    if (event.type === 'checkout.session.completed') {
      const session = event.data.object;
      const bookingIdStr = session.metadata.bookingId;

      if (!bookingIdStr) {
        console.error('Stripe webhook error: bookingId missing in metadata');
        return;
      }

      const bookingId = parseInt(bookingIdStr, 10);
      const paymentIntentId = session.payment_intent;

      console.log(`Webhook checkout complete. Confirming booking ${bookingId} with PI ${paymentIntentId}`);
      await processBookingConfirmationAndEmails(bookingId, paymentIntentId);
    }
  } catch (webhookProcessingErr) {
    console.error('Webhook processing error (swallowed to prevent Stripe loop retry):', webhookProcessingErr.message);
  }
}

/**
 * Internal helper to confirm booking and send emails.
 * Idempotent: checks booking status first inside confirmBooking.
 */
async function processBookingConfirmationAndEmails(bookingId, paymentIntentId) {
  // 1. Confirm Booking (Updates seats & generates QR code)
  await bookingService.confirmBooking(bookingId, paymentIntentId);

  // 2. Fetch booking details to compile PDF and send email
  const conn = await getConnection();
  try {
    const bookingRes = await conn.execute(
      `SELECT b.id, b.total_price, u.name, u.email
       FROM bookings b
       JOIN users u ON b.user_id = u.id
       WHERE b.id = :bookingId`,
      [bookingId]
    );

    if (bookingRes.rows.length > 0) {
      const b = bookingRes.rows[0];

      // Fetch confirmed tickets with details
      const ticketsRes = await conn.execute(
        `SELECT t.id, t.passenger_name, t.seat_number, t.coach_number, t.seat_class, t.berth_type, t.qr_code,
                tr.departure_time, tr.arrivalTime as arrival_time, tr.transport_mode,
                o.city AS origin_city, d.city AS dest_city,
                c.name AS carrier_name
         FROM tickets t
         JOIN trips tr ON t.trip_id = tr.id
         JOIN stations o ON tr.origin_station_id = o.id
         JOIN stations d ON tr.destination_station_id = d.id
         JOIN vehicles v ON tr.vehicle_id = v.id
         JOIN carriers c ON v.carrier_id = c.id
         WHERE t.booking_id = :bookingId`,
        [bookingId]
      );

      const tickets = ticketsRes.rows.map(t => ({
        id: t.ID,
        passengerName: t.PASSENGER_NAME,
        seatNumber: t.SEAT_NUMBER,
        coachNumber: t.COACH_NUMBER,
        seatClass: t.SEAT_CLASS,
        berthType: t.BERTH_TYPE,
        qrCode: t.QR_CODE,
        originCity: t.ORIGIN_CITY,
        destinationCity: t.DEST_CITY,
        departureTime: t.DEPARTURE_TIME,
        arrivalTime: t.ARRIVAL_TIME,
        transportMode: t.TRANSPORT_MODE,
        carrierName: t.CARRIER_NAME,
        bookingId
      }));

      const ticketAttachments = [];
      for (const ticket of tickets) {
        try {
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
            ticketId: ticket.id,
            passengerName: ticket.passengerName,
            seatNumber: ticket.seatNumber,
            coachNumber: ticket.coachNumber,
            seatClass: ticket.seatClass,
            berthType: ticket.berthType,
            qrCode: ticket.qrCode,
            originCity: ticket.originCity,
            destinationCity: ticket.destinationCity,
            departureTime: `${formatDate(ticket.departureTime)} at ${formatTime(ticket.departureTime)}`,
            arrivalTime: `${formatDate(ticket.arrivalTime)} at ${formatTime(ticket.arrivalTime)}`,
            transportMode: ticket.transportMode,
            bookingId
          };

          const pdfBuffer = await generateTicketPdf(pdfData);
          ticketAttachments.push({
            content: pdfBuffer.toString('base64'),
            name: `Ticket_${ticket.id}.pdf`
          });
        } catch (pdfErr) {
          console.error(`Failed to generate PDF for ticket ${ticket.id} in email dispatch:`, pdfErr.message);
        }
      }

      const journeySummary = buildJourneySummary(tickets);

      // Send confirmation email with PDF attachments
      await emailService.sendBookingConfirmation(
        b.EMAIL,
        b.NAME,
        bookingId,
        journeySummary,
        Number(b.TOTAL_PRICE),
        ticketAttachments
      ).catch(e => console.error('Error sending confirmation email:', e.message));

      // Send invoice / payment receipt email
      await emailService.sendPaymentReceipt(
        b.EMAIL,
        b.NAME,
        bookingId,
        Number(b.TOTAL_PRICE),
        paymentIntentId
      ).catch(e => console.error('Error sending receipt email:', e.message));
    }
  } finally {
    await conn.close();
  }
}

/**
 * Retrieve Stripe Session and confirm booking manually (fallback / immediate sync)
 */
async function confirmSession(sessionId) {
  if (!sessionId) {
    const err = new Error('Session ID is required');
    err.status = 400;
    throw err;
  }

  // Retrieve session from Stripe
  const session = await stripe.checkout.sessions.retrieve(sessionId);
  if (!session) {
    const err = new Error('Stripe session not found');
    err.status = 404;
    throw err;
  }

  if (session.payment_status !== 'paid') {
    const err = new Error('Payment not completed for this session');
    err.status = 400;
    throw err;
  }

  const bookingIdStr = session.metadata.bookingId;
  if (!bookingIdStr) {
    const err = new Error('Booking ID missing in session metadata');
    err.status = 400;
    throw err;
  }

  const bookingId = parseInt(bookingIdStr, 10);
  const paymentIntentId = session.payment_intent;

  // Confirm booking and send emails (idempotent, won't duplicate)
  await processBookingConfirmationAndEmails(bookingId, paymentIntentId);

  // Retrieve and return booking details
  const conn = await getConnection();
  try {
    const bookingRes = await conn.execute(
      `SELECT b.id, b.total_price, b.status
       FROM bookings b
       WHERE b.id = :bookingId`,
      [bookingId]
    );
    if (bookingRes.rows.length === 0) {
      throw new Error('Booking not found in DB');
    }
    const booking = bookingRes.rows[0];
    return {
      bookingId: booking.ID,
      totalPrice: Number(booking.TOTAL_PRICE),
      status: booking.STATUS
    };
  } finally {
    await conn.close();
  }
}

module.exports = {
  createCheckoutSession,
  handleWebhook,
  confirmSession
};
