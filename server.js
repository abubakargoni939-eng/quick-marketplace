require('dotenv').config();
const express = require('express');
const cors = require('cors');
const path = require('path');

const app = express();
app.use(cors());
app.use(express.json());
app.use('/uploads', express.static(path.join(__dirname, '..', 'uploads')));

app.use('/api/auth', require('./routes/auth'));
app.use('/api/wallet', require('./routes/wallet'));
app.use('/api/shops', require('./routes/shops'));
app.use('/api/products', require('./routes/products'));
app.use('/api/orders', require('./routes/orders'));
app.use('/api/delivery', require('./routes/delivery'));
app.use('/api/admin', require('./routes/admin'));

app.get('/', (req, res) => res.json({ status: 'Quick Marketplace API na aiki ✅' }));

const PORT = process.env.PORT || 4000;
app.listen(PORT, () => console.log(`Quick Marketplace backend yana aiki a http://localhost:${PORT}`));
