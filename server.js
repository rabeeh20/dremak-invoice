import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import Razorpay from 'razorpay';
import nodemailer from 'nodemailer';
import jwt from 'jsonwebtoken';
import cookieParser from 'cookie-parser';
import crypto from 'crypto';

dotenv.config();

// ── Startup security validation ───────────────────────────────────────────────
if (!process.env.JWT_SECRET || process.env.JWT_SECRET.length < 32) {
  if (process.env.NODE_ENV === 'production') {
    console.error('❌ JWT_SECRET must be set and be at least 32 characters long. Exiting.');
    process.exit(1);
  } else {
    // In development, auto-generate a temporary secret so the server doesn't crash
    const tempSecret = crypto.randomBytes(32).toString('hex');
    process.env.JWT_SECRET = tempSecret;
    console.warn('⚠️  JWT_SECRET missing or too short — auto-generated a temporary one for this session.');
    console.warn('   Set a permanent JWT_SECRET in .env for sessions to persist across restarts.');
  }
}
if (!process.env.GMAIL_APP_PASSWORD) {
  console.warn('⚠️  GMAIL_APP_PASSWORD not set — OTP emails will fail');
}

const app = express();
const PORT = process.env.PORT || 3001;

// ── Allowed emails allowlist ──────────────────────────────────────────────────
const allowedEmails = (process.env.ALLOWED_EMAILS || '')
  .split(',')
  .map((e) => e.trim().toLowerCase())
  .filter(Boolean);

// ── In-memory OTP store ───────────────────────────────────────────────────────
// Structure: email -> { otp, expiresAt, attempts, lastSentAt, sendCount }
const otpStore = new Map();

// Purge expired OTPs every minute
setInterval(() => {
  const now = Date.now();
  for (const [email, record] of otpStore.entries()) {
    if (now > record.expiresAt) otpStore.delete(email);
  }
}, 60_000);

// ── Nodemailer (Gmail SMTP) ───────────────────────────────────────────────────
const transporter = nodemailer.createTransport({
  service: 'gmail',
  auth: {
    user: process.env.GMAIL_USER,
    pass: process.env.GMAIL_APP_PASSWORD,
  },
});

// ── Middleware ────────────────────────────────────────────────────────────────
app.use(
  cors({
    origin: process.env.CLIENT_ORIGIN || 'http://localhost:5173',
    credentials: true, // required for cookies to be sent cross-origin
  })
);
app.use(express.json());
app.use(cookieParser());

// ── Auth middleware ───────────────────────────────────────────────────────────
const requireAuth = (req, res, next) => {
  const token = req.cookies.auth_token;
  if (!token) return res.status(401).json({ error: 'Unauthorized' });
  try {
    req.user = jwt.verify(token, process.env.JWT_SECRET);
    next();
  } catch {
    res.clearCookie('auth_token');
    return res.status(401).json({ error: 'Session expired. Please log in again.' });
  }
};

// ── POST /api/auth/send-otp ───────────────────────────────────────────────────
app.post('/api/auth/send-otp', async (req, res) => {
  const { email } = req.body;
  if (!email || typeof email !== 'string') {
    return res.status(400).json({ error: 'Email is required' });
  }

  const normalizedEmail = email.trim().toLowerCase();

  // Allowlist check — intentionally vague message to avoid enumeration
  if (allowedEmails.length > 0 && !allowedEmails.includes(normalizedEmail)) {
    return res.status(403).json({ error: 'This email is not authorized to access this application.' });
  }

  // Rate limit: max 3 OTP sends per 10 minutes per email
  const existing = otpStore.get(normalizedEmail);
  const now = Date.now();
  const RATE_WINDOW = 10 * 60 * 1000; // 10 minutes
  if (existing && existing.sendCount >= 3 && existing.lastSentAt > now - RATE_WINDOW) {
    const waitSecs = Math.ceil((existing.lastSentAt + RATE_WINDOW - now) / 1000);
    return res.status(429).json({ error: `Too many attempts. Please wait ${waitSecs} seconds.` });
  }

  // Generate cryptographically secure 6-digit OTP
  const otp = crypto.randomInt(100000, 999999).toString();
  const expiresAt = now + 5 * 60 * 1000; // 5 minutes TTL

  otpStore.set(normalizedEmail, {
    otp,
    expiresAt,
    attempts: 0,
    lastSentAt: now,
    sendCount: (existing?.sendCount || 0) + 1,
  });

  try {
    await transporter.sendMail({
      from: `"Dremak Caterers" <${process.env.GMAIL_USER}>`,
      to: email,
      subject: 'Your Dremak Invoice Login Code',
      html: `
        <div style="font-family: 'Arial', sans-serif; max-width: 480px; margin: 0 auto; padding: 32px; background: #f8fafc; border-radius: 12px;">
          <div style="text-align: center; margin-bottom: 24px;">
            <h2 style="color: #1e40af; margin: 0; font-size: 22px;">Dremak Invoice Generator</h2>
            <p style="color: #64748b; margin: 6px 0 0;">Secure Login</p>
          </div>
          <div style="background: white; border-radius: 10px; padding: 28px; border: 1px solid #e2e8f0;">
            <p style="color: #334155; margin: 0 0 20px;">Your one-time login code is:</p>
            <div style="font-size: 40px; font-weight: bold; letter-spacing: 12px; color: #1e40af; background: #eff6ff; padding: 20px; text-align: center; border-radius: 8px; border: 2px dashed #bfdbfe;">
              ${otp}
            </div>
            <p style="color: #94a3b8; font-size: 13px; margin: 20px 0 0; text-align: center;">
              ⏱ This code expires in <strong>5 minutes</strong>.<br/>
              Do not share this code with anyone.
            </p>
          </div>
          <p style="color: #94a3b8; font-size: 11px; text-align: center; margin-top: 24px;">
            If you did not request this code, please ignore this email.
          </p>
        </div>
      `,
    });

    return res.status(200).json({ success: true });
  } catch (err) {
    console.error('Email send error:', err);
    otpStore.delete(normalizedEmail);
    return res.status(500).json({ error: 'Failed to send OTP. Please check server email configuration.' });
  }
});

