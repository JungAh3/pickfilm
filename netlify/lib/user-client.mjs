import { createClient } from '@supabase/supabase-js';

export function json(body, status = 200) {
  return Response.json(body, { status, headers: { 'Cache-Control': 'no-store' } });
}

export async function authenticate(request) {
  const token = request.headers.get('Authorization')?.match(/^Bearer ([^\s]+)$/i)?.[1];
  if (!token) return { response: json({ message: '로그인이 필요합니다.' }, 401) };

  const url = process.env.SUPABASE_URL?.trim();
  const key = (process.env.SUPABASE_PUBLISHABLE_KEY || process.env.VITE_SUPABASE_PUBLISHABLE_KEY)?.trim();
  if (!url || !key?.startsWith('sb_publishable_')) {
    return { response: json({ message: '서버 설정을 확인해 주세요.' }, 500) };
  }

  const client = createClient(url, key, {
    global: { headers: { Authorization: `Bearer ${token}` } },
    auth: { persistSession: false, autoRefreshToken: false, detectSessionInUrl: false },
  });
  const { data: { user }, error } = await client.auth.getUser(token);
  if (error && (!error.status || error.status >= 500)) {
    return { response: json({ message: '로그인 상태를 확인하지 못했습니다.' }, 503) };
  }
  if (error || !user) return { response: json({ message: '로그인이 필요합니다.' }, 401) };
  return { client, user };
}
