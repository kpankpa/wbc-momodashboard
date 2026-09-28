# Phase 8 — Hardening, tests, backups

## Shipped in code

- Unit tests: `npm test` (status mapping, filters, CSV masking, webhook auth)
- Admin **Audit log** page (`/admin/audit`)
- Raw payload retention script: `npm run db:retention`
- Ops checklist below

## What YOU need to do

### 1. Security (do this week)

1. **Change the default admin password** (still `ChangeMe-Strong-Password-123!` if unchanged).
2. **Rotate secrets** in `.env` / host env:
   - `AUTH_SECRET` — new random value (`openssl rand -base64 32`)
   - `MOMO_WEBHOOK_SECRET` — new random value (not the dev placeholder)
3. **Invite only real staff** under Users; deactivate anyone who left.
4. Confirm `.env` is **not** committed to git.

### 2. Before real customer money

1. Get MTN **Collections** credentials (sandbox first, then production).
2. Fill in:
   - `MOMO_SUBSCRIPTION_KEY`
   - `MOMO_API_USER`
   - `MOMO_API_KEY`
   - `MOMO_CALLBACK_HOST`
   - `MOMO_ENVIRONMENT=production` only when ready
   - `MOMO_ALLOW_SIMULATE=false` in production
3. Deploy on **HTTPS** and set `APP_URL=https://your-domain`.
4. Open **Admin → MoMo cutover**, run **Test MoMo token**, send a small real payment.
5. Follow `docs/PHASE6_CUTOVER.md`.

### 3. Database & backups

- Local SQLite (`prisma/dev.db`) is fine for demos only.
- For production: switch Prisma to **PostgreSQL**, set `DATABASE_URL`, run migrations.
- Enable automated DB backups on your host (Neon/Supabase/Railway/etc. usually have one-click backups).
- Weekly: export CSV from Transactions and compare to `statements.mtn.com.gh`.
- Monthly (or via cron): run `npm run db:retention` to strip old raw webhook JSON (default 90 days).

### 4. Ongoing ops

| Task | Who | When |
|------|-----|------|
| Watch Live indicator + toasts | Staff | Daily |
| Reconcile VERIFIED / DISPUTED | Finance | Daily/weekly |
| Review Audit log | Admin | Weekly |
| Rotate MoMo/API secrets if leaked | Admin | Immediately |
| Keep Partner portal as backup | Ops | First 2–4 weeks after go-live |

## Commands

```bash
npm test
npm run db:retention
npm run build
```
