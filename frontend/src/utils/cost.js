import { config } from "../config";

/**
 * Cost calculation. Extensible: move to API or config later.
 */
export function computeRentalCostCents(durationMs) {
  const minutes = Math.ceil(durationMs / 60000);
  return config.unlockFeeCents + minutes * config.centsPerMinute;
}

export function formatCost(cents) {
  return `$${(cents / 100).toFixed(2)}`;
}
