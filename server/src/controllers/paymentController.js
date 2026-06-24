const paymentService = require('../services/paymentService');

async function createSession(req, res, next) {
  try {
    const { bookingId } = req.body;
    if (!bookingId) {
      return res.status(400).json({ error: 'Booking ID is required' });
    }

    const email = req.user.email;

    // Dynamically resolve frontend origin to avoid hardcoded localhost redirects
    let origin = req.get('origin');
    if (!origin && req.get('referer')) {
      try {
        const refUrl = new URL(req.get('referer'));
        origin = refUrl.origin;
      } catch (e) {
        // ignore malformed referer URLs
      }
    }
    if (!origin) {
      origin = process.env.FRONTEND_URL || 'http://localhost:5173';
    }

    const result = await paymentService.createCheckoutSession(email, parseInt(bookingId, 10), origin);
    res.status(200).json(result);
  } catch (err) {
    next(err);
  }
}

async function handleWebhook(req, res, next) {
  try {
    const sigHeader = req.headers['stripe-signature'];
    const payload = req.rawBody; // Populated by verify callback in express.json inside app.js

    if (!sigHeader || !payload) {
      return res.status(400).json({ error: 'Stripe signature and payload are required' });
    }

    await paymentService.handleWebhook(payload, sigHeader);
    // Always return 200 to Stripe to prevent retries
    res.status(200).end();
  } catch (err) {
    // Log error, but return 200 so Stripe stops retrying
    console.error('Webhook error:', err.message);
    res.status(200).end();
  }
}

async function confirmSession(req, res, next) {
  try {
    const { sessionId } = req.body;
    if (!sessionId) {
      return res.status(400).json({ error: 'Session ID is required' });
    }
    const result = await paymentService.confirmSession(sessionId);
    res.status(200).json(result);
  } catch (err) {
    next(err);
  }
}

module.exports = {
  createSession,
  handleWebhook,
  confirmSession
};
