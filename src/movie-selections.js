export async function requestMovieSelections(session, movieId, signal, experience) {
  const headers = { Authorization: `Bearer ${session.access_token}` };
  const options = { headers, signal, cache: 'no-store' };
  if (movieId !== undefined) {
    headers['Content-Type'] = 'application/json';
    options.method = 'POST';
    options.body = JSON.stringify({ movieId, experience });
  }
  const response = await fetch('/.netlify/functions/movie-selections', options);
  if (!response.ok) throw new Error('영화 기록 요청에 실패했습니다.');
  return response.json();
}
