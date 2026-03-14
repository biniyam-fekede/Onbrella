const express = require("express");
const request = require("supertest");

jest.mock("../src/db", () => ({
  query: jest.fn(),
}));

jest.mock("../src/store/getRentalStore", () => jest.fn(() => ({
  countActiveRentals: jest.fn().mockResolvedValue(0),
})));

jest.mock("../src/store/supportRequestStoreDb", () => ({
  listAllForAdmin: jest.fn(),
  resolve: jest.fn(),
}));

jest.mock("../src/services/appContentService", () => ({
  getContent: jest.fn(),
  updateContent: jest.fn(),
}));

const appContentService = require("../src/services/appContentService");
const adminRouter = require("../src/routes/admin");

function createApp() {
  const app = express();
  app.use(express.json());
  app.use((req, _res, next) => {
    req.adminUserId = "admin-123";
    next();
  });
  app.use("/api/admin", adminRouter);
  return app;
}

describe("admin terms content routes", () => {
  const app = createApp();

  beforeEach(() => {
    jest.clearAllMocks();
  });

  test("GET /api/admin/content/terms returns the editable document", async () => {
    appContentService.getContent.mockResolvedValue({
      key: "terms",
      source: "database",
      document: {
        title: "Updated Terms",
        lastUpdatedLabel: "Last Updated: March 2026",
        intro: "Intro",
        sections: [{ id: "intro", number: "1.", title: "Introduction" }],
      },
    });

    const res = await request(app).get("/api/admin/content/terms");

    expect(res.status).toBe(200);
    expect(appContentService.getContent).toHaveBeenCalledWith("terms");
    expect(res.body.document.title).toBe("Updated Terms");
  });

  test("PUT /api/admin/content/privacy-policy saves the document", async () => {
    const document = {
      title: "Updated Privacy Policy",
      lastUpdatedLabel: "Last Updated: April 2026",
      intro: "Intro",
      sections: [{ id: "intro", number: "1.", title: "Introduction" }],
    };

    appContentService.updateContent.mockResolvedValue({
      key: "privacy-policy",
      source: "database",
      document,
      updatedBy: "admin-123",
    });

    const res = await request(app)
      .put("/api/admin/content/privacy-policy")
      .set("Content-Type", "application/json")
      .send({ document });

    expect(res.status).toBe(200);
    expect(appContentService.updateContent).toHaveBeenCalledWith(
      "privacy-policy",
      document,
      "admin-123"
    );
    expect(res.body.document.title).toBe("Updated Privacy Policy");
  });
});
