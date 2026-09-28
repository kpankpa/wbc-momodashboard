import { prisma } from "@/lib/db";

type AuditInput = {
  action: string;
  actorId?: string | null;
  resource?: string;
  metadata?: Record<string, unknown>;
  ip?: string | null;
  userAgent?: string | null;
};

export async function writeAuditLog(input: AuditInput) {
  try {
    await prisma.auditLog.create({
      data: {
        action: input.action,
        actorId: input.actorId ?? null,
        resource: input.resource,
        metadata: input.metadata ? JSON.stringify(input.metadata) : null,
        ip: input.ip ?? null,
        userAgent: input.userAgent ?? null,
      },
    });
  } catch (error) {
    console.error("[audit] failed to write log", error);
  }
}

export function getRequestMeta(headers: Headers) {
  const forwarded = headers.get("x-forwarded-for");
  const ip = forwarded?.split(",")[0]?.trim() || headers.get("x-real-ip") || null;
  const userAgent = headers.get("user-agent");
  return { ip, userAgent };
}
