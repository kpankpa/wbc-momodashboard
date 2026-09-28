# Phase 3 — MoMo webhook ingestion

## Endpoint

- `POST|PUT /api/momo/callback` — public (MTN callbacks)
- Auth via one of:
  - Header `X-Webhook-Secret: <MOMO_WEBHOOK_SECRET>`
  - Header `Authorization: Bearer <MOMO_WEBHOOK_SECRET>`
  - Query `?token=<MOMO_WEBHOOK_SECRET>`

Set `MOMO_WEBHOOK_SECRET` in `.env`. In production it is **required**.

## Idempotency

Rows are keyed by `externalId` (prefer MoMo `financialTransactionId`, then payload `externalId`, then `X-Reference-Id`). Duplicate callbacks update status and return `created: false`.

## Local testing without MTN

1. Sign in as admin
2. Use **Simulate incoming payment** on the dashboard
3. Or curl:

```bash
curl -X POST http://localhost:3000/api/momo/callback \
  -H "Content-Type: application/json" \
  -H "X-Webhook-Secret: YOUR_SECRET" \
  -d "{\"financialTransactionId\":\"tx_001\",\"amount\":\"25.50\",\"currency\":\"GHS\",\"status\":\"SUCCESSFUL\",\"payer\":{\"partyIdType\":\"MSISDN\",\"partyId\":\"233241234567\"}}"
```

## Note on sandbox

MTN sandbox often accepts request-to-pay but may not deliver callbacks reliably. Prefer status polling later; for now simulation + manual callback POSTs prove the pipeline.
