-- Minimal manager-verified business knowledge for knowledge-grounded AI replies.

create table if not exists public.organization_knowledge (
  organization_id uuid primary key
    references public.organizations(id) on delete cascade,
  content text not null default ''
    check (char_length(content) <= 30000),
  updated_by uuid references auth.users(id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table public.organization_knowledge enable row level security;

drop policy if exists organization_knowledge_select_member
  on public.organization_knowledge;
create policy organization_knowledge_select_member
on public.organization_knowledge
for select
to authenticated
using (public.ait_is_organization_member(organization_id));

drop policy if exists organization_knowledge_insert_manager
  on public.organization_knowledge;
create policy organization_knowledge_insert_manager
on public.organization_knowledge
for insert
to authenticated
with check (
  public.ait_has_organization_role(
    organization_id,
    array['owner', 'manager']::public.organization_member_role[]
  )
  and updated_by = (select auth.uid())
);

drop policy if exists organization_knowledge_update_manager
  on public.organization_knowledge;
create policy organization_knowledge_update_manager
on public.organization_knowledge
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
  and updated_by = (select auth.uid())
);

revoke all on table public.organization_knowledge
  from public, anon, authenticated;
grant select, insert on table public.organization_knowledge to authenticated;
grant update (content, updated_by, updated_at)
  on table public.organization_knowledge to authenticated;

comment on table public.organization_knowledge is
  'One manager-verified business knowledge document per organization for the time-boxed MVP.';
