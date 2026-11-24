import { authenticate, json } from '../lib/user-client.mjs';
import { isWatchDate, isWatchMonth, monthAfter } from '../../src/watch-dates.js';

const responses = ['yes', 'somewhat', 'disappointed'];
const fields = 'id, movie_id, watched_on, rating, review, experience, experience_response';
const uuid = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

export default async function handler(request) {
  const { method } = request;
  if (!['GET', 'POST', 'PATCH', 'DELETE'].includes(method)) {
    return json({ message: '지원하지 않는 요청입니다.' }, 405);
  }

  try {
    const { client, user, response } = await authenticate(request);
    if (response) return response;
    const params = new URL(request.url).searchParams;
    const entries = client.from('watch_entries');
    if (method === 'GET') {
      const month = params.get('month');
      if (!isWatchMonth(month)) return json({ message: '조회할 달을 확인해 주세요.' }, 400);
      const { data, error } = await entries.select(fields).eq('user_id', user.id)
        .gte('watched_on', `${month}-01`).lt('watched_on', `${monthAfter(month, 1)}-01`)
        .order('watched_on').order('movie_id');
      if (error) throw error;
      return json({ entries: data });
    }

    const id = params.get('id');
    if (method !== 'POST' && !uuid.test(id ?? '')) {
      return json({ message: '감상 기록 ID를 확인해 주세요.' }, 400);
    }
    if (method === 'DELETE') {
      const { data, error } = await entries.delete().eq('user_id', user.id)
        .eq('id', id).select('id').maybeSingle();
      if (error) throw error;
      return data ? json({ deleted: true }) : json({ message: '기록을 찾을 수 없어요.' }, 404);
    }

    const body = await request.json().catch(() => null);
    const movieId = body?.movieId;
    const watchedOn = body?.watchedOn;
    const rating = body?.rating ?? null;
    const review = body?.review ?? '';
    const answer = body?.experienceResponse ?? null;
    if (!Number.isSafeInteger(movieId) || movieId <= 0 || !isWatchDate(watchedOn)
      || (rating !== null && (!Number.isInteger(rating * 2) || typeof rating !== 'number' || rating < 0.5 || rating > 5))
      || typeof review !== 'string' || review.length > 500 || (answer !== null && !responses.includes(answer))) {
      return json({ message: '영화, 날짜, 별점 또는 감상평을 확인해 주세요.' }, 400);
    }

    let experience = null;
    let current;
    if (method === 'PATCH') {
      const { data, error } = await entries.select('movie_id, experience').eq('user_id', user.id)
        .eq('id', id).maybeSingle();
      if (error) throw error;
      if (!data) return json({ message: '기록을 찾을 수 없어요.' }, 404);
      current = data;
      if (Number(data.movie_id) === movieId) experience = data.experience;
    } else if (body.fromSelection === true) {
      const { data, error } = await client.from('movie_selections').select('experience')
        .eq('user_id', user.id).eq('movie_id', movieId).maybeSingle();
      if (error) throw error;
      if (!data) return json({ message: '내가 고른 영화에서 해당 작품을 찾을 수 없어요.' }, 404);
      experience = data.experience;
    }
    if (answer && !experience) return json({ message: '연결된 감상 경험이 없어요.' }, 400);

    const record = {
      movie_id: movieId, watched_on: watchedOn, rating, review: review.trim() || null,
      experience, experience_response: answer,
    };
    const write = method === 'POST'
      ? entries.insert({ ...record, user_id: user.id })
      : entries.update(record).eq('user_id', user.id).eq('id', id).eq('movie_id', current.movie_id);
    const { data, error } = await write.select(fields).maybeSingle();
    if (error?.code === '23505') return json({ message: '이 날짜에 같은 영화의 기록이 이미 있어요.' }, 409);
    if (error?.code === '23503') return json({ message: '등록된 영화를 선택해 주세요.' }, 400);
    if (error) throw error;
    if (!data) return json({ message: '기록을 다시 불러온 뒤 시도해 주세요.' }, 404);
    return json({ entry: data }, method === 'POST' ? 201 : 200);
  } catch {
    return json({ message: '감상 기록을 처리하지 못했어요. 다시 시도해 주세요.' }, 502);
  }
}
