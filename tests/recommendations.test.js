import test from 'node:test';
import assert from 'node:assert/strict';
import { recommendMovies } from '../src/recommendations.js';

// 실제 API에 접속하지 않는 테스트용 데이터입니다.
const movies = [
  makeMovie(1, 90, [8]),
  makeMovie(2, 100, [337]),
  makeMovie(3, 120, [8, 337]),
  makeMovie(4, 121, [337]),
];

function makeMovie(id, runtime, providerIds) {
  return {
    id,
    title: `테스트 영화 ${id}`,
    runtime,
    rating: 8,
    voteCount: 1000,
    genres: [{ id: 35, name: '코미디' }],
    availability: {
      subscriptionListed: true,
      providers: providerIds.map((id) => ({
        id,
        name: `OTT ${id}`,
      })),
    },
  };
}

const tags = Object.fromEntries(
  movies.map((movie) => [
    movie.id,
    {
      reviewed: true,
      experiences: { refresh: 1 },
      avoids: {
        violence: movie.id === 1 ? 'absent' : 'unknown',
        horror: 'unknown',
        slow: 'unknown',
        heavy: 'unknown',
      },
      reason: '테스트용 추천 이유',
    },
  ]),
);

function recommend(overrides = {}, excludedIds = []) {
  return recommendMovies(
    movies,
    {
      experience: 'refresh',
      avoid: [],
      genre: 'any',
      maxRuntime: null,
      providerIds: [],
      ...overrides,
    },
    tags,
    excludedIds,
  );
}

test('디즈니 플러스 선택 시 해당 OTT 영화만 추천한다', () => {
  const result = recommend({ providerIds: ['337'] });

  assert.deepEqual(
    result.movies.map((movie) => movie.id),
    [2, 3, 4],
  );
});

test('OTT 복수 선택은 그중 하나에서 제공되면 통과한다', () => {
  const result = recommend({ providerIds: ['8', '337'] });
  assert.equal(result.eligibleCount, 4);
});

test('90분 제한은 정확히 90분인 영화까지 포함한다', () => {
  const result = recommend({ maxRuntime: 90 });

  assert.deepEqual(
    result.movies.map((movie) => movie.id),
    [1],
  );
});

test('회피 요소 미확인을 없음으로 취급하지 않는다', () => {
  const result = recommend({ avoid: ['violence'] });

  assert.deepEqual(
    result.movies.map((movie) => movie.id),
    [1],
  );
});

test('재추천에서 이미 본 후보를 제외한다', () => {
  const result = recommend({}, [1, 2, 3]);

  assert.deepEqual(
    result.movies.map((movie) => movie.id),
    [4],
  );
});

test('조건에 맞는 영화가 없으면 조건을 완화하지 않는다', () => {
  const result = recommend({
    providerIds: ['337'],
    maxRuntime: 90,
  });

  assert.equal(result.movies.length, 0);
  assert.equal(result.eligibleCount, 0);
});

test('조건에 맞는 후보가 많아도 최대 3편만 반환한다', () => {
  const result = recommend();

  assert.equal(result.eligibleCount, 4);
  assert.equal(result.movies.length, 3);
});