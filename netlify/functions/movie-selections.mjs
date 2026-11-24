import { authenticate, json } from '../lib/user-client.mjs';

export default async function handler(request) {
  if (request.method !== 'GET' && request.method !== 'POST') {
    return json({ message: '지원하지 않는 요청입니다.' }, 405);
  }

  try {
    const { client, user, response } = await authenticate(request);
    if (response) return response;

    const selections = client.from('movie_selections');
    if (request.method === 'GET') {
      const { data, error } = await selections.select('movie_id, selected_at, experience')
        .eq('user_id', user.id)
        .order('selected_at', { ascending: false })
        .order('movie_id', { ascending: false });
      if (error) throw error;
      return json({ selections: data });
    }

    const body = await request.json().catch(() => null);
    const movieId = body?.movieId;
    if (!Number.isSafeInteger(movieId) || movieId <= 0) {
      return json({ message: '유효한 영화 ID가 필요합니다.' }, 400);
    }
    const experience = body.experience ?? null;
    if (experience !== null && !['refresh', 'comfort', 'laugh', 'thrill', 'linger'].includes(experience)) {
      return json({ message: '감상 경험을 확인해 주세요.' }, 400);
    }

    const { data, error } = await selections.upsert(
      { user_id: user.id, movie_id: movieId, experience },
      { onConflict: 'user_id,movie_id', ignoreDuplicates: true },
    ).select('movie_id');
    if (error?.code === '23503') return json({ message: '저장할 수 없는 영화입니다.' }, 404);
    if (error) throw error;
    return json({ saved: data.length > 0 });
  } catch {
    return json({ message: '영화 기록을 처리하지 못했습니다.' }, 502);
  }
}
