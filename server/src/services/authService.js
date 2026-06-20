const bcrypt = require('bcrypt');
const crypto = require('crypto');
const { getConnection } = require('../config/db');
const { generateToken, clearToken } = require('../utils/jwt');
const emailService = require('./emailService');

/**
 * Register User and Send OTP
 */
async function register(name, email, password, phoneNumber, role, res) {
  const conn = await getConnection();

  try {
    // 1. Check if user already exists
    const checkUser = await conn.execute(
      'SELECT id FROM users WHERE email = :email',
      [email]
    );

    if (checkUser.rows.length > 0) {
      const err = new Error('An account with this email already exists');
      err.status = 409;
      throw err;
    }

    // 2. Generate 6-digit OTP
    const otp = Math.floor(100000 + Math.random() * 900000).toString();
    const otpExpiry = new Date(Date.now() + 10 * 60 * 1000); // 10 minutes from now

    // 3. Hash Password
    const hashedPassword = await bcrypt.hash(password, 10);

    // 4. Save to Database
    await conn.execute(
      `INSERT INTO users (name, email, password, phone_number, role, is_verified, verification_otp, otp_expiry)
       VALUES (:name, :email, :password, :phoneNumber, :role, 0, :otp, :otpExpiry)`,
      {
        name,
        email,
        password: hashedPassword,
        phoneNumber,
        role: role.toUpperCase(),
        otp,
        otpExpiry
      }
    );

    await conn.commit();

    // 5. Send Verification Email
    await emailService.sendVerificationOtp(email, name, otp);

    return {
      message: 'Registration successful. Please verify your email with the OTP sent.'
    };
  } catch (err) {
    await conn.rollback();
    throw err;
  } finally {
    await conn.close();
  }
}

/**
 * Verify Email using OTP and issue cookie tokens
 */
async function verifyEmail(email, otp, res) {
  const conn = await getConnection();

  try {
    const result = await conn.execute(
      'SELECT id, name, email, role, is_verified, verification_otp, otp_expiry FROM users WHERE email = :email',
      [email]
    );

    if (result.rows.length === 0) {
      const err = new Error('User not found');
      err.status = 404;
      throw err;
    }

    const user = result.rows[0];

    if (user.IS_VERIFIED === 1) {
      const err = new Error('Email is already verified');
      err.status = 400;
      throw err;
    }

    if (!user.VERIFICATION_OTP || user.VERIFICATION_OTP !== otp) {
      const err = new Error('Invalid OTP');
      err.status = 400;
      throw err;
    }

    if (new Date() > new Date(user.OTP_EXPIRY)) {
      const err = new Error('OTP has expired');
      err.status = 400;
      throw err;
    }

    // Update user verification status
    await conn.execute(
      'UPDATE users SET is_verified = 1, verification_otp = NULL, otp_expiry = NULL WHERE id = :id',
      [user.ID]
    );

    await conn.commit();

    // Issue Token Cookies
    generateToken(res, user.EMAIL, user.ROLE);

    return {
      id: user.ID,
      name: user.NAME,
      email: user.EMAIL,
      role: user.ROLE,
      message: 'Email verified successfully'
    };
  } catch (err) {
    await conn.rollback();
    throw err;
  } finally {
    await conn.close();
  }
}

/**
 * Login User
 */
async function login(email, password, res) {
  const conn = await getConnection();

  try {
    const result = await conn.execute(
      'SELECT id, name, email, password, role, is_verified FROM users WHERE email = :email',
      [email]
    );

    if (result.rows.length === 0) {
      const err = new Error('User not found');
      err.status = 404;
      throw err;
    }

    const user = result.rows[0];

    // Check Verification Status
    if (user.IS_VERIFIED === 0) {
      const otp = Math.floor(100000 + Math.random() * 900000).toString();
      const otpExpiry = new Date(Date.now() + 10 * 60 * 1000);

      await conn.execute(
        'UPDATE users SET verification_otp = :otp, otp_expiry = :otpExpiry WHERE id = :id',
        { otp, otpExpiry, id: user.ID }
      );

      await conn.commit();

      await emailService.sendVerificationOtp(user.EMAIL, user.NAME, otp);

      const err = new Error('Please verify your email. A fresh OTP has been sent to your email.');
      err.status = 400;
      throw err;
    }

    // Verify Password
    const isMatch = await bcrypt.compare(password, user.PASSWORD);
    if (!isMatch) {
      const err = new Error('Invalid credentials');
      err.status = 401;
      throw err;
    }

    // Issue Token Cookies
    generateToken(res, user.EMAIL, user.ROLE);

    return {
      id: user.ID,
      name: user.NAME,
      email: user.EMAIL,
      role: user.ROLE,
      message: 'Login successful'
    };
  } catch (err) {
    await conn.rollback();
    throw err;
  } finally {
    await conn.close();
  }
}

