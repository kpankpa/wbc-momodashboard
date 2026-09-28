import "server-only";

import { timingSafeEqual } from "crypto";
import { getMomoConfig } from "@/lib/momo/config";

function safeEqual(a: string, b: string): boolean {
  const left = Buffer.from(a);
  const right = Buffer.from(b);
  if (left.length !== right.length) {
    return false;
  }
  return timingSafeEqual(left, right);
}

export function extractWebhookSecret(request: Request, url: URL): string | null {
  const headerSecret =
    request.headers.get("x-webhook-secret") ||
    request.headers.get("x-momo-webhook-secret");
  if (headerSecret) return headerSecret.trim();

  const auth = request.headers.get("authorization");
  if (auth?.toLowerCase().startsWith("bearer ")) {
    return auth.slice(7).trim();
  }

  const queryToken = url.searchParams.get("token") || url.searchParams.get("secret");
  return queryToken?.trim() || null;
}

export function assertWebhookAuthorized(request: Request, url: URL): {
  ok: true;
} | { ok: false; status: number; error: string } {
  const config = getMomoConfig();
  const provided = extractWebhookSecret(request, url);

  if (!config.webhookSecret) {
    if (config.requireWebhookSecret) {
      return {
        ok: false,
        status: 503,
        error: "Webhook secret is not configured.",
      };
    }
    return { ok: true };
  }

  if (!provided || !safeEqual(provided, config.webhookSecret)) {
    return { ok: false, status: 401, error: "Unauthorized webhook." };
  }

  return { ok: true };
}
