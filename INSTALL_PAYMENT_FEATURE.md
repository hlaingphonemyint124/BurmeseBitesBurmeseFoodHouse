# Payment Feature — Install Guide

## ① Run the SQL (fix included — old file had a syntax error)

1. Open Supabase Dashboard → SQL Editor
2. Paste and run **ADD_PAYMENT_COLUMNS.sql** (this file, same folder)
3. You should see: `Success. No rows returned`

## ② Create Storage Bucket

1. Supabase Dashboard → **Storage** (left sidebar)
2. Click **New bucket**
3. Name: `payment-slips`
4. Toggle **Public bucket** → ON
5. Click **Save**

## ③ Replace files in your project

Copy these files into your project (same paths):

```
src/
  components/
    shared/
      CartSidebar.jsx        ← replace
      CartSidebar.css        ← replace
    admin/
      AdminOrders.jsx        ← replace
      AdminPayments.css      ← NEW file (add it)
  lib/
    supabase.js              ← replace
```

## ④ Fix the blank screen (404 on main.jsx)

This is a **Vite dev server cache issue** — happens when files are
replaced while the server is running. Fix it:

```bash
# In your terminal, stop the dev server (Ctrl+C), then:
npm run dev
```

If still blank, try clearing Vite cache:
```bash
rm -rf node_modules/.vite
npm run dev
```

## ⑤ Add your real QR codes (optional)

Open `src/components/shared/CartSidebar.jsx` lines 13–14:
```js
const AYA_QR = "...";   // replace with your AYA Pay merchant QR URL
const KBZ_QR = "...";   // replace with your KBZ Pay merchant QR URL
```

---
Done! The payment flow is now live.
