import { createClient } from '@supabase/supabase-js';

export default async function handler(request) {
  if (request.method !== 'GET') {
    return Response.json(
      { message: 'GET 요청만 가능합니다.' },
      { status: 405 },
    );
  }

  const url = process.env.SUPABASE_URL?.trim();
  const key = process.env.SUPABASE_SECRET_KEY?.trim();

  if (!url || !key) {
    return Response.json(
      { message: '서버의 Supabase 환경 변수를 확인해 주세요.' },
      { status: 500 },
    );
  }

  try {
    const db = createClient(url, key, {
      auth: {
        persistSession: false,
        autoRefreshToken: false,
        detectSessionInUrl: false,
      },
    });

    const { data, error } = await db
      .from('movies')
      .select('*, movie_tags(*)')
      .order('id');

    if (error) {
      console.error('영화 DB 조회 실패:', error.message, error.details);
      return Response.json(
        { message: '저장된 영화 정보를 가져오지 못했습니다.' },
        { status: 502 },
      );
    }

    const movieTags = {};

    const movies = (data ?? []).map((row) => {
      const tags = Array.isArray(row.movie_tags)
        ? row.movie_tags[0]
        : row.movie_tags;

      if (tags) {
        movieTags[row.id] = {
          reviewed: tags.reviewed,
          reviewBasis: tags.review_basis,
          experiences: tags.experiences,
          avoids: tags.avoids,
          reason: tags.reason,
          contentReview: tags.content_review,
        };
      }

      const providers = row.providers ?? [];

      return {
        id: row.id,
        title: row.title,
        overview: row.overview,
        runtime: row.runtime,
        releaseDate: row.release_date,
        rating: Number(row.rating),
        voteCount: row.vote_count,
        genres: row.genres,
        posterUrl: row.poster_url,

        availability: {
          region: 'KR',
          subscriptionListed: providers.length > 0,
          status: providers.length > 0
            ? 'listed'
            : 'not_listed',
          providers,
          watchLink: row.watch_link,
          checkedAt: row.availability_checked_at,
          source: 'TMDB / JustWatch',
        },
      };
    });

    return Response.json(
      {
        dataSource: 'supabase',
        movies,
        movieTags,
        total: movies.length,
        subscriptionListedCount: movies.filter(
          (movie) => movie.availability.subscriptionListed,
        ).length,
        attribution: {
          movieData: 'TMDB',
          watchProviders: 'JustWatch',
        },
      },
      {
        headers: {
          'Cache-Control': 'no-store',
        },
      },
    );
  } catch {
    return Response.json(
      { message: '영화 DB 연결에 실패했습니다.' },
      { status: 502 },
    );
  }
}