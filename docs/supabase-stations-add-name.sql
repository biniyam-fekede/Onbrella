-- Add display name to stations. Run in Supabase SQL Editor (Dashboard → SQL Editor).
-- Required for the admin "Add station" name field and for listing stations from the database.
-- Admins can set a friendly name (e.g. "Suzzallo Library Station") when adding or editing a station.

ALTER TABLE stations
ADD COLUMN IF NOT EXISTS name text;

COMMENT ON COLUMN stations.name IS 'Display name for the station (e.g. Suzzallo Library Station)';
