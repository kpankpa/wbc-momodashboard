"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useCallback, useEffect, useRef, useState } from "react";

type LiveTransactionEvent = {
  type: "transaction";
  id: string;
  externalId: string;
  amount: string;
  currency: string;
  status: string;
  direction: "INCOMING" | "OUTGOING";
  counterpartyName: string | null;
  created: boolean;
  at: string;
};

type Toast = LiveTransactionEvent & { key: string };

function playChime(outgoing: boolean) {
  try {
    const AudioCtx =
      window.AudioContext ||
      (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
    const ctx = new AudioCtx();
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.type = "sine";
    osc.frequency.value = outgoing ? 620 : 880;
    gain.gain.value = 0.05;
    osc.connect(gain);
    gain.connect(ctx.destination);
    osc.start();
    gain.gain.exponentialRampToValueAtTime(0.0001, ctx.currentTime + 0.28);
    osc.stop(ctx.currentTime + 0.3);
    void ctx.close();
  } catch {
    /* ignore */
  }
}

export function LivePayments() {
  const router = useRouter();
  const [connected, setConnected] = useState(false);
  const [soundOn, setSoundOn] = useState(true);
  const [toasts, setToasts] = useState<Toast[]>([]);
  const seen = useRef(new Set<string>());

  const pushToast = useCallback(
    (event: LiveTransactionEvent) => {
      const dedupe = `${event.id}:${event.status}:${event.created}:${event.direction}`;
      if (seen.current.has(dedupe)) return;
      seen.current.add(dedupe);

      const toast: Toast = { ...event, key: `${dedupe}:${Date.now()}` };
      setToasts((prev) => [toast, ...prev].slice(0, 4));
      if (soundOn && (event.created || event.status === "SUCCESSFUL")) {
        playChime(event.direction === "OUTGOING");
      }
      router.refresh();

      window.setTimeout(() => {
        setToasts((prev) => prev.filter((item) => item.key !== toast.key));
      }, 9000);
    },
    [router, soundOn],
  );

  useEffect(() => {
    const source = new EventSource("/api/live/transactions");

    source.onopen = () => setConnected(true);
    source.onerror = () => setConnected(false);
    source.onmessage = (message) => {
      try {
        const data = JSON.parse(message.data) as { type?: string } & Partial<LiveTransactionEvent>;
        if (data.type === "transaction" && data.id) {
          pushToast({
            ...(data as LiveTransactionEvent),
            direction: data.direction === "OUTGOING" ? "OUTGOING" : "INCOMING",
            counterpartyName: data.counterpartyName ?? null,
          });
        }
      } catch {
        /* ignore */
      }
    };

    return () => {
      source.close();
      setConnected(false);
    };
  }, [pushToast]);

  return (
    <>
      <div className="flex items-center gap-2">
        <span
          className={`inline-flex items-center gap-1.5 rounded-full border px-2.5 py-1 text-xs font-medium ${
            connected
              ? "border-emerald-300 bg-emerald-50 text-emerald-900"
              : "border-stone-300 bg-stone-100 text-stone-600"
          }`}
          title={connected ? "Listening for MoMo line activity" : "Reconnecting…"}
        >
          <span
            className={`h-1.5 w-1.5 rounded-full ${
              connected ? "animate-pulse bg-emerald-600" : "bg-stone-400"
            }`}
          />
          {connected ? "Live" : "Offline"}
        </span>
        <button
          type="button"
          onClick={() => setSoundOn((value) => !value)}
          className="rounded-md border border-stone-300 bg-white px-2 py-1 text-xs text-stone-700 hover:bg-stone-50"
        >
          {soundOn ? "Sound on" : "Muted"}
        </button>
      </div>

      <div
        aria-live="polite"
        className="pointer-events-none fixed right-4 top-16 z-50 flex w-[min(22rem,calc(100vw-2rem))] flex-col gap-2"
      >
        {toasts.map((toast) => {
          const outgoing = toast.direction === "OUTGOING";
          return (
            <div
              key={toast.key}
              className={`pointer-events-auto rounded-xl border bg-white p-3 shadow-lg ${
                outgoing
                  ? "border-orange-200 shadow-orange-950/10"
                  : "border-emerald-200 shadow-emerald-950/10"
              }`}
            >
              <p
                className={`text-xs font-semibold uppercase tracking-wide ${
                  outgoing ? "text-orange-800" : "text-emerald-800"
                }`}
              >
                {outgoing ? "Company phone sent money" : "Money received"}
              </p>
              <p className="mt-1 text-sm font-semibold text-stone-900">
                {toast.currency}{" "}
                {Number(toast.amount).toLocaleString("en-GH", {
                  minimumFractionDigits: 2,
                  maximumFractionDigits: 2,
                })}
                <span className="ml-2 text-xs font-medium text-stone-500">{toast.status}</span>
              </p>
              <p className="mt-0.5 truncate text-xs text-stone-600">
                {outgoing ? "To" : "From"}: {toast.counterpartyName || "Unknown"}
              </p>
              <Link
                href={`/transactions/${toast.id}`}
                className="mt-2 inline-block text-xs font-medium text-brand underline-offset-2 hover:underline"
              >
                View details
              </Link>
            </div>
          );
        })}
      </div>
    </>
  );
}
