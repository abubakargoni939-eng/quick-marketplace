# Quick Marketplace — Backend (na gaske)

Wannan ainihin server ne (Node.js/Express) tare da database na gaske (SQLite), da haɗi zuwa:
- **Termii** don aika OTP ta SMS na gaske
- **Paystack** don karɓar kuɗi na gaske (wallet top-up)

## Mataki-mataki don fara amfani (a kwamfutarka)

1. Sauke Node.js (idan ba ka da shi ba): https://nodejs.org
2. Buɗe terminal a cikin wannan folder (`backend`), sannan:
   ```
   npm install
   cp .env.example .env
   ```
3. Buɗe `.env` ka saka ainihin keys ɗinka:
   - `TERMII_API_KEY` — samu daga https://termii.com (bayan ka yi rajista, akwai free credit don gwaji)
   - `PAYSTACK_SECRET_KEY` — samu daga https://paystack.com/nigeria (test key na farko, sannan live key idan ka shirya)
   - `JWT_SECRET` — kowace kalma ta sirri, mai tsawo
4. Fara server:
   ```
   npm start
   ```
5. Server zai yi aiki a `http://localhost:4000`

**Lura:** idan ba ka saka TERMII_API_KEY ba tukuna, OTP zai bayyana a terminal console kawai (don gwaji na gida) maimakon a aika ta SMS na gaske.

## Don mutane su iya amfani da app ɗin a ko'ina (ba kwamfutarka kaɗai ba)

Sai ka **tura (deploy)** wannan backend zuwa hosting, misali:
- **Render.com** (mafi sauƙi, akwai free tier) — https://render.com
- **Railway.app** — https://railway.app

Bayan ka tura shi, za ka samu URL kamar `https://quickmarket-api.onrender.com` — wannan shine link ɗin da mobile app ko website ɗin zai yi magana da shi.

## Menene ya rage don a kammala cikakken app

1. ✅ Backend (wannan) — ainihin API don duk ayyukan da muka tsara
2. ⬜ **Frontend na gaske da ya haɗu da wannan backend** — HTML/app ɗin da muka gina a baya yana amfani da bayanai na wucin gadi (demo); dole a canja shi ya yi magana da wannan API maimakon localStorage
3. ⬜ **Cloudinary** don ainihin ajiye hotuna (a maimakon ajiye a diski na server)
4. ⬜ **Mobile app na gaske** (Flutter ko React Native) idan kana son a sami app a Play Store/App Store, ba yanar gizo kaɗai ba
5. ⬜ **GPS tracking na gaske** don delivery (Google Maps API)

## API Endpoints (taƙaitaccen jeri)

- `POST /api/auth/send-otp` `{phone}`
- `POST /api/auth/verify-otp` `{phone, code, role}` → dawo da token
- `GET /api/wallet` (auth) → balance
- `POST /api/wallet/topup/start` `{email, amount}` → Paystack link
- `POST /api/shops/create` (dila) → ana rage shop_fee daga wallet
- `POST /api/products` (dila, multipart image) `{name, dilaPrice}` → ya ƙididdige customerPrice
- `GET /api/products` → duk kayayyaki (kostoma)
- `POST /api/orders` (kostoma) `{productId, distance}` → ya raba kuɗi ta atomatik
- `GET /api/delivery/jobs` (delivery) → ayyukan da suke jira
- `POST /api/delivery/jobs/:id/accept` (delivery) → 50/50 split
- `GET/PATCH /api/admin/settings` (admin) → kashe/kunna komai
