import { movieTags } from './data/movie-tags.js';
import { experienceLabels } from './recommendations.js';

export function blindSwitch(inputName = '', description = '') {
  return `
    <label class="blind-option">
      <input type="checkbox" role="switch" data-blind-switch ${inputName} />
      <span class="blind-switch-track" aria-hidden="true"></span>
      <span><strong>블라인드 모드</strong>${description}</span>
    </label>
  `;
}

export function blindValue(revealed, concealed) {
  const value = document.createDocumentFragment();
  for (const [className, text] of [['blind-reveal', revealed], ['blind-only', concealed]]) {
    const span = document.createElement('span');
    span.className = className;
    span.textContent = text;
    value.append(span);
  }
  return value;
}

export function movieMood(movie) {
  return Object.entries(movieTags[movie.id]?.experiences ?? {})
    .filter(([key, score]) => score > 0 && experienceLabels[key])
    .sort((a, b) => b[1] - a[1])
    .slice(0, 2)
    .map(([key]) => experienceLabels[key])
    .join(' · ') || '미확인';
}

export function movieCautions(movie) {
  const labels = {
    violence: '잔인한 묘사',
    horror: '공포·위협',
    slow: '느린 전개',
    heavy: '무거운 분위기',
  };
  const states = { present: '있음', absent: '설정 기준에 해당하지 않음', unknown: '미확인' };
  const avoids = movieTags[movie.id]?.avoids ?? {};

  return Object.entries(labels).map(([key, label]) =>
    `${label}: ${states[avoids[key]] ?? states.unknown}`,
  );
}
