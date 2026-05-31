-- ═══════════════════════════════════════════════════════════════
--  BurmeseBites — Complete Supabase Database Schema
--  HOW TO USE:
--  1. Go to Supabase Dashboard → SQL Editor
--  2. Paste this ENTIRE file and click Run
--  ⚠️  If you already ran the old schema, run the
--      FIX_RLS_POLICIES.sql file instead (also in this folder)
-- ═══════════════════════════════════════════════════════════════

-- ─── Drop existing policies to avoid conflicts ────────────────
drop policy if exists "Public read menu"            on menu_items;
drop policy if exists "Public read gallery"         on gallery;
drop policy if exists "Public read reviews"         on reviews;
drop policy if exists "Public insert reservations"  on reservations;
drop policy if exists "Public insert orders"        on orders;
drop policy if exists "Public insert order_items"   on order_items;
drop policy if exists "Public insert reviews"       on reviews;

-- ─── 1. MENU ITEMS ───────────────────────────────────────────
create table if not exists menu_items (
  id            uuid primary key default gen_random_uuid(),
  name          text not null,
  description   text,
  price         numeric(10,2) not null,
  category      text not null,
  image_url     text,
  spicy_level   int default 0,
  is_vegetarian boolean default false,
  available     boolean default true,
  created_at    timestamptz default now()
);

-- ─── 2. RESERVATIONS ─────────────────────────────────────────
create table if not exists reservations (
  id            uuid primary key default gen_random_uuid(),
  name          text not null,
  email         text not null,
  phone         text,
  date          date not null,
  time          text not null,
  party_size    int not null,
  special_notes text,
  status        text default 'pending',
  created_at    timestamptz default now()
);

-- ─── 3. ORDERS ───────────────────────────────────────────────
create table if not exists orders (
  id            uuid primary key default gen_random_uuid(),
  customer_name text not null,
  email         text not null,
  phone         text,
  order_type    text not null,
  address       text,
  total_amount  numeric(10,2) not null,
  status        text default 'received',
  notes         text,
  created_at    timestamptz default now()
);

-- ─── 4. ORDER ITEMS ──────────────────────────────────────────
create table if not exists order_items (
  id           uuid primary key default gen_random_uuid(),
  order_id     uuid references orders(id) on delete cascade,
  menu_item_id uuid references menu_items(id),
  name         text not null,
  price        numeric(10,2) not null,
  quantity     int not null,
  created_at   timestamptz default now()
);

-- ─── 5. REVIEWS ──────────────────────────────────────────────
create table if not exists reviews (
  id          uuid primary key default gen_random_uuid(),
  name        text not null,
  rating      int not null check (rating between 1 and 5),
  comment     text not null,
  approved    boolean default false,
  created_at  timestamptz default now()
);

-- ─── 6. GALLERY ──────────────────────────────────────────────
create table if not exists gallery (
  id          uuid primary key default gen_random_uuid(),
  image_url   text not null,
  caption     text,
  category    text default 'food',
  sort_order  int default 0,
  created_at  timestamptz default now()
);

-- ═══════════════════════════════════════════════════════════════
--  ROW LEVEL SECURITY
-- ═══════════════════════════════════════════════════════════════
alter table menu_items   enable row level security;
alter table reservations enable row level security;
alter table orders       enable row level security;
alter table order_items  enable row level security;
alter table reviews      enable row level security;
alter table gallery      enable row level security;

-- ─── PUBLIC: Anyone can read menu, gallery, approved reviews ──
create policy "Public read menu_items"
  on menu_items for select using (true);

create policy "Public read gallery"
  on gallery for select using (true);

create policy "Public read approved reviews"
  on reviews for select using (approved = true);

create policy "Public read all reservations"
  on reservations for select using (true);

create policy "Public read all orders"
  on orders for select using (true);

create policy "Public read order_items"
  on order_items for select using (true);

