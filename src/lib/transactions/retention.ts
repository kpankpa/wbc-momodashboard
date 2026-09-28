import "server-only";

import { prisma } from "@/lib/db";

/**
 * Clears stored raw MoMo payloads older than `days` days.
 * Keeps transaction business fields; only strips debug JSON.
 */
export async function clearOldRawPayloads(days = 90) {
  const cutoff = new Date(Date.now() - days * 24 * 60 * 60 * 1000);
  const result = await prisma.transaction.updateMany({
    where: {
      rawPayload: { not: null },
      receivedAt: { lt: cutoff },
    },
    data: { rawPayload: null },
  });
  return { cleared: result.count, cutoff };
}
