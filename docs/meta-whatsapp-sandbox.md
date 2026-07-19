# Meta WhatsApp Cloud API sandbox setup

This Phase 2A integration is a server-side sandbox foundation. It accepts signed Meta webhooks, stores inbound text messages in AIT's provider-neutral tables, tracks delivery status without regressions, and lets an authenticated organization owner or manager send a free-form reply while the stored 24-hour customer-service window is open.

It does not add templates, marketing, AI sending, Embedded Signup, customer onboarding, media downloads, or production-number configuration.

## Routes

- Meta webhook callback: `https://YOUR_VERCEL_DOMAIN/api/webhooks/meta/whatsapp`
- Authenticated outbound text: `POST /api/conversations/CONVERSATION_ID/messages`

The outbound body is:

```json
{
  "text": "Thanks for contacting us."
}
```

Do not send an organization ID, connection ID, phone-number ID, recipient number, or Meta credential from the browser. The server derives those values from the authenticated conversation and trusted database mapping.

## Required Vercel environment variables

Add these in the Vercel project settings for the environments where the sandbox should run, then redeploy:

| Name | Secret? | Purpose |
| --- | --- | --- |
| `NEXT_PUBLIC_SUPABASE_URL` | No | Existing Supabase project URL. |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | No | Existing browser-safe Supabase anonymous key used for Auth/RLS. |
| `SUPABASE_SERVICE_ROLE_KEY` | **Yes** | Server-only database writes for verified webhooks and provider-controlled fields. |
| `META_GRAPH_API_VERSION` | No | Meta Graph API version enabled for the app, in `vNN.0` form. |
| `META_WHATSAPP_ACCESS_TOKEN` | **Yes** | Temporary sandbox access token used only by the server. |
| `META_WHATSAPP_APP_SECRET` | **Yes** | Validates `x-hub-signature-256` before JSON parsing or storage. |
| `META_WHATSAPP_VERIFY_TOKEN` | **Yes** | Private value shared only between Meta's webhook configuration and this server. |
| `META_WHATSAPP_PHONE_NUMBER_ID` | Treat as private configuration | Ensures the environment token is used only for the mapped sandbox number. |
| `META_WHATSAPP_BUSINESS_ACCOUNT_ID` | Treat as private configuration | Ensures the environment token is used only for the mapped sandbox WABA. |

Never use a `NEXT_PUBLIC_` name for the service-role key, Meta token, App Secret, or verify token. Never paste those values into code, issues, chat, screenshots, logs, test fixtures, commits, or documentation.

The checked-in `.env.example` contains names and blank values only. For local work, use an ignored `.env.local` and keep it off screen when sharing or recording.

## Create a private webhook verify token

Generate a random value locally:

```bash
openssl rand -hex 32
```

Save the result as `META_WHATSAPP_VERIFY_TOKEN` in Vercel and paste the same result into Meta's webhook **Verify token** field. It is not the Meta access token or App Secret. Do not reuse a password and do not share the generated value.

## Apply the Phase 2A database migration

Review and apply `supabase/migrations/20260717120000_server_messaging_functions.sql` through the normal reviewed Supabase migration process before enabling the webhook. The migration adds only three server-role functions; it does not alter the existing tables or RLS policies.

- `ait_record_inbound_text` atomically creates/fetches the contact and conversation, inserts one provider-ID-unique message, increments unread state once, and advances the 24-hour window.
- `ait_advance_message_delivery_status` permits only forward `sent` → `delivered` → `read` transitions and safe early `failed` transitions.
- `ait_mark_outbound_message_sent` atomically stores the outbound provider ID and advances the conversation timestamp without moving it backward.

Do not run disposable database tests against production and do not use migration repair or database reset.

## Create the sandbox channel mapping

The webhook trusts only `meta_whatsapp_connections.phone_number_id`. It never accepts an organization ID from Meta or the browser.

In Supabase SQL Editor, replace every `YOUR_...` placeholder below with identifiers from your own organization and Meta sandbox. These are identifiers, not the access token, App Secret, verify token, or service-role key. Run the statement once and save the returned channel connection ID:

