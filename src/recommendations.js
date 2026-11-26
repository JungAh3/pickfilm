const genreIds = {
  action: 28,
  comedy: 35,
  thriller: 53,
  romance: 10749,
  drama: 18,
};

export const experienceLabels = {
  refresh: '기분 전환',
  comfort: '위로',
  laugh: '웃음',
  thrill: '몰입과 긴장감',
  linger: '깊은 여운',
};

export function compareRankedMovies(a, b) {
  return b.score - a.score || b.voteCount - a.voteCount || a.id - b.id;
}

export function recommendMovies(
  movies,
  preferences,
  tagsById,
  excludedIds = [],
) {
  const excluded = new Set(excludedIds.map(String));

  const selectedProviders = new Set(
    (preferences.providerIds ?? []).map(String),
  );

  const selectedGenreId = genreIds[preferences.genre];

  let reviewCandidateCount = 0;
  let reviewKnownCount = 0;
  const ranked = movies
    .filter((movie) => {
      const tags = tagsById[movie.id];
      const providers = movie.availability?.providers ?? [];

      if (!movie.availability?.subscriptionListed) return false;
      if (!tags?.reviewed) return false;
      if (excluded.has(String(movie.id))) return false;

      // 選択したOTTのどれかで提供される映画だけ通します。
      if (selectedProviders.size > 0) {
        const matchesProvider = providers.some((provider) =>
          selectedProviders.has(String(provider.id)),
        );

        if (!matchesProvider) return false;
      }

      if (preferences.maxRuntime != null) {
        if (!Number.isFinite(movie.runtime)) return false;
        if (movie.runtime <= 0) return false;
        if (movie.runtime > preferences.maxRuntime) return false;
      }

      if (!((tags.experiences?.[preferences.experience] ?? 0) > 0)) return false;
      const states = (preferences.avoid ?? []).map(key => tags.avoids?.[key]);
      if (states.length) {
        reviewCandidateCount++;
        if (states.every(state => state === 'present' || state === 'absent')) reviewKnownCount++;
      }
      return states.every(state => state === 'absent');
    })
    .map((movie) => {
      const tags = tagsById[movie.id];

      const experienceScore = Math.min(
        1,
        Math.max(
          0,
          tags.experiences[preferences.experience],
        ),
      );

      const genreMatches = Boolean(
        selectedGenreId &&
        movie.genres?.some(
          (genre) => genre.id === selectedGenreId,
        ),
      );

      const voteCount = Math.max(
        0,
        Number(movie.voteCount) || 0,
      );

      const rating = Math.min(
        10,
        Math.max(0, Number(movie.rating) || 0),
      );

      const adjustedRating =
        (voteCount * rating + 500 * 6) /
        (voteCount + 500);

      const score = selectedGenreId
        ? experienceScore * 0.5 +
          Number(genreMatches) * 0.3 +
          (adjustedRating / 10) * 0.2
        : (
            experienceScore * 0.5 +
            (adjustedRating / 10) * 0.2
          ) / 0.7;

      const reasons = [
        `원하는 경험: ${
          experienceLabels[preferences.experience]
        }`,
      ];

      if (genreMatches) {
        reasons.push('선호 장르와 일치합니다.');
      }

      if (preferences.maxRuntime != null) {
        reasons.push(
          `${movie.runtime}분으로 선택한 시간 안에 볼 수 있습니다.`,
        );
      }

      if (selectedProviders.size > 0) {
        const names = [
          ...new Set(
            movie.availability.providers
              .filter((provider) =>
                selectedProviders.has(String(provider.id)),
              )
              .map((provider) => provider.name),
          ),
        ];

        reasons.push(
          `선택한 OTT 제공 목록에서 확인: ${names.join(', ')}`,
        );
      }

      return {
        ...movie,
        score,
        reasons: [reasons[0], tags.reason, ...reasons.slice(1)].filter(Boolean),
        blindReasons: reasons,
      };
    })
    .sort(compareRankedMovies);

  return {
    movies: ranked.slice(0, 3),
    reviewCandidateCount,
    reviewKnownCount,
    eligibleCount: ranked.length,
    message: ranked.length === 0
      ? '선택한 OTT와 감상 조건에 맞는 영화가 현재 후보에 없습니다.'
      : ranked.length < 3
        ? `조건에 맞는 영화가 ${ranked.length}편이라 해당 영화만 추천합니다.`
        : '선택한 OTT와 감상 조건에 맞춰 최대 3편을 골랐습니다.',
  };
}
