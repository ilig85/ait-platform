-- AIT Phase 1 RLS isolation test for the Supabase Dashboard SQL Editor.
--
-- SAFETY:
--   * Run only in the disposable project containing exactly the two Auth users
--     named below.
--   * The first block aborts before creating fixtures if either user is absent
--     or if any other auth.users row exists.
--   * All fixtures and transaction-local JWT settings are rolled back.
--   * This script never updates or deletes auth.users.

begin;

-- Run every safety/precondition check before creating any test record.
do $guard$
declare
  user_a_id uuid;
  user_b_id uuid;
begin
  select auth_user.id
  into user_a_id
  from auth.users as auth_user
  where auth_user.email = 'ilgize7+ait-old-test@gmail.com';

  if user_a_id is null then
    raise exception using
      errcode = 'P0001',
      message = 'RLS TEST STOPPED: missing Auth user ilgize7+ait-old-test@gmail.com';
  end if;

  select auth_user.id
  into user_b_id
  from auth.users as auth_user
  where auth_user.email = 'ilgize7+ait-new-test@gmail.com';

  if user_b_id is null then
    raise exception using
      errcode = 'P0001',
      message = 'RLS TEST STOPPED: missing Auth user ilgize7+ait-new-test@gmail.com';
  end if;

  if exists (
    select 1
    from auth.users as auth_user
    where auth_user.email is null
      or auth_user.email not in (
        'ilgize7+ait-old-test@gmail.com',
        'ilgize7+ait-new-test@gmail.com'
      )
  ) then
    raise exception using
      errcode = 'P0001',
      message = 'RLS TEST STOPPED: non-test Auth users exist; do not run this script against this database';
  end if;

  if (select count(*) from auth.users) <> 2 then
    raise exception using
      errcode = 'P0001',
      message = 'RLS TEST STOPPED: auth.users must contain exactly the two approved test users';
  end if;

  if not exists (
    select 1 from public.profiles where id = user_a_id
  ) or not exists (
    select 1 from public.profiles where id = user_b_id
  ) then
    raise exception using
      errcode = 'P0001',
      message = 'RLS TEST STOPPED: both test users must have backfilled profiles';
  end if;

  if not exists (
    select 1
    from public.organization_members
    where user_id = user_a_id
      and role = 'owner'
  ) or not exists (
    select 1
    from public.organization_members
    where user_id = user_b_id
      and role = 'owner'
  ) then
    raise exception using
      errcode = 'P0001',
      message = 'RLS TEST STOPPED: both test users must have an owner membership from provisioning/backfill';
  end if;

  if exists (
    select 1
    from public.organization_members as membership_a
    join public.organization_members as membership_b
      on membership_b.organization_id = membership_a.organization_id
    where membership_a.user_id = user_a_id
      and membership_b.user_id = user_b_id
  ) then
    raise exception using
      errcode = 'P0001',
      message = 'RLS TEST STOPPED: the two test users already share an organization, so tenant isolation cannot be tested cleanly';
  end if;

  perform set_config('ait.rls_test.user_a_id', user_a_id::text, true);
  perform set_config('ait.rls_test.user_b_id', user_b_id::text, true);
end;
$guard$;

-- Create two complete, isolated tenant graphs as the SQL Editor's privileged
-- role. Every identifier is transaction-local and every row is rolled back.
do $fixtures$
declare
  user_a_id uuid := current_setting('ait.rls_test.user_a_id')::uuid;
  user_b_id uuid := current_setting('ait.rls_test.user_b_id')::uuid;
  organization_a_id uuid := gen_random_uuid();
  organization_b_id uuid := gen_random_uuid();
  connection_a_id uuid := gen_random_uuid();
  connection_b_id uuid := gen_random_uuid();
  contact_a_id uuid := gen_random_uuid();
  contact_b_id uuid := gen_random_uuid();
  conversation_a_id uuid := gen_random_uuid();
  conversation_b_id uuid := gen_random_uuid();
  message_a_id uuid := gen_random_uuid();
  message_b_id uuid := gen_random_uuid();
  consent_a_id uuid := gen_random_uuid();
  consent_b_id uuid := gen_random_uuid();
  template_a_id uuid := gen_random_uuid();
  template_b_id uuid := gen_random_uuid();
