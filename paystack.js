// Ainihin haɗi zuwa Paystack (https://paystack.com/nigeria) don karɓar kuɗi na gaske.
// Ka yi rajista a Paystack, ka samu Secret Key, ka sa a .env → PAYSTACK_SECRET_KEY
const fetch = require('node-fetch');

const BASE = 'https://api.paystack.co';

function headers() {
  return {
    Authorization: `Bearer ${process.env.PAYSTACK_SECRET_KEY}`,
    'Content-Type': 'application/json'
  };
}

// Fara top-up na wallet: dawo da link da kostoma/dila/delivery zai biya a Paystack
async function initializeTopup(email, amountNaira, metadata) {
  const res = await fetch(`${BASE}/transaction/initialize`, {
    method: 'POST',
    headers: headers(),
    body: JSON.stringify({
      email,
      amount: amountNaira * 100, // Paystack yana amfani da kobo
      metadata
    })
  });
  return res.json(); // ya dawo da { data: { authorization_url, reference, ... } }
}

// Bayan Paystack ya tabbatar, a tabbatar a nan kafin a ƙara wallet (kada a amince da frontend kai tsaye)
async function verifyTransaction(reference) {
  const res = await fetch(`${BASE}/transaction/verify/${reference}`, {
    headers: headers()
  });
  return res.json();
}

module.exports = { initializeTopup, verifyTransaction };
