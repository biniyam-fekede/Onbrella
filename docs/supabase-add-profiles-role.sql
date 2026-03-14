-- Add admin role to profiles. Run this in Supabase SQL Editor (Dashboard → SQL Editor).
-- Default is 'user'; set specific users to 'admin' for admin access.

ALTER TABLE profiles
ADD COLUMN IF NOT EXISTS role text NOT NULL DEFAULT 'user';

-- Optional: allow only 'user' and 'admin'
-- ALTER TABLE profiles ADD CONSTRAINT profiles_role_check CHECK (role IN ('user', 'admin'));

-- Grant first admin (replace with the actual profile id or use email if you have a trigger)
-- Option 1: by auth.users id (run after you know the user's id from Supabase Auth)
-- UPDATE profiles SET role = 'admin' WHERE id = 'uuid-from-auth-users';

-- Option 2: by email (if profiles has email and you use a trigger that syncs auth → profiles)
-- UPDATE profiles SET role = 'admin' WHERE email = 'admin@example.com';
