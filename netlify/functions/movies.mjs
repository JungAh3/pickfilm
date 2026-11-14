import { movieCandidates } from '../../src/data/movie-candidates.js';

async function loadMovie(candidate, token) {
  const url = new URL(
    `https://api.themoviedb.org/3/movie/${candidate.tmdbId}`,
  );

  url.searchParams.set('language', 'ko-KR');
  url.searchParams.set('append_to_response', 'watch/providers');

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

  const movie = await response.json();
  const korea = movie['watch/providers']?.results?.KR;

  // 한국의 구독형 제공처만 사용합니다.
  // 대여·구매 상품은 포함하지 않습니다.
  const providers = [
    ...new Map(
      (korea?.flatrate ?? []).map((provider) => [
        provider.provider_id,
        {
          id: provider.provider_id,
          name: provider.provider_name,
          logoUrl: provider.logo_path
            ? `https://image.tmdb.org/t/p/w92${provider.logo_path}`
            : null,
        },
      ]),
    ).values(),
  ];

  return {
    id: movie.id,
    title: movie.title,
    overview: movie.overview,
    runtime: movie.runtime,
    releaseDate: movie.release_date,
    rating: movie.vote_average,
    voteCount: movie.vote_count,
    genres: movie.genres,
    posterUrl: movie.poster_path
      ? `https://image.tmdb.org/t/p/w500${movie.poster_path}`
      : null,

    availability: {
      region: 'KR',
      subscriptionListed: providers.length > 0,
      status: providers.length > 0 ? 'listed' : 'not_listed',
      providers,
      watchLink: korea?.link ?? null,
      checkedAt: new Date().toISOString(),
      source: 'TMDB / JustWatch',
    },
  };
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
      { message: '.env의 TMDB_READ_TOKEN을 확인해 주세요.' },
      { status: 500 },
    );
  }

  const results = await Promise.allSettled(
    movieCandidates.map((candidate) =>
      loadMovie(candidate, token),
    ),
  );

  const movies = [];
  const failedIds = [];

  results.forEach((result, index) => {
    if (result.status === 'fulfilled') {
      movies.push(result.value);
    } else {
      failedIds.push(movieCandidates[index].tmdbId);
    }
  });

  if (movies.length === 0) {
    return Response.json(
      {
        message: '영화 정보를 가져오지 못했습니다.',
        failedIds,
      },
      { status: 502 },
    );
  }

  return Response.json({
    movies,
    total: movies.length,
    subscriptionListedCount: movies.filter(
      (movie) => movie.availability.subscriptionListed,
    ).length,
    failedIds,
    attribution: {
      movieData: 'TMDB',
      watchProviders: 'JustWatch',
    },
  });
}