begin
  perform set_config('ait.rls_test.organization_a_id', organization_a_id::text, true);
  perform set_config('ait.rls_test.organization_b_id', organization_b_id::text, true);
  perform set_config('ait.rls_test.connection_a_id', connection_a_id::text, true);
  perform set_config('ait.rls_test.connection_b_id', connection_b_id::text, true);
  perform set_config('ait.rls_test.contact_a_id', contact_a_id::text, true);
  perform set_config('ait.rls_test.contact_b_id', contact_b_id::text, true);
  perform set_config('ait.rls_test.conversation_a_id', conversation_a_id::text, true);
  perform set_config('ait.rls_test.conversation_b_id', conversation_b_id::text, true);
  perform set_config('ait.rls_test.message_a_id', message_a_id::text, true);
  perform set_config('ait.rls_test.message_b_id', message_b_id::text, true);
  perform set_config('ait.rls_test.consent_a_id', consent_a_id::text, true);
  perform set_config('ait.rls_test.consent_b_id', consent_b_id::text, true);
  perform set_config('ait.rls_test.template_a_id', template_a_id::text, true);
  perform set_config('ait.rls_test.template_b_id', template_b_id::text, true);

  insert into public.organizations (id, name, created_by)
  values
    (organization_a_id, 'AIT RLS Test Organization A', user_a_id),
    (organization_b_id, 'AIT RLS Test Organization B', user_b_id);

  insert into public.organization_members (organization_id, user_id, role)
  values
    (organization_a_id, user_a_id, 'owner'),
    (organization_b_id, user_b_id, 'owner');

  insert into public.channel_connections (
    id,
    organization_id,
    channel_type,
    provider,
    status,
    external_account_id,
    connected_phone_number,
    display_name
  ) values
    (
      connection_a_id,
      organization_a_id,
      'whatsapp',
      'meta_cloud',
      'connected',
      'ait-rls-account-' || connection_a_id::text,
      '+10000000001',
      'AIT Test Connection A'
    ),
    (
      connection_b_id,
      organization_b_id,
      'whatsapp',
      'meta_cloud',
      'connected',
      'ait-rls-account-' || connection_b_id::text,
      '+10000000002',
      'AIT Test Connection B'
    );

  insert into public.meta_whatsapp_connections (
    channel_connection_id,
    meta_app_id,
    business_portfolio_id,
    waba_id,
    phone_number_id,
    webhook_subscription_status
  ) values
    (
      connection_a_id,
      'test-meta-app-a',
      'test-portfolio-a',
      'test-waba-a',
      'test-phone-' || connection_a_id::text,
      'subscribed'
    ),
    (
      connection_b_id,
      'test-meta-app-b',
      'test-portfolio-b',
      'test-waba-b',
      'test-phone-' || connection_b_id::text,
      'subscribed'
    );

  insert into public.contacts (
    id,
    organization_id,
    channel_connection_id,
    external_contact_id,
    display_name,
    contact_type
  ) values
    (
      contact_a_id,
      organization_a_id,
      connection_a_id,
      'test-contact-' || contact_a_id::text,
      'AIT Test Contact A',
      'customer'
    ),
    (
      contact_b_id,
      organization_b_id,
      connection_b_id,
      'test-contact-' || contact_b_id::text,
      'AIT Test Contact B',
      'customer'
    );

  insert into public.conversations (
    id,
    organization_id,
    channel_connection_id,
    contact_id,
    status,
    unread_count,
    last_message_at
  ) values
    (
      conversation_a_id,
      organization_a_id,
      connection_a_id,
      contact_a_id,
      'open',
      1,
      now()
    ),
    (
      conversation_b_id,
      organization_b_id,
      connection_b_id,
      contact_b_id,
      'open',
      1,
      now()
    );

  insert into public.messages (
    id,
    organization_id,
    channel_connection_id,
    conversation_id,
    provider_message_id,
    direction,
    sender_type,
    message_type,
    text_body,
    delivery_status,
    provider_timestamp
  ) values
    (
      message_a_id,
      organization_a_id,
      connection_a_id,
      conversation_a_id,
      'test-provider-' || message_a_id::text,
      'inbound',
      'customer',
      'text',
      'Trusted fixture A',
      'received',
      now()
    ),
    (
      message_b_id,
      organization_b_id,
      connection_b_id,
      conversation_b_id,
      'test-provider-' || message_b_id::text,
      'inbound',
      'customer',
      'text',
      'Trusted fixture B',
      'received',
      now()
    );

  insert into public.customer_consents (
    id,
    organization_id,
    contact_id,
    topic,
    status,
    source,
    consented_at
  ) values
    (
      consent_a_id,
      organization_a_id,
      contact_a_id,
      'ait_rls_test',
      'granted',
      'security_test',
      now()
    ),
    (
      consent_b_id,
      organization_b_id,
      contact_b_id,
      'ait_rls_test',
      'granted',
      'security_test',
      now()
    );

  insert into public.channel_message_templates (
    id,
    organization_id,
    channel_connection_id,
    provider,
    provider_template_id,
    name,
    language,
    category,
    approval_status,
    template_definition
  ) values
    (
      template_a_id,
      organization_a_id,
      connection_a_id,
      'meta_cloud',
      'test-template-' || template_a_id::text,
      'ait_rls_test_a',
      'en',
      'utility',
      'approved',
      '{"body":"test A"}'::jsonb
    ),
    (
      template_b_id,
      organization_b_id,
      connection_b_id,
      'meta_cloud',
      'test-template-' || template_b_id::text,
      'ait_rls_test_b',
      'en',
      'utility',
      'approved',
      '{"body":"test B"}'::jsonb
    );
