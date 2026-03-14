/**
 * Tests for src/routes/content.js
 */

const request = require("supertest");
const express = require("express");

jest.mock("../../src/services/appContentService", () => ({
  getContent: jest.fn(),
}));

const appContentService = require("../../src/services/appContentService");
const router = require("../../src/routes/content");

describe("content router", () => {
  let app;

  beforeEach(() => {
    app = express();
    app.use(router);
  });

  test("returns JSON when service resolves", async () => {
    const fake = { foo: "bar" };
    appContentService.getContent.mockResolvedValue(fake);
    const res = await request(app).get("/test-key");
    expect(res.status).toBe(200);
    expect(res.body).toStrictEqual(fake);
  });

  test("404 from service becomes 404 response", async () => {
    const err = new Error("not found");
    err.statusCode = 404;
    appContentService.getContent.mockRejectedValue(err);
    const res = await request(app).get("/does-not-exist");
    expect(res.status).toBe(404);
    expect(res.body.error).toContain("not found");
  });

  test("other errors propagate to next", async () => {
    const err = new Error("boom");
    appContentService.getContent.mockRejectedValue(err);
    // express default handler sends 500
    const res = await request(app).get("/oops");
    expect(res.status).toBe(500);
  });
});
