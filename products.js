const express = require('express');
const multer = require('multer');
const path = require('path');
const db = require('../db');
const { requireAuth, requireRole } = require('../middleware/auth');

const router = express.Router();
const upload = multer({ dest: path.join(__dirname, '..', '..', 'uploads') });
// Lura: don ainihin production (misali Render/Railway), fi kyau a canja zuwa Cloudinary
// maimakon ajiye hotuna a diski na server (domin bazai dawwama ba idan aka sake tura app).

router.post('/', requireAuth, requireRole('dila'), upload.single('image'), (req, res) => {
  const shop = db.prepare('SELECT * FROM shops WHERE dila_id=?').get(req.user.id);
  if (!shop) return res.status(400).json({ error: 'Sai ka fara bude shago' });

  const { name, dilaPrice } = req.body;
  const price = parseInt(dilaPrice, 10);
  if (!name || !price || price <= 0) return res.status(400).json({ error: 'Ka shigar da suna da farashi daidai' });

  const settings = db.prepare('SELECT commission_pct FROM admin_settings WHERE id=1').get();
  const customerPrice = Math.round(price / (1 - settings.commission_pct / 100));
  const imageUrl = req.file ? `/uploads/${req.file.filename}` : null;

  const info = db.prepare(
    'INSERT INTO products (shop_id, name, dila_price, customer_price, image_url) VALUES (?,?,?,?,?)'
  ).run(shop.id, name, price, customerPrice, imageUrl);

  res.json({ id: info.lastInsertRowid, dilaPrice: price, customerPrice, commission: customerPrice - price });
});

// Duk kayayyaki - kostoma yana duba wannan
router.get('/', (req, res) => {
  const products = db.prepare(`
    SELECT p.id, p.name, p.customer_price as price, p.image_url, s.dila_id
    FROM products p JOIN shops s ON s.id = p.shop_id
    ORDER BY p.created_at DESC
  `).all();
  res.json({ products });
});

router.get('/mine', requireAuth, requireRole('dila'), (req, res) => {
  const shop = db.prepare('SELECT * FROM shops WHERE dila_id=?').get(req.user.id);
  if (!shop) return res.json({ products: [] });
  const products = db.prepare('SELECT * FROM products WHERE shop_id=? ORDER BY created_at DESC').all(shop.id);
  res.json({ products });
});

module.exports = router;
