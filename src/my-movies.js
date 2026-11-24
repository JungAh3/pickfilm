import { setupAuth } from './auth.js';
import { requestMovieSelections } from './movie-selections.js';

export function showMyMovies(container) {
  document.title = '내가 고른 영화 | PICKFILM';
  container.innerHTML = `
    <header class="site-header">
      <a class="brand" href="/" aria-label="PICKFILM 처음으로">
        <span class="brand-icon" aria-hidden="true">▶</span> PICKFILM
      </a>
      <div id="account"></div>
    </header>
    <main class="page my-movies-page">
      <h1>내가 고른 영화</h1>
      <p class="catalog-message" role="status">로그인 상태 확인 중…</p>
      <div class="catalog-grid"></div>
      <a class="decision-secondary" href="/">영화 추천받기</a>
    </main>
  `;

  const status = container.querySelector('main [role="status"]');
  const grid = container.querySelector('.catalog-grid');
  const formatDate = new Intl.DateTimeFormat('ko-KR', { dateStyle: 'long' });
  let activeRequest;

  setupAuth(container.querySelector('#account'), async (session) => {
    activeRequest?.abort();
    grid.replaceChildren();
    if (!session) {
      status.textContent = '로그인하면 내가 고른 영화를 볼 수 있어요.';
      return;
    }

    const request = new AbortController();
    activeRequest = request;
    status.textContent = '고른 영화를 불러오는 중…';

    try {
      const { selections } = await requestMovieSelections(session, undefined, request.signal);
      if (request.signal.aborted) return;
      if (selections.length === 0) {
        status.textContent = '아직 고른 영화가 없어요.';
        return;
      }

      const response = await fetch('/.netlify/functions/movies', { signal: request.signal });
      if (!response.ok) throw new Error('Movie catalogue unavailable');
      const { movies } = await response.json();
      if (request.signal.aborted) return;
      const byId = new Map(movies.map((movie) => [String(movie.id), movie]));

      for (const selection of selections) {
        const movie = byId.get(String(selection.movie_id));
        const card = document.createElement('article');
        card.className = 'catalog-card';
        if (movie?.posterUrl) {
          const poster = document.createElement('img');
          poster.src = movie.posterUrl;
          poster.alt = `${movie.title} 포스터`;
          poster.loading = 'lazy';
          card.append(poster);
        }
        const body = document.createElement('div');
        body.className = 'catalog-card-body';
        const title = document.createElement('h2');
        title.textContent = movie?.title ?? '영화 정보를 찾을 수 없어요';
        const date = document.createElement('time');
        date.dateTime = selection.selected_at;
        date.textContent = `처음 고른 날 ${formatDate.format(new Date(date.dateTime))}`;
        body.append(title, date);
        card.append(body);
        grid.append(card);
      }
      status.textContent = `${selections.length}편을 골랐어요.`;
    } catch {
      if (!request.signal.aborted) {
        grid.replaceChildren();
        status.textContent = '목록을 불러오지 못했어요. 잠시 후 새로고침해 주세요.';
      }
    }
  });
}
