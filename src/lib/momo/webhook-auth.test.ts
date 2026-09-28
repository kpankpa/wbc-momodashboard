import { afterEach, describe, expect, it, vi } from "vitest";

vi.mock("@/lib/momo/config", () => ({
  getMomoConfig: vi.fn(),
}));

import { getMomoConfig } from "@/lib/momo/config";
import {
  assertWebhookAuthorized,
  extractWebhookSecret,
} from "@/lib/momo/webhook-auth";

describe("extractWebhookSecret", () => {
  it("reads header, bearer, and query", () => {
    expect(
      extractWebhookSecret(
        new Request("http://localhost", {
          headers: { "x-webhook-secret": "abc" },
        }),
        new URL("http://localhost/api/momo/callback"),
      ),
    ).toBe("abc");

    expect(
      extractWebhookSecret(
        new Request("http://localhost", {
          headers: { authorization: "Bearer xyz" },
        }),
        new URL("http://localhost/api/momo/callback"),
      ),
    ).toBe("xyz");

    expect(
      extractWebhookSecret(
        new Request("http://localhost"),
        new URL("http://localhost/api/momo/callback?token=tok"),
      ),
    ).toBe("tok");
  });
});

describe("assertWebhookAuthorized", () => {
  afterEach(() => {
    vi.mocked(getMomoConfig).mockReset();
  });

  it("rejects bad secret when configured", () => {
    vi.mocked(getMomoConfig).mockReturnValue({
      webhookSecret: "correct-secret",
      requireWebhookSecret: true,
    } as ReturnType<typeof getMomoConfig>);

    const result = assertWebhookAuthorized(
      new Request("http://localhost", {
        headers: { "x-webhook-secret": "wrong" },
      }),
      new URL("http://localhost/callback"),
    );
    expect(result.ok).toBe(false);
    if (!result.ok) expect(result.status).toBe(401);
  });

  it("accepts matching secret", () => {
    vi.mocked(getMomoConfig).mockReturnValue({
      webhookSecret: "correct-secret",
      requireWebhookSecret: true,
    } as ReturnType<typeof getMomoConfig>);

    const result = assertWebhookAuthorized(
      new Request("http://localhost", {
        headers: { "x-webhook-secret": "correct-secret" },
      }),
      new URL("http://localhost/callback"),
    );
    expect(result).toEqual({ ok: true });
  });
});
