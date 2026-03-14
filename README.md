# On-Brella-403-Project

Your on-the-go umbrella service!

**[Demo video (YouTube)](https://youtu.be/GJD8BtV9umM)**

Link to living document: `https://docs.google.com/document/d/1LU65YB4aleQ35Zhabvx-X3Wg0-YQ28uRWCdxK4oSLe8/edit?usp=sharing`

## Start here (docs)

- **Purpose (what this system is)**: A self-service umbrella rental web app that lets users find stations, start a rental by scanning, and return umbrellas to any station. Admins can manage stations, locations, and app content.
- **User documentation**
  - **User manual**: [`USER_MANUAL.md`](USER_MANUAL.md)
  - **How to log in / accounts**: [`docs/how-to-login.md`](docs/how-to-login.md)
  - **Profile + rental history**: [`docs/profile-and-history.md`](docs/profile-and-history.md)
- **Developer documentation**
  - **Architecture overview**: [`docs/architecture.md`](docs/architecture.md)
  - **Stations map data flow**: [`docs/stations-map-flow.md`](docs/stations-map-flow.md)
  - **Admin setup (multi-admin + location scope)**: [`docs/admin-setup.md`](docs/admin-setup.md)
  - **Database SQL setup scripts**: see the `docs/supabase-*.sql` files listed in the Project Structure below.

## Completed functionality (final release)

- **Core rental flow**
  - **Find stations** on a map (stations and availability come from the database inventory)
  - **Start rental** (unlock) by scanning/confirming a station
  - **Return rental** to any station with capacity
  - **Rental history** with duration and cost calculation
- **User account & profile**
  - Supabase Auth login
  - User profile stored in `profiles` (name/bio/avatar fields as configured)
- **Admin dashboard (`/admin`)**
  - Admin authentication (Supabase JWT + `profiles.role = 'admin'`)
  - **Station management** (create/update/delete stations; station names; status; capacity; lat/long)
  - **Location-scoped admins** (locations + admin/location scoping)
  - **Admin content management** (`app_content`) for Terms/Privacy/FAQ/Announcements/Support text
  - **Pricing/config management** (`config`) for admin-managed values (e.g. unlock fee / per-minute rate)
  - **Support/complaints queue** (`support_requests`) with open/resolved states
- **Hardware simulation integration**
  - Mock hardware service supports **unlock** and **return** (state persists in Supabase DB via backend)

### Final release tag

The final release (including documentation) is tagged **`final_release`** in this repository.

### GenAI attribution

Parts of this project (including code review and documentation updates) were assisted by generative AI using **Cursor** with an OpenAI GPT-based model. All AI-assisted changes were reviewed by the team before committing.

## Description

"On-the-go" Umbrella, or On-Brella, is a mobile self-service web application that allows users to rent and use umbrellas by using an app to locate umbrella stations in the local Seattle area. The app allows them to find a nearby location housing rentable umbrellas, and once nearby, can reserve an umbrella for an allocated amount of time. Once done, users return the umbrella to their closest available umbrella station, and check their umbrella into the station.

### Key features:
* Users are able to generate an account to rent out umbrellas at stations.
* A map will display to users where nearby umbrella stations are.
* Users are able to view their rental history, including fee and rental duration (see [Profile & history](docs/profile-and-history.md)).
* Stations are tracking the number of umbrellas remaining and the status umbrellas via code or sensor.
* **Admins** can manage stations, locations, and app content via the admin dashboard at `/admin`; see [Admin setup](docs/admin-setup.md) for multiple admins and location-scoped access.

## Toolset

|   Frontend  | Backend |  Database  | Version Control | Deployment |
|-------------|---------|------------|-----------------|------------|
| React.js    | Node.js | PostgreSQL | Git + Github    | Vercel     |
| HTML        | Express |            |                 | Render     |
| CSS         |         |            |                 | Supabase   |
| JavaScript  |         |            |                 |            |

## Project Structure

```
.
├── backend/                    # Backend API server (Node.js/Express)
│   ├── src/
│   │   ├── config/            # Configuration (env vars, port, URLs)
│   │   ├── db/                # Database layer (Supabase/Postgres)
│   │   ├── middleware/        # Express middleware (error handling, validation)
│   │   ├── routes/            # API route handlers (stations, rent, return)
│   │   ├── services/          # Business logic (rentalService, hardwareClient)
│   │   ├── store/             # Rental store (DB persistence layer)
│   │   ├── app.js             # Express app setup
│   │   └── server.js          # Entry point
│   ├── tests/                 # Backend test suite (Jest)
│   ├── package.json
│   ├── jest.config.js
│   └── .env                   # Environment variables (DATABASE_URL, PORT, HARDWARE_URL)
│
├── frontend/                   # Frontend React application
│   ├── src/
│   │   ├── components/        # React components (MainLayout, QrScanner, StationMap)
│   │   ├── pages/             # Page components (ActivePage, MapPage, ScanPage2, HistoryPage)
│   │   ├── api/               # API client for backend communication
│   │   ├── config/            # Frontend configuration
│   │   ├── context/           # React context providers
│   │   ├── utils/             # Utility functions (cost, duration, stationNames)
│   │   └── App.jsx            # Main app component
│   ├── tests/                 # Frontend test suite
│   ├── package.json
│   ├── vite.config.js         # Vite build configuration
│   ├── tailwind.config.js     # Tailwind CSS configuration
│   └── postcss.config.js      # PostCSS configuration
│
├── hardwareSimulation/         # Hardware mock server (Mockoon)
│   ├── hardware-mock.json     # Mockoon configuration file
│   ├── tests/                 # Hardware mock tests
│   ├── test-mock.sh           # Shell script to test mock endpoints
│   ├── package.json
│   └── jest.config.js
│
├── docs/                       # Project documentation
│   ├── images/                 # Supabase table screenshots for README
│   ├── architecture.md        # Architecture documentation
│   ├── admin-setup.md         # Admin role, locations, and multi-admin setup
│   ├── supabase-admin-locations.sql  # Locations migration for location-scoped admins
│   ├── supabase-create-profiles-table.sql
│   ├── supabase-add-profiles-role.sql
│   ├── supabase-create-app-content-table.sql
│   ├── supabase-create-config-table.sql
│   ├── supabase-create-support-requests-table.sql
│   └── supabase-stations-add-name.sql
│
├── Status Report/              # Status reports (duplicate folder)
├── Status_Report/              # Status reports
│
├── Makefile                    # Convenience targets (install, build, test, run, clean)
├── package.json                # Root package.json with convenience scripts
├── .gitignore                  # Git ignore rules
└── README.md                   # This file
```

## Using the Makefile

From the project root you can use `make` for common tasks. Run **`make help`** to list all targets.

| Target | Description |
|--------|-------------|
| `make install` | Install dependencies for backend, frontend, and hardware simulation |
| `make build` | Build frontend for production (output in `frontend/dist`) |
| `make test` | Run backend tests |
| `make clean` | Remove all `node_modules` and `frontend/dist` |
| `make setup-env` | Create `backend/.env` and `frontend/.env` from their `.env.example` files (if missing) |
| `make setup-env-backend` | Create `backend/.env` from `backend/.env.example` (if missing) |
| `make setup-env-frontend` | Create `frontend/.env` from `frontend/.env.example` (if missing) |
| `make run-hardware` | Start hardware mock on port 3000 |
| `make run-backend` | Start backend API on port 5001 |
| `make run-frontend` | Start frontend dev server (e.g. port 5173) |
| `make run-all` | Run hardware + backend + frontend in one terminal |

**Quick start with Make:**

```bash
make install          # Install everything
make setup-env        # Create backend/.env + frontend/.env from their .env.example files (then edit values)

# Option A: run everything in one terminal
make run-all

# Option B: run each service in a separate terminal
make run-hardware    # Terminal 1: hardware mock
make run-backend     # Terminal 2: backend
make run-frontend    # Terminal 3: frontend
```

---

## Prerequisites

Before building and running the system, ensure you have the following installed:

- **Node.js** (v16 or higher recommended)
- **npm** (comes with Node.js)
- **make** 
- **PostgreSQL** (via Supabase - see Database Setup below)
- **Git** (for cloning the repository)

## Setup Instructions

### 1. Clone the Repository

```bash
git clone https://github.com/your-org/On-Brella-403-Project
cd On-Brella-403-Project
```

### 2. Database Setup (Supabase)

The backend requires a PostgreSQL database connection. We use Supabase for this:

1. Create a project at [supabase.com](https://supabase.com).
2. In your Supabase project, go to **Settings → Database**. Under **Connection info** (or **Connection string / URI**), copy the full **Postgres connection string (URI)**. This is the value you will paste into `DATABASE_URL`.  
   - If the URI contains a placeholder password, replace it with your actual database password.  
   - Use the standard Postgres connection string (not HTTP/REST) – it should start with `postgres://` or `postgresql://`.
3. Ensure your Supabase project has the required tables and columns described below.

#### Required tables and columns

- **`stations`** – umbrella station information and availability  
  | Column         | Type                | Notes                                                |
  |----------------|---------------------|------------------------------------------------------|
  | `station_id`   | `text` (PK)         | Unique station identifier                             |
  | `station_name` | `text`              | Display name (e.g. "Suzzallo Library Station")        |
  | `latitude`     | `double precision`  | Station latitude                                      |
  | `longitude`    | `double precision`  | Station longitude                                     |
  | `capacity`     | `integer`           | Total umbrella capacity at the station                |
  | `num_brellas`  | `integer`           | Current number of umbrellas at the station           |
  | `status`       | `text`              | e.g. `operational`                                    |
  | `location_id`  | `uuid` (FK)         | Optional; links to `locations` for admin scope        |

- **`rentals`** – rental history and active rentals  
  | Column               | Type        | Notes                                             |
  |----------------------|-------------|---------------------------------------------------|
  | `rental_id`          | `text` (PK) | Unique rental ID                                  |
  | `session_id`         | `text`      | Session identifier (`X-Session-Id` or fallback)   |
  | `umbrella_id`        | `text`      | Logical umbrella identifier                       |
  | `station_id`         | `text`      | Origin station ID                                 |
  | `start_time`         | `timestamp` | Rental start time                                 |
  | `end_time`           | `timestamp` | Rental end time (nullable until completed)        |
  | `return_station_id`  | `text`      | Station where umbrella was returned (nullable)    |
  | `status`             | `text`      | e.g. `ACTIVE`, `COMPLETED`                         |
  | `created_at`         | `timestamp` | Optional created-at timestamp                     |

- **`umbrellas`** – umbrella inventory (basic schema, not heavily used by the backend)  
  | Column        | Type   | Notes                         |
  |---------------|--------|-------------------------------|
  | `umbrella_id` | `text` | Primary key / umbrella ID     |
  | `station_id`  | `text` | Current station (nullable)     |
  | `status`      | `text` | e.g. `available`, `missing`   |

- **`user`** – app users (optional for core rental flow; profile data is in **`profiles`**)  
  | Column           | Type   | Notes                       |
  |------------------|--------|-----------------------------|
  | `user_id`        | `uuid` | Primary key                 |
  | `name`           | `text` | User display name           |
  | `email`          | `text` | User email                  |
  | `account_status` | `text` | e.g. `active`, `disabled`   |

- **`profiles`** – Supabase Auth–linked user profiles (login, profile page, admin role)  
  | Column          | Type    | Notes                                                    |
  |-----------------|---------|----------------------------------------------------------|
  | `id`            | `uuid` (PK, FK auth.users) | Same as auth user id                    |
  | `email`         | `text`  | User email                                               |
  | `full_name`     | `text`  | Display name                                             |
  | `bio`           | `text`  | Optional bio                                             |
  | `avatar_url`    | `text`  | Optional avatar URL                                      |
  | `role`          | `text`  | `user` or `admin` (default `user`)                        |
  | `location_id`   | `uuid` (FK) | Optional; for location-scoped admins                  |
  | `is_super_admin`| `boolean` | Optional; if true, admin sees all locations/stations  |

- **`locations`** – locations for location-scoped admins (e.g. "UW Seattle", "Downtown")  
  | Column      | Type        | Notes                    |
  |-------------|-------------|--------------------------|
  | `id`        | `uuid` (PK) | Unique location id       |
  | `name`      | `text`      | Location display name    |
  | `created_at`| `timestamptz` | Optional timestamp    |

- **`admin_location_assignments`** – links admins (profiles) to locations they manage  
  | Column       | Type          | Notes                    |
  |--------------|---------------|--------------------------|
  | `id`         | `uuid` (PK)   | Unique row id            |
  | `profile_id` | `uuid` (FK)   | References `profiles.id` |
  | `location_id`| `uuid` (FK)   | References `locations.id`|
  | `created_at` | `timestamptz` | Optional timestamp      |

- **`app_content`** – admin-managed copy (Terms, Privacy, FAQ, announcements, support text)  
  | Column       | Type         | Notes                          |
  |--------------|--------------|--------------------------------|
  | `content_key`| `text` (PK)  | e.g. `terms_and_conditions`, `help_faq` |
  | `document`   | `jsonb`      | Structured content             |
  | `updated_at` | `timestamptz`| Last update time               |
  | `updated_by` | `uuid` (FK)  | Optional; admin who last edited |

- **`config`** – key/value app configuration (e.g. pricing)  
  | Column  | Type   | Notes              |
  |---------|--------|--------------------|
  | `key`   | `text` (PK) | e.g. `unlockFeeCents`, `centsPerMinute` |
  | `value` | `text` | Stored value       |

- **`support_requests`** – user-submitted help/support complaints (admin alerts)  
  | Column       | Type          | Notes                          |
  |--------------|---------------|--------------------------------|
  | `id`         | `uuid` (PK)   | Unique request id              |
  | `user_id`    | `uuid` (FK)   | References auth user           |
  | `user_email` | `text`        | User email at submit time      |
  | `session_id` | `text`        | Optional session id            |
  | `reason`     | `text`        | e.g. `station_empty`, `app_issue` |
  | `details`    | `text`        | User-provided details          |
  | `severity`   | `text`        | e.g. `critical`, `non_critical` |
  | `status`     | `text`        | `open` or `resolved`           |
  | `created_at` | `timestamptz` | When submitted                 |
  | `resolved_at`| `timestamptz` | When resolved (nullable)       |
  | `resolved_by`| `uuid` (FK)   | Admin who resolved (nullable)  |

For **admin and location-scoped admins**, create **`profiles`** and **`locations`** (and optionally **`admin_location_assignments`**), then run [supabase-admin-locations.sql](docs/supabase-admin-locations.sql) to add `location_id` and `is_super_admin` to `profiles` and `location_id` to `stations`. See [Admin setup](docs/admin-setup.md). For **app content**, **config**, and **support requests**, run the SQL in `docs/`: [supabase-create-app-content-table.sql](docs/supabase-create-app-content-table.sql), [supabase-create-config-table.sql](docs/supabase-create-config-table.sql), [supabase-create-support-requests-table.sql](docs/supabase-create-support-requests-table.sql).

You can create these tables using the Supabase Table editor UI, or by running the equivalent SQL in the `docs/` folder. Rentals do **not** need seed data; they are created automatically when you use the app. For a working demo, create at least a few `stations` rows (matching the example IDs used by the hardware mock such as `station-001`, `station-002`, etc.).

#### Example Supabase table views

These screenshots show what the demo tables look like in Supabase:

![Supabase admin_location_assignments table](docs/images/supabase-admin-location-assignments.png)

![Supabase app_content table](docs/images/supabase-app-content.png)

![Supabase config table](docs/images/supabase-config.png)

![Supabase profiles table](docs/images/supabase-profiles.png)

![Supabase rentals table](docs/images/supabase-rentals.png)

![Supabase stations table](docs/images/supabase-stations.png)

![Supabase support_requests table](docs/images/supabase-support-requests.png)

### 3. Environment Configuration

#### Backend `.env`

Create a `.env` file in the `backend/` directory (or copy the example file):

```bash
cd backend
cp .env.example .env
```

Edit `backend/.env` and set at least the following variables:

```env
DATABASE_URL=postgresql://postgres.[ref]:[password]@aws-1-[region].pooler.supabase.com:6543/postgres
SUPABASE_URL=https://your-project-ref.supabase.co
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key
PORT=5001
HARDWARE_URL=http://localhost:3000
ADMIN_EMAIL=admin@onbrella.com
STRIPE_SECRET_KEY=sk_test_your_test_key_here
```

- **`DATABASE_URL`**: Supabase Postgres connection string using the connection pooler in Transaction mode.
- **`SUPABASE_URL`**: Supabase project URL for backend auth/admin verification.
- **`SUPABASE_SERVICE_ROLE_KEY`**: Supabase service role key for backend auth/admin verification. Do **not** expose this in frontend code.
- **`PORT`**: Backend port. Defaults to `5001`.
- **`HARDWARE_URL`**: Hardware mock base URL. Defaults to `http://localhost:3000`.
- **`ADMIN_EMAIL`**: Optional backend admin email override. Defaults to `admin@onbrella.com`.
- **`STRIPE_SECRET_KEY`**: Required for Stripe payment features. Keep this secret and server-side only.

#### Frontend `.env`

The frontend also needs its own `.env` file. If this is missing or misconfigured, the app can render as a **blank white screen** with no obvious errors in the browser console or Network tab.

Create a `.env` file in the `frontend/` directory:

```bash
cd frontend
cp .env.example .env
```

Then edit `frontend/.env` and set:

```env
# Required for Supabase auth/profile features
VITE_SUPABASE_URL=your-project-url
VITE_SUPABASE_PUBLISHABLE_KEY=your-public-anon-key-here

# Optional: override backend API URL
VITE_API_URL=http://localhost:5001

# Optional: override default admin email (see docs/admin-setup.md)
VITE_ADMIN_EMAIL=admin@onbrella.com
```

- **`VITE_SUPABASE_URL`**: From Supabase **Project Settings → API → Project URL**.
- **`VITE_SUPABASE_PUBLISHABLE_KEY`**: From Supabase **Project Settings → API → `anon` public key**. Do **not** use the `service_role` key here.
- **`VITE_API_URL`**: Optional in development; you can leave it unset to rely on the Vite dev proxy if configured.
- **`VITE_ADMIN_EMAIL`**: Optional override matching the admin email used for login; see `docs/admin-setup.md` for details.

If `VITE_SUPABASE_URL` or `VITE_SUPABASE_PUBLISHABLE_KEY` are missing or incorrect, the frontend may fail silently and show a white screen even though the Network tab looks clean.

### 4. Admin setup (optional)

The app supports **multiple admin accounts**, each with their own Supabase Auth email and password. Admins can be scoped to a **location** so they only see and manage stations in that location.

- **Quick start (one admin):** Create a user in Supabase Auth, set `profiles.role = 'admin'` in the database, then log in at `/login`. You’ll see **Admin** in Profile and can open `/admin`. The backend must have `SUPABASE_URL` and `SUPABASE_SERVICE_ROLE_KEY` in `backend/.env`; otherwise admin API calls return **503**.
- **Optional super-admin email:** You can use a single email that is always treated as admin (no DB role required). Default: `admin@onbrella.com`; override with `VITE_ADMIN_EMAIL` (frontend) and `ADMIN_EMAIL` (backend). That user is a **super admin** (sees all stations and locations).
- **Multiple admins and locations:** Run the [locations migration](docs/supabase-admin-locations.sql) in Supabase to add a `locations` table and link admins/stations to locations. Then assign each admin to a location so they only manage that location’s stations.

Full details, SQL examples, and troubleshooting: **[Admin setup](docs/admin-setup.md)**.

## Docker Setup

You can run the full local development stack with Docker Compose.

### Prerequisites

Before starting, make sure these files exist:

- `backend/.env`
- `frontend/.env`

Create them from the example files if needed:

```bash
cp backend/.env.example backend/.env
cp frontend/.env.example frontend/.env
```

Then fill in the required environment variables before starting the containers.

### Start All Services

From the project root, run:

```bash
docker compose up --build
```

This starts:

- **hardwareSimulation** at `http://localhost:3000`
- **backend** at `http://localhost:5001`
- **frontend** at `http://localhost:5173`

### Stop All Services

To stop the containers:

```bash
docker compose down
```

### Notes

- The backend container uses `HARDWARE_URL=http://hardware:3000` inside Docker Compose so it can reach the hardware mock service.
- The frontend should continue using `VITE_API_URL=http://localhost:5001` in `frontend/.env` because the browser connects through the host machine.
- If you change dependencies, rebuild with:

```bash
docker compose up --build
```

## Render Deployment

This repo includes a `render.yaml` file for an initial Render deployment setup.

### Services

The Render blueprint defines:

- a **backend web service** using `backend/Dockerfile`
- a **frontend static site** built from `frontend/`
- **Supabase** remains the database and auth provider

### Required Render Environment Variables

Set these values in Render when creating the services:

#### Backend
- `DATABASE_URL`
- `SUPABASE_URL`
- `SUPABASE_SERVICE_ROLE_KEY`
- `STRIPE_SECRET_KEY`

Optional backend values:
- `PORT` defaults to `5001`
- `ADMIN_EMAIL` defaults to `admin@onbrella.com`

#### Frontend
- `VITE_SUPABASE_URL`
- `VITE_SUPABASE_PUBLISHABLE_KEY`
- `VITE_API_URL`

Optional frontend value:
- `VITE_ADMIN_EMAIL` defaults to `admin@onbrella.com`

### Notes

- The frontend is deployed as a static site.
- The backend is deployed as a Docker-based web service.
- The database is not created by Render in this setup; the app continues to use Supabase.
- Before using the deployed frontend, set `VITE_API_URL` to the public URL of the deployed backend service.

## Build Instructions

You can use **`make install`** and **`make build`** from the project root instead of the commands below.

### Build All Components

The project consists of three main components. Build them in this order:

#### Step 1: Install Hardware Simulation Dependencies

```bash
cd hardwareSimulation
npm install
```

#### Step 2: Install Backend Dependencies

```bash
cd ../backend
npm install
```

#### Step 3: Install Frontend Dependencies

```bash
cd ../frontend
npm install
```

#### Step 4: Build Frontend (Production)

```bash
cd frontend
npm run build
```

This creates a `dist/` directory with optimized production files.

**Alternative: Build from Root**

You can also install dependencies from the root directory:

```bash
# From project root
npm install --prefix backend
npm install --prefix frontend
npm install --prefix hardwareSimulation
```

## Test Instructions

You can use **`make test`** from the project root for backend tests.

### Run Root Test Commands

From the project root:

```bash
npm test
```

This runs the **backend** test suite.

You can also run:

```bash
npm run test:coverage
```

This runs backend tests with coverage.

### Run Tests by Component

#### Backend Tests

```bash
cd backend
npm test
```

Or from root:

```bash
npm run test:backend
```

#### Hardware Simulation Tests

```bash
cd hardwareSimulation
npm test
```

Or from root:

```bash
npm run test:hardware
```

#### Frontend Tests

```bash
cd frontend
npm test
```

### Code Coverage

We use **Jest** coverage for the backend and hardware simulation, and **Vitest** coverage for the frontend.

#### Backend Coverage

```bash
cd backend
npm run test:coverage
```

Or from root:

```bash
npm run test:coverage
```

#### Hardware Simulation Coverage

```bash
cd hardwareSimulation
npm run test:coverage
```

Or from root:

```bash
npm run test:hardware:coverage
```

#### Frontend Coverage

```bash
cd frontend
npm run test:coverage
```

### CI Coverage

In GitHub Actions, the CI workflow runs backend and hardware coverage on pushes and pull requests to `main`.

Artifacts:
- `backend-coverage` → `backend/coverage/`
- `hardware-coverage` → `hardwareSimulation/coverage/`

### How to Add New Tests

- **Test harness:** Backend and hardware simulation use **Jest**. Frontend uses **Vitest**.
- **Naming convention:** Backend and hardware simulation test files should follow the Jest pattern configured in their respective `jest.config.js` files.
- **Where to add tests:**
  - Backend: add new test files in `backend/tests/`.
  - Hardware simulation: add new test files in `hardwareSimulation/tests/`.
  - Frontend: add tests in `frontend/tests/` or alongside frontend source files, depending on your Vitest setup.

### Running the Complete System

The system requires three services to run simultaneously:

1. **Hardware Simulation** (Mockoon) - Port 3000
2. **Backend API** (Express) - Port 5001
3. **Frontend** (Vite dev server) - Port 5173 (default)

### One-command option (recommended)

From the project root, you can run the full stack (hardware + backend + frontend) in one terminal:

```bash
make run-all
```

### Step-by-Step: Running All Services

#### Terminal 1: Start Hardware Simulation

```bash
cd hardwareSimulation
npm start
```

The hardware mock will start on `http://localhost:3000`. Keep this terminal open.

**Verify it's running:**
```bash
./test-mock.sh
```

#### Terminal 2: Start Backend Server

```bash
cd backend
npm start
```

The backend will start on `http://localhost:5001` (or the port specified in `PORT` env var).

**Verify it's running:**
```bash
curl http://localhost:5001/health
```

Expected response:
```json
{
  "status": "ok",
  "database": "connected"
}
```

#### Terminal 3: Start Frontend Development Server

```bash
cd frontend
npm run dev
```

The frontend will start on `http://localhost:5173` (or the next available port).

Open your browser and navigate to the URL shown in the terminal (typically `http://localhost:5173`).

### Running from Root Directory

You can also use the root-level scripts:

```bash
# Start backend (from root)
npm start
```

**Note:** The root `npm start` only starts the backend. You still need to start the hardware simulation and frontend separately.

### Production Build and Preview

To preview the production build:

```bash
cd frontend
npm run build
npm run preview
```

This serves the optimized production build locally.

## Building a Release

Before creating a release:

1. **Update versions**  
   If the release includes a version bump, update the relevant version numbers (for example in `package.json` files and any referenced documentation) to reflect the new release.

2. **Build the software**  
   From the project root:
   ```bash
   make install
   make build
   ```
   This installs dependencies and builds the frontend for production (output in `frontend/dist/`).

3. **Run sanity checks**  
   - Run the test suite: `make test` (or `npm test` from root).  
   - Verify environment configuration: check `backend/.env` and `frontend/.env` (if used) for correct values for the target environment; never commit secrets.

4. **Manual steps**  
   - Tag the release in Git (for example `git tag vX.Y.Z`) and push tags.  
   - Deploy the backend, frontend, and any supporting services using your chosen deployment platforms (e.g. Vercel, Render, Supabase).  
   - In the target environment, start the required services (hardware simulation if applicable, backend, frontend) and perform a quick smoke test (e.g. health endpoint, basic user flows) to confirm the release is healthy.

## API Endpoints

### Backend API (Port 5001)

| Method | Path | Description |
|--------|------|-------------|
| GET | `/health` | Health check endpoint |
| GET | `/api/stations` | List all umbrella stations |
| GET | `/api/history` | List completed rental history for the session. Query: `?limit=&offset=`. Header: `X-Session-Id`. |
| POST | `/api/rent` | Start a rental. Body: `{ stationId }` |
| POST | `/api/return` | End a rental. Body: `{ rentalId, stationId, umbrellaId }` |

**Session Management:** Use `X-Session-Id` header or include `sessionId` in the request body. Defaults to `guest` if not provided. Rent, return, and history all use the same session so completed rentals appear on the History page when using the same browser tab.

**Admin API** (all under `/api/admin/*`, require authenticated admin): `GET /api/admin/me`, `GET /api/admin/stats`, `GET /api/admin/stations`, `POST|PATCH|PUT|DELETE /api/admin/stations/*`, `GET /api/admin/users`, `GET /api/admin/activity`, `GET /api/admin/trends`, `GET /api/admin/reports`, `GET|PUT /api/admin/content/*`, `GET|PUT /api/admin/pricing`. Location-scoped admins see only their location’s stations and stats. See [Admin setup](docs/admin-setup.md).

### Hardware Mock API (Port 3000)

| Method | Path | Description |
|--------|------|-------------|
| POST | `/hardware/unlock` | Unlock an umbrella (start rental) |
| POST | `/hardware/return` | Return an umbrella (end rental) |

## Environment Variables

### Backend (.env)

| Variable | Default | Description |
|----------|---------|-------------|
| `PORT` | `5001` | Backend server port |
| `HARDWARE_URL` | `http://localhost:3000` | Hardware mock server URL |
| `DATABASE_URL` | — | **Required** – Supabase/Postgres connection URI |
| `SUPABASE_URL` | — | **Required for admin API** – Supabase project URL (same project as frontend) |
| `SUPABASE_SERVICE_ROLE_KEY` | — | **Required for admin API** – Supabase service role key (Project Settings → API). Do not expose in frontend. |
| `ADMIN_EMAIL` | `admin@onbrella.com` | Optional super-admin email override; see [Admin setup](docs/admin-setup.md). |
| `STRIPE_SECRET_KEY` | — | Required for Stripe payment features; keep server-side only. |

### Frontend

The frontend uses Vite environment variables. Create `frontend/.env` as described in **Step 3 – Environment Configuration**:

| Variable | Description |
|----------|-------------|
| `VITE_SUPABASE_URL` | Supabase project URL (from Project Settings → API → Project URL). Required for login/profile flows. |
| `VITE_SUPABASE_PUBLISHABLE_KEY` | Supabase public `anon` key (from Project Settings → API). Required for Supabase client access; **do not** use the `service_role` key. |
| `VITE_API_URL` | Backend API base URL. Leave unset in dev to use the Vite proxy (`/api` → backend); set only when the frontend must call a different host (e.g. production API). See [Profile & history](docs/profile-and-history.md) for details. |
| `VITE_ADMIN_EMAIL` | Optional override for the admin email used by the frontend; see `docs/admin-setup.md` for details. |