end;
$fixtures$;

-- Anonymous JWT: role=anon and no subject. The database role and claims mirror
-- a PostgREST request made with the public anonymous key.
do $anon_claims$
begin
  perform set_config(
    'request.jwt.claims',
    jsonb_build_object(
      'role', 'anon',
      'iss', 'supabase',
      'aud', 'authenticated'
    )::text,
    true
  );
  perform set_config('request.jwt.claim.sub', '', true);
  perform set_config('request.jwt.claim.role', 'anon', true);
end;
$anon_claims$;

set local role anon;

do $anonymous_cannot_read$
declare
  table_name text;
  read_was_denied boolean;
begin
  foreach table_name in array array[
    'profiles',
    'organizations',
    'organization_members',
    'channel_connections',
    'meta_whatsapp_connections',
    'contacts',
    'conversations',
    'messages',
    'customer_consents',
    'channel_message_templates'
  ]
  loop
    read_was_denied := false;

    begin
      execute format('select 1 from public.%I limit 1', table_name);
    exception
      when insufficient_privilege then
        read_was_denied := true;
    end;

    if not read_was_denied then
      raise exception using
        errcode = 'P0001',
        message = format(
          'RLS TEST FAILED: anonymous role could read public.%I',
          table_name
        );
    end if;
  end loop;
end;
$anonymous_cannot_read$;

reset role;

-- Authenticated JWT for User A. request.jwt.claims is the current PostgREST
-- representation; the individual claim settings keep auth.uid() compatible
-- with Supabase installations that still read the legacy setting.
do $user_a_claims$
declare
  user_a_id text := current_setting('ait.rls_test.user_a_id');
begin
  perform set_config(
    'request.jwt.claims',
    jsonb_build_object(
      'sub', user_a_id,
      'role', 'authenticated',
      'email', 'ilgize7+ait-old-test@gmail.com',
      'iss', 'supabase',
      'aud', 'authenticated',
      'aal', 'aal1'
    )::text,
    true
  );
  perform set_config('request.jwt.claim.sub', user_a_id, true);
  perform set_config('request.jwt.claim.role', 'authenticated', true);
end;
$user_a_claims$;

set local role authenticated;

do $user_a_isolation$
declare
  user_a_id uuid := current_setting('ait.rls_test.user_a_id')::uuid;
  user_b_id uuid := current_setting('ait.rls_test.user_b_id')::uuid;
  organization_a_id uuid := current_setting('ait.rls_test.organization_a_id')::uuid;
  organization_b_id uuid := current_setting('ait.rls_test.organization_b_id')::uuid;
  connection_a_id uuid := current_setting('ait.rls_test.connection_a_id')::uuid;
  connection_b_id uuid := current_setting('ait.rls_test.connection_b_id')::uuid;
  contact_a_id uuid := current_setting('ait.rls_test.contact_a_id')::uuid;
  contact_b_id uuid := current_setting('ait.rls_test.contact_b_id')::uuid;
  conversation_a_id uuid := current_setting('ait.rls_test.conversation_a_id')::uuid;
  conversation_b_id uuid := current_setting('ait.rls_test.conversation_b_id')::uuid;
  message_a_id uuid := current_setting('ait.rls_test.message_a_id')::uuid;
  message_b_id uuid := current_setting('ait.rls_test.message_b_id')::uuid;
  consent_a_id uuid := current_setting('ait.rls_test.consent_a_id')::uuid;
  consent_b_id uuid := current_setting('ait.rls_test.consent_b_id')::uuid;
  template_a_id uuid := current_setting('ait.rls_test.template_a_id')::uuid;
  template_b_id uuid := current_setting('ait.rls_test.template_b_id')::uuid;
