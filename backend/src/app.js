/**
 * Express app setup. Modular: add middleware and routes here.
 */

const express = require("express");
const cors = require("cors");
const apiRoutes = require("./routes");
const errorHandler = require("./middleware/errorHandler");
const db = require("./db");

const app = express();

app.use(cors());
app.use(express.json());

app.get("/health", async (_req, res) => {
  const dbOk = await db.healthCheck();
  res.json({ status: "ok", database: dbOk ? "connected" : "disconnected" });
});

app.use("/api", apiRoutes);

app.use(errorHandler);

module.exports = app;
