export default function handler(req, res) {
  const isHttps = req.headers['x-forwarded-proto'] === 'https';
  const origin = req.headers.origin || process.env.CLIENT_ORIGIN || '';
  if (origin) res.setHeader('Access-Control-Allow-Origin', origin);
  res.setHeader('Access-Control-Allow-Credentials', 'true');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  if (req.method === 'OPTIONS') return res.status(200).end();
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method Not Allowed' });

  // Clear the auth cookie by setting Max-Age=0
  const securePart = isHttps ? 'Secure; ' : '';
  res.setHeader('Set-Cookie', `auth_token=; HttpOnly; ${securePart}SameSite=Lax; Path=/; Max-Age=0`);
  return res.status(200).json({ success: true });
}
