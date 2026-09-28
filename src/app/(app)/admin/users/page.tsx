import { redirect } from "next/navigation";
import { auth } from "@/auth";
import { prisma } from "@/lib/db";
import { canManageUsers } from "@/lib/rbac";
import { CreateUserForm, ToggleUserForm } from "./user-forms";

export default async function AdminUsersPage() {
  const session = await auth();
  if (!session?.user?.id || !canManageUsers(session.user.role)) {
    redirect("/dashboard");
  }

  const users = await prisma.user.findMany({
    orderBy: { createdAt: "asc" },
    select: {
      id: true,
      email: true,
      name: true,
      role: true,
      active: true,
      createdAt: true,
    },
  });

  return (
    <div className="mx-auto max-w-5xl">
      <h1 className="font-[family-name:var(--font-display)] text-3xl text-brand-ink">
        Users
      </h1>
      <p className="mt-2 text-sm text-stone-600">
        Invite staff accounts. MoMo SIM OTP is not used for daily dashboard access.
      </p>

      <section className="mt-6 rounded-xl border border-stone-200 bg-white p-5">
        <h2 className="text-sm font-semibold text-stone-900">Invite user</h2>
        <p className="mt-1 text-xs text-stone-500">
          Passwords must be 12+ characters with upper, lower, and a number.
        </p>
        <div className="mt-4">
          <CreateUserForm />
        </div>
      </section>

      <section className="mt-6 overflow-hidden rounded-xl border border-stone-200 bg-white">
        <table className="w-full text-left text-sm">
          <thead className="border-b border-stone-200 bg-stone-50 text-xs uppercase tracking-wide text-stone-500">
            <tr>
              <th className="px-4 py-3 font-medium">User</th>
              <th className="px-4 py-3 font-medium">Role</th>
              <th className="px-4 py-3 font-medium">Status</th>
              <th className="px-4 py-3 font-medium">Actions</th>
            </tr>
          </thead>
          <tbody>
            {users.map((user) => (
              <tr key={user.id} className="border-b border-stone-100 last:border-0">
                <td className="px-4 py-3">
                  <p className="font-medium text-stone-900">{user.name || "—"}</p>
                  <p className="text-stone-500">{user.email}</p>
                </td>
                <td className="px-4 py-3">{user.role}</td>
                <td className="px-4 py-3">
                  <span
                    className={
                      user.active
                        ? "text-emerald-800"
                        : "text-stone-400 line-through"
                    }
                  >
                    {user.active ? "Active" : "Disabled"}
                  </span>
                </td>
                <td className="px-4 py-3">
                  {user.id === session.user.id ? (
                    <span className="text-xs text-stone-400">You</span>
                  ) : (
                    <ToggleUserForm userId={user.id} active={user.active} />
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </section>
    </div>
  );
}
