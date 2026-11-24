import { createOttBadges } from './ott-badges.js';
import { attachComparison } from './movie-comparison.js';
import { attachDecisionControls } from './movie-decision.js';
import { recommendMovies } from './recommendations.js';
import { movieTags } from './data/movie-tags.js';
import { blindSwitch, blindValue, movieCautions, movieMood } from './blind-movie.js';
import { readRecommendation, saveRecommendation } from './recommendation-state.js';
import { setupAuth } from './auth.js';
import { setupCredits } from './credits.js';

async function loadMovies() {
  const response = await fetch('/.netlify/functions/movies');
  if (!response.ok) throw new Error('영화 정보를 가져오지 못했습니다.');

  const result = await response.json();
  if (!Array.isArray(result.movies)) {
    throw new Error('영화 데이터 형식이 올바르지 않습니다.');
  }
  return result.movies;
}

function createMovieCard(movie, slot, replaceMovie) {
  const card = document.createElement('article');
  card.className = 'catalog-card';
  card.dataset.slot = slot;
  card.style.setProperty('--pick-column', slot + 1);
  const poster = document.createElement('div');
  poster.className = 'recommendation-poster';
  if (movie.posterUrl) {
    const image = document.createElement('img');
    image.className = 'poster-image';
    image.src = movie.posterUrl;
    image.alt = `${movie.title} 포스터`;
    image.loading = 'lazy';
    poster.append(image);
  }
  card.append(poster);

  const body = document.createElement('div');
  body.className = 'catalog-card-body';

  const rank = document.createElement('p');
  rank.className = 'recommendation-rank';
  rank.textContent = `PICK ${slot + 1}`;

  const title = document.createElement('h3');
  title.className = 'blind-stack';
  title.append(blindValue(movie.title, `PICK ${slot + 1}`));

  const info = document.createElement('p');
  const runtime = movie.runtime > 0 ? `러닝타임 ${movie.runtime}분` : '러닝타임 미확인';
  const genres = (movie.genres ?? []).map(({ name }) => name).filter(Boolean);
  const metadata = [runtime, ...genres].join(' · ');
  info.className = 'blind-stack';
  info.append(blindValue(`${metadata} · TMDB ${Number(movie.rating).toFixed(1)}/10`, metadata));

  const mood = document.createElement('p');
  mood.textContent = `분위기: ${movieMood(movie)}`;

  const cautions = document.createElement('p');
  cautions.textContent = `주의 요소: ${movieCautions(movie).join(' · ')}`;

  const reasons = document.createElement('div');
  reasons.className = 'blind-stack';
  for (const [className, items] of [['blind-reveal', movie.reasons], ['blind-only', movie.blindReasons]]) {
    const list = document.createElement('ul');
    list.className = `recommendation-reasons ${className}`;
    for (const reason of items) {
      const item = document.createElement('li');
      item.textContent = reason;
      list.append(item);
    }
    reasons.append(list);
  }

  const badges = createOttBadges(movie);
  body.append(rank, title, info, badges, mood, cautions, reasons);

  if (movie.availability.watchLink) {
    const link = document.createElement('a');
    link.className = 'card-provider-link';
    link.href = movie.availability.watchLink;
    link.target = '_blank';
    link.rel = 'noopener noreferrer';
    link.textContent = '시청 제공처 확인 ↗';
    body.append(link);
  }

  const watched = document.createElement('button');
  watched.type = 'button';
  watched.className = 'decision-secondary watched-button';
  watched.textContent = '이미 봤어요';
  watched.setAttribute('aria-label', `PICK ${slot + 1} 이미 봤어요`);
  watched.addEventListener('click', () => replaceMovie(slot));
  body.append(watched);
  card.append(body);
  return card;
}

