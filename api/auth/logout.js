export default function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', process.env.CLIENT_ORIGIN || '*');
  res.setHeader('Access-Control-Allow-Credentials', 'true');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  if (req.method === 'OPTIONS') return res.status(200).end();
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method Not Allowed' });

  const isProd = process.env.NODE_ENV === 'production';
  res.setHeader('Set-Cookie',
    `auth_token=; HttpOnly; ${isProd ? 'Secure; ' : ''}SameSite=${isProd ? 'Strict' : 'Lax'}; Path=/; Max-Age=0`
  );

  return res.status(200).json({ success: true });
}
