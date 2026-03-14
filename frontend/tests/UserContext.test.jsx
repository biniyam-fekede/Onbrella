import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, waitFor } from "@testing-library/react";
import { UserProvider, useUser } from "../src/context/UserContext";

function TestConsumer() {
  const { user, loading, error } = useUser();
  if (loading) return <span>Loading</span>;
  if (error) return <span>Error: {error}</span>;
  if (user) return <span>User: {user.name}</span>;
  return <span>No user</span>;
}

const mockGetSession = vi.fn();
const mockGetUser = vi.fn();
const mockFrom = vi.fn();

vi.mock("../src/lib/supabase/client", () => ({
  supabase: {
    auth: {
      getSession: () => mockGetSession(),
      getUser: () => mockGetUser(),
      onAuthStateChange: () => ({ data: { subscription: { unsubscribe: vi.fn() } } }),
    },
    from: (table) => mockFrom(table),
    storage: { from: () => ({ getPublicUrl: () => ({ data: { publicUrl: "https://example.com/avatar.jpg" } }), upload: () => ({ error: null }) }) },
  },
}));

describe("UserContext", () => {
  beforeEach(() => {
    vi.resetAllMocks();
    mockGetSession.mockResolvedValue({ data: { session: null }, error: null });
    mockGetUser.mockResolvedValue({ data: { user: null }, error: null });
  });

  it("starts with loading then shows no user when session is null", async () => {
    render(
      <UserProvider>
        <TestConsumer />
      </UserProvider>
    );
    expect(screen.getByText("Loading")).toBeInTheDocument();
    await waitFor(() => {
      expect(screen.getByText("No user")).toBeInTheDocument();
    });
  });

  it("provides user when session and profile are available", async () => {
    mockGetSession.mockResolvedValue({
      data: { session: { user: { id: "uid" } } },
      error: null,
    });
    mockGetUser.mockResolvedValue({
      data: { user: { id: "uid", email: "u@x.com", user_metadata: {} } },
      error: null,
    });
    mockFrom.mockReturnValue({
      select: () => ({
        eq: () => ({
          maybeSingle: () =>
            Promise.resolve({
              data: { id: "uid", full_name: "Alice", email: "u@x.com", bio: "", avatar_url: null },
              error: null,
            }),
        }),
      }),
    });

    render(
      <UserProvider>
        <TestConsumer />
      </UserProvider>
    );

    await waitFor(() => {
      expect(screen.getByText("User: Alice")).toBeInTheDocument();
    });
  });
});
