const express = require('express');
const db = require('../db');
const { requireAuth } = require('../middleware/auth');
const { initializeTopup, verifyTransaction } = require('../services/paystack');

const router = express.Router();

router.get('/', requireAuth, (req, res) => {
  const user = db.prepare('SELECT wallet_balance FROM users WHERE id=?').get(req.user.id);
  res.json({ balance: user.wallet_balance });
});

// Fara top-up na gaske ta Paystack
router.post('/topup/start', requireAuth, async (req, res) => {
  const { email, amount } = req.body; // amount a Naira
  if (!amount || amount <= 0) return res.status(400).json({ error: 'Ka shigar da adadin kuɗi daidai' });
  const data = await initializeTopup(email, amount, { userId: req.user.id });
  res.json(data);
});

// Bayan Paystack ya mayar da kostoma, a tabbatar sannan a ƙara wallet
router.post('/topup/verify', requireAuth, async (req, res) => {
  const { reference } = req.body;
  const result = await verifyTransaction(reference);
  if (result.data && result.data.status === 'success') {
    const amountNaira = result.data.amount / 100;
    db.prepare('UPDATE users SET wallet_balance = wallet_balance + ? WHERE id=?').run(amountNaira, req.user.id);
    db.prepare('INSERT INTO wallet_transactions (user_id, amount, type, reference) VALUES (?,?,?,?)')
      .run(req.user.id, amountNaira, 'topup', reference);
    return res.json({ success: true, amountAdded: amountNaira });
  }
  res.status(400).json({ success: false, error: 'Biyan bai tabbata ba' });
});

module.exports = router;
