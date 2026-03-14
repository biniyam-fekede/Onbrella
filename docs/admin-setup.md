# Admin role setup

The app supports **multiple admin accounts**, each with their own **email and password** (via Supabase Auth). Admins can be scoped to a **location** so they only see and manage a specific group of stations.

## Quick start: one admin (no locations)

1. **Create the admin user in Supabase:** Authentication → Users → Add user → choose email and password.
2. **Set role in DB:** Run [supabase-add-profiles-role.sql](supabase-add-profiles-role.sql) if needed, then:
   ```sql
   UPDATE profiles SET role = 'admin' WHERE email = 'your-admin@example.com';
   ```
3. **Log in** at `/login` with that email and password. You’ll see **Admin** in Profile and can open `/admin`.
4. **Backend:** Set `SUPABASE_URL` and `SUPABASE_SERVICE_ROLE_KEY` in `backend/.env` so the server can verify JWTs. Without them, admin API calls return **503**.

## Optional: hardcoded super-admin email

You can still use a single email that is always treated as admin (no DB role required):

- **Default:** `admin@onbrella.com`
- **Override:** `VITE_ADMIN_EMAIL` in `frontend/.env`, `ADMIN_EMAIL` in `backend/.env`

That user is treated as a **super admin** (can see and manage all stations and locations).

---

## Multiple admins and locations

Each admin has their own **email and password** (Supabase Auth). You can assign admins to a **location** so they only manage stations in that location.

### 1. Run the locations migration

Run [supabase-admin-locations.sql](supabase-admin-locations.sql) in Supabase SQL Editor. This creates:

- **`locations`** table (e.g. "UW Seattle", "Downtown")
- **`profiles.location_id`** and **`profiles.is_super_admin`** (which location an admin manages; super admins see all)
- **`stations.location_id`** (which location a station belongs to)

### 2. Create locations and assign admins

**Create a location:**

```sql
INSERT INTO public.locations (id, name) VALUES (gen_random_uuid(), 'UW Seattle');
-- Or with a fixed id: INSERT INTO public.locations (id, name) VALUES ('aaaaaaaa-bbbb-cccc-dddd-000000000001', 'UW Seattle');
```

**Make a user an admin for that location** (use the profile id from Supabase Auth or match by email):

```sql
-- By email (after the user has signed up and has a profile row):
UPDATE public.profiles
SET role = 'admin', location_id = (SELECT id FROM public.locations WHERE name = 'UW Seattle' LIMIT 1)
WHERE email = 'admin-uw@example.com';
```

**Super admin** (can manage all locations and all stations):

```sql
UPDATE public.profiles SET role = 'admin', is_super_admin = true WHERE email = 'superadmin@onbrella.com';
-- Or leave location_id NULL and is_super_admin false: NULL location_id also means “see all” for backward compat.
```

### 3. Assign stations to a location

When an admin creates a station from the admin UI, it is automatically assigned to their location (if they are location-scoped). To assign existing stations to a location:

```sql
UPDATE public.stations SET location_id = (SELECT id FROM public.locations WHERE name = 'UW Seattle' LIMIT 1) WHERE station_id IN ('station-001', 'station-002');
```

### Behavior

- **Location-scoped admin:** Sees only stations in their `location_id`; can create/edit/delete only those stations; dashboard stats (umbrellas, active sessions) are for that location. The admin header shows the location name (e.g. "· UW Seattle").
- **Super admin** (hardcoded email or `is_super_admin = true` or `role = 'admin'` with `location_id` NULL): Sees all stations and all locations; no location name in header.

### "Admin for Station 1" vs "Admin for Station 2" (completely separate)

Use **two different locations** and **two different admin accounts** (two emails, two passwords):

1. Create two locations (e.g. "Station 1" and "Station 2") in `locations`.
2. Create two users in Supabase Auth (e.g. `admin1@onbrella.com` and `admin2@onbrella.com`) with their own passwords.
3. Set each profile: `role = 'admin'` and `location_id = <that location's id>` (different `location_id` per admin).
4. Assign stations to locations: set each station’s `location_id` to the correct location.

Then **Admin 1** sees only Station 1’s stations; **Admin 2** sees only Station 2’s stations. They are separate logins with separate data. See the commented block at the bottom of [supabase-admin-locations.sql](supabase-admin-locations.sql) for copy-paste SQL.

---

## Backend env (required for admin API)

- **SUPABASE_URL**: same as in frontend (e.g. `https://xxxx.supabase.co`).
- **SUPABASE_SERVICE_ROLE_KEY**: Supabase Dashboard → Project Settings → API → **Legacy anon, service_role** tab → `service_role` (secret). Must be from the **same project** as `SUPABASE_URL`.

---

## Troubleshooting: map or inventory still shows all stations

1. **Don’t use the super-admin account for testing**  
   The backend treats the hardcoded admin email (default `admin@onbrella.com`, overridable with `ADMIN_EMAIL`) as a **super admin** who always sees all stations. Use a **different** admin user that is location-scoped (has `profiles.location_id` set and `profiles.is_super_admin = false`).

2. **Check `profiles`**  
   In Supabase → Table Editor → `profiles`, find the row for your admin (match **`email`** or **`id`** to the Auth user). Ensure **`role = 'admin'`** and **`location_id`** is set to the UUID of the location whose stations you expect to see. If `location_id` is NULL or `is_super_admin` is true, that admin sees all stations.

3. **Check the response header**  
   Open DevTools → Network, reload the map, and select the request to **`/api/stations`**. In Response Headers, look for **`X-Stations-Filter`**:
   - `location-scoped` → backend is filtering by your admin location(s).
   - `all` → either no token was sent, the user isn’t a location-scoped admin, or the user is the super admin.

4. **Log in before opening the map**  
   Open the app, log in as the location-scoped admin, then go to the map. The map refetches stations when auth state changes, so after login it should request stations with your token and show only your location’s stations.

---

## Related SQL

- `supabase-create-profiles-table.sql` — profiles table
- `supabase-add-profiles-role.sql` — `profiles.role`
- `supabase-admin-locations.sql` — locations and location-scoped admins
- `supabase-create-app-content-table.sql` — admin-managed content
- `supabase-create-support-requests-table.sql` — support and reports
- `supabase-create-config-table.sql` — pricing and config
