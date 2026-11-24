import { createClient } from '@supabase/supabase-js';

const callbackPath = '/auth/callback';
const configMessage = '로그인 설정을 확인해 주세요.';
const callbackError = '인증을 완료하지 못했습니다. 가입 또는 로그인을 시작한 브라우저에서 다시 시도해 주세요.';

function createAuthClient(detectSessionInUrl = true) {
  const url = import.meta.env.VITE_SUPABASE_URL?.trim();
  const key = import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY?.trim();
  if (!url || !key?.startsWith('sb_publishable_')) return null;

  try {
    return createClient(url, key, {
      auth: { flowType: 'pkce', detectSessionInUrl },
    });
  } catch {
    return null;
  }
}

function accountLinks(path) {
  return `
    <nav class="account-nav" aria-label="계정">
      <a href="/login"${path === '/login' ? ' aria-current="page"' : ''}>로그인</a>
      <a href="/register"${path === '/register' ? ' aria-current="page"' : ''}>회원가입</a>
    </nav>
  `;
}

function passwordField(name, label, autocomplete) {
  return `
    <div class="account-field">
      <label for="account-${name}">${label}</label>
      <div class="account-password">
        <input id="account-${name}" name="${name}" type="password" autocomplete="${autocomplete}" required />
        <button type="button" class="password-toggle" aria-controls="account-${name}"
          aria-label="${label} 보기">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.7"
            stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
            <path d="M2 12s3.6-6 10-6 10 6 10 6-3.6 6-10 6S2 12 2 12Z" />
            <circle cx="12" cy="12" r="2.6" />
            <path class="password-toggle-slash" d="M4 4l16 16" />
          </svg>
        </button>
      </div>
    </div>
  `;
}

export function setupAuth(container) {
  const client = createAuthClient();
  container.innerHTML = `
    ${accountLinks()}
    <span class="account-name" aria-live="polite"></span>
    <button type="button" class="account-logout" hidden>로그아웃</button>
    <p class="account-status" role="status">로그인 상태 확인 중…</p>
  `;
  const links = container.querySelector('nav');
  const nameLabel = container.querySelector('.account-name');
  const logout = container.querySelector('button');
  const status = container.querySelector('p');
  if (!client) {
    status.textContent = configMessage;
    return;
  }

  const { auth } = client;
  let userId = null;
  let profileRequest;

  function clearName() {
    profileRequest?.abort();
    nameLabel.textContent = '';
  }

  function loadName(id) {
    const request = new AbortController();
    profileRequest = request;
    // Start the database request outside the auth callback's session lock.
    setTimeout(async () => {
      if (request.signal.aborted) return;
      try {
        const { data, error } = await client.from('profiles')
          .select('name')
          .eq('id', id)
          .abortSignal(request.signal)
          .maybeSingle();
        const name = data?.name?.trim();
        if (!request.signal.aborted && !error && name) {
          nameLabel.textContent = `${name}님`;
        }
      } catch {
        // Profile lookup failures leave the account controls usable.
      }
    }, 0);
  }

  auth.onAuthStateChange((event, session) => {
    links.hidden = Boolean(session);
    logout.hidden = !session;
    if (session || event === 'INITIAL_SESSION' || event === 'SIGNED_OUT') {
      status.textContent = '';
    }
    const nextUserId = session?.user.id ?? null;
    if (nextUserId !== userId) {
      clearName();
      userId = nextUserId;
      if (userId) loadName(userId);
    }
  });

  logout.addEventListener('click', async () => {
    logout.disabled = true;
    const signingOutUserId = userId;
    clearName();
    try {
      const { error } = await auth.signOut({ scope: 'local' });
      if (error) throw error;
      status.textContent = '로그아웃되었습니다.';
      links.querySelector('a').focus();
    } catch {
      status.textContent = '로그아웃하지 못했습니다. 다시 시도해 주세요.';
      if (userId && userId === signingOutUserId) loadName(userId);
    } finally {
      logout.disabled = false;
    }
  });
}

