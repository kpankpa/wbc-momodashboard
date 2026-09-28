import "server-only";

import { canViewFullMsisdn, maskMsisdn } from "@/lib/msisdn";

type ExportRow = {
  receivedAt: Date;
  amount: { toString(): string };
  currency: string;
  status: string;
  direction?: string;
  verificationStatus: string;
  payerName: string | null;
  payerMsisdn: string | null;
  payeeName?: string | null;
  payeeMsisdn?: string | null;
  orderReference: string | null;
  externalId: string;
  internalNote: string | null;
};

function csvEscape(value: string): string {
  if (/[",\n\r]/.test(value)) {
    return `"${value.replace(/"/g, '""')}"`;
  }
  return value;
}

export function transactionsToCsv(
  rows: ExportRow[],
  role: string | undefined,
): string {
  const showFull = canViewFullMsisdn(role);
  const header = [
    "received_at",
    "direction",
    "amount",
    "currency",
    "status",
    "verification",
    "counterparty_name",
    "counterparty_msisdn",
    "order_reference",
    "external_id",
    "internal_note",
  ];

  const lines = rows.map((row) => {
    const outgoing = row.direction === "OUTGOING";
    const name = outgoing ? row.payeeName : row.payerName;
    const msisdn = outgoing ? row.payeeMsisdn : row.payerMsisdn;
    return [
      row.receivedAt.toISOString(),
      row.direction || "INCOMING",
      row.amount.toString(),
      row.currency,
      row.status,
      row.verificationStatus,
      name || "",
      showFull ? msisdn || "" : maskMsisdn(msisdn),
      row.orderReference || "",
      row.externalId,
      row.internalNote || "",
    ]
      .map((cell) => csvEscape(String(cell)))
      .join(",");
  });

  return [header.join(","), ...lines].join("\r\n");
}
