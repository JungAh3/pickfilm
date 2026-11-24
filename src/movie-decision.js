import { createOttBadges } from './ott-badges.js';
import { createContentAdvice } from './content-advice.js';
import { requestMovieSelections } from './movie-selections.js';
import { blindValue } from './blind-movie.js';
import { compareRankedMovies } from './recommendations.js';

export function attachDecisionControls(container, movies, getSession, replaceMovie) {
  if (!movies.length) return;

  document.querySelector('#movie-detail-dialog')?.remove();

  const grid = container.querySelector('.catalog-grid');
  const message = container.querySelector('.catalog-message');

  const originalMessage = message.textContent;

  const dialog = document.createElement('dialog');
  dialog.id = 'movie-detail-dialog';
  dialog.className = 'movie-detail-dialog';
  dialog.setAttribute('aria-labelledby', 'movie-detail-title');
  document.body.append(dialog);

  const controls = document.createElement('div');
  controls.className = 'decision-controls';

  const decision = document.createElement('div');
  decision.className = 'decision-panel';
  decision.hidden = true;
  decision.setAttribute('role', 'status');

  container.append(controls, decision);
  const pendingSaves = new Map();

  function makeButton(text, className, onClick) {
    const button = document.createElement('button');
    button.type = 'button';
    button.className = className;
    button.textContent = text;
    button.addEventListener('click', onClick);
    return button;
  }

  function automaticSaveNote() {
    const note = document.createElement('p');
    note.className = 'catalog-message decision-save-note';
    note.textContent = '결정하면 내가 고른 영화에 자동으로 저장됩니다.';
    return note;
  }

  function detailButton(movie) {
    const button = makeButton('', 'decision-secondary blind-stack', () => openDetails(movie));
    button.append(blindValue('상세 보기', '작품 공개하고 상세 보기'));
    return button;
  }

  function saveDecision(movieId, userId) {
    const status = document.createElement('p');
    decision.append(status);

    async function save() {
      const session = getSession?.();
      if (session?.user.id !== userId) {
        status.textContent = '선택한 계정으로 로그인한 상태에서 다시 저장해 주세요.';
        return;
      }
      status.textContent = '내 목록에 저장하는 중…';
      const key = `${userId}:${movieId}`;
      if (!pendingSaves.has(key)) {
        pendingSaves.set(key, requestMovieSelections(session, movieId)
          .finally(() => pendingSaves.delete(key)));
      }
      try {
        const { saved } = await pendingSaves.get(key);
        status.textContent = saved ? '내 목록에 저장했어요.' : '이미 내 목록에 있는 영화예요.';
      } catch {
        status.textContent = '내 목록에 저장하지 못했어요. ';
        status.append(makeButton('저장 다시 시도', 'decision-secondary', save));
      }
    }

    void save();
  }

  function confirmMovie(movie) {
    decision.replaceChildren();

    const title = document.createElement('h3');
    const slot = Number(originalCards[movies.indexOf(movie)].dataset.slot);
    title.append(blindValue(
      `오늘은 「${movie.title}」로 결정했어요!`,
      `오늘은 PICK ${slot + 1}로 결정했어요!`,
    ));

    const text = document.createElement('p');
    text.className = 'blind-reveal';
    text.textContent =
      '아래 링크에서 제공처를 확인하고 감상을 시작해 보세요.';

    decision.append(title, text);

    if (movie.availability.watchLink) {
      const link = document.createElement('a');
      link.className = 'blind-reveal';
      link.href = movie.availability.watchLink;
      link.target = '_blank';
      link.rel = 'noopener noreferrer';
      link.textContent = '시청 제공처 확인 ↗';
      decision.append(link);
    }

    decision.append(
      makeButton('다시 고르기', 'decision-secondary', () => {
        decision.hidden = true;
        showAllMovies();
      }),
    );

    decision.hidden = false;
    const userId = getSession?.()?.user.id;
    if (userId) saveDecision(movie.id, userId);

    if (dialog.open) dialog.close();

    decision.scrollIntoView({
      behavior: 'smooth',
      block: 'center',
    });
  }

  function openDetails(movie) {
    dialog.replaceChildren();

    const content = document.createElement('div');
    content.className = 'movie-detail-content';

    const title = document.createElement('h2');
    title.id = 'movie-detail-title';
    title.textContent = movie.title;

    const info = document.createElement('p');
    info.textContent =
      `${movie.runtime}분 · ` +
      (movie.genres ?? []).map((genre) => genre.name).join(' · ');

    const overview = document.createElement('p');
    overview.textContent = movie.overview || '등록된 줄거리가 없습니다.';

    const reasonTitle = document.createElement('h3');
    reasonTitle.textContent = '이 영화를 추천하는 이유';

    const reasons = document.createElement('ul');

    for (const reason of movie.reasons) {
      const item = document.createElement('li');
      item.textContent = reason;
      reasons.append(item);
    }

    const actions = document.createElement('div');
    actions.className = 'decision-controls';

    actions.append(
      makeButton('이 영화로 결정', 'decision-button', () => {
        confirmMovie(movie);
      }),
      makeButton('닫기', 'decision-secondary', () => {
        dialog.close();
      }),
    );

    content.append(
      title,
      info,
      overview,
      reasonTitle,
      reasons,
      actions,
    );
    content.insertBefore(createOttBadges(movie), actions);
    content.insertBefore(createContentAdvice(movie.id), actions);
    content.insertBefore(automaticSaveNote(), actions);
    
    dialog.append(content);
    dialog.showModal();
  }

  // 기존 카드에 상세 보기 버튼을 추가합니다.
  const originalCards = [...grid.children];

  movies.forEach((movie, index) => {
    const body = originalCards[index]?.querySelector(
      '.catalog-card-body',
    );

    if (!body) return;

    body.append(detailButton(movie));
  });

  function showAllMovies() {
    message.textContent = originalMessage;

    grid.classList.remove('single-pick-grid');
    grid.replaceChildren(...originalCards);

    controls.replaceChildren(
      makeButton('하나만 골라줘 ✨', 'decision-button', () => showOneMovie()),
    );

    decision.hidden = true;
  }

  function showOneMovie(movie = [...movies].sort(compareRankedMovies)[0], isReplacement = false) {
    const original = originalCards[movies.indexOf(movie)];

    if (!isReplacement) {
      message.textContent =
        '현재 추천 후보 중 선택한 조건의 종합 점수가 가장 높은 영화입니다. 동점이면 평가 수를 우선합니다.';
    }

    const card = original.cloneNode(true);
    const watched = card.querySelector('.watched-button');
    card.querySelectorAll('button:not(.watched-button)').forEach((button) => button.remove());
    watched?.addEventListener('click', () => replaceMovie(Number(card.dataset.slot)));

    const rank = card.querySelector('.recommendation-rank');
    if (rank) rank.textContent += ' · 오늘의 원픽';

    const body = card.querySelector('.catalog-card-body');

    body.append(
      detailButton(movie),
      automaticSaveNote(),
      makeButton('이 영화로 결정', 'decision-button', () => {
        confirmMovie(movie);
      }),
    );

    grid.classList.add('single-pick-grid');
    grid.replaceChildren(card);

    controls.replaceChildren(
      makeButton('추천 목록으로 돌아가기', 'decision-secondary', () => {
        showAllMovies();
      }),
    );

    decision.hidden = true;

    container.scrollIntoView({
      behavior: 'smooth',
      block: 'start',
    });
  }

  showAllMovies();
  return showOneMovie;
}
