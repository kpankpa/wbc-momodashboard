import Link from "next/link";
import { TransactionFilters } from "@/components/transaction-filters";
import { TransactionsTable, type TxRow } from "@/components/transactions-table";
import { auth } from "@/auth";
import { prisma } from "@/lib/db";
import { formatMoney } from "@/lib/money";
import { canExport } from "@/lib/rbac";
import {
  buildTransactionWhere,
  filtersToQueryString,
} from "@/lib/transactions/filters";

type SearchParams = Promise<Record<string, string | string[] | undefined>>;

function first(value: string | string[] | undefined): string | undefined {
  if (Array.isArray(value)) return value[0];
  return value;
}

export default async function TransactionsPage({
  searchParams,
}: {
  searchParams: SearchParams;
}) {
  const session = await auth();
  const params = await searchParams;
  const filters = {
    q: first(params.q),
    status: first(params.status),
    verification: first(params.verification),
    direction: first(params.direction),
    from: first(params.from),
    to: first(params.to),
    today: first(params.today),
  };

  const where = buildTransactionWhere(filters);
  const exportHref = `/api/transactions/export${filtersToQueryString(filters)}`;

  const [rows, totalCount, successfulAgg, verifiedCount, disputedCount] =
    await Promise.all([
      prisma.transaction.findMany({
        where,
        orderBy: { receivedAt: "desc" },
        take: 100,
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
      prisma.transaction.count({ where }),
      prisma.transaction.aggregate({
        where: { ...where, status: "SUCCESSFUL" },
        _sum: { amount: true },
        _count: true,
      }),
      prisma.transaction.count({
        where: { ...where, verificationStatus: "VERIFIED" },
      }),
      prisma.transaction.count({
        where: { ...where, verificationStatus: "DISPUTED" },
      }),
    ]);

  return (
    <div className="mx-auto max-w-6xl">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="font-[family-name:var(--font-display)] text-3xl text-brand-ink">
            Transactions
          </h1>
          <p className="mt-2 text-sm text-stone-600">
            Filter IN (received) and OUT (sent from company phone), reconcile, and export. Table
            shows up to 100 newest matches; CSV export includes up to 5,000.
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-3">
          {canExport(session?.user.role) ? (
            <a
              href={exportHref}
              className="rounded-md border border-emerald-800 px-4 py-2 text-sm font-semibold text-emerald-900 hover:bg-emerald-50"
            >
              Export CSV
            </a>
          ) : null}
          <Link
            href="/dashboard"
            className="text-sm text-emerald-900 underline-offset-2 hover:underline"
          >
            Back to dashboard
          </Link>
        </div>
      </div>

      <div className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <div className="rounded-xl border border-stone-200 bg-white p-4">
          <p className="text-xs uppercase tracking-wide text-stone-500">Matches</p>
          <p className="mt-2 text-2xl font-semibold text-emerald-900">{totalCount}</p>
        </div>
        <div className="rounded-xl border border-stone-200 bg-white p-4">
          <p className="text-xs uppercase tracking-wide text-stone-500">Successful total</p>
          <p className="mt-2 text-2xl font-semibold text-emerald-900">
            {successfulAgg._sum.amount
              ? formatMoney(successfulAgg._sum.amount, "GHS")
              : "GHS 0.00"}
          </p>
          <p className="mt-1 text-xs text-stone-500">{successfulAgg._count} successful</p>
        </div>
        <div className="rounded-xl border border-stone-200 bg-white p-4">
          <p className="text-xs uppercase tracking-wide text-stone-500">Verified</p>
          <p className="mt-2 text-2xl font-semibold text-emerald-900">{verifiedCount}</p>
        </div>
        <div className="rounded-xl border border-stone-200 bg-white p-4">
          <p className="text-xs uppercase tracking-wide text-stone-500">Disputed</p>
          <p className="mt-2 text-2xl font-semibold text-red-700">{disputedCount}</p>
        </div>
      </div>

      <div className="mt-6">
        <TransactionFilters {...filters} />
      </div>

      <section className="mt-6 overflow-hidden rounded-xl border border-stone-200 bg-white">
        <TransactionsTable rows={rows} role={session?.user.role} />
      </section>
    </div>
  );
}
