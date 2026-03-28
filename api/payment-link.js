import Razorpay from 'razorpay';
import jwt from 'jsonwebtoken';

// ── Auth helper ───────────────────────────────────────────────────────────────
function getAuthenticatedUser(req) {
  try {
    const cookieHeader = req.headers.cookie || '';
    const match = cookieHeader.match(/auth_token=([^;]+)/);
    if (!match) return null;
    return jwt.verify(match[1], process.env.JWT_SECRET);
  } catch {
    return null;
  }
}

// ── Handler ───────────────────────────────────────────────────────────────────
export default async function handler(req, res) {
  // CORS headers for production
  res.setHeader('Access-Control-Allow-Origin', process.env.CLIENT_ORIGIN || '*');
  res.setHeader('Access-Control-Allow-Credentials', 'true');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') return res.status(200).end();
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method Not Allowed' });
  }

  // ── JWT Auth check ────────────────────────────────────────────────────────
  const user = getAuthenticatedUser(req);
  if (!user) {
    return res.status(401).json({ error: 'Unauthorized. Please log in.' });
  }

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
      amount: Math.round(amount * 100), // paise
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

    return res.status(200).json({
      success: true,
      paymentLink: paymentLink.short_url,
      id: paymentLink.id,
    });
  } catch (error) {
    console.error('Razorpay Error:', error);
    return res.status(500).json({
      error: 'Failed to generate payment link',
      details: error.message || error,
    });
  }
}
