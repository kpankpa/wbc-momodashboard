import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

async function main() {
  const days = Number(process.env.RAW_PAYLOAD_RETENTION_DAYS || 90);
  const cutoff = new Date(Date.now() - days * 24 * 60 * 60 * 1000);
  const result = await prisma.transaction.updateMany({
    where: {
      rawPayload: { not: null },
      receivedAt: { lt: cutoff },
    },
    data: { rawPayload: null },
  });
  console.log(
    `Cleared rawPayload on ${result.count} transactions older than ${cutoff.toISOString()}`,
  );
}

main()
  .catch((error) => {
    console.error(error);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
