import jwt from 'jsonwebtoken';

const otpStore = global._otpStore || (global._otpStore = new Map());

export default function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', process.env.CLIENT_ORIGIN || '*');
  res.setHeader('Access-Control-Allow-Credentials', 'true');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  if (req.method === 'OPTIONS') return res.status(200).end();
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method Not Allowed' });

  const { email, otp } = req.body;
  if (!email || !otp) return res.status(400).json({ error: 'Email and OTP are required' });

  const normalizedEmail = email.trim().toLowerCase();
  const record = otpStore.get(normalizedEmail);

  if (!record) return res.status(400).json({ error: 'No OTP found. Please request a new code.' });
  if (Date.now() > record.expiresAt) {
    otpStore.delete(normalizedEmail);
    return res.status(400).json({ error: 'OTP has expired. Please request a new code.' });
  }
  if (record.attempts >= 5) {
    otpStore.delete(normalizedEmail);
    return res.status(400).json({ error: 'Too many failed attempts. Please request a new code.' });
  }
  if (record.otp !== otp.trim()) {
    record.attempts += 1;
    return res.status(400).json({ error: `Invalid code. ${5 - record.attempts} attempt(s) remaining.` });
  }

  otpStore.delete(normalizedEmail);

  const token = jwt.sign({ email: normalizedEmail }, process.env.JWT_SECRET, { expiresIn: '8h' });

  const isProd = process.env.NODE_ENV === 'production';
  res.setHeader('Set-Cookie',
    `auth_token=${token}; HttpOnly; ${isProd ? 'Secure; ' : ''}SameSite=${isProd ? 'Strict' : 'Lax'}; Path=/; Max-Age=${8 * 60 * 60}`
  );

  return res.status(200).json({ success: true, email: normalizedEmail });
}