begin
  if auth.uid() is distinct from user_a_id then
    raise exception 'RLS TEST FAILED: User A JWT did not produce the expected auth.uid()';
  end if;

  if not exists (select 1 from public.profiles where id = user_a_id)
    or not exists (select 1 from public.organizations where id = organization_a_id)
    or not exists (
      select 1
      from public.organization_members
      where organization_id = organization_a_id
        and user_id = user_a_id
        and role = 'owner'
    )
    or not exists (select 1 from public.channel_connections where id = connection_a_id)
    or not exists (
      select 1
      from public.meta_whatsapp_connections
      where channel_connection_id = connection_a_id
    )
    or not exists (select 1 from public.contacts where id = contact_a_id)
    or not exists (select 1 from public.conversations where id = conversation_a_id)
    or not exists (select 1 from public.messages where id = message_a_id)
    or not exists (select 1 from public.customer_consents where id = consent_a_id)
    or not exists (select 1 from public.channel_message_templates where id = template_a_id)
  then
    raise exception 'RLS TEST FAILED: User A could not read their complete tenant fixture';
  end if;

  if exists (select 1 from public.profiles where id = user_b_id)
    or exists (select 1 from public.organizations where id = organization_b_id)
    or exists (
      select 1
      from public.organization_members
      where organization_id = organization_b_id
        and user_id = user_b_id
    )
    or exists (select 1 from public.channel_connections where id = connection_b_id)
    or exists (
      select 1
      from public.meta_whatsapp_connections
      where channel_connection_id = connection_b_id
    )
    or exists (select 1 from public.contacts where id = contact_b_id)
    or exists (select 1 from public.conversations where id = conversation_b_id)
    or exists (select 1 from public.messages where id = message_b_id)
    or exists (select 1 from public.customer_consents where id = consent_b_id)
    or exists (select 1 from public.channel_message_templates where id = template_b_id)
  then
    raise exception 'RLS TEST FAILED: User A could read User B tenant data';
  end if;
end;
$user_a_isolation$;

reset role;

-- Authenticated JWT for User B, followed by the inverse isolation assertions.
do $user_b_claims$
declare
  user_b_id text := current_setting('ait.rls_test.user_b_id');
begin
  perform set_config(
    'request.jwt.claims',
    jsonb_build_object(
      'sub', user_b_id,
      'role', 'authenticated',
      'email', 'ilgize7+ait-new-test@gmail.com',
      'iss', 'supabase',
      'aud', 'authenticated',
      'aal', 'aal1'
    )::text,
    true
  );
  perform set_config('request.jwt.claim.sub', user_b_id, true);
  perform set_config('request.jwt.claim.role', 'authenticated', true);
end;
$user_b_claims$;

set local role authenticated;

do $user_b_isolation$
declare
  user_a_id uuid := current_setting('ait.rls_test.user_a_id')::uuid;
  user_b_id uuid := current_setting('ait.rls_test.user_b_id')::uuid;
  organization_a_id uuid := current_setting('ait.rls_test.organization_a_id')::uuid;
  organization_b_id uuid := current_setting('ait.rls_test.organization_b_id')::uuid;
  connection_a_id uuid := current_setting('ait.rls_test.connection_a_id')::uuid;
  connection_b_id uuid := current_setting('ait.rls_test.connection_b_id')::uuid;
  contact_a_id uuid := current_setting('ait.rls_test.contact_a_id')::uuid;
  contact_b_id uuid := current_setting('ait.rls_test.contact_b_id')::uuid;
  conversation_a_id uuid := current_setting('ait.rls_test.conversation_a_id')::uuid;
  conversation_b_id uuid := current_setting('ait.rls_test.conversation_b_id')::uuid;
  message_a_id uuid := current_setting('ait.rls_test.message_a_id')::uuid;
  message_b_id uuid := current_setting('ait.rls_test.message_b_id')::uuid;
  consent_a_id uuid := current_setting('ait.rls_test.consent_a_id')::uuid;
  consent_b_id uuid := current_setting('ait.rls_test.consent_b_id')::uuid;
  template_a_id uuid := current_setting('ait.rls_test.template_a_id')::uuid;
  template_b_id uuid := current_setting('ait.rls_test.template_b_id')::uuid;
