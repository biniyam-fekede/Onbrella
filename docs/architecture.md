# Architecture

**Frontend**  
User-facing UI: map, station list, rent/return flows, account. Runs in the browser.

**Backend**  
API and business logic. Handles requests from the frontend, applies rules, talks to the database and to the hardware layer.

**Hardware simulation**  
Simulates umbrella stations (locks, slots, status). Used in development and testing instead of physical hardware. The backend is the only part that talks to it.

