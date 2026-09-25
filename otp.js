// Ainihin haɗi zuwa Termii (https://termii.com) don aika OTP ta SMS na gaske zuwa Nigeria.
// Ka yi rajista a Termii, ka samu API key, ka sa a .env → TERMII_API_KEY
const fetch = require('node-fetch');
const db = require('../db');

function genCode() {
  return String(Math.floor(1000 + Math.random() * 9000)); // digit 4
}

async function sendOtp(phone) {
  const code = genCode();
  const expires = new Date(Date.now() + 5 * 60 * 1000).toISOString(); // minti 5

  db.prepare('INSERT INTO otp_codes (phone, code, expires_at) VALUES (?,?,?)').run(phone, code, expires);

  if (!process.env.TERMII_API_KEY) {
    // Babu key tukuna — ana buga code a console don gwaji na gida kawai.
    console.log(`[DEV MODE - babu TERMII_API_KEY] OTP ga ${phone}: ${code}`);
    return { sent: true, dev: true };
  }

  const res = await fetch('https://api.ng.termii.com/api/sms/send', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      to: phone,
      from: process.env.TERMII_SENDER_ID || 'QuickMarket',
      sms: `Lambar tabbatarwa (OTP) na Quick Marketplace: ${code}. Baya bayarwa ga kowa.`,
      type: 'plain',
      channel: 'generic',
      api_key: process.env.TERMII_API_KEY
    })
  });
  const data = await res.json();
  return { sent: true, provider: data };
}

function verifyOtp(phone, code) {
  const row = db.prepare(
    `SELECT * FROM otp_codes WHERE phone=? AND code=? AND verified=0 ORDER BY id DESC LIMIT 1`
  ).get(phone, code);
  if (!row) return false;
  if (new Date(row.expires_at) < new Date()) return false;
  db.prepare('UPDATE otp_codes SET verified=1 WHERE id=?').run(row.id);
  return true;
}

module.exports = { sendOtp, verifyOtp };
