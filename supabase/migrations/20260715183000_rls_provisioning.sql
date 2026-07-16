-- Phase 1: non-recursive tenant helpers, RLS policies, and auth-user provisioning.

create or replace function public.ait_is_organization_member(target_organization_id uuid)
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select exists (
    select 1
    from public.organization_members as membership
    where membership.organization_id = target_organization_id
      and membership.user_id = auth.uid()
  );
$$;

create or replace function public.ait_has_organization_role(
  target_organization_id uuid,
  allowed_roles public.organization_member_role[]
)
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select exists (
    select 1
    from public.organization_members as membership
    where membership.organization_id = target_organization_id
      and membership.user_id = auth.uid()
      and membership.role = any(allowed_roles)
  );
$$;

create or replace function public.ait_users_share_organization(target_user_id uuid)
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select exists (
    select 1
    from public.organization_members as current_membership
    join public.organization_members as target_membership
      on target_membership.organization_id = current_membership.organization_id
    where current_membership.user_id = auth.uid()
      and target_membership.user_id = target_user_id
  );
$$;

revoke all on function public.ait_is_organization_member(uuid)
  from public, anon, authenticated;
revoke all on function public.ait_has_organization_role(
  uuid,
  public.organization_member_role[]
) from public, anon, authenticated;
revoke all on function public.ait_users_share_organization(uuid)
  from public, anon, authenticated;

grant execute on function public.ait_is_organization_member(uuid)
  to authenticated;
grant execute on function public.ait_has_organization_role(
  uuid,
  public.organization_member_role[]
) to authenticated;
grant execute on function public.ait_users_share_organization(uuid)
  to authenticated;

-- Replace the v0 preference policies. Preferences are provisioned by the Auth
-- trigger, so browser users need only read and update their own mutable fields.
drop policy if exists prefs_select_own on public.user_preferences;
drop policy if exists prefs_insert_own on public.user_preferences;
drop policy if exists prefs_update_own on public.user_preferences;

create policy user_preferences_select_self
on public.user_preferences
for select
to authenticated
using (user_id = auth.uid());

create policy user_preferences_update_self
on public.user_preferences
for update
to authenticated
using (user_id = auth.uid())
with check (user_id = auth.uid());

-- Profiles are visible only to the user or to users sharing an organization.
create policy profiles_select_same_organization
on public.profiles
for select
to authenticated
using (
  id = auth.uid()
  or public.ait_users_share_organization(id)
);

create policy profiles_update_self
on public.profiles
for update
to authenticated
using (id = auth.uid())
with check (id = auth.uid());

-- Organizations are tenant-readable; only owners can change workspace settings.
create policy organizations_select_member
on public.organizations
for select
to authenticated
using (public.ait_is_organization_member(id));

create policy organizations_update_owner
on public.organizations
for update
to authenticated
using (
  public.ait_has_organization_role(
    id,
    array['owner']::public.organization_member_role[]
  )
)
with check (
  public.ait_has_organization_role(
    id,
    array['owner']::public.organization_member_role[]
  )
);

-- Membership policy checks use SECURITY DEFINER helpers to avoid RLS recursion.
create policy organization_members_select_member
on public.organization_members
for select
to authenticated
using (public.ait_is_organization_member(organization_id));

create policy organization_members_insert_owner
on public.organization_members
for insert
to authenticated
with check (
  public.ait_has_organization_role(
    organization_id,
    array['owner']::public.organization_member_role[]
  )
);

create policy organization_members_update_owner
on public.organization_members
for update
to authenticated
using (
  public.ait_has_organization_role(
    organization_id,
    array['owner']::public.organization_member_role[]
  )
)
with check (
  public.ait_has_organization_role(
    organization_id,
    array['owner']::public.organization_member_role[]
  )
);

create policy organization_members_delete_owner
on public.organization_members
for delete
to authenticated
using (
  public.ait_has_organization_role(
    organization_id,
    array['owner']::public.organization_member_role[]
  )
);

-- Generic channel connection management belongs to organization owners.
create policy channel_connections_select_member
on public.channel_connections
for select
to authenticated
using (public.ait_is_organization_member(organization_id));

create policy channel_connections_insert_owner
on public.channel_connections
for insert
to authenticated
with check (
  public.ait_has_organization_role(
    organization_id,
    array['owner']::public.organization_member_role[]
  )
);

create policy channel_connections_update_owner
on public.channel_connections
for update
to authenticated
using (
  public.ait_has_organization_role(
    organization_id,
    array['owner']::public.organization_member_role[]
  )
)
with check (
  public.ait_has_organization_role(
    organization_id,
    array['owner']::public.organization_member_role[]
  )
);

-- Meta identifiers are owner-readable but server-writable only.
create policy meta_whatsapp_connections_select_owner
on public.meta_whatsapp_connections
for select
to authenticated
using (
  exists (
    select 1
    from public.channel_connections as connection
    where connection.id = channel_connection_id
      and public.ait_has_organization_role(
        connection.organization_id,
        array['owner']::public.organization_member_role[]
      )
  )
);

-- Contacts and conversations are readable by members and writable by managers/owners.
create policy contacts_select_member
on public.contacts
for select
to authenticated
using (public.ait_is_organization_member(organization_id));

create policy contacts_insert_manager
on public.contacts
for insert
to authenticated
with check (
  public.ait_has_organization_role(
    organization_id,
    array['owner', 'manager']::public.organization_member_role[]
  )
);

