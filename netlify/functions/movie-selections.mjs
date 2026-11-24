import { createClient } from '@supabase/supabase-js';

function json(body, status = 200) {
  return Response.json(body, { status, headers: { 'Cache-Control': 'no-store' } });
}

export default async function handler(request) {
  if (request.method !== 'GET' && request.method !== 'POST') {
    return json({ message: '지원하지 않는 요청입니다.' }, 405);
  }

  const token = request.headers.get('Authorization')?.match(/^Bearer ([^\s]+)$/i)?.[1];
  if (!token) return json({ message: '로그인이 필요합니다.' }, 401);

  const url = process.env.SUPABASE_URL?.trim();
  const key = (process.env.SUPABASE_PUBLISHABLE_KEY || process.env.VITE_SUPABASE_PUBLISHABLE_KEY)?.trim();
  if (!url || !key?.startsWith('sb_publishable_')) {
    return json({ message: '목록 서버 설정을 확인해 주세요.' }, 500);
  }

  try {
    const client = createClient(url, key, {
      global: { headers: { Authorization: `Bearer ${token}` } },
      auth: { persistSession: false, autoRefreshToken: false, detectSessionInUrl: false },
    });
    const { data: { user }, error: authError } = await client.auth.getUser(token);
    if (authError || !user) {
      return authError && (!authError.status || authError.status >= 500)
        ? json({ message: '로그인 상태를 확인하지 못했습니다.' }, 503)
        : json({ message: '로그인이 필요합니다.' }, 401);
    }

    const selections = client.from('movie_selections');
    if (request.method === 'GET') {
      const { data, error } = await selections.select('movie_id, selected_at')
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

    const { data, error } = await selections.upsert(
      { user_id: user.id, movie_id: movieId },
      { onConflict: 'user_id,movie_id', ignoreDuplicates: true },
    ).select('movie_id');
    if (error?.code === '23503') return json({ message: '저장할 수 없는 영화입니다.' }, 404);
    if (error) throw error;
    return json({ saved: data.length > 0 });
  } catch {
    return json({ message: '영화 기록을 처리하지 못했습니다.' }, 502);
  }
}
