import { redirect } from "next/navigation";
import { auth, signOut } from "@/auth";
import { prisma } from "@/lib/db";
import { AppShell } from "@/components/app-shell";

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const session = await auth();
  if (!session?.user?.id) {
    redirect("/login");
  }

  const dbUser = await prisma.user.findUnique({
    where: { id: session.user.id },
    select: { active: true, role: true, email: true },
  });

  if (!dbUser || !dbUser.active) {
    await signOut({ redirectTo: "/login" });
  }

  return (
    <AppShell email={dbUser!.email} role={dbUser!.role}>
      {children}
    </AppShell>
  );
}
