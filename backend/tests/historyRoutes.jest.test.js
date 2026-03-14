/**
 * History routes tests.
 */

const express = require("express");
const request = require("supertest");

jest.mock("../src/middleware/validate", () => ({
  sessionId: jest.fn(),
}));

jest.mock("../src/store/getRentalStore", () => jest.fn());

const { sessionId } = require("../src/middleware/validate");
const getRentalStore = require("../src/store/getRentalStore");
const historyRouter = require("../src/routes/history");

function createApp() {
  const app = express();
  app.use("/api/history", historyRouter);
  return app;
}

describe("history routes", () => {
  const app = createApp();
  let mockStore;

  beforeEach(() => {
    jest.clearAllMocks();
    mockStore = {
      listBySession: jest.fn(),
      countBySession: jest.fn(),
    };
    getRentalStore.mockReturnValue(mockStore);
  });

  test("GET /api/history returns rental history for session", async () => {
    sessionId.mockReturnValue("session-123");
    mockStore.listBySession.mockResolvedValue([
      {
        rentalId: "rental-1",
        umbrellaId: "umbrella-1",
        startTime: "2023-01-01T10:00:00Z",
        endTime: "2023-01-01T12:00:00Z",
      }
    ]);
    mockStore.countBySession.mockResolvedValue(5);

    const res = await request(app)
      .get("/api/history")
      .set("X-Session-Id", "session-123");

    expect(res.status).toBe(200);
    expect(sessionId).toHaveBeenCalledWith(
      expect.objectContaining({
        headers: expect.objectContaining({ "x-session-id": "session-123" }),
        query: {},
      })
    );
    expect(mockStore.listBySession).toHaveBeenCalledWith("session-123", { limit: 20, offset: 0 });
    expect(mockStore.countBySession).toHaveBeenCalledWith("session-123");
    expect(res.body).toEqual({
      rentals: [
        {
          rentalId: "rental-1",
          umbrellaId: "umbrella-1",
          startTime: "2023-01-01T10:00:00Z",
          endTime: "2023-01-01T12:00:00Z",
        }
      ],
      total: 5,
      limit: 20,
      offset: 0,
    });
  });

  test("GET /api/history with custom limit and offset", async () => {
    sessionId.mockReturnValue("session-123");
    mockStore.listBySession.mockResolvedValue([]);
    mockStore.countBySession.mockResolvedValue(0);

    const res = await request(app)
      .get("/api/history?limit=10&offset=5")
      .set("X-Session-Id", "session-123");

    expect(res.status).toBe(200);
    expect(mockStore.listBySession).toHaveBeenCalledWith("session-123", { limit: 10, offset: 5 });
    expect(res.body).toEqual({
      rentals: [],
      total: 0,
      limit: 10,
      offset: 5,
    });
  });

  test("GET /api/history with invalid limit uses default", async () => {
    sessionId.mockReturnValue("session-123");
    mockStore.listBySession.mockResolvedValue([]);
    mockStore.countBySession.mockResolvedValue(0);

    const res = await request(app)
      .get("/api/history?limit=invalid&offset=-1")
      .set("X-Session-Id", "session-123");

    expect(res.status).toBe(200);
    expect(mockStore.listBySession).toHaveBeenCalledWith("session-123", { limit: 20, offset: 0 });
  });

  test("GET /api/history with limit over 100 caps at 100", async () => {
    sessionId.mockReturnValue("session-123");
    mockStore.listBySession.mockResolvedValue([]);
    mockStore.countBySession.mockResolvedValue(0);

    const res = await request(app)
      .get("/api/history?limit=200")
      .set("X-Session-Id", "session-123");

    expect(res.status).toBe(200);
    expect(mockStore.listBySession).toHaveBeenCalledWith("session-123", { limit: 20, offset: 0 });
  });

  test("GET /api/history handles store errors", async () => {
    sessionId.mockReturnValue("session-123");
    mockStore.listBySession.mockRejectedValue(new Error("Database error"));

    const res = await request(app)
      .get("/api/history")
      .set("X-Session-Id", "session-123");

    expect(res.status).toBe(500);
  });
});