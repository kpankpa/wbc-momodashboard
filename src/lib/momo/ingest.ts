import "server-only";

import { Prisma } from "@prisma/client";
import { prisma } from "@/lib/db";
import { publishPaymentEvent } from "@/lib/live/bus";
import { mapMomoStatus, resolveExternalId } from "@/lib/momo/map";
import type { MomoCallbackPayload } from "@/lib/momo/types";

export type TxDirection = "INCOMING" | "OUTGOING";

type IngestInput = {
  payload: MomoCallbackPayload;
  referenceIdHeader?: string | null;
  merchantId?: string | null;
  direction?: TxDirection;
};

export type IngestResult =
  | {
      ok: true;
      created: boolean;
      transactionId: string;
      externalId: string;
      amount: string;
      currency: string;
      status: string;
      direction: TxDirection;
      counterpartyName: string | null;
    }
  | { ok: false; error: string };

function emitLive(result: Extract<IngestResult, { ok: true }>) {
  publishPaymentEvent({
    type: "transaction",
    id: result.transactionId,
    externalId: result.externalId,
    amount: result.amount,
    currency: result.currency,
    status: result.status,
    direction: result.direction,
    counterpartyName: result.counterpartyName,
    created: result.created,
    at: new Date().toISOString(),
  });
}

export async function ingestMomoCallback(input: IngestInput): Promise<IngestResult> {
  const externalId = resolveExternalId(input.payload, input.referenceIdHeader);
  if (!externalId) {
    return {
      ok: false,
      error: "Missing financialTransactionId, externalId, and X-Reference-Id.",
    };
  }

  const amountNumber = Number(input.payload.amount);
  if (!Number.isFinite(amountNumber) || amountNumber < 0) {
    return { ok: false, error: "Invalid amount." };
  }

  const direction: TxDirection =
    input.direction ||
    input.payload.direction ||
    "INCOMING";

  const status = mapMomoStatus(input.payload.status);
  const amount = amountNumber.toFixed(2);
  const currency = input.payload.currency?.toUpperCase() || "GHS";

  const payerMsisdn = input.payload.payer?.partyId?.trim() || null;
  const payerName =
    input.payload.payerName?.trim() ||
    input.payload.payer?.partyName?.trim() ||
    null;
  const payeeMsisdn = input.payload.payee?.partyId?.trim() || null;
  const payeeName =
    input.payload.payeeName?.trim() ||
    input.payload.payee?.partyName?.trim() ||
    null;

  const counterpartyName = direction === "OUTGOING" ? payeeName : payerName;

  const orderReference =
    input.payload.externalId?.trim() ||
    input.payload.payeeNote?.trim() ||
    null;
  const rawPayload = JSON.stringify({ ...input.payload, direction });

  const existing = await prisma.transaction.findUnique({
    where: { externalId },
    select: { id: true },
  });

  if (existing) {
    const updated = await prisma.transaction.update({
      where: { externalId },
      data: {
        status,
        direction,
        amount: new Prisma.Decimal(amount),
        currency,
        payerMsisdn: payerMsisdn ?? undefined,
        payerName: payerName ?? undefined,
        payeeMsisdn: payeeMsisdn ?? undefined,
        payeeName: payeeName ?? undefined,
        merchantId: input.merchantId ?? undefined,
        orderReference: orderReference ?? undefined,
        rawPayload,
      },
      select: { id: true, payerName: true, payeeName: true, direction: true },
    });

    const result: Extract<IngestResult, { ok: true }> = {
      ok: true,
      created: false,
      transactionId: updated.id,
      externalId,
      amount,
      currency,
      status,
      direction: updated.direction as TxDirection,
      counterpartyName:
        updated.direction === "OUTGOING" ? updated.payeeName : updated.payerName,
    };
    emitLive(result);
    return result;
  }

  try {
    const created = await prisma.transaction.create({
      data: {
        externalId,
        amount: new Prisma.Decimal(amount),
        currency,
        status,
        direction,
        payerMsisdn,
        payerName,
        payeeMsisdn,
        payeeName,
        merchantId: input.merchantId || null,
        momoTimestamp: new Date(),
        rawPayload,
        orderReference,
      },
      select: { id: true, payerName: true, payeeName: true, direction: true },
    });

    const result: Extract<IngestResult, { ok: true }> = {
      ok: true,
      created: true,
      transactionId: created.id,
      externalId,
      amount,
      currency,
      status,
      direction: created.direction as TxDirection,
      counterpartyName: counterpartyName,
    };
    emitLive(result);
    return result;
  } catch (error) {
    if (
      error instanceof Prisma.PrismaClientKnownRequestError &&
      error.code === "P2002"
    ) {
      const raced = await prisma.transaction.findUnique({
        where: { externalId },
        select: {
          id: true,
          payerName: true,
          payeeName: true,
          amount: true,
          currency: true,
          status: true,
          direction: true,
        },
      });
      if (raced) {
        const result: Extract<IngestResult, { ok: true }> = {
          ok: true,
          created: false,
          transactionId: raced.id,
          externalId,
          amount: raced.amount.toString(),
          currency: raced.currency,
          status: raced.status,
          direction: raced.direction as TxDirection,
          counterpartyName:
            raced.direction === "OUTGOING" ? raced.payeeName : raced.payerName,
        };
        emitLive(result);
        return result;
      }
    }
    throw error;
  }
}
