-- Phase 1 forward upgrade from the audited v0 profiles/organization schema.
-- The v0 tables and compatibility columns are deliberately preserved in place.

-- Abort the first forward migration before changing any object if post-audit
-- rows cannot satisfy the target constraints. No legacy value is auto-repaired.
do $preflight$
declare
  actual_legacy_policies text[];
  expected_legacy_policies text[] := array[
    'organization_members.members_delete_owner',
    'organization_members.members_insert_owner_manager',
    'organization_members.members_select_same_org',
    'organization_members.members_update_owner_manager',
    'organizations.orgs_select_members',
    'organizations.orgs_update_owner_manager',
    'profiles.profiles_delete_own',
    'profiles.profiles_insert_own',
    'profiles.profiles_select_own',
    'profiles.profiles_update_own',
    'user_preferences.prefs_insert_own',
    'user_preferences.prefs_select_own',
    'user_preferences.prefs_update_own'
  ];
begin
  select array_agg(
    format('%s.%s', policy_record.tablename, policy_record.policyname)
    order by policy_record.tablename, policy_record.policyname
  )
  into actual_legacy_policies
  from pg_catalog.pg_policies as policy_record
  where policy_record.schemaname = 'public'
    and policy_record.tablename in (
      'profiles',
      'user_preferences',
      'organizations',
      'organization_members'
    );

  if actual_legacy_policies is distinct from expected_legacy_policies then
    raise exception using
      errcode = '55000',
      message = 'core upgrade stopped: legacy policy inventory differs from the audited v0 baseline';
  end if;

  if (
    select count(*)
    from pg_catalog.pg_trigger
    where tgrelid = 'auth.users'::regclass
      and not tgisinternal
  ) <> 1 or not exists (
    select 1
    from pg_catalog.pg_trigger as trigger_record
    join pg_catalog.pg_proc as function_record
      on function_record.oid = trigger_record.tgfoid
    join pg_catalog.pg_namespace as schema_record
      on schema_record.oid = function_record.pronamespace
    where trigger_record.tgrelid = 'auth.users'::regclass
      and not trigger_record.tgisinternal
      and trigger_record.tgname = 'on_auth_user_created'
      and schema_record.nspname = 'public'
      and function_record.proname = 'handle_new_user'
  ) then
    raise exception using
      errcode = '55000',
      message = 'core upgrade stopped: Auth trigger inventory differs from the audited v0 baseline';
  end if;

  if exists (
    select 1
    from public.profiles
    where full_name is not null
      and char_length(full_name) > 200
  ) then
    raise exception using
      errcode = '23514',
      message = 'core upgrade stopped: profiles.full_name contains a value longer than 200 characters';
  end if;

  if exists (
    select 1
    from public.organizations
    where btrim(name) = ''
      or char_length(name) > 200
      or btrim(slug) = ''
      or char_length(slug) > 63
      or slug !~ '^[a-z0-9]+(-[a-z0-9]+)*$'
  ) then
    raise exception using
      errcode = '23514',
      message = 'core upgrade stopped: an existing organization has an invalid target name or slug';
  end if;

  if exists (
    select 1
    from public.organization_members as membership
    where not exists (
      select 1
      from public.profiles as profile
      where profile.id = membership.user_id
    )
  ) then
    raise exception using
      errcode = '23503',
      message = 'core upgrade stopped: an organization membership has no matching profile';
  end if;

  if exists (
    select 1
    from public.organizations as organization
    where not exists (
      select 1
      from public.organization_members as membership
      where membership.organization_id = organization.id
        and membership.role = 'owner'
    )
  ) then
    raise exception using
      errcode = '23514',
      message = 'core upgrade stopped: an existing organization has no owner';
  end if;
end;
$preflight$;

create type public.organization_member_role as enum (
  'owner',
  'manager',
  'member'
);

-- Keep the v0 trigger function because user_preferences depends on it, but
-- harden it and remove direct browser execution.
create or replace function public.set_updated_at()
returns trigger
language plpgsql
set search_path = ''
as $$
begin
  new.updated_at = statement_timestamp();
  return new;
end;
$$;

revoke all on function public.set_updated_at()
  from public, anon, authenticated;

create or replace function public.ait_set_updated_at()
returns trigger
language plpgsql
set search_path = ''
as $$
begin
  new.updated_at = statement_timestamp();
  return new;
end;
$$;

revoke all on function public.ait_set_updated_at()
  from public, anon, authenticated;

-- Remove every audited permissive v0 policy before changing the membership
-- role type. The final least-privilege policies are installed later.
drop policy if exists profiles_select_own on public.profiles;
drop policy if exists profiles_insert_own on public.profiles;
drop policy if exists profiles_update_own on public.profiles;
drop policy if exists profiles_delete_own on public.profiles;

