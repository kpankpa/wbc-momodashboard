import NextAuth from "next-auth";
import Credentials from "next-auth/providers/credentials";
import { compare } from "bcryptjs";
import { prisma } from "@/lib/db";
import type { Role } from "@/lib/roles";
import { loginSchema } from "@/lib/validators";
import { consumeLoginAttempt, resetLoginAttempts } from "@/lib/rate-limit";
import { writeAuditLog } from "@/lib/audit";

declare module "next-auth" {
  interface User {
    role: Role;
  }
  interface Session {
    user: {
      id: string;
      email: string;
      name?: string | null;
      role: Role;
    };
  }
}

declare module "@auth/core/jwt" {
  interface JWT {
    id: string;
    role: Role;
  }
}

export const { handlers, auth, signIn, signOut } = NextAuth({
  session: {
    strategy: "jwt",
    maxAge: 60 * 60 * 8,
  },
  pages: {
    signIn: "/login",
  },
  providers: [
    Credentials({
      name: "credentials",
      credentials: {
        email: { label: "Email", type: "email" },
        password: { label: "Password", type: "password" },
      },
      async authorize(credentials, request) {
        const parsed = loginSchema.safeParse(credentials);
        if (!parsed.success) {
          return null;
        }

        const email = parsed.data.email.toLowerCase();
        const ip =
          request?.headers?.get("x-forwarded-for")?.split(",")[0]?.trim() ||
          request?.headers?.get("x-real-ip") ||
          "unknown";
        const rateKey = `${ip}:${email}`;

        const limited = await consumeLoginAttempt(rateKey);
        if (!limited.allowed) {
          await writeAuditLog({
            action: "auth.login_rate_limited",
            metadata: { email },
            ip,
            userAgent: request?.headers?.get("user-agent"),
          });
          throw new Error(limited.message);
        }

        const user = await prisma.user.findUnique({ where: { email } });
        if (!user || !user.active) {
          await writeAuditLog({
            action: "auth.login_failed",
            metadata: { email, reason: !user ? "not_found" : "inactive" },
            ip,
            userAgent: request?.headers?.get("user-agent"),
          });
          return null;
        }

        const valid = await compare(parsed.data.password, user.passwordHash);
        if (!valid) {
          await writeAuditLog({
            action: "auth.login_failed",
            actorId: user.id,
            metadata: { email, reason: "bad_password" },
            ip,
            userAgent: request?.headers?.get("user-agent"),
          });
          return null;
        }

        await resetLoginAttempts(rateKey);
        await writeAuditLog({
          action: "auth.login_success",
          actorId: user.id,
          metadata: { email },
          ip,
          userAgent: request?.headers?.get("user-agent"),
        });

        return {
          id: user.id,
          email: user.email,
          name: user.name,
          role: user.role,
        };
      },
    }),
  ],
  callbacks: {
    async jwt({ token, user }) {
      if (user) {
        token.id = user.id!;
        token.role = user.role;
        token.email = user.email;
        token.name = user.name;
      }
      return token;
    },
    async session({ session, token }) {
      if (!token.id) {
        return { ...session, user: undefined as never };
      }
      session.user = {
        ...session.user,
        id: token.id,
        email: token.email as string,
        name: token.name,
        role: token.role,
      };
      return session;
    },
  },
});
