import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import Razorpay from 'razorpay';

dotenv.config();

const app = express();
const PORT = process.env.PORT || 3001;

app.use(cors());
app.use(express.json());

app.post('/api/payment-link', async (req, res) => {
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
      amount: Math.round(amount * 100), // Razorpay expects amount in paise
      currency: 'INR',
      accept_partial: false,
      description: `Payment for Invoice ${invoiceNumber || ''} - ${description || 'Catering Services'}`,
      customer: {
        name: customerName || 'Customer',
        email: customerEmail || 'customer@example.com',
        contact: customerPhone || '',
      },
      notify: {
        sms: true,
        email: true,
      },
      reminder_enable: true,
      notes: {
        invoice_number: invoiceNumber || '',
      },
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
});

app.listen(PORT, () => {
  console.log(`✅ Dremak Invoice API server running on http://localhost:${PORT}`);
});
