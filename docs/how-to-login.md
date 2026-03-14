# How to log in (step by step)

## Before you can log in (one-time setup)

### 1. Supabase project

- Create a project at [supabase.com](https://supabase.com) if you don’t have one.
- In the project: **Authentication → Providers** – ensure **Email** is enabled so you can sign in with email/password.

### 2. Frontend env (for login to work)

In the **frontend** folder, create or edit `.env` (or use `.env.local`) with:

```env
VITE_SUPABASE_URL=https://YOUR_PROJECT_REF.supabase.co
VITE_SUPABASE_PUBLISHABLE_KEY=your_anon_public_key
```

Get both from Supabase: **Project Settings → API** → Project URL and anon/public key.

### 3. Run the app

From the **project root** (or use separate terminals):

```bash
# Terminal 1 – backend (needs DATABASE_URL in backend/.env for rentals/history)
make run-backend
# or: cd backend && npm start

# Terminal 2 – frontend
make run-frontend
# or: cd frontend && npm run dev
```

- Frontend: **http://localhost:5173**
- Backend: **http://localhost:5001** (frontend proxies `/api` to it)

---

## Log in as a normal user

1. Open **http://localhost:5173** in the browser.
2. You’ll be sent to the app; if not logged in, go to **http://localhost:5173/login**.
3. **First time:** Click **“Sign up”** (or go to **http://localhost:5173/sign-up**), enter email and password, then confirm (Supabase may require email confirmation depending on your project settings).
4. **Log in:** On **http://localhost:5173/login** enter your **email** and **password**, then click **Login**.
5. You should be redirected to the **map** (home). Use the bottom nav or profile to open **Profile**, **History**, etc. You will **not** see an “Admin” option (only admins do).

---

## Log in as an admin (see Admin menu and /admin)

### Hardcoded admin email (easiest)

Admin access is **hardcoded** to the email **`admin@onbrella.com`** (no database role or migration needed).

1. **Create that user in Supabase**  
   In Supabase: **Authentication → Users → Add user**.  
   Email: **`admin@onbrella.com`**, set a password you’ll remember.

2. **Backend env (so Admin API works)**  
   In **backend** `.env` add:
   ```env
   SUPABASE_URL=https://YOUR_PROJECT_REF.supabase.co
   SUPABASE_SERVICE_ROLE_KEY=your_service_role_key
   ```
   Get the service role key from **Project Settings → API** → `service_role`. Restart the backend.

3. **Log in**  
   Open **http://localhost:5173/login**, email **`admin@onbrella.com`**, password the one you set. Click **Login**.

4. **Open Admin**  
   Go to **Profile** → you’ll see **Admin** at the top. Click it (or go to **http://localhost:5173/admin**).

To use a **different** admin email, set in frontend `.env`: `VITE_ADMIN_EMAIL=youradmin@example.com` and in backend `.env`: `ADMIN_EMAIL=youradmin@example.com`.

---

## Quick checklist

| Step | What to do |
|------|------------|
| 1 | Supabase project exists; Email auth enabled |
| 2 | Frontend `.env`: `VITE_SUPABASE_URL`, `VITE_SUPABASE_PUBLISHABLE_KEY` |
| 3 | Backend running (e.g. port 5001); frontend running (e.g. port 5173) |
| 4 | **Normal login:** Go to `/login` → email + password → Login |
| 5 | **Admin:** Create user in Supabase with email **`admin@onbrella.com`** (any password) |
| 6 | Backend `.env`: `SUPABASE_URL`, `SUPABASE_SERVICE_ROLE_KEY` (for Admin API) |
| 7 | Log in as `admin@onbrella.com` → Profile → **Admin**, or open `/admin` |

If login fails, check: (1) Supabase Auth → Users that the user exists, (2) correct URL and anon key in frontend `.env`, (3) no typos in email/password.
