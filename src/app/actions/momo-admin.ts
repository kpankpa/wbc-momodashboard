"use server";

import { revalidatePath } from "next/cache";
import { headers } from "next/headers";
import { z } from "zod";
import { auth } from "@/auth";
import { writeAuditLog, getRequestMeta } from "@/lib/audit";
import {
  clearMomoTokenCache,
  getCollectionAccessToken,
  getRequestToPayStatus,
  MomoApiError,
} from "@/lib/momo/client";
import { ingestMomoCallback } from "@/lib/momo/ingest";
import { isAdmin } from "@/lib/rbac";

export type MomoActionResult =
  | { ok: true; message: string }
  | { ok: false; error: string };

async function requireAdmin() {
  const session = await auth();
  if (!session?.user?.id || !isAdmin(session.user.role)) {
    return null;
  }
  return session;
}

export async function testMomoConnectionAction(): Promise<MomoActionResult> {
  const session = await requireAdmin();
  if (!session) {
    return { ok: false, error: "Admin only." };
  }
  const h = await headers();

  try {
    clearMomoTokenCache();
    await getCollectionAccessToken();
    await writeAuditLog({
      action: "momo.connection_ok",
      actorId: session.user.id,
      ...getRequestMeta(h),
    });
    return { ok: true, message: "MoMo Collections token obtained successfully." };
  } catch (error) {
    const message =
      error instanceof MomoApiError
        ? `${error.message} (HTTP ${error.status})`
        : error instanceof Error
          ? error.message
          : "Connection test failed.";
    await writeAuditLog({
      action: "momo.connection_failed",
      actorId: session.user.id,
      metadata: { message },
      ...getRequestMeta(h),
    });
    return { ok: false, error: message };
  }
}

const pollSchema = z.object({
  referenceId: z.string().trim().min(8).max(80),
});

export async function pollMomoStatusAction(
  _prev: MomoActionResult | null,
  formData: FormData,
): Promise<MomoActionResult> {
  const session = await requireAdmin();
  if (!session) {
    return { ok: false, error: "Admin only." };
  }
  const parsed = pollSchema.safeParse({
    referenceId: formData.get("referenceId"),
  });
  if (!parsed.success) {
    return { ok: false, error: "Enter a valid MoMo X-Reference-Id (UUID)." };
  }

  const h = await headers();

  try {
    const status = await getRequestToPayStatus(parsed.data.referenceId);
    if (!status.status) {
      return { ok: false, error: "MoMo returned no status field." };
    }

    const result = await ingestMomoCallback({
      payload: {
        financialTransactionId: status.financialTransactionId,
        externalId: status.externalId || parsed.data.referenceId,
        amount: status.amount || "0",
        currency: status.currency || "GHS",
        status: status.status,
        payer: status.payer,
        payerMessage: status.payerMessage,
        payeeNote: status.payeeNote,
        reason: status.reason as string | undefined,
      },
      referenceIdHeader: parsed.data.referenceId,
    });

    await writeAuditLog({
      action: result.ok ? "momo.status_polled" : "momo.status_poll_rejected",
      actorId: session.user.id,
      resource: result.ok ? result.transactionId : undefined,
      metadata: {
        referenceId: parsed.data.referenceId,
        status: status.status,
        created: result.ok ? result.created : false,
        error: result.ok ? undefined : result.error,
      },
      ...getRequestMeta(h),
    });

    if (!result.ok) {
      return { ok: false, error: result.error };
    }

    revalidatePath("/dashboard");
    revalidatePath("/transactions");
    revalidatePath("/admin/momo");

    return {
      ok: true,
      message: `Synced ${parsed.data.referenceId} as ${status.status} (${result.created ? "created" : "updated"}).`,
    };
  } catch (error) {
    const message =
      error instanceof MomoApiError
        ? `${error.message} (HTTP ${error.status})`
        : error instanceof Error
          ? error.message
          : "Status poll failed.";
    await writeAuditLog({
      action: "momo.status_poll_failed",
      actorId: session.user.id,
      metadata: { referenceId: parsed.data.referenceId, message },
      ...getRequestMeta(h),
    });
    return { ok: false, error: message };
  }
}
