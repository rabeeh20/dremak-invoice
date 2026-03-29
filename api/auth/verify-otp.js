import jwt from 'jsonwebtoken';

// Helper: build a secure Set-Cookie string
function buildCookie(name, value, options = {}) {
  const parts = [`${name}=${value}`];
  if (options.maxAge) parts.push(`Max-Age=${options.maxAge}`);
  if (options.expires) parts.push(`Expires=${options.expires.toUTCString()}`);
  parts.push('Path=/');
  parts.push('HttpOnly');
  if (options.secure) parts.push('Secure');
  parts.push(`SameSite=${options.sameSite || 'Lax'}`);
  return parts.join('; ');
}

export default function handler(req, res) {
  // Detect HTTPS via Vercel's forwarded header (more reliable than NODE_ENV)
  const isHttps = req.headers['x-forwarded-proto'] === 'https';
  const origin = req.headers.origin || process.env.CLIENT_ORIGIN || '';

  // Never set Access-Control-Allow-Origin to * when using credentials
  if (origin) res.setHeader('Access-Control-Allow-Origin', origin);
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
    decoded = jwt.verify(otpToken, process.env.JWT_SECRET);
  } catch (err) {
    if (err.name === 'TokenExpiredError') {
      return res.status(400).json({ error: 'OTP has expired. Please request a new code.' });
    }
    return res.status(400).json({ error: 'Invalid OTP token. Please request a new code.' });
  }

  if (decoded.otp !== otp.trim()) {
    return res.status(400).json({ error: 'Invalid code. Please try again.' });
  }

  // ✅ OTP correct — issue 30-day session JWT
  const SESSION_DAYS = 30;
  const SESSION_SECONDS = SESSION_DAYS * 24 * 60 * 60;

  const authToken = jwt.sign(
    { email: decoded.email },
    process.env.JWT_SECRET,
    { expiresIn: `${SESSION_DAYS}d` }
  );

  const expires = new Date(Date.now() + SESSION_SECONDS * 1000);

  res.setHeader('Set-Cookie', buildCookie('auth_token', authToken, {
    maxAge: SESSION_SECONDS,
    expires,
    secure: isHttps, // uses x-forwarded-proto — works correctly on Vercel
    sameSite: 'Lax', // Lax: safe for our use case, compatible with bookmarks/links
  }));

  return res.status(200).json({ success: true, email: decoded.email });
}
