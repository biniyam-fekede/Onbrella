# Hardware Simulation

Mock for On-Brella umbrella stations. Simulates physical station behavior (**unlock** and **return** only) for development and testing without real hardware. Station list and inventory come from the backend database (admin-managed); the mock no longer provides GET /hardware/stations.

**Base URL:** `http://localhost:3000`

---

## Quick Start

```bash
# 1. Install dependencies
cd hardwareSimulation && npm install

# 2. Start the mock (leave running)
npm start

# 3. In another terminal — verify endpoints
./test-mock.sh
# or
npm test
```

---

## How It Works

The **hardware mock** simulates the physical umbrella kiosks and lock hardware. In production, the backend would call real hardware APIs to unlock a slot or register a return. For development we use:

- **Mockoon CLI** – a small server that reads a JSON config and responds to HTTP requests.
- **`hardware-mock.json`** – the Mockoon environment file that defines the mock API (routes and responses).

The backend **never** talks to the frontend about hardware. The flow is:

```
Frontend  →  Backend (Node)  →  Hardware Mock (Mockoon on port 3000)
                ↓
           Database (Supabase) for rentals + stations inventory
```

### The `hardware-mock.json` file

The file is a **Mockoon environment**. Main parts:

| Field   | Meaning |
|--------|--------|
| `name` | "On-Brella Hardware Mock" – display name in Mockoon |
| `port` | **3000** – the mock server listens here |
| `routes` | Array of HTTP route definitions (two routes: unlock, return) |
| `cors` | `true` – allows the backend to call it from another origin |

The mock exposes **two routes** only:

1. **POST `/hardware/unlock`** – Simulate “unlock an umbrella at station Y” (start rental). Request: `{ stationId }`. Response: `{ success: true, message, ... }`.
2. **POST `/hardware/return`** – Simulate “return an umbrella to station Y”. Request: `{ stationId, umbrellaId }`. Response: `{ success: true, message, ... }`.

The mock does **not** persist anything. It always returns 200 and the same (or templated) JSON. All real state (rentals, station counts) lives in the **database**.

### How the backend uses it

- **Config** (`backend/src/config/index.js`): `hardwareUrl = process.env.HARDWARE_URL || "http://localhost:3000"`.
- **hardwareClient.js** – Single place that talks to the mock:
  - `unlock(stationId)` → POST `/hardware/unlock`
  - `returnUmbrella(stationId, umbrellaId)` → POST `/hardware/return`
- **rentalService.js** – Calls the mock on rent/return:
  - **startRental:** `hardwareClient.unlock()` → then creates rental in DB and decrements `num_brellas`.
  - **endRental:** `hardwareClient.returnUmbrella()` → then completes rental in DB and increments `num_brellas`.

Stations list comes from the **DB only** (GET /api/stations and admin inventory). The mock is not used for listing stations.

### When is hardware vs DB used?

| Data / action           | Source        | Notes |
|-------------------------|---------------|--------|
| Stations list (map, API)| DB only       | GET /api/stations reads from DB (admin inventory). |
| Admin inventory         | DB only       | GET /api/admin/stations – no hardware call. |
| Start rental (unlock)   | Mock (or HW)  | Backend calls POST /hardware/unlock, then updates DB. |
| End rental (return)     | Mock (or HW)  | Backend calls POST /hardware/return, then updates DB. |
| Station availability    | DB            | `num_brellas` decremented/incremented on rent/return. |

### Summary diagram

```
┌─────────────────────────────────────────────────────────────────┐
│  hardware-mock.json (Mockoon env)                                │
│  • POST /hardware/unlock   → { success: true, ... }               │
│  • POST /hardware/return   → { success: true, ... }               │
└─────────────────────────────────────────────────────────────────┘
         ↑
         │ HTTP (port 3000)
         │
┌────────┴────────────────────────────────────────────────────────┐
│  Backend (hardwareClient.js)                                     │
│  unlock()         → POST /hardware/unlock                         │
│  returnUmbrella() → POST /hardware/return                         │
└─────────────────────────────────────────────────────────────────┘
         ↑
         │ called by rentalService.js
         │
┌────────┴────────────────────────────────────────────────────────┐
│  rentalService.js                                                 │
│  startRental: hardware.unlock → DB create rental → decrement      │
│  endRental:   hardware.return → DB complete rental → increment   │
└─────────────────────────────────────────────────────────────────┘
```

