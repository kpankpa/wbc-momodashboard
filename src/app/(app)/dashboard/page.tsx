import Link from "next/link";
import { auth } from "@/auth";
import { LogPhoneSendForm } from "@/components/log-phone-send-form";
import { SimulatePaymentForm } from "@/components/simulate-payment-form";
import { TransactionsTable, type TxRow } from "@/components/transactions-table";
import { prisma } from "@/lib/db";
import { getMomoConfig } from "@/lib/momo/config";
import { formatMoney, startOfUtcDay } from "@/lib/money";
import { canReconcile, isAdmin } from "@/lib/rbac";

export default async function DashboardPage() {
  const session = await auth();
  const role = session?.user.role;
  const config = getMomoConfig();
  const todayStart = startOfUtcDay();

  const [todayIn, todayOut, todayCount, recent] = await Promise.all([
    prisma.transaction.aggregate({
      where: {
        status: "SUCCESSFUL",
        direction: "INCOMING",
        receivedAt: { gte: todayStart },
      },
      _sum: { amount: true },
      _count: true,
    }),
    prisma.transaction.aggregate({
      where: {
        status: "SUCCESSFUL",
        direction: "OUTGOING",
        receivedAt: { gte: todayStart },
      },
      _sum: { amount: true },
      _count: true,
    }),
    prisma.transaction.count({
      where: { receivedAt: { gte: todayStart } },
    }),
    prisma.transaction.findMany({
      orderBy: { receivedAt: "desc" },
      take: 20,
      select: {
        id: true,
        externalId: true,
        amount: true,
        currency: true,
        status: true,
        direction: true,
        verificationStatus: true,
        payerName: true,
        payerMsisdn: true,
        payeeName: true,
        payeeMsisdn: true,
        orderReference: true,
        receivedAt: true,
      },
    }) as Promise<TxRow[]>,
  ]);

  return (
    <div className="mx-auto max-w-5xl">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="font-[family-name:var(--font-display)] text-3xl text-brand-ink">
            Dashboard
          </h1>
          <p className="mt-2 max-w-2xl text-stone-600">
            Live alerts for money received on the company MoMo line and money sent from it.
            Incoming webhooks:{" "}
            <code className="rounded bg-brand-soft px-1 text-sm text-brand-ink">
              /api/momo/callback
            </code>
            . Phone/USSD sends: log below (MTN does not push those automatically).
          </p>
        </div>
        <Link
          href="/transactions"
          className="rounded-md bg-brand px-4 py-2 text-sm font-semibold text-white hover:bg-brand-strong"
        >
          View all transactions
        </Link>
      </div>

      <div className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <div className="rounded-xl border border-border-brand bg-white p-4">
          <p className="text-xs uppercase tracking-wide text-stone-500">Today received</p>
          <p className="mt-2 text-2xl font-semibold text-brand-ink">
            {todayIn._sum.amount ? formatMoney(todayIn._sum.amount, "GHS") : "GHS 0.00"}
          </p>
          <p className="mt-1 text-xs text-stone-500">{todayIn._count} successful in</p>
        </div>
        <div className="rounded-xl border border-orange-200 bg-white p-4">
          <p className="text-xs uppercase tracking-wide text-stone-500">Today sent</p>
          <p className="mt-2 text-2xl font-semibold text-orange-900">
            {todayOut._sum.amount ? formatMoney(todayOut._sum.amount, "GHS") : "GHS 0.00"}
          </p>
          <p className="mt-1 text-xs text-stone-500">{todayOut._count} successful out</p>
        </div>
        <div className="rounded-xl border border-border-brand bg-white p-4">
          <p className="text-xs uppercase tracking-wide text-stone-500">Today txs</p>
          <p className="mt-2 text-2xl font-semibold text-brand-ink">{todayCount}</p>
          <p className="mt-1 text-xs text-stone-500">In + out combined</p>
        </div>
        <div className="rounded-xl border border-border-brand bg-white p-4">
          <p className="text-xs uppercase tracking-wide text-stone-500">MoMo env</p>
          <p className="mt-2 text-sm font-medium capitalize text-brand">
            {config.environment}
          </p>
          <p className="mt-1 text-xs text-stone-500">
            API {config.hasApiCredentials ? "credentials set" : "not configured yet"}
          </p>
        </div>
      </div>

      {canReconcile(role) ? (
        <section className="mt-8 rounded-xl border border-orange-200 bg-orange-50/60 p-5">
          <h2 className="text-sm font-semibold text-orange-950">
            Log send from company MoMo phone
          </h2>
          <p className="mt-1 text-xs text-orange-900/80">
            When someone holding the company phone sends money via USSD / MoMo app, enter it
            here. The dashboard Live alert fires immediately. Automatic push only works if you
            later use MTN Disbursements API callbacks.
          </p>
          <div className="mt-4">
            <LogPhoneSendForm />
          </div>
        </section>
      ) : null}

      {isAdmin(role) && config.allowSimulate ? (
        <section className="mt-8 rounded-xl border border-border-brand bg-brand-soft/70 p-5">
          <h2 className="text-sm font-semibold text-brand-ink">Admin simulate (dev)</h2>
          <p className="mt-1 text-xs text-brand/80">
            Creates a local IN or OUT transaction without MTN — use Outgoing to test phone-send
            alerts.
          </p>
          <div className="mt-4">
            <SimulatePaymentForm />
          </div>
        </section>
      ) : null}

      <section className="mt-8 overflow-hidden rounded-xl border border-border-brand bg-white">
        <div className="flex items-center justify-between border-b border-border-brand px-4 py-3">
          <h2 className="text-sm font-semibold text-brand-ink">Recent activity</h2>
          <Link href="/transactions" className="text-xs text-brand hover:underline">
            See all
          </Link>
        </div>
        <TransactionsTable
          rows={recent}
          role={role}
          emptyMessage="No transactions yet. Log a phone send, simulate as admin, or POST a MoMo callback."
        />
      </section>
    </div>
  );
}