drop policy if exists orgs_select_members on public.organizations;
drop policy if exists orgs_update_owner_manager on public.organizations;

drop policy if exists members_select_same_org on public.organization_members;
drop policy if exists members_insert_owner_manager on public.organization_members;
drop policy if exists members_update_owner_manager on public.organization_members;
drop policy if exists members_delete_owner on public.organization_members;

-- Preserve the v0 profile columns and rows; add only the target validation.
alter table public.profiles
  add constraint profiles_full_name_length
    check (full_name is null or char_length(full_name) <= 200)
    not valid;

alter table public.profiles
  validate constraint profiles_full_name_length;

-- Preserve id, name, slug, plan, and timestamps while adding target fields.
alter table public.organizations
  add column created_by uuid,
  add column default_language text not null default 'en',
  add column timezone text not null default 'UTC';

alter table public.organizations
  add constraint organizations_created_by_fkey
    foreign key (created_by)
    references auth.users (id)
    on delete set null
    not valid,
  add constraint organizations_name_not_blank
    check (btrim(name) <> '')
    not valid,
  add constraint organizations_name_length
    check (char_length(name) <= 200)
    not valid,
  add constraint organizations_slug_not_blank
    check (btrim(slug) <> '')
    not valid,
  add constraint organizations_slug_length
    check (char_length(slug) <= 63)
    not valid,
  add constraint organizations_slug_format
    check (slug ~ '^[a-z0-9]+(-[a-z0-9]+)*$')
    not valid,
  add constraint organizations_default_language_format
    check (default_language ~ '^[a-z]{2,3}([_-][A-Za-z0-9]{2,8})*$')
    not valid,
  add constraint organizations_timezone_not_blank
    check (btrim(timezone) <> '')
    not valid,
  add constraint organizations_timezone_length
    check (char_length(timezone) <= 100)
    not valid;

alter table public.organizations
  validate constraint organizations_created_by_fkey;
alter table public.organizations
  validate constraint organizations_name_not_blank;
alter table public.organizations
  validate constraint organizations_name_length;
alter table public.organizations
  validate constraint organizations_slug_not_blank;
alter table public.organizations
  validate constraint organizations_slug_length;
alter table public.organizations
  validate constraint organizations_slug_format;
alter table public.organizations
  validate constraint organizations_default_language_format;
alter table public.organizations
  validate constraint organizations_timezone_not_blank;
alter table public.organizations
  validate constraint organizations_timezone_length;

-- Preserve the surrogate id, joined_at, and unique tenant/user relationship.
-- Existing joined_at values seed the new created_at column exactly.
alter table public.organization_members
  add column created_at timestamptz;

update public.organization_members
set created_at = joined_at
where created_at is null;

alter table public.organization_members
  alter column created_at set default now(),
  alter column created_at set not null;

alter table public.organization_members
  alter column role drop default;

alter table public.organization_members
  drop constraint organization_members_role_check;

alter table public.organization_members
  alter column role type public.organization_member_role
    using role::public.organization_member_role,
  alter column role set default 'member'::public.organization_member_role;

-- Retain the original auth.users FK and add the application-profile FK needed
-- by the provider-neutral organization graph.
alter table public.organization_members
  add constraint organization_members_user_id_profile_fkey
    foreign key (user_id)
    references public.profiles (id)
    on delete cascade
    not valid;

alter table public.organization_members
  validate constraint organization_members_user_id_profile_fkey;

create index organization_members_user_id_idx
  on public.organization_members (user_id, organization_id);

-- Deliberately replace the two v0 updated-at triggers. The existing
-- user_preferences_updated_at trigger remains the sole preferences trigger.
drop trigger if exists profiles_updated_at on public.profiles;
drop trigger if exists profiles_set_updated_at on public.profiles;
create trigger profiles_set_updated_at
before update on public.profiles
for each row execute function public.ait_set_updated_at();

drop trigger if exists organizations_updated_at on public.organizations;
drop trigger if exists organizations_set_updated_at on public.organizations;
create trigger organizations_set_updated_at
before update on public.organizations
for each row execute function public.ait_set_updated_at();

alter table public.profiles enable row level security;
alter table public.organizations enable row level security;
alter table public.organization_members enable row level security;
alter table public.user_preferences enable row level security;

-- Remove the v0 default browser grants before any replacement grants are made.
revoke all on table public.profiles from anon, authenticated;
revoke all on table public.organizations from anon, authenticated;
revoke all on table public.organization_members from anon, authenticated;
revoke all on table public.user_preferences from anon, authenticated;

