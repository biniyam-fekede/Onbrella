import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";
import { ProfilePage } from "../src/pages/ProfilePage";

const mockLogout = vi.fn();

vi.mock("../src/context/UserContext", () => ({
  useUser: () => ({
    user: { id: "u1", name: "Test User", email: "test@example.com", avatarUrl: null },
    loading: false,
    error: null,
    refreshUser: vi.fn(),
    updateUser: vi.fn(),
  }),
}));

vi.mock("../src/hooks/useAuth", () => ({
  useAuth: () => ({ logout: mockLogout, isLoggingOut: false }),
}));

describe("ProfilePage", () => {
  beforeEach(() => {
    mockLogout.mockReset();
  });

  it("renders back to map link and user display name", () => {
    render(
      <MemoryRouter>
        <ProfilePage />
      </MemoryRouter>
    );
    expect(screen.getByText(/Back to map/)).toBeInTheDocument();
    expect(screen.getByRole("heading", { name: /Hey, Test User/i })).toBeInTheDocument();
    expect(screen.getByText("test@example.com")).toBeInTheDocument();
  });

  it("renders account menu and rental history section", () => {
    render(
      <MemoryRouter>
        <ProfilePage />
      </MemoryRouter>
    );
    expect(screen.getByText("Personal Information")).toBeInTheDocument();
    expect(screen.getByText("Rental history")).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /log out/i })).toBeInTheDocument();
  });

  it("includes Rental history link to /history", () => {
    render(
      <MemoryRouter>
        <ProfilePage />
      </MemoryRouter>
    );
    const historyLink = screen.getByText("Rental history");
    expect(historyLink).toBeInTheDocument();
    expect(historyLink.closest("a")).toHaveAttribute("href", "/history");
  });

  it("calls logout when Log Out is clicked", () => {
    render(
      <MemoryRouter>
        <ProfilePage />
      </MemoryRouter>
    );
    fireEvent.click(screen.getByRole("button", { name: /log out/i }));
    expect(mockLogout).toHaveBeenCalledTimes(1);
  });
});
