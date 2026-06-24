// Load .env from project root — works both locally (server/src/app.js → ../../.env)
// and inside Docker (/app/src/app.js → /app/.env via path resolution)
const path = require('path');
require('dotenv').config({ path: path.resolve(__dirname, '../../.env') });
const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const cookieParser = require('cookie-parser');
const rateLimit = require('express-rate-limit');

// Initialize the app
const app = express();

// Security Middleware
app.use(helmet());

// Rate Limiting
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100, // limit each IP to 100 requests per windowMs
  message: 'Too many requests from this IP, please try again after 15 minutes'
});
app.use(limiter);

// Parse JSON bodies (except for Stripe Webhooks which need raw bodies)
app.use(express.json({
  verify: (req, res, buf) => {
    if (req.originalUrl.startsWith('/api/payment/webhook')) {
      req.rawBody = buf.toString();
    }
  }
}));

// Cookie Parser for JWT Auth
app.use(cookieParser());

// CORS configuration (matching the frontend url)
app.use(cors({
  origin: process.env.FRONTEND_URL || 'http://localhost:5173',
  credentials: true // Allow cookies to be sent
}));

// Health Check
app.get('/health', (req, res) => {
  res.status(200).json({ status: 'ok', message: 'Tripline API is running' });
});

// Import Routes
app.use('/api/auth', require('./routes/authRoutes'));
app.use('/api/admin', require('./routes/adminRoutes'));
app.use('/api/bookings', require('./routes/bookingRoutes'));
app.use('/api/payment', require('./routes/paymentRoutes'));
app.use('/api/routes', require('./routes/routeRoutes'));
app.use('/api/search', require('./routes/searchRoutes'));
app.use('/api/seats', require('./routes/seatRoutes'));
app.use('/api/stations', require('./routes/stationRoutes'));
app.use('/api/tickets', require('./routes/ticketRoutes'));

// Global Error Handler
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(err.status || 500).json({
    error: err.message || 'Internal Server Error'
  });
});

let PORT = process.env.PORT || 8080;
if (process.platform === 'win32' && PORT === '1521') {
  PORT = 8080;
}

const { initDb } = require('./config/db');
const { initRedis } = require('./config/redis');

initDb()
  .then(() => initRedis())
  .then(() => {
    app.listen(PORT, () => {
      console.log(`Server is running on port ${PORT}`);
    });
  });
