-- Verify exact v0 row preservation after all 20260715 forward migrations.
-- Run before the manual existing-user backfill. On success, this disposable-only
-- test removes its legacy organization fixture so the backfill can be exercised.

begin;

do $verify$
declare
  snapshot ait_reconciliation_test.v0_snapshot%rowtype;
  actual_role_type text;
begin
  select *
  into strict snapshot
  from ait_reconciliation_test.v0_snapshot;

  if not exists (
    select 1
    from public.profiles as profile
    where profile.id = snapshot.user_id
      and profile.email is not distinct from snapshot.profile_email
      and profile.full_name is not distinct from snapshot.profile_full_name
      and profile.avatar_url is not distinct from snapshot.profile_avatar_url
      and profile.created_at = snapshot.profile_created_at
      and profile.updated_at = snapshot.profile_updated_at
  ) then
    raise exception 'V0 UPGRADE TEST FAILED: profile compatibility values changed';
  end if;

  if not exists (
    select 1
    from public.user_preferences as preference
    where preference.user_id = snapshot.user_id
      and preference.locale = snapshot.preference_locale
      and preference.theme = snapshot.preference_theme
      and preference.notifications_enabled = snapshot.preference_notifications_enabled
      and preference.created_at = snapshot.preference_created_at
      and preference.updated_at = snapshot.preference_updated_at
  ) then
    raise exception 'V0 UPGRADE TEST FAILED: preference values changed';
  end if;

  if not exists (
    select 1
    from public.organizations as organization
    where organization.id = snapshot.organization_id
      and organization.name = snapshot.organization_name
      and organization.slug = snapshot.organization_slug
      and organization.plan = snapshot.organization_plan
      and organization.created_at = snapshot.organization_created_at
      and organization.updated_at = snapshot.organization_updated_at
      and organization.created_by is null
      and organization.default_language = 'en'
      and organization.timezone = 'UTC'
  ) then
    raise exception 'V0 UPGRADE TEST FAILED: organization compatibility values or upgrade defaults are incorrect';
  end if;

  if not exists (
    select 1
    from public.organization_members as membership
    where membership.id = snapshot.membership_id
      and membership.organization_id = snapshot.organization_id
      and membership.user_id = snapshot.user_id
      and membership.joined_at = snapshot.membership_joined_at
      and membership.created_at = snapshot.membership_joined_at
      and membership.role::text = snapshot.membership_role
  ) then
    raise exception 'V0 UPGRADE TEST FAILED: membership values or created_at backfill are incorrect';
  end if;

  select data_type
  into actual_role_type
  from information_schema.columns
  where table_schema = 'public'
    and table_name = 'organization_members'
    and column_name = 'role';

  if actual_role_type <> 'USER-DEFINED' or to_regtype('public.organization_member_role') is null then
    raise exception 'V0 UPGRADE TEST FAILED: membership role was not converted to organization_member_role';
  end if;

  if exists (
    select 1
    from pg_catalog.pg_constraint
    where conrelid = 'public.organization_members'::regclass
      and conname = 'organization_members_role_check'
  ) then
    raise exception 'V0 UPGRADE TEST FAILED: legacy text role check still exists';
  end if;

  delete from public.organizations
  where id = snapshot.organization_id;

  set constraints organization_members_require_owner immediate;

  if exists (
    select 1
    from public.organization_members
    where user_id = snapshot.user_id
  ) then
    raise exception 'V0 UPGRADE TEST FAILED: disposable legacy fixture cleanup did not cascade';
  end if;
end;
$verify$;

drop schema ait_reconciliation_test cascade;

select
  'AIT V0 UPGRADE PRESERVATION TEST PASSED: profile, preferences, organization, membership, enum conversion, and compatibility columns were preserved.' as result;

commit;
