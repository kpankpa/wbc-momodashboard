import { redirect } from "next/navigation";
import { auth } from "@/auth";
import { MomoConnectionTest, MomoPollForm } from "@/components/momo-admin-panels";
import { getMomoConfig } from "@/lib/momo/config";
import { getMomoReadiness } from "@/lib/momo/readiness";
import { isAdmin } from "@/lib/rbac";

export default async function AdminMomoPage() {
  const session = await auth();
  if (!session?.user?.id || !isAdmin(session.user.role)) {
    redirect("/dashboard");
  }

  const config = getMomoConfig();
  const readiness = getMomoReadiness();

  return (
    <div className="mx-auto max-w-4xl">
      <h1 className="font-[family-name:var(--font-display)] text-3xl text-brand-ink">
        MoMo cutover
      </h1>
      <p className="mt-2 text-sm text-stone-600">
        Production readiness checks and recovery tools. Keep MTN Partner portal / statements as
        backup until you trust this pipeline.
      </p>

      <div
        className={`mt-6 rounded-xl border p-4 ${
          readiness.readyForProductionTraffic
            ? "border-emerald-300 bg-emerald-50"
            : "border-border-brand bg-brand-soft"
        }`}
      >
        <p className="text-sm font-semibold text-stone-900">
          {readiness.readyForProductionTraffic
            ? "Ready for production MoMo traffic"
            : "Not ready for production traffic yet"}
        </p>
        <p className="mt-1 text-xs text-stone-600">
          Current MoMo environment: <strong>{config.environment}</strong> · base{" "}
          <code className="rounded bg-white/70 px-1">{config.baseUrl}</code>
        </p>
      </div>

      <section className="mt-6 overflow-hidden rounded-xl border border-stone-200 bg-white">
        <div className="border-b border-stone-200 px-4 py-3">
          <h2 className="text-sm font-semibold text-stone-900">Readiness checklist</h2>
        </div>
        <ul className="divide-y divide-stone-100">
          {readiness.items.map((item) => (
            <li key={item.id} className="flex items-start gap-3 px-4 py-3 text-sm">
              <span
                className={`mt-0.5 inline-flex h-5 w-5 shrink-0 items-center justify-center rounded-full text-xs font-bold text-white ${
                  item.ok ? "bg-brand" : "bg-stone-500"
                }`}
              >
                {item.ok ? "✓" : "!"}
              </span>
              <div>
                <p className="font-medium text-stone-900">{item.label}</p>
                <p className="text-stone-600">{item.detail}</p>
              </div>
            </li>
          ))}
        </ul>
      </section>

      <div className="mt-6 grid gap-4 lg:grid-cols-2">
        <MomoConnectionTest />
        <MomoPollForm />
      </div>

      <section className="mt-6 rounded-xl border border-dashed border-stone-300 bg-white/70 p-5 text-sm text-stone-600">
        <h2 className="font-semibold text-stone-900">Go-live steps</h2>
        <ol className="mt-3 list-decimal space-y-1 pl-5">
          <li>Deploy on HTTPS and set <code className="rounded bg-stone-100 px-1">APP_URL</code>.</li>
          <li>
            Register Collections callback host with MTN →{" "}
            <code className="rounded bg-stone-100 px-1">/api/momo/callback</code>. For API
            disbursements (sends), also register{" "}
            <code className="rounded bg-stone-100 px-1">/api/momo/callback/outgoing</code>. Phone
            USSD sends: use Dashboard → Log phone send (see{" "}
            <code className="rounded bg-stone-100 px-1">docs/PHONE_SENDS.md</code>).
          </li>
          <li>
            Set production env vars (
            <code className="rounded bg-stone-100 px-1">MOMO_ENVIRONMENT=production</code>, keys,{" "}
            <code className="rounded bg-stone-100 px-1">MOMO_ALLOW_SIMULATE=false</code>).
          </li>
          <li>Run <strong>Test MoMo token</strong> here.</li>
          <li>Send a small real payment and confirm it appears under Transactions.</li>
          <li>Reconcile against statements.mtn.com.gh for 1–2 weeks.</li>
        </ol>
        <p className="mt-3 text-xs">
          Full runbook: <code className="rounded bg-stone-100 px-1">docs/PHASE6_CUTOVER.md</code>
        </p>
      </section>
    </div>
  );
}
