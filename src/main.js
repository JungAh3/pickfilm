import { setupCredits } from './credits.js';
import { setupAuth } from './auth.js';
import {
  setupProviderFilter,
  readSelectedProviders,
} from './provider-filter.js';
import { readRecommendation, saveRecommendation } from './recommendation-state.js';
import { blindSwitch } from './blind-movie.js';

const experiences = [
  {
    id: 'refresh',
    icon: '✦',
    title: '기분 전환하고 싶어요',
    description: '답답한 일상에서 벗어나 가볍게 즐기고 싶어요.',
  },
  {
    id: 'comfort',
    icon: '♡',
    title: '위로받고 싶어요',
    description: '따뜻한 이야기로 마음을 쉬게 하고 싶어요.',
  },
  {
    id: 'laugh',
    icon: '☺',
    title: '실컷 웃고 싶어요',
    description: '복잡한 생각 없이 유쾌하게 웃고 싶어요.',
  },
  {
    id: 'thrill',
    icon: 'ϟ',
    title: '짜릿하게 몰입하고 싶어요',
    description: '손에 땀을 쥐는 긴장감에 빠지고 싶어요.',
  },
  {
    id: 'linger',
    icon: '☾',
    title: '깊은 여운을 느끼고 싶어요',
    description: '끝난 뒤에도 오래 생각나는 이야기를 원해요.',
  },
];

const avoidOptions = [
  { id: 'violence', label: '잔인한 장면' },
  { id: 'horror', label: '무서운 장면' },
  { id: 'slow', label: '느린 전개' },
  { id: 'heavy', label: '무거운 분위기' },
];

const genres = [
  { id: 'any', label: '상관없음' },
  { id: 'action', label: '액션' },
  { id: 'comedy', label: '코미디' },
  { id: 'thriller', label: '스릴러' },
  { id: 'romance', label: '로맨스' },
  { id: 'drama', label: '드라마' },
];

const times = [
  { value: '90', title: '90분 이내', description: '짧고 알차게' },
  { value: '120', title: '120분 이내', description: '한 편에 몰입' },
  { value: 'any', title: '시간 상관없음', description: '여유롭게 감상' },
];

document.querySelector('#app').innerHTML = `
  <header class="site-header">
    <a class="brand" href="./" aria-label="PICKFILM 처음으로">
      <span class="brand-icon" aria-hidden="true">▶</span>
      PICKFILM
    </a>
    <p class="header-caption">고민은 짧게, 감상은 길게.</p>
    <div id="account"></div>
  </header>

  <main class="page">
    <section class="intro" aria-labelledby="page-title">
      <p class="eyebrow">FIND YOUR FILM</p>
      <h1 id="page-title">오늘은 어떤 영화가 <span>보고 싶으세요?</span></h1>
      <p class="intro-description">
        지금 원하는 경험과 피하고 싶은 요소를 알려주세요.<br />
        한국에서 구독형 OTT로 볼 영화, 최대 3편으로 좁혀드릴게요.      </p>

      <ol class="steps" aria-label="영화 선택 과정">
        <li class="current" aria-current="step"><b>01</b> 조건 입력</li>
        <li><b>02</b> TOP 3 추천</li>
        <li><b>03</b> 한 편 결정</li>
      </ol>
    </section>

    <form id="preferences-form">
      <fieldset class="section-card">
        <legend class="sr-only">원하는 감상 경험 — 필수</legend>

        <div class="section-heading">
          <div class="section-heading-main">
            <span class="section-number" aria-hidden="true">01</span>
            <h2>원하는 감상 경험</h2>
          </div>
          <span class="section-hint">필수 · 1개 선택</span>
        </div>

        <p class="section-description">
          지금 기분보다, 영화를 보고 나서 느끼고 싶은 감정을 골라주세요.
        </p>

        <div class="experience-grid">
          ${experiences.map((item) => `
            <label class="experience-option">
              <input
                type="radio"
                name="experience"
                value="${item.id}"
                required
              />
              <span class="experience-content">
                <span class="experience-top">
                  <span class="experience-icon" aria-hidden="true">
                    ${item.icon}
                  </span>
                  <span class="selection-dot" aria-hidden="true"></span>
                </span>
                <strong>${item.title}</strong>
                <span class="option-description">${item.description}</span>
              </span>
            </label>
          `).join('')}
        </div>
      </fieldset>

      <fieldset class="section-card">
        <legend class="sr-only">피하고 싶은 요소 — 선택</legend>

        <div class="section-heading">
          <div class="section-heading-main">
            <span class="section-number" aria-hidden="true">02</span>
            <h2>피하고 싶은 요소</h2>
          </div>
          <span class="section-hint">선택 · 여러 개 가능</span>
        </div>

        <p class="section-description">
          선택하지 않고 넘어가셔도 괜찮아요.
        </p>

        <div class="chip-group">
          ${avoidOptions.map((item) => `
            <label class="chip-option">
              <input type="checkbox" name="avoid" value="${item.id}" />
              <span>${item.label}</span>
            </label>
          `).join('')}
        </div>

        <p class="data-note">
          주의 요소는 검토한 태그를 기준으로 반영하며,
          미확인 정보는 ‘없음’으로 간주하지 않습니다.
        </p>
      </fieldset>

      <div class="bottom-grid">
        <fieldset class="section-card">
          <legend class="sr-only">선호 장르 — 선택</legend>

          <div class="section-heading">
            <div class="section-heading-main">
              <span class="section-number" aria-hidden="true">03</span>
              <h2>선호 장르</h2>
            </div>
            <span class="section-hint">선택 · 1개</span>
          </div>

          <div class="chip-group">
            ${genres.map((item) => `
              <label class="chip-option">
                <input
                  type="radio"
                  name="genre"
                  value="${item.id}"
                  ${item.id === 'any' ? 'checked' : ''}
                />
                <span>${item.label}</span>
              </label>
            `).join('')}
          </div>
        </fieldset>

        <fieldset class="section-card">
          <legend class="sr-only">시청 가능 시간 — 필수</legend>

          <div class="section-heading">
            <div class="section-heading-main">
              <span class="section-number" aria-hidden="true">04</span>
              <h2>시청 가능 시간</h2>
            </div>
            <span class="section-hint">필수 · 1개 선택</span>
          </div>

          <div class="time-grid">
            ${times.map((item) => `
              <label class="time-option">
                <input
                  type="radio"
                  name="maxRuntime"
                  value="${item.value}"
                  required
                />
                <span>
                  <strong>${item.title}</strong>
                  <small>${item.description}</small>
                </span>
              </label>
            `).join('')}
          </div>
        </fieldset>
      </div>

      <section class="summary-bar" aria-label="선택 조건 요약">
        <div>
          <p class="summary-label">오늘의 선택 조건</p>
          <p id="selection-summary" aria-live="polite">
            감상 경험과 시청 시간을 선택해 주세요.
          </p>
        </div>

        <div class="recommendation-actions">
          ${blindSwitch('name="blind"', '<small>제목과 포스터를 가리고, 분위기와 추천 이유로 먼저 골라요.</small>')}
          <div class="form-actions">
            <button class="reset-button" type="reset">초기화</button>
            <button class="primary-button" type="submit">
              영화 3편 추천받기 <span aria-hidden="true">→</span>
            </button>
          </div>
        </div>
      </section>

      <p id="selection-error" class="catalog-message" role="alert" hidden></p>
    </form>

    <footer class="page-footer">
      <strong>PICKFILM</strong>
      <p>더 많은 추천이 아닌, 더 빠른 선택.</p>
      <small>영화 제공 여부는 지역과 확인 시점에 따라 달라질 수 있습니다.</small>
    </footer>
  </main>
`;

