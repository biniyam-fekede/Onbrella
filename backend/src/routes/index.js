/**
 * Mounts all API routes.
 */

const express = require("express");
const { requireAdmin } = require("../middleware/requireAdmin");
const stationsRouter = require("./stations");
const rentRouter = require("./rent");
const returnRouter = require("./return");
const historyRouter = require("./history");
const adminRouter = require("./admin");
const supportRouter = require("./support");
const contentRouter = require("./content");
const paymentsRouter = require("./payments");

const router = express.Router();

router.use("/stations", stationsRouter);
router.use("/rent", rentRouter);
router.use("/return", returnRouter);
router.use("/history", historyRouter);
router.use("/support", supportRouter);
router.use("/content", contentRouter);
router.use("/admin", requireAdmin, adminRouter);
router.use("/payments", paymentsRouter);

module.exports = router;
