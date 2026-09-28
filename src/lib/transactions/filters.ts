export type TxFilters = {
  q?: string;
  status?: string;
  verification?: string;
  direction?: string;
  from?: string;
  to?: string;
  today?: string;
};

// Avoid depending on generated Prisma namespace types in the IDE.
type Where = Record<string, unknown>;

export const TX_STATUSES = ["PENDING", "SUCCESSFUL", "FAILED", "UNKNOWN"] as const;
export const VERIFICATION_STATUSES = ["UNVERIFIED", "VERIFIED", "DISPUTED"] as const;
export const TX_DIRECTIONS = ["INCOMING", "OUTGOING"] as const;

function parseDateInput(value: string | undefined, endOfDay = false): Date | undefined {
  if (!value) return undefined;
  const [y, m, d] = value.split("-").map(Number);
  if (!y || !m || !d) return undefined;
  if (endOfDay) {
    return new Date(Date.UTC(y, m - 1, d, 23, 59, 59, 999));
  }
  return new Date(Date.UTC(y, m - 1, d, 0, 0, 0, 0));
}

export function buildTransactionWhere(filters: TxFilters): Where {
  const and: Where[] = [];

  if (filters.today === "1") {
    const start = parseDateInput(new Date().toISOString().slice(0, 10));
    if (start) {
      and.push({ receivedAt: { gte: start } });
    }
  } else {
    const from = parseDateInput(filters.from);
    const to = parseDateInput(filters.to, true);
    if (from || to) {
      and.push({
        receivedAt: {
          ...(from ? { gte: from } : {}),
          ...(to ? { lte: to } : {}),
        },
      });
    }
  }

  if (filters.status && (TX_STATUSES as readonly string[]).includes(filters.status)) {
    and.push({ status: filters.status });
  }

  if (
    filters.verification &&
    (VERIFICATION_STATUSES as readonly string[]).includes(filters.verification)
  ) {
    and.push({ verificationStatus: filters.verification });
  }

  if (filters.direction && (TX_DIRECTIONS as readonly string[]).includes(filters.direction)) {
    and.push({ direction: filters.direction });
  }

  const q = filters.q?.trim();
  if (q) {
    and.push({
      OR: [
        { payerName: { contains: q } },
        { payerMsisdn: { contains: q } },
        { payeeName: { contains: q } },
        { payeeMsisdn: { contains: q } },
        { externalId: { contains: q } },
        { orderReference: { contains: q } },
        { internalNote: { contains: q } },
      ],
    });
  }

  return and.length ? { AND: and } : {};
}

export function filtersToQueryString(filters: TxFilters): string {
  const params = new URLSearchParams();
  if (filters.q) params.set("q", filters.q);
  if (filters.status) params.set("status", filters.status);
  if (filters.verification) params.set("verification", filters.verification);
  if (filters.direction) params.set("direction", filters.direction);
  if (filters.from) params.set("from", filters.from);
  if (filters.to) params.set("to", filters.to);
  if (filters.today) params.set("today", filters.today);
  const qs = params.toString();
  return qs ? `?${qs}` : "";
}