begin
  if auth.uid() is distinct from user_b_id then
    raise exception 'RLS TEST FAILED: User B JWT did not produce the expected auth.uid()';
  end if;

  if not exists (select 1 from public.profiles where id = user_b_id)
    or not exists (select 1 from public.organizations where id = organization_b_id)
    or not exists (
      select 1
      from public.organization_members
      where organization_id = organization_b_id
        and user_id = user_b_id
        and role = 'owner'
    )
    or not exists (select 1 from public.channel_connections where id = connection_b_id)
    or not exists (
      select 1
      from public.meta_whatsapp_connections
      where channel_connection_id = connection_b_id
    )
    or not exists (select 1 from public.contacts where id = contact_b_id)
    or not exists (select 1 from public.conversations where id = conversation_b_id)
    or not exists (select 1 from public.messages where id = message_b_id)
    or not exists (select 1 from public.customer_consents where id = consent_b_id)
    or not exists (select 1 from public.channel_message_templates where id = template_b_id)
  then
    raise exception 'RLS TEST FAILED: User B could not read their complete tenant fixture';
  end if;

  if exists (select 1 from public.profiles where id = user_a_id)
    or exists (select 1 from public.organizations where id = organization_a_id)
    or exists (
      select 1
      from public.organization_members
      where organization_id = organization_a_id
        and user_id = user_a_id
    )
    or exists (select 1 from public.channel_connections where id = connection_a_id)
    or exists (
      select 1
      from public.meta_whatsapp_connections
      where channel_connection_id = connection_a_id
    )
    or exists (select 1 from public.contacts where id = contact_a_id)
    or exists (select 1 from public.conversations where id = conversation_a_id)
    or exists (select 1 from public.messages where id = message_a_id)
    or exists (select 1 from public.customer_consents where id = consent_a_id)
    or exists (select 1 from public.channel_message_templates where id = template_a_id)
  then
    raise exception 'RLS TEST FAILED: User B could read User A tenant data';
  end if;
end;
$user_b_isolation$;

reset role;

-- Return to User A to test permitted and forbidden browser writes.
do $user_a_write_claims$
declare
  user_a_id text := current_setting('ait.rls_test.user_a_id');
begin
  perform set_config(
    'request.jwt.claims',
    jsonb_build_object(
      'sub', user_a_id,
      'role', 'authenticated',
      'email', 'ilgize7+ait-old-test@gmail.com',
      'iss', 'supabase',
      'aud', 'authenticated',
      'aal', 'aal1'
    )::text,
    true
  );
  perform set_config('request.jwt.claim.sub', user_a_id, true);
  perform set_config('request.jwt.claim.role', 'authenticated', true);
end;
$user_a_write_claims$;

set local role authenticated;

do $user_a_write_rules$
declare
  user_a_id uuid := current_setting('ait.rls_test.user_a_id')::uuid;
  organization_a_id uuid := current_setting('ait.rls_test.organization_a_id')::uuid;
  organization_b_id uuid := current_setting('ait.rls_test.organization_b_id')::uuid;
  connection_a_id uuid := current_setting('ait.rls_test.connection_a_id')::uuid;
  connection_b_id uuid := current_setting('ait.rls_test.connection_b_id')::uuid;
  contact_a_id uuid := current_setting('ait.rls_test.contact_a_id')::uuid;
  contact_b_id uuid := current_setting('ait.rls_test.contact_b_id')::uuid;
  conversation_a_id uuid := current_setting('ait.rls_test.conversation_a_id')::uuid;
  conversation_b_id uuid := current_setting('ait.rls_test.conversation_b_id')::uuid;
  message_a_id uuid := current_setting('ait.rls_test.message_a_id')::uuid;
  template_a_id uuid := current_setting('ait.rls_test.template_a_id')::uuid;
  valid_outbound_id uuid := gen_random_uuid();
  blocked boolean;
  affected_rows integer;
