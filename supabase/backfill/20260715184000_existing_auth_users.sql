-- Manual, idempotent backfill for auth users created before Phase 1 migrations.
-- Review and run only after every migration has succeeded. This is not a migration
-- and has not been executed against any Supabase project.

begin;

insert into public.profiles (id, full_name)
select
  auth_user.id,
  nullif(
    left(
      btrim(coalesce(auth_user.raw_user_meta_data ->> 'full_name', '')),
      200
    ),
    ''
  )
from auth.users as auth_user
on conflict (id) do nothing;

do $$
declare
  auth_user record;
  new_organization_id uuid;
  organization_name text;
begin
  for auth_user in
    select
      existing_user.id,
      nullif(
        left(
          btrim(coalesce(existing_user.raw_user_meta_data ->> 'full_name', '')),
          200
        ),
        ''
      ) as full_name
    from auth.users as existing_user
    where not exists (
      select 1
      from public.organization_members as membership
      where membership.user_id = existing_user.id
    )
    order by existing_user.created_at, existing_user.id
  loop
    organization_name := coalesce(
      left(auth_user.full_name || '''s Organization', 200),
      'My Organization'
    );

    insert into public.organizations (name, created_by)
    values (organization_name, auth_user.id)
    returning id into new_organization_id;

    insert into public.organization_members (
      organization_id,
      user_id,
      role
    ) values (
      new_organization_id,
      auth_user.id,
      'owner'
    );
  end loop;
end;
$$;

commit;
