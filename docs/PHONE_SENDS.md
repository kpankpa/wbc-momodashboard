# Company MoMo phone — outgoing alerts

White Beam Concepts MoMo Desk tracks **two directions**:

| Type | Meaning | How it reaches the dashboard |
|------|---------|------------------------------|
| **INCOMING** | Customer pays the company MoMo number | MTN Collections webhook → `/api/momo/callback` → Live toast |
| **OUTGOING** | Person holding the company phone **sends** money | See below |

## Phone / USSD sends (most common)

When staff dials USSD or uses the MoMo app on the physical SIM:

- MTN **does not** push that event to your Collections callback URL.
- Staff or admin must use **Log send from company MoMo phone** on the Dashboard.
- That creates an OUTGOING transaction and fires the Live alert (“Company phone sent money”).

## Automatic outgoing (API)

If you later enable MTN **Disbursements** (transfer API):

1. Register callback host pointing to `/api/momo/callback/outgoing`.
2. Same webhook secret as Collections.
3. Callbacks are stored as OUTGOING and alert the dashboard.

## Testing without MTN

1. Log in as admin with `MOMO_ALLOW_SIMULATE=true`.
2. On Dashboard → **Admin simulate** → Type = **Outgoing**.
3. Or use **Log phone send** as staff/admin.
4. Keep the dashboard open with **Live** connected — you should see an orange toast and hear a chime.
