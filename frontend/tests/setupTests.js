import "@testing-library/jest-dom/vitest";
import { vi } from "vitest";

// stationNames.js imports from "../api/client". Avoid "Failed to parse URL from /api/stations" in Node.
// Tests that need specific API behavior can override with their own vi.mock of api or api/client.
vi.mock("../src/api/client", async (importOriginal) => {
  const actual = await importOriginal();
  return {
    ...actual,
    getStations: () => Promise.resolve({ stations: [] }),
  };
});
