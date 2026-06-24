const nodemailer = require('nodemailer');

const SMTP_USER = process.env.SMTP_USER || 'highsweepsolutions@gmail.com';
const SMTP_PASS = process.env.SMTP_PASS || 'onwx aesq jewd vkez';
const SENDER_NAME = 'TripLine';
const FRONTEND_URL = process.env.FRONTEND_URL || 'http://localhost:5173';

// Create nodemailer transporter
const transporter = nodemailer.createTransport({
  service: 'gmail',
  auth: {
    user: SMTP_USER,
    pass: SMTP_PASS
  }
});

/**
 * Send email helper using Nodemailer with Gmail SMTP
 */
async function sendEmail(toEmail, toName, subject, htmlContent, attachments = null) {
  try {
    const mailOptions = {
      from: `"${SENDER_NAME}" <${SMTP_USER}>`,
      to: `"${toName}" <${toEmail}>`,
      subject: subject,
      html: htmlContent
    };

    if (attachments && attachments.length > 0) {
      mailOptions.attachments = attachments.map(att => ({
        filename: att.name,
        content: Buffer.from(att.content, 'base64'),
        contentType: 'application/pdf'
      }));
    }

    const info = await transporter.sendMail(mailOptions);
    console.log(`Email sent via Gmail SMTP to ${toEmail}: ${subject}. Message ID: ${info.messageId}`);
  } catch (err) {
    console.error(`Failed to send email to ${toEmail} via Gmail SMTP:`, err.message);
  }
}

/**
 * Send email confirmation with ticket attachments
 */
async function sendBookingConfirmation(toEmail, toName, bookingId, journeySummary, totalPrice, attachments) {
  const subject = `✈️ Your TripLine Tickets - Booking #${bookingId}`;
  const html = `
    <html><body style="font-family:Arial,sans-serif;max-width:600px;margin:auto;color:#374151;">
      <div style="background:#2563EB;color:white;padding:32px;text-align:center;border-radius:12px 12px 0 0;">
        <h1 style="margin:0;font-size:32px;letter-spacing:2px;">🗺️ TRIPLINE</h1>
        <h2 style="margin:8px 0 0;font-weight:300;">Booking Confirmed!</h2>
      </div>
      <div style="padding:32px;border:1px solid #e5e7eb;border-top:none;border-radius:0 0 12px 12px;background:#ffffff;">
        <p style="font-size:18px;">Hi <strong>${toName}</strong>,</p>
        <p>Pack your bags! Your journey <strong>#${bookingId}</strong> is officially confirmed.</p>

        <div style="background:#f9fafb;padding:20px;border-radius:12px;margin:24px 0;border:1px solid #f3f4f6;">
          <h3 style="margin-top:0;color:#111827;font-size:14px;text-transform:uppercase;letter-spacing:1px;">Journey Summary</h3>
          <pre style="white-space:pre-wrap;font-family:inherit;font-size:16px;color:#4b5563;margin:0;">${journeySummary}</pre>
        </div>

        <div style="display:flex;justify-content:space-between;align-items:center;padding:16px 0;border-top:1px solid #e5e7eb;">
          <span style="color:#6b7280;">Total Paid:</span>
          <span style="font-size:24px;font-weight:bold;color:#2563EB;">₹${totalPrice.toFixed(2)}</span>
        </div>

        <p style="margin-top:32px;font-size:14px;color:#6b7280;">
          Your electronic tickets are attached to this email as PDF files. You can also view them anytime in your dashboard.
        </p>

        <div style="text-align:center;margin-top:24px;">
          <a href="${FRONTEND_URL}/dashboard"
             style="display:inline-block;background:#2563EB;color:white;padding:14px 32px;border-radius:8px;text-decoration:none;font-weight:bold;box-shadow:0 4px 6px -1px rgba(37, 99, 235, 0.2);">
            View and Manage Booking
          </a>
        </div>
      </div>
      <div style="text-align:center;padding:24px;font-size:12px;color:#9ca3af;">
        Tripline Global Services &copy; 2026 | Safe travels!
      </div>
    </body></html>
  `;
  await sendEmail(toEmail, toName, subject, html, attachments);
}

