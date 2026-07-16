-- Prepare the audited-v0 upgrade-path fixture in a disposable Supabase project.
-- Run this only after the two 202607141825xx baseline migrations and after
-- creating ilgize7+ait-old-test@gmail.com through Supabase Auth. Do not run any
-- 20260715 forward migration first. This script intentionally commits its
-- snapshot so a later migration run can be checked against it.

begin;

do $guard$
declare
  old_user_id uuid;
begin
  select id
  into old_user_id
  from auth.users
  where email = 'ilgize7+ait-old-test@gmail.com';

  if old_user_id is null then
    raise exception using
      errcode = 'P0001',
      message = 'V0 FIXTURE STOPPED: missing Auth user ilgize7+ait-old-test@gmail.com';
  end if;

  if exists (
    select 1
    from auth.users
    where email is null
      or email <> 'ilgize7+ait-old-test@gmail.com'
  ) or (select count(*) from auth.users) <> 1 then
    raise exception using
      errcode = 'P0001',
      message = 'V0 FIXTURE STOPPED: the disposable database must contain only ilgize7+ait-old-test@gmail.com';
  end if;

  if to_regtype('public.organization_member_role') is not null
    or exists (
      select 1
      from information_schema.columns
      where table_schema = 'public'
        and table_name = 'organizations'
        and column_name = 'created_by'
    )
  then
    raise exception using
      errcode = 'P0001',
      message = 'V0 FIXTURE STOPPED: a forward migration has already been applied';
  end if;

  if not exists (select 1 from public.profiles where id = old_user_id)
    or not exists (
      select 1 from public.user_preferences where user_id = old_user_id
    )
  then
    raise exception using
      errcode = 'P0001',
      message = 'V0 FIXTURE STOPPED: the legacy Auth trigger did not create profile and preferences rows';
  end if;

  if exists (select 1 from public.organizations)
    or exists (select 1 from public.organization_members)
  then
    raise exception using
      errcode = 'P0001',
      message = 'V0 FIXTURE STOPPED: organizations and memberships must be empty before fixture preparation';
  end if;

  if exists (
    select 1
    from pg_catalog.pg_namespace
    where nspname = 'ait_reconciliation_test'
  ) then
    raise exception using
      errcode = 'P0001',
      message = 'V0 FIXTURE STOPPED: ait_reconciliation_test already exists';
  end if;
end;
$guard$;

create schema ait_reconciliation_test;
revoke all on schema ait_reconciliation_test from public, anon, authenticated;

create table ait_reconciliation_test.v0_snapshot (
  user_id uuid primary key,
  profile_email text,
  profile_full_name text,
  profile_avatar_url text,
  profile_created_at timestamptz not null,
  profile_updated_at timestamptz not null,
  preference_locale text not null,
  preference_theme text not null,
  preference_notifications_enabled boolean not null,
  preference_created_at timestamptz not null,
  preference_updated_at timestamptz not null,
  organization_id uuid not null,
  organization_name text not null,
  organization_slug text not null,
  organization_plan text not null,
  organization_created_at timestamptz not null,
  organization_updated_at timestamptz not null,
  membership_id uuid not null,
  membership_joined_at timestamptz not null,
  membership_role text not null
);

do $fixture$
declare
  old_user_id uuid;
  legacy_organization_id uuid := gen_random_uuid();
  legacy_membership_id uuid := gen_random_uuid();
  legacy_slug text;
begin
  select id
  into strict old_user_id
  from auth.users
  where email = 'ilgize7+ait-old-test@gmail.com';

  update public.profiles
  set
    full_name = 'AIT v0 preserved profile',
    avatar_url = 'https://example.invalid/ait-v0-preserved-avatar.png'
  where id = old_user_id;

  update public.user_preferences
  set
    locale = 'ky',
    theme = 'dark',
    notifications_enabled = false
  where user_id = old_user_id;

  legacy_slug := 'ait-v0-preserved-' ||
    left(replace(legacy_organization_id::text, '-', ''), 16);

  insert into public.organizations (
    id,
    name,
    slug,
    plan
  ) values (
    legacy_organization_id,
    'AIT v0 Preserved Organization',
    legacy_slug,
    'starter'
  );

  insert into public.organization_members (
    id,
    organization_id,
    user_id,
    role
  ) values (
    legacy_membership_id,
    legacy_organization_id,
    old_user_id,
    'owner'
  );

  insert into ait_reconciliation_test.v0_snapshot (
    user_id,
    profile_email,
    profile_full_name,
    profile_avatar_url,
    profile_created_at,
    profile_updated_at,
    preference_locale,
    preference_theme,
    preference_notifications_enabled,
    preference_created_at,
    preference_updated_at,
    organization_id,
    organization_name,
    organization_slug,
    organization_plan,
    organization_created_at,
    organization_updated_at,
    membership_id,
    membership_joined_at,
    membership_role
  )
  select
    profile.id,
    profile.email,
    profile.full_name,
    profile.avatar_url,
    profile.created_at,
    profile.updated_at,
    preference.locale,
    preference.theme,
    preference.notifications_enabled,
    preference.created_at,
    preference.updated_at,
    organization.id,
    organization.name,
    organization.slug,
    organization.plan,
    organization.created_at,
    organization.updated_at,
    membership.id,
    membership.joined_at,
    membership.role
  from public.profiles as profile
  join public.user_preferences as preference
    on preference.user_id = profile.id
  join public.organization_members as membership
    on membership.user_id = profile.id
  join public.organizations as organization
    on organization.id = membership.organization_id
  where profile.id = old_user_id;
end;
$fixture$;

select
  'AIT V0 UPGRADE FIXTURE PREPARED: snapshot committed for forward-upgrade verification.' as result;

commit;
