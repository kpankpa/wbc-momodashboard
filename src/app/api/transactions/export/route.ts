import { NextResponse } from "next/server";
import { auth } from "@/auth";
import { writeAuditLog, getRequestMeta } from "@/lib/audit";
import { prisma } from "@/lib/db";
import { canExport } from "@/lib/rbac";
import { transactionsToCsv } from "@/lib/transactions/csv";
import { buildTransactionWhere } from "@/lib/transactions/filters";

export const runtime = "nodejs";

function first(value: string | null): string | undefined {
  return value || undefined;
}

export async function GET(request: Request) {
  const session = await auth();
  if (!session?.user?.id || !canExport(session.user.role)) {
    return NextResponse.json({ ok: false, error: "Forbidden." }, { status: 403 });
  }

  const url = new URL(request.url);
  const filters = {
    q: first(url.searchParams.get("q")),
    status: first(url.searchParams.get("status")),
    verification: first(url.searchParams.get("verification")),
    direction: first(url.searchParams.get("direction")),
    from: first(url.searchParams.get("from")),
    to: first(url.searchParams.get("to")),
    today: first(url.searchParams.get("today")),
  };

  const where = buildTransactionWhere(filters);
  const rows = await prisma.transaction.findMany({
    where,
    orderBy: { receivedAt: "desc" },
    take: 5000,
    select: {
      receivedAt: true,
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
      externalId: true,
      internalNote: true,
    },
  });

  const csv = transactionsToCsv(rows, session.user.role);
  const stamp = new Date().toISOString().slice(0, 10);
  const meta = getRequestMeta(request.headers);

  await writeAuditLog({
    action: "transactions.exported",
    actorId: session.user.id,
    metadata: {
      count: rows.length,
      filters,
    },
    ...meta,
  });

  return new NextResponse(csv, {
    status: 200,
    headers: {
      "Content-Type": "text/csv; charset=utf-8",
      "Content-Disposition": `attachment; filename="momo-transactions-${stamp}.csv"`,
      "Cache-Control": "no-store",
    },
  });
}
