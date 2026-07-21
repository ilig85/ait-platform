-- Organization-scoped AI response mode and idempotent automatic replies.

create table if not exists public.organization_ai_settings (
  organization_id uuid primary key
    references public.organizations(id) on delete cascade,
  response_mode text not null default 'draft'
    check (response_mode in ('draft', 'auto')),
  auto_reply_min_confidence numeric(4, 3) not null default 0.900
    check (auto_reply_min_confidence >= 0 and auto_reply_min_confidence <= 1),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

insert into public.organization_ai_settings (organization_id)
select organization.id
from public.organizations as organization
on conflict (organization_id) do nothing;

alter table public.organization_ai_settings enable row level security;

drop policy if exists organization_ai_settings_select_member
  on public.organization_ai_settings;
create policy organization_ai_settings_select_member
on public.organization_ai_settings
for select
to authenticated
using (public.ait_is_organization_member(organization_id));

drop policy if exists organization_ai_settings_insert_owner
  on public.organization_ai_settings;
create policy organization_ai_settings_insert_owner
on public.organization_ai_settings
for insert
to authenticated
with check (
  public.ait_has_organization_role(
    organization_id,
    array['owner']::public.organization_member_role[]
  )
);

drop policy if exists organization_ai_settings_update_owner
  on public.organization_ai_settings;
create policy organization_ai_settings_update_owner
on public.organization_ai_settings
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

revoke all on table public.organization_ai_settings
  from public, anon, authenticated;
grant select, insert on table public.organization_ai_settings
  to authenticated;
grant update (response_mode, auto_reply_min_confidence, updated_at)
  on table public.organization_ai_settings to authenticated;

-- One inbound provider message can produce at most one automatic AI reply,
-- even if a webhook is retried or a serverless task is restarted.
create unique index if not exists messages_one_ai_reply_per_inbound
  on public.messages (reply_to_message_id)
  where direction = 'outbound'
    and sender_type = 'ai'
    and reply_to_message_id is not null;

comment on table public.organization_ai_settings is
  'Organization-level draft versus confidence-gated automatic AI response mode.';
