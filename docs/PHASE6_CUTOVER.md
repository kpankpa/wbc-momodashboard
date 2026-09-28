# Phase 6 — Production MoMo cutover

## Goal

Receive **real** customer payments into MoMo Desk without depending on the company phone.

## Preconditions

- [ ] HTTPS deployment (`APP_URL=https://...`)
- [ ] PostgreSQL recommended for production (SQLite is local-only)
- [ ] MTN Collections production access approved
- [ ] Callback host registered with MTN (same domain as `MOMO_CALLBACK_HOST`)
- [ ] Strong `AUTH_SECRET` and `MOMO_WEBHOOK_SECRET`
- [ ] `MOMO_ALLOW_SIMULATE=false`
- [ ] `MOMO_ENVIRONMENT=production`
- [ ] `MOMO_TARGET_ENVIRONMENT` set to your MTN target (often `mtnghana`)

## Env template (production)

```bash
MOMO_ENVIRONMENT=production
MOMO_BASE_URL=https://proxy.momoapi.mtn.com
MOMO_SUBSCRIPTION_KEY=...
MOMO_API_USER=...
MOMO_API_KEY=...
MOMO_TARGET_ENVIRONMENT=mtnghana
MOMO_CALLBACK_HOST=your.domain.com
MOMO_WEBHOOK_SECRET=long-random-secret
MOMO_ALLOW_SIMULATE=false
APP_URL=https://your.domain.com
```

Callback URL for MTN / your request-to-pay header:

`https://your.domain.com/api/momo/callback`

Authenticate callbacks with header:

`X-Webhook-Secret: <MOMO_WEBHOOK_SECRET>`

(or Bearer / `?token=`)

## Cutover steps

1. Deploy app + migrate DB.
2. Seed/create admin users; disable unused accounts.
3. Open **Admin → MoMo cutover** and confirm checklist greens.
4. Click **Test MoMo token**.
5. Make a small real payment to the merchant line / request-to-pay.
6. Confirm row appears under **Transactions** within ~2 minutes.
7. If webhook missing: use **Poll & ingest** with the original `X-Reference-Id`.
8. Export CSV and reconcile to `statements.mtn.com.gh`.
9. Keep Partner portal as backup for 2–4 weeks.

## Incident runbook

| Symptom | Action |
|---------|--------|
| No payments appearing | Check `/api/health`, webhook secret, MTN callback host registration; poll by reference ID |
| Duplicates | Safe — `externalId` is unique; duplicates update the same row |
| Token test fails | Verify subscription key / API user / API key / base URL / target environment |
| Wrong amounts | Compare raw admin payload on detail page with MTN statement |
| Suspected breach | Rotate `AUTH_SECRET`, `MOMO_WEBHOOK_SECRET`, MoMo API key; disable users |

## Rollback

1. Point staff back to MTN Partner portal / statements.
2. Keep dashboard read-only; stop registering new callback traffic if needed.
3. Do not delete historical transaction rows without a backup.
