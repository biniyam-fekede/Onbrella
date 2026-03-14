/**
 * API module. Open/closed: add new endpoints or swap client implementation without changing call sites.
 */
export {
  getStations,
  startRental,
  endRental,
  getSessionId,
} from "./client";

export { getRentalHistory } from "./client";
