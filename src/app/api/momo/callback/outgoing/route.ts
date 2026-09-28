import { NextResponse } from "next/server";
import { writeAuditLog, getRequestMeta } from "@/lib/audit";
import { getMomoConfig } from "@/lib/momo/config";
import { ingestMomoCallback } from "@/lib/momo/ingest";
import { momoCallbackSchema } from "@/lib/momo/types";
import { assertWebhookAuthorized } from "@/lib/momo/webhook-auth";
import { consumeWebhookAttempt } from "@/lib/rate-limit";

export const runtime = "nodejs";

/**
 * Disbursement / transfer callback host for money leaving the company MoMo line.
 * Forces direction=OUTGOING so live alerts show as "Company phone sent money".
 */
async function handleOutgoingCallback(request: Request) {
  const url = new URL(request.url);
  const meta = getRequestMeta(request.headers);
  const rateKey = meta.ip || "unknown";

  const limited = await consumeWebhookAttempt(`momo-webhook-out:${rateKey}`);
  if (!limited.allowed) {
    return NextResponse.json({ ok: false, error: "Too many requests." }, { status: 429 });
  }

  const authz = assertWebhookAuthorized(request, url);
  if (!authz.ok) {
    await writeAuditLog({
      action: "momo.outgoing_webhook_unauthorized",
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
      action: "momo.outgoing_webhook_invalid_json",
      ...meta,
    });
    return NextResponse.json({ ok: false, error: "Invalid JSON body." }, { status: 400 });
  }

  const parsed = momoCallbackSchema.safeParse(json);
  if (!parsed.success) {
    await writeAuditLog({
      action: "momo.outgoing_webhook_invalid_payload",
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
      direction: "OUTGOING",
      payload: { ...parsed.data, direction: "OUTGOING" },
      referenceIdHeader: referenceId,
    });

    if (!result.ok) {
      await writeAuditLog({
        action: "momo.outgoing_webhook_rejected",
        metadata: { error: result.error },
        ...meta,
      });
      return NextResponse.json({ ok: false, error: result.error }, { status: 422 });
    }

    await writeAuditLog({
      action: result.created
        ? "momo.outgoing_webhook_ingested"
        : "momo.outgoing_webhook_duplicate",
      resource: result.transactionId,
      metadata: {
        externalId: result.externalId,
        status: parsed.data.status,
        created: result.created,
        direction: "OUTGOING",
      },
      ...meta,
    });

    return NextResponse.json({
      ok: true,
      created: result.created,
      transactionId: result.transactionId,
      direction: "OUTGOING",
    });
  } catch (error) {
    console.error("[momo.callback.outgoing]", error);
    await writeAuditLog({
      action: "momo.outgoing_webhook_error",
      metadata: { message: error instanceof Error ? error.message : "unknown" },
      ...meta,
    });
    return NextResponse.json({ ok: false, error: "Internal error." }, { status: 500 });
  }
}

export async function POST(request: Request) {
  return handleOutgoingCallback(request);
}

export async function PUT(request: Request) {
  return handleOutgoingCallback(request);
}

export async function GET() {
  const config = getMomoConfig();
  return NextResponse.json({
    ok: true,
    status: "ready",
    direction: "OUTGOING",
    environment: config.environment,
    webhookAuthRequired: config.requireWebhookSecret,
    note: "Use for Disbursements/transfer callbacks. Phone USSD sends must be logged on the dashboard.",
  });
}
