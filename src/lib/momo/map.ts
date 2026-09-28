export type AppTransactionStatus = "PENDING" | "SUCCESSFUL" | "FAILED" | "UNKNOWN";

export function mapMomoStatus(status: string): AppTransactionStatus {
  const normalized = status.trim().toUpperCase();
  switch (normalized) {
    case "SUCCESSFUL":
    case "SUCCESS":
    case "SUCCESSFUL TRANSACTION":
      return "SUCCESSFUL";
    case "PENDING":
    case "CREATED":
      return "PENDING";
    case "FAILED":
    case "REJECTED":
    case "TIMEOUT":
      return "FAILED";
    default:
      return "UNKNOWN";
  }
}

export function resolveExternalId(
  payload: {
    financialTransactionId?: string;
    externalId?: string;
  },
  referenceIdHeader?: string | null,
): string | null {
  const candidate =
    payload.financialTransactionId?.trim() ||
    payload.externalId?.trim() ||
    referenceIdHeader?.trim() ||
    null;
  return candidate || null;
}
