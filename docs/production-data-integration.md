# Production data integration

The dashboard reads provider-neutral application data through the authenticated
Supabase SSR client. Every application-table query includes the selected
`organization_id` and remains subject to the existing RLS policies. No
service-role client is used.

## Workspace selection

Until a workspace switcher is implemented, AIT sorts the authenticated user's
`organization_members` rows by `organization_id` and selects the
lexicographically smallest organization UUID. This makes selection stable and
independent of database return order. The Settings page discloses when the user
has more than one membership.

An authenticated user with no membership sees a safe empty/error state and no
application-table data is requested for an arbitrary organization.

## Current read-only scope

- Overview: contact and conversation totals, seven-day activity, channels, and
  conversations marked `needs_human`.
- Customers: contacts and their stored conversation/message totals.
- Inbox: conversations and messages ordered by provider/database timestamps.
- Insights: schema-supported volume, response, resolution, and inbound-hour
  metrics only.
- Settings: organization details, provider-neutral channel status, and
  owner-visible Meta configuration presence.

Sending messages, changing settings, connecting providers, AI tasks, and
knowledge-base writes are deliberately outside this phase.
