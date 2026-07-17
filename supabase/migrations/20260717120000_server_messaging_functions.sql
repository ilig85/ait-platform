-- Phase 2A: atomic provider-neutral server operations for webhook ingestion.
-- These functions are callable only by Supabase's server-only service role.

create or replace function public.ait_record_inbound_text(
  target_organization_id uuid,
  target_channel_connection_id uuid,
  target_provider_message_id text,
  target_external_contact_id text,
  target_phone_number text,
  target_display_name text,
  target_text_body text,
  target_provider_timestamp timestamptz
)
returns table (
  message_id uuid,
  conversation_id uuid,
  created boolean
)
language plpgsql
security definer
set search_path = ''
as $$
declare
  selected_contact_id uuid;
  selected_conversation_id uuid;
  selected_message_id uuid;
begin
  if target_provider_message_id is null
    or target_external_contact_id is null
    or target_phone_number is null
    or target_text_body is null
    or target_provider_timestamp is null
    or btrim(target_provider_message_id) = ''
    or btrim(target_external_contact_id) = ''
    or btrim(target_phone_number) = ''
  then
    raise exception using
      errcode = '22023',
      message = 'Inbound provider and contact identifiers must not be blank';
  end if;

  if not exists (
    select 1
    from public.channel_connections as connection
    where connection.id = target_channel_connection_id
      and connection.organization_id = target_organization_id
  ) then
    raise exception using
      errcode = '23503',
      message = 'Inbound channel connection does not belong to the organization';
  end if;

  select stored_message.id, stored_message.conversation_id
  into selected_message_id, selected_conversation_id
  from public.messages as stored_message
  where stored_message.channel_connection_id = target_channel_connection_id
    and stored_message.provider_message_id = target_provider_message_id;

  if found then
    return query select selected_message_id, selected_conversation_id, false;
    return;
  end if;

  -- Serialize message creation for one provider contact. This avoids duplicate
  -- contacts/conversations and makes unread increments concurrency-safe.
  perform pg_catalog.pg_advisory_xact_lock(
    pg_catalog.hashtextextended(
      target_channel_connection_id::text || ':' || target_external_contact_id,
      0
    )
  );

  -- Recheck after acquiring the contact lock in case this request waited for
  -- an identical webhook transaction.
  select stored_message.id, stored_message.conversation_id
  into selected_message_id, selected_conversation_id
  from public.messages as stored_message
  where stored_message.channel_connection_id = target_channel_connection_id
    and stored_message.provider_message_id = target_provider_message_id;

  if found then
    return query select selected_message_id, selected_conversation_id, false;
    return;
  end if;

  select contact.id
  into selected_contact_id
  from public.contacts as contact
  where contact.channel_connection_id = target_channel_connection_id
    and contact.external_contact_id = target_external_contact_id;

  if selected_contact_id is null then
    insert into public.contacts (
      organization_id,
      channel_connection_id,
      external_contact_id,
      phone_number,
      display_name,
      contact_type,
      ai_analysis_allowed
    ) values (
      target_organization_id,
      target_channel_connection_id,
      target_external_contact_id,
      target_phone_number,
      target_display_name,
      'customer',
      false
    )
    returning id into selected_contact_id;
  elsif target_display_name is not null then
    update public.contacts
    set display_name = coalesce(display_name, target_display_name)
    where id = selected_contact_id;
  end if;

  select conversation.id
  into selected_conversation_id
  from public.conversations as conversation
  where conversation.organization_id = target_organization_id
    and conversation.channel_connection_id = target_channel_connection_id
    and conversation.contact_id = selected_contact_id
    and conversation.status <> 'archived'
  order by conversation.last_message_at desc nulls last,
    conversation.created_at desc
  limit 1
  for update;

  if selected_conversation_id is null then
    insert into public.conversations (
      organization_id,
      channel_connection_id,
      contact_id,
      status
    ) values (
      target_organization_id,
      target_channel_connection_id,
      selected_contact_id,
      'open'
    )
    returning id into selected_conversation_id;
  end if;

  begin
    insert into public.messages (
      organization_id,
      channel_connection_id,
      conversation_id,
      provider_message_id,
      direction,
      sender_type,
      message_type,
      text_body,
      delivery_status,
      provider_timestamp,
      ai_analysis_allowed
    ) values (
      target_organization_id,
      target_channel_connection_id,
      selected_conversation_id,
      target_provider_message_id,
      'inbound',
      'customer',
      'text',
      target_text_body,
      'received',
      target_provider_timestamp,
      false
    )
    returning id into selected_message_id;
  exception
    when unique_violation then
      select stored_message.id, stored_message.conversation_id
      into selected_message_id, selected_conversation_id
      from public.messages as stored_message
      where stored_message.channel_connection_id = target_channel_connection_id
        and stored_message.provider_message_id = target_provider_message_id;

      if selected_message_id is null then
        raise;
      end if;

      return query select selected_message_id, selected_conversation_id, false;
      return;
  end;

  update public.conversations
  set status = 'open',
      unread_count = unread_count + 1,
      last_message_at = case
        when last_message_at is null or last_message_at < target_provider_timestamp
          then target_provider_timestamp
        else last_message_at
      end,
      last_customer_message_at = case
        when last_customer_message_at is null
          or last_customer_message_at < target_provider_timestamp
          then target_provider_timestamp
        else last_customer_message_at
      end,
      service_window_expires_at = case
        when service_window_expires_at is null
          or service_window_expires_at < target_provider_timestamp + interval '24 hours'
          then target_provider_timestamp + interval '24 hours'
        else service_window_expires_at
      end
  where id = selected_conversation_id;

  return query select selected_message_id, selected_conversation_id, true;
