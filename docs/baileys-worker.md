# AIT Baileys worker

AIT keeps the Next.js dashboard on Vercel and runs Baileys as a separate, continuously running Node.js service. The worker connects as a WhatsApp linked device, writes inbound text messages through the existing `ait_record_inbound_text` Supabase RPC, and sends dashboard replies on behalf of the linked account.

## MVP scope

- one-to-one text messages only
- pairing-code connection from Settings
- one persistent session directory per `channel_connections.id`
- existing Supabase contacts, conversations, messages, RLS, and Realtime remain unchanged
- Meta Cloud API remains available as a dormant provider during rollout

Groups, media, calls, full-history import, and automatic AI replies are intentionally outside this first connection milestone.

## Required deployment variables

Set these on the worker:

```text
PORT=3001
AIT_WORKER_SECRET=<at least 32 random characters>
SUPABASE_URL=<project URL>
SUPABASE_SERVICE_ROLE_KEY=<server-only service role key>
BAILEYS_AUTH_DIR=/data/baileys-auth
LOG_LEVEL=info
```

Set these on the Vercel project for both Preview and Production:

```text
BAILEYS_WORKER_URL=https://<worker-host>
BAILEYS_WORKER_SECRET=<the exact same secret>
```

Never expose either the service-role key or worker secret through a `NEXT_PUBLIC_` variable.

## Railway deployment

Create a service from this repository with `workers/baileys` as its root directory. Attach a persistent volume mounted at `/data` and set the worker variables above. The health endpoint is `GET /health`.

The persistent volume is mandatory for this MVP auth adapter. Losing the directory requires linking the WhatsApp number again. Baileys auth files contain long-lived Signal credentials: do not commit, log, download, or share them.

For a later multi-company production rollout, replace `useMultiFileAuthState` with an encrypted database-backed auth state before onboarding many customers.

## Acceptance test

1. Open AIT Settings → Channel.
2. Enter a separate WhatsApp test number including its country code.
3. In WhatsApp, open Settings → Linked Devices → Link a Device → Link with phone number.
4. Enter the code displayed by AIT and wait for the channel status to become `connected`.
5. Send a one-to-one text to the linked number from another WhatsApp account.
6. Confirm the message appears in Inbox without refreshing.
7. Reply in Inbox and confirm the other WhatsApp account receives it.

Use a separate test or business number. Baileys is an unofficial WhatsApp Web client, so protocol changes, forced relinking, or account restrictions are possible.
