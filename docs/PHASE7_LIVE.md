# Phase 7 — Live updates (SSE + toast)

## What it does

While staff are signed in, the app opens an authenticated **Server-Sent Events** stream at `/api/live/transactions`.

When a payment is ingested (webhook, simulate, or status poll), the server publishes an event. Open dashboards:

- show a **Live / Offline** indicator
- pop a **toast** (amount, status, payer name)
- optionally play a short **chime** (toggleable)
- **refresh** the current page data

## Limits

- In-memory bus works on a **single Node process**. Multi-instance hosts need a shared pub/sub (Redis, etc.) later.
- SSE reconnects automatically via the browser `EventSource` client.

## How to test

1. Open the dashboard in one browser tab (confirm **Live**).
2. As admin, simulate a payment (or POST a callback).
3. Toast should appear without a manual reload.
