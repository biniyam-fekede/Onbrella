const express = require("express");
const request = require("supertest");

jest.mock("../src/services/appContentService", () => ({
  getContent: jest.fn(),
}));

const appContentService = require("../src/services/appContentService");
const contentRouter = require("../src/routes/content");

function createApp() {
  const app = express();
  app.use("/api/content", contentRouter);
  return app;
}

describe("public content routes", () => {
  const app = createApp();

  beforeEach(() => {
    jest.clearAllMocks();
  });

  test("GET /api/content/terms returns the terms document", async () => {
    appContentService.getContent.mockResolvedValue({
      key: "terms",
      source: "default",
      document: {
        title: "On-Brella Terms of Service",
        lastUpdatedLabel: "Last Updated: October 2023",
        intro: "Intro",
        sections: [{ id: "intro", number: "1.", title: "Introduction" }],
      },
    });

    const res = await request(app).get("/api/content/terms");

    expect(res.status).toBe(200);
    expect(appContentService.getContent).toHaveBeenCalledWith("terms");
    expect(res.body.key).toBe("terms");
    expect(res.body.document.title).toBe("On-Brella Terms of Service");
  });

  test("GET /api/content/home-announcements returns the announcement document", async () => {
    appContentService.getContent.mockResolvedValue({
      key: "home-announcements",
      source: "database",
      document: {
        enabled: true,
        badge: "Heads Up",
        title: "Storm alert",
        message: "Demand is higher than usual today.",
        ctaLabel: "View help",
        ctaPath: "/profile/help",
      },
    });

    const res = await request(app).get("/api/content/home-announcements");

    expect(res.status).toBe(200);
    expect(appContentService.getContent).toHaveBeenCalledWith("home-announcements");
    expect(res.body.document.title).toBe("Storm alert");
  });
});
