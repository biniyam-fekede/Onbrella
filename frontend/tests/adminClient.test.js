import { beforeEach, describe, expect, it, vi } from "vitest";
import * as adminClient from "../src/api/adminClient";

const mockGetSession = vi.fn();
const mockRefreshSession = vi.fn();
const fetchMock = vi.fn();

vi.mock("../src/lib/supabase/client", () => ({
  supabase: {
    auth: {
      getSession: () => mockGetSession(),
      refreshSession: () => mockRefreshSession(),
    },
  },
}));

describe("adminClient", () => {
  beforeEach(() => {
    vi.resetAllMocks();
    vi.stubGlobal("fetch", fetchMock);
    mockGetSession.mockResolvedValue({
      data: { session: { access_token: "header.eyJleHAiOjQxMDI0NDQ4MDB9.signature" } },
    });
    mockRefreshSession.mockResolvedValue({
      data: { session: { access_token: "header.eyJleHAiOjQxMDI0NDQ4MDB9.signature" } },
      error: null,
    });
  });

  it("adminGetPricing sends an authenticated GET request", async () => {
    const fake = { unlockFeeCents: 123, centsPerMinute: 45 };
    fetchMock.mockResolvedValue({
      ok: true,
      status: 200,
      json: () => Promise.resolve(fake),
    });

    const result = await adminClient.adminGetPricing();

    expect(fetchMock).toHaveBeenCalledWith(
      "/api/admin/pricing",
      expect.objectContaining({
        method: "GET",
        headers: expect.objectContaining({
          "Content-Type": "application/json",
          Authorization: expect.stringMatching(/^Bearer /),
        }),
      })
    );
    expect(result).toEqual(fake);
  });

  it("adminUpdatePricing sends the pricing payload", async () => {
    const fake = { unlockFeeCents: 222, centsPerMinute: 33 };
    fetchMock.mockResolvedValue({
      ok: true,
      status: 200,
      json: () => Promise.resolve(fake),
    });

    const result = await adminClient.adminUpdatePricing(222, 33);

    expect(fetchMock).toHaveBeenCalledWith(
      "/api/admin/pricing",
      expect.objectContaining({
        method: "PUT",
        body: JSON.stringify({ unlockFeeCents: 222, centsPerMinute: 33 }),
      })
    );
    expect(result).toEqual(fake);
  });
});