-- Generate a URL-safe slug with a stable UUID-derived suffix. Different users
-- cannot race to the same first candidate; the bounded retry handles a legacy
-- row that already uses that exact value.
create or replace function public.ait_generate_unique_organization_slug(
  preferred_base text,
  stable_seed uuid
)
returns text
language plpgsql
volatile
security definer
set search_path = ''
as $$
declare
  normalized_base text;
  candidate_prefix text;
  candidate_suffix text;
  candidate text;
  attempt integer := 0;
begin
  if stable_seed is null then
    raise exception using
      errcode = '22004',
      message = 'organization slug seed cannot be null';
  end if;

  normalized_base := lower(
    regexp_replace(coalesce(preferred_base, ''), '[^a-zA-Z0-9]+', '-', 'g')
  );
  normalized_base := btrim(normalized_base, '-');

  if normalized_base = '' then
    normalized_base := 'organization';
  end if;

  loop
    candidate_suffix := case
      when attempt = 0 then left(replace(stable_seed::text, '-', ''), 16)
      else left(md5(stable_seed::text || ':' || attempt::text), 16)
    end;
    candidate_prefix := rtrim(left(normalized_base, 46), '-');

    if candidate_prefix = '' then
      candidate_prefix := 'organization';
    end if;

    candidate := candidate_prefix || '-' || candidate_suffix;

    if not exists (
      select 1
      from public.organizations as organization
      where organization.slug = candidate
    ) then
      return candidate;
    end if;

    attempt := attempt + 1;

    if attempt >= 1000 then
      raise exception using
        errcode = '23505',
        message = 'could not generate a unique organization slug';
    end if;
  end loop;
end;
$$;

revoke all on function public.ait_generate_unique_organization_slug(text, uuid)
  from public, anon, authenticated;

-- Replace the audited v0 Auth trigger in the same migration transaction.
-- Future users receive all compatibility and provider-neutral owner records.
create or replace function public.ait_provision_new_auth_user()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
declare
  new_organization_id uuid;
  profile_full_name text;
  profile_avatar_url text;
  organization_name text;
  organization_slug text;
begin
  profile_full_name := nullif(
    left(btrim(coalesce(new.raw_user_meta_data ->> 'full_name', '')), 200),
    ''
  );
  profile_avatar_url := nullif(
    btrim(
      coalesce(
        new.raw_user_meta_data ->> 'avatar_url',
        new.raw_user_meta_data ->> 'picture',
        ''
      )
    ),
    ''
  );
  organization_name := coalesce(
    left(profile_full_name || '''s Organization', 200),
    'My Organization'
  );
  organization_slug := public.ait_generate_unique_organization_slug(
    coalesce(profile_full_name, 'organization'),
    new.id
  );

  insert into public.profiles (id, email, full_name, avatar_url)
  values (new.id, new.email, profile_full_name, profile_avatar_url);

  insert into public.user_preferences (user_id)
  values (new.id);

  insert into public.organizations (
    name,
    slug,
    plan,
    created_by
  ) values (
    organization_name,
    organization_slug,
    'free',
    new.id
  )
  returning id into new_organization_id;

  insert into public.organization_members (
    organization_id,
    user_id,
    role
  ) values (
    new_organization_id,
    new.id,
    'owner'
  );

  return new;
end;
$$;

revoke all on function public.ait_provision_new_auth_user()
  from public, anon, authenticated;

drop trigger if exists on_auth_user_created on auth.users;
drop trigger if exists ait_provision_new_auth_user on auth.users;

create trigger ait_provision_new_auth_user
after insert on auth.users
for each row execute function public.ait_provision_new_auth_user();

drop function public.handle_new_user();

do $$
declare
  application_trigger_count integer;
begin
  select count(*)
  into application_trigger_count
  from pg_catalog.pg_trigger as trigger_record
  where trigger_record.tgrelid = 'auth.users'::regclass
    and not trigger_record.tgisinternal;

  if application_trigger_count <> 1 then
    raise exception using
      errcode = '55000',
      message = format(
        'expected exactly one noninternal trigger on auth.users after reconciliation; found %s',
        application_trigger_count
      );
  end if;
end;
$$;

comment on table public.profiles is
  'Application profile keyed one-to-one to auth.users. v0 email and avatar compatibility fields are preserved.';
comment on table public.organizations is
  'Provider-neutral business workspace and tenant boundary. v0 slug and plan compatibility fields are preserved.';
comment on table public.organization_members is
  'User membership and role within an organization. v0 id and joined_at compatibility fields are preserved.';
comment on function public.ait_generate_unique_organization_slug(text, uuid) is
  'Returns a unique URL-safe organization slug with a stable UUID-derived suffix.';
comment on function public.ait_provision_new_auth_user() is
  'Atomically creates a profile, preferences, default organization, and owner membership for a new auth user.';
