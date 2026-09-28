# Security Checklist

## Secrets

- [ ] Never commit `.env` or MoMo keys
- [ ] Use different keys for sandbox vs production
- [ ] Rotate `AUTH_SECRET` if leaked
- [ ] MoMo subscription keys / API user secrets only on server

## Auth

- [ ] Passwords hashed with bcrypt (cost ≥ 12)
- [ ] Login rate-limited per IP + email
- [ ] Inactive users cannot sign in
- [ ] Sessions expire; logout clears session cookie
- [ ] Role checks on every sensitive server action / API route

## HTTP

- [ ] HTTPS only in production
- [ ] Security headers: CSP, frame-ancestors, nosniff, referrer-policy, HSTS
- [ ] CSRF protection via Auth.js for session mutations

## Data

- [ ] Mask payer MSISDN in UI for STAFF
- [ ] Raw MoMo payloads admin-only (Phase 3+)
- [ ] Audit log for login, failed login, user invite/disable, exports
- [ ] Webhook endpoint authenticated / verified (Phase 3)

## Ops

- [ ] Database backups in production
- [ ] Disable unused accounts
- [ ] Reconcile weekly against statements.mtn.com.gh until trusted
- [ ] Run `npm test` in CI / before releases
- [ ] Run `npm run db:retention` monthly (or cron) to clear old raw payloads
- [ ] Review `/admin/audit` weekly
