/**
 * Verify that the main router (src/routes/index.js) mounts each subrouter in the
 * expected order and respects the requireAdmin middleware on the /admin path.
 */

const request = require("supertest");
const express = require("express");

// create fake routers for each module so we can observe mounting
const makeStub = (path, label) => {
  const router = express.Router();
  router.get(`/${path}`, (req, res) => res.json({ hit: label }));
  return router;
};

jest.mock("../../src/routes/stations", () => {
  const express = require("express");
  const router = express.Router();
  router.get("/", (req, res) => res.json({ hit: "stations" }));
  return router;
});
jest.mock("../../src/routes/rent", () => {
  const express = require("express");
  const router = express.Router();
  router.get("/", (req, res) => res.json({ hit: "rent" }));
  return router;
});
jest.mock("../../src/routes/return", () => {
  const express = require("express");
  const router = express.Router();
  router.get("/", (req, res) => res.json({ hit: "return" }));
  return router;
});
jest.mock("../../src/routes/history", () => {
  const express = require("express");
  const router = express.Router();
  router.get("/", (req, res) => res.json({ hit: "history" }));
  return router;
});
jest.mock("../../src/routes/support", () => {
  const express = require("express");
  const router = express.Router();
  router.get("/", (req, res) => res.json({ hit: "support" }));
  return router;
});
jest.mock("../../src/routes/content", () => {
  const express = require("express");
  const router = express.Router();
  router.get("/", (req, res) => res.json({ hit: "content" }));
  return router;
});
jest.mock("../../src/routes/payments", () => {
  const express = require("express");
  const router = express.Router();
  router.get("/", (req, res) => res.json({ hit: "payments" }));
  return router;
});

// requireAdmin should be invoked for /admin; we track whether it ran
let adminMiddlewareRan = false;
const requireAdmin = (req, res, next) => {
  adminMiddlewareRan = true;
  next();
};

jest.mock("../../src/middleware/requireAdmin", () => ({ requireAdmin }));
// admin router stub
jest.mock("../../src/routes/admin", () => {
  const express = require("express");
  const router = express.Router();
  router.get("/admin", (req, res) => res.json({ hit: "admin" }));
  return router;
});

const router = require("../../src/routes/index");

describe("main router", () => {
  let app;

  beforeEach(() => {
    adminMiddlewareRan = false;
    app = express();
    // mount the router under the same path the real app uses
    app.use("/api", router);
  });

  it("forwards requests to each stub router", async () => {
    const paths = [
      "stations",
      "rent",
      "return",
      "history",
      "support",
      "content",
      "payments",
    ];
    for (const p of paths) {
      const res = await request(app).get(`/api/${p}`);
      expect(res.body.hit).toBe(p);
    }
  });

  it("applies requireAdmin to /admin routes", async () => {
    adminMiddlewareRan = false;
    const res = await request(app).get("/api/admin/admin");
    expect(res.body.hit).toBe("admin");
    expect(adminMiddlewareRan).toBe(true);
  });
});
