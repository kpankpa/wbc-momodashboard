import "server-only";

import { getMomoConfig } from "@/lib/momo/config";

export type ReadinessItem = {
  id: string;
  label: string;
  ok: boolean;
  detail: string;
};

export function getMomoReadiness(): {
  readyForProductionTraffic: boolean;
  items: ReadinessItem[];
} {
  const config = getMomoConfig();
  const isProdEnv = config.environment === "production";
  const appUrl = process.env.APP_URL?.trim() || "";
  const httpsApp = appUrl.startsWith("https://");

  const items: ReadinessItem[] = [
    {
      id: "credentials",
      label: "API credentials set",
      ok: config.hasApiCredentials,
      detail: config.hasApiCredentials
        ? "Subscription key, API user, and API key are present."
        : "Set MOMO_SUBSCRIPTION_KEY, MOMO_API_USER, and MOMO_API_KEY.",
    },
    {
      id: "webhook_secret",
      label: "Webhook secret configured",
      ok: Boolean(config.webhookSecret),
      detail: config.webhookSecret
        ? "Callbacks must present X-Webhook-Secret / Bearer / ?token=."
        : "Set MOMO_WEBHOOK_SECRET before go-live.",
    },
    {
      id: "callback_host",
      label: "Callback host registered",
      ok: Boolean(config.callbackHost),
      detail: config.callbackHost
        ? `Configured host: ${config.callbackHost}`
        : "Set MOMO_CALLBACK_HOST to the domain MTN registered for callbacks.",
    },
    {
      id: "environment",
      label: "Environment flag",
      ok: true,
      detail: `MOMO_ENVIRONMENT=${config.environment}, target=${config.targetEnvironment}`,
    },
    {
      id: "simulate_off",
      label: "Simulation disabled for production",
      ok: !isProdEnv || !config.allowSimulate,
      detail:
        isProdEnv && config.allowSimulate
          ? "Set MOMO_ALLOW_SIMULATE=false before production traffic."
          : config.allowSimulate
            ? "Simulation allowed (dev/sandbox OK)."
            : "Simulation disabled.",
    },
    {
      id: "https",
      label: "Public HTTPS app URL",
      ok: !isProdEnv || httpsApp,
      detail: appUrl
        ? `APP_URL=${appUrl}`
        : "Set APP_URL to your public https:// dashboard URL.",
    },
    {
      id: "auth_secret",
      label: "AUTH_SECRET set",
      ok: Boolean(process.env.AUTH_SECRET?.trim()),
      detail: process.env.AUTH_SECRET?.trim()
        ? "Session signing secret is present."
        : "Set AUTH_SECRET.",
    },
  ];

  const requiredIds = new Set([
    "credentials",
    "webhook_secret",
    "callback_host",
    "simulate_off",
    "https",
    "auth_secret",
  ]);

  const readyForProductionTraffic =
    isProdEnv && items.filter((i) => requiredIds.has(i.id)).every((i) => i.ok);

  return { readyForProductionTraffic, items };
}
