const express = require('express');
const db = require('../db');
const { requireAuth, requireRole } = require('../middleware/auth');

const router = express.Router();

router.post('/', requireAuth, requireRole('kostoma'), (req, res) => {
  const settings = db.prepare('SELECT * FROM admin_settings WHERE id=1').get();
  if (!settings.orders_on) return res.status(403).json({ error: 'Admin ya kashe karɓar sabbin oda a yanzu' });

  const { productId, distance } = req.body; // distance: 'near' | 'far'
  const product = db.prepare('SELECT * FROM products WHERE id=?').get(productId);
  if (!product) return res.status(404).json({ error: 'Ba a samu kaya ba' });

  const buyer = db.prepare('SELECT * FROM users WHERE id=?').get(req.user.id);
  if (buyer.wallet_balance < product.customer_price) {
    return res.status(400).json({ error: 'Wallet bai isa ba' });
  }

  const shop = db.prepare('SELECT * FROM shops WHERE id=?').get(product.shop_id);
  const commAmt = product.customer_price - product.dila_price;
  const eta = distance === 'near' ? '20-30 minti' : '3-4 kwana';

  const tx = db.transaction(() => {
    db.prepare('UPDATE users SET wallet_balance = wallet_balance - ? WHERE id=?').run(product.customer_price, buyer.id);
    db.prepare('UPDATE users SET wallet_balance = wallet_balance + ? WHERE id=?').run(product.dila_price, shop.dila_id);
    const admin = db.prepare(`SELECT id FROM users WHERE role='admin' LIMIT 1`).get();
    if (admin) db.prepare('UPDATE users SET wallet_balance = wallet_balance + ? WHERE id=?').run(commAmt, admin.id);

    const info = db.prepare(
      'INSERT INTO orders (kostoma_id, product_id, price, distance, eta) VALUES (?,?,?,?,?)'
    ).run(buyer.id, product.id, product.customer_price, distance, eta);

    if (settings.delivery_on) {
      const deliveryFee = Math.round(product.customer_price * 0.05); // misali: 5% na farashi a matsayin kuɗin delivery
      db.prepare('INSERT INTO delivery_jobs (order_id, fee) VALUES (?,?)').run(info.lastInsertRowid, deliveryFee);
    }
    return info;
  });
  const info = tx();
  res.json({ orderId: info.lastInsertRowid, eta });
});

router.get('/mine', requireAuth, requireRole('kostoma'), (req, res) => {
  const orders = db.prepare(`
    SELECT o.*, p.name as item FROM orders o JOIN products p ON p.id = o.product_id
    WHERE o.kostoma_id=? ORDER BY o.created_at DESC
  `).all(req.user.id);
  res.json({ orders });
});

// Delivery ko dila zai iya sabunta matsayin oda (tracking)
router.patch('/:id/status', requireAuth, requireRole('dila', 'delivery'), (req, res) => {
  const { status } = req.body; // 0-3
  db.prepare('UPDATE orders SET status=? WHERE id=?').run(status, req.params.id);
  res.json({ success: true });
});

module.exports = router;
