import Link from "next/link";
import { notFound } from "next/navigation";
import { auth } from "@/auth";
import { ReconcileForm } from "@/components/reconcile-form";
import { prisma } from "@/lib/db";
import { formatMoney } from "@/lib/money";
import { canViewFullMsisdn, maskMsisdn } from "@/lib/msisdn";
import { canReconcile, isAdmin } from "@/lib/rbac";

type Params = Promise<{ id: string }>;

export default async function TransactionDetailPage({ params }: { params: Params }) {
  const session = await auth();
  const { id } = await params;

  const tx = await prisma.transaction.findUnique({
    where: { id },
  });

  if (!tx) {
    notFound();
  }

  const showFull = canViewFullMsisdn(session?.user.role);
  const showRaw = isAdmin(session?.user.role);
  const allowReconcile = canReconcile(session?.user.role);
  const outgoing = tx.direction === "OUTGOING";
  const counterpartyName = outgoing ? tx.payeeName : tx.payerName;
  const counterpartyMsisdn = outgoing ? tx.payeeMsisdn : tx.payerMsisdn;

  return (
    <div className="mx-auto max-w-3xl">
      <Link
        href="/transactions"
        className="text-sm text-emerald-900 underline-offset-2 hover:underline"
      >
        ← All transactions
      </Link>

      <h1 className="mt-4 font-[family-name:var(--font-display)] text-3xl text-brand-ink">
        {outgoing ? "Outgoing payment" : "Incoming payment"}
      </h1>
      <p className="mt-1 font-mono text-xs text-stone-500">{tx.id}</p>

      <dl className="mt-6 grid gap-4 rounded-xl border border-stone-200 bg-white p-5 sm:grid-cols-2">
        <div>
          <dt className="text-xs uppercase tracking-wide text-stone-500">Amount</dt>
          <dd className="mt-1 text-lg font-semibold text-stone-900">
            {outgoing ? "−" : "+"}
            {formatMoney(tx.amount, tx.currency)}
          </dd>
        </div>
        <div>
          <dt className="text-xs uppercase tracking-wide text-stone-500">Type</dt>
          <dd className="mt-1">
            <span
              className={`rounded px-1.5 py-0.5 text-xs font-semibold ${
                outgoing
                  ? "bg-orange-100 text-orange-900"
                  : "bg-emerald-100 text-emerald-900"
              }`}
            >
              {outgoing ? "OUTGOING — company phone sent" : "INCOMING — money received"}
            </span>
          </dd>
        </div>
        <div>
          <dt className="text-xs uppercase tracking-wide text-stone-500">Status</dt>
          <dd className="mt-1 font-medium text-stone-900">{tx.status}</dd>
        </div>
        <div>
          <dt className="text-xs uppercase tracking-wide text-stone-500">
            {outgoing ? "Recipient name" : "Payer name"}
          </dt>
          <dd className="mt-1 text-stone-900">{counterpartyName || "—"}</dd>
        </div>
        <div>
          <dt className="text-xs uppercase tracking-wide text-stone-500">
            {outgoing ? "Recipient MSISDN" : "Payer MSISDN"}
          </dt>
          <dd className="mt-1 text-stone-900">
            {showFull ? counterpartyMsisdn || "—" : maskMsisdn(counterpartyMsisdn)}
          </dd>
        </div>
        <div>
          <dt className="text-xs uppercase tracking-wide text-stone-500">
            {outgoing ? "Logged / sent" : "Received"}
          </dt>
          <dd className="mt-1 text-stone-900">{tx.receivedAt.toLocaleString()}</dd>
        </div>
        <div>
          <dt className="text-xs uppercase tracking-wide text-stone-500">Verification</dt>
          <dd className="mt-1 text-stone-900">{tx.verificationStatus}</dd>
        </div>
        <div>
          <dt className="text-xs uppercase tracking-wide text-stone-500">Order / ref</dt>
          <dd className="mt-1 font-mono text-sm text-stone-800">
            {tx.orderReference || "—"}
          </dd>
        </div>
        <div className="sm:col-span-2">
          <dt className="text-xs uppercase tracking-wide text-stone-500">External ID</dt>
          <dd className="mt-1 break-all font-mono text-sm text-stone-800">{tx.externalId}</dd>
        </div>
        <div className="sm:col-span-2">
          <dt className="text-xs uppercase tracking-wide text-stone-500">Internal note</dt>
          <dd className="mt-1 text-stone-800">{tx.internalNote || "—"}</dd>
        </div>
      </dl>

      {allowReconcile ? (
        <ReconcileForm
          transactionId={tx.id}
          verificationStatus={tx.verificationStatus}
          internalNote={tx.internalNote}
          orderReference={tx.orderReference}
        />
      ) : null}

      {showRaw && tx.rawPayload ? (
        <section className="mt-6 rounded-xl border border-stone-200 bg-stone-950 p-4">
          <h2 className="text-xs font-semibold uppercase tracking-wide text-stone-400">
            Raw callback (admin)
          </h2>
          <pre className="mt-3 overflow-x-auto text-xs text-emerald-100">
            {JSON.stringify(JSON.parse(tx.rawPayload), null, 2)}
          </pre>
        </section>
      ) : null}
    </div>
  );
}
