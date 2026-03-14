# Profile & Rental History

This document describes the profile (account) and rental history features added for the On-Brella app.

## Profile & account

- **UserContext** (`frontend/src/context/UserContext.jsx`) provides the current user from Supabase auth and the **profiles** table (with fallback to the **user** table). It exposes `user`, `loading`, `error`, `updateUser`, `resetUser`, and `refreshUser`. Profile fields include `id`, `name`, `email`, `description`, and `avatarUrl`.
- **Profile page** (`/profile`) shows the user’s name, email, avatar, and menu items: Personal Information, Payment Methods, Notifications, Help, Rental history, and Log out. Avatar uploads go to Supabase Storage in the **avatars** bucket.
- **Personal Information** (`/profile/personal-info`) lets users edit name, bio, and email. Changes are saved via `updateUser`, which persists to the Supabase **profiles** table. Validation (e.g. name required, valid email) runs before save.
- **Logout** is centralized in **useAuth** (`frontend/src/hooks/useAuth.js`): it calls `supabase.auth.signOut()`, clears UserContext and RentalContext state (`resetUser`, `clearRentalState`), then navigates to `/login`.

### Supabase setup for profile

- **profiles** table: `id` (uuid, PK, references auth.users), `full_name`, `email`, `bio`, `avatar_url`, and any timestamps your app uses. The app upserts by `id` on save.
- **Storage bucket**: Create a bucket named **avatars** and configure policies so authenticated users can upload and read their own files. The app uses this for profile photos.

## Rental history

- **Backend**: `GET /api/history` returns completed rentals for the session. Session is taken from the **X-Session-Id** header (same as `/api/rent` and `/api/return`). Query params: `limit` (default 20, max 100), `offset` (default 0). Response: `{ rentals, total, limit, offset }`. Only rows with status `COMPLETED` are returned, ordered by `start_time` DESC.
- **Frontend**: The History page (`/history`) calls `getRentalHistory()` from the API client. The same **session** is used for rent, return, and history: it is stored in **sessionStorage** (key from `config.sessionStorageKey`). So completed rentals appear on the History page only when using the **same browser tab** where you rented and returned.
- **Empty/error states**: The History page shows “No rentals yet” with a short note about using the same tab, and on API errors (e.g. 404 or “Failed to fetch”) it shows a clear message and a “Try again” button.

## Frontend API and proxy

- The frontend API client (`frontend/src/api/client.js`) sends **X-Session-Id** on every request (from `getSessionId()`). All rent, return, and history calls use this so the backend can associate rentals with one session.
- **Base URL**: In development, the frontend is usually run with **Vite** (`npm run dev`). The config uses `apiBaseUrl: import.meta.env.VITE_API_URL || ""`. When `VITE_API_URL` is **unset** (or empty), the client uses relative URLs (e.g. `/api/history`). Vite’s proxy (see `frontend/vite.config.js`) forwards `/api` to the backend (e.g. `http://localhost:5001`). That way, the browser always talks to the same origin and avoids “Failed to fetch” when the app is opened from another host (e.g. attu4).
- **For History to work**: Start the backend (`cd backend && npm start`) and the frontend (`cd frontend && npm run dev`). Use the same browser tab for renting, returning, and viewing history so the session matches.
