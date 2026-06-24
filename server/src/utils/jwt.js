const jwt = require('jsonwebtoken');

const JWT_SECRET = process.env.JWT_SECRET || 'default_secret';
const ACCESS_TOKEN_EXPIRATION = 86400000; // 24 hours in ms
const COOKIE_NAME = 'access_token';

/**
 * Generate Access Token and set it in HTTP-only Cookie
 * @param {Response} res Express response object
 * @param {string} email User email
 * @param {string} role User role ('USER' or 'ADMIN')
 */
const generateToken = (res, email, role) => {
  const token = jwt.sign(
    { sub: email, role },
    JWT_SECRET,
    { expiresIn: '24h' }
  );

  // Set HTTP-only Cookie with JWT
  res.cookie(COOKIE_NAME, token, {
    httpOnly: true,
    secure: process.env.COOKIE_SECURE === 'true' || (process.env.NODE_ENV === 'production' && process.env.COOKIE_SECURE !== 'false'),
    sameSite: 'lax', // prevent CSRF while allowing general redirects
    maxAge: ACCESS_TOKEN_EXPIRATION
  });

  return token;
};

/**
 * Clear the access token cookie (Logout)
 * @param {Response} res Express response object
 */
const clearToken = (res) => {
  res.cookie(COOKIE_NAME, '', {
    httpOnly: true,
    expires: new Date(0),
    secure: process.env.COOKIE_SECURE === 'true' || (process.env.NODE_ENV === 'production' && process.env.COOKIE_SECURE !== 'false'),
    sameSite: 'lax'
  });
};

/**
 * Verify access token
 * @param {string} token JWT token string
 * @returns {object} Decoded payload or throws error
 */
const verifyToken = (token) => {
  return jwt.verify(token, JWT_SECRET);
};

module.exports = {
  generateToken,
  clearToken,
  verifyToken,
  COOKIE_NAME
};
