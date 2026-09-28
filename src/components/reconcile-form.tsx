"use client";

import { useActionState } from "react";
import {
  updateReconcileAction,
  type ReconcileResult,
} from "@/app/actions/transactions";
import { VERIFICATION_STATUSES } from "@/lib/transactions/filters";

const initial: ReconcileResult | null = null;

type Props = {
  transactionId: string;
  verificationStatus: string;
  internalNote: string | null;
  orderReference: string | null;
};

export function ReconcileForm({
  transactionId,
  verificationStatus,
  internalNote,
  orderReference,
}: Props) {
  const [state, formAction, pending] = useActionState(updateReconcileAction, initial);

  return (
    <form action={formAction} className="mt-6 space-y-4 rounded-xl border border-stone-200 bg-white p-5">
      <input type="hidden" name="transactionId" value={transactionId} />
      <h2 className="text-sm font-semibold text-stone-900">Reconciliation</h2>
      <p className="text-xs text-stone-500">
        Mark payments as verified against your books, or flag disputes. Add invoice/order notes for finance.
      </p>

      <div className="grid gap-3 sm:grid-cols-2">
        <div className="flex flex-col gap-1">
          <label className="text-xs font-medium text-stone-600" htmlFor="verificationStatus">
            Verification
          </label>
          <select
            id="verificationStatus"
            name="verificationStatus"
            defaultValue={verificationStatus}
            className="rounded-md border border-stone-300 px-3 py-2 text-sm"
          >
            {VERIFICATION_STATUSES.map((status) => (
              <option key={status} value={status}>
                {status}
              </option>
            ))}
          </select>
        </div>
        <div className="flex flex-col gap-1">
          <label className="text-xs font-medium text-stone-600" htmlFor="orderReference">
            Order / invoice ref
          </label>
          <input
            id="orderReference"
            name="orderReference"
            defaultValue={orderReference || ""}
            maxLength={120}
            className="rounded-md border border-stone-300 px-3 py-2 text-sm"
          />
        </div>
        <div className="flex flex-col gap-1 sm:col-span-2">
          <label className="text-xs font-medium text-stone-600" htmlFor="internalNote">
            Internal note
          </label>
          <textarea
            id="internalNote"
            name="internalNote"
            rows={3}
            defaultValue={internalNote || ""}
            maxLength={1000}
            className="rounded-md border border-stone-300 px-3 py-2 text-sm"
          />
        </div>
      </div>

      {state && !state.ok ? (
        <p className="text-sm text-red-700" role="alert">
          {state.error}
        </p>
      ) : null}
      {state?.ok ? (
        <p className="text-sm text-emerald-800">Saved.</p>
      ) : null}

      <button
        type="submit"
        disabled={pending}
        className="rounded-md bg-emerald-800 px-4 py-2 text-sm font-semibold text-white hover:bg-emerald-900 disabled:opacity-60"
      >
        {pending ? "Saving…" : "Save reconciliation"}
      </button>
    </form>
  );
}
