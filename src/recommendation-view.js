import { createOttBadges } from './ott-badges.js';
import { attachComparison } from './movie-comparison.js';
import { attachDecisionControls } from './movie-decision.js';
import { recommendMovies } from './recommendations.js';
import { movieTags } from './data/movie-tags.js';

let cachedMovies = null;
let previousPreferences = '';
let shownMovieIds = new Set();

async function loadMovies() {
  if (cachedMovies) return cachedMovies;

  const response = await fetch('/.netlify/functions/movies');

  if (!response.ok) {
    throw new Error('영화 정보를 가져오지 못했습니다.');
  }

  const result = await response.json();

  if (!Array.isArray(result.movies)) {
    throw new Error('영화 데이터 형식이 올바르지 않습니다.');
  }

  // 조회 실패가 섞였으면 다음 시도에서 다시 불러옵니다.
  if (!result.failedIds?.length) {
    cachedMovies = result.movies;
  }

  return result.movies;
}

function createMovieCard(movie, index) {
  const card = document.createElement('article');
  card.className = 'catalog-card';

  if (movie.posterUrl) {
    const image = document.createElement('img');
    image.src = movie.posterUrl;
    image.alt = `${movie.title} 포스터`;
    image.loading = 'lazy';
    card.append(image);
  }

  const body = document.createElement('div');
  body.className = 'catalog-card-body';

  const rank = document.createElement('p');
  rank.className = 'recommendation-rank';
  rank.textContent = `PICK ${index + 1}`;

  const title = document.createElement('h3');
  title.textContent = movie.title;

  const info = document.createElement('p');
  info.textContent =
    `${movie.runtime}분 · TMDB ${Number(movie.rating).toFixed(1)}/10`;

  const reasons = document.createElement('ul');
  reasons.className = 'recommendation-reasons';

  for (const reason of movie.reasons) {
    const item = document.createElement('li');
    item.textContent = reason;
    reasons.append(item);
  }

    body.append(
        rank,
        title,
        info,
        createOttBadges(movie),
        reasons,
    );
  if (movie.availability.watchLink) {
    const link = document.createElement('a');
    link.href = movie.availability.watchLink;
    link.target = '_blank';
    link.rel = 'noopener noreferrer';
    link.textContent = '시청 제공처 확인 ↗';
    body.append(link);
  }

  card.append(body);
  return card;
}

export async function showRecommendations(
  preferences,
  recommendAgain = false,
) {
  const preferencesKey = JSON.stringify({
    experience: preferences.experience,
    avoid: [...(preferences.avoid ?? [])].sort(),
    genre: preferences.genre,
    maxRuntime: preferences.maxRuntime,
    providerIds: [...(preferences.providerIds ?? [])].sort(),
  });

  if (!recommendAgain || preferencesKey !== previousPreferences) {
    shownMovieIds = new Set();
  }

  previousPreferences = preferencesKey;
  const result = document.querySelector('#form-result');
  const form = document.querySelector('#preferences-form');
  const button = form.querySelector('button[type="submit"]');
  const originalText = button.textContent;

  result.hidden = false;
  result.textContent = '조건에 맞는 영화를 찾는 중입니다.';
  result.setAttribute('aria-busy', 'true');
  button.disabled = true;
  button.textContent = '영화 고르는 중…';

  // 요청 중 조건이 바뀌었는지 확인하기 위한 기록입니다.
  const initialValues = JSON.stringify([...new FormData(form)]);

  try {
    const movies = await loadMovies();

    const currentValues = JSON.stringify([...new FormData(form)]);

    if (initialValues !== currentValues) {
      result.hidden = false;
      result.textContent =
        '조건이 변경됐습니다. 추천 버튼을 다시 눌러 주세요.';
      return;
    }

    const recommendation = recommendMovies(
        movies,
        preferences,
        movieTags,
        [...shownMovieIds],
    );

    recommendation.movies.forEach((movie) => {
        shownMovieIds.add(movie.id);
    });

    result.replaceChildren();

    const heading = document.createElement('h2');
    heading.textContent = '오늘의 PICKFILM';

    const message = document.createElement('p');
    message.className = 'catalog-message';
    message.textContent = recommendation.message;

    const grid = document.createElement('div');
    grid.className = 'catalog-grid';

    recommendation.movies.forEach((movie, index) => {
      grid.append(createMovieCard(movie, index));
    });

    const note = document.createElement('p');
    note.className = 'catalog-message';
    note.textContent =
      '영화 정보: TMDB · 제공처 정보: JustWatch. 감상 경험은 PICKFILM의 초기 편집 기준이며, 실제 제공 여부는 시청 전에 확인해 주세요.';

    result.append(heading, message, grid, note);
    attachDecisionControls(result, recommendation.movies);
    attachComparison(result, recommendation.movies);
    
    const moreControls = document.createElement('div');
    moreControls.className = 'decision-controls';

    const moreButton = document.createElement('button');
    moreButton.type = 'button';
    moreButton.className = 'decision-secondary';

    if (recommendation.movies.length > 0) {
        moreButton.textContent = '다른 영화 추천받기';

        moreButton.addEventListener('click', () => {
            showRecommendations(preferences, true);
        });
    } else if (shownMovieIds.size > 0) {
        message.textContent =
            '같은 조건으로 새롭게 추천할 후보를 모두 확인했습니다. 조건을 바꾸거나 처음 추천부터 다시 볼 수 있습니다.';

        moreButton.textContent = '처음 추천부터 다시 보기';

        moreButton.addEventListener('click', () => {
            showRecommendations(preferences);
        });
    } else {
        moreButton.textContent = '조건 다시 선택하기';

        moreButton.addEventListener('click', () => {
            form.scrollIntoView({
                behavior: 'smooth',
                block: 'start',
            });
        });
    }

    moreControls.append(moreButton);
    result.append(moreControls);

    if ((preferences.avoid ?? []).length > 0) {
      const warning = document.createElement('p');
      warning.className = 'catalog-message';
      warning.textContent =
        '선택한 회피 요소가 설정 기준에 해당하지 않는 것으로 검토된 영화만 추천합니다. 미확인 항목이 있는 영화도 제외합니다. 관람 안내 기반 분류이며 개인의 체감과 다를 수 있습니다.';
      result.append(warning);
    }

    result.hidden = false;
    result.scrollIntoView({
      behavior: 'smooth',
      block: 'start',
    });
  } catch (error) {
    result.hidden = false;
    result.textContent =
      `${error.message} 서버용 터미널이 실행 중인지 확인해 주세요.`;
  } finally {
    result.setAttribute('aria-busy', 'false');
    button.disabled = false;
    button.textContent = originalText;
  }
}