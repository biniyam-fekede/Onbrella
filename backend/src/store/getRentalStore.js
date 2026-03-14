/**
 * Returns the rental store (DB). Requires DATABASE_URL.
 */

const config = require("../config");
const rentalStoreDb = require("./rentalStoreDb");

function getRentalStore() {
  if (!config.databaseUrl) {
    throw new Error("DATABASE_URL is required. Set it in backend/.env");
  }
  return rentalStoreDb;
}

module.exports = getRentalStore;
