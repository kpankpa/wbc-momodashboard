import "server-only";

export type MomoEnvironment = "sandbox" | "production";

export function getMomoConfig() {
  const environment = (process.env.MOMO_ENVIRONMENT || "sandbox") as MomoEnvironment;
  const webhookSecret = process.env.MOMO_WEBHOOK_SECRET?.trim() || "";
  const isNodeProd = process.env.NODE_ENV === "production";
  const isMomoProd = environment === "production";

  const allowSimulateExplicit = process.env.MOMO_ALLOW_SIMULATE;
  const allowSimulate =
    !isMomoProd &&
    (allowSimulateExplicit === "true" ||
      (!isNodeProd && allowSimulateExplicit !== "false"));

  return {
    environment,
    baseUrl:
      process.env.MOMO_BASE_URL?.replace(/\/$/, "") ||
      (isMomoProd
        ? "https://proxy.momoapi.mtn.com"
        : "https://sandbox.momodeveloper.mtn.com"),
    subscriptionKey: process.env.MOMO_SUBSCRIPTION_KEY?.trim() || "",
    apiUser: process.env.MOMO_API_USER?.trim() || "",
    apiKey: process.env.MOMO_API_KEY?.trim() || "",
    targetEnvironment:
      process.env.MOMO_TARGET_ENVIRONMENT?.trim() ||
      (isMomoProd ? "mtnghana" : "sandbox"),
    callbackHost: process.env.MOMO_CALLBACK_HOST?.trim() || "",
    webhookSecret,
    requireWebhookSecret: isNodeProd || isMomoProd || webhookSecret.length > 0,
    allowSimulate,
    hasApiCredentials: Boolean(
      process.env.MOMO_SUBSCRIPTION_KEY?.trim() &&
        process.env.MOMO_API_USER?.trim() &&
        process.env.MOMO_API_KEY?.trim(),
    ),
  };
}
