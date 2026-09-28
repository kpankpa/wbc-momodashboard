import Link from "next/link";
import { formatMoney } from "@/lib/money";
import { canViewFullMsisdn, maskMsisdn } from "@/lib/msisdn";

export type TxRow = {
  id: string;
  externalId: string;
  amount: { toString(): string };
  currency: string;
  status: string;
  direction?: string;
  verificationStatus?: string;
  payerName: string | null;
  payerMsisdn: string | null;
  payeeName?: string | null;
  payeeMsisdn?: string | null;
  orderReference: string | null;
  receivedAt: Date;
};

type Props = {
  rows: TxRow[];
  role?: string;
  emptyMessage?: string;
  showVerification?: boolean;
};

function statusClass(status: string) {
  if (status === "SUCCESSFUL") return "text-emerald-800";
  if (status === "FAILED") return "text-red-700";
  return "text-stone-600";
}

function verificationClass(status: string | undefined) {
  if (status === "VERIFIED") return "text-emerald-800";
  if (status === "DISPUTED") return "text-red-700";
  return "text-stone-500";
}

export function TransactionsTable({
  rows,
  role,
  emptyMessage = "No transactions match these filters.",
  showVerification = true,
}: Props) {
  const showFull = canViewFullMsisdn(role);

  if (rows.length === 0) {
    return <p className="px-4 py-8 text-sm text-stone-500">{emptyMessage}</p>;
  }

  return (
    <table className="w-full text-left text-sm">
      <thead className="border-b border-border-brand bg-brand-soft/40 text-xs uppercase tracking-wide text-stone-500">
        <tr>
          <th className="px-4 py-3 font-medium">Time</th>
          <th className="px-4 py-3 font-medium">Type</th>
          <th className="px-4 py-3 font-medium">Amount</th>
          <th className="px-4 py-3 font-medium">Name</th>
          <th className="px-4 py-3 font-medium">Number</th>
          <th className="px-4 py-3 font-medium">Status</th>
          {showVerification ? (
            <th className="px-4 py-3 font-medium">Verify</th>
          ) : null}
          <th className="px-4 py-3 font-medium">Ref</th>
        </tr>
      </thead>
      <tbody>
        {rows.map((tx) => {
          const outgoing = tx.direction === "OUTGOING";
          const name = outgoing ? tx.payeeName : tx.payerName;
          const msisdn = outgoing ? tx.payeeMsisdn : tx.payerMsisdn;
          return (
            <tr key={tx.id} className="border-b border-stone-100 last:border-0 hover:bg-stone-50/80">
              <td className="px-4 py-3 text-stone-600">
                <Link href={`/transactions/${tx.id}`} className="hover:underline">
                  {tx.receivedAt.toLocaleString()}
                </Link>
              </td>
              <td className="px-4 py-3">
                <span
                  className={`rounded px-1.5 py-0.5 text-xs font-semibold ${
                    outgoing
                      ? "bg-orange-100 text-orange-900"
                      : "bg-emerald-100 text-emerald-900"
                  }`}
                >
                  {outgoing ? "OUT" : "IN"}
                </span>
              </td>
              <td className="px-4 py-3 font-medium text-stone-900">
                {outgoing ? "−" : "+"}
                {formatMoney(tx.amount, tx.currency)}
              </td>
              <td className="px-4 py-3 text-stone-800">{name || "—"}</td>
              <td className="px-4 py-3 text-stone-700">
                {showFull ? msisdn || "—" : maskMsisdn(msisdn)}
              </td>
              <td className={`px-4 py-3 ${statusClass(tx.status)}`}>{tx.status}</td>
              {showVerification ? (
                <td className={`px-4 py-3 text-xs font-medium ${verificationClass(tx.verificationStatus)}`}>
                  {tx.verificationStatus || "UNVERIFIED"}
                </td>
              ) : null}
              <td className="max-w-[10rem] truncate px-4 py-3 font-mono text-xs text-stone-500">
                {tx.orderReference || tx.externalId}
              </td>
            </tr>
          );
        })}
      </tbody>
    </table>
  );
}
