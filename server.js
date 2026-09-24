import express from 'express';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const app = express();
const PORT = process.env.PORT || 3000;
const PUBLIC_DIR = path.join(__dirname, 'public');

app.use(express.json({ limit: '1mb' }));

app.get('/config.js', (_req, res) => {
  res.set('Cache-Control', 'no-store');
  res.type('application/javascript').send(`window.QM=${JSON.stringify({
    url: process.env.SUPABASE_URL || '',
    key: process.env.SUPABASE_PUBLISHABLE_KEY || process.env.SUPABASE_ANON_KEY || '',
    paystackPublicKey: process.env.PAYSTACK_PUBLIC_KEY || ''
  })};`);
});

app.get('/api/health', (_req, res) => {
  res.json({ ok: true, app: 'Quick Marketplace', version: '4.1' });
});

app.post('/api/paystack/initialize', async (req, res) => {
  try {
    if (!process.env.PAYSTACK_SECRET_KEY) {
      return res.status(503).json({ error: 'Paystack is not configured on the server.' });
    }

    const { email, amount, reference, callback_url, metadata } = req.body || {};
    const naira = Number(amount);

    if (!email || !Number.isFinite(naira) || naira <= 0 || !reference) {
      return res.status(400).json({ error: 'email, amount and reference are required.' });
    }

    const response = await fetch('https://api.paystack.co/transaction/initialize', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${process.env.PAYSTACK_SECRET_KEY}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        email,
        amount: Math.round(naira * 100),
        reference,
        callback_url,
        metadata
      })
    });

    const data = await response.json();
    if (!response.ok || !data.status) {
      return res.status(response.status || 400).json({ error: data.message || 'Paystack initialization failed.' });
    }

    return res.json(data.data);
  } catch (error) {
    return res.status(500).json({ error: error.message || 'Payment service error.' });
  }
});

app.use(express.static(PUBLIC_DIR, { extensions: ['html'] }));
app.use((_req, res) => res.sendFile(path.join(PUBLIC_DIR, 'index.html')));

app.listen(PORT, () => console.log(`Quick Marketplace running on port ${PORT}`));
