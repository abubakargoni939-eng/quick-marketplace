const express = require('express');
const db = require('../db');
const { requireAuth, requireRole } = require('../middleware/auth');

const router = express.Router();

router.get('/jobs', requireAuth, requireRole('delivery'), (req, res) => {
  const jobs = db.prepare(`
    SELECT dj.*, p.name as item FROM delivery_jobs dj
    JOIN orders o ON o.id = dj.order_id
    JOIN products p ON p.id = o.product_id
    WHERE dj.accepted = 0
  `).all();
  res.json({ jobs });
});

router.post('/jobs/:id/accept', requireAuth, requireRole('delivery'), (req, res) => {
  const job = db.prepare('SELECT * FROM delivery_jobs WHERE id=?').get(req.params.id);
  if (!job || job.accepted) return res.status(400).json({ error: 'Ba a samu aikin ba ko an riga an karɓa' });

  const half = Math.round(job.fee / 2); // 50% delivery, 50% app — kamar yadda aka bukata
  const tx = db.transaction(() => {
    db.prepare('UPDATE delivery_jobs SET accepted=1, delivery_id=? WHERE id=?').run(req.user.id, job.id);
    db.prepare('UPDATE users SET wallet_balance = wallet_balance + ? WHERE id=?').run(half, req.user.id);
    const admin = db.prepare(`SELECT id FROM users WHERE role='admin' LIMIT 1`).get();
    if (admin) db.prepare('UPDATE users SET wallet_balance = wallet_balance + ? WHERE id=?').run(half, admin.id);
  });
  tx();
  res.json({ success: true, earned: half });
});

module.exports = router;
