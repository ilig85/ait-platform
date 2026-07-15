-- Phase 1: application profiles, organizations, and memberships.
-- Application tables are deny-by-default until the RLS policy migration runs.

create type public.organization_member_role as enum (
  'owner',
  'manager',
  'member'
);

create or replace function public.ait_set_updated_at()
returns trigger
language plpgsql
set search_path = ''
as $$
begin
  new.updated_at = statement_timestamp();
  return new;
end;
$$;

revoke all on function public.ait_set_updated_at() from public, anon, authenticated;

create table public.profiles (
  id uuid primary key references auth.users (id) on delete cascade,
  full_name text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint profiles_full_name_length
    check (full_name is null or char_length(full_name) <= 200)
);

create table public.organizations (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  created_by uuid references auth.users (id) on delete set null,
  default_language text not null default 'en',
  timezone text not null default 'UTC',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint organizations_name_not_blank check (btrim(name) <> ''),
  constraint organizations_name_length check (char_length(name) <= 200),
  constraint organizations_default_language_format
    check (default_language ~ '^[a-z]{2,3}([_-][A-Za-z0-9]{2,8})*$'),
  constraint organizations_timezone_not_blank check (btrim(timezone) <> ''),
  constraint organizations_timezone_length check (char_length(timezone) <= 100)
);

create table public.organization_members (
  organization_id uuid not null
    references public.organizations (id) on delete cascade,
  user_id uuid not null
    references public.profiles (id) on delete cascade,
  role public.organization_member_role not null default 'member',
  created_at timestamptz not null default now(),
  primary key (organization_id, user_id)
);

create index organization_members_user_id_idx
  on public.organization_members (user_id, organization_id);

create trigger profiles_set_updated_at
before update on public.profiles
for each row execute function public.ait_set_updated_at();

create trigger organizations_set_updated_at
before update on public.organizations
for each row execute function public.ait_set_updated_at();

alter table public.profiles enable row level security;
alter table public.organizations enable row level security;
alter table public.organization_members enable row level security;

revoke all on table public.profiles from anon, authenticated;
revoke all on table public.organizations from anon, authenticated;
revoke all on table public.organization_members from anon, authenticated;

comment on table public.profiles is
  'Application profile keyed one-to-one to auth.users.';
comment on table public.organizations is
  'Provider-neutral business workspace and tenant boundary.';
comment on table public.organization_members is
  'User membership and role within an organization.';
