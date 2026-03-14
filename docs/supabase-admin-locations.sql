-- Multiple admin accounts with separate credentials and location-scoped stations.
-- Run in Supabase SQL Editor (Dashboard → SQL Editor).
--
-- 1. Locations table (skip if you already have one).
--    If you already have public.locations (e.g. UW Seattle, Downtown, Capitol Hill), do not run the INSERT below.
--    Just run the ALTER TABLEs in steps 2 and 3 to add location_id to stations and profiles.
CREATE TABLE IF NOT EXISTS public.locations (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  created_at timestamptz DEFAULT now()
);

-- 2. Link stations to a location. NULL = legacy (visible to super admins only).
ALTER TABLE public.stations
  ADD COLUMN IF NOT EXISTS location_id uuid REFERENCES public.locations(id) ON DELETE SET NULL;

CREATE INDEX IF NOT EXISTS idx_stations_location_id ON public.stations(location_id);

-- 3. Link admins to a location and allow super admin (sees all).
-- role = 'admin' is still required; location_id restricts which stations they manage.
-- is_super_admin = true OR location_id IS NULL → can see and manage all stations.
ALTER TABLE public.profiles
  ADD COLUMN IF NOT EXISTS location_id uuid REFERENCES public.locations(id) ON DELETE SET NULL,
  ADD COLUMN IF NOT EXISTS is_super_admin boolean NOT NULL DEFAULT false;

CREATE INDEX IF NOT EXISTS idx_profiles_location_id ON public.profiles(location_id);

COMMENT ON COLUMN public.profiles.location_id IS 'Admin only: which location this admin manages. NULL + role=admin = super admin (all stations).';
COMMENT ON COLUMN public.profiles.is_super_admin IS 'Admin only: if true, this admin can manage all locations and stations.';

-- 4. If you ALREADY HAVE a locations table: use your existing location ids (copy from Table Editor).
--    Example for "UW Seattle On brella Station", "Downtown", "Capitol Hill" — use the id column values:
-- UPDATE public.profiles SET role = 'admin', location_id = '<paste-UW-Seattle-id>' WHERE email = 'admin-uw@example.com';
-- UPDATE public.profiles SET role = 'admin', location_id = '<paste-Downtown-id>' WHERE email = 'admin-downtown@example.com';
--
-- If you do NOT have locations yet, create them and assign an admin:
-- INSERT INTO public.locations (id, name) VALUES
--   ('a0000001-b000-4000-8000-000000000001', 'UW Seattle'),
--   ('a0000002-b000-4000-8000-000000000002', 'Downtown');
-- UPDATE public.profiles SET role = 'admin', location_id = 'a0000001-b000-4000-8000-000000000001' WHERE email = 'admin-uw@example.com';
--
-- Super admin (sees all stations, any location):
-- UPDATE public.profiles SET role = 'admin', is_super_admin = true WHERE email = 'superadmin@onbrella.com';

-- =============================================================================
-- SEPARATE ADMINS PER LOCATION (e.g. admin for UW Seattle vs admin for Downtown)
-- =============================================================================
-- If you ALREADY HAVE a locations table (e.g. UW Seattle On brella Station, Downtown, Capitol Hill):
--
-- 1. Copy the location id values from public.locations (Table Editor) for the locations you want.
--
-- 2. In Supabase Auth, create one user per location (e.g. admin-uw@onbrella.com, admin-downtown@onbrella.com), each with its own password.
--
-- 3. Tie each admin to one location (use the exact uuid from your locations table):
-- UPDATE public.profiles SET role = 'admin', location_id = 'a0000001-b000-4000-8000-000000000' WHERE email = 'admin-uw@onbrella.com';      -- UW Seattle (use real id)
-- UPDATE public.profiles SET role = 'admin', location_id = 'a0000002-b000-4000-8000-000000000' WHERE email = 'admin-downtown@onbrella.com';  -- Downtown (use real id)
--
-- 4. Assign stations to locations (use your real station_id and location id):
-- UPDATE public.stations SET location_id = 'a0000001-b000-4000-8000-000000000' WHERE station_id IN ('station-001', ...);  -- UW Seattle id
-- UPDATE public.stations SET location_id = 'a0000002-b000-4000-8000-000000000' WHERE station_id IN ('station-002', ...);  -- Downtown id
--
-- Result: Each admin sees only their location's stations. Use the full uuid from public.locations (e.g. a0000001-b000-4000-8000-000000000001 if your id has 12 chars in the last segment).
