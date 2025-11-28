// server.js
require('dotenv').config();
const express = require('express');
const path = require('path');
const bodyParser = require('body-parser');
const cors = require('cors');

const app = express();
const PORT = process.env.PORT || 3000;

app.use(cors());
app.use(bodyParser.json());
app.use(express.static(path.join(__dirname, 'public')));

// product data (single product)
const PRODUCT = {
  id: 'usb-lighter-001',
  title: 'USB Electronic Lighter',
  price: 22.99,
  currency: 'USD'
};

const ORDERS = {}; // in-memory for demo

app.get('/api/product', (req, res) => {
  res.json(PRODUCT);
});

// create-payment endpoint (mock). Replace with real gateway call
app.post('/api/create-payment', (req, res) => {
  const { name, email, phone, address, paymentMethod } = req.body;
  if (!name || !email || !phone || !paymentMethod) {
    return res.status(400).json({ error: 'missing_fields' });
  }

  const orderId = `ORD-${Date.now()}`;
  const order = {
    id: orderId,
    productId: PRODUCT.id,
    amount: PRODUCT.price,
    currency: PRODUCT.currency,
    customer: { name, email, phone, address },
    paymentMethod,
    status: 'pending',
    createdAt: new Date().toISOString()
  };
  ORDERS[orderId] = order;

  if (paymentMethod === 'cod') {
    order.status = 'confirmed_cod';
    return res.json({ success: true, orderId, status: order.status, message: 'Order placed as COD' });
  }

  if (paymentMethod === 'omt') {
    order.status = 'awaiting_omt';
    return res.json({
      success: true,
      orderId,
      status: order.status,
      omtInstructions: {
        receiver: 'Your Business Name',
        receiverContact: '+961-XXXXXXXX',
        note: `OMT payment for ${orderId}`,
        amount: PRODUCT.price,
        currency: PRODUCT.currency
      }
    });
  }

  // card payments (mock hosted page)
  const mockRedirect = `${process.env.BASE_URL || `http://localhost:${PORT}`}/thankyou.html?order=${orderId}&method=card`;
  order.status = 'awaiting_card';
  return res.json({ success: true, orderId, redirect_url: mockRedirect });
});

// get order (admin debug)
app.get('/api/order/:id', (req, res) => {
  const id = req.params.id;
  if (!ORDERS[id]) return res.status(404).json({ error: 'not_found' });
  res.json(ORDERS[id]);
});

// fallback to index
app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

app.listen(PORT, () => {
  console.log(`Server listening on ${PORT}`);
});
