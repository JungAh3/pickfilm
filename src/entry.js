import './style.css';

const path = window.location.pathname.replace(/\/$/, '');
if (['/login', '/register', '/auth/callback'].includes(path)) {
  const { showAuthPage } = await import('./auth.js');
  showAuthPage(document.querySelector('#app'), path);
} else {
  await import('./main.js');
}
