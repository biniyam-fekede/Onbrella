import { describe, it, vi, beforeEach } from "vitest";
import { render, screen, waitFor } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";
import { AdminDashboardPage } from "../src/pages/admin/AdminDashboardPage";

// mock api calls
const mockStats = vi.fn();
const mockTrends = vi.fn();
const mockStations = vi.fn();

vi.mock("../src/api/adminClient", () => ({
  adminGetStats: (...args) => mockStats(...args),
  adminGetRentalTrends: (...args) => mockTrends(...args),
  adminGetStations: (...args) => mockStations(...args),
}));

vi.mock("../src/utils/stationNames", () => ({
  getStationDisplayName: (id) => `Station ${id}`,
  getStationAddress: (id) => `Addr ${id}`,
}));

describe("AdminDashboardPage", () => {
  beforeEach(() => {
    mockStats.mockResolvedValue({ activeSessions: 0, openReportsCount: 0 });
    mockTrends.mockResolvedValue({ buckets: [] });
    mockStations.mockResolvedValue({ stations: [] });
  });

  it("renders stats and locations", async () => {
    render(
      <MemoryRouter>
        <AdminDashboardPage />
      </MemoryRouter>
    );

    await waitFor(() => {
      expect(screen.getByText(/Rental Trends/i)).toBeInTheDocument();
    });
  });
});