end;
$$;

revoke all on function public.ait_record_inbound_text(
  uuid, uuid, text, text, text, text, text, timestamptz
) from public, anon, authenticated;

grant execute on function public.ait_record_inbound_text(
  uuid, uuid, text, text, text, text, text, timestamptz
) to service_role;

create or replace function public.ait_advance_message_delivery_status(
  target_channel_connection_id uuid,
  target_provider_message_id text,
  target_status public.message_delivery_status
)
returns boolean
language plpgsql
security definer
set search_path = ''
as $$
declare
  changed_rows integer;
begin
  if target_status not in ('sent', 'delivered', 'read', 'failed') then
    raise exception using
      errcode = '22023',
      message = 'Unsupported provider delivery status';
  end if;

  update public.messages
  set delivery_status = target_status
  where channel_connection_id = target_channel_connection_id
    and provider_message_id = target_provider_message_id
    and direction = 'outbound'
    and (
      (target_status = 'sent' and delivery_status = 'pending')
      or (target_status = 'delivered' and delivery_status in ('pending', 'sent'))
      or (target_status = 'read' and delivery_status in ('pending', 'sent', 'delivered'))
      or (target_status = 'failed' and delivery_status in ('pending', 'sent'))
    );

  get diagnostics changed_rows = row_count;
  return changed_rows = 1;
end;
$$;

revoke all on function public.ait_advance_message_delivery_status(
  uuid, text, public.message_delivery_status
) from public, anon, authenticated;

grant execute on function public.ait_advance_message_delivery_status(
  uuid, text, public.message_delivery_status
) to service_role;

create or replace function public.ait_mark_outbound_message_sent(
  target_message_id uuid,
  target_organization_id uuid,
  target_provider_message_id text,
  target_provider_timestamp timestamptz
)
returns boolean
language plpgsql
security definer
set search_path = ''
as $$
declare
  selected_conversation_id uuid;
begin
  if target_provider_message_id is null
    or target_provider_timestamp is null
    or btrim(target_provider_message_id) = ''
  then
    raise exception using
      errcode = '22023',
      message = 'Outbound provider message ID and timestamp are required';
  end if;

  update public.messages
  set provider_message_id = target_provider_message_id,
      provider_timestamp = target_provider_timestamp,
      delivery_status = 'sent'
  where id = target_message_id
    and organization_id = target_organization_id
    and direction = 'outbound'
    and delivery_status = 'pending'
  returning conversation_id into selected_conversation_id;

  if selected_conversation_id is null then
    return false;
  end if;

  update public.conversations
  set last_message_at = case
    when last_message_at is null or last_message_at < target_provider_timestamp
      then target_provider_timestamp
    else last_message_at
  end
  where id = selected_conversation_id
    and organization_id = target_organization_id;

  return true;
end;
$$;

revoke all on function public.ait_mark_outbound_message_sent(
  uuid, uuid, text, timestamptz
) from public, anon, authenticated;

grant execute on function public.ait_mark_outbound_message_sent(
  uuid, uuid, text, timestamptz
) to service_role;

comment on function public.ait_record_inbound_text(
  uuid, uuid, text, text, text, text, text, timestamptz
) is 'Atomically records an idempotent provider-neutral inbound text message and advances conversation state.';

comment on function public.ait_advance_message_delivery_status(
  uuid, text, public.message_delivery_status
) is 'Advances outbound delivery status without allowing out-of-order regressions.';

comment on function public.ait_mark_outbound_message_sent(
  uuid, uuid, text, timestamptz
) is 'Atomically attaches an outbound provider ID and advances conversation last-message time without regression.';
