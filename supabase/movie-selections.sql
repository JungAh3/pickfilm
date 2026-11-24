begin;

create table if not exists public.movie_selections (
  user_id uuid not null references auth.users (id) on delete cascade,
  movie_id bigint not null references public.movies (id) on delete cascade,
  selected_at timestamptz not null default now(),
  primary key (user_id, movie_id)
);

alter table public.movie_selections enable row level security;
revoke all on table public.movie_selections from public, anon, authenticated;
grant select on table public.movie_selections to authenticated;
grant insert (user_id, movie_id) on table public.movie_selections to authenticated;

drop policy if exists movie_selections_select_own on public.movie_selections;
create policy movie_selections_select_own on public.movie_selections
  for select to authenticated using ((select auth.uid()) = user_id);

drop policy if exists movie_selections_insert_own on public.movie_selections;
create policy movie_selections_insert_own on public.movie_selections
  for insert to authenticated with check ((select auth.uid()) = user_id);

commit;
