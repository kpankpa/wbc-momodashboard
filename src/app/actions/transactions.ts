"use server";

import { revalidatePath } from "next/cache";
import { headers } from "next/headers";
import { z } from "zod";
import { auth } from "@/auth";
import { writeAuditLog, getRequestMeta } from "@/lib/audit";
import { prisma } from "@/lib/db";
import { canReconcile } from "@/lib/rbac";

export type ReconcileResult = { ok: true } | { ok: false; error: string };

const reconcileSchema = z.object({
  transactionId: z.string().cuid(),
  verificationStatus: z.enum(["UNVERIFIED", "VERIFIED", "DISPUTED"]),
  internalNote: z.string().trim().max(1000).optional(),
  orderReference: z.string().trim().max(120).optional(),
});

export async function updateReconcileAction(
  _prev: ReconcileResult | null,
  formData: FormData,
): Promise<ReconcileResult> {
  const session = await auth();
  if (!session?.user?.id || !canReconcile(session.user.role)) {
    return { ok: false, error: "You cannot update reconciliation fields." };
  }

  const parsed = reconcileSchema.safeParse({
    transactionId: formData.get("transactionId"),
    verificationStatus: formData.get("verificationStatus"),
    internalNote: formData.get("internalNote") || undefined,
    orderReference: formData.get("orderReference") || undefined,
  });

  if (!parsed.success) {
    return {
      ok: false,
      error: parsed.error.issues[0]?.message ?? "Invalid reconciliation data.",
    };
  }

  const tx = await prisma.transaction.update({
    where: { id: parsed.data.transactionId },
    data: {
      verificationStatus: parsed.data.verificationStatus,
      internalNote: parsed.data.internalNote || null,
      orderReference: parsed.data.orderReference || null,
    },
    select: { id: true },
  });

  const h = await headers();
  await writeAuditLog({
    action: "transaction.reconciled",
    actorId: session.user.id,
    resource: tx.id,
    metadata: {
      verificationStatus: parsed.data.verificationStatus,
    },
    ...getRequestMeta(h),
  });

  revalidatePath(`/transactions/${tx.id}`);
  revalidatePath("/transactions");
  revalidatePath("/dashboard");
  return { ok: true };
}
