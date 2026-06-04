# BurmeseBites — Complete Project Setup

## First time setup

Open Terminal in VS Code (or any terminal) and run:

```bash
npm install
npm run dev
```

Then open http://localhost:5173

## If the site is blank / shows 404 error

Run these commands one by one:

```bash
rm -rf node_modules package-lock.json
npm install
npm run dev
```

## Payment feature SQL

1. Open Supabase Dashboard → SQL Editor
2. Paste and run: ADD_PAYMENT_COLUMNS.sql
3. Go to Storage → Create bucket named "payment-slips" → set Public ON

## Environment variables

Make sure your .env.local file has:
```
VITE_SUPABASE_URL=https://xxxx.supabase.co
VITE_SUPABASE_ANON_KEY=eyJ...
```
