"use server";

import { hash } from "bcryptjs";
import { AuthError } from "next-auth";
import { revalidatePath } from "next/cache";
import { auth, signIn, signOut } from "@/auth";
import { prisma } from "@/lib/db";
import { writeAuditLog, getRequestMeta } from "@/lib/audit";
import { canManageUsers } from "@/lib/rbac";
import { createUserSchema, loginSchema, updateUserStatusSchema } from "@/lib/validators";
import { headers } from "next/headers";

export type ActionResult = { ok: true } | { ok: false; error: string };

export async function loginAction(
  _prev: ActionResult | null,
  formData: FormData,
): Promise<ActionResult> {
  const parsed = loginSchema.safeParse({
    email: formData.get("email"),
    password: formData.get("password"),
  });

  if (!parsed.success) {
    return { ok: false, error: "Enter a valid email and password." };
  }

  try {
    await signIn("credentials", {
      email: parsed.data.email,
      password: parsed.data.password,
      redirectTo: "/dashboard",
    });
    return { ok: true };
  } catch (error) {
    if (error instanceof AuthError) {
      const message =
        error.type === "CredentialsSignin"
          ? "Invalid email or password."
          : error.message || "Unable to sign in.";
      return { ok: false, error: message };
    }
    throw error;
  }
}

export async function logoutAction() {
  const session = await auth();
  const h = await headers();
  const meta = getRequestMeta(h);
  if (session?.user?.id) {
    await writeAuditLog({
      action: "auth.logout",
      actorId: session.user.id,
      ...meta,
    });
  }
  await signOut({ redirectTo: "/login" });
}

async function requireAdmin() {
  const session = await auth();
  if (!session?.user?.id || !canManageUsers(session.user.role)) {
    throw new Error("Forbidden");
  }
  return session;
}

export async function createUserAction(
  _prev: ActionResult | null,
  formData: FormData,
): Promise<ActionResult> {
  const session = await requireAdmin();
  const parsed = createUserSchema.safeParse({
    email: formData.get("email"),
    name: formData.get("name") || undefined,
    password: formData.get("password"),
    role: formData.get("role"),
  });

  if (!parsed.success) {
    return {
      ok: false,
      error: parsed.error.issues[0]?.message ?? "Invalid user details.",
    };
  }

  const email = parsed.data.email.toLowerCase();
  const existing = await prisma.user.findUnique({ where: { email } });
  if (existing) {
    return { ok: false, error: "A user with that email already exists." };
  }

  const passwordHash = await hash(parsed.data.password, 12);
  const user = await prisma.user.create({
    data: {
      email,
      name: parsed.data.name,
      passwordHash,
      role: parsed.data.role,
      active: true,
    },
  });

  const h = await headers();
  await writeAuditLog({
    action: "user.created",
    actorId: session.user.id,
    resource: user.id,
    metadata: { email, role: user.role },
    ...getRequestMeta(h),
  });

  revalidatePath("/admin/users");
  return { ok: true };
}

export async function setUserActiveAction(
  _prev: ActionResult | null,
  formData: FormData,
): Promise<ActionResult> {
  const session = await requireAdmin();
  const parsed = updateUserStatusSchema.safeParse({
    userId: formData.get("userId"),
    active: formData.get("active") === "true",
  });

  if (!parsed.success) {
    return { ok: false, error: "Invalid request." };
  }

  if (parsed.data.userId === session.user.id) {
    return { ok: false, error: "You cannot deactivate your own account." };
  }

  const user = await prisma.user.update({
    where: { id: parsed.data.userId },
    data: { active: parsed.data.active },
  });

  const h = await headers();
  await writeAuditLog({
    action: parsed.data.active ? "user.activated" : "user.deactivated",
    actorId: session.user.id,
    resource: user.id,
    metadata: { email: user.email },
    ...getRequestMeta(h),
  });

  revalidatePath("/admin/users");
  return { ok: true };
}
