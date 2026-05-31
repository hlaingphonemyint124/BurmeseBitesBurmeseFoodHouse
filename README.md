# 🍜 BurmeseBites — Authentic Myanmar Restaurant Website

Professional restaurant website built with **React + Vite + Supabase**.

---

## ⚡ Setup in 4 Steps

### Step 1 — Install dependencies
```bash
npm install
```

### Step 2 — Add your Supabase credentials
Open the `.env.local` file (already in this folder) and fill in your two values:

```
VITE_SUPABASE_URL=https://xxxxxxxxxxxxxx.supabase.co
VITE_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI...
```

**Where to find them:**
1. Go to → [https://supabase.com](https://supabase.com)
2. Open your project
3. Click **Settings** → **API**
4. Copy **Project URL** → paste as `VITE_SUPABASE_URL`
5. Copy **anon / public** key → paste as `VITE_SUPABASE_ANON_KEY`

### Step 3 — Set up your database
1. In Supabase → go to **SQL Editor**
2. Paste the entire contents of `supabase_schema.sql`
3. Click **Run** — this creates all tables and seeds sample data

### Step 4 — Start the app
```bash
npm run dev
```
Open → **http://localhost:5173**

---

## 👤 Admin Access

Your admin email is: **hlaingphonemyint20@gmail.com**

1. Go to `/auth` in the browser
2. Create an account using that email
3. You'll automatically get admin access
4. Visit `/admin` or click **Admin Dashboard** in the navbar dropdown

To add more admin emails, edit `src/lib/AuthContext.jsx` line 7.

---

## 🚀 Commands

| Command | Description |
|---|---|
| `npm install` | Install all dependencies |
| `npm run dev` | Start dev server → http://localhost:5173 |
| `npm run build` | Build for production |
| `npm run preview` | Preview production build locally |

---

## ✨ Features

- 🏠 Hero homepage with animated slider
- 🍽️ Full menu with categories, search & filters
- 🛒 Online ordering cart (login required to checkout)
- 📅 Table reservation with time slots
- 🖼️ Photo gallery with lightbox
- ⭐ Guest reviews with ratings
- 📖 About us / our story page
- 👤 User profiles — order history, reservations, settings
- 🛠️ Full admin dashboard:
  - Menu CRUD + CSV bulk import
  - Order management with status pipeline
  - Reservation management
  - Review approval workflow
  - Gallery with local file upload
