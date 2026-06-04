# HOW TO INSTALL — Step by Step

The zip contains a `src/` folder that matches your project structure exactly.
Copy files like this:

## Method A — Finder (drag & drop)
1. Open the zip — you'll see a `src/` folder
2. Open your project folder in another Finder window
3. Drag the `src/` folder from the zip INTO your project folder
4. Click "Replace" when asked
5. Also copy `ADD_PAYMENT_COLUMNS.sql` to your project root

## Method B — Terminal
```bash
# Unzip to a temp folder first
unzip payment_feature_v3.zip -d /tmp/payment_update

# Then copy into your project (replace YOUR_PROJECT_PATH)
cp -r /tmp/payment_update/src/* /path/to/BurmeseBites_BurmeseResturantWeb/src/
cp /tmp/payment_update/ADD_PAYMENT_COLUMNS.sql /path/to/BurmeseBites_BurmeseResturantWeb/
```

## After copying files — RESTART VITE
```bash
# Stop the server (Ctrl+C in terminal), then:
rm -rf node_modules/.vite
npm run dev
```

## Verify the file landed correctly
Make sure these files exist:
- src/components/shared/CartSidebar.jsx  ✓
- src/components/shared/CartSidebar.css  ✓
- src/components/admin/AdminOrders.jsx   ✓
- src/components/admin/AdminPayments.css ✓
- src/lib/supabase.js                    ✓
