import { z } from "zod";

export const momoCallbackSchema = z
  .object({
    financialTransactionId: z.string().min(1).optional(),
    externalId: z.string().min(1).optional(),
    amount: z.union([z.string(), z.number()]),
    currency: z.string().min(1).max(8).default("GHS"),
    status: z.string().min(1),
    direction: z.enum(["INCOMING", "OUTGOING"]).optional(),
    payer: z
      .object({
        partyIdType: z.string().optional(),
        partyId: z.string().optional(),
        partyName: z.string().optional(),
      })
      .optional(),
    payee: z
      .object({
        partyIdType: z.string().optional(),
        partyId: z.string().optional(),
        partyName: z.string().optional(),
      })
      .optional(),
    payerName: z.string().optional(),
    payeeName: z.string().optional(),
    payerMessage: z.string().optional(),
    payeeNote: z.string().optional(),
    reason: z
      .union([
        z.string(),
        z.object({
          code: z.string().optional(),
          message: z.string().optional(),
        }),
      ])
      .optional(),
  })
  .passthrough();

export type MomoCallbackPayload = z.infer<typeof momoCallbackSchema>;
