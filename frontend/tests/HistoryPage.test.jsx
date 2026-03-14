import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, waitFor, fireEvent } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";
import { HistoryPage } from "../src/pages/HistoryPage";

const mockGetRentalHistory = vi.fn();

vi.mock("../src/api", () => ({
  getRentalHistory: (...args) => mockGetRentalHistory(...args),
}));

vi.mock("../src/utils/stationNames", () => ({
  getStationDisplayName: (id) => (id ? `Station ${id}` : "—"),
}));

describe("HistoryPage", () => {
  beforeEach(() => {
    mockGetRentalHistory.mockReset();
  });

  it("renders Back to map link and Rental History heading", async () => {
    mockGetRentalHistory.mockResolvedValue({ rentals: [], total: 0, limit: 50, offset: 0 });
    render(
      <MemoryRouter>
        <HistoryPage />
      </MemoryRouter>
    );
    expect(screen.getByText("Back to map")).toBeInTheDocument();
    expect(screen.getByRole("heading", { name: /Rental History/i })).toBeInTheDocument();
    await waitFor(() => {
      expect(screen.queryByText(/Loading history…/)).not.toBeInTheDocument();
    });
  });

  it("shows loading then empty state when no rentals", async () => {
    mockGetRentalHistory.mockResolvedValue({ rentals: [], total: 0, limit: 50, offset: 0 });
    render(
      <MemoryRouter>
        <HistoryPage />
      </MemoryRouter>
    );
    expect(screen.getByText(/Loading history…/)).toBeInTheDocument();
    await waitFor(() => {
      expect(screen.getByText("No rentals yet")).toBeInTheDocument();
    });
    expect(screen.getByText(/When you complete rentals in this browser/)).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /Try again/i })).toBeInTheDocument();
  });

  it("shows error and Try again when getRentalHistory fails", async () => {
    mockGetRentalHistory.mockRejectedValue(new Error("Network error"));
    render(
      <MemoryRouter>
        <HistoryPage />
      </MemoryRouter>
    );
    await waitFor(() => {
      expect(screen.getByText(/Network error/)).toBeInTheDocument();
    });
    const tryAgain = screen.getByRole("button", { name: /Try again/i });
    expect(tryAgain).toBeInTheDocument();
    fireEvent.click(tryAgain);
    expect(mockGetRentalHistory).toHaveBeenCalledTimes(2);
  });

  it("renders rental cards when history returns data", async () => {
    const start = "2024-10-24T10:00:00.000Z";
    const end = "2024-10-24T11:30:00.000Z";
    mockGetRentalHistory.mockResolvedValue({
      rentals: [
        {
          rentalId: "r1",
          stationId: "s1",
          returnStationId: "s2",
          startTime: start,
          endTime: end,
        },
      ],
      total: 1,
      limit: 50,
      offset: 0,
    });
    render(
      <MemoryRouter>
        <HistoryPage />
      </MemoryRouter>
    );
    await waitFor(() => {
      expect(screen.getByText("Station s1")).toBeInTheDocument();
      expect(screen.getByText("Station s2")).toBeInTheDocument();
    });
    expect(screen.getByText("Picked up")).toBeInTheDocument();
    expect(screen.getByText("Returned")).toBeInTheDocument();
    expect(screen.getByText("Duration")).toBeInTheDocument();
  });
});
