const { verifyToken, COOKIE_NAME } = require('../utils/jwt');
const { getConnection } = require('../config/db');

/**
 * Protect routes - verifies token and appends user to request object
 */
const protect = async (req, res, next) => {
  let token;

  // 1. Extract token from cookie (primary)
  if (req.cookies && req.cookies[COOKIE_NAME]) {
    token = req.cookies[COOKIE_NAME];
  } 
  // 2. Fallback: extract from authorization header
  else if (req.headers.authorization && req.headers.authorization.startsWith('Bearer ')) {
    token = req.headers.authorization.split(' ')[1];
  }

  if (!token) {
    return res.status(401).json({ error: 'Not authorized, no token provided' });
  }

  try {
    // Verify JWT token
    const decoded = verifyToken(token);
    
    // Fetch user from DB to ensure they still exist and check active status (if applicable)
    const conn = await getConnection();
    const result = await conn.execute(
      'SELECT id, name, email, role, is_verified FROM users WHERE email = :email',
      [decoded.sub]
    );
    await conn.close();

    if (result.rows.length === 0) {
      return res.status(401).json({ error: 'Not authorized, user not found' });
    }

    const user = result.rows[0];
    req.user = {
      id: user.ID,
      name: user.NAME,
      email: user.EMAIL,
      role: user.ROLE,
      isVerified: user.IS_VERIFIED === 1
    };

    next();
  } catch (err) {
    console.error('Auth verification error:', err.message);
    return res.status(401).json({ error: 'Not authorized, invalid token' });
  }
};

/**
 * Restrict routes to Admin users only
 */
const adminOnly = (req, res, next) => {
  if (req.user && req.user.role === 'ADMIN') {
    next();
  } else {
    return res.status(403).json({ error: 'Access denied, administrator role required' });
  }
};

module.exports = {
  protect,
  adminOnly
};