/**
 * Send Stripe Payment receipt
 */
async function sendPaymentReceipt(toEmail, toName, bookingId, amount, transactionId) {
  const subject = `💳 Payment Receipt - Tripline Booking #${bookingId}`;
  const html = `
    <html><body style="font-family:Arial,sans-serif;max-width:600px;margin:auto;">
      <div style="background:#16a34a;color:white;padding:20px;text-align:center;border-radius:8px 8px 0 0;">
        <h1>🗺️ Tripline</h1><h2>Payment Successful</h2>
      </div>
      <div style="padding:24px;border:1px solid #e5e7eb;border-top:none;border-radius:0 0 8px 8px;">
        <p>Hi <strong>${toName}</strong>, payment for booking <strong>#${bookingId}</strong> received.</p>
        <table style="width:100%;border-collapse:collapse;margin:16px 0;">
          <tr>
            <td style="padding:8px;border:1px solid #e5e7eb;">Amount Paid</td>
            <td style="padding:8px;border:1px solid #e5e7eb;font-weight:bold;">₹${amount.toFixed(2)}</td>
          </tr>
          <tr>
            <td style="padding:8px;border:1px solid #e5e7eb;">Transaction ID</td>
            <td style="padding:8px;border:1px solid #e5e7eb;">${transactionId}</td>
          </tr>
        </table>
      </div>
    </body></html>
  `;
  await sendEmail(toEmail, toName, subject, html, null);
}

/**
 * Send OTP for verification
 */
async function sendVerificationOtp(toEmail, toName, otp) {
  console.log(`\n🔑 [DEVELOPMENT OTP] Verification code for ${toEmail}: ${otp}\n`);
  const subject = 'Verification OTP - Tripline';
  const html = `
    <html><body style="font-family:Arial,sans-serif;max-width:600px;margin:auto;">
      <div style="background:#2563EB;color:white;padding:20px;text-align:center;border-radius:8px 8px 0 0;">
        <h1>🗺️ Tripline</h1><h2>Email Verification</h2>
      </div>
      <div style="padding:24px;border:1px solid #e5e7eb;border-top:none;border-radius:0 0 8px 8px;">
        <p>Hi <strong>${toName}</strong>,</p>
        <p>Your verification OTP is:</p>
        <div style="background:#f3f4f6;padding:16px;border-radius:6px;margin:16px 0;text-align:center;">
          <h1 style="letter-spacing:8px;font-family:monospace;margin:0;color:#2563EB;">${otp}</h1>
        </div>
        <p>This code will expire in 10 minutes.</p>
      </div>
    </body></html>
  `;
  await sendEmail(toEmail, toName, subject, html, null);
}

/**
 * Send Password reset link
 */
async function sendPasswordResetEmail(toEmail, toName, token) {
  const resetLink = `${FRONTEND_URL}/reset-password?token=${token}`;
  console.log(`\n🔑 [DEVELOPMENT RESET LINK] Password reset link for ${toEmail}: ${resetLink}\n`);
  const subject = '🔐 Reset Your Tripline Password';
  const html = `
    <html><body style="font-family:Arial,sans-serif;max-width:600px;margin:auto;">
      <div style="background:#7c3aed;color:white;padding:20px;text-align:center;border-radius:8px 8px 0 0;">
        <h1>🗺️ Tripline</h1><h2>Password Reset Request</h2>
      </div>
      <div style="padding:24px;border:1px solid #e5e7eb;border-top:none;border-radius:0 0 8px 8px;">
        <p>Hi <strong>${toName}</strong>,</p>
        <p>Click below to reset your password. This link expires in 1 hour.</p>
        <a href="${resetLink}"
           style="display:inline-block;background:#7c3aed;color:white;padding:12px 24px;border-radius:6px;text-decoration:none;">
          Reset Password
        </a>
        <p style="margin-top:20px;color:#6b7280;font-size:12px;">
          Didn't request this? You can safely ignore this email.
        </p>
      </div>
    </body></html>
  `;
  await sendEmail(toEmail, toName, subject, html, null);
}

module.exports = {
  sendBookingConfirmation,
  sendPaymentReceipt,
  sendVerificationOtp,
  sendPasswordResetEmail
};
