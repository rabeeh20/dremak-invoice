# Dremak Invoice Generator

A React + Vite web application for generating professional catering invoices with integrated Razorpay payment links for **Dremak Caterers**.

## Features
- Generate printable PDF invoices
- Auto-generate Razorpay payment links sent to the customer
- Catering-specific fields: event date, venue, item units (kg, g, ltr, pcs, etc.)
- INR currency formatting

## Project Structure
```
├── src/
│   └── InvoiceGenerator.jsx   # Main invoice UI component
├── api/
│   └── payment-link.js        # Vercel serverless handler (for production)
├── server.js                  # Express dev server for local API
└── vite.config.js             # Vite config with /api proxy
```

## Getting Started

### 1. Set up environment variables
```bash
cp .env.example .env
# Edit .env and add your Razorpay keys from https://dashboard.razorpay.com/app/keys
```

### 2. Install dependencies
```bash
npm install
```

### 3. Run in development (two terminals)
```bash
# Terminal 1 — Frontend
npm run dev

# Terminal 2 — Backend API
npm run server
```

Open http://localhost:5173

## Deployment (Vercel)
Push to GitHub and connect to Vercel. The `api/payment-link.js` file is automatically served as a serverless function. Set your `RAZORPAY_KEY_ID` and `RAZORPAY_KEY_SECRET` in Vercel's environment variables dashboard.
