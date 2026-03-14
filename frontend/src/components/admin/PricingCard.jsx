import { useEffect, useState } from "react";

/**
 * Card with form to view/update pricing settings.
 * Props:
 *   pricing: { unlockFeeCents: number, centsPerMinute: number }
 *   onSave: (newPricing) => Promise<any>
 *   saving: boolean
 *   error: string|null
 */
export function PricingCard({ pricing = {}, onSave, saving = false, error }) {
  const [unlockFee, setUnlockFee] = useState(pricing.unlockFeeCents || 0);
  const [perMinute, setPerMinute] = useState(pricing.centsPerMinute || 0);

  useEffect(() => {
    setUnlockFee(pricing.unlockFeeCents || 0);
    setPerMinute(pricing.centsPerMinute || 0);
  }, [pricing.unlockFeeCents, pricing.centsPerMinute]);

  async function handleSubmit(e) {
    e.preventDefault();
    if (onSave) {
      await onSave({ unlockFeeCents: Number(unlockFee), centsPerMinute: Number(perMinute) });
    }
  }

  return (
    <div className="bg-white dark:bg-slate-800 p-5 rounded-2xl border border-slate-100 dark:border-slate-800 shadow-sm">
      <div className="mb-4">
        <h3 className="font-bold text-sm text-slate-800 dark:text-white">Pricing</h3>
        <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">
          Saved in the backend config table and used for future rental returns.
        </p>
      </div>
      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label htmlFor="unlock-fee" className="block text-xs font-medium text-slate-500 dark:text-slate-400">
            Unlock fee (cents)
          </label>
          <input
            id="unlock-fee"
            type="number"
            min="0"
            value={unlockFee}
            onChange={(e) => setUnlockFee(e.target.value)}
            className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm"
          />
        </div>
        <div>
          <label htmlFor="per-minute-charge" className="block text-xs font-medium text-slate-500 dark:text-slate-400">
            Per-minute charge (cents)
          </label>
          <input
            id="per-minute-charge"
            type="number"
            min="0"
            value={perMinute}
            onChange={(e) => setPerMinute(e.target.value)}
            className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm"
          />
        </div>
        {error && <p className="text-rose-600 text-xs">{error}</p>}
        <button
          type="submit"
          disabled={saving}
          className="inline-flex justify-center py-2 px-4 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 disabled:opacity-50"
        >
          {saving ? "Saving…" : "Save"}
        </button>
      </form>
    </div>
  );
}