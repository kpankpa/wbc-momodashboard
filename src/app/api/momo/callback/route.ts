import { NextResponse } from "next/server";
import { writeAuditLog, getRequestMeta } from "@/lib/audit";
import { getMomoConfig } from "@/lib/momo/config";
import { ingestMomoCallback } from "@/lib/momo/ingest";
import { momoCallbackSchema } from "@/lib/momo/types";
import { assertWebhookAuthorized } from "@/lib/momo/webhook-auth";
import { consumeWebhookAttempt } from "@/lib/rate-limit";

export const runtime = "nodejs";

async function handleCallback(request: Request) {
  const url = new URL(request.url);
  const meta = getRequestMeta(request.headers);
  const rateKey = meta.ip || "unknown";

  const limited = await consumeWebhookAttempt(`momo-webhook:${rateKey}`);
  if (!limited.allowed) {
    return NextResponse.json({ ok: false, error: "Too many requests." }, { status: 429 });
  }

  const authz = assertWebhookAuthorized(request, url);
  if (!authz.ok) {
    await writeAuditLog({
      action: "momo.webhook_unauthorized",
      metadata: { path: url.pathname },
      ...meta,
    });
    return NextResponse.json({ ok: false, error: authz.error }, { status: authz.status });
  }

  let json: unknown;
  try {
    json = await request.json();
  } catch {
    await writeAuditLog({
      action: "momo.webhook_invalid_json",
      ...meta,
    });
    return NextResponse.json({ ok: false, error: "Invalid JSON body." }, { status: 400 });
  }

  const parsed = momoCallbackSchema.safeParse(json);
  if (!parsed.success) {
    await writeAuditLog({
      action: "momo.webhook_invalid_payload",
      metadata: { issues: parsed.error.issues.slice(0, 5) },
      ...meta,
    });
    return NextResponse.json({ ok: false, error: "Invalid callback payload." }, { status: 400 });
  }

  const referenceId =
    request.headers.get("x-reference-id") ||
    request.headers.get("X-Reference-Id");

  try {
    const result = await ingestMomoCallback({
      payload: parsed.data,
      referenceIdHeader: referenceId,
    });

    if (!result.ok) {
      await writeAuditLog({
        action: "momo.webhook_rejected",
        metadata: { error: result.error },
        ...meta,
      });
      return NextResponse.json({ ok: false, error: result.error }, { status: 422 });
    }

    await writeAuditLog({
      action: result.created ? "momo.webhook_ingested" : "momo.webhook_duplicate",
      resource: result.transactionId,
      metadata: {
        externalId: result.externalId,
        status: parsed.data.status,
        created: result.created,
      },
      ...meta,
    });

    return NextResponse.json({
      ok: true,
      created: result.created,
      transactionId: result.transactionId,
    });
  } catch (error) {
    console.error("[momo.callback]", error);
    await writeAuditLog({
      action: "momo.webhook_error",
      metadata: { message: error instanceof Error ? error.message : "unknown" },
      ...meta,
    });
    return NextResponse.json({ ok: false, error: "Internal error." }, { status: 500 });
  }
}

export async function POST(request: Request) {
  return handleCallback(request);
}

/** MTN documents allow PUT and POST on callback hosts. */
export async function PUT(request: Request) {
  return handleCallback(request);
}

export async function GET() {
  const config = getMomoConfig();
  return NextResponse.json({
    ok: true,
    status: "ready",
    environment: config.environment,
    webhookAuthRequired: config.requireWebhookSecret,
    apiConfigured: config.hasApiCredentials,
  });
}
