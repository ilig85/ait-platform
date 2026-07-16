# AIT MVP Phase 1 data foundation

This phase adds a provider-neutral Supabase schema. It does not connect Meta, send messages, replace frontend mock data, or change authentication UI behavior.

## Production v0 baseline

The first two repository migrations are an exact historical baseline reconstructed byte-for-byte from the production `supabase_migrations.schema_migrations.statements` inventory:

1. `20260714182532_001_tables_and_basic_rls.sql`
2. `20260714182546_002_org_rls_policies.sql`

Production already records both versions. A normal `supabase db push` therefore skips them and begins with the forward upgrade. A fresh disposable database executes the baseline first, reproducing the same v0 starting schema before it executes the forward migrations.

The baseline intentionally contains the original broad grants, recursive membership policies, legacy trigger, and v0 table shapes. Do not edit it to improve the old design: the forward migrations perform the reconciliation explicitly and audibly.

Never use `supabase migration repair` to adopt, skip, or rewrite these versions. Never use `supabase db reset` against production.

## Final migration order

Migrations run in this order:

1. `20260714182532_001_tables_and_basic_rls.sql` — exact v0 tables and basic policies
2. `20260714182546_002_org_rls_policies.sql` — exact v0 organization policies and Auth trigger
3. `20260715180000_core_profiles_organizations.sql` — in-place compatibility upgrade, role enum, grants reset, slug function, and Auth trigger replacement
4. `20260715181000_provider_neutral_messaging.sql` — channels, provider detail, contacts, conversations, and messages
5. `20260715182000_consent_templates.sql` — explicit consent and provider-neutral templates
6. `20260715183000_rls_provisioning.sql` — final non-recursive RLS policies, least-privilege grants, and final-owner enforcement

The manual backfill and every file under `supabase/tests` are outside `supabase/migrations`; `db push` cannot run them.

## Compatibility and preservation

The forward upgrade never drops, renames, recreates, or copies `profiles` or `user_preferences`. It preserves existing values in place:

| Table | Preserved compatibility fields | Added or changed safely |
| --- | --- | --- |
| `profiles` | `id`, `email`, `full_name`, `avatar_url`, `created_at`, `updated_at` | Adds and validates the 200-character full-name constraint. Existing values are not rewritten. |
| `user_preferences` | Entire table and every row/column/value | Keeps the v0 updated-at trigger and replaces browser policies/grants with owner-only select and mutable-column update access. |
| `organizations` | `id`, `name`, `slug`, `plan`, `created_at`, `updated_at` | Adds nullable `created_by`, `default_language = 'en'`, `timezone = 'UTC'`, and validates target name/slug/language/timezone constraints. `plan` continues to default to `free`. |
| `organization_members` | `id`, `organization_id`, `user_id`, `joined_at`, and the unique organization/user relationship | Adds `created_at` using the exact existing `joined_at`, converts validated text roles to `organization_member_role`, adds the profile FK, and adds the reverse user index. |

The first forward migration stops before changing anything if a post-audit profile, organization, or membership cannot satisfy the target constraints. In particular, every existing organization must have a valid lowercase URL slug and an owner before deployment. This makes drift visible instead of silently modifying production data.

Compatibility columns remain in fresh and upgraded schemas, so application code can migrate away from them deliberately later. The test fingerprint covers these columns; only intentionally different row data is excluded.

## Tables and tenant relationships

| Table | Purpose |
| --- | --- |
| `profiles` | One application profile for each `auth.users` row. |
| `user_preferences` | Locale, theme, and notification settings owned by one Auth user. |
| `organizations` | Business/workspace and top-level tenant boundary. |
| `organization_members` | Unique user-to-organization membership with `owner`, `manager`, or `member` role. |
| `channel_connections` | Generic connection record identified by `channel_type` and `provider`. |
| `meta_whatsapp_connections` | Meta-only app, portfolio, WABA, phone-number, and webhook subscription identifiers. It never stores an access token or App Secret. |
| `contacts` | Provider-neutral external contact scoped to an organization and connection. |
| `conversations` | Provider-neutral status, assignment, unread state, and customer-service-window timestamps. |
| `messages` | Provider-neutral inbound/outbound message history and delivery state. `media_metadata` is metadata only. |
| `customer_consents` | Explicit topic-scoped consent. No row and `unknown` both mean consent has not been granted. |
| `channel_message_templates` | Provider-neutral representation of templates and provider approval state. |

Composite foreign keys enforce organization consistency through the chain:

```text
organization
  └─ channel connection
       └─ contact
            └─ conversation
                 └─ message
```

