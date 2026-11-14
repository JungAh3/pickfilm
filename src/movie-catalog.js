import { createOttBadges } from './ott-badges.js';
export async function showMovieCatalog() {
  const section = document.createElement('section');
  section.className = 'movie-catalog';

  const heading = document.createElement('h2');
  heading.textContent = '지금 확인된 OTT 영화';

  const message = document.createElement('p');
  message.className = 'catalog-message';
  message.textContent = '영화 정보를 가져오는 중입니다.';

  const grid = document.createElement('div');
  grid.className = 'catalog-grid';

  section.append(heading, message, grid);
  document.querySelector('main').append(section);

  try {
    const response = await fetch('/.netlify/functions/movies');

    if (!response.ok) {
      throw new Error('영화 정보를 가져오지 못했습니다.');
    }

    const result = await response.json();

    if (!Array.isArray(result.movies)) {
      throw new Error('영화 데이터 형식을 확인해 주세요.');
    }

    const movies = result.movies.filter(
      (movie) => movie.availability?.subscriptionListed === true,
    );

    message.textContent = movies.length
      ? `제공 목록에서 확인된 ${movies.length}편입니다. 조건별 추천 결과는 아닙니다.`
      : '현재 후보에서 한국 넷플릭스 제공 정보를 확인하지 못했습니다.';

    for (const movie of movies) {
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

      const title = document.createElement('h3');
      title.textContent = movie.title;

      const info = document.createElement('p');
      const runtime = movie.runtime > 0
        ? `${movie.runtime}분`
        : '상영시간 미확인';

      info.textContent =
        `${runtime} · TMDB ${Number(movie.rating).toFixed(1)}/10`;

        body.append(title, info, createOttBadges(movie));
      
        if (movie.availability.watchLink) {
        const link = document.createElement('a');
        link.href = movie.availability.watchLink;
        link.target = '_blank';
        link.rel = 'noopener noreferrer';
        link.textContent = '시청 제공처 확인 ↗';
        body.append(link);
      }

      card.append(body);
      grid.append(card);
    }

    const attribution = document.createElement('p');
    attribution.className = 'catalog-message';
    attribution.textContent =
      '영화 정보: TMDB · 제공처 정보: JustWatch. 실제 제공 여부는 시청 전에 확인해 주세요.';

    section.append(attribution);
  } catch (error) {
    message.textContent =
      `${error.message} 서버용 터미널이 실행 중인지 확인해 주세요.`;
  }
}