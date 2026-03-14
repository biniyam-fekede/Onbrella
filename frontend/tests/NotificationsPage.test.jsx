import { beforeEach, describe, expect, it, vi } from "vitest";
import { fireEvent, render, screen } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";
import { NotificationsPage } from "../src/pages/NotificationsPage";

const announcement = {
  enabled: true,
  badge: "Service Update",
  title: "Rainy day reminder",
  message: "Umbrella availability may change quickly during heavy rain.",
  ctaLabel: "Need help?",
  ctaPath: "/profile/help",
};

vi.mock("../src/hooks/useHomeAnnouncement", () => ({
  useHomeAnnouncement: () => announcement,
}));

describe("NotificationsPage", () => {
  beforeEach(() => {
    window.sessionStorage.clear();
  });

  it("hides the announcement after dismissal for the current session", () => {
    const { rerender } = render(
      <MemoryRouter>
        <NotificationsPage />
      </MemoryRouter>
    );

    expect(screen.getByText(/Rainy day reminder/i)).toBeInTheDocument();

    fireEvent.click(screen.getByRole("button", { name: /Dismiss notification/i }));

    expect(screen.getByText(/No new notifications/i)).toBeInTheDocument();

    rerender(
      <MemoryRouter>
        <NotificationsPage />
      </MemoryRouter>
    );

    expect(screen.getByText(/No new notifications/i)).toBeInTheDocument();
  });
});
