-- ═══════════════════════════════════════════════════════════════
--  BurmeseBites — Payment System Migration (FIXED)
--  Paste this into Supabase Dashboard → SQL Editor → Run
-- ═══════════════════════════════════════════════════════════════

-- Add payment columns to orders table
ALTER TABLE orders
  ADD COLUMN IF NOT EXISTS payment_method   text DEFAULT NULL,
  ADD COLUMN IF NOT EXISTS payment_status   text DEFAULT 'unpaid',
  ADD COLUMN IF NOT EXISTS payment_slip_url text DEFAULT NULL;

-- Fix policy (PostgreSQL does not support CREATE POLICY IF NOT EXISTS)
DROP POLICY IF EXISTS "Public update payment slip" ON orders;

CREATE POLICY "Public update payment slip"
  ON orders FOR UPDATE
  USING (payment_status IN ('unpaid', 'rejected'))
  WITH CHECK (true);

-- ───────────────────────────────────────────────────────────────
-- After running SQL, go to:
-- Supabase → Storage → New bucket
--   Name:   payment-slips
--   Public: ON
-- ═══════════════════════════════════════════════════════════════
