# MoMo Merchant Payments Dashboard — Requirements & Features

## 1. Purpose

Private web app that shows **incoming MTN MoMo payments** to the company merchant line so staff can monitor and reconcile payments **without holding the company phone**.

## 2. Goals

- Display live (near real-time) customer payments sent to the company MoMo merchant/line.
- Give staff a shared, authenticated view of transaction history.
- Reduce dependence on the physical SIM/phone for day-to-day monitoring.
- Support basic reconciliation against MTN statements.

## 3. Non-goals (v1)

- Customer-facing payment / checkout UI
- Disbursements (sending money out)
- Native mobile or desktop apps
- Replacing MTN official statements as legal source of truth
- Merchant onboarding / SIM registration

## 4. Roles

| Role | Can do |
|------|--------|
| **ADMIN** | Manage users, view all txs (full MSISDN), export, configure |
| **STAFF** | View transactions (masked MSISDN), search/filter, add notes |
| **VIEWER** | Read-only + export |

## 5. MVP features (Phases 0–6)

1. Staff login / logout (no MoMo OTP for daily use)
2. Transaction list + detail
3. Filters (today, date range, status, search)
4. MoMo webhook receiver + idempotent storage
5. Today’s total + count
6. CSV export
7. Admin user management
8. Audit logging for auth, exports, user changes

## 6. Security priorities

- Server-only secrets (MoMo keys never in the browser)
- Strong password hashing (bcrypt)
- Rate-limited login
- Role-based access control
- Security HTTP headers
- Audit trail
- HTTPS in production
- Idempotent webhook handling (Phase 3)

## 7. Stack

- Next.js + TypeScript + Tailwind
- Prisma + SQLite (local) / PostgreSQL (production)
- Auth.js (NextAuth v5)
- Hosted HTTPS (e.g. Vercel) + managed Postgres in production
