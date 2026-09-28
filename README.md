# MoMo Desk

Secure internal web dashboard for monitoring incoming MTN MoMo payments to your company line.

## Current phase

**Phases 0–8 complete.** Optional Phase 9 later (PWA, alerts, request-to-pay).

**Your action items:** see `docs/PHASE8_HARDENING.md` (passwords, secrets, MoMo credentials, HTTPS deploy, backups).

## Stack

- Next.js (App Router) + TypeScript + Tailwind
- Prisma + SQLite locally (use PostgreSQL in production)
- Auth.js (credentials) with RBAC: `ADMIN` | `STAFF` | `VIEWER`
- Audit logging, login rate limits, security headers

## Quick start

1. Copy env file and set secrets:

```bash
cp .env.example .env
```

Generate `AUTH_SECRET`:

```bash
openssl rand -base64 32
```

Set a strong `ADMIN_PASSWORD` (12+ chars).

2. Install, migrate, seed admin:

```bash
npm install
npm run setup
```

3. Run:

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) and sign in with `ADMIN_EMAIL` / `ADMIN_PASSWORD`.

## Security notes

- Never commit `.env` or MoMo API keys.
- MoMo secrets are server-only (Phase 3+).
- Inactive users are blocked on every session refresh.
- `/api/momo/callback` is reserved and returns 503 until Phase 3.

## Production

- Switch `DATABASE_URL` to PostgreSQL and change Prisma `provider` to `postgresql`.
- Deploy on HTTPS only.
- Keep `robots: noindex` (already set).