begin
  -- Owners/managers may enqueue only a human outbound message in pending state.
  insert into public.messages (
    id,
    organization_id,
    channel_connection_id,
    conversation_id,
    direction,
    sender_type,
    message_type,
    text_body,
    delivery_status
  ) values (
    valid_outbound_id,
    organization_a_id,
    connection_a_id,
    conversation_a_id,
    'outbound',
    'manager',
    'text',
    'Permitted pending human message',
    'pending'
  );

  if not exists (
    select 1
    from public.messages
    where id = valid_outbound_id
      and provider_message_id is null
      and provider_timestamp is null
      and delivery_status = 'pending'
  ) then
    raise exception 'RLS TEST FAILED: permitted pending human outbound insert did not work';
  end if;

  blocked := false;
  begin
    insert into public.messages (
      id,
      organization_id,
      channel_connection_id,
      conversation_id,
      direction,
      sender_type,
      message_type,
      text_body,
      delivery_status
    ) values (
      gen_random_uuid(),
      organization_a_id,
      connection_a_id,
      conversation_a_id,
      'inbound',
      'customer',
      'text',
      'Fabricated inbound message',
      'received'
    );
  exception
    when insufficient_privilege then blocked := true;
  end;
  if not blocked then
    raise exception 'RLS TEST FAILED: browser user fabricated an inbound message';
  end if;

  blocked := false;
  begin
    insert into public.messages (
      id,
      organization_id,
      channel_connection_id,
      conversation_id,
      direction,
      sender_type,
      message_type,
      delivery_status
    ) values (
      gen_random_uuid(),
      organization_a_id,
      connection_a_id,
      conversation_a_id,
      'outbound',
      'manager',
      'text',
      'sent'
    );
  exception
    when insufficient_privilege then blocked := true;
  end;
  if not blocked then
    raise exception 'RLS TEST FAILED: browser user fabricated a provider delivery state';
  end if;

  blocked := false;
  begin
    insert into public.messages (
      id,
      organization_id,
      channel_connection_id,
      conversation_id,
      provider_message_id,
      direction,
      sender_type,
      message_type,
      delivery_status
    ) values (
      gen_random_uuid(),
      organization_a_id,
      connection_a_id,
      conversation_a_id,
      'fake-provider-message-id',
      'outbound',
      'manager',
      'text',
      'pending'
    );
  exception
    when insufficient_privilege then blocked := true;
  end;
  if not blocked then
    raise exception 'RLS TEST FAILED: browser user fabricated a provider message ID';
  end if;

  blocked := false;
  begin
    insert into public.messages (
      id,
      organization_id,
      channel_connection_id,
      conversation_id,
      direction,
      sender_type,
      message_type,
      delivery_status,
      provider_timestamp
    ) values (
      gen_random_uuid(),
      organization_a_id,
      connection_a_id,
      conversation_a_id,
      'outbound',
      'manager',
      'text',
      'pending',
      now()
    );
  exception
    when insufficient_privilege then blocked := true;
  end;
  if not blocked then
    raise exception 'RLS TEST FAILED: browser user fabricated a provider timestamp';
  end if;

  blocked := false;
  begin
    update public.messages
    set delivery_status = 'delivered',
        provider_message_id = 'fake-provider-update'
    where id = message_a_id;
  exception
    when insufficient_privilege then blocked := true;
  end;
  if not blocked then
    raise exception 'RLS TEST FAILED: browser user changed provider-controlled message fields';
  end if;

  blocked := false;
  begin
    update public.meta_whatsapp_connections
    set waba_id = 'fabricated-waba-id'
    where channel_connection_id = connection_a_id;
  exception
    when insufficient_privilege then blocked := true;
  end;
  if not blocked then
    raise exception 'RLS TEST FAILED: browser user changed Meta-specific identifiers';
  end if;

  blocked := false;
  begin
    update public.channel_message_templates
    set approval_status = 'fabricated_approved'
    where id = template_a_id;
  exception
    when insufficient_privilege then blocked := true;
  end;
  if not blocked then
    raise exception 'RLS TEST FAILED: browser user changed template approval state';
  end if;

  -- Direct writes into User B's tenant are denied by RLS.
  blocked := false;
  begin
    insert into public.contacts (
      id,
      organization_id,
      channel_connection_id,
      external_contact_id,
      display_name
    ) values (
      gen_random_uuid(),
      organization_b_id,
      connection_b_id,
      'cross-tenant-contact-' || gen_random_uuid()::text,
      'Cross-tenant insert'
    );
  exception
    when insufficient_privilege then blocked := true;
  end;
  if not blocked then
    raise exception 'RLS TEST FAILED: User A inserted a contact into User B tenant';
  end if;

  blocked := false;
  begin
    insert into public.messages (
      id,
      organization_id,
      channel_connection_id,
      conversation_id,
      direction,
      sender_type,
      message_type,
      delivery_status
    ) values (
      gen_random_uuid(),
      organization_b_id,
      connection_b_id,
      conversation_b_id,
      'outbound',
      'manager',
      'text',
      'pending'
    );
  exception
    when insufficient_privilege then blocked := true;
  end;
  if not blocked then
    raise exception 'RLS TEST FAILED: User A inserted a message into User B tenant';
  end if;

  update public.contacts
  set display_name = 'Cross-tenant update'
  where id = contact_b_id;
  get diagnostics affected_rows = row_count;
  if affected_rows <> 0 then
    raise exception 'RLS TEST FAILED: User A updated User B contact';
  end if;

  -- Moving an otherwise writable row across tenants is blocked by column grants
  -- and remains blocked by the policy WITH CHECK if that grant changes later.
  blocked := false;
  begin
    update public.contacts
    set organization_id = organization_b_id
    where id = contact_a_id;
  exception
    when insufficient_privilege then blocked := true;
  end;
  if not blocked then
    raise exception 'RLS TEST FAILED: User A moved a contact across organizations';
  end if;

  -- Composite foreign keys reject a mixed-tenant graph even though the actor
  -- is authorized for the organization_id supplied to the RLS policy.
  blocked := false;
  begin
    insert into public.contacts (
      id,
      organization_id,
      channel_connection_id,
      external_contact_id,
      display_name
    ) values (
      gen_random_uuid(),
      organization_a_id,
      connection_b_id,
      'mixed-tenant-contact-' || gen_random_uuid()::text,
      'Mixed-tenant foreign key test'
    );
  exception
    when foreign_key_violation then blocked := true;
  end;
  if not blocked then
    raise exception 'RLS TEST FAILED: a cross-organization contact/connection graph was inserted';
  end if;

  -- The deferred owner constraint must reject both demotion and deletion of an
  -- organization's final owner. Forcing it IMMEDIATE tests the commit-time rule
  -- inside a recoverable PL/pgSQL subtransaction.
  blocked := false;
  begin
    update public.organization_members
    set role = 'manager'
    where organization_id = organization_a_id
      and user_id = user_a_id;
    get diagnostics affected_rows = row_count;
    if affected_rows <> 1 then
      raise exception 'RLS TEST FAILED: final-owner demotion setup did not affect exactly one row';
    end if;
    set constraints organization_members_require_owner immediate;
  exception
    when check_violation or insufficient_privilege then blocked := true;
  end;
  set constraints organization_members_require_owner deferred;
  if not blocked then
    raise exception 'RLS TEST FAILED: final organization owner was demoted';
  end if;

  if not exists (
    select 1
    from public.organization_members
    where organization_id = organization_a_id
      and user_id = user_a_id
      and role = 'owner'
  ) then
    raise exception 'RLS TEST FAILED: failed demotion did not restore the owner membership';
  end if;

  blocked := false;
  begin
    delete from public.organization_members
    where organization_id = organization_a_id
      and user_id = user_a_id;
    get diagnostics affected_rows = row_count;
    if affected_rows <> 1 then
      raise exception 'RLS TEST FAILED: final-owner deletion setup did not affect exactly one row';
    end if;
    set constraints organization_members_require_owner immediate;
  exception
    when check_violation or insufficient_privilege then blocked := true;
  end;
  set constraints organization_members_require_owner deferred;
  if not blocked then
    raise exception 'RLS TEST FAILED: final organization owner was removed';
  end if;

  if not exists (
    select 1
    from public.organization_members
    where organization_id = organization_a_id
      and user_id = user_a_id
      and role = 'owner'
  ) then
    raise exception 'RLS TEST FAILED: failed deletion did not restore the owner membership';
  end if;
