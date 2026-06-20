const authService = require('../services/authService');

/**
 * Register a new user
 */
async function register(req, res, next) {
  try {
    const { name, email, password, phoneNumber, role } = req.body;
    if (!name || !email || !password || !role) {
      return res.status(400).json({ error: 'Name, email, password, and role are required' });
    }
    const result = await authService.register(name, email, password, phoneNumber, role, res);
    res.status(200).json(result);
  } catch (err) {
    next(err);
  }
}

/**
 * Verify user email with OTP
 */
async function verifyEmail(req, res, next) {
  try {
    const { email, otp } = req.body;
    if (!email || !otp) {
      return res.status(400).json({ error: 'Email and OTP are required' });
    }
    const result = await authService.verifyEmail(email, otp, res);
    res.status(200).json(result);
  } catch (err) {
    next(err);
  }
}

/**
 * Login user
 */
async function login(req, res, next) {
  try {
    const { email, password } = req.body;
    if (!email || !password) {
      return res.status(400).json({ error: 'Email and password are required' });
    }
    const result = await authService.login(email, password, res);
    res.status(200).json(result);
  } catch (err) {
    next(err);
  }
}

/**
 * Logout user
 */
function logout(req, res, next) {
  try {
    authService.logout(res);
    res.status(204).end();
  } catch (err) {
    next(err);
  }
}

/**
 * Get current authenticated user
 */
async function getMe(req, res, next) {
  try {
    // req.user is set by the protect middleware
    const result = await authService.getMe(req.user.email);
    res.status(200).json(result);
  } catch (err) {
    next(err);
  }
}

/**
 * Request password reset OTP
 */
async function forgotPassword(req, res, next) {
  try {
    const { email } = req.body;
    if (!email) {
      return res.status(400).json({ error: 'Email is required' });
    }
    await authService.forgotPassword(email);
    res.status(200).json({ message: 'If this email is registered, a reset link has been sent' });
  } catch (err) {
    next(err);
  }
}

/**
 * Reset password
 */
async function resetPassword(req, res, next) {
  try {
    const { token, newPassword } = req.body;
    if (!token || !newPassword) {
      return res.status(400).json({ error: 'Token and newPassword are required' });
    }
    await authService.resetPassword(token, newPassword);
    res.status(200).json({ message: 'Password reset successfully' });
  } catch (err) {
    next(err);
  }
}

/**
 * Update profile details
 */
async function updateProfile(req, res, next) {
  try {
    const { name, phoneNumber } = req.body;
    const result = await authService.updateProfile(req.user.email, name, phoneNumber);
    res.status(200).json(result);
  } catch (err) {
    next(err);
  }
}

module.exports = {
  register,
  verifyEmail,
  login,
  logout,
  getMe,
  forgotPassword,
  resetPassword,
  updateProfile
};
