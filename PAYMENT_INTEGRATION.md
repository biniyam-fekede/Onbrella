# Payment Integration Roadmap

This repository includes placeholder payment UI code, but it does not yet contain a production payment flow. The current app calculates rental cost on return and displays that amount to the user; it does not create real charges, save payment methods, or complete Stripe transactions.

## Current Status

- `frontend/src/components/PaymentForm.jsx` and `frontend/src/hooks/usePayment.js` are development-only scaffolding.
- The app still routes `/profile/payment-methods` to `ComingSoonPage`.
- No backend payment endpoints or Stripe SDK integration are wired into the active user flow.

## Scope Boundary

Treat the current payment code as a prototype, not a finished integration. It is useful for UI experimentation and tests, but it should not be presented as a live billing implementation.

## Recommended Implementation Plan

1. Add Stripe client dependencies to `frontend/` and initialize Stripe with Vite environment variables.
2. Replace manual card fields with Stripe Elements.
3. Add backend endpoints for payment intent creation and payment confirmation.
4. Connect payment completion to the return flow so the user pays the same amount the backend calculated for the rental.
5. Persist payment outcomes and add test coverage for success, decline, and retry flows.

## Environment Variables

Use Vite-style variables in the frontend and server-side secrets in the backend:

```env
# frontend/.env
VITE_STRIPE_PUBLISHABLE_KEY=pk_test_...

# backend/.env
STRIPE_SECRET_KEY=sk_test_...
```

Never expose the secret key to the frontend.

## Engineering Notes

- Keep the backend as the source of truth for pricing and charge amounts.
- Never log full card details, even in development.
- Run payment screens only over HTTPS outside local development.
- Use Stripe test cards and webhook-based validation before enabling live mode.