end;
$user_a_write_rules$;

reset role;

-- Build a temporary shared organization only after the two-way profile and
-- tenant-isolation checks. User A is a plain member and User B is its owner.
do $member_fixture$
declare
  user_a_id uuid := current_setting('ait.rls_test.user_a_id')::uuid;
  user_b_id uuid := current_setting('ait.rls_test.user_b_id')::uuid;
  member_organization_id uuid := gen_random_uuid();
  member_connection_id uuid := gen_random_uuid();
  member_contact_id uuid := gen_random_uuid();
  member_conversation_id uuid := gen_random_uuid();
begin
  perform set_config('ait.rls_test.member_organization_id', member_organization_id::text, true);
  perform set_config('ait.rls_test.member_connection_id', member_connection_id::text, true);
  perform set_config('ait.rls_test.member_contact_id', member_contact_id::text, true);
  perform set_config('ait.rls_test.member_conversation_id', member_conversation_id::text, true);

  insert into public.organizations (id, name, created_by)
  values (member_organization_id, 'AIT RLS Member-Role Test', user_b_id);

  insert into public.organization_members (organization_id, user_id, role)
  values
    (member_organization_id, user_b_id, 'owner'),
    (member_organization_id, user_a_id, 'member');

  insert into public.channel_connections (
    id,
    organization_id,
    channel_type,
    provider,
    status
  ) values (
    member_connection_id,
    member_organization_id,
    'whatsapp',
    'meta_cloud',
    'connected'
  );

  insert into public.contacts (
    id,
    organization_id,
    channel_connection_id,
    external_contact_id,
    display_name
  ) values (
    member_contact_id,
    member_organization_id,
    member_connection_id,
    'member-test-contact-' || member_contact_id::text,
    'Member-role test contact'
  );

  insert into public.conversations (
    id,
    organization_id,
    channel_connection_id,
    contact_id
  ) values (
    member_conversation_id,
    member_organization_id,
    member_connection_id,
    member_contact_id
  );
