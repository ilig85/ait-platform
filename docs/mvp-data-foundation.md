# AIT MVP Phase 1 data foundation

This phase adds a provider-neutral Supabase schema. It does not connect Meta, send messages, replace frontend mock data, or apply anything to a remote project.

## Tables and relationships

| Table | Purpose |
| --- | --- |
| `profiles` | One application profile for each `auth.users` row. |
| `organizations` | Business/workspace and top-level tenant boundary. |
| `organization_members` | Unique user-to-organization membership with `owner`, `manager`, or `member` role. |
| `channel_connections` | Generic connection record identified by `channel_type` and `provider`. |
| `meta_whatsapp_connections` | Meta-only app, portfolio, WABA, phone-number, and webhook subscription identifiers for a generic connection. It never stores an access token or App Secret. |
| `contacts` | Provider-neutral external contact scoped to an organization and connection. |
| `conversations` | Provider-neutral status, assignment, unread state, and customer-service-window timestamps. |
| `messages` | Provider-neutral inbound/outbound message history and delivery state. `media_metadata` is reserved for metadata only; no media bytes are stored. |
| `customer_consents` | Explicit topic-scoped consent. No row and `unknown` both mean consent has not been granted. |
| `channel_message_templates` | Provider-neutral representation of templates and their provider approval state. |

Composite foreign keys enforce organization consistency through the chain:

```text
organization
  └─ channel connection
       └─ contact
            └─ conversation
                 └─ message
```

A contact cannot reference another organization's connection, a conversation cannot reference another connection's contact, and a message cannot reference another conversation or connection. Provider message IDs are unique within a channel connection, preventing duplicate webhook delivery from creating duplicate messages.

## Provider-neutral design

`channel_connections`, `contacts`, `conversations`, `messages`, consent, and templates contain no Meta-only foreign keys. The first connection will use:

```text
channel_type = whatsapp
provider = meta_cloud
```

The Meta identifiers live only in `meta_whatsapp_connections`. In Phase 2, trusted server code will create the generic connection and its Meta-specific row after Meta authorization succeeds. Access tokens and App Secrets must remain in a server-side secret store and must never be placed in a public table or a `NEXT_PUBLIC_` variable.

A future personal WhatsApp provider can add a value such as `personal_whatsapp_provider` to `channel_connections.provider` and a separate provider-specific detail table. It can reuse the existing contact, conversation, message, Inbox, Customers, Insights, consent, and template model unchanged.

The `last_customer_message_at` and `service_window_expires_at` fields are generic service-window data. Phase 2 can enforce Meta Cloud API's 24-hour window without embedding Meta semantics into the conversation table.

## Row Level Security

RLS is enabled on every application table immediately when it is created. Until the final policy migration runs, authenticated and anonymous roles have no application-table grants.

Final browser behavior is:

- Anonymous users cannot read any application table.
- Members can read data only for organizations where they have a membership.
- Owners manage organization settings, memberships, and generic channel connections.
- Managers and owners manage tenant-scoped contacts, conversations, and explicit consent.
- Members cannot create or promote memberships; membership mutation is owner-only.
- A deferred constraint prevents removal or demotion of the last organization owner.
- Managers and owners can enqueue only `pending` outbound messages whose sender is `manager`. Browser clients cannot fabricate inbound messages, provider IDs, timestamps, or delivery updates.
- Meta identifiers and template approval state are readable under the documented policies but writable only by a trusted backend role.
- Browser roles cannot hard-delete channels, contacts, conversations, messages, consent, or templates. Connections use `disabled`/`disconnected` and conversations use `archived`; any later retention or erasure workflow belongs in trusted backend code.
- Security-definer membership helpers always derive the caller from `auth.uid()`, have an empty fixed `search_path`, and are not executable by anonymous users. This avoids recursive membership policies without accepting a caller-supplied user ID.

RLS is authorization, while composite foreign keys provide a second tenant-integrity boundary. Hiding buttons in the frontend is not part of the security model.

## New-user provisioning

The `ait_provision_new_auth_user` trigger runs after a new `auth.users` insert. Its fixed-search-path security-definer function atomically creates:

1. A `profiles` row, using sanitized `full_name` metadata when present.
2. A default organization.
3. An `owner` membership for the new user.

All three inserts run in the same database transaction as the trigger. A failure rolls back the provisioning work rather than leaving a partial workspace. The function does not update Supabase-managed auth fields or handle passwords.

## Existing-user backfill

Existing Auth users are intentionally not modified by a migration. After all migrations succeed, review and manually run:

```text
supabase/backfill/20260715184000_existing_auth_users.sql
```

The script is transactional and idempotent:

- Missing profiles are inserted with `on conflict do nothing`.
- A default organization is created only for a user who has no organization membership.
- Each newly created organization receives that user as owner.
- Re-running the completed script does not create another organization for an already-associated user.

Do not put this backfill file in the migrations directory and do not run it before the schema and provisioning trigger have been reviewed.

## Running the SQL Editor RLS security test

Run `supabase/tests/20260715_rls_isolation_test.sql` only in the disposable Supabase project after all four migrations and the existing-user backfill have succeeded. The project must contain exactly these two Auth users and no others:

```text
ilgize7+ait-old-test@gmail.com
ilgize7+ait-new-test@gmail.com
```

Open the disposable project's Dashboard SQL Editor, paste the complete test file, and run it as one script. No user password, API key, service-role key, or database credential is needed. The script stops before creating fixtures if either required user is missing, if any non-test Auth user exists, or if the users already share an organization.

The test creates isolated tenant fixtures inside a transaction, impersonates the `anon` and `authenticated` PostgreSQL roles with transaction-local JWT claims, and raises an error at the first failed security assertion. Success is exactly:

```text
AIT RLS ISOLATION TEST PASSED: all security assertions succeeded; all test records will be rolled back.
```

The final statement is `rollback`, so organizations, memberships, channels, contacts, conversations, messages, consent, and templates created by the test do not persist. The script never updates or deletes either Auth user. Do not weaken or remove the Auth-user safety guard, and never run this test against production.

## Applying later

Nothing in this phase has been applied remotely. Before applying:

1. Review the SQL against a disposable/local Supabase environment and back up the target project.
2. Authenticate the Supabase CLI and link the intended project using its project reference. This requires project access; do not put CLI access tokens in the repository.
3. Preview the ordered migrations with `supabase db push --dry-run` where supported.
4. Apply the files in `supabase/migrations` using `supabase db push`, or run them in timestamp order through the Supabase SQL Editor.
5. Verify the Auth trigger, RLS policies, grants, indexes, and table constraints in the Dashboard.
6. Test with at least two organizations and separate non-service-role users to confirm cross-organization reads and writes fail.
7. Review and run the existing-user backfill separately, then verify every existing user has a profile and at least one membership.

Dashboard or linked-project access is required to apply migrations, inspect the real `auth.users` population, run the backfill, test real JWT/RLS behavior, and later configure Meta secrets. Generated Supabase TypeScript database types should be produced only after these migrations are applied to the intended linked project.
