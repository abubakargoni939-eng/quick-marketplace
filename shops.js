const express = require('express');
const db = require('../db');
const { requireAuth, requireRole } = require('../middleware/auth');

const router = express.Router();

router.post('/create', requireAuth, requireRole('dila'), (req, res) => {
  const settings = db.prepare('SELECT * FROM admin_settings WHERE id=1').get();
  if (!settings.new_shops_on) return res.status(403).json({ error: 'Admin ya kashe bude sabbin shago a yanzu' });

  const existing = db.prepare('SELECT * FROM shops WHERE dila_id=?').get(req.user.id);
  if (existing) return res.status(400).json({ error: 'Ka riga ka bude shago' });

  const user = db.prepare('SELECT wallet_balance FROM users WHERE id=?').get(req.user.id);
  if (user.wallet_balance < settings.shop_fee) {
    return res.status(400).json({ error: 'Wallet bai isa ba', needed: settings.shop_fee, have: user.wallet_balance });
  }

  const tx = db.transaction(() => {
    db.prepare('UPDATE users SET wallet_balance = wallet_balance - ? WHERE id=?').run(settings.shop_fee, req.user.id);
    const admin = db.prepare(`SELECT id FROM users WHERE role='admin' LIMIT 1`).get();
    if (admin) db.prepare('UPDATE users SET wallet_balance = wallet_balance + ? WHERE id=?').run(settings.shop_fee, admin.id);
    return db.prepare('INSERT INTO shops (dila_id, fee_paid) VALUES (?,?)').run(req.user.id, settings.shop_fee);
  });
  const info = tx();
  res.json({ shopId: info.lastInsertRowid, feePaid: settings.shop_fee });
});

router.get('/mine', requireAuth, requireRole('dila'), (req, res) => {
  const shop = db.prepare('SELECT * FROM shops WHERE dila_id=?').get(req.user.id);
  res.json({ shop: shop || null });
});

module.exports = router;