const form = document.querySelector('#preferences-form');
const summary = document.querySelector('#selection-summary');
const selectionError = document.querySelector('#selection-error');

function getPreferences() {
  const data = new FormData(form);
  const runtime = data.get('maxRuntime');

  return {
    experience: data.get('experience'),
    avoid: data.getAll('avoid'),
    genre: data.get('genre') ?? 'any',
    maxRuntime:
      runtime === 'any'
        ? null
        : runtime
          ? Number(runtime)
          : undefined,
  };
}

function updateSummary() {
  const preferences = {
    ...getPreferences(),
    providerIds: readSelectedProviders(form),
  };

  const experience = experiences.find(
    (item) => item.id === preferences.experience,
  );

  const genre = genres.find(
    (item) => item.id === preferences.genre,
  );

  const runtimeLabel =
    preferences.maxRuntime === null
      ? '시간 상관없음'
      : preferences.maxRuntime
        ? `${preferences.maxRuntime}분 이내`
        : '시간 미선택';

  const avoidLabels = avoidOptions
    .filter((item) => preferences.avoid.includes(item.id))
    .map((item) => item.label);

  summary.textContent = [
    experience?.title ?? '감상 경험 미선택',
    genre?.label ?? '장르 상관없음',
    runtimeLabel,
    avoidLabels.length
      ? `${avoidLabels.join('·')} 제외`
      : '회피 조건 없음',
  ].join(' / ');
}

function restoreConditions() {
  const state = readRecommendation();
  if (!state) return;
  const { preferences } = state;
  form.elements.blind.checked = state.blind;
  for (const control of form.querySelectorAll('input[type="radio"], input[name="avoid"]')) {
    if (control.name === 'avoid') {
      control.checked = preferences.avoid.includes(control.value);
    } else {
      const value = preferences[control.name] ?? 'any';
      control.checked = control.value === String(value);
    }
  }
  restoreProviders();
  updateSummary();
}

function restoreProviders() {
  const ids = readRecommendation()?.preferences.providerIds;
  if (!ids) return;
  for (const input of form.querySelectorAll('input[name="providers"]')) {
    input.checked = input.value.split(',').some((id) => ids.includes(id));
  }
}

form.addEventListener('change', updateSummary);
form.addEventListener('reset', () => {
  // 브라우저가 입력값을 초기화한 뒤 요약을 갱신합니다.
  restorePendingProviders = false;
  requestAnimationFrame(updateSummary);
});

form.addEventListener('submit', (event) => {
  event.preventDefault();

  if (!form.reportValidity()) return;

  const preferences = {
    ...getPreferences(),
    providerIds: readSelectedProviders(form),
  };

  try {
    saveRecommendation({ preferences, blind: form.elements.blind.checked });
    window.location.assign('/recommendations');
  } catch {
    selectionError.hidden = false;
    selectionError.textContent = '이 탭에서 추천 조건을 저장하지 못했습니다. 브라우저 저장 설정을 확인해 주세요.';
  }
});

let restorePendingProviders = true;
restoreConditions();
const submitButton = form.querySelector('button[type="submit"]');
submitButton.disabled = true;
setupProviderFilter().finally(() => {
  if (restorePendingProviders) restoreProviders();
  submitButton.disabled = false;
  updateSummary();
});
window.addEventListener('pageshow', (event) => {
  if (event.persisted) restoreConditions();
});
setupCredits();
setupAuth(document.querySelector('#account'));
