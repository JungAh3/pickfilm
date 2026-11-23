import { createClient } from '@supabase/supabase-js';
import { movieCandidates } from '../src/data/movie-candidates.js';
import { movieTags } from '../src/data/movie-tags.js';

function requiredEnv(name) {
  const value = process.env[name]?.trim();

  if (!value) {
    throw new Error(`.env에 ${name} 설정이 필요합니다.`);
  }

  return value;
}

async function main() {
  const supabaseUrl = requiredEnv('SUPABASE_URL');
  const secretKey = requiredEnv('SUPABASE_SECRET_KEY');
  const tmdbToken = requiredEnv('TMDB_READ_TOKEN');

  let parsedUrl;

  try {
    parsedUrl = new URL(supabaseUrl);
  } catch {
    throw new Error('SUPABASE_URL 형식을 확인해 주세요.');
  }

  if (parsedUrl.protocol !== 'https:') {
    throw new Error('SUPABASE_URL은 https:// 주소여야 합니다.');
  }

  const db = createClient(supabaseUrl, secretKey, {
    auth: {
      persistSession: false,
      autoRefreshToken: false,
      detectSessionInUrl: false,
    },
  });

  const candidates = [
    ...new Map(
      movieCandidates.map((movie) => [movie.tmdbId, movie]),
    ).values(),
  ];

  for (const candidate of candidates) {
    if (!movieTags[candidate.tmdbId]) {
      throw new Error(`감상 태그가 없습니다: ID ${candidate.tmdbId}`);
    }
  }

  const rows = [];

  // 동시에 최대 4편씩 조회합니다.
  for (let start = 0; start < candidates.length; start += 4) {
    const batch = candidates.slice(start, start + 4);

    const loaded = await Promise.all(
      batch.map(async (candidate) => {
        const url = new URL(
          `https://api.themoviedb.org/3/movie/${candidate.tmdbId}`,
        );

        url.searchParams.set('language', 'ko-KR');
        url.searchParams.set('append_to_response', 'watch/providers');

        const response = await fetch(url, {
          headers: {
            Authorization: `Bearer ${tmdbToken}`,
            Accept: 'application/json',
          },
          signal: AbortSignal.timeout(20000),
        });

        if (!response.ok) {
          throw new Error(
            `TMDB 조회 실패: ID ${candidate.tmdbId}, 상태 ${response.status}`,
          );
        }

        const movie = await response.json();
        const watchData = movie['watch/providers'];

        // 제공처 조회가 실패한 응답을 빈 목록으로 저장하지 않습니다.
        if (
          !watchData ||
          typeof watchData.results !== 'object' ||
          watchData.results === null
        ) {
          throw new Error(
            `제공처 응답을 확인하지 못했습니다: ID ${candidate.tmdbId}`,
          );
        }

        const korea = watchData.results.KR;
        const checkedAt = new Date().toISOString();

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
          overview: movie.overview ?? '',
          runtime: movie.runtime > 0 ? movie.runtime : null,
          release_date: movie.release_date || null,
          rating: movie.vote_average ?? 0,
          vote_count: movie.vote_count ?? 0,
          genres: movie.genres ?? [],
          poster_url: movie.poster_path
            ? `https://image.tmdb.org/t/p/w500${movie.poster_path}`
            : null,
          providers,
          watch_link: korea?.link ?? null,
          metadata_updated_at: checkedAt,
          availability_checked_at: checkedAt,
        };
      }),
    );

    rows.push(...loaded);
    console.log(`영화 조회: ${rows.length}/${candidates.length}`);
  }

  // 전체 조회가 성공한 뒤 DB 저장을 시작합니다.
  const { error: movieError } = await db
    .from('movies')
    .upsert(rows, { onConflict: 'id' });

  if (movieError) {
    throw new Error(
      `movies 저장 실패: ${movieError.code ?? 'DB 연결 확인 필요'}`,
    );
  }

  const tagRows = candidates.map((candidate) => {
    const tags = movieTags[candidate.tmdbId];

    return {
      movie_id: candidate.tmdbId,
      reviewed: tags.reviewed,
      review_basis: tags.reviewBasis ?? '',
      experiences: tags.experiences,
      avoids: tags.avoids,
      reason: tags.reason ?? '',
      content_review: tags.contentReview ?? null,
    };
  });

  // 이미 DB에 있는 태그는 덮어쓰지 않습니다.
  const { error: tagError } = await db
    .from('movie_tags')
    .upsert(tagRows, {
      onConflict: 'movie_id',
      ignoreDuplicates: true,
    });

  if (tagError) {
    throw new Error(
      `movie_tags 저장 실패: ${tagError.code ?? 'DB 연결 확인 필요'}`,
    );
  }

  const ids = candidates.map((candidate) => candidate.tmdbId);

  const movieCheck = await db
    .from('movies')
    .select('id', { count: 'exact', head: true })
    .in('id', ids);

  const tagCheck = await db
    .from('movie_tags')
    .select('movie_id', { count: 'exact', head: true })
    .in('movie_id', ids);

  if (movieCheck.error || tagCheck.error) {
    throw new Error('저장 후 개수 확인에 실패했습니다.');
  }

  if (
    movieCheck.count !== ids.length ||
    tagCheck.count !== ids.length
  ) {
    throw new Error('저장된 영화·태그 개수가 예상과 다릅니다.');
  }

  console.log(`movies 확인: ${movieCheck.count}편`);
  console.log(`movie_tags 확인: ${tagCheck.count}편`);
  console.log('기존 영화와 태그의 DB 이전 완료');
}

main().catch((error) => {
  console.error('이전 실패:', error.message);
  process.exitCode = 1;
});