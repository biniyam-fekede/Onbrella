import { beforeEach, describe, expect, it, vi } from "vitest";
import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";
import { PersonalInfoPage } from "../src/pages/PersonalInfoPage";

const mockUpdateUser = vi.fn();

vi.mock("../src/context/UserContext", () => ({
  useUser: () => ({
    user: {
      id: "user-1",
      name: "Jane Doe",
      email: "jane@example.com",
      description: "Bio text",
    },
    loading: false,
    updateUser: mockUpdateUser,
  }),
}));

// TODO: Re-enable after investigating why this file hangs the Vitest worker in jsdom.
describe.skip("PersonalInfoPage", () => {
  beforeEach(() => {
    mockUpdateUser.mockReset();
  });

  function renderPage() {
    return render(
      <MemoryRouter>
        <PersonalInfoPage />
      </MemoryRouter>
    );
  }

  it("renders the current profile fields", () => {
    renderPage();

    expect(screen.getByRole("heading", { name: /Personal Information/i })).toBeInTheDocument();
    expect(screen.getByText("Back to account")).toBeInTheDocument();
    expect(screen.getByDisplayValue("Jane Doe")).toBeInTheDocument();
    expect(screen.getByDisplayValue("jane@example.com")).toBeInTheDocument();
  });

  it("submits updated values", async () => {
    renderPage();

    fireEvent.change(screen.getByPlaceholderText(/Full name/i), {
      target: { value: "Jane Smith" },
    });
    fireEvent.click(screen.getByRole("button", { name: /Save Changes/i }));

    await waitFor(() => {
      expect(mockUpdateUser).toHaveBeenCalledWith({
        name: "Jane Smith",
        email: "jane@example.com",
        location: "",
      });
    });
  });

  it("validates required fields before saving", async () => {
    renderPage();

    fireEvent.change(screen.getByPlaceholderText(/Full name/i), {
      target: { value: "   " },
    });
    fireEvent.click(screen.getByRole("button", { name: /Save Changes/i }));

    await waitFor(() => {
      expect(screen.getByText("Name is required.")).toBeInTheDocument();
    });
    expect(mockUpdateUser).not.toHaveBeenCalled();
  });
});