// ── POST /api/auth/verify-otp ─────────────────────────────────────────────────
app.post('/api/auth/verify-otp', (req, res) => {
  const { email, otp } = req.body;
  if (!email || !otp) {
    return res.status(400).json({ error: 'Email and OTP are required' });
  }

  const normalizedEmail = email.trim().toLowerCase();
  const record = otpStore.get(normalizedEmail);

  if (!record) {
    return res.status(400).json({ error: 'No OTP found. Please request a new code.' });
  }
  if (Date.now() > record.expiresAt) {
    otpStore.delete(normalizedEmail);
    return res.status(400).json({ error: 'OTP has expired. Please request a new code.' });
  }
  // Max 5 wrong attempts before invalidating
  if (record.attempts >= 5) {
    otpStore.delete(normalizedEmail);
    return res.status(400).json({ error: 'Too many failed attempts. Please request a new code.' });
  }
  if (record.otp !== otp.trim()) {
    record.attempts += 1;
    const remaining = 5 - record.attempts;
    return res.status(400).json({ error: `Invalid code. ${remaining} attempt(s) remaining.` });
  }

  // ✅ OTP valid — delete immediately (single-use)
  otpStore.delete(normalizedEmail);

  const token = jwt.sign({ email: normalizedEmail }, process.env.JWT_SECRET, { expiresIn: '8h' });

  res.cookie('auth_token', token, {
    httpOnly: true, // not accessible via JS — XSS protection
    secure: process.env.NODE_ENV === 'production', // HTTPS only in prod
    sameSite: process.env.NODE_ENV === 'production' ? 'strict' : 'lax',
    maxAge: 8 * 60 * 60 * 1000, // 8 hours
  });

  return res.status(200).json({ success: true, email: normalizedEmail });
});

// ── GET /api/auth/me ──────────────────────────────────────────────────────────
app.get('/api/auth/me', requireAuth, (req, res) => {
  return res.status(200).json({ email: req.user.email });
});

// ── POST /api/auth/logout ─────────────────────────────────────────────────────
app.post('/api/auth/logout', (req, res) => {
  res.clearCookie('auth_token', {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: process.env.NODE_ENV === 'production' ? 'strict' : 'lax',
  });
  return res.status(200).json({ success: true });
});

// ── POST /api/payment-link (protected) ───────────────────────────────────────
app.post('/api/payment-link', requireAuth, async (req, res) => {
  const { amount, customerName, customerPhone, customerEmail, description, invoiceNumber } = req.body;

  if (!amount || amount <= 0) {
    return res.status(400).json({ error: 'Valid amount is required' });
  }

  try {
    const razorpay = new Razorpay({
      key_id: process.env.RAZORPAY_KEY_ID,
      key_secret: process.env.RAZORPAY_KEY_SECRET,
    });

    const paymentLinkRequest = {
      amount: Math.round(amount * 100),
      currency: 'INR',
      accept_partial: false,
      description: `Payment for Invoice ${invoiceNumber || ''} - ${description || 'Catering Services'}`,
      customer: {
        name: customerName || 'Customer',
        email: customerEmail || 'customer@example.com',
        contact: customerPhone || '',
      },
      notify: { sms: true, email: true },
      reminder_enable: true,
      notes: { invoice_number: invoiceNumber || '' },
    };

    const paymentLink = await razorpay.paymentLink.create(paymentLinkRequest);
    return res.status(200).json({ success: true, paymentLink: paymentLink.short_url, id: paymentLink.id });
  } catch (error) {
    console.error('Razorpay Error:', error);
    return res.status(500).json({ error: 'Failed to generate payment link', details: error.message || error });
  }
});

app.listen(PORT, () => {
  console.log(`✅ Dremak Invoice API server running on http://localhost:${PORT}`);
});
