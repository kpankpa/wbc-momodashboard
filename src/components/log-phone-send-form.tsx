"use client";

import { useActionState } from "react";
import { logPhoneSendAction, type SimulateResult } from "@/app/actions/momo";

const initial: SimulateResult | null = null;

export function LogPhoneSendForm() {
  const [state, formAction, pending] = useActionState(logPhoneSendAction, initial);

  return (
    <form action={formAction} className="grid gap-3 sm:grid-cols-2">
      <div className="flex flex-col gap-1">
        <label className="text-xs font-medium text-stone-600" htmlFor="payeeName">
          Recipient name
        </label>
        <input
          id="payeeName"
          name="payeeName"
          placeholder="Who received the money"
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
          required
          className="rounded-md border border-border-brand px-3 py-2 text-sm"
        />
      </div>
      <div className="flex flex-col gap-1">
        <label className="text-xs font-medium text-stone-600" htmlFor="payeeMsisdn">
          Recipient MoMo number
        </label>
        <input
          id="payeeMsisdn"
          name="payeeMsisdn"
          placeholder="233XXXXXXXXX"
          required
          className="rounded-md border border-border-brand px-3 py-2 text-sm"
        />
      </div>
      <div className="flex flex-col gap-1">
        <label className="text-xs font-medium text-stone-600" htmlFor="note">
          Note (optional)
        </label>
        <input
          id="note"
          name="note"
          placeholder="e.g. supplier payment"
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
          Logged phone send — live alert fired.{" "}
          <code className="rounded bg-white/80 px-1">{state.externalId}</code>
        </p>
      ) : null}
      <div className="sm:col-span-2">
        <button
          type="submit"
          disabled={pending}
          className="rounded-md bg-brand-strong px-4 py-2 text-sm font-semibold text-white hover:bg-brand-ink disabled:opacity-60"
        >
          {pending ? "Logging…" : "Log phone send + alert dashboard"}
        </button>
      </div>
    </form>
  );
}