```sql
with new_connection as (
  insert into public.channel_connections (
    organization_id,
    channel_type,
    provider,
    status,
    external_account_id,
    connected_phone_number,
    display_name,
    connected_at
  ) values (
    'YOUR_ORGANIZATION_UUID'::uuid,
    'whatsapp',
    'meta_cloud',
    'connected',
    'YOUR_WABA_ID',
    'YOUR_META_TEST_DISPLAY_PHONE_NUMBER',
    'Meta WhatsApp sandbox',
    now()
  )
  returning id
)
insert into public.meta_whatsapp_connections (
  channel_connection_id,
  meta_app_id,
  business_portfolio_id,
  waba_id,
  phone_number_id,
  webhook_subscription_status
)
select
  id,
  'YOUR_META_APP_ID',
  null,
  'YOUR_WABA_ID',
  'YOUR_META_PHONE_NUMBER_ID',
  'pending'
from new_connection
returning channel_connection_id, phone_number_id;
```

The `phone_number_id` has a database uniqueness constraint. If a mapping already exists, inspect and update that exact record deliberately instead of running the insert again. Never store credentials in either connection table.

## Configure the Meta webhook

In the Meta app's WhatsApp webhook configuration:

1. Set the callback URL to `https://YOUR_VERCEL_DOMAIN/api/webhooks/meta/whatsapp`.
2. Set **Verify token** to the private value stored in `META_WHATSAPP_VERIFY_TOKEN`.
3. Complete verification. The server returns `hub.challenge` only for `hub.mode=subscribe` and a correct token.
4. Subscribe the WhatsApp webhook field named exactly **`messages`**. That single field carries both message and delivery-status events.
5. After Meta shows the subscription as active, update the mapping's `webhook_subscription_status` from `pending` to `subscribed` for the saved channel connection ID.

The POST route rejects missing or invalid `x-hub-signature-256` signatures before parsing JSON. An unknown phone-number ID is acknowledged but cannot select an organization or write data.

## Test inbound messages

1. Confirm the Vercel deployment has all environment variables and the migration/mapping exist.
2. Confirm the Meta test recipient and test business number are configured in the Meta developer console.
3. From the allowed personal WhatsApp test recipient, send a plain text message to the Meta test business number.
4. In AIT, sign in to the organization used in the mapping and open Inbox. The new contact, conversation, and inbound message should appear after refresh.
5. Send the exact same signed webhook fixture only in an isolated automated test—not through production. The provider message ID uniqueness and atomic recorder prevent a second message/unread increment.

Inbound non-text/media events are intentionally ignored in this phase; no media is downloaded.

## Test an outbound service reply

First send an inbound message so the stored customer-service window is open. Sign in to AIT as an owner or manager of the mapped organization and find the conversation ID in the Inbox data or authenticated network response. In the signed-in browser's developer console, run:

```js
await fetch("/api/conversations/YOUR_CONVERSATION_ID/messages", {
  method: "POST",
  headers: { "Content-Type": "application/json" },
  body: JSON.stringify({ text: "Sandbox reply from AIT" }),
}).then(async (response) => ({ status: response.status, body: await response.json() }))
```

A successful request returns HTTP `201` with `status: "sent"` and stores Meta's provider message ID. The access token never reaches the browser.

Expected safe failures include:

- `401 unauthenticated` when there is no valid Supabase session.
- `403 forbidden` when the user is not an organization owner or manager.
- `404 not_found` when RLS does not expose that conversation to the user.
- `409 approved_template_required` when the stored 24-hour window is closed. Templates are not implemented in Phase 2A.
- `409 channel_unavailable` when the mapped channel is not connected.
- `502 provider_error` when Meta rejects the sandbox send.

## Rotate or replace the temporary Meta token

The temporary Meta token is short-lived:

1. Generate or obtain its replacement in the Meta developer console without posting it anywhere.
2. Replace only `META_WHATSAPP_ACCESS_TOKEN` in the relevant Vercel environment.
3. Redeploy so new server instances receive it.
4. Test one reply inside an open service window.
5. Remove the old token from any local secret store after confirming the replacement.

No database row or source file should change during token rotation. The adapter uses an environment credential resolver only for this one-number sandbox. A future production phase must replace it with per-connection secret storage.

## Before connecting a production number

Production still needs a reviewed credential vault/per-connection resolver, durable Meta system-user credentials and rotation, Meta business/app/number readiness, Embedded Signup or another approved onboarding flow, template support outside the service window, operational retry/reconciliation, webhook monitoring and alerting, rate-limit handling, media policy/processing, data-retention review, and end-to-end staging/security testing. This sandbox foundation must not be treated as production onboarding.
