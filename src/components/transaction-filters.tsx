import Link from "next/link";
import {
  TX_DIRECTIONS,
  TX_STATUSES,
  VERIFICATION_STATUSES,
} from "@/lib/transactions/filters";

type Props = {
  q?: string;
  status?: string;
  verification?: string;
  direction?: string;
  from?: string;
  to?: string;
  today?: string;
};

export function TransactionFilters({
  q,
  status,
  verification,
  direction,
  from,
  to,
  today,
}: Props) {
  return (
    <form className="grid gap-3 rounded-xl border border-stone-200 bg-white p-4 sm:grid-cols-2 lg:grid-cols-8">
      <div className="flex flex-col gap-1 lg:col-span-2">
        <label className="text-xs font-medium text-stone-600" htmlFor="q">
          Search
        </label>
        <input
          id="q"
          name="q"
          defaultValue={q}
          placeholder="Name, phone, ref…"
          className="rounded-md border border-stone-300 px-3 py-2 text-sm"
        />
      </div>
      <div className="flex flex-col gap-1">
        <label className="text-xs font-medium text-stone-600" htmlFor="direction">
          Type
        </label>
        <select
          id="direction"
          name="direction"
          defaultValue={direction || ""}
          className="rounded-md border border-stone-300 px-3 py-2 text-sm"
        >
          <option value="">All</option>
          {TX_DIRECTIONS.map((d) => (
            <option key={d} value={d}>
              {d === "OUTGOING" ? "OUT (sent)" : "IN (received)"}
            </option>
          ))}
        </select>
      </div>
      <div className="flex flex-col gap-1">
        <label className="text-xs font-medium text-stone-600" htmlFor="status">
          Status
        </label>
        <select
          id="status"
          name="status"
          defaultValue={status || ""}
          className="rounded-md border border-stone-300 px-3 py-2 text-sm"
        >
          <option value="">All</option>
          {TX_STATUSES.map((s) => (
            <option key={s} value={s}>
              {s}
            </option>
          ))}
        </select>
      </div>
      <div className="flex flex-col gap-1">
        <label className="text-xs font-medium text-stone-600" htmlFor="verification">
          Verification
        </label>
        <select
          id="verification"
          name="verification"
          defaultValue={verification || ""}
          className="rounded-md border border-stone-300 px-3 py-2 text-sm"
        >
          <option value="">All</option>
          {VERIFICATION_STATUSES.map((s) => (
            <option key={s} value={s}>
              {s}
            </option>
          ))}
        </select>
      </div>
      <div className="flex flex-col gap-1">
        <label className="text-xs font-medium text-stone-600" htmlFor="from">
          From
        </label>
        <input
          id="from"
          name="from"
          type="date"
          defaultValue={from}
          disabled={today === "1"}
          className="rounded-md border border-stone-300 px-3 py-2 text-sm disabled:bg-stone-100"
        />
      </div>
      <div className="flex flex-col gap-1">
        <label className="text-xs font-medium text-stone-600" htmlFor="to">
          To
        </label>
        <input
          id="to"
          name="to"
          type="date"
          defaultValue={to}
          disabled={today === "1"}
          className="rounded-md border border-stone-300 px-3 py-2 text-sm disabled:bg-stone-100"
        />
      </div>
      <div className="flex flex-wrap items-end gap-2">
        <label className="flex items-center gap-2 pb-2 text-sm text-stone-700">
          <input type="checkbox" name="today" value="1" defaultChecked={today === "1"} />
          Today
        </label>
        <button
          type="submit"
          className="rounded-md bg-emerald-800 px-3 py-2 text-sm font-semibold text-white hover:bg-emerald-900"
        >
          Apply
        </button>
        <Link
          href="/transactions"
          className="rounded-md border border-stone-300 px-3 py-2 text-sm text-stone-700 hover:bg-stone-50"
        >
          Reset
        </Link>
      </div>
    </form>
  );
}
