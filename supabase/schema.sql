begin;

-- TMDB에서 가져오는 영화 정보
create table if not exists public.movies (
  id bigint primary key check (id > 0),
  title text not null check (length(trim(title)) > 0),
  overview text not null default '',
  runtime integer check (runtime > 0),
  release_date date,

  rating numeric not null default 0
    check (rating >= 0 and rating <= 10),

  vote_count integer not null default 0
    check (vote_count >= 0),

  genres jsonb not null default '[]'::jsonb
    check (jsonb_typeof(genres) = 'array'),

  poster_url text,

  providers jsonb not null default '[]'::jsonb
    check (jsonb_typeof(providers) = 'array'),

  watch_link text,

  -- API 조회에 성공한 시각을 수집 코드가 기록합니다.
  metadata_updated_at timestamptz,
  availability_checked_at timestamptz,

  created_at timestamptz not null default now()
);

-- 자동 갱신과 분리해 관리하는 편집 태그
create table if not exists public.movie_tags (
  movie_id bigint primary key
    references public.movies(id) on delete cascade,

  reviewed boolean not null default false,
  review_basis text not null default '',

  experiences jsonb not null default '{}'::jsonb
    check (jsonb_typeof(experiences) = 'object'),

  avoids jsonb not null default '{
    "violence": "unknown",
    "horror": "unknown",
    "slow": "unknown",
    "heavy": "unknown"
  }'::jsonb,

  reason text not null default '',

  content_review jsonb
    check (
      content_review is null
      or jsonb_typeof(content_review) = 'object'
    ),

  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),

  constraint valid_avoid_states check (
    jsonb_typeof(avoids) = 'object'
    and avoids ?& array['violence', 'horror', 'slow', 'heavy']
    and avoids->>'violence' in ('present', 'absent', 'unknown')
    and avoids->>'horror' in ('present', 'absent', 'unknown')
    and avoids->>'slow' in ('present', 'absent', 'unknown')
    and avoids->>'heavy' in ('present', 'absent', 'unknown')
    and not (
      avoids @> '{"violence":null}'::jsonb
      or avoids @> '{"horror":null}'::jsonb
      or avoids @> '{"slow":null}'::jsonb
      or avoids @> '{"heavy":null}'::jsonb
    )
  )
);

-- ブラウザーからの直接アクセスを無効にします。
alter table public.movies enable row level security;
alter table public.movie_tags enable row level security;

revoke all privileges
  on table public.movies, public.movie_tags
  from public, anon, authenticated;

-- Netlifyのサーバー側で使用するロールだけに許可します。
grant usage on schema public to service_role;

grant select, insert, update, delete
  on table public.movies, public.movie_tags
  to service_role;

commit;