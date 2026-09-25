// SQLite database — na gaske, ana ajiye bayanai a file (quickmarket.db) har abada.
// Idan kana son database mafi girma (Postgres/MySQL) don production, tuntube ni in sauya wannan file kawai.
const Database = require('better-sqlite3');
const path = require('path');

const db = new Database(path.join(__dirname, '..', '..', 'quickmarket.db'));
db.pragma('journal_mode = WAL');

db.exec(`
CREATE TABLE IF NOT EXISTS users (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  phone TEXT UNIQUE NOT NULL,
  role TEXT NOT NULL CHECK(role IN ('dila','kostoma','delivery','admin')),
  wallet_balance INTEGER NOT NULL DEFAULT 0,
  created_at TEXT DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS otp_codes (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  phone TEXT NOT NULL,
  code TEXT NOT NULL,
  expires_at TEXT NOT NULL,
  verified INTEGER NOT NULL DEFAULT 0,
  created_at TEXT DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS shops (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  dila_id INTEGER NOT NULL REFERENCES users(id),
  fee_paid INTEGER NOT NULL,
  created_at TEXT DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS products (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  shop_id INTEGER NOT NULL REFERENCES shops(id),
  name TEXT NOT NULL,
  dila_price INTEGER NOT NULL,
  customer_price INTEGER NOT NULL,
  image_url TEXT,
  created_at TEXT DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS orders (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  kostoma_id INTEGER NOT NULL REFERENCES users(id),
  product_id INTEGER NOT NULL REFERENCES products(id),
  price INTEGER NOT NULL,
  status INTEGER NOT NULL DEFAULT 0, -- 0=an karɓa,1=ana shiryawa,2=ana kaiwa,3=an kai
  distance TEXT NOT NULL CHECK(distance IN ('near','far')),
  eta TEXT NOT NULL,
  created_at TEXT DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS delivery_jobs (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  order_id INTEGER NOT NULL REFERENCES orders(id),
  delivery_id INTEGER REFERENCES users(id),
  fee INTEGER NOT NULL,
  accepted INTEGER NOT NULL DEFAULT 0,
  completed INTEGER NOT NULL DEFAULT 0,
  created_at TEXT DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS admin_settings (
  id INTEGER PRIMARY KEY CHECK(id=1),
  commission_pct INTEGER NOT NULL DEFAULT 15,
  shop_fee INTEGER NOT NULL DEFAULT 500,
  orders_on INTEGER NOT NULL DEFAULT 1,
  new_shops_on INTEGER NOT NULL DEFAULT 1,
  wallet_topup_on INTEGER NOT NULL DEFAULT 1,
  delivery_on INTEGER NOT NULL DEFAULT 1
);
INSERT OR IGNORE INTO admin_settings (id) VALUES (1);

CREATE TABLE IF NOT EXISTS wallet_transactions (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  user_id INTEGER NOT NULL REFERENCES users(id),
  amount INTEGER NOT NULL,
  type TEXT NOT NULL,
  reference TEXT,
  created_at TEXT DEFAULT CURRENT_TIMESTAMP
);
`);

module.exports = db;
