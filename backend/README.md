# On-Brella Backend

Backend REST API for On-Brella umbrella rental system. Modular, extensible structure.

This service handles:
- rental and return API requests
- station data requests
- rental history
- database-backed persistence through Supabase Postgres
- admin/auth-related verification through Supabase server-side credentials

## Tech Stack

- Node.js
- Express
- Supabase
- Postgres
- Jest
- Supertest

## Project Structure

```
src/
├── config/           # Env config (PORT, HARDWARE_URL, DATABASE_URL)
├── db/               # Database layer (Supabase/Postgres)
├── middleware/       # Error handling, validation
├── routes/           # API route handlers (stations, rent, return)
├── services/         # Business logic (rentalService, hardwareClient)
├── store/            # Rental store (DB via rentalStoreDb)
├── app.js            # Express app
└── server.js         # Entry point
```

## API Endpoints

| Method | Path | Description |
|--------|------|-------------|
| GET | /health | Health check |
| GET | /api/stations | List stations (from DB inventory; location-scoped for admins) |
| GET | /api/history | List completed rental history. Query: `?limit=&offset=`. Session: `X-Session-Id`. |
| POST | /api/rent | Start rental. Body: `{ stationId }` |
| POST | /api/return | End rental. Body: `{ rentalId, stationId, umbrellaId }` |

**Session:** `X-Session-Id` header or `sessionId` in body. Defaults to `guest`.

## Run

```bash
cd backend
npm install
npm start
```

Server runs on port **5001** by default (or `PORT` env var). Port 5000 is avoided by default because macOS often uses it for AirPlay Receiver. Start the hardware mock (Mockoon) on port 3000 first: `cd hardwareSimulation && npm start` or run your Mockoon env on 3000.

## Database (Supabase)

The backend uses **Supabase Postgres** for persistence. The primary database environment variable is:

```env
DATABASE_URL=postgresql://postgres.[ref]:[password]@aws-0-[region].pooler.supabase.com:6543/postgres
```

`SUPABASE_DATABASE_URL` is supported only as a legacy fallback for backward compatibility. New setups should use `DATABASE_URL`.

**Setup**

1. Create a project at [supabase.com](https://supabase.com).
2. In **Project Settings → Database**, copy the **Connection string (URI)**.
3. Use **Transaction** mode and replace `[YOUR-PASSWORD]` with your database password.
4. In the `backend/` folder, copy `.env.example` to `.env`.
5. Set:
   ```env
   DATABASE_URL=postgresql://postgres.[ref]:[password]@aws-0-[region].pooler.supabase.com:6543/postgres
   SUPABASE_URL=https://your-project-ref.supabase.co
   SUPABASE_SERVICE_ROLE_KEY=your-service-role-key
   ```
Ensure your Supabase project has the expected tables (`stations`, `rentals`, `profiles`, and admin tables like `locations`, `app_content`, `config`, `support_requests` if you use the admin dashboard). SQL reference and setup files are located in the top-level `docs/` folder.

**Health check:** `GET /health` returns `{ status: "ok", database: "connected" }` when the DB is reachable.

**POST /api/rent** and **POST /api/return** persist to the `rentals` table. `DATABASE_URL` is required for database-backed features.

## Environment

| Variable | Default | Required | Description |
|----------|---------|----------|-------------|
| PORT | 5001 | No | Server port |
| HARDWARE_URL | http://localhost:3000 | No | Hardware mock URL |
| DATABASE_URL | — | Yes | Primary Supabase/Postgres connection URI |
| SUPABASE_DATABASE_URL | — | No | Legacy fallback for database URI; keep only for backward compatibility |
| SUPABASE_URL | — | Yes for auth/admin features | Supabase project URL |
| SUPABASE_SERVICE_ROLE_KEY | — | Yes for auth/admin features | Supabase service role key for backend verification |
| ADMIN_EMAIL | admin@onbrella.com | No | Default admin email used by admin middleware |

## Testing with Hoppscotch

Use base URL `http://localhost:5001`. Ensure Mockoon (hardware mock) is running on port 3000.

| Request | Method | URL | Body (if POST) |
|--------|--------|-----|----------------|
| Health | GET | `http://localhost:5001/health` | — |
| List stations | GET | `http://localhost:5001/api/stations` | — |
| Start rental | POST | `http://localhost:5001/api/rent` | `{"stationId":"station-001"}` |
| End rental | POST | `http://localhost:5001/api/return` | `{"rentalId":"<from rent>","stationId":"station-001","umbrellaId":"<from rent>"}` |

Optional: set header `X-Session-Id: my-session` to keep rentals per session.

## Testing (Jest)

All backend tests use Jest. No hardware mock required (hardware client is mocked).

```bash
# Run tests from the backend directory.
cd backend
npm test
npm run test:coverage
```

### Test Files

| File | Coverage |
|------|----------|
| `config.jest.test.js` | Config env vars |
| `rentalService.jest.test.js` | Business logic (mocked hardware, mocked store) |
| `hardwareClient.jest.test.js` | Hardware API client (mocked fetch) |
| `middleware.jest.test.js` | Validation, error handler |
| `api.jest.test.js` | Full API integration (mocked hardware and store) |