A contact cannot reference another organization's connection, a conversation cannot reference another connection's contact, and a message cannot reference another conversation or connection. Provider message IDs are unique within a channel connection.

## Auth trigger transition and slug generation

The core forward migration removes `on_auth_user_created`, replaces it with `ait_provision_new_auth_user`, and drops the obsolete `handle_new_user()` function in one migration transaction. It then fails unless exactly one noninternal trigger remains on `auth.users`.

The final trigger atomically creates:

1. A profile containing sanitized full-name metadata plus Auth email and avatar metadata when present.
2. Default preferences.
3. A free-plan organization with a unique URL-safe slug.
4. An owner membership.

The slug is a normalized name prefix plus a stable UUID-derived suffix, is at most 63 characters, and is checked against existing organizations. A bounded deterministic retry handles a legacy collision. The unique constraint remains the final concurrency guard.

The provisioning and slug functions are security-definer functions with an empty fixed `search_path`. Direct execution is revoked from `PUBLIC`, `anon`, and `authenticated`; only the Auth trigger invokes provisioning. The three RLS membership helpers are the only security-definer functions intentionally executable by `authenticated`, because policies call them directly.

## Row Level Security and grants

The core forward migration explicitly drops all audited legacy policies on `profiles`, `organizations`, and `organization_members` before converting roles. The final policy migration drops and replaces all legacy preference policies. Broad v0 table grants are revoked before narrowly scoped browser grants are applied.

Final browser behavior is:

- Anonymous users cannot access any application table, including `user_preferences`.
- Members can read only organizations and tenant records covered by their memberships.
- Owners manage organization settings, memberships, and generic channel connections.
- Managers cannot create, delete, or change memberships and therefore cannot promote themselves.
- A deferred constraint prevents removal or demotion of the final owner.
- Managers and owners can enqueue only `pending` outbound messages whose sender is `manager` and whose provider ID/timestamp are null.
- Browser users cannot fabricate inbound messages, provider IDs, provider timestamps, delivery-state updates, Meta identifiers, or template approval state.
- A user can read and update only their own preference row; browser insertion/deletion and timestamp changes are not granted.
- Browser roles cannot hard-delete provider-neutral messaging, consent, or template records.

RLS is authorization, while composite foreign keys provide a second tenant-integrity boundary. Hiding UI controls is not part of the security model.

## Existing-user backfill

After every migration succeeds, review and manually run:

```text
supabase/backfill/20260715184000_existing_auth_users.sql
```

The backfill is not a migration and must never be moved into `supabase/migrations`. It:

- Takes a transaction-level advisory lock so concurrent manual runs cannot duplicate work.
- Inserts only missing profile rows; existing email, avatar, full name, and timestamps are never updated.
- Inserts only missing preference rows; existing preference values are never updated.
- Creates a default organization only for an Auth user with no membership.
- Generates a valid unique slug and explicitly keeps `plan = 'free'`.
- Creates the owner membership in the same transaction.
- Returns the user, organization, membership, and slug created by that invocation.
- Returns an empty result on a completed repeat run.

If any statement fails, the transaction rolls back all rows created by that invocation.

## Disposable clean-install test

Use only a disposable Supabase project. Do not run these test scripts against production.

1. Start with no Auth users and no application tables.
2. Apply all six migration files in timestamp order.
3. In Supabase Authentication, create exactly these users after all migrations finish:
   - `ilgize7+ait-old-test@gmail.com`
   - `ilgize7+ait-new-test@gmail.com`
4. Verify the new trigger created one profile, one preference row, one valid free-plan organization, and one owner membership for each user.
5. Run `supabase/backfill/20260715184000_existing_auth_users.sql` twice. Both runs should return no created organization because both users were provisioned after the upgrade.
6. Run `supabase/tests/reconciliation/20260715_verify_reconciled_schema.sql`. Success is:

   ```text
   AIT RECONCILED SCHEMA TEST PASSED: clean and v0-upgrade paths satisfy the same catalog and provisioning assertions.
   ```

   Save the returned `schema_fingerprint`.
7. Run `supabase/tests/20260715_rls_isolation_test.sql`. Exact success is:

   ```text
   AIT RLS ISOLATION TEST PASSED: all security assertions succeeded; all test records will be rolled back.
   ```

The common verifier is read-only and rolls back. The RLS test creates fixtures in a transaction and rolls them all back.

## Disposable v0-upgrade test

This path reproduces the audited production shape and also tests safe handling of organization/membership rows that appear after the audit.

