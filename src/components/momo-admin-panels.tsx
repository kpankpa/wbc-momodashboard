"use client";

import { useActionState, useState, useTransition } from "react";
import {
  pollMomoStatusAction,
  testMomoConnectionAction,
  type MomoActionResult,
} from "@/app/actions/momo-admin";

const initial: MomoActionResult | null = null;

export function MomoConnectionTest() {
  const [result, setResult] = useState<MomoActionResult | null>(null);
  const [pending, startTransition] = useTransition();

  return (
    <div className="rounded-xl border border-stone-200 bg-white p-5">
      <h2 className="text-sm font-semibold text-stone-900">Connection test</h2>
      <p className="mt-1 text-xs text-stone-500">
        Requests a Collections access token using your server-side credentials. Secrets never leave the server.
      </p>
      <button
        type="button"
        disabled={pending}
        onClick={() => {
          startTransition(async () => {
            setResult(await testMomoConnectionAction());
          });
        }}
        className="mt-4 rounded-md bg-emerald-800 px-4 py-2 text-sm font-semibold text-white hover:bg-emerald-900 disabled:opacity-60"
      >
        {pending ? "Testing…" : "Test MoMo token"}
      </button>
      {result?.ok ? (
        <p className="mt-3 text-sm text-emerald-800">{result.message}</p>
      ) : null}
      {result && !result.ok ? (
        <p className="mt-3 text-sm text-red-700" role="alert">
          {result.error}
        </p>
      ) : null}
    </div>
  );
}

export function MomoPollForm() {
  const [state, formAction, pending] = useActionState(pollMomoStatusAction, initial);

  return (
    <form action={formAction} className="rounded-xl border border-stone-200 bg-white p-5">
      <h2 className="text-sm font-semibold text-stone-900">Poll missing payment</h2>
      <p className="mt-1 text-xs text-stone-500">
        If MTN accepted a request-to-pay but no webhook arrived, poll by the original{" "}
        <code className="rounded bg-stone-100 px-1">X-Reference-Id</code> and sync into the dashboard.
      </p>
      <div className="mt-4 flex flex-col gap-1">
        <label className="text-xs font-medium text-stone-600" htmlFor="referenceId">
          Reference ID
        </label>
        <input
          id="referenceId"
          name="referenceId"
          required
          placeholder="xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx"
          className="rounded-md border border-stone-300 px-3 py-2 font-mono text-sm"
        />
      </div>
      {state?.ok ? (
        <p className="mt-3 text-sm text-emerald-800">{state.message}</p>
      ) : null}
      {state && !state.ok ? (
        <p className="mt-3 text-sm text-red-700" role="alert">
          {state.error}
        </p>
      ) : null}
      <button
        type="submit"
        disabled={pending}
        className="mt-4 rounded-md border border-emerald-800 px-4 py-2 text-sm font-semibold text-emerald-900 hover:bg-emerald-50 disabled:opacity-60"
      >
        {pending ? "Polling…" : "Poll & ingest"}
      </button>
    </form>
  );
}
