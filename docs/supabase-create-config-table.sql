-- Create the config table used for small admin-managed settings such as pricing.
-- Run this in Supabase SQL Editor before using /api/admin/pricing.

CREATE TABLE IF NOT EXISTS public.config (
  key text PRIMARY KEY,
  value text NOT NULL
);

COMMENT ON TABLE public.config IS 'Simple key/value settings for admin-managed app configuration.';

INSERT INTO public.config (key, value)
VALUES
  ('unlockFeeCents', '100'),
  ('centsPerMinute', '10')
ON CONFLICT (key) DO NOTHING;
