-- Phase 1: provider-neutral channel, contact, conversation, and message model.

create type public.channel_connection_status as enum (
  'disconnected',
  'connecting',
  'connected',
  'reconnecting',
  'error',
  'disabled'
);

create type public.contact_type as enum (
  'customer',
  'coworker',
  'supplier',
  'personal',
  'unknown'
);

create type public.conversation_status as enum (
  'open',
  'pending',
  'resolved',
  'archived'
);

create type public.message_direction as enum ('inbound', 'outbound');

create type public.message_sender_type as enum (
  'customer',
  'manager',
  'ai',
  'system',
  'unknown'
);

create type public.message_type as enum (
  'text',
  'image',
  'audio',
  'document',
  'video',
  'interactive',
  'template',
  'unsupported'
);

create type public.message_delivery_status as enum (
  'pending',
  'sent',
  'delivered',
  'read',
  'failed',
  'received'
);

create table public.channel_connections (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null
    references public.organizations (id) on delete cascade,
  channel_type text not null,
  provider text not null,
  status public.channel_connection_status not null default 'disconnected',
  external_account_id text,
  connected_phone_number text,
  display_name text,
  capabilities jsonb not null default '{}'::jsonb,
  connected_at timestamptz,
  disconnected_at timestamptz,
  last_error text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint channel_connections_channel_type_format
    check (channel_type ~ '^[a-z][a-z0-9_]*$'),
  constraint channel_connections_provider_format
    check (provider ~ '^[a-z][a-z0-9_]*$'),
  constraint channel_connections_capabilities_object
    check (jsonb_typeof(capabilities) = 'object'),
  constraint channel_connections_organization_id_id_key
    unique (organization_id, id),
  constraint channel_connections_organization_id_id_provider_key
    unique (organization_id, id, provider)
);

create unique index channel_connections_external_account_uidx
  on public.channel_connections (
    organization_id,
    provider,
    external_account_id
  )
  where external_account_id is not null;

create index channel_connections_organization_status_idx
  on public.channel_connections (organization_id, status, channel_type);

create table public.meta_whatsapp_connections (
  channel_connection_id uuid primary key
    references public.channel_connections (id) on delete cascade,
  meta_app_id text not null,
  business_portfolio_id text,
  waba_id text not null,
  phone_number_id text not null,
  webhook_subscription_status text not null default 'not_subscribed',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint meta_whatsapp_app_id_not_blank check (btrim(meta_app_id) <> ''),
  constraint meta_whatsapp_waba_id_not_blank check (btrim(waba_id) <> ''),
  constraint meta_whatsapp_phone_number_id_not_blank
    check (btrim(phone_number_id) <> ''),
  constraint meta_whatsapp_webhook_status
    check (
      webhook_subscription_status in (
        'not_subscribed',
        'pending',
        'subscribed',
        'error'
      )
    ),
  constraint meta_whatsapp_phone_number_id_key unique (phone_number_id)
);

create or replace function public.ait_validate_meta_whatsapp_connection()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  if not exists (
    select 1
    from public.channel_connections as connection
    where connection.id = new.channel_connection_id
      and connection.channel_type = 'whatsapp'
      and connection.provider = 'meta_cloud'
  ) then
    raise exception using
      errcode = '23514',
      message = 'meta_whatsapp_connections requires a meta_cloud WhatsApp channel connection';
  end if;

  return new;
end;
$$;

revoke all on function public.ait_validate_meta_whatsapp_connection()
  from public, anon, authenticated;

create trigger meta_whatsapp_validate_connection
before insert or update of channel_connection_id
on public.meta_whatsapp_connections
for each row execute function public.ait_validate_meta_whatsapp_connection();

create table public.contacts (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null,
  channel_connection_id uuid not null,
  external_contact_id text,
  phone_number text,
  display_name text,
  contact_type public.contact_type not null default 'unknown',
  ai_analysis_allowed boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint contacts_connection_organization_fk
    foreign key (organization_id, channel_connection_id)
    references public.channel_connections (organization_id, id)
    on delete cascade,
  constraint contacts_identity_present
    check (external_contact_id is not null or phone_number is not null),
  constraint contacts_display_name_length
    check (display_name is null or char_length(display_name) <= 200),
  constraint contacts_organization_id_id_key
    unique (organization_id, id),
  constraint contacts_organization_connection_id_key
    unique (organization_id, channel_connection_id, id)
);

create unique index contacts_external_contact_uidx
  on public.contacts (channel_connection_id, external_contact_id)
  where external_contact_id is not null;

create unique index contacts_phone_per_connection_uidx
  on public.contacts (channel_connection_id, phone_number)
  where phone_number is not null;

create index contacts_organization_phone_idx
  on public.contacts (organization_id, phone_number)
  where phone_number is not null;

create index contacts_organization_created_idx
  on public.contacts (organization_id, created_at desc);

