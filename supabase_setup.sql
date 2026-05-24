-- ============================================================
--  DIDSBOLT – Supabase Database Setup Script
--  Run this ONCE in the Supabase SQL Editor:
--  Dashboard → SQL Editor → New query → Paste & Run
-- ============================================================

-- 1. USERS TABLE
CREATE TABLE IF NOT EXISTS public.users (
  id                 TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
  username           TEXT UNIQUE NOT NULL,
  access_expires_at  BIGINT DEFAULT NULL,   -- Unix ms timestamp
  is_active          BOOLEAN DEFAULT TRUE,
  created_at         TIMESTAMPTZ DEFAULT NOW()
);

-- 2. ACTIVATION CODES TABLE
CREATE TABLE IF NOT EXISTS public.codes (
  id                  BIGSERIAL PRIMARY KEY,
  code                TEXT UNIQUE NOT NULL,
  days                INTEGER NOT NULL DEFAULT 1,
  is_redeemed         BOOLEAN DEFAULT FALSE,
  redeemed_by         TEXT DEFAULT NULL,
  redeemed_on_device  TEXT DEFAULT NULL,
  redeemed_at         BIGINT DEFAULT NULL,  -- Unix ms timestamp
  expires_at          BIGINT DEFAULT NULL,  -- Unix ms timestamp
  created_at          TIMESTAMPTZ DEFAULT NOW()
);

-- 3. SETTINGS TABLE (key-value store)
CREATE TABLE IF NOT EXISTS public.settings (
  key   TEXT PRIMARY KEY,
  value JSONB NOT NULL
);

-- ── Row Level Security (RLS) ──────────────────────────────────────────────────
-- IMPORTANT: The app uses the anon key, so we grant full access.
-- For production, restrict these policies to authenticated users / service roles.

ALTER TABLE public.users    ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.codes    ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.settings ENABLE ROW LEVEL SECURITY;

-- Allow anon key to read + write everything (suitable for this app's use case)
CREATE POLICY "anon_all_users"    ON public.users    FOR ALL TO anon USING (true) WITH CHECK (true);
CREATE POLICY "anon_all_codes"    ON public.codes    FOR ALL TO anon USING (true) WITH CHECK (true);
CREATE POLICY "anon_all_settings" ON public.settings FOR ALL TO anon USING (true) WITH CHECK (true);

-- ── Seed default data ─────────────────────────────────────────────────────────
INSERT INTO public.codes (code, days, is_redeemed) VALUES
  ('DIDS-FREE-PASS', 1, false),
  ('DIDS-PRO-WK99',  7, false)
ON CONFLICT (code) DO NOTHING;

INSERT INTO public.settings (key, value) VALUES
  ('app_config', '{"supportName":"DIDSBOLT","telegramLink":"https://t.me/+2347016435125","plans":[{"name":"24 Hour Pass","days":1,"price":"$5.00","priceUSD":5,"desc":"Test the algorithm accuracy","badge":null},{"name":"3 Day Pro Pass","days":3,"price":"$10.00","priceUSD":10,"desc":"Most selected package","badge":"POPULAR"},{"name":"Weekly Access Pass","days":7,"price":"$20.00","priceUSD":20,"desc":"Best value configuration","badge":"BEST VALUE"}]}'::jsonb)
ON CONFLICT (key) DO NOTHING;

-- Done! ✅
SELECT 'DIDSBOLT database ready!' AS status;
