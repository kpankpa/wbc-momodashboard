import "server-only";

import { getMomoConfig } from "@/lib/momo/config";

type TokenCache = {
  accessToken: string;
  expiresAt: number;
};

let tokenCache: TokenCache | null = null;

export class MomoApiError extends Error {
  status: number;
  body: string;

  constructor(message: string, status: number, body: string) {
    super(message);
    this.name = "MomoApiError";
    this.status = status;
    this.body = body;
  }
}

export async function getCollectionAccessToken(): Promise<string> {
  const config = getMomoConfig();
  if (!config.hasApiCredentials) {
    throw new MomoApiError("MoMo API credentials are not configured.", 503, "");
  }

  const now = Date.now();
  if (tokenCache && tokenCache.expiresAt > now + 30_000) {
    return tokenCache.accessToken;
  }

  const basic = Buffer.from(`${config.apiUser}:${config.apiKey}`).toString("base64");
  const response = await fetch(`${config.baseUrl}/collection/token/`, {
    method: "POST",
    headers: {
      Authorization: `Basic ${basic}`,
      "Ocp-Apim-Subscription-Key": config.subscriptionKey,
    },
    cache: "no-store",
  });

  const text = await response.text();
  if (!response.ok) {
    throw new MomoApiError("Failed to obtain MoMo access token.", response.status, text);
  }

  let json: { access_token?: string; expires_in?: number };
  try {
    json = JSON.parse(text) as { access_token?: string; expires_in?: number };
  } catch {
    throw new MomoApiError("Invalid token response from MoMo.", 502, text);
  }

  if (!json.access_token) {
    throw new MomoApiError("MoMo token response missing access_token.", 502, text);
  }

  const expiresInMs = Math.max(60, Number(json.expires_in) || 3600) * 1000;
  tokenCache = {
    accessToken: json.access_token,
    expiresAt: now + expiresInMs,
  };

  return json.access_token;
}

export type RequestToPayStatus = {
  financialTransactionId?: string;
  externalId?: string;
  amount?: string;
  currency?: string;
  status?: string;
  payer?: {
    partyIdType?: string;
    partyId?: string;
  };
  payerMessage?: string;
  payeeNote?: string;
  reason?: unknown;
};

export async function getRequestToPayStatus(
  referenceId: string,
): Promise<RequestToPayStatus> {
  const config = getMomoConfig();
  if (!config.hasApiCredentials) {
    throw new MomoApiError("MoMo API credentials are not configured.", 503, "");
  }

  const token = await getCollectionAccessToken();
  const response = await fetch(
    `${config.baseUrl}/collection/v1_0/requesttopay/${encodeURIComponent(referenceId)}`,
    {
      method: "GET",
      headers: {
        Authorization: `Bearer ${token}`,
        "X-Target-Environment": config.targetEnvironment,
        "Ocp-Apim-Subscription-Key": config.subscriptionKey,
      },
      cache: "no-store",
    },
  );

  const text = await response.text();
  if (!response.ok) {
    throw new MomoApiError(
      `MoMo status check failed for ${referenceId}.`,
      response.status,
      text,
    );
  }

  try {
    return JSON.parse(text) as RequestToPayStatus;
  } catch {
    throw new MomoApiError("Invalid status response from MoMo.", 502, text);
  }
}

export function clearMomoTokenCache() {
  tokenCache = null;
}
