import { redirect } from "next/navigation";
import { auth } from "@/auth";
import { BRAND } from "@/lib/brand";
import { LoginForm } from "./login-form";

export default async function LoginPage() {
  const session = await auth();
  if (session?.user?.id) {
    redirect("/dashboard");
  }

  return (
    <main className="relative flex min-h-full flex-1 items-center justify-center px-4 py-16">
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_at_top,_#d8f0e4_0%,_#f3faf6_48%,_#e5f3ec_100%)]"
      />
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0 opacity-[0.28] [background-image:linear-gradient(to_right,#0f6b4520_1px,transparent_1px),linear-gradient(to_bottom,#0f6b4520_1px,transparent_1px)] [background-size:28px_28px]"
      />
      <div className="relative w-full max-w-md rounded-2xl border border-border-brand bg-white/95 p-8 shadow-[0_24px_60px_-28px_rgba(6,53,38,0.35)] backdrop-blur">
        <p className="text-xs font-semibold uppercase tracking-[0.14em] text-brand">
          {BRAND.company}
        </p>
        <p className="mt-2 font-[family-name:var(--font-display)] text-3xl tracking-tight text-brand-ink">
          {BRAND.product}
        </p>
        <h1 className="mt-3 text-lg font-semibold text-brand-ink">Staff sign in</h1>
        <p className="mt-1 text-sm text-stone-600">
          Monitor company MoMo inflows without the handset. Authorized users only.
        </p>
        <div className="mt-6">
          <LoginForm />
        </div>
      </div>
    </main>
  );
}
