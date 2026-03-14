# How stations get on the map and stay in the database

## Where the map gets stations

1. **Map page** (user UI) calls **GET /api/stations** (public API, no auth).
2. The backend **rentalService.getStations()** uses the **database** as the source when the DB has at least one station:
   - It loads all rows from the **`stations`** table (`listStations()`).
   - Each row is formatted with `stationId`, `name`, `latitude`, `longitude`, `location: { latitude, longitude }`, `capacity`, `numUmbrellas`, `status`.
3. The frontend receives that list and passes it to **StationMap**. Any station with valid **latitude and longitude** gets a marker on the map.

So **the map shows exactly what is in the `stations` table** (and only draws a pin when lat/long are set).

---

## Creating a station so it appears for everyone

1. **Admin → Inventory → “Add station”**
2. Fill in:
   - **Station ID** (required), e.g. `station-006`
   - **Station name** (optional), e.g. `New Library Station`
   - **Capacity** (required), e.g. `10`
   - **Latitude** and **Longitude** — **required for the map**. Example: `47.655`, `-122.304`
   - **Status** (Operational / Out of service / Maintenance)
3. Submit. The app calls **POST /api/admin/stations**, which **upserts** into the **`stations`** table (Supabase).
4. The new row is stored **permanently** in the database.

**To see it on the map:**

- **Users:** On the main map page, stations are loaded via **GET /api/stations**, which reads from the same DB. So the new station appears for all users on the next load (or refresh). No extra step.
- If you leave **latitude/longitude** blank, the station is still saved and appears in Admin Inventory and Dashboard, but **it will not get a marker on the map** (the map only shows stations that have coordinates).

---

## Summary

| Step | What happens |
|------|----------------|
| Admin adds station (with lat/long) | Row inserted/updated in `stations` table (Supabase). |
| User opens map | Frontend calls GET /api/stations → backend returns all stations from DB → map draws a marker for each with lat/long. |
| Result | New station is in the DB permanently and appears on the map for all users once they load or refresh the map. |

**Important:** Always fill in **Latitude** and **Longitude** when adding a station if you want it to show on the map.