create table public.conversations (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null,
  channel_connection_id uuid not null,
  contact_id uuid not null,
  status public.conversation_status not null default 'open',
  unread_count integer not null default 0,
  needs_human boolean not null default false,
  assigned_user_id uuid,
  last_message_at timestamptz,
  last_customer_message_at timestamptz,
  service_window_expires_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint conversations_connection_organization_fk
    foreign key (organization_id, channel_connection_id)
    references public.channel_connections (organization_id, id)
    on delete cascade,
  constraint conversations_contact_connection_fk
    foreign key (organization_id, channel_connection_id, contact_id)
    references public.contacts (
      organization_id,
      channel_connection_id,
      id
    )
    on delete cascade,
  constraint conversations_assignee_membership_fk
    foreign key (organization_id, assigned_user_id)
    references public.organization_members (organization_id, user_id),
  constraint conversations_unread_count_nonnegative check (unread_count >= 0),
  constraint conversations_organization_connection_id_key
    unique (organization_id, channel_connection_id, id)
);

create index conversations_organization_latest_idx
  on public.conversations (organization_id, last_message_at desc nulls last);

create index conversations_connection_latest_idx
  on public.conversations (
    channel_connection_id,
    last_message_at desc nulls last
  );

create index conversations_contact_latest_idx
  on public.conversations (contact_id, last_message_at desc nulls last);

create index conversations_unread_idx
  on public.conversations (organization_id, last_message_at desc nulls last)
  where unread_count > 0;

create index conversations_needs_human_idx
  on public.conversations (organization_id, last_message_at desc nulls last)
  where needs_human;

create table public.messages (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null,
  channel_connection_id uuid not null,
  conversation_id uuid not null,
  provider_message_id text,
  direction public.message_direction not null,
  sender_type public.message_sender_type not null default 'unknown',
  message_type public.message_type not null default 'text',
  text_body text,
  delivery_status public.message_delivery_status not null,
  provider_timestamp timestamptz,
  reply_to_message_id uuid,
  ai_analysis_allowed boolean not null default false,
  media_metadata jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint messages_conversation_connection_fk
    foreign key (organization_id, channel_connection_id, conversation_id)
    references public.conversations (
      organization_id,
      channel_connection_id,
      id
    )
    on delete cascade,
  constraint messages_media_metadata_object
    check (
      media_metadata is null
      or jsonb_typeof(media_metadata) = 'object'
    ),
  constraint messages_organization_connection_conversation_id_key
    unique (organization_id, channel_connection_id, conversation_id, id),
  constraint messages_reply_same_conversation_fk
    foreign key (
      organization_id,
      channel_connection_id,
      conversation_id,
      reply_to_message_id
    )
    references public.messages (
      organization_id,
      channel_connection_id,
      conversation_id,
      id
    )
);

create unique index messages_provider_message_uidx
  on public.messages (channel_connection_id, provider_message_id)
  where provider_message_id is not null;

create index messages_conversation_history_idx
  on public.messages (
    conversation_id,
    provider_timestamp desc nulls last,
    created_at desc
  );

create index messages_organization_latest_idx
  on public.messages (
    organization_id,
    provider_timestamp desc nulls last,
    created_at desc
  );

create index messages_delivery_status_idx
  on public.messages (organization_id, delivery_status, created_at desc);

create trigger channel_connections_set_updated_at
before update on public.channel_connections
for each row execute function public.ait_set_updated_at();

create trigger meta_whatsapp_connections_set_updated_at
before update on public.meta_whatsapp_connections
for each row execute function public.ait_set_updated_at();

create trigger contacts_set_updated_at
before update on public.contacts
for each row execute function public.ait_set_updated_at();

create trigger conversations_set_updated_at
before update on public.conversations
for each row execute function public.ait_set_updated_at();

create trigger messages_set_updated_at
before update on public.messages
for each row execute function public.ait_set_updated_at();

alter table public.channel_connections enable row level security;
alter table public.meta_whatsapp_connections enable row level security;
alter table public.contacts enable row level security;
alter table public.conversations enable row level security;
alter table public.messages enable row level security;

revoke all on table public.channel_connections from anon, authenticated;
revoke all on table public.meta_whatsapp_connections from anon, authenticated;
revoke all on table public.contacts from anon, authenticated;
revoke all on table public.conversations from anon, authenticated;
revoke all on table public.messages from anon, authenticated;

comment on table public.channel_connections is
  'Provider-neutral external channel connection. Provider credentials are not stored here.';
comment on table public.meta_whatsapp_connections is
  'Meta Cloud API identifiers for a generic WhatsApp channel connection. Access tokens and app secrets must be stored outside public tables.';
comment on table public.contacts is
  'Provider-neutral contact identity scoped to one channel connection and organization.';
comment on table public.conversations is
  'Provider-neutral conversation, assignment, unread, and customer-service-window state.';
comment on table public.messages is
  'Provider-neutral message history. media_metadata is metadata-only and must not contain media file bytes.';