end;
$member_fixture$;

do $member_claims$
declare
  user_a_id text := current_setting('ait.rls_test.user_a_id');
begin
  perform set_config(
    'request.jwt.claims',
    jsonb_build_object(
      'sub', user_a_id,
      'role', 'authenticated',
      'email', 'ilgize7+ait-old-test@gmail.com',
      'iss', 'supabase',
      'aud', 'authenticated',
      'aal', 'aal1'
    )::text,
    true
  );
  perform set_config('request.jwt.claim.sub', user_a_id, true);
  perform set_config('request.jwt.claim.role', 'authenticated', true);
end;
$member_claims$;

set local role authenticated;

do $member_cannot_escalate_or_send$
declare
  user_a_id uuid := current_setting('ait.rls_test.user_a_id')::uuid;
  member_organization_id uuid := current_setting('ait.rls_test.member_organization_id')::uuid;
  member_connection_id uuid := current_setting('ait.rls_test.member_connection_id')::uuid;
  member_conversation_id uuid := current_setting('ait.rls_test.member_conversation_id')::uuid;
  affected_rows integer;
  blocked boolean := false;
begin
  update public.organization_members
  set role = 'manager'
  where organization_id = member_organization_id
    and user_id = user_a_id;
  get diagnostics affected_rows = row_count;
  if affected_rows <> 0 then
    raise exception 'RLS TEST FAILED: member promoted themselves to manager';
  end if;

  update public.organization_members
  set role = 'owner'
  where organization_id = member_organization_id
    and user_id = user_a_id;
  get diagnostics affected_rows = row_count;
  if affected_rows <> 0 then
    raise exception 'RLS TEST FAILED: member promoted themselves to owner';
  end if;

  if not exists (
    select 1
    from public.organization_members
    where organization_id = member_organization_id
      and user_id = user_a_id
      and role = 'member'
  ) then
    raise exception 'RLS TEST FAILED: self-promotion attempts changed the member role';
  end if;

  begin
    insert into public.messages (
      id,
      organization_id,
      channel_connection_id,
      conversation_id,
      direction,
      sender_type,
      message_type,
      text_body,
      delivery_status
    ) values (
      gen_random_uuid(),
      member_organization_id,
      member_connection_id,
      member_conversation_id,
      'outbound',
      'manager',
      'text',
      'A plain member must not enqueue this',
      'pending'
    );
  exception
    when insufficient_privilege then blocked := true;
  end;
  if not blocked then
    raise exception 'RLS TEST FAILED: plain member enqueued a human outbound message';
  end if;
end;
$member_cannot_escalate_or_send$;

reset role;

-- This SELECT is reached only if every assertion above passed. It appears
-- before ROLLBACK so an unexpected error cannot be followed by a false success.
select
  'AIT RLS ISOLATION TEST PASSED: all security assertions succeeded; all test records will be rolled back.'
  as result;

rollback;
