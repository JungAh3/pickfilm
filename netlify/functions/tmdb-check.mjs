export default async function handler(request) {
  if (request.method !== 'GET') {
    return Response.json(
      { message: 'GET 요청만 가능합니다.' },
      { status: 405 },
    );
  }

  const token = process.env.TMDB_READ_TOKEN?.trim();

  if (!token) {
    return Response.json(
      { message: '.env의 TMDB_READ_TOKEN을 확인해 주세요.' },
      { status: 500 },
    );
  }

  try {
    const response = await fetch(
      'https://api.themoviedb.org/3/movie/550?language=ko-KR',
      {
        headers: {
          Authorization: `Bearer ${token}`,
          Accept: 'application/json',
        },
        signal: AbortSignal.timeout(15000),
      },
    );

    if (!response.ok) {
      return Response.json(
        {
          message: 'TMDB 연결에 실패했습니다.',
          upstreamStatus: response.status,
        },
        { status: 502 },
      );
    }

    const movie = await response.json();

    return Response.json({
      success: true,
      message: 'TMDB 연결 성공',
      movie: {
        id: movie.id,
        title: movie.title,
        runtime: movie.runtime,
      },
    });
  } catch {
    return Response.json(
      { message: 'TMDB에 연결하지 못했습니다. 잠시 후 다시 시도해 주세요.' },
      { status: 502 },
    );
  }
}