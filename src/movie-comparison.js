import { movieTags } from './data/movie-tags.js';
export function attachComparison(container, movies) {
  if (movies.length < 2) return;

  const wrapper = document.createElement('section');
  wrapper.className = 'movie-comparison';

  const button = document.createElement('button');
  button.type = 'button';
  button.className = 'decision-secondary';
  button.textContent = `${movies.length}편 비교하기`;
  button.setAttribute('aria-expanded', 'false');
  button.setAttribute('aria-controls', 'movie-comparison-panel');

  const panel = document.createElement('div');
  panel.id = 'movie-comparison-panel';
  panel.hidden = true;

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

  for (const text of ['비교 항목', ...movies.map((movie) => movie.title)]) {
    const cell = document.createElement('th');
    cell.scope = 'col';
    cell.textContent = text;
    headerRow.append(cell);
  }

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
    ],
    [
      '평가 수',
      (movie) =>
        `${Number(movie.voteCount).toLocaleString('ko-KR')}개`,
    ],
    [
      '추천 이유',
      (movie) => movie.reasons.join('\n'),
    ],
    [
        '회피 요소',
        (movie) => {
            const labels = {
                violence: '잔인한 묘사',
                horror: '공포·위협',
                slow: '느린 전개',
                heavy: '무거운 분위기',
            };

            const states = {
                present: '있음',
                absent: '설정 기준에 해당하지 않음',
                unknown: '미확인',
            };

            const avoids = movieTags[movie.id]?.avoids ?? {};

            return Object.entries(labels)
                .map(([key, label]) =>
                    `${label}: ${states[avoids[key] ?? 'unknown']}`,
                )
                .join('\n');
        },
    ],
  ];

  const body = document.createElement('tbody');

  for (const [label, getValue] of rows) {
    const row = document.createElement('tr');

    const rowHeading = document.createElement('th');
    rowHeading.scope = 'row';
    rowHeading.textContent = label;
    row.append(rowHeading);

    for (const movie of movies) {
      const cell = document.createElement('td');
      cell.textContent = getValue(movie);
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