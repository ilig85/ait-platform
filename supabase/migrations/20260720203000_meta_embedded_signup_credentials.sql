-- Production Meta Embedded Signup credentials and atomic connection install.
-- Secrets are encrypted by the application before they reach Postgres. This
-- table is service-role-only and is never readable through authenticated RLS.

create table public.channel_connection_credentials (
  channel_connection_id uuid primary key
    references public.channel_connections (id) on delete cascade,
  provider text not null,
  encrypted_access_token text not null,
  access_token_expires_at timestamptz,
  encrypted_registration_pin text,
  key_version smallint not null default 1,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint channel_connection_credentials_provider_not_blank
    check (btrim(provider) <> ''),
  constraint channel_connection_credentials_token_not_blank
    check (btrim(encrypted_access_token) <> ''),
  constraint channel_connection_credentials_key_version_positive
    check (key_version > 0)
);

create or replace function public.ait_validate_channel_connection_credential()
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
      and connection.provider = new.provider
  ) then
    raise exception using
      errcode = '23514',
      message = 'channel credential provider must match its channel connection';
  end if;
  return new;
end;
$$;

revoke all on function public.ait_validate_channel_connection_credential()
  from public, anon, authenticated;

create trigger channel_connection_credentials_validate
before insert or update on public.channel_connection_credentials
for each row execute function public.ait_validate_channel_connection_credential();

create trigger channel_connection_credentials_set_updated_at
before update on public.channel_connection_credentials
for each row execute function public.ait_set_updated_at();

alter table public.channel_connection_credentials enable row level security;
revoke all on table public.channel_connection_credentials from anon, authenticated;

comment on table public.channel_connection_credentials is
  'Application-encrypted provider credentials. Service-role-only; ciphertext is bound to the provider phone identifier by AES-GCM AAD.';

create or replace function public.ait_install_meta_whatsapp_connection(
  target_organization_id uuid,
  target_meta_app_id text,
  target_business_portfolio_id text,
  target_waba_id text,
  target_phone_number_id text,
  target_display_phone_number text,
  target_verified_name text,
  target_encrypted_access_token text,
  target_access_token_expires_at timestamptz,
  target_encrypted_registration_pin text
)
returns uuid
language plpgsql
security definer
set search_path = ''
as $$
declare
  selected_connection_id uuid;
  selected_organization_id uuid;
begin
  if auth.role() <> 'service_role' then
    raise exception using errcode = '42501', message = 'service role required';
  end if;

  if btrim(coalesce(target_meta_app_id, '')) = ''
    or btrim(coalesce(target_waba_id, '')) = ''
    or btrim(coalesce(target_phone_number_id, '')) = ''
    or btrim(coalesce(target_encrypted_access_token, '')) = '' then
    raise exception using errcode = '22023', message = 'required Meta connection fields are missing';
  end if;

  select connection.id, connection.organization_id
  into selected_connection_id, selected_organization_id
  from public.meta_whatsapp_connections as meta
  join public.channel_connections as connection
    on connection.id = meta.channel_connection_id
  where meta.phone_number_id = target_phone_number_id
  for update of connection;

  if selected_connection_id is not null and selected_organization_id <> target_organization_id then
    raise exception using
      errcode = '23505',
      message = 'this WhatsApp phone number is already connected to another organization';
  end if;

  if selected_connection_id is null then
    select connection.id
    into selected_connection_id
    from public.channel_connections as connection
    where connection.organization_id = target_organization_id
      and connection.channel_type = 'whatsapp'
      and connection.provider = 'meta_cloud'
      and connection.external_account_id = target_waba_id
    order by connection.created_at
    limit 1
    for update;
  end if;

  if selected_connection_id is null then
    insert into public.channel_connections (
      organization_id,
      channel_type,
      provider,
      status,
      external_account_id,
      connected_phone_number,
      display_name,
      capabilities,
      last_error
    ) values (
      target_organization_id,
      'whatsapp',
      'meta_cloud',
      'connecting',
      target_waba_id,
      nullif(btrim(target_display_phone_number), ''),
      nullif(btrim(target_verified_name), ''),
      '{"inbound":true,"outbound":true,"embedded_signup":true}'::jsonb,
      null
    )
    returning id into selected_connection_id;
  else
    update public.channel_connections
    set status = 'connecting',
        external_account_id = target_waba_id,
        connected_phone_number = nullif(btrim(target_display_phone_number), ''),
        display_name = nullif(btrim(target_verified_name), ''),
        capabilities = capabilities || '{"inbound":true,"outbound":true,"embedded_signup":true}'::jsonb,
        disconnected_at = null,
        last_error = null
    where id = selected_connection_id;
  end if;

  insert into public.meta_whatsapp_connections (
    channel_connection_id,
    meta_app_id,
    business_portfolio_id,
    waba_id,
    phone_number_id,
    webhook_subscription_status
  ) values (
    selected_connection_id,
    target_meta_app_id,
    nullif(btrim(target_business_portfolio_id), ''),
    target_waba_id,
    target_phone_number_id,
    'pending'
  )
  on conflict (channel_connection_id) do update
  set meta_app_id = excluded.meta_app_id,
      business_portfolio_id = excluded.business_portfolio_id,
      waba_id = excluded.waba_id,
      phone_number_id = excluded.phone_number_id,
      webhook_subscription_status = 'pending';

  insert into public.channel_connection_credentials (
    channel_connection_id,
    provider,
    encrypted_access_token,
    access_token_expires_at,
    encrypted_registration_pin,
    key_version
  ) values (
    selected_connection_id,
    'meta_cloud',
    target_encrypted_access_token,
    target_access_token_expires_at,
    target_encrypted_registration_pin,
    1
  )
  on conflict (channel_connection_id) do update
  set provider = excluded.provider,
      encrypted_access_token = excluded.encrypted_access_token,
      access_token_expires_at = excluded.access_token_expires_at,
      encrypted_registration_pin = excluded.encrypted_registration_pin,
      key_version = excluded.key_version;

  return selected_connection_id;
end;
$$;

revoke all on function public.ait_install_meta_whatsapp_connection(
  uuid, text, text, text, text, text, text, text, timestamptz, text
) from public, anon, authenticated;
grant execute on function public.ait_install_meta_whatsapp_connection(
  uuid, text, text, text, text, text, text, text, timestamptz, text
) to service_role;
