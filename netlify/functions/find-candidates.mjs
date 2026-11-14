import { movieCandidates } from '../../src/data/movie-candidates.js';

async function discoverMovies(filters, token) {
  const url = new URL(
    'https://api.themoviedb.org/3/discover/movie',
  );

  const params = {
    language: 'ko-KR',
    watch_region: 'KR',
    with_watch_monetization_types: 'flatrate',
    include_adult: 'false',
    include_video: 'false',
    'with_runtime.gte': '40',
    'vote_count.gte': '100',
    sort_by: 'popularity.desc',
    page: '1',
    ...filters,
  };

  for (const [key, value] of Object.entries(params)) {
    url.searchParams.set(key, value);
  }

  const response = await fetch(url, {
    headers: {
      Authorization: `Bearer ${token}`,
      Accept: 'application/json',
    },
    signal: AbortSignal.timeout(15000),
  });

  if (!response.ok) {
    throw new Error(`TMDB 응답 오류: ${response.status}`);
  }

  const data = await response.json();
  return data.results ?? [];
}

export default async function handler(request) {
  if (request.method !== 'GET') {
    return Response.json(
      { message: 'GET 요청만 가능합니다.' },
      { status: 405 },
    );
  }

  const token = process.env.TMDB_READ_TOKEN?.trim();

  if (!token) {
    return Response.json(
      { message: 'TMDB_READ_TOKEN을 확인해 주세요.' },
      { status: 500 },
    );
  }

  const searches = [
    {
      name: '90분 이하',
      filters: { 'with_runtime.lte': '90' },
    },
    {
      name: '120분 이하 코미디',
      filters: {
        'with_runtime.lte': '120',
        with_genres: '35',
      },
    },
    {
      name: '120분 이하 드라마',
      filters: {
        'with_runtime.lte': '120',
        with_genres: '18',
      },
    },
  ];

  const results = await Promise.allSettled(
    searches.map((search) =>
      discoverMovies(search.filters, token),
    ),
  );

  const groups = results.map((result) =>
    result.status === 'fulfilled' ? result.value : [],
  );

  const failedSearches = searches
    .filter((_, index) => results[index].status === 'rejected')
    .map((search) => search.name);

  if (failedSearches.length === searches.length) {
    return Response.json(
      { message: '후보 검색에 실패했습니다. 다시 시도해 주세요.' },
      { status: 502 },
    );
  }

  const seen = new Set(
    movieCandidates.map((movie) => movie.tmdbId),
  );

  const candidates = [];

  // 검색 종류를 번갈아 확인해 한쪽으로만 치우치지 않게 합니다.
  for (let index = 0; index < 20 && candidates.length < 17; index++) {
    for (let groupIndex = 0; groupIndex < groups.length; groupIndex++) {
      const movie = groups[groupIndex][index];

      if (!movie || seen.has(movie.id)) continue;
      if (!movie.overview?.trim()) continue;

      seen.add(movie.id);

      candidates.push({
        tmdbId: movie.id,
        title: movie.title,
        foundBy: searches[groupIndex].name,
        overview: movie.overview,
        genreIds: movie.genre_ids,
        rating: movie.vote_average,
        voteCount: movie.vote_count,
      });

      if (candidates.length >= 17) break;
    }
  }

  return Response.json({
    message: '기존 후보와 중복되지 않는 한국 구독형 OTT 검토 후보입니다.',
    source: 'TMDB / JustWatch',
    checkedAt: new Date().toISOString(),
    count: candidates.length,
    failedSearches,
    candidates,
  });
}