const express = require('express');
const db = require('../db');
const { requireAuth, requireRole } = require('../middleware/auth');

const router = express.Router();
router.use(requireAuth, requireRole('admin'));

router.get('/dashboard', (req, res) => {
  const productCount = db.prepare('SELECT COUNT(*) c FROM products').get().c;
  const orderCount = db.prepare('SELECT COUNT(*) c FROM orders').get().c;
  const admin = db.prepare(`SELECT wallet_balance FROM users WHERE role='admin' LIMIT 1`).get();
  const settings = db.prepare('SELECT * FROM admin_settings WHERE id=1').get();
  res.json({ productCount, orderCount, adminWallet: admin ? admin.wallet_balance : 0, settings });
});

router.get('/settings', (req, res) => {
  res.json(db.prepare('SELECT * FROM admin_settings WHERE id=1').get());
});

router.patch('/settings', (req, res) => {
  const allowed = ['commission_pct', 'shop_fee', 'orders_on', 'new_shops_on', 'wallet_topup_on', 'delivery_on'];
  const updates = Object.keys(req.body).filter(k => allowed.includes(k));
  if (!updates.length) return res.status(400).json({ error: 'Babu wani saiti da za a sabunta' });
  const setClause = updates.map(k => `${k} = @${k}`).join(', ');
  db.prepare(`UPDATE admin_settings SET ${setClause} WHERE id=1`).run(req.body);
  res.json(db.prepare('SELECT * FROM admin_settings WHERE id=1').get());
});

module.exports = router;