export function showAuthPage(container, path) {
  const isCallback = path === callbackPath;
  const registering = path === '/register';
  const title = isCallback ? '인증 확인' : registering ? '회원가입' : '로그인';
  document.title = `${title} | PICKFILM`;
  container.classList.add('auth-layout');
  container.innerHTML = `
    <header class="site-header">
      <a class="brand" href="/" aria-label="PICKFILM 처음으로">
        <span class="brand-icon" aria-hidden="true">▶</span> PICKFILM
      </a>
      ${accountLinks(path)}
    </header>
    <main class="section-card auth-page">
      <h1>${title}</h1>
      <p class="account-status" role="status"></p>
      ${isCallback ? '<a class="auth-link" href="/login">로그인으로 돌아가기</a>' : `
        <form class="account-form">
          ${registering ? `
            <div class="account-field">
              <label for="account-name">이름</label>
              <input id="account-name" name="name" autocomplete="name" placeholder="홍길동" required />
            </div>
          ` : ''}
          <div class="account-field">
            <label for="account-email">이메일</label>
            <input id="account-email" name="email" type="email" autocomplete="email"
              placeholder="example@email.com" required />
          </div>
          ${passwordField('password', '비밀번호', registering ? 'new-password' : 'current-password')}
          ${registering ? passwordField('confirmPassword', '비밀번호 확인', 'new-password') : ''}
          <button class="account-button account-primary" type="submit">
            ${title}
          </button>
        </form>
        <div class="account-actions" aria-label="다른 계정으로 로그인">
          <p>또는 다른 계정으로 로그인</p>
          <button class="account-button" type="button" data-provider="google">
            <svg viewBox="0 0 24 24" aria-hidden="true">
              <path fill="#4285F4" d="M21.6 12.23c0-.71-.06-1.39-.18-2.05H12v3.88h5.38a4.6 4.6 0 0 1-1.99 3.02v2.51h3.23c1.89-1.74 2.98-4.3 2.98-7.36Z" />
              <path fill="#34A853" d="M12 22c2.7 0 4.96-.9 6.62-2.41l-3.23-2.51c-.9.6-2.04.96-3.39.96-2.6 0-4.81-1.76-5.6-4.12H3.07v2.59A10 10 0 0 0 12 22Z" />
              <path fill="#FBBC05" d="M6.4 13.92a6 6 0 0 1 0-3.84V7.49H3.07a10 10 0 0 0 0 9.02l3.33-2.59Z" />
              <path fill="#EA4335" d="M12 5.96c1.47 0 2.79.51 3.83 1.51l2.87-2.87A9.6 9.6 0 0 0 12 2a10 10 0 0 0-8.93 5.49l3.33 2.59c.79-2.36 3-4.12 5.6-4.12Z" />
            </svg>
            <span>Google로 로그인</span>
          </button>
          <button class="account-button account-naver" type="button" data-provider="custom:naver">
            <svg viewBox="0 0 24 24" aria-hidden="true">
              <path fill="currentColor" d="M14.7 13.1 9 5H4v14h5.3v-8.1L15 19h5V5h-5.3z" />
            </svg>
            <span>네이버로 로그인</span>
          </button>
        </div>
        <p class="account-switch">${registering
          ? '이미 계정이 있으신가요? <a class="auth-link" href="/login">로그인하기</a>'
          : '계정이 없으신가요? <a class="auth-link" href="/register">회원가입하기</a>'}</p>
      `}
    </main>
  `;

  const auth = createAuthClient(!isCallback)?.auth;
  const status = container.querySelector('.account-status');
  if (isCallback) {
    if (auth) void finishCallback(auth, status);
    else status.textContent = configMessage;
    return;
  }

  const form = container.querySelector('form');
  const buttons = container.querySelectorAll('[type="submit"], [data-provider]');
  form.querySelectorAll('.password-toggle').forEach((button) => {
    const input = form.querySelector(`#${button.getAttribute('aria-controls')}`);
    button.addEventListener('click', () => {
      const visible = input.type === 'password';
      const action = visible ? '숨기기' : '보기';
      input.type = visible ? 'text' : 'password';
      button.classList.toggle('is-visible', visible);
      button.setAttribute('aria-label', `${input.labels[0].textContent} ${action}`);
    });
  });
  function setPending(value) {
    buttons.forEach((button) => { button.disabled = value; });
  }

  if (!auth) {
    setPending(true);
    status.textContent = configMessage;
    return;
  }

  const params = new URLSearchParams(window.location.search);
  if (params.has('auth-error')) status.textContent = callbackError;
  if (params.has('confirm-email')) status.textContent = '확인 메일을 열어 주세요.';
  auth.onAuthStateChange((_, session) => {
    if (session) window.location.replace('/');
  });

  const redirectTo = new URL(callbackPath, window.location.origin).href;
  let pending = false;
  async function submit(message, request) {
    if (pending) return;
    pending = true;
    setPending(true);
    status.textContent = message;
    try {
      await request();
    } catch {
      status.textContent = '인증 요청을 완료하지 못했습니다. 잠시 후 다시 시도해 주세요.';
    } finally {
      pending = false;
      setPending(false);
    }
  }

  form.addEventListener('submit', (event) => {
    event.preventDefault();
    if (pending) return;
    const name = registering ? form.elements.namedItem('name').value.trim() : '';
    const password = form.elements.password.value;
    if (registering && !name) {
      status.textContent = '이름을 입력해 주세요.';
      form.elements.namedItem('name').focus();
      return;
    }
    if (registering && password !== form.elements.confirmPassword.value) {
      status.textContent = '비밀번호와 비밀번호 확인이 일치하지 않습니다.';
      form.elements.confirmPassword.focus();
      return;
    }
    void submit(registering ? '가입 요청 중…' : '로그인 중…', async () => {
      const credentials = {
        email: form.elements.email.value.trim(),
        password,
      };
      const { data, error } = registering
        ? await auth.signUp({
            ...credentials,
            options: { emailRedirectTo: redirectTo, data: { name } },
          })
        : await auth.signInWithPassword(credentials);

      if (error) {
        status.textContent = error.code === 'email_not_confirmed'
          ? '확인 메일을 열어 이메일 인증을 완료해 주세요.'
          : '이메일과 비밀번호를 확인한 뒤 다시 시도해 주세요.';
      } else if (registering && !data.session) {
        window.location.replace('/login?confirm-email');
      }
    });
  });

  container.querySelectorAll('[data-provider]').forEach((button) => {
    button.addEventListener('click', () => {
      void submit('로그인 화면으로 이동 중…', async () => {
        const { data, error } = await auth.signInWithOAuth({
          provider: button.dataset.provider,
          options: { redirectTo, skipBrowserRedirect: true },
        });
        if (error || !data.url) throw error ?? new Error('Missing OAuth URL');
        window.location.assign(data.url);
      });
    });
  });
}

async function finishCallback(auth, status) {
  status.textContent = '로그인 상태 확인 중…';
  const url = new URL(window.location.href);
  const hash = new URLSearchParams(url.hash.slice(1));
  const code = url.searchParams.get('code');

  if (code && ![url.searchParams, hash].some((params) =>
    ['error', 'error_code', 'error_description'].some((key) => params.has(key)),
  )) {
    try {
      const { data, error } = await auth.exchangeCodeForSession(code);
      if (!error && data.session) {
        window.location.replace('/');
        return;
      }
    } catch {
      // A failed exchange requires a new sign-in attempt.
    }
  }
  window.location.replace('/login?auth-error');
}