-- ─── PUBLIC: Anyone can insert (customers placing orders) ─────
create policy "Public insert reservations"
  on reservations for insert with check (true);

create policy "Public insert orders"
  on orders for insert with check (true);

create policy "Public insert order_items"
  on order_items for insert with check (true);

create policy "Public insert reviews"
  on reviews for insert with check (true);

-- ─── AUTHENTICATED: Logged-in users (admin) full access ───────
-- menu_items: admin can insert, update, delete
create policy "Auth insert menu_items"
  on menu_items for insert
  to authenticated
  with check (true);

create policy "Auth update menu_items"
  on menu_items for update
  to authenticated
  using (true)
  with check (true);

create policy "Auth delete menu_items"
  on menu_items for delete
  to authenticated
  using (true);

-- gallery: admin can insert, update, delete
create policy "Auth insert gallery"
  on gallery for insert
  to authenticated
  with check (true);

create policy "Auth update gallery"
  on gallery for update
  to authenticated
  using (true)
  with check (true);

create policy "Auth delete gallery"
  on gallery for delete
  to authenticated
  using (true);

-- reviews: admin can update (approve) and delete
create policy "Auth update reviews"
  on reviews for update
  to authenticated
  using (true)
  with check (true);

create policy "Auth delete reviews"
  on reviews for delete
  to authenticated
  using (true);

-- reservations: admin can update status and delete
create policy "Auth update reservations"
  on reservations for update
  to authenticated
  using (true)
  with check (true);

create policy "Auth delete reservations"
  on reservations for delete
  to authenticated
  using (true);

-- orders: admin can update status
create policy "Auth update orders"
  on orders for update
  to authenticated
  using (true)
  with check (true);

create policy "Auth delete orders"
  on orders for delete
  to authenticated
  using (true);

-- order_items: authenticated can read all
create policy "Auth manage order_items"
  on order_items for all
  to authenticated
  using (true)
  with check (true);

-- ═══════════════════════════════════════════════════════════════
--  SEED DATA — Menu Items
-- ═══════════════════════════════════════════════════════════════
insert into menu_items (name, description, price, category, spicy_level, is_vegetarian) values
  -- Starters
  ('Mohinga Fritters',   'Crispy fish cake fritters served with tangy tamarind dip', 8.50, 'starters', 1, false),
  ('Samusa Thoke',       'Traditional Burmese samosa salad with crispy fritters, chickpeas & spiced dressing', 9.00, 'starters', 2, true),
  ('Laphet Thoke',       'Famous Burmese tea leaf salad with roasted nuts, dried shrimp & sesame', 10.50, 'starters', 1, false),
  ('Spring Rolls',       'Light crispy rolls filled with glass noodles & seasonal vegetables', 7.50, 'starters', 0, true),
  -- Mains
  ('Ohn No Khao Swe',    'Iconic coconut chicken noodle soup — silky, aromatic & deeply satisfying', 14.50, 'mains', 1, false),
  ('Burmese Curry Lamb', 'Slow-braised lamb in fragrant turmeric, lemongrass & ginger curry', 18.00, 'mains', 2, false),
  ('Kywe Thee Hin',      'Bamboo shoot & pork belly curry with fermented garlic paste', 16.50, 'mains', 2, false),
  ('Tofu Curry',         'Golden-fried tofu in aromatic tomato & lemongrass curry sauce', 13.50, 'mains', 1, true),
  ('Nga Tha Lauk',       'Pan-fried whole sea bass with turmeric, tamarind glaze & herb salad', 22.00, 'mains', 1, false),
  -- Noodles
  ('Mohinga',            'Burma''s beloved breakfast noodle soup — rice noodles in lemongrass fish broth', 13.00, 'noodles', 1, false),
  ('Nan Gyi Thoke',      'Thick rice noodles tossed with chicken, crispy fritters & onion', 13.50, 'noodles', 1, false),
  ('Shan Noodles',       'Flat rice noodles in light tomato broth with pork & pickled greens', 12.50, 'noodles', 0, false),
  -- Salads
  ('Ginger Salad',       'Julienned ginger with roasted sesame, peanuts, fried garlic & lime', 9.00, 'salads', 0, true),
  ('Pennywort Salad',    'Fresh pennywort leaves with sesame oil, tamarind & crispy shallots', 8.50, 'salads', 0, true),
  ('Raw Mango Salad',    'Tangy green mango with dried shrimp, chilli & toasted coconut', 9.50, 'salads', 2, false),
  -- Desserts
  ('Mont Lone Yay Paw',  'Sticky rice dumplings filled with jaggery palm sugar in warm coconut milk', 7.00, 'desserts', 0, true),
  ('Sanwin Makin',       'Semolina & coconut cake with poppy seeds, a classic Burmese sweet', 6.50, 'desserts', 0, true),
  ('Shwe Yin Aye',       'Chilled coconut milk dessert with sago pearls, jelly & fresh fruit', 7.50, 'desserts', 0, true),
  -- Drinks
  ('Fresh Sugarcane Juice', 'Cold-pressed with lime & ginger', 5.00, 'drinks', 0, true),
  ('Tamarind Cooler',    'House-made tamarind shrub, soda & fresh mint', 5.50, 'drinks', 0, true),
  ('Burmese Milk Tea',   'Strong black tea with condensed milk, Yangon-style', 4.50, 'drinks', 0, true),
  ('Young Coconut',      'Fresh whole coconut served with a straw', 6.00, 'drinks', 0, true)
