import { describe, it, vi, beforeEach } from "vitest";
import { render, screen, waitFor, fireEvent } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";
import { AdminInventoryPage } from "../src/pages/admin/AdminInventoryPage";

// mock api calls
const mockInventory = vi.fn();
const mockGetStations = vi.fn();
const mockCreateStation = vi.fn();
const mockUpdateStationStatus = vi.fn();
const mockUpdateStation = vi.fn();
const mockDeleteStation = vi.fn();
const mockGetPricing = vi.fn();
const mockUpdatePricing = vi.fn();

vi.mock("../src/api/adminClient", async (importOriginal) => {
  const actual = await importOriginal();
  return {
    ...actual,
    adminGetInventory: (...args) => mockInventory(...args),
    adminGetStations: (...args) => mockGetStations(...args),
    adminCreateStation: (...args) => mockCreateStation(...args),
    adminUpdateStationStatus: (...args) => mockUpdateStationStatus(...args),
    adminUpdateStation: (...args) => mockUpdateStation(...args),
    adminDeleteStation: (...args) => mockDeleteStation(...args),
    adminGetPricing: (...args) => mockGetPricing(...args),
    adminUpdatePricing: (...args) => mockUpdatePricing(...args),
  };
});

describe("AdminInventoryPage", () => {
  beforeEach(() => {
    mockInventory.mockResolvedValue({ inventory: [] });
    mockGetStations.mockResolvedValue({ stations: [] });
    mockCreateStation.mockResolvedValue({});
    mockUpdateStationStatus.mockResolvedValue({});
    mockUpdateStation.mockResolvedValue({});
    mockDeleteStation.mockResolvedValue({});
    mockGetPricing.mockResolvedValue({ unlockFeeCents: 100, centsPerMinute: 10 });
    mockUpdatePricing.mockResolvedValue({ unlockFeeCents: 200, centsPerMinute: 20 });
  });

  it("renders inventory and pricing", async () => {
    render(
      <MemoryRouter>
        <AdminInventoryPage />
      </MemoryRouter>
    );

    await waitFor(() => {
      expect(screen.getByText(/Inventory/i)).toBeInTheDocument();
    });

    await waitFor(() => {
      expect(screen.getByText(/Pricing/i)).toBeInTheDocument();
    });
  });

  it("renders pricing card and allows updates", async () => {
    render(
      <MemoryRouter>
        <AdminInventoryPage />
      </MemoryRouter>
    );

    await waitFor(() => {
      expect(screen.getByText(/Pricing/i)).toBeInTheDocument();
    });

    const unlockInput = screen.getByLabelText(/Unlock fee/i);
    expect(unlockInput.value).toBe("100");

    fireEvent.change(unlockInput, { target: { value: "250" } });
    fireEvent.click(screen.getByRole("button", { name: /save/i }));

    await waitFor(() => {
      expect(mockUpdatePricing).toHaveBeenCalledWith(250, 10);
    });
  });

  it("shows a pricing error when the backend pricing load fails", async () => {
    mockGetPricing.mockRejectedValueOnce(new Error("Pricing endpoint unavailable"));

    render(
      <MemoryRouter>
        <AdminInventoryPage />
      </MemoryRouter>
    );

    await waitFor(() => {
      expect(screen.getByText(/Pricing endpoint unavailable/i)).toBeInTheDocument();
    });

    expect(screen.getByLabelText(/Unlock fee/i).value).toBe("100");
    expect(screen.getByLabelText(/Per-minute charge/i).value).toBe("10");
  });
});