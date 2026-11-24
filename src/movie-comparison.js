import { blindValue, movieCautions, movieMood } from './blind-movie.js';

export function attachComparison(container, movies, slots, initiallyOpen = false) {
  if (movies.length < 2) return;

  const wrapper = document.createElement('section');
  wrapper.className = 'movie-comparison';

  const button = document.createElement('button');
  button.type = 'button';
  button.className = 'decision-secondary';
  button.textContent = initiallyOpen ? '비교표 접기' : `${movies.length}편 비교하기`;
  button.setAttribute('aria-expanded', String(initiallyOpen));
  button.setAttribute('aria-controls', 'movie-comparison-panel');

  const panel = document.createElement('div');
  panel.id = 'movie-comparison-panel';
  panel.hidden = !initiallyOpen;

  const scroll = document.createElement('div');
  scroll.className = 'comparison-scroll';
  scroll.tabIndex = 0;
  scroll.setAttribute('role', 'region');
  scroll.setAttribute('aria-label', '추천 영화 비교표');

  const table = document.createElement('table');
  table.className = 'comparison-table';

  const caption = document.createElement('caption');
  caption.textContent = '추천 영화 비교';

  const head = document.createElement('thead');
  const headerRow = document.createElement('tr');

  const columnHeading = document.createElement('th');
  columnHeading.scope = 'col';
  columnHeading.textContent = '비교 항목';
  headerRow.append(columnHeading);

  movies.forEach((movie, index) => {
    const cell = document.createElement('th');
    cell.scope = 'col';
    cell.append(blindValue(movie.title, `PICK ${slots[index] + 1}`));
    headerRow.append(cell);
  });

  head.append(headerRow);

  const rows = [
    [
      '상영시간',
      (movie) => movie.runtime > 0
        ? `${movie.runtime}분`
        : '미확인',
    ],
    [
      '장르',
      (movie) =>
        (movie.genres ?? []).map((genre) => genre.name).join(' · ') ||
        '미확인',
    ],
    [
      'TMDB 평점',
      (movie) =>
        `${Number(movie.rating).toFixed(1)}/10`,
      'blind-reveal',
    ],
    [
      '평가 수',
      (movie) =>
        `${Number(movie.voteCount).toLocaleString('ko-KR')}개`,
      'blind-reveal',
    ],
    [
      '추천 이유',
      (movie) => blindValue(movie.reasons.join('\n'), movie.blindReasons.join('\n')),
    ],
    ['분위기', movieMood, 'blind-only'],
    [
        '회피 요소',
        (movie) => movieCautions(movie).join('\n'),
    ],
  ];

  const body = document.createElement('tbody');

  for (const [label, getValue, className] of rows) {
    const row = document.createElement('tr');
    if (className) row.className = className;

    const rowHeading = document.createElement('th');
    rowHeading.scope = 'row';
    rowHeading.textContent = label;
    row.append(rowHeading);

    for (const movie of movies) {
      const cell = document.createElement('td');
      cell.append(getValue(movie));
      row.append(cell);
    }

    body.append(row);
  }

  table.append(caption, head, body);
  scroll.append(table);
  panel.append(scroll);

  button.addEventListener('click', () => {
    const opening = panel.hidden;
    panel.hidden = !opening;
    button.setAttribute('aria-expanded', String(opening));
    button.textContent = opening
      ? '비교표 접기'
      : `${movies.length}편 비교하기`;
  });

  wrapper.append(button, panel);
  container.append(wrapper);
}
