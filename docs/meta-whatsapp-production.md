# Meta WhatsApp production onboarding

AIT uses Meta Cloud API directly. Meta's five-recipient screen belongs only to
the free test phone number. A production WhatsApp Business number can receive
messages from real customers without an allowlist and AIT creates contacts from
webhooks automatically.

Production is still governed by Meta's quality, messaging-tier, template,
opt-in, and 24-hour customer-service-window rules. There is no Meta monthly
subscription required for Cloud API itself; usage is billed by Meta and a
payment method is required for business-initiated messages.

## One-time AIT platform configuration

1. Complete Meta Business Verification and Access Verification for AIT.
2. In the AIT Meta app, request Advanced Access for
   `whatsapp_business_management` and `whatsapp_business_messaging`.
3. Create a Facebook Login for Business configuration for WhatsApp Embedded
   Signup. Use the standard Cloud API flow, not WhatsApp Business App
   Coexistence, for the first production release.
4. Add the stable production domain to the app's allowed domains and allowed
   JavaScript SDK domains.
5. Keep the existing callback URL:
   `https://tasko-modern-task-management-3e.vercel.app/api/webhooks/meta/whatsapp`.
6. Keep the `messages` webhook field subscribed.
7. Add the environment variables below to Vercel Production and Preview, then
   redeploy.

## Required Vercel environment variables

```dotenv
NEXT_PUBLIC_META_APP_ID=<public Meta app ID>
NEXT_PUBLIC_META_WHATSAPP_EMBEDDED_SIGNUP_CONFIG_ID=<public configuration ID>
META_GRAPH_API_VERSION=v25.0
META_WHATSAPP_APP_SECRET=<secret; never place in browser code>
META_WHATSAPP_VERIFY_TOKEN=<existing webhook verification secret>
META_CREDENTIAL_ENCRYPTION_KEY=<base64-encoded 32-byte random key>
```

Generate the encryption key locally with `openssl rand -base64 32`. Store it in
the password manager and Vercel; never paste it into chat, GitHub, screenshots,
or browser-side environment variables. The existing sandbox token and sandbox
IDs stay configured temporarily as a fallback until the test connection is
removed.

## Customer experience

1. An organization owner opens **Settings → Channel** in AIT.
2. They click **Connect WhatsApp Business**.
3. Meta asks them to sign in, select their business, select or create a WABA,
   and verify a dedicated business number.
4. AIT exchanges Meta's one-time code on the server, encrypts the business
   access token, registers the number, subscribes the WABA to AIT webhooks, and
   saves the organization-to-number mapping.
5. A customer sends a WhatsApp message to the production number. The webhook
   creates the contact, conversation, and message automatically. Nobody enters
   the customer as a recipient.

## Number rules

- Use a separate business number for the standard Cloud API flow. Do not move a
  personal/family WhatsApp number into this flow.
- WhatsApp Business App Coexistence is a separate Embedded Signup mode. It can
  preserve use of the mobile Business app for supported businesses, but must be
  implemented and tested as a separate onboarding path.
- Standard Cloud API does not provide a general API to import all pre-existing
  WhatsApp chat history. AIT's durable history starts when its webhook receives
  messages. Coexistence history sync is a later, explicitly consented feature.

## Before enabling AI

AIT stores inbound and outbound messages provider-neutrally. AI should run only
after the organization defines its policy and the contact's
`ai_analysis_allowed` value is true. Keep the human inbox, audit trail,
service-window enforcement, and escalation path active when AI replies are
added.
