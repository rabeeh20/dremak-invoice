import nodemailer from 'nodemailer';
import crypto from 'crypto';
import jwt from 'jsonwebtoken';

const allowedEmails = (process.env.ALLOWED_EMAILS || '')
  .split(',').map(e => e.trim().toLowerCase()).filter(Boolean);

const transporter = nodemailer.createTransport({
  service: 'gmail',
  auth: { user: process.env.GMAIL_USER, pass: process.env.GMAIL_APP_PASSWORD },
});

export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', process.env.CLIENT_ORIGIN || '*');
  res.setHeader('Access-Control-Allow-Credentials', 'true');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  if (req.method === 'OPTIONS') return res.status(200).end();
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method Not Allowed' });

  const { email } = req.body;
  if (!email || typeof email !== 'string') {
    return res.status(400).json({ error: 'Email is required' });
  }

  const normalizedEmail = email.trim().toLowerCase();

  // Allowlist check
  if (allowedEmails.length > 0 && !allowedEmails.includes(normalizedEmail)) {
    return res.status(403).json({ error: 'This email is not authorized to access this application.' });
  }

  // Generate 6-digit OTP
  const otp = crypto.randomInt(100000, 999999).toString();

  // ── Stateless approach: embed OTP in a short-lived signed JWT ─────────────
  // This way verify-otp.js doesn't need shared server state — it just verifies
  // the JWT signature and extracts the OTP from it.
  const otpToken = jwt.sign(
    { email: normalizedEmail, otp },
    process.env.JWT_SECRET,
    { expiresIn: '5m' } // OTP valid for 5 minutes
  );

  try {
    await transporter.sendMail({
      from: `"Dremak Caterers" <${process.env.GMAIL_USER}>`,
      to: email,
      subject: 'Your Dremak Invoice Login Code',
      html: `
        <div style="font-family:Arial,sans-serif;max-width:480px;margin:0 auto;padding:32px;background:#f8fafc;border-radius:12px;">
          <div style="text-align:center;margin-bottom:24px;">
            <h2 style="color:#1e40af;margin:0;">Dremak Invoice Generator</h2>
            <p style="color:#64748b;margin:6px 0 0;">Secure Login</p>
          </div>
          <div style="background:white;border-radius:10px;padding:28px;border:1px solid #e2e8f0;">
            <p style="color:#334155;margin:0 0 20px;">Your one-time login code is:</p>
            <div style="font-size:40px;font-weight:bold;letter-spacing:12px;color:#1e40af;background:#eff6ff;padding:20px;text-align:center;border-radius:8px;border:2px dashed #bfdbfe;">${otp}</div>
            <p style="color:#94a3b8;font-size:13px;margin:20px 0 0;text-align:center;">⏱ Expires in <strong>5 minutes</strong>. Do not share.</p>
          </div>
          <p style="color:#94a3b8;font-size:11px;text-align:center;margin-top:24px;">If you didn't request this, ignore this email.</p>
        </div>
      `,
    });

    // Return the signed OTP token to the client — stored in React state only
    return res.status(200).json({ success: true, otpToken });
  } catch (err) {
    console.error('Email error:', err);
    return res.status(500).json({ error: 'Failed to send OTP email. Check GMAIL_APP_PASSWORD in Vercel env vars.' });
  }
}
