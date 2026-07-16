-- Common post-migration verification for both clean-install and v0-upgrade
-- disposable projects. Run after the backfill has been executed twice and
-- before the transaction-rollback RLS isolation test.

begin;

do $verify$
declare
  application_tables text[] := array[
    'channel_connections',
    'channel_message_templates',
    'contacts',
    'conversations',
    'customer_consents',
    'messages',
    'meta_whatsapp_connections',
    'organization_members',
    'organizations',
    'profiles',
    'user_preferences'
  ];
  expected_policies text[] := array[
    'channel_connections.channel_connections_insert_owner',
    'channel_connections.channel_connections_select_member',
    'channel_connections.channel_connections_update_owner',
    'channel_message_templates.channel_message_templates_select_member',
    'contacts.contacts_insert_manager',
    'contacts.contacts_select_member',
    'contacts.contacts_update_manager',
    'conversations.conversations_insert_manager',
    'conversations.conversations_select_member',
    'conversations.conversations_update_manager',
    'customer_consents.customer_consents_insert_manager',
    'customer_consents.customer_consents_select_member',
    'customer_consents.customer_consents_update_manager',
    'messages.messages_insert_pending_manager_outbound',
    'messages.messages_select_member',
    'meta_whatsapp_connections.meta_whatsapp_connections_select_owner',
    'organization_members.organization_members_delete_owner',
    'organization_members.organization_members_insert_owner',
    'organization_members.organization_members_select_member',
    'organization_members.organization_members_update_owner',
    'organizations.organizations_select_member',
    'organizations.organizations_update_owner',
    'profiles.profiles_select_same_organization',
    'profiles.profiles_update_self',
    'user_preferences.user_preferences_select_self',
    'user_preferences.user_preferences_update_self'
  ];
  expected_updated_at_triggers text[] := array[
    'channel_connections.channel_connections_set_updated_at.ait_set_updated_at',
    'channel_message_templates.channel_message_templates_set_updated_at.ait_set_updated_at',
    'contacts.contacts_set_updated_at.ait_set_updated_at',
    'conversations.conversations_set_updated_at.ait_set_updated_at',
    'customer_consents.customer_consents_set_updated_at.ait_set_updated_at',
    'messages.messages_set_updated_at.ait_set_updated_at',
    'meta_whatsapp_connections.meta_whatsapp_connections_set_updated_at.ait_set_updated_at',
    'organizations.organizations_set_updated_at.ait_set_updated_at',
    'profiles.profiles_set_updated_at.ait_set_updated_at',
    'user_preferences.user_preferences_updated_at.set_updated_at'
  ];
  actual_policies text[];
  actual_updated_at_triggers text[];
  table_name text;
  privilege_name text;
  test_user record;
  noninternal_auth_trigger_count integer;
