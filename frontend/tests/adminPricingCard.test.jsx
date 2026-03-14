import { describe, it, expect, vi } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";
import { PricingCard } from "../src/components/admin/PricingCard";

describe("PricingCard", () => {
  it("displays initial values and calls onSave when submitted", async () => {
    const onSave = vi.fn().mockResolvedValue({});
    render(<PricingCard pricing={{ unlockFeeCents: 100, centsPerMinute: 10 }} onSave={onSave} saving={false} error={null} />);

    expect(screen.getByLabelText(/Unlock fee/i).value).toBe("100");
    expect(screen.getByLabelText(/Per-minute charge/i).value).toBe("10");

    fireEvent.change(screen.getByLabelText(/Unlock fee/i), { target: { value: "150" } });
    fireEvent.click(screen.getByRole("button", { name: /save/i }));

    expect(onSave).toHaveBeenCalledWith({ unlockFeeCents: 150, centsPerMinute: 10 });
  });

  it("syncs the form when the pricing prop changes", () => {
    const { rerender } = render(
      <PricingCard
        pricing={{ unlockFeeCents: 100, centsPerMinute: 10 }}
        onSave={vi.fn()}
        saving={false}
        error={null}
      />
    );

    rerender(
      <PricingCard
        pricing={{ unlockFeeCents: 250, centsPerMinute: 25 }}
        onSave={vi.fn()}
        saving={false}
        error={null}
      />
    );

    expect(screen.getByLabelText(/Unlock fee/i).value).toBe("250");
    expect(screen.getByLabelText(/Per-minute charge/i).value).toBe("25");
  });
});