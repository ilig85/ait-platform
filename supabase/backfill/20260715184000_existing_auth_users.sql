-- Manual, idempotent backfill for auth users created before Phase 1 migrations.
-- Review and run only after every migration has succeeded. This is intentionally
-- outside supabase/migrations and must not be applied by supabase db push.

begin;

-- Serialize manual runs so two SQL Editor sessions cannot create duplicate
-- default organizations for the same previously unassociated user.
select pg_advisory_xact_lock(
  hashtextextended('ait-existing-auth-users-backfill', 0)
);

create temporary table ait_backfill_created_organizations (
  user_id uuid primary key,
  organization_id uuid not null,
  membership_id uuid not null,
  organization_slug text not null
) on commit drop;

-- Existing profile values are never updated. Missing compatibility values are
-- populated only when an Auth user has no profile row at all.
insert into public.profiles (id, email, full_name, avatar_url)
select
  auth_user.id,
  auth_user.email,
  nullif(
    left(
      btrim(coalesce(auth_user.raw_user_meta_data ->> 'full_name', '')),
      200
    ),
    ''
  ),
  nullif(
    btrim(
      coalesce(
        auth_user.raw_user_meta_data ->> 'avatar_url',
        auth_user.raw_user_meta_data ->> 'picture',
        ''
      )
    ),
    ''
  )
from auth.users as auth_user
on conflict (id) do nothing;

-- Existing preferences are also left byte-for-byte unchanged.
insert into public.user_preferences (user_id)
select auth_user.id
from auth.users as auth_user
on conflict (user_id) do nothing;

do $$
declare
  auth_user record;
  new_organization_id uuid;
  new_membership_id uuid;
  organization_name text;
  organization_slug text;
begin
  for auth_user in
    select
      existing_user.id,
      nullif(
        left(
          btrim(coalesce(existing_user.raw_user_meta_data ->> 'full_name', '')),
          200
        ),
        ''
      ) as full_name
    from auth.users as existing_user
    where not exists (
      select 1
      from public.organization_members as membership
      where membership.user_id = existing_user.id
    )
    order by existing_user.created_at, existing_user.id
  loop
    organization_name := coalesce(
      left(auth_user.full_name || '''s Organization', 200),
      'My Organization'
    );
    organization_slug := public.ait_generate_unique_organization_slug(
      coalesce(auth_user.full_name, 'organization'),
      auth_user.id
    );

    insert into public.organizations (
      name,
      slug,
      plan,
      created_by
    ) values (
      organization_name,
      organization_slug,
      'free',
      auth_user.id
    )
    returning id into new_organization_id;

    insert into public.organization_members (
      organization_id,
      user_id,
      role
    ) values (
      new_organization_id,
      auth_user.id,
      'owner'
    )
    returning id into new_membership_id;

    insert into pg_temp.ait_backfill_created_organizations (
      user_id,
      organization_id,
      membership_id,
      organization_slug
    ) values (
      auth_user.id,
      new_organization_id,
      new_membership_id,
      organization_slug
    );
  end loop;
end;
$$;

-- The SQL Editor result lists only records created by this invocation. An empty
-- result on a repeat run is the expected idempotent outcome.
select
  user_id,
  organization_id,
  membership_id,
  organization_slug
from pg_temp.ait_backfill_created_organizations
order by user_id;

commit;
