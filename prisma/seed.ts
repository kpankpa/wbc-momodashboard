import { readFileSync } from "fs";
import { resolve } from "path";
import { hash } from "bcryptjs";
import { PrismaClient, Role } from "@prisma/client";

/** Load .env from project root (tsx does not load it by itself). */
function loadEnvFile() {
  const path = resolve(process.cwd(), ".env");
  const raw = readFileSync(path, "utf8");
  for (const line of raw.split(/\r?\n/)) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith("#")) continue;
    const eq = trimmed.indexOf("=");
    if (eq === -1) continue;
    const key = trimmed.slice(0, eq).trim();
    let value = trimmed.slice(eq + 1).trim();
    if (
      (value.startsWith('"') && value.endsWith('"')) ||
      (value.startsWith("'") && value.endsWith("'"))
    ) {
      value = value.slice(1, -1);
    }
    process.env[key] = value;
  }
}

loadEnvFile();

const prisma = new PrismaClient();

async function main() {
  const email = process.env.ADMIN_EMAIL?.toLowerCase().trim();
  const password = process.env.ADMIN_PASSWORD;

  if (!email || !password) {
    throw new Error("Set ADMIN_EMAIL and ADMIN_PASSWORD in .env before seeding.");
  }

  if (email.includes("fill_me")) {
    throw new Error(
      "ADMIN_EMAIL is still a placeholder. Set a real email in .env, then run npm run db:seed again.",
    );
  }

  if (password.length < 12) {
    throw new Error("ADMIN_PASSWORD must be at least 12 characters.");
  }

  const passwordHash = await hash(password, 12);

  const admin = await prisma.user.upsert({
    where: { email },
    update: {
      passwordHash,
      role: Role.ADMIN,
      active: true,
      name: "Administrator",
    },
    create: {
      email,
      passwordHash,
      role: Role.ADMIN,
      active: true,
      name: "Administrator",
    },
  });

  // Disable leftover placeholder accounts from earlier seeds
  await prisma.user.updateMany({
    where: {
      email: { contains: "fill_me" },
      NOT: { id: admin.id },
    },
    data: { active: false },
  });

  console.log(`Admin ready: ${admin.email} (${admin.id})`);
  console.log("Sign in with ADMIN_EMAIL / ADMIN_PASSWORD from your .env");
}

main()
  .catch((error) => {
    console.error(error);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