export async function showRecommendationPage(container) {
  const state = readRecommendation();
  if (!state) {
    window.location.replace('/');
    return;
  }
  const { preferences } = state;
  document.title = '오늘의 PICKFILM | 추천 결과';
  history.scrollRestoration = 'manual';
  window.scrollTo(0, 0);
  container.innerHTML = `
    <header class="site-header">
      <a class="brand" href="/" aria-label="PICKFILM 처음으로">
        <span class="brand-icon" aria-hidden="true">▶</span> PICKFILM
      </a>
      <div id="account"></div>
    </header>
    <main class="page recommendation-page">
      <div class="recommendation-toolbar">
        <div class="recommendation-heading">
          <h1>오늘의 PICKFILM</h1>
          ${blindSwitch()}
        </div>
        <a class="decision-secondary edit-conditions" href="/">조건 수정</a>
      </div>
      <section id="form-result" class="form-result" aria-busy="true" aria-label="영화 추천 결과">
        <p role="status">조건에 맞는 영화를 찾는 중입니다.</p>
      </section>
    </main>
  `;

  const result = container.querySelector('#form-result');
  const toggle = container.querySelector('[data-blind-switch]');
  const getSession = setupAuth(container.querySelector('#account'));
  setupCredits();
  toggle.checked = state.blind;
  result.toggleAttribute('data-blind', state.blind);
  toggle.addEventListener('change', () => {
    state.blind = toggle.checked;
    result.toggleAttribute('data-blind', state.blind);
    saveRecommendation(state);
  });

  try {
    const movies = await loadMovies();
    const shownMovieIds = new Set(state.shownMovieIds);
    let slots;

    function persistSlots() {
      state.slots = slots.map((movie) => movie?.id ?? null);
      state.shownMovieIds = [...shownMovieIds];
      saveRecommendation(state);
    }

    const recommendUnseen = () => recommendMovies(movies, preferences, movieTags, [...shownMovieIds]);

    function showBatch(recommendAgain) {
      if (!recommendAgain) shownMovieIds.clear();
      const recommendation = recommendUnseen();
      slots = recommendation.movies;
      state.message = recommendation.message;
      delete state.replacedSlot;
      for (const movie of slots) shownMovieIds.add(movie.id);
      persistSlots();
      render();
    }

    if (state.slots) {
      const wanted = new Set(state.slots.map(String));
      const excluded = movies.filter((movie) => !wanted.has(String(movie.id))).map((movie) => movie.id);
      const ranked = recommendMovies(movies, preferences, movieTags, excluded);
      const byId = new Map(ranked.movies.map((movie) => [String(movie.id), movie]));
      slots = state.slots.map((id) => byId.get(String(id)) ?? null);
      render();
    } else {
      showBatch(false);
    }

    function replaceMovie(slot) {
      const comparisonOpen = result.querySelector('#movie-comparison-panel')?.hidden === false;
      const singlePick = Boolean(result.querySelector('.single-pick-grid'));
      const [replacement] = recommendUnseen().movies;
      if (replacement) shownMovieIds.add(replacement.id);
      slots[slot] = replacement ?? null;
      state.replacedSlot = slot;
      persistSlots();
      render(slot, comparisonOpen, singlePick);
    }

    function render(replacedSlot, comparisonOpen = false, singlePick = false) {
      const active = slots.flatMap((movie, slot) => movie ? [{ movie, slot }] : []);
      document.querySelector('#movie-detail-dialog')?.remove();
      result.replaceChildren();

      const message = document.createElement('p');
      message.className = 'catalog-message';
      message.setAttribute('role', 'status');
      message.textContent = state.message;
      if (state.replacedSlot !== undefined) {
        const remaining = active.length ? `현재 후보는 ${active.length}편입니다.` : '남은 후보가 없습니다.';
        const pick = `PICK ${state.replacedSlot + 1}`;
        message.textContent = slots[state.replacedSlot]
          ? `${pick}만 다른 영화로 바꿨어요. ${remaining}`
          : `같은 조건의 대체 후보가 없어 ${pick}을 뺐어요. ${remaining}`;
      }

      const grid = document.createElement('div');
      grid.className = 'catalog-grid recommendation-grid';
      grid.style.setProperty('--pick-columns', slots.length || 1);
      for (const { movie, slot } of active) grid.append(createMovieCard(movie, slot, replaceMovie));

      const note = document.createElement('p');
      note.className = 'catalog-message';
      note.textContent =
        '영화 정보: TMDB · 제공처 정보: JustWatch. 감상 경험은 PICKFILM의 초기 편집 기준이며, 실제 제공 여부는 시청 전에 확인해 주세요.';

      result.append(message, grid, note);
      const activeMovies = active.map(({ movie }) => movie);
      const showOneMovie = attachDecisionControls(result, activeMovies, getSession, replaceMovie);
      attachComparison(result, activeMovies, active.map(({ slot }) => slot), comparisonOpen);

      const moreControls = document.createElement('div');
      moreControls.className = 'decision-controls';
      const moreButton = document.createElement('button');
      moreButton.type = 'button';
      moreButton.className = 'decision-secondary';

      if (active.length) {
        moreButton.textContent = '다른 영화 추천받기';
        moreButton.addEventListener('click', () => showBatch(true));
      } else if (shownMovieIds.size) {
        if (state.replacedSlot === undefined) {
          message.textContent =
            '같은 조건으로 새롭게 추천할 후보를 모두 확인했습니다. 조건을 바꾸거나 처음 추천부터 다시 볼 수 있습니다.';
        }
        moreButton.textContent = '처음 추천부터 다시 보기';
        moreButton.addEventListener('click', () => showBatch(false));
      } else {
        moreButton.textContent = '조건 다시 선택하기';
        moreButton.addEventListener('click', () => window.location.assign('/'));
      }

      moreControls.append(moreButton);
      result.append(moreControls);

      if ((preferences.avoid ?? []).length) {
        const warning = document.createElement('p');
        warning.className = 'catalog-message';
        warning.textContent =
          '선택한 회피 요소가 설정 기준에 해당하지 않는 것으로 검토된 영화만 추천합니다. 미확인 항목이 있는 영화도 제외합니다. 관람 안내 기반 분류이며 개인의 체감과 다를 수 있습니다.';
        result.append(warning);
      }
      if (replacedSlot !== undefined) {
        if (singlePick && slots[replacedSlot]) showOneMovie(slots[replacedSlot], true);
        const nextButton = grid.querySelector(`[data-slot="${replacedSlot}"] .watched-button`) ?? moreButton;
        nextButton.focus({ preventScroll: true });
      }
    }
  } catch (error) {
    result.textContent = `${error.message} 서버용 터미널이 실행 중인지 확인해 주세요.`;
  } finally {
    result.setAttribute('aria-busy', 'false');
  }
}
