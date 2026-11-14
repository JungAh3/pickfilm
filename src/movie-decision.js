import { createOttBadges } from './ott-badges.js';
import { createContentAdvice } from './content-advice.js';

export function attachDecisionControls(container, movies) {
  if (!movies.length) return;

  document.querySelector('#movie-detail-dialog')?.remove();

  const grid = container.querySelector('.catalog-grid');
  const heading = container.querySelector('h2');
  const message = container.querySelector('.catalog-message');

  const originalHeading = heading.textContent;
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

  function makeButton(text, className, onClick) {
    const button = document.createElement('button');
    button.type = 'button';
    button.className = className;
    button.textContent = text;
    button.addEventListener('click', onClick);
    return button;
  }

  function confirmMovie(movie) {
    decision.replaceChildren();

    const title = document.createElement('h3');
    title.textContent = `오늘은 「${movie.title}」로 결정했어요!`;

    const text = document.createElement('p');
    text.textContent =
      '아래 링크에서 제공처를 확인하고 감상을 시작해 보세요.';

    decision.append(title, text);

    if (movie.availability.watchLink) {
      const link = document.createElement('a');
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

    body.append(
      makeButton('상세 보기', 'decision-secondary', () => {
        openDetails(movie);
      }),
    );
  });

  function showAllMovies() {
    heading.textContent = originalHeading;
    message.textContent = originalMessage;

    grid.classList.remove('single-pick-grid');
    grid.replaceChildren(...originalCards);

    controls.replaceChildren(
      makeButton('하나만 골라줘 ✨', 'decision-button', showOneMovie),
    );

    decision.hidden = true;
  }

  function showOneMovie() {
    const movie = movies[0];

    heading.textContent = '오늘의 원픽은 이 영화!';
    message.textContent =
      '현재 추천 후보 중 선택한 조건의 종합 점수가 가장 높은 영화입니다. 동점이면 평가 수를 우선합니다.';

    // 기존 1순위 카드를 복제하고 버튼은 새로 연결합니다.
    const card = originalCards[0].cloneNode(true);
    card.querySelectorAll('button').forEach((button) => button.remove());

    const rank = card.querySelector('.recommendation-rank');
    if (rank) rank.textContent = '오늘의 PICK';

    const body = card.querySelector('.catalog-card-body');

    body.append(
      makeButton('상세 보기', 'decision-secondary', () => {
        openDetails(movie);
      }),
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
}