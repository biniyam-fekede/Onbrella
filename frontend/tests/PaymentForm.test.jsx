import { describe, it, vi, beforeEach } from "vitest";
import { render, screen, waitFor, fireEvent } from "@testing-library/react";
import { PaymentForm } from "../src/components/PaymentForm";

// Mock the usePayment hook
const mockProcessPayment = vi.fn();
const mockClearError = vi.fn();

vi.mock("../src/hooks/usePayment", () => ({
  usePayment: () => ({
    processPayment: mockProcessPayment,
    isProcessing: false,
    error: null,
    clearError: mockClearError,
  }),
}));

describe("PaymentForm", () => {
  beforeEach(() => {
    mockProcessPayment.mockClear();
    mockClearError.mockClear();
  });

  it("renders payment form with amount", () => {
    render(<PaymentForm amount={500} currency="usd" />);

    expect(screen.getByText("Payment Details")).toBeInTheDocument();
    expect(screen.getByText("$5.00")).toBeInTheDocument();
    expect(screen.getByLabelText(/Card Number/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/Exp Month/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/Exp Year/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/CVC/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/Name on Card/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/Email/i)).toBeInTheDocument();
  });

  it("shows development notice", () => {
    render(<PaymentForm amount={1000} />);

    expect(screen.getByText(/Development Mode/i)).toBeInTheDocument();
    expect(screen.getByText(/placeholder payment form/i)).toBeInTheDocument();
  });

  it("calls processPayment on form submission", async () => {
    mockProcessPayment.mockResolvedValue({
      id: "pi_test",
      status: "succeeded",
      amount: 1000,
    });

    render(<PaymentForm amount={1000} />);

    // Fill out the form
    fireEvent.change(screen.getByLabelText(/Card Number/i), {
      target: { value: "4242424242424242" },
    });
    fireEvent.change(screen.getByLabelText(/Exp Month/i), {
      target: { value: "12" },
    });
    fireEvent.change(screen.getByLabelText(/Exp Year/i), {
      target: { value: "2025" },
    });
    fireEvent.change(screen.getByLabelText(/CVC/i), {
      target: { value: "123" },
    });
    fireEvent.change(screen.getByLabelText(/Name on Card/i), {
      target: { value: "John Doe" },
    });
    fireEvent.change(screen.getByLabelText(/Email/i), {
      target: { value: "john@example.com" },
    });

    // Submit the form
    fireEvent.click(screen.getByRole("button", { name: /Pay \$10\.00/i }));

    await waitFor(() => {
      expect(mockProcessPayment).toHaveBeenCalledWith({
        amount: 1000,
        currency: "usd",
        card: {
          number: "4242424242424242",
          expMonth: "12",
          expYear: "2025",
          cvc: "123",
        },
        billingDetails: {
          name: "John Doe",
          email: "john@example.com",
          address: {
            line1: "",
            city: "",
            state: "",
            postal_code: "",
            country: "US",
          },
        },
      });
    });
  });
});