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

  const isProduction = process.env.NODE_ENV === 'production';
  const isSecure = process.env.COOKIE_SECURE === 'true' || (isProduction && process.env.COOKIE_SECURE !== 'false');
  const sameSite = process.env.COOKIE_SAME_SITE || (isSecure ? 'none' : 'lax');

  // Set HTTP-only Cookie with JWT
  res.cookie(COOKIE_NAME, token, {
    httpOnly: true,
    secure: isSecure,
    sameSite: sameSite, // 'none' required for cross-domain (Vercel <-> Render)
    maxAge: ACCESS_TOKEN_EXPIRATION
  });

  return token;
};

/**
 * Clear the access token cookie (Logout)
 * @param {Response} res Express response object
 */
const clearToken = (res) => {
  const isProduction = process.env.NODE_ENV === 'production';
  const isSecure = process.env.COOKIE_SECURE === 'true' || (isProduction && process.env.COOKIE_SECURE !== 'false');
  const sameSite = process.env.COOKIE_SAME_SITE || (isSecure ? 'none' : 'lax');

  res.cookie(COOKIE_NAME, '', {
    httpOnly: true,
    expires: new Date(0),
    secure: isSecure,
    sameSite: sameSite
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