1. Start with a separate disposable Supabase project with no Auth users and no application tables.
2. Apply only the two `202607141825xx` baseline migrations.
3. Create only `ilgize7+ait-old-test@gmail.com`. Confirm the legacy trigger creates its profile and preference rows.
4. Run `supabase/tests/reconciliation/20260715_prepare_v0_upgrade.sql`. It writes distinctive profile/preference values, creates one v0 organization and text-role owner membership, and commits a preservation snapshot. Success is:

   ```text
   AIT V0 UPGRADE FIXTURE PREPARED: snapshot committed for forward-upgrade verification.
   ```

5. Apply the four `20260715` forward migrations in timestamp order.
6. Run `supabase/tests/reconciliation/20260715_verify_v0_upgrade.sql`. It verifies exact profile, preference, organization, membership, timestamp, and enum preservation. It then deletes only the disposable legacy organization fixture so the old-user backfill can be exercised. Success is:

   ```text
   AIT V0 UPGRADE PRESERVATION TEST PASSED: profile, preferences, organization, membership, enum conversion, and compatibility columns were preserved.
   ```

7. Create `ilgize7+ait-new-test@gmail.com` after the forward migrations. Verify the new Auth trigger provisions all four records and a valid slug.
8. Run the manual backfill once. It should report exactly one organization/membership for the old test user. Run it again; the result must be empty.
9. Run `supabase/tests/reconciliation/20260715_verify_reconciled_schema.sql` and save its `schema_fingerprint`.
10. Compare that fingerprint to the clean-install fingerprint; they must match.
11. Run `supabase/tests/20260715_rls_isolation_test.sql` and confirm the exact success message above.

The preparation and preservation scripts have strict Auth-user guards. They never delete Auth users. The preservation verifier deletes only the disposable organization it created; never run it in production.

## Production deployment order

Production project reference: `olpwtxpkgvbxauobgjrb`.

1. Take a verified backup or confirm the required point-in-time recovery window. Record the restore point.
2. Pause signup and trusted writes for the deployment window so the audited schema cannot drift between checks and migration files.
3. Re-run the read-only production inventory. Stop if migration history is not exactly the two recorded v0 versions, if any `20260715` version is already recorded, if an unexpected Auth trigger/policy/function exists, or if new rows violate the core preflight rules.
4. Confirm every Auth user has a profile and preference, every existing membership has a matching profile, every existing organization has an owner, and every existing slug matches `^[a-z0-9]+(-[a-z0-9]+)*$` and is at most 63 characters.
5. From a reviewed clean checkout, authenticate and link the CLI to the intended project without storing credentials in Git.
6. Run `supabase db push --dry-run`. It must show only the four `20260715` forward migrations. The two baseline versions must be skipped as already recorded. The backfill and tests must not appear.
7. Run `supabase db push` once. Do not use migration repair and do not reset the database.
8. Verify the four new migration-history rows, the single `ait_provision_new_auth_user` trigger, the absence of legacy policies/function, the final policy/grant set, constraints, indexes, and provider-neutral tables.
9. Review and run the backfill separately in SQL Editor. Save its returned IDs and slug. For the currently audited production state, it should create one organization and owner membership while preserving the existing profile and preference rows.
10. Re-run the backfill. Its created-record result must be empty.
11. Perform read-only tenant, preference, and trigger verification. Do not run the disposable RLS or reconciliation test scripts in production.
12. Resume signup/writes only after the schema, backfill, and Auth trigger checks pass.

## Rollback boundaries

- Each migration file is a transaction boundary. A failed file rolls itself back, but migrations recorded before a later failure remain applied.
- If the first forward migration rejects drift, investigate the reported rows; do not mutate migration history.
- If a later migration fails after earlier forward versions are recorded, prefer a reviewed forward corrective migration. For a full rollback, restore to the recorded predeployment backup/PITR point.
- Never remove migration-history rows manually and never use migration repair as rollback.
- The backfill is one transaction. A failed invocation leaves no partial records.
- After a successful backfill, its result identifies created organization/membership IDs. If only that backfill must be reversed, delete only those recorded organizations after proving they have no messages, contacts, conversations, channels, consent, templates, or other members. The membership cascades. Do not delete or rewrite the preserved profile or preference row.

## Application compatibility-column dependencies

A static application-code search found no runtime Supabase queries or generated types depending on `profiles.email`, `profiles.avatar_url`, `organizations.slug`, `organizations.plan`, `organization_members.id`, `organization_members.joined_at`, or `user_preferences`. The signup page sends `full_name` as Auth metadata, and the header reads Auth user metadata/email directly. Current avatar references and customer/profile text are visual/mock content, not database wiring. No frontend behavior is changed by this reconciliation.
