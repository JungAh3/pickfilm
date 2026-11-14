import { movieTags } from './data/movie-tags.js';

export function createContentAdvice(movieId) {
  const tags = movieTags[movieId];
  const section = document.createElement('section');
  section.className = 'content-advice';

  const heading = document.createElement('h3');
  heading.textContent = '시청 전 확인해 주세요';

  const explanation = document.createElement('p');
  explanation.textContent =
    '외부 관람 안내를 PICKFILM 기준으로 분류했습니다. 개인의 체감이나 상영본에 따라 다를 수 있습니다.';

  const labels = {
    violence: '잔인한 묘사',
    horror: '공포·위협 장면',
    slow: '느린 전개',
    heavy: '무거운 분위기',
  };

  const states = {
    present: '있음',
    absent: '설정 기준에 해당하지 않음',
    unknown: '미확인',
  };

  const list = document.createElement('ul');

  for (const [key, label] of Object.entries(labels)) {
    const item = document.createElement('li');
    const state = tags?.avoids?.[key] ?? 'unknown';
    item.textContent = `${label}: ${states[state] ?? '미확인'}`;
    list.append(item);
  }

  const criteria = document.createElement('p');
  criteria.textContent =
    '잔인한 묘사는 상세한 유혈·상처·신체 훼손을 뜻합니다. 가벼운 몸싸움까지 모두 제외하는 기준은 아닙니다. 미확인은 해당 장면이 없다는 뜻이 아닙니다.';

  section.append(heading, explanation, list, criteria);

  const review = tags?.contentReview;

  if (review) {
    const note = document.createElement('p');
    note.textContent = review.note;

    const source = document.createElement('a');
    source.href = review.source;
    source.target = '_blank';
    source.rel = 'noopener noreferrer';
    source.textContent = 'BBFC 관람 안내 확인 ↗';

    const date = document.createElement('p');
    date.textContent = `출처 확인일: ${review.checkedAt}`;

    section.append(note, source, date);
  } else {
    const pending = document.createElement('p');
    pending.textContent =
      '이 영화는 회피 요소의 출처 검토가 아직 완료되지 않았습니다.';
    section.append(pending);
  }

  return section;
}