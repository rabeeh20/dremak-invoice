import jwt from 'jsonwebtoken';

export default function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', process.env.CLIENT_ORIGIN || '*');
  res.setHeader('Access-Control-Allow-Credentials', 'true');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  if (req.method === 'OPTIONS') return res.status(200).end();
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method Not Allowed' });

  const { otpToken, otp } = req.body;
  if (!otpToken || !otp) {
    return res.status(400).json({ error: 'OTP token and code are required' });
  }

  let decoded;
  try {
    // Verify the OTP token (signed in send-otp.js with same JWT_SECRET)
    decoded = jwt.verify(otpToken, process.env.JWT_SECRET);
  } catch (err) {
    if (err.name === 'TokenExpiredError') {
      return res.status(400).json({ error: 'OTP has expired. Please request a new code.' });
    }
    return res.status(400).json({ error: 'Invalid OTP token. Please request a new code.' });
  }

  // Compare the submitted OTP against the one embedded in the token
  if (decoded.otp !== otp.trim()) {
    return res.status(400).json({ error: 'Invalid code. Please try again.' });
  }

  // ✅ OTP correct — issue session JWT as httpOnly cookie
  const authToken = jwt.sign(
    { email: decoded.email },
    process.env.JWT_SECRET,
    { expiresIn: '8h' }
  );

  const isProd = process.env.NODE_ENV === 'production';
  res.setHeader(
    'Set-Cookie',
    `auth_token=${authToken}; HttpOnly; ${isProd ? 'Secure; ' : ''}SameSite=${isProd ? 'Strict' : 'Lax'}; Path=/; Max-Age=${8 * 60 * 60}`
  );

  return res.status(200).json({ success: true, email: decoded.email });
}
