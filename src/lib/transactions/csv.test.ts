import { describe, expect, it } from "vitest";
import { canViewFullMsisdn, maskMsisdn } from "@/lib/msisdn";
import { transactionsToCsv } from "@/lib/transactions/csv";

describe("maskMsisdn", () => {
  it("masks middle digits", () => {
    expect(maskMsisdn("233241234567")).toBe("233••••567");
  });

  it("handles empty", () => {
    expect(maskMsisdn(null)).toBe("—");
  });
});

describe("transactionsToCsv", () => {
  const row = {
    receivedAt: new Date("2026-09-17T12:00:00.000Z"),
    amount: { toString: () => "20.00" },
    currency: "GHS",
    status: "SUCCESSFUL",
    direction: "INCOMING",
    verificationStatus: "UNVERIFIED",
    payerName: "Ama Mensah",
    payerMsisdn: "233241234567",
    payeeName: null,
    payeeMsisdn: null,
    orderReference: "order_1",
    externalId: "tx_1",
    internalNote: 'said "paid"',
  };

  it("masks msisdn for staff", () => {
    const csv = transactionsToCsv([row], "STAFF");
    expect(csv).toContain("233••••567");
    expect(csv).not.toContain("233241234567");
    expect(csv).toContain('"said ""paid"""');
    expect(csv).toContain("INCOMING");
  });

  it("shows full msisdn for admin", () => {
    const csv = transactionsToCsv([row], "ADMIN");
    expect(csv).toContain("233241234567");
  });

  it("exports outgoing payee as counterparty", () => {
    const csv = transactionsToCsv(
      [
        {
          ...row,
          direction: "OUTGOING",
          payerName: null,
          payerMsisdn: null,
          payeeName: "Kwame",
          payeeMsisdn: "233201112233",
        },
      ],
      "ADMIN",
    );
    expect(csv).toContain("OUTGOING");
    expect(csv).toContain("Kwame");
    expect(csv).toContain("233201112233");
  });
});

describe("canViewFullMsisdn", () => {
  it("is admin-only", () => {
    expect(canViewFullMsisdn("ADMIN")).toBe(true);
    expect(canViewFullMsisdn("STAFF")).toBe(false);
  });
});
