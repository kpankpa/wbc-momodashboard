"use client";

import { useActionState } from "react";
import {
  createUserAction,
  setUserActiveAction,
  type ActionResult,
} from "@/app/actions/auth";

const initial: ActionResult | null = null;

export function CreateUserForm() {
  const [state, formAction, pending] = useActionState(createUserAction, initial);

  return (
    <form action={formAction} className="grid gap-3 sm:grid-cols-2">
      <div className="flex flex-col gap-1">
        <label className="text-xs font-medium text-stone-600" htmlFor="name">
          Name
        </label>
        <input
          id="name"
          name="name"
          className="rounded-md border border-stone-300 px-3 py-2 text-sm"
        />
      </div>
      <div className="flex flex-col gap-1">
        <label className="text-xs font-medium text-stone-600" htmlFor="email">
          Email
        </label>
        <input
          id="email"
          name="email"
          type="email"
          required
          className="rounded-md border border-stone-300 px-3 py-2 text-sm"
        />
      </div>
      <div className="flex flex-col gap-1">
        <label className="text-xs font-medium text-stone-600" htmlFor="password">
          Temporary password
        </label>
        <input
          id="password"
          name="password"
          type="password"
          required
          minLength={12}
          className="rounded-md border border-stone-300 px-3 py-2 text-sm"
        />
      </div>
      <div className="flex flex-col gap-1">
        <label className="text-xs font-medium text-stone-600" htmlFor="role">
          Role
        </label>
        <select
          id="role"
          name="role"
          defaultValue="STAFF"
          className="rounded-md border border-stone-300 px-3 py-2 text-sm"
        >
          <option value="STAFF">STAFF</option>
          <option value="VIEWER">VIEWER</option>
          <option value="ADMIN">ADMIN</option>
        </select>
      </div>
      {state && !state.ok ? (
        <p className="sm:col-span-2 text-sm text-red-700" role="alert">
          {state.error}
        </p>
      ) : null}
      {state?.ok ? (
        <p className="sm:col-span-2 text-sm text-emerald-800">User created.</p>
      ) : null}
      <div className="sm:col-span-2">
        <button
          type="submit"
          disabled={pending}
          className="rounded-md bg-emerald-800 px-4 py-2 text-sm font-semibold text-white hover:bg-emerald-900 disabled:opacity-60"
        >
          {pending ? "Creating…" : "Invite user"}
        </button>
      </div>
    </form>
  );
}

export function ToggleUserForm({
  userId,
  active,
}: {
  userId: string;
  active: boolean;
}) {
  const [state, formAction, pending] = useActionState(setUserActiveAction, initial);

  return (
    <form action={formAction} className="inline">
      <input type="hidden" name="userId" value={userId} />
      <input type="hidden" name="active" value={active ? "false" : "true"} />
      <button
        type="submit"
        disabled={pending}
        className="text-sm text-emerald-900 underline-offset-2 hover:underline disabled:opacity-50"
      >
        {active ? "Deactivate" : "Activate"}
      </button>
      {state && !state.ok ? (
        <span className="ml-2 text-xs text-red-700">{state.error}</span>
      ) : null}
    </form>
  );
}
