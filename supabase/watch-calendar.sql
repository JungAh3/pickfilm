begin;

alter table public.movie_selections
  add column if not exists experience text
  check (experience in ('refresh', 'comfort', 'laugh', 'thrill', 'linger'));
grant insert (experience) on public.movie_selections to authenticated;

create table if not exists public.watch_entries (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users (id) on delete cascade,
  movie_id bigint not null references public.movies (id) on delete cascade,
  watched_on date not null,
  rating numeric(2,1) check (rating between 0.5 and 5 and mod(rating, 0.5) = 0),
  review text check (char_length(review) <= 500),
  experience text check (experience in ('refresh', 'comfort', 'laugh', 'thrill', 'linger')),
  experience_response text check (
    experience_response is null or
    (experience is not null and experience_response in ('yes', 'somewhat', 'disappointed'))
  ),
  unique (user_id, movie_id, watched_on)
);

create index if not exists watch_entries_user_date_idx on public.watch_entries (user_id, watched_on);
alter table public.watch_entries enable row level security;
revoke all on public.watch_entries from public, anon, authenticated;
grant select, delete on public.watch_entries to authenticated;
grant insert (user_id, movie_id, watched_on, rating, review, experience, experience_response)
  on public.watch_entries to authenticated;
grant update (movie_id, watched_on, rating, review, experience, experience_response)
  on public.watch_entries to authenticated;

drop policy if exists watch_entries_own on public.watch_entries;
create policy watch_entries_own on public.watch_entries
  for all to authenticated
  using ((select auth.uid()) = user_id)
  with check ((select auth.uid()) = user_id);

commit;
