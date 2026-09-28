import { describe, expect, it } from "vitest";
import { mapMomoStatus, resolveExternalId } from "@/lib/momo/map";

describe("mapMomoStatus", () => {
  it("maps successful variants", () => {
    expect(mapMomoStatus("SUCCESSFUL")).toBe("SUCCESSFUL");
    expect(mapMomoStatus("success")).toBe("SUCCESSFUL");
  });

  it("maps pending and failed", () => {
    expect(mapMomoStatus("PENDING")).toBe("PENDING");
    expect(mapMomoStatus("FAILED")).toBe("FAILED");
    expect(mapMomoStatus("weird")).toBe("UNKNOWN");
  });
});

describe("resolveExternalId", () => {
  it("prefers financialTransactionId", () => {
    expect(
      resolveExternalId(
        { financialTransactionId: "fin-1", externalId: "ext-1" },
        "ref-1",
      ),
    ).toBe("fin-1");
  });

  it("falls back to externalId then header", () => {
    expect(resolveExternalId({ externalId: "ext-1" }, "ref-1")).toBe("ext-1");
    expect(resolveExternalId({}, "ref-1")).toBe("ref-1");
    expect(resolveExternalId({}, null)).toBeNull();
  });
});
