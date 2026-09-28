"use client";

import { useActionState } from "react";
import { loginAction, type ActionResult } from "@/app/actions/auth";

const initial: ActionResult | null = null;

export function LoginForm() {
  const [state, formAction, pending] = useActionState(loginAction, initial);

  return (
    <form action={formAction} className="flex w-full flex-col gap-4">
      <div className="flex flex-col gap-1.5">
        <label htmlFor="email" className="text-sm font-medium text-stone-700">
          Work email
        </label>
        <input
          id="email"
          name="email"
          type="email"
          autoComplete="username"
          required
          className="rounded-md border border-border-brand bg-white px-3 py-2.5 text-brand-ink outline-none ring-brand/30 focus:ring-2"
        />
      </div>
      <div className="flex flex-col gap-1.5">
        <label htmlFor="password" className="text-sm font-medium text-stone-700">
          Password
        </label>
        <input
          id="password"
          name="password"
          type="password"
          autoComplete="current-password"
          required
          className="rounded-md border border-border-brand bg-white px-3 py-2.5 text-brand-ink outline-none ring-brand/30 focus:ring-2"
        />
      </div>
      {state && !state.ok ? (
        <p className="rounded-md border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-800" role="alert">
          {state.error}
        </p>
      ) : null}
      <button
        type="submit"
        disabled={pending}
        className="mt-1 rounded-md bg-brand px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-brand-strong disabled:opacity-60"
      >
        {pending ? "Signing in…" : "Sign in"}
      </button>
    </form>
  );
}
