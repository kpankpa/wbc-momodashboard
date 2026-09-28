import { redirect } from "next/navigation";
import { auth } from "@/auth";
import { prisma } from "@/lib/db";
import { isAdmin } from "@/lib/rbac";

export default async function AdminAuditPage() {
  const session = await auth();
  if (!session?.user?.id || !isAdmin(session.user.role)) {
    redirect("/dashboard");
  }

  const logs = await prisma.auditLog.findMany({
    orderBy: { createdAt: "desc" },
    take: 100,
    include: {
      actor: { select: { email: true } },
    },
  });

  return (
    <div className="mx-auto max-w-5xl">
      <h1 className="font-[family-name:var(--font-display)] text-3xl text-brand-ink">
        Audit log
      </h1>
      <p className="mt-2 text-sm text-stone-600">
        Latest 100 security and ops events (logins, exports, webhooks, user changes).
      </p>

      <section className="mt-6 overflow-hidden rounded-xl border border-stone-200 bg-white">
        {logs.length === 0 ? (
          <p className="px-4 py-8 text-sm text-stone-500">No audit events yet.</p>
        ) : (
          <table className="w-full text-left text-sm">
            <thead className="border-b border-stone-200 bg-stone-50 text-xs uppercase tracking-wide text-stone-500">
              <tr>
                <th className="px-4 py-3 font-medium">Time</th>
                <th className="px-4 py-3 font-medium">Action</th>
                <th className="px-4 py-3 font-medium">Actor</th>
                <th className="px-4 py-3 font-medium">Resource</th>
                <th className="px-4 py-3 font-medium">IP</th>
              </tr>
            </thead>
            <tbody>
              {logs.map((log) => (
                <tr key={log.id} className="border-b border-stone-100 last:border-0">
                  <td className="whitespace-nowrap px-4 py-3 text-stone-600">
                    {log.createdAt.toLocaleString()}
                  </td>
                  <td className="px-4 py-3 font-mono text-xs text-stone-900">
                    {log.action}
                  </td>
                  <td className="px-4 py-3 text-stone-700">
                    {log.actor?.email || "—"}
                  </td>
                  <td className="max-w-[8rem] truncate px-4 py-3 font-mono text-xs text-stone-500">
                    {log.resource || "—"}
                  </td>
                  <td className="px-4 py-3 font-mono text-xs text-stone-500">
                    {log.ip || "—"}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </section>
    </div>
  );
}