create policy contacts_update_manager
on public.contacts
for update
to authenticated
using (
  public.ait_has_organization_role(
    organization_id,
    array['owner', 'manager']::public.organization_member_role[]
  )
)
with check (
  public.ait_has_organization_role(
    organization_id,
    array['owner', 'manager']::public.organization_member_role[]
  )
);

create policy conversations_select_member
on public.conversations
for select
to authenticated
using (public.ait_is_organization_member(organization_id));

create policy conversations_insert_manager
on public.conversations
for insert
to authenticated
with check (
  public.ait_has_organization_role(
    organization_id,
    array['owner', 'manager']::public.organization_member_role[]
  )
);

create policy conversations_update_manager
on public.conversations
for update
to authenticated
using (
  public.ait_has_organization_role(
    organization_id,
    array['owner', 'manager']::public.organization_member_role[]
  )
)
with check (
  public.ait_has_organization_role(
    organization_id,
    array['owner', 'manager']::public.organization_member_role[]
  )
);

-- Members can read history. Managers/owners can enqueue only unsent human outbound messages.
create policy messages_select_member
on public.messages
for select
to authenticated
using (public.ait_is_organization_member(organization_id));

create policy messages_insert_pending_manager_outbound
on public.messages
for insert
to authenticated
with check (
  public.ait_has_organization_role(
    organization_id,
    array['owner', 'manager']::public.organization_member_role[]
  )
  and direction = 'outbound'
  and sender_type = 'manager'
  and delivery_status = 'pending'
  and provider_message_id is null
  and provider_timestamp is null
);

-- Consent changes require a manager/owner and remain tenant-scoped.
create policy customer_consents_select_member
on public.customer_consents
for select
to authenticated
using (public.ait_is_organization_member(organization_id));

create policy customer_consents_insert_manager
on public.customer_consents
for insert
to authenticated
with check (
  public.ait_has_organization_role(
    organization_id,
    array['owner', 'manager']::public.organization_member_role[]
  )
);

create policy customer_consents_update_manager
on public.customer_consents
for update
to authenticated
using (
  public.ait_has_organization_role(
    organization_id,
    array['owner', 'manager']::public.organization_member_role[]
  )
)
with check (
  public.ait_has_organization_role(
    organization_id,
    array['owner', 'manager']::public.organization_member_role[]
  )
);

-- Template approval data is synchronized by trusted backend code; members can read it.
create policy channel_message_templates_select_member
on public.channel_message_templates
for select
to authenticated
using (public.ait_is_organization_member(organization_id));

-- Browser table and column privileges. RLS remains the tenant authorization boundary.
grant select (id, full_name, avatar_url, created_at, updated_at)
  on table public.profiles to authenticated;
grant update (full_name) on table public.profiles to authenticated;

grant select on table public.user_preferences to authenticated;
grant update (locale, theme, notifications_enabled)
  on table public.user_preferences to authenticated;

grant select on table public.organizations to authenticated;
grant update (name, default_language, timezone)
  on table public.organizations to authenticated;

grant select, insert, delete
  on table public.organization_members to authenticated;
grant update (role)
  on table public.organization_members to authenticated;

grant select, insert
  on table public.channel_connections to authenticated;
grant update (
  status,
  external_account_id,
  connected_phone_number,
  display_name,
  capabilities,
  connected_at,
  disconnected_at,
  last_error
) on table public.channel_connections to authenticated;

grant select on table public.meta_whatsapp_connections to authenticated;

grant select, insert on table public.contacts to authenticated;
grant update (
  external_contact_id,
  phone_number,
  display_name,
  contact_type,
  ai_analysis_allowed
) on table public.contacts to authenticated;

grant select, insert on table public.conversations to authenticated;
grant update (
  status,
  unread_count,
  needs_human,
  assigned_user_id,
  last_message_at,
  last_customer_message_at,
  service_window_expires_at
) on table public.conversations to authenticated;

grant select, insert on table public.messages to authenticated;

grant select, insert on table public.customer_consents to authenticated;
grant update (status, source, consented_at, revoked_at)
  on table public.customer_consents to authenticated;

grant select on table public.channel_message_templates to authenticated;

-- Prevent an organization from losing its final owner through membership changes.
create or replace function public.ait_ensure_organization_has_owner()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  if exists (
    select 1
    from public.organizations as organization
    where organization.id = old.organization_id
  ) and not exists (
    select 1
    from public.organization_members as membership
    where membership.organization_id = old.organization_id
      and membership.role = 'owner'
  ) then
    raise exception using
      errcode = '23514',
      message = 'an organization must retain at least one owner';
  end if;

  return null;
end;
$$;

revoke all on function public.ait_ensure_organization_has_owner()
  from public, anon, authenticated;

do $$
begin
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
      message = 'cannot enable final-owner enforcement while an organization has no owner';
  end if;
end;
$$;

drop trigger if exists organization_members_require_owner
  on public.organization_members;

create constraint trigger organization_members_require_owner
after delete or update on public.organization_members
deferrable initially deferred
for each row execute function public.ait_ensure_organization_has_owner();

comment on function public.ait_is_organization_member(uuid) is
  'Non-recursive RLS helper that checks the calling auth user only.';
comment on function public.ait_has_organization_role(
  uuid,
  public.organization_member_role[]
) is 'Non-recursive RLS helper that checks the calling auth user only.';
comment on function public.ait_provision_new_auth_user() is
  'Atomically creates a profile, preferences, default organization, and owner membership for a new auth user.';