begin
  if exists (
    select 1
    from auth.users
    where email is null
      or email not in (
        'ilgize7+ait-old-test@gmail.com',
        'ilgize7+ait-new-test@gmail.com'
      )
  ) or (select count(*) from auth.users) <> 2 then
    raise exception using
      errcode = 'P0001',
      message = 'RECONCILIATION TEST STOPPED: database must contain exactly the two approved Auth test users';
  end if;

  if (select count(*) from public.profiles) <> 2
    or (select count(*) from public.user_preferences) <> 2
    or (select count(*) from public.organizations) <> 2
    or (select count(*) from public.organization_members) <> 2
  then
    raise exception 'RECONCILIATION TEST FAILED: provisioning/backfill is missing records or is not idempotent';
  end if;

  for test_user in
    select id, email
    from auth.users
    order by email
  loop
    if not exists (
      select 1
      from public.profiles as profile
      where profile.id = test_user.id
        and profile.email is not distinct from test_user.email
    ) then
      raise exception 'RECONCILIATION TEST FAILED: profile email was not preserved for %', test_user.email;
    end if;

    if not exists (
      select 1
      from public.user_preferences
      where user_id = test_user.id
    ) then
      raise exception 'RECONCILIATION TEST FAILED: preferences missing for %', test_user.email;
    end if;

    if (
      select count(*)
      from public.organization_members
      where user_id = test_user.id
        and role = 'owner'
    ) <> 1 then
      raise exception 'RECONCILIATION TEST FAILED: expected one owner membership for %', test_user.email;
    end if;

    if not exists (
      select 1
      from public.organization_members as membership
      join public.organizations as organization
        on organization.id = membership.organization_id
      where membership.user_id = test_user.id
        and membership.role = 'owner'
        and organization.created_by = test_user.id
        and organization.plan = 'free'
        and organization.slug ~ '^[a-z0-9]+(-[a-z0-9]+)*$'
        and char_length(organization.slug) <= 63
    ) then
      raise exception 'RECONCILIATION TEST FAILED: valid free-plan organization missing for %', test_user.email;
    end if;
  end loop;

  if (select count(distinct slug) from public.organizations) <> 2 then
    raise exception 'RECONCILIATION TEST FAILED: generated organization slugs are not unique';
  end if;

  if exists (
    select 1
    from public.organization_members as membership_a
    join public.organization_members as membership_b
      on membership_b.organization_id = membership_a.organization_id
    join auth.users as user_a on user_a.id = membership_a.user_id
    join auth.users as user_b on user_b.id = membership_b.user_id
    where user_a.email = 'ilgize7+ait-old-test@gmail.com'
      and user_b.email = 'ilgize7+ait-new-test@gmail.com'
  ) then
    raise exception 'RECONCILIATION TEST FAILED: test users unexpectedly share an organization';
  end if;

  if not exists (
    select 1
    from information_schema.columns
    where table_schema = 'public'
      and table_name = 'profiles'
      and column_name = 'email'
      and data_type = 'text'
  ) or not exists (
    select 1
    from information_schema.columns
    where table_schema = 'public'
      and table_name = 'profiles'
      and column_name = 'avatar_url'
      and data_type = 'text'
  ) or not exists (
    select 1
    from information_schema.columns
    where table_schema = 'public'
      and table_name = 'organizations'
      and column_name = 'slug'
      and is_nullable = 'NO'
  ) or not exists (
    select 1
    from information_schema.columns
    where table_schema = 'public'
      and table_name = 'organizations'
      and column_name = 'plan'
      and is_nullable = 'NO'
  ) or not exists (
    select 1
    from information_schema.columns
    where table_schema = 'public'
      and table_name = 'organization_members'
      and column_name = 'id'
      and data_type = 'uuid'
  ) or not exists (
    select 1
    from information_schema.columns
    where table_schema = 'public'
      and table_name = 'organization_members'
      and column_name = 'joined_at'
      and is_nullable = 'NO'
  ) or not exists (
    select 1
    from information_schema.columns
    where table_schema = 'public'
      and table_name = 'organization_members'
      and column_name = 'created_at'
      and is_nullable = 'NO'
  ) then
    raise exception 'RECONCILIATION TEST FAILED: a required compatibility column is missing or changed';
  end if;

  if not exists (
    select 1
    from information_schema.columns
    where table_schema = 'public'
      and table_name = 'organization_members'
      and column_name = 'role'
      and data_type = 'USER-DEFINED'
      and udt_schema = 'public'
      and udt_name = 'organization_member_role'
  ) then
    raise exception 'RECONCILIATION TEST FAILED: membership role is not the target enum';
  end if;

  if exists (
    select expected_constraint.name
    from unnest(array[
      'profiles_full_name_length',
      'organizations_created_by_fkey',
      'organizations_slug_key',
      'organizations_plan_check',
      'organization_members_organization_id_user_id_key',
      'organization_members_user_id_fkey',
      'organization_members_user_id_profile_fkey'
    ]) as expected_constraint(name)
    where not exists (
      select 1
      from pg_catalog.pg_constraint as constraint_record
      where constraint_record.conname = expected_constraint.name
        and constraint_record.convalidated
    )
  ) then
    raise exception 'RECONCILIATION TEST FAILED: a required validated constraint is missing';
  end if;

  if not exists (
    select 1
    from pg_catalog.pg_indexes
    where schemaname = 'public'
      and tablename = 'organization_members'
      and indexname = 'organization_members_user_id_idx'
  ) then
    raise exception 'RECONCILIATION TEST FAILED: reverse membership index is missing';
  end if;

  if exists (
    select 1
    from pg_catalog.pg_trigger as trigger_record
    join pg_catalog.pg_class as table_record
      on table_record.oid = trigger_record.tgrelid
    join pg_catalog.pg_namespace as schema_record
      on schema_record.oid = table_record.relnamespace
    where schema_record.nspname = 'public'
      and table_record.relname in ('profiles', 'organizations', 'user_preferences')
      and not trigger_record.tgisinternal
      and trigger_record.tgname not in (
        'profiles_set_updated_at',
        'organizations_set_updated_at',
        'user_preferences_updated_at'
      )
  ) then
    raise exception 'RECONCILIATION TEST FAILED: unexpected legacy core-table trigger remains';
  end if;

  if (select count(*) from pg_catalog.pg_trigger where tgrelid = 'public.profiles'::regclass and not tgisinternal) <> 1
    or (select count(*) from pg_catalog.pg_trigger where tgrelid = 'public.organizations'::regclass and not tgisinternal) <> 1
    or (select count(*) from pg_catalog.pg_trigger where tgrelid = 'public.user_preferences'::regclass and not tgisinternal) <> 1
  then
    raise exception 'RECONCILIATION TEST FAILED: applicable core tables do not have exactly one updated-at trigger';
  end if;

  select array_agg(
    format(
      '%s.%s.%s',
      table_record.relname,
      trigger_record.tgname,
      function_record.proname
    )
    order by table_record.relname, trigger_record.tgname
  )
  into actual_updated_at_triggers
  from pg_catalog.pg_trigger as trigger_record
  join pg_catalog.pg_class as table_record
    on table_record.oid = trigger_record.tgrelid
  join pg_catalog.pg_namespace as schema_record
    on schema_record.oid = table_record.relnamespace
  join pg_catalog.pg_proc as function_record
    on function_record.oid = trigger_record.tgfoid
  where schema_record.nspname = 'public'
    and table_record.relname = any(application_tables)
    and not trigger_record.tgisinternal
    and trigger_record.tgname like '%updated_at%';

  if actual_updated_at_triggers is distinct from expected_updated_at_triggers then
    raise exception 'RECONCILIATION TEST FAILED: updated-at trigger inventory is not exact';
  end if;

  select count(*)
  into noninternal_auth_trigger_count
  from pg_catalog.pg_trigger
  where tgrelid = 'auth.users'::regclass
    and not tgisinternal;

  if noninternal_auth_trigger_count <> 1
    or not exists (
      select 1
      from pg_catalog.pg_trigger as trigger_record
      join pg_catalog.pg_proc as function_record
        on function_record.oid = trigger_record.tgfoid
      join pg_catalog.pg_namespace as schema_record
        on schema_record.oid = function_record.pronamespace
      where trigger_record.tgrelid = 'auth.users'::regclass
        and not trigger_record.tgisinternal
        and trigger_record.tgname = 'ait_provision_new_auth_user'
        and schema_record.nspname = 'public'
        and function_record.proname = 'ait_provision_new_auth_user'
    )
  then
    raise exception 'RECONCILIATION TEST FAILED: Auth provisioning trigger transition is incorrect';
  end if;

  if to_regprocedure('public.handle_new_user()') is not null then
    raise exception 'RECONCILIATION TEST FAILED: legacy handle_new_user function remains';
  end if;

  select array_agg(
    format('%s.%s', policy_record.tablename, policy_record.policyname)
    order by policy_record.tablename, policy_record.policyname
  )
  into actual_policies
  from pg_catalog.pg_policies as policy_record
  where policy_record.schemaname = 'public'
    and policy_record.tablename = any(application_tables);

  if actual_policies is distinct from expected_policies then
    raise exception 'RECONCILIATION TEST FAILED: final policy set does not exactly replace the legacy policies';
  end if;

  foreach table_name in array application_tables
  loop
    if not exists (
      select 1
      from pg_catalog.pg_class as table_record
      join pg_catalog.pg_namespace as schema_record
        on schema_record.oid = table_record.relnamespace
      where schema_record.nspname = 'public'
        and table_record.relname = table_name
        and table_record.relrowsecurity
    ) then
      raise exception 'RECONCILIATION TEST FAILED: RLS is not enabled on public.%', table_name;
    end if;

    foreach privilege_name in array array[
      'SELECT', 'INSERT', 'UPDATE', 'DELETE', 'TRUNCATE', 'REFERENCES', 'TRIGGER'
    ]
    loop
      if has_table_privilege(
        'anon',
        format('public.%I', table_name),
        privilege_name
      ) then
        raise exception 'RECONCILIATION TEST FAILED: anon retains % on public.%', privilege_name, table_name;
      end if;
    end loop;
  end loop;

  if has_table_privilege('authenticated', 'public.profiles', 'INSERT')
    or has_table_privilege('authenticated', 'public.profiles', 'DELETE')
    or has_column_privilege('authenticated', 'public.profiles', 'email', 'UPDATE')
    or has_column_privilege('authenticated', 'public.profiles', 'email', 'SELECT')
    or has_column_privilege('authenticated', 'public.profiles', 'avatar_url', 'UPDATE')
    or has_table_privilege('authenticated', 'public.user_preferences', 'INSERT')
    or has_table_privilege('authenticated', 'public.user_preferences', 'DELETE')
    or has_column_privilege('authenticated', 'public.organizations', 'slug', 'UPDATE')
    or has_column_privilege('authenticated', 'public.organizations', 'plan', 'UPDATE')
    or has_table_privilege('authenticated', 'public.meta_whatsapp_connections', 'INSERT')
    or has_table_privilege('authenticated', 'public.meta_whatsapp_connections', 'UPDATE')
    or has_table_privilege('authenticated', 'public.channel_message_templates', 'INSERT')
    or has_table_privilege('authenticated', 'public.channel_message_templates', 'UPDATE')
    or has_table_privilege('authenticated', 'public.messages', 'UPDATE')
  then
    raise exception 'RECONCILIATION TEST FAILED: authenticated retains a forbidden compatibility/provider write privilege';
  end if;

  if not has_column_privilege('authenticated', 'public.profiles', 'id', 'SELECT')
    or not has_column_privilege('authenticated', 'public.profiles', 'full_name', 'UPDATE')
    or not has_table_privilege('authenticated', 'public.user_preferences', 'SELECT')
    or not has_column_privilege('authenticated', 'public.user_preferences', 'locale', 'UPDATE')
    or not has_column_privilege('authenticated', 'public.user_preferences', 'theme', 'UPDATE')
    or not has_column_privilege('authenticated', 'public.user_preferences', 'notifications_enabled', 'UPDATE')
  then
    raise exception 'RECONCILIATION TEST FAILED: an intended profile/preference browser privilege is missing';
  end if;

  if exists (
    select 1
    from pg_catalog.pg_proc as function_record
    join pg_catalog.pg_namespace as schema_record
      on schema_record.oid = function_record.pronamespace
    cross join lateral pg_catalog.aclexplode(
      coalesce(
        function_record.proacl,
        pg_catalog.acldefault('f', function_record.proowner)
      )
    ) as function_acl
    where schema_record.nspname = 'public'
      and function_record.prosecdef
      and function_acl.grantee = 0
      and function_acl.privilege_type = 'EXECUTE'
  ) or exists (
    select 1
    from pg_catalog.pg_proc as function_record
    join pg_catalog.pg_namespace as schema_record
      on schema_record.oid = function_record.pronamespace
    where schema_record.nspname = 'public'
      and function_record.prosecdef
      and has_function_privilege('anon', function_record.oid, 'EXECUTE')
  ) then
    raise exception 'RECONCILIATION TEST FAILED: a security-definer function is executable by PUBLIC or anon';
  end if;

  if exists (
    select 1
    from pg_catalog.pg_proc as function_record
    join pg_catalog.pg_namespace as schema_record
      on schema_record.oid = function_record.pronamespace
    where schema_record.nspname = 'public'
      and function_record.prosecdef
      and (
        function_record.proconfig is null
        or array_to_string(function_record.proconfig, ',') not like '%search_path=%'
        or array_to_string(function_record.proconfig, ',') like '%public%'
      )
  ) then
    raise exception 'RECONCILIATION TEST FAILED: a security-definer function lacks a fixed safe search_path';
  end if;

  if exists (
    select 1
    from pg_catalog.pg_proc as function_record
    join pg_catalog.pg_namespace as schema_record
      on schema_record.oid = function_record.pronamespace
    where schema_record.nspname = 'public'
      and function_record.prosecdef
      and has_function_privilege('authenticated', function_record.oid, 'EXECUTE')
      and function_record.proname not in (
        'ait_is_organization_member',
        'ait_has_organization_role',
        'ait_users_share_organization'
      )
  ) then
    raise exception 'RECONCILIATION TEST FAILED: authenticated can execute an internal security-definer function';
  end if;

  if not has_function_privilege(
    'authenticated',
    'public.ait_is_organization_member(uuid)',
    'EXECUTE'
  ) or not has_function_privilege(
    'authenticated',
    'public.ait_has_organization_role(uuid,public.organization_member_role[])',
    'EXECUTE'
  ) or not has_function_privilege(
    'authenticated',
    'public.ait_users_share_organization(uuid)',
    'EXECUTE'
  ) then
    raise exception 'RECONCILIATION TEST FAILED: an RLS helper lacks its required authenticated EXECUTE grant';
  end if;
