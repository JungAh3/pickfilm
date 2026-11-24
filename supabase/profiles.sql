begin;

create table if not exists public.profiles (
  id uuid primary key references auth.users (id) on delete cascade,
  name text,
  email text,
  created_at timestamptz not null default now()
);

alter table public.profiles enable row level security;

-- Unexpected policies can broaden access. Review them before applying this file.
do $$
begin
  if exists (
    select 1
    from pg_catalog.pg_policies
    where schemaname = 'public'
      and tablename = 'profiles'
      and policyname <> 'pickfilm_profiles_select_own'
  ) then
    raise exception 'Unexpected policies on public.profiles. Review them first.';
  end if;
end;
$$;

revoke all on table public.profiles from public, anon, authenticated;
grant select on table public.profiles to authenticated;

drop policy if exists pickfilm_profiles_select_own on public.profiles;
create policy pickfilm_profiles_select_own on public.profiles
  for select to authenticated
  using ((select auth.uid()) = id);

create or replace function public.pickfilm_create_profile()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  insert into public.profiles (id, name, email, created_at)
  values (
    new.id,
    nullif(btrim(new.raw_user_meta_data ->> 'name'), ''),
    nullif(btrim(new.email), ''),
    coalesce(new.created_at, now())
  )
  on conflict (id) do nothing;

  return new;
end;
$$;

revoke execute on function public.pickfilm_create_profile() from public, anon, authenticated;

drop trigger if exists pickfilm_create_profile_after_signup on auth.users;
create trigger pickfilm_create_profile_after_signup
  after insert on auth.users
  for each row execute function public.pickfilm_create_profile();

-- Install the trigger before filling in accounts that already exist.
insert into public.profiles (id, name, email, created_at)
select
  id,
  nullif(btrim(raw_user_meta_data ->> 'name'), ''),
  nullif(btrim(email), ''),
  coalesce(created_at, now())
from auth.users
on conflict (id) do nothing;

commit;
