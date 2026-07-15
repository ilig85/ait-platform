-- Phase 1: explicit customer consent and provider-neutral message templates.

create type public.consent_status as enum (
  'granted',
  'revoked',
  'unknown'
);

create type public.message_template_category as enum (
  'marketing',
  'utility',
  'authentication'
);

create table public.customer_consents (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null,
  contact_id uuid not null,
  consent_type text not null default 'marketing',
  topic text not null,
  status public.consent_status not null default 'unknown',
  source text,
  consented_at timestamptz,
  revoked_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint customer_consents_contact_organization_fk
    foreign key (organization_id, contact_id)
    references public.contacts (organization_id, id)
    on delete cascade,
  constraint customer_consents_type_format
    check (consent_type ~ '^[a-z][a-z0-9_]*$'),
  constraint customer_consents_topic_not_blank check (btrim(topic) <> ''),
  constraint customer_consents_granted_at_required
    check (status <> 'granted' or consented_at is not null),
  constraint customer_consents_revoked_at_required
    check (status <> 'revoked' or revoked_at is not null),
  constraint customer_consents_source_required
    check (status = 'unknown' or nullif(btrim(source), '') is not null),
  constraint customer_consents_contact_type_topic_key
    unique (organization_id, contact_id, consent_type, topic)
);

create index customer_consents_organization_status_idx
  on public.customer_consents (organization_id, status, consent_type);

create index customer_consents_contact_status_idx
  on public.customer_consents (contact_id, status, topic);

create table public.channel_message_templates (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null
    references public.organizations (id) on delete cascade,
  channel_connection_id uuid,
  provider text not null,
  provider_template_id text,
  name text not null,
  language text not null,
  category public.message_template_category not null,
  approval_status text not null default 'unknown',
  template_definition jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint channel_templates_connection_provider_fk
    foreign key (organization_id, channel_connection_id, provider)
    references public.channel_connections (organization_id, id, provider)
    on delete cascade,
  constraint channel_templates_provider_format
    check (provider ~ '^[a-z][a-z0-9_]*$'),
  constraint channel_templates_name_not_blank check (btrim(name) <> ''),
  constraint channel_templates_language_not_blank check (btrim(language) <> ''),
  constraint channel_templates_approval_status_format
    check (approval_status ~ '^[a-z][a-z0-9_]*$'),
  constraint channel_templates_definition_object
    check (jsonb_typeof(template_definition) = 'object')
);

create unique index channel_templates_name_language_uidx
  on public.channel_message_templates (
    organization_id,
    provider,
    coalesce(
      channel_connection_id,
      '00000000-0000-0000-0000-000000000000'::uuid
    ),
    name,
    language
  );

create unique index channel_templates_connection_provider_id_uidx
  on public.channel_message_templates (
    channel_connection_id,
    provider_template_id
  )
  where channel_connection_id is not null
    and provider_template_id is not null;

create unique index channel_templates_organization_provider_id_uidx
  on public.channel_message_templates (
    organization_id,
    provider,
    provider_template_id
  )
  where channel_connection_id is null
    and provider_template_id is not null;

create index channel_templates_organization_approval_idx
  on public.channel_message_templates (
    organization_id,
    provider,
    approval_status
  );

create trigger customer_consents_set_updated_at
before update on public.customer_consents
for each row execute function public.ait_set_updated_at();

create trigger channel_message_templates_set_updated_at
before update on public.channel_message_templates
for each row execute function public.ait_set_updated_at();

alter table public.customer_consents enable row level security;
alter table public.channel_message_templates enable row level security;

revoke all on table public.customer_consents from anon, authenticated;
revoke all on table public.channel_message_templates from anon, authenticated;

comment on table public.customer_consents is
  'Explicit, topic-scoped consent state. Missing rows and unknown status never imply granted consent.';
comment on table public.channel_message_templates is
  'Provider-neutral representation of provider-approved outbound message templates.';
