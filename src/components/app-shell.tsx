"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";
import { logoutAction } from "@/app/actions/auth";
import { LivePayments } from "@/components/live-payments";
import { BRAND } from "@/lib/brand";
import type { Role } from "@/lib/roles";

type Props = {
  email: string;
  role: Role;
  children: React.ReactNode;
};

const SIDEBAR_WIDTH = "w-64";

function navClass(active: boolean) {
  return [
    "rounded-md px-3 py-2 transition-colors",
    active ? "bg-white/15 font-medium text-white" : "hover:bg-white/10",
  ].join(" ");
}

function HamburgerIcon({ open }: { open: boolean }) {
  return (
    <span className="relative block h-4 w-5" aria-hidden>
      <span
        className={`absolute left-0 top-0 block h-0.5 w-5 bg-current transition ${
          open ? "translate-y-1.5 rotate-45" : ""
        }`}
      />
      <span
        className={`absolute left-0 top-1.5 block h-0.5 w-5 bg-current transition ${
          open ? "opacity-0" : ""
        }`}
      />
      <span
        className={`absolute left-0 top-3 block h-0.5 w-5 bg-current transition ${
          open ? "-translate-y-1.5 -rotate-45" : ""
        }`}
      />
    </span>
  );
}

export function AppShell({ email, role, children }: Props) {
  const pathname = usePathname();
  const [open, setOpen] = useState(true);

  useEffect(() => {
    setOpen(false);
  }, [pathname]);

  useEffect(() => {
    if (!open) return;
    const onKey = (event: KeyboardEvent) => {
      if (event.key === "Escape") setOpen(false);
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open]);

  useEffect(() => {
    const mq = window.matchMedia("(min-width: 768px)");
    const sync = () => {
      if (mq.matches) setOpen(true);
      else setOpen(false);
    };
    sync();
    mq.addEventListener("change", sync);
    return () => mq.removeEventListener("change", sync);
  }, []);

  return (
    <div className="min-h-full bg-background">
      {open ? (
        <button
          type="button"
          aria-label="Close menu"
          className="fixed inset-0 z-30 bg-brand-ink/40 md:hidden"
          onClick={() => setOpen(false)}
        />
      ) : null}

      <aside
        id="app-sidebar"
        className={`fixed inset-y-0 left-0 z-40 flex ${SIDEBAR_WIDTH} flex-col border-r border-brand-strong/40 bg-brand-ink text-emerald-50 transition-transform duration-200 ease-out ${
          open ? "translate-x-0" : "-translate-x-full"
        }`}
      >
        <div className="flex items-center justify-between border-b border-white/10 px-4 py-4">
          <div className="min-w-0">
            <p className="font-[family-name:var(--font-display)] text-xl leading-tight tracking-tight">
              {BRAND.company}
            </p>
            <p className="mt-0.5 text-xs text-emerald-100/75">{BRAND.product}</p>
          </div>
          <button
            type="button"
            className="rounded-md p-2 text-emerald-50 hover:bg-white/10 md:hidden"
            aria-label="Close sidebar"
            onClick={() => setOpen(false)}
          >
            <HamburgerIcon open />
          </button>
        </div>

        <nav className="flex flex-1 flex-col gap-1 overflow-y-auto p-3 text-sm">
          <Link href="/dashboard" className={navClass(pathname === "/dashboard")}>
            Dashboard
          </Link>
          <Link
            href="/transactions"
            className={navClass(pathname.startsWith("/transactions"))}
          >
            Transactions
          </Link>
          {role === "ADMIN" ? (
            <>
              <Link
                href="/admin/momo"
                className={navClass(pathname.startsWith("/admin/momo"))}
              >
                MoMo cutover
              </Link>
              <Link
                href="/admin/audit"
                className={navClass(pathname.startsWith("/admin/audit"))}
              >
                Audit log
              </Link>
              <Link
                href="/admin/users"
                className={navClass(pathname.startsWith("/admin/users"))}
              >
                Users
              </Link>
            </>
          ) : null}
        </nav>

        <div className="border-t border-white/10 p-4 text-xs text-emerald-100/80">
          <p className="truncate font-medium text-emerald-50">{email}</p>
          <p className="mt-0.5 uppercase tracking-wide">{role}</p>
          <form action={logoutAction} className="mt-3">
            <button
              type="submit"
              className="text-left text-emerald-200 underline-offset-2 hover:underline"
            >
              Sign out
            </button>
          </form>
        </div>
      </aside>

      <div
        className={`flex min-h-screen min-w-0 flex-col transition-[padding] duration-200 ease-out ${
          open ? "md:pl-64" : "md:pl-0"
        }`}
      >
        <header className="sticky top-0 z-20 flex items-center gap-3 border-b border-border-brand bg-background/95 px-4 py-3 backdrop-blur">
          <button
            type="button"
            className="rounded-md border border-border-brand bg-white p-2 text-brand-ink shadow-sm hover:bg-brand-soft"
            aria-label={open ? "Close sidebar" : "Open sidebar"}
            aria-expanded={open}
            aria-controls="app-sidebar"
            onClick={() => setOpen((value) => !value)}
          >
            <HamburgerIcon open={open} />
          </button>
          <div className="min-w-0 flex-1">
            <p className="truncate font-[family-name:var(--font-display)] text-base text-brand-ink md:text-lg">
              {BRAND.fullName}
            </p>
          </div>
          <LivePayments />
          <form action={logoutAction} className="shrink-0 md:hidden">
            <button type="submit" className="text-sm text-brand underline">
              Sign out
            </button>
          </form>
        </header>

        <main className="flex-1 px-4 py-6 md:px-8">{children}</main>
      </div>
    </div>
  );
}
