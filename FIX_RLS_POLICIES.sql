-- ═══════════════════════════════════════════════════════════════
--  BurmeseBites — FIX RLS POLICIES
--  Run this if you already set up the database and just need
--  to fix the "row-level security policy" errors in admin.
--
--  Go to: Supabase Dashboard → SQL Editor → paste & Run
-- ═══════════════════════════════════════════════════════════════

-- ─── Drop old incomplete policies ────────────────────────────
drop policy if exists "Public read menu"            on menu_items;
drop policy if exists "Public read gallery"         on gallery;
drop policy if exists "Public read reviews"         on reviews;
drop policy if exists "Public insert reservations"  on reservations;
drop policy if exists "Public insert orders"        on orders;
drop policy if exists "Public insert order_items"   on order_items;
drop policy if exists "Public insert reviews"       on reviews;

-- ─── PUBLIC read policies ────────────────────────────────────
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

-- ─── PUBLIC insert (customers) ───────────────────────────────
create policy "Public insert reservations"
  on reservations for insert with check (true);

create policy "Public insert orders"
  on orders for insert with check (true);

create policy "Public insert order_items"
  on order_items for insert with check (true);

create policy "Public insert reviews"
  on reviews for insert with check (true);

-- ─── AUTHENTICATED (admin) full access ───────────────────────

-- menu_items
create policy "Auth insert menu_items"
  on menu_items for insert to authenticated with check (true);

create policy "Auth update menu_items"
  on menu_items for update to authenticated using (true) with check (true);

create policy "Auth delete menu_items"
  on menu_items for delete to authenticated using (true);

-- gallery
create policy "Auth insert gallery"
  on gallery for insert to authenticated with check (true);

create policy "Auth update gallery"
  on gallery for update to authenticated using (true) with check (true);

create policy "Auth delete gallery"
  on gallery for delete to authenticated using (true);

-- reviews
create policy "Auth update reviews"
  on reviews for update to authenticated using (true) with check (true);

create policy "Auth delete reviews"
  on reviews for delete to authenticated using (true);

-- reservations
create policy "Auth update reservations"
  on reservations for update to authenticated using (true) with check (true);

create policy "Auth delete reservations"
  on reservations for delete to authenticated using (true);

-- orders
create policy "Auth update orders"
  on orders for update to authenticated using (true) with check (true);

create policy "Auth delete orders"
  on orders for delete to authenticated using (true);

-- order_items
create policy "Auth manage order_items"
  on order_items for all to authenticated using (true) with check (true);

-- ─── Done! ───────────────────────────────────────────────────
-- All admin features (add/edit/delete menu, approve reviews,
-- update orders, manage reservations, manage gallery) now work.