---

## Running the Mock

### Option A — CLI (recommended)

```bash
npm start
```

Starts Mockoon CLI on port 3000. Use this when developing on a remote server (e.g. attu) or in CI.

> If you see **"environment's data are too recent"**, run `npm install` and try again.

### Option B — Mockoon Desktop App

1. Open [Mockoon](https://mockoon.com/)
2. Import `hardware-mock.json` from this folder
3. Start the server on port 3000

Useful if you want to inspect requests in the Mockoon UI.

### Same-Machine Rule

`localhost:3000` is the machine where your terminal runs. If you're on a **remote host** (SSH) and Mockoon is on your **laptop**, the mock on your laptop will not receive requests.

- **Same machine:** Run `npm start` on the machine where you run tests.
- **Different machines:** Run the mock on your laptop, set `HARDWARE_URL=http://YOUR_LAPTOP_IP:3000`, and ensure Mockoon listens on all interfaces and your firewall allows port 3000.

---

## API Reference

The mock exposes **two endpoints** (defined in `hardware-mock.json`):

### POST /hardware/unlock

Unlock an umbrella at a station (start rental).

**Request body:**

| Field       | Type   | Required |
|------------|--------|----------|
| stationId  | string | yes      |

**Example:** `{ "stationId": "station-001" }`

**Response (200):**

```json
{
  "success": true,
  "message": "Umbrella unlocked successfully",
  "stationId": "station-001"
}
```

---

### POST /hardware/return

Return an umbrella to a station (end rental).

**Request body:**

| Field       | Type   | Required |
|------------|--------|----------|
| stationId  | string | yes      |
| umbrellaId | string | yes      |

**Example:** `{ "stationId": "station-001", "umbrellaId": "umbrella-123" }`

**Response (200):**

```json
{
  "success": true,
  "message": "Umbrella returned successfully",
  "stationId": "station-001",
  "umbrellaId": "umbrella-123"
}
```

---

## Testing

| Command          | Description                                            |
|------------------|--------------------------------------------------------|
| `npm test`       | Run Jest tests against the mock                        |
| `./test-mock.sh` | Quick HTTP check (curl) of both endpoints (unlock, return) |

**Requirement:** The mock must be running (`npm start`) before tests.

**Override URL:** `HARDWARE_URL=http://host:3000 npm test` or `HARDWARE_URL=http://host:3000 ./test-mock.sh`

If the mock is not running, **unlock** and **return** in the app will fail with “Hardware unavailable” (503), because the backend cannot reach `http://localhost:3000`.

---

## Files

| File                 | Purpose                                          |
|----------------------|--------------------------------------------------|
| `hardware-mock.json` | Mockoon config (unlock + return routes only)     |
| `test-mock.sh`       | Shell script to verify both POST endpoints       |
| `tests/hardware.jest.test.js` | Jest integration tests                  |

---

## Integration

The On-Brella backend calls the mock when users **start** or **end** a rental (POST /hardware/unlock and POST /hardware/return). Point the backend at `http://localhost:3000` (or `HARDWARE_URL`) when the mock is running. Station list and availability come from the backend database (admin inventory); the mock is not used for listing stations.

### Relationship to Supabase

- `hardware-mock.json` is **purely a mock** of the hardware API; it does **not** read from or write to Supabase.
- Supabase (Postgres) is the **system of record** for stations, rentals, and history.
- The **backend** is the glue:
  - It calls the hardware mock (**/hardware/unlock**, **/hardware/return**) to simulate physical unlock/return.
  - It then persists or updates the resulting state in Supabase tables (e.g. creating/updating rows in `rentals` and `stations`).
- The hardware mock and Supabase **never sync directly with each other**; all coordination flows through the backend.
