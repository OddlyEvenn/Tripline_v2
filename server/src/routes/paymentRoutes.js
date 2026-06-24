const express = require('express');
const router = express.Router();
const paymentController = require('../controllers/paymentController');
const { protect } = require('../middlewares/authMiddleware');

// Public webhook route (Stripe calls this directly, no session auth)
router.post('/webhook', paymentController.handleWebhook);

// Protected session creation
router.post('/create-session', protect, paymentController.createSession);

// Protected session manual confirmation fallback
router.post('/confirm-session', protect, paymentController.confirmSession);

module.exports = router;