/**
 * Logout User
 */
function logout(res) {
  clearToken(res);
}

/**
 * Get Current Logged-in User
 */
async function getMe(email) {
  const conn = await getConnection();

  try {
    const result = await conn.execute(
      'SELECT id, name, email, role FROM users WHERE email = :email',
      [email]
    );

    if (result.rows.length === 0) {
      const err = new Error('User not found');
      err.status = 404;
      throw err;
    }

    const user = result.rows[0];
    return {
      id: user.ID,
      name: user.NAME,
      email: user.EMAIL,
      role: user.ROLE
    };
  } finally {
    await conn.close();
  }
}

/**
 * Forgot Password
 */
async function forgotPassword(email) {
  const conn = await getConnection();

  try {
    const result = await conn.execute(
      'SELECT id, name, email FROM users WHERE email = :email',
      [email]
    );

    if (result.rows.length === 0) {
      const err = new Error('No account found with this email address');
      err.status = 404;
      throw err;
    }

    const user = result.rows[0];
    const token = crypto.randomUUID();
    const expiry = new Date(Date.now() + 60 * 60 * 1000); // 1 hour from now

    await conn.execute(
      'UPDATE users SET password_reset_token = :token, password_reset_token_expiry = :expiry WHERE id = :id',
      { token, expiry, id: user.ID }
    );

    await conn.commit();

    await emailService.sendPasswordResetEmail(user.EMAIL, user.NAME, token);
  } catch (err) {
    await conn.rollback();
    throw err;
  } finally {
    await conn.close();
  }
}

/**
 * Reset Password
 */
async function resetPassword(token, newPassword) {
  const conn = await getConnection();

  try {
    const result = await conn.execute(
      'SELECT id, password_reset_token_expiry FROM users WHERE password_reset_token = :token',
      [token]
    );

    if (result.rows.length === 0) {
      const err = new Error('Invalid or expired reset token');
      err.status = 400;
      throw err;
    }

    const user = result.rows[0];

    if (new Date() > new Date(user.PASSWORD_RESET_TOKEN_EXPIRY)) {
      const err = new Error('Password reset token has expired');
      err.status = 400;
      throw err;
    }

    const hashedPassword = await bcrypt.hash(newPassword, 10);

    await conn.execute(
      `UPDATE users 
       SET password = :password, password_reset_token = NULL, password_reset_token_expiry = NULL 
       WHERE id = :id`,
      { password: hashedPassword, id: user.ID }
    );

    await conn.commit();
  } catch (err) {
    await conn.rollback();
    throw err;
  } finally {
    await conn.close();
  }
}

/**
 * Update Profile
 */
async function updateProfile(email, name, phoneNumber) {
  const conn = await getConnection();

  try {
    const result = await conn.execute(
      'SELECT id FROM users WHERE email = :email',
      [email]
    );

    if (result.rows.length === 0) {
      const err = new Error('User not found');
      err.status = 404;
      throw err;
    }

    const user = result.rows[0];

    // Build update dynamic values
    let sql = 'UPDATE users SET ';
    const params = { id: user.ID };
    const updates = [];

    if (name) {
      updates.push('name = :name');
      params.name = name;
    }
    if (phoneNumber) {
      updates.push('phone_number = :phoneNumber');
      params.phoneNumber = phoneNumber;
    }

    if (updates.length === 0) {
      return getMe(email);
    }

    sql += updates.join(', ') + ' WHERE id = :id';

    await conn.execute(sql, params);
    await conn.commit();

    return getMe(email);
  } catch (err) {
    await conn.rollback();
    throw err;
  } finally {
    await conn.close();
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
