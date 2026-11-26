import { setupAuth } from './auth.js';
import { requestMovieSelections } from './movie-selections.js';
import { experienceLabels } from './recommendations.js';
import { isWatchDate, isWatchMonth, monthAfter, todayInKorea } from './watch-dates.js';

const reactions = {
  yes: '그랬어요',
  somewhat: '조금요',
  disappointed: '아쉬웠어요',
};

async function requestEntries(session, { month, id, method = 'GET', body, signal } = {}) {
  const params = new URLSearchParams();
  if (month) params.set('month', month);
  if (id) params.set('id', id);
  const headers = { Authorization: `Bearer ${session.access_token}` };
  if (body) headers['Content-Type'] = 'application/json';
  const response = await fetch(`/.netlify/functions/watch-entries?${params}`, {
    method, headers, body: body && JSON.stringify(body), signal, cache: 'no-store',
  });
  const data = await response.json().catch(() => ({}));
  if (!response.ok) throw new Error(data.message || '감상 기록에 연결하지 못했어요.');
  return data;
}

export function showWatchCalendar(container) {
  document.title = '감상 캘린더 | PICKFILM';
  container.innerHTML = `
    <header class="site-header">
      <a class="brand" href="/" aria-label="PICKFILM 처음으로">
        <span class="brand-icon" aria-hidden="true">▶</span> PICKFILM
      </a>
      <div id="account"></div>
    </header>
    <main class="page watch-calendar-page">
      <h1>감상 캘린더</h1>
      <p class="catalog-message" id="calendar-status" role="status">로그인 상태 확인 중…</p>
      <div class="watch-calendar-content" hidden>
        <section class="watch-calendar-month" aria-labelledby="calendar-month">
          <div class="watch-calendar-toolbar">
            <button type="button" class="decision-secondary" data-month="-1">이전 달</button>
            <h2 id="calendar-month" aria-live="polite"></h2>
            <button type="button" class="decision-secondary" data-month="1">다음 달</button>
          </div>
          <p id="month-summary" class="month-summary"></p>
          <div class="watch-calendar-grid" aria-hidden="true">
            ${['일', '월', '화', '수', '목', '금', '토'].map(day => `<span>${day}</span>`).join('')}
          </div>
          <div class="watch-calendar-grid" id="calendar-days"></div>
        </section>
        <section class="watch-calendar-date" aria-labelledby="calendar-date" hidden>
          <h2 id="calendar-date"></h2>
          <div id="date-entries"></div>
          <button id="add-watch-entry" type="button" class="decision-button">기록 추가</button>
        </section>
        <form class="watch-entry-form" aria-labelledby="watch-form-title" hidden>
          <h2 id="watch-form-title">감상 기록</h2>
          <div class="watch-movie-picker">
            <label>영화 제목 검색 <input type="search" name="search" autocomplete="off" /></label>
          </div>
          <label>영화 <select name="movieId" required></select></label>
          <label>감상일 <input type="date" name="watchedOn" min="1000-01-01" max="9999-11-30" required /></label>
          <label>내 별점 (선택)
            <select name="rating">
              <option value="">별점 없음</option>
              ${Array.from({length: 10}, (_, index) => (index + 1) / 2)
                .map(value => `<option value="${value}">${value}점</option>`).join('')}
            </select>
          </label>
          <label>짧은 감상평 (선택) <textarea name="review" maxlength="500" rows="3"></textarea></label>
          <label id="watch-reaction" hidden><span></span>
            <select name="experienceResponse">
              <option value="">건너뛰기</option>
              ${Object.entries(reactions).map(([value, label]) => `<option value="${value}">${label}</option>`).join('')}
            </select>
          </label>
          <p id="watch-form-status" role="status"></p>
          <div class="watch-entry-actions">
            <button type="submit" class="decision-button">저장</button>
            <button type="button" class="decision-secondary" id="cancel-watch-entry">취소</button>
          </div>
        </form>
      </div>
    </main>
  `;

  const find = (selector) => container.querySelector(selector);
  const status = find('#calendar-status');
  const content = find('.watch-calendar-content');
  const days = find('#calendar-days');
  const datePanel = find('.watch-calendar-date');
  const dateEntries = find('#date-entries');
  const form = find('form');
  const formStatus = find('#watch-form-status');
  const submit = form.querySelector('[type=submit]');
  const cancel = find('#cancel-watch-entry');
  const today = todayInKorea();
  const selectionId = new URLSearchParams(window.location.search).get('selection');
  let month = today.slice(0, 7);
  let selectedDate = null;
  let catalog = new Map();
  let entriesByDate = new Map();
  let accountRequest;
  let monthRequest;
  let editor;

  const getSession = setupAuth(find('#account'), async (session) => {
    accountRequest?.abort();
    monthRequest?.abort();
    closeEditor();
    selectedDate = null;
    month = today.slice(0, 7);
    content.hidden = true;
    days.replaceChildren();
    find('#month-summary').textContent = '';
    dateEntries.replaceChildren();
    datePanel.hidden = true;
    if (!session) {
      status.textContent = '로그인하면 내 감상 캘린더를 볼 수 있어요.';
      return;
    }

    const request = new AbortController();
    accountRequest = request;
    status.textContent = '감상 캘린더를 불러오는 중…';
    try {
      const response = await fetch('/.netlify/functions/movies', { signal: request.signal });
      if (!response.ok) throw new Error('등록된 영화 목록을 불러오지 못했어요.');
      const { movies } = await response.json();
      if (request.signal.aborted) return;
      catalog = new Map(movies.map(movie => [String(movie.id), movie]));
      content.hidden = false;
      await loadMonth();
      if (request.signal.aborted || !selectionId) return;

      const { selections } = await requestMovieSelections(session, undefined, request.signal);
      if (request.signal.aborted) return;
      const selection = selections.find(({ movie_id }) => String(movie_id) === selectionId);
      if (selection && catalog.has(selectionId)) {
        selectDay(today);
        openEditor({ movie_id: selection.movie_id, watched_on: today, experience: selection.experience }, true);
      } else {
        status.textContent = '내가 고른 영화에서 해당 작품을 찾을 수 없어요.';
      }
    } catch (error) {
      if (!request.signal.aborted) status.textContent = error.message || '캘린더를 불러오지 못했어요.';
    }
  });

  function button(label, onClick) {
    const element = document.createElement('button');
    element.type = 'button';
    element.className = 'decision-secondary';
    element.textContent = label;
    element.addEventListener('click', onClick);
    return element;
  }

  function poster(movie, decorative = false) {
    if (!movie?.posterUrl) return null;
    const image = document.createElement('img');
    image.src = movie.posterUrl;
    image.alt = decorative ? '' : `${movie.title} 포스터`;
    image.loading = 'lazy';
    return image;
  }

  async function loadMonth() {
    const session = getSession();
    if (!session) return;
    monthRequest?.abort();
    const request = new AbortController();
    monthRequest = request;
    const [year, number] = month.split('-').map(Number);
    find('#calendar-month').textContent = `${year}년 ${number}월`;
    days.replaceChildren();
    find('#month-summary').textContent = '';
    dateEntries.replaceChildren();
    datePanel.hidden = true;
    entriesByDate = new Map();
    status.textContent = '이 달의 기록을 불러오는 중…';

    try {
      const { entries } = await requestEntries(session, { month, signal: request.signal });
      if (request.signal.aborted) return;
      for (const entry of entries) {
        const group = entriesByDate.get(entry.watched_on) ?? [];
        group.push(entry);
        entriesByDate.set(entry.watched_on, group);
      }
      const ratings = entries.filter(entry => entry.rating != null).map(entry => Number(entry.rating));
      const average = ratings.length
        ? (ratings.reduce((total, rating) => total + rating, 0) / ratings.length).toFixed(1)
        : null;
      find('#month-summary').textContent = `감상 기록 ${entries.length}편 · 관람일 ${entriesByDate.size}일 · ${average === null ? '별점 없음' : '평균 별점 ' + average + '점'}`;
      status.textContent = entries.length ? '' : '이 달에는 아직 감상 기록이 없어요.';
      renderDays();
      renderDate();
    } catch (error) {
      if (request.signal.aborted) return;
      status.textContent = error.message || '이 달의 기록을 불러오지 못했어요.';
      status.append(' ', button('다시 불러오기', loadMonth));
    }
  }

  function renderDays() {
    const [year, number] = month.split('-').map(Number);
    const offset = new Date(Date.UTC(year, number - 1, 1)).getUTCDay();
    const length = new Date(Date.UTC(year, number, 0)).getUTCDate();
    days.replaceChildren();
    for (let index = 0; index < offset; index++) {
      const blank = document.createElement('span');
      blank.setAttribute('aria-hidden', 'true');
      days.append(blank);
    }

    for (let day = 1; day <= length; day++) {
      const date = `${month}-${String(day).padStart(2, '0')}`;
      const entries = entriesByDate.get(date) ?? [];
      const cell = button(String(day), () => selectDay(date));
      cell.className = 'watch-calendar-cell';
      cell.dataset.date = date;
      cell.setAttribute('aria-label', `${year}년 ${number}월 ${day}일${entries.length ? `, ${entries.length}편` : ''}`);
      cell.setAttribute('aria-pressed', String(date === selectedDate));
      if (date === today) cell.setAttribute('aria-current', 'date');
      const covers = document.createElement('span');
      covers.className = 'day-covers';
      for (const entry of entries) {
        const image = poster(catalog.get(String(entry.movie_id)), true);
        if (image) covers.append(image);
        if (covers.childElementCount === 2) break;
      }
      if (covers.childElementCount) cell.append(covers);
      const remaining = entries.length - covers.childElementCount;
      if (remaining) {
        const count = document.createElement('span');
        count.className = 'watch-calendar-count';
        count.textContent = covers.childElementCount ? `+${remaining}` : `${remaining}편`;
        cell.append(count);
      }
      days.append(cell);
    }
  }

  function selectDay(date) {
    closeEditor();
    selectedDate = date;
    days.querySelectorAll('button').forEach(cell =>
      cell.setAttribute('aria-pressed', String(cell.dataset.date === date)));
    renderDate();
  }

  function renderDate() {
    datePanel.hidden = !selectedDate;
    if (!selectedDate) return;
    find('#calendar-date').textContent = new Intl.DateTimeFormat('ko-KR', {
      dateStyle: 'full', timeZone: 'UTC',
    }).format(new Date(selectedDate + 'T00:00:00Z'));
    dateEntries.replaceChildren();
    const entries = entriesByDate.get(selectedDate) ?? [];
    if (!entries.length) dateEntries.textContent = '이 날의 감상 기록이 없어요.';
    for (const entry of entries) {
      const movie = catalog.get(String(entry.movie_id));
      const card = document.createElement('article');
      const image = poster(movie);
      if (image) card.append(image);
      const body = document.createElement('div');
      const title = document.createElement('h3');
      title.textContent = movie?.title ?? '영화 정보를 찾을 수 없어요';
      body.append(title);
      const details = [
        entry.rating == null ? null : `내 별점 ${entry.rating}점`,
        entry.review,
        entry.experience_response && `${experienceLabels[entry.experience]} · ${reactions[entry.experience_response]}`,
      ];
      for (const detail of details.filter(Boolean)) {
        const line = document.createElement('p');
        line.textContent = detail;
        body.append(line);
      }
      const actions = document.createElement('div');
      actions.className = 'watch-entry-actions';
      const edit = button('수정', () => openEditor(entry));
      const remove = button('삭제', async () => {
        if (!window.confirm('이 감상 기록을 삭제할까요?')) return;
        const session = getSession();
        if (!session) return;
        remove.disabled = true;
        try {
          await requestEntries(session, { id: entry.id, method: 'DELETE' });
          if (getSession()?.user.id !== session.user.id) return;
          if (editor?.entry.id === entry.id) closeEditor();
          await loadMonth();
        } catch (error) {
          if (getSession()?.user.id === session.user.id) status.textContent = error.message;
        } finally {
          remove.disabled = false;
        }
      });
      actions.append(edit, remove);
      body.append(actions);
      card.append(body);
      dateEntries.append(card);
    }
  }

  function fillMovies(current) {
    const term = form.elements.search.value.trim().toLocaleLowerCase();
    const select = form.elements.movieId;
    select.replaceChildren(new Option('영화를 선택해 주세요', ''));
    for (const [id, movie] of catalog) {
      if (id === current || (!editor.fromSelection && movie.title.toLocaleLowerCase().includes(term))) {
        select.add(new Option(movie.title, id));
      }
    }
    select.value = current;
  }

  function updateReaction() {
    const reaction = find('#watch-reaction');
    const experience = String(editor.entry.movie_id) === form.elements.movieId.value
      ? experienceLabels[editor.entry.experience] : null;
    reaction.hidden = !experience;
    if (experience) reaction.querySelector('span').textContent = editor.entry.experience === 'refresh'
      ? '원했던 ‘기분 전환’이 됐나요?'
      : `원했던 감상 경험 ‘${experience}’, 느끼셨나요?`;
    else form.elements.experienceResponse.value = '';
  }

  function openEditor(entry, fromSelection = false) {
    editor = { entry, fromSelection };
    form.reset();
    formStatus.textContent = '';
    form.hidden = false;
    form.querySelector('.watch-movie-picker').hidden = fromSelection;
    fillMovies(entry.movie_id ? String(entry.movie_id) : '');
    form.elements.watchedOn.value = entry.watched_on;
    form.elements.rating.value = entry.rating ?? '';
    form.elements.review.value = entry.review ?? '';
    form.elements.experienceResponse.value = entry.experience_response ?? '';
    updateReaction();
    (fromSelection ? form.elements.watchedOn : form.elements.search).focus();
  }

  function closeEditor() {
    editor = null;
    form.hidden = true;
  }

  find('#add-watch-entry').addEventListener('click', () => openEditor({ watched_on: selectedDate }));
  cancel.addEventListener('click', closeEditor);
  form.elements.search.addEventListener('input', () => fillMovies(form.elements.movieId.value));
  form.elements.movieId.addEventListener('change', updateReaction);
  container.querySelectorAll('[data-month]').forEach(control => {
    control.addEventListener('click', () => {
      const next = monthAfter(month, Number(control.dataset.month));
      if (!isWatchMonth(next)) return;
      month = next;
      selectedDate = null;
      closeEditor();
      void loadMonth();
    });
  });

  form.addEventListener('submit', async (event) => {
    event.preventDefault();
    const session = getSession();
    if (!session || !editor || submit.disabled) return;
    const draft = editor;
    const { movieId, watchedOn, rating, review, experienceResponse } = form.elements;
    if (!isWatchDate(watchedOn.value)) {
      formStatus.textContent = '감상일을 확인해 주세요.';
      return;
    }
    submit.disabled = true;
    cancel.disabled = true;
    formStatus.textContent = '감상 기록을 저장하는 중…';
    try {
      const { entry } = await requestEntries(session, {
        method: draft.entry.id ? 'PATCH' : 'POST', id: draft.entry.id,
        body: {
          movieId: Number(movieId.value), watchedOn: watchedOn.value,
          rating: rating.value ? Number(rating.value) : null, review: review.value,
          experienceResponse: experienceResponse.value || null, fromSelection: draft.fromSelection,
        },
      });
      if (editor !== draft || getSession()?.user.id !== session.user.id) return;
      selectedDate = entry.watched_on;
      month = selectedDate.slice(0, 7);
      closeEditor();
      await loadMonth();
    } catch (error) {
      if (editor === draft) formStatus.textContent = `${error.message || '저장하지 못했어요.'} 다시 시도할 수 있어요.`;
    } finally {
      submit.disabled = false;
      cancel.disabled = false;
    }
  });
}
