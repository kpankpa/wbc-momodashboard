import { describe, expect, it } from "vitest";
import { buildTransactionWhere } from "@/lib/transactions/filters";

describe("buildTransactionWhere", () => {
  it("returns empty object with no filters", () => {
    expect(buildTransactionWhere({})).toEqual({});
  });

  it("filters by status and verification", () => {
    const where = buildTransactionWhere({
      status: "SUCCESSFUL",
      verification: "VERIFIED",
    }) as { AND: Array<Record<string, unknown>> };

    expect(where.AND).toEqual(
      expect.arrayContaining([
        { status: "SUCCESSFUL" },
        { verificationStatus: "VERIFIED" },
      ]),
    );
  });

  it("adds search OR clauses", () => {
    const where = buildTransactionWhere({ q: "Ama" }) as {
      AND: Array<{ OR: unknown }>;
    };
    expect(where.AND[0].OR).toEqual(
      expect.arrayContaining([
        { payerName: { contains: "Ama" } },
        { payeeName: { contains: "Ama" } },
      ]),
    );
  });

  it("filters by direction", () => {
    const where = buildTransactionWhere({ direction: "OUTGOING" }) as {
      AND: Array<Record<string, unknown>>;
    };
    expect(where.AND).toEqual(expect.arrayContaining([{ direction: "OUTGOING" }]));
  });
});
