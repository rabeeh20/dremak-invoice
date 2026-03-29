import jwt from 'jsonwebtoken';

export default function handler(req, res) {
  const isHttps = req.headers['x-forwarded-proto'] === 'https';
  const origin = req.headers.origin || process.env.CLIENT_ORIGIN || '';
  if (origin) res.setHeader('Access-Control-Allow-Origin', origin);
  res.setHeader('Access-Control-Allow-Credentials', 'true');
  res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  if (req.method === 'OPTIONS') return res.status(200).end();
  if (req.method !== 'GET') return res.status(405).json({ error: 'Method Not Allowed' });

  try {
    const cookieHeader = req.headers.cookie || '';
    const match = cookieHeader.match(/auth_token=([^;]+)/);
    if (!match) return res.status(401).json({ error: 'Unauthorized' });
    const user = jwt.verify(match[1], process.env.JWT_SECRET);
    return res.status(200).json({ email: user.email });
  } catch (err) {
    return res.status(401).json({ error: 'Session expired. Please log in again.' });
  }
}
