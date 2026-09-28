# Development Phases

| Phase | Focus | Status |
|-------|--------|--------|
| 0 | Discovery, docs, env template, security baseline | Done |
| 1 | Next.js foundation, Prisma schema, health check | Done |
| 2 | Auth.js, roles, protected routes, admin users | Done |
| 3 | MoMo sandbox webhook + idempotent transactions | Done |
| 4 | Transactions UI (list, filters, summary, name) | Done |
| 5 | CSV export + reconciliation flags | Done |
| 6 | Production MoMo cutover (client, readiness, poll) | Done |
| 7 | Near real-time UX (SSE/toast) | Done |
| 8 | Hardening, tests, backups | Done |
| 9 | Optional: PWA, alerts, request-to-pay | Later |

## Critical path

Start Phases 1–2 while waiting for MTN API approval. Phase 3 needs sandbox credentials. First shippable with real money = end of Phase 6.