end;
$verify$;

with target_tables as (
  select unnest(array[
    'channel_connections',
    'channel_message_templates',
    'contacts',
    'conversations',
    'customer_consents',
    'messages',
    'meta_whatsapp_connections',
    'organization_members',
    'organizations',
    'profiles',
    'user_preferences'
  ]) as table_name
), catalog_items as (
  select
    'rls|' || table_record.relname || '|' || table_record.relrowsecurity || '|' || table_record.relforcerowsecurity as item
  from pg_catalog.pg_class as table_record
  join pg_catalog.pg_namespace as schema_record
    on schema_record.oid = table_record.relnamespace
  where schema_record.nspname = 'public'
    and table_record.relname in (select table_name from target_tables)

  union all

  select
    'column|' || table_record.relname || '|' || attribute_record.attnum || '|' ||
      attribute_record.attname || '|' ||
      format_type(attribute_record.atttypid, attribute_record.atttypmod) || '|' ||
      attribute_record.attnotnull || '|' ||
      coalesce(pg_get_expr(default_record.adbin, default_record.adrelid), '') as item
  from pg_catalog.pg_attribute as attribute_record
  join pg_catalog.pg_class as table_record
    on table_record.oid = attribute_record.attrelid
  join pg_catalog.pg_namespace as schema_record
    on schema_record.oid = table_record.relnamespace
  left join pg_catalog.pg_attrdef as default_record
    on default_record.adrelid = attribute_record.attrelid
   and default_record.adnum = attribute_record.attnum
  where schema_record.nspname = 'public'
    and table_record.relname in (select table_name from target_tables)
    and attribute_record.attnum > 0
    and not attribute_record.attisdropped

  union all

  select
    'enum|' || type_record.typname || '|' || enum_record.enumsortorder || '|' || enum_record.enumlabel
  from pg_catalog.pg_type as type_record
  join pg_catalog.pg_namespace as schema_record
    on schema_record.oid = type_record.typnamespace
  join pg_catalog.pg_enum as enum_record
    on enum_record.enumtypid = type_record.oid
  where schema_record.nspname = 'public'

  union all

  select
    'constraint|' || table_record.relname || '|' || constraint_record.conname || '|' ||
      pg_get_constraintdef(constraint_record.oid, true)
  from pg_catalog.pg_constraint as constraint_record
  join pg_catalog.pg_class as table_record
    on table_record.oid = constraint_record.conrelid
  join pg_catalog.pg_namespace as schema_record
    on schema_record.oid = table_record.relnamespace
  where schema_record.nspname = 'public'
    and table_record.relname in (select table_name from target_tables)

  union all

  select
    'index|' || index_record.tablename || '|' || index_record.indexname || '|' || index_record.indexdef
  from pg_catalog.pg_indexes as index_record
  where index_record.schemaname = 'public'
    and index_record.tablename in (select table_name from target_tables)

  union all

  select
    'function|' || function_record.proname || '|' ||
      pg_get_function_identity_arguments(function_record.oid) || '|' ||
      pg_get_functiondef(function_record.oid)
  from pg_catalog.pg_proc as function_record
  join pg_catalog.pg_namespace as schema_record
    on schema_record.oid = function_record.pronamespace
  where schema_record.nspname = 'public'
    and (
      function_record.proname like 'ait_%'
      or function_record.proname = 'set_updated_at'
    )

  union all

  select
    'function_grant|' || function_record.proname || '|' ||
      pg_get_function_identity_arguments(function_record.oid) || '|' ||
      case
        when function_acl.grantee = 0 then 'PUBLIC'
        else pg_get_userbyid(function_acl.grantee)
      end || '|' || function_acl.privilege_type
  from pg_catalog.pg_proc as function_record
  join pg_catalog.pg_namespace as schema_record
    on schema_record.oid = function_record.pronamespace
  cross join lateral pg_catalog.aclexplode(
    coalesce(
      function_record.proacl,
      pg_catalog.acldefault('f', function_record.proowner)
    )
  ) as function_acl
  where schema_record.nspname = 'public'
    and (
      function_record.proname like 'ait_%'
      or function_record.proname = 'set_updated_at'
    )
    and (
      function_acl.grantee = 0
      or pg_get_userbyid(function_acl.grantee) in (
        'anon',
        'authenticated',
        'service_role'
      )
    )

  union all

  select
    'trigger|' || table_record.relname || '|' || trigger_record.tgname || '|' ||
      pg_get_triggerdef(trigger_record.oid, true)
  from pg_catalog.pg_trigger as trigger_record
  join pg_catalog.pg_class as table_record
    on table_record.oid = trigger_record.tgrelid
  join pg_catalog.pg_namespace as schema_record
    on schema_record.oid = table_record.relnamespace
  where not trigger_record.tgisinternal
    and (
      (schema_record.nspname = 'public' and table_record.relname in (select table_name from target_tables))
      or (schema_record.nspname = 'auth' and table_record.relname = 'users')
    )

  union all

  select
    'policy|' || policy_record.tablename || '|' || policy_record.policyname || '|' ||
      policy_record.cmd || '|' || policy_record.roles::text || '|' ||
      coalesce(policy_record.qual, '') || '|' || coalesce(policy_record.with_check, '')
  from pg_catalog.pg_policies as policy_record
  where policy_record.schemaname = 'public'
    and policy_record.tablename in (select table_name from target_tables)

  union all

  select
    'table_grant|' || grant_record.table_name || '|' || grant_record.grantee || '|' || grant_record.privilege_type
  from information_schema.table_privileges as grant_record
  where grant_record.table_schema = 'public'
    and grant_record.table_name in (select table_name from target_tables)
    and grant_record.grantee in ('anon', 'authenticated')

  union all

  select
    'column_grant|' || grant_record.table_name || '|' || grant_record.column_name || '|' ||
      grant_record.grantee || '|' || grant_record.privilege_type
  from information_schema.column_privileges as grant_record
  where grant_record.table_schema = 'public'
    and grant_record.table_name in (select table_name from target_tables)
    and grant_record.grantee in ('anon', 'authenticated')
)
select
  'AIT RECONCILED SCHEMA TEST PASSED: clean and v0-upgrade paths satisfy the same catalog and provisioning assertions.' as result,
  md5(string_agg(item, E'\n' order by item)) as schema_fingerprint
from catalog_items;

rollback;
