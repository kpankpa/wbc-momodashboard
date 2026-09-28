"use server";

import { randomUUID } from "crypto";
import { revalidatePath } from "next/cache";
import { headers } from "next/headers";
import { z } from "zod";
import { auth } from "@/auth";
import { writeAuditLog, getRequestMeta } from "@/lib/audit";
import { getMomoConfig } from "@/lib/momo/config";
import { ingestMomoCallback } from "@/lib/momo/ingest";
import { canReconcile, isAdmin } from "@/lib/rbac";

export type SimulateResult = { ok: true; externalId: string } | { ok: false; error: string };

const partySchema = z
  .string()
  .trim()
  .min(9)
  .max(15)
  .regex(/^[0-9+]+$/, "MSISDN must be numeric");

const simulateSchema = z.object({
  direction: z.enum(["INCOMING", "OUTGOING"]).default("INCOMING"),
  amount: z.coerce.number().positive().max(100_000),
  currency: z.string().trim().min(3).max(8).default("GHS"),
  counterpartyName: z.string().trim().min(1).max(120).optional(),
  counterpartyMsisdn: partySchema,
  status: z.enum(["SUCCESSFUL", "PENDING", "FAILED"]).default("SUCCESSFUL"),
});

export async function simulatePaymentAction(
  _prev: SimulateResult | null,
  formData: FormData,
): Promise<SimulateResult> {
  const session = await auth();
  if (!session?.user?.id || !isAdmin(session.user.role)) {
    return { ok: false, error: "Admin only." };
  }

  const config = getMomoConfig();
  if (!config.allowSimulate) {
    return { ok: false, error: "Simulation is disabled." };
  }

  const parsed = simulateSchema.safeParse({
    direction: formData.get("direction") || "INCOMING",
    amount: formData.get("amount"),
    currency: formData.get("currency") || "GHS",
    counterpartyName: formData.get("counterpartyName") || formData.get("payerName") || undefined,
    counterpartyMsisdn: formData.get("counterpartyMsisdn") || formData.get("payerMsisdn"),
    status: formData.get("status") || "SUCCESSFUL",
  });

  if (!parsed.success) {
    return {
      ok: false,
      error: parsed.error.issues[0]?.message ?? "Invalid simulation input.",
    };
  }

  const msisdn = parsed.data.counterpartyMsisdn.replace(/\D/g, "");
  const name = parsed.data.counterpartyName;
  const externalId = `sim_${randomUUID()}`;
  const isOut = parsed.data.direction === "OUTGOING";

  const result = await ingestMomoCallback({
    direction: parsed.data.direction,
    payload: {
      financialTransactionId: externalId,
      externalId: `${isOut ? "send" : "order"}_${Date.now()}`,
      amount: parsed.data.amount.toFixed(2),
      currency: parsed.data.currency.toUpperCase(),
      status: parsed.data.status,
      direction: parsed.data.direction,
      ...(isOut
        ? {
            payeeName: name,
            payee: {
              partyIdType: "MSISDN",
              partyId: msisdn,
              partyName: name,
            },
            payerMessage: "Simulated phone send",
            payeeNote: "White Beam Concepts — company line sent money",
          }
        : {
            payerName: name,
            payer: {
              partyIdType: "MSISDN",
              partyId: msisdn,
              partyName: name,
            },
            payerMessage: "Simulated customer payment",
            payeeNote: "White Beam Concepts MoMo Desk simulate",
          }),
    },
  });

  const h = await headers();
  await writeAuditLog({
    action: result.ok ? "momo.simulate_ingested" : "momo.simulate_failed",
    actorId: session.user.id,
    resource: result.ok ? result.transactionId : undefined,
    metadata: {
      externalId: result.ok ? result.externalId : undefined,
      direction: parsed.data.direction,
      error: result.ok ? undefined : result.error,
    },
    ...getRequestMeta(h),
  });

  if (!result.ok) {
    return { ok: false, error: result.error };
  }

  revalidatePath("/dashboard");
  revalidatePath("/transactions");
  return { ok: true, externalId: result.externalId };
}

const phoneSendSchema = z.object({
  amount: z.coerce.number().positive().max(100_000),
  payeeName: z.string().trim().min(1).max(120).optional(),
  payeeMsisdn: partySchema,
  note: z.string().trim().max(500).optional(),
});

/**
 * Staff logs a send done on the physical MoMo phone (USSD).
 * MTN does not push those events to Collections webhooks.
 */
export async function logPhoneSendAction(
  _prev: SimulateResult | null,
  formData: FormData,
): Promise<SimulateResult> {
  const session = await auth();
  if (!session?.user?.id || !canReconcile(session.user.role)) {
    return { ok: false, error: "Staff or admin only." };
  }

  const parsed = phoneSendSchema.safeParse({
    amount: formData.get("amount"),
    payeeName: formData.get("payeeName") || undefined,
    payeeMsisdn: formData.get("payeeMsisdn"),
    note: formData.get("note") || undefined,
  });

  if (!parsed.success) {
    return {
      ok: false,
      error: parsed.error.issues[0]?.message ?? "Invalid phone send details.",
    };
  }

  const externalId = `phone_send_${randomUUID()}`;
  const msisdn = parsed.data.payeeMsisdn.replace(/\D/g, "");

  const result = await ingestMomoCallback({
    direction: "OUTGOING",
    payload: {
      financialTransactionId: externalId,
      externalId: `ussd_${Date.now()}`,
      amount: parsed.data.amount.toFixed(2),
      currency: "GHS",
      status: "SUCCESSFUL",
      direction: "OUTGOING",
      payeeName: parsed.data.payeeName,
      payee: {
        partyIdType: "MSISDN",
        partyId: msisdn,
        partyName: parsed.data.payeeName,
      },
      payeeNote: parsed.data.note || "Logged from company MoMo phone",
      payerMessage: "Phone / USSD send",
    },
  });

  const h = await headers();
  await writeAuditLog({
    action: result.ok ? "momo.phone_send_logged" : "momo.phone_send_failed",
    actorId: session.user.id,
    resource: result.ok ? result.transactionId : undefined,
    metadata: {
      externalId: result.ok ? result.externalId : undefined,
      error: result.ok ? undefined : result.error,
    },
    ...getRequestMeta(h),
  });

  if (!result.ok) {
    return { ok: false, error: result.error };
  }

  revalidatePath("/dashboard");
  revalidatePath("/transactions");
  return { ok: true, externalId: result.externalId };
}
