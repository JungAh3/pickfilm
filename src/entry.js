import './style.css';

const path = window.location.pathname.replace(/\/$/, '');
if (path === '/recommendations') {
  const { showRecommendationPage } = await import('./recommendation-view.js');
  showRecommendationPage(document.querySelector('#app'));
} else if (path === '/my-movies') {
  const { showMyMovies } = await import('./my-movies.js');
  showMyMovies(document.querySelector('#app'));
} else if (['/login', '/register', '/auth/callback'].includes(path)) {
  const { showAuthPage } = await import('./auth.js');
  showAuthPage(document.querySelector('#app'), path);
} else {
  await import('./main.js');
}
