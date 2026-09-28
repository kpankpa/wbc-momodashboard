"use client";

import { useActionState, useState } from "react";
import {
  simulatePaymentAction,
  type SimulateResult,
} from "@/app/actions/momo";

const initial: SimulateResult | null = null;

export function SimulatePaymentForm() {
  const [state, formAction, pending] = useActionState(simulatePaymentAction, initial);
  const [direction, setDirection] = useState<"INCOMING" | "OUTGOING">("INCOMING");
  const isOut = direction === "OUTGOING";

  return (
    <form action={formAction} className="grid gap-3 sm:grid-cols-2">
      <div className="flex flex-col gap-1 sm:col-span-2">
        <label className="text-xs font-medium text-stone-600" htmlFor="direction">
          Type
        </label>
        <select
          id="direction"
          name="direction"
          value={direction}
          onChange={(e) => setDirection(e.target.value as "INCOMING" | "OUTGOING")}
          className="rounded-md border border-border-brand px-3 py-2 text-sm"
        >
          <option value="INCOMING">Incoming — customer paid company line</option>
          <option value="OUTGOING">Outgoing — company phone sent money</option>
        </select>
      </div>
      <div className="flex flex-col gap-1">
        <label className="text-xs font-medium text-stone-600" htmlFor="counterpartyName">
          {isOut ? "Recipient name" : "Payer name"}
        </label>
        <input
          id="counterpartyName"
          name="counterpartyName"
          defaultValue={isOut ? "Kwame Asante" : "Ama Mensah"}
          className="rounded-md border border-border-brand px-3 py-2 text-sm"
        />
      </div>
      <div className="flex flex-col gap-1">
        <label className="text-xs font-medium text-stone-600" htmlFor="amount">
          Amount (GHS)
        </label>
        <input
          id="amount"
          name="amount"
          type="number"
          step="0.01"
          min="0.01"
          defaultValue="10.00"
          required
          className="rounded-md border border-border-brand px-3 py-2 text-sm"
        />
      </div>
      <div className="flex flex-col gap-1">
        <label className="text-xs font-medium text-stone-600" htmlFor="counterpartyMsisdn">
          {isOut ? "Recipient MSISDN" : "Payer MSISDN"}
        </label>
        <input
          id="counterpartyMsisdn"
          name="counterpartyMsisdn"
          defaultValue={isOut ? "233201112233" : "233241234567"}
          required
          className="rounded-md border border-border-brand px-3 py-2 text-sm"
        />
      </div>
      <div className="flex flex-col gap-1">
        <label className="text-xs font-medium text-stone-600" htmlFor="status">
          Status
        </label>
        <select
          id="status"
          name="status"
          defaultValue="SUCCESSFUL"
          className="rounded-md border border-border-brand px-3 py-2 text-sm"
        >
          <option value="SUCCESSFUL">SUCCESSFUL</option>
          <option value="PENDING">PENDING</option>
          <option value="FAILED">FAILED</option>
        </select>
      </div>
      <div className="flex flex-col gap-1">
        <label className="text-xs font-medium text-stone-600" htmlFor="currency">
          Currency
        </label>
        <input
          id="currency"
          name="currency"
          defaultValue="GHS"
          className="rounded-md border border-border-brand px-3 py-2 text-sm"
        />
      </div>
      {state && !state.ok ? (
        <p className="sm:col-span-2 text-sm text-red-700" role="alert">
          {state.error}
        </p>
      ) : null}
      {state?.ok ? (
        <p className="sm:col-span-2 text-sm text-brand">
          Ingested <code className="rounded bg-white/80 px-1">{state.externalId}</code>
        </p>
      ) : null}
      <div className="sm:col-span-2">
        <button
          type="submit"
          disabled={pending}
          className="rounded-md bg-brand px-4 py-2 text-sm font-semibold text-white hover:bg-brand-strong disabled:opacity-60"
        >
          {pending
            ? "Simulating…"
            : isOut
              ? "Simulate phone send (outgoing)"
              : "Simulate incoming payment"}
        </button>
      </div>
    </form>
  );
}