on conflict do nothing;

-- ─── Seed Reviews ─────────────────────────────────────────────
insert into reviews (name, rating, comment, approved) values
  ('Sarah M.', 5, 'The Ohn No Khao Swe was absolutely incredible — rich coconut broth and so much depth. Feels like a trip to Yangon. Will be back next week!', true),
  ('James T.', 5, 'Laphet Thoke changed my life. I had never tried tea leaf salad before and now I crave it constantly. Truly unique and the service was warm and attentive.', true),
  ('Priya K.', 4, 'Beautiful atmosphere and really authentic flavors. The samusa thoke was outstanding. Loved the attention to detail in every dish.', true),
  ('David L.', 5, 'Best Burmese food outside of Myanmar. The mohinga is soul-warming perfection and the dessert selection is lovely. Highly recommend the shwe yin aye.', true),
  ('Emma R.', 4, 'Such a gem of a restaurant. The lamb curry was melt-in-your-mouth tender and the staff were so knowledgeable about the dishes. Great vegetarian options too.', true)
on conflict do nothing;

-- ─── Seed Gallery ─────────────────────────────────────────────
insert into gallery (image_url, caption, category, sort_order) values
  ('https://images.unsplash.com/photo-1569050467447-ce54b3bbc37d?w=800', 'Ohn No Khao Swe',      'food',    1),
  ('https://images.unsplash.com/photo-1547592180-85f173990554?w=800', 'Burmese Curry',          'food',    2),
  ('https://images.unsplash.com/photo-1514190051997-0f6f39ca5cde?w=800', 'Tea Leaf Salad',       'food',    3),
  ('https://images.unsplash.com/photo-1559339352-11d035aa65de?w=800', 'Restaurant Ambiance',    'ambiance',4),
  ('https://images.unsplash.com/photo-1555396273-367ea4eb4db5?w=800', 'Dining Experience',      'ambiance',5),
  ('https://images.unsplash.com/photo-1579684947550-22e945225d9a?w=800', 'Fresh Ingredients',   'food',    6),
  ('https://images.unsplash.com/photo-1585032226651-759b368d7246?w=800', 'Desserts',             'food',    7),
  ('https://images.unsplash.com/photo-1414235077428-338989a2e8c0?w=800', 'Fine Dining',          'ambiance',8)
on conflict do nothing;
