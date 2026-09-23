# Quick Marketplace 4.0

Real Supabase-backed marketplace foundation: authentication, email OTP, customer accounts, shop-owner shop/product management, per-item commission, minimum order, real orders, stock, delivery assignments, delivery routes, admin settings, and optional Paystack server initialization.

## Render
Build: npm install
Start: npm start
Root Directory: blank
Environment: SUPABASE_URL, SUPABASE_PUBLISHABLE_KEY
Optional payment: PAYSTACK_PUBLIC_KEY, PAYSTACK_SECRET_KEY

## Supabase
Run `supabase-migration.sql` first. Existing RLS must permit the intended customer/shop-owner/delivery operations. Never put a service-role key in the browser.
