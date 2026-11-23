import { readFileSync } from 'node:fs';
import { parseEnv } from 'node:util';
import { createClient } from '@supabase/supabase-js';

const identifier = 'custom:naver';
const issuer = 'https://nid.naver.com';

function requireValue(env, name) {
  const value = env[name]?.trim();
  if (!value) throw new Error(`.env에 ${name}을 입력해 주세요.`);
  return value;
}

async function main() {
  const mode = process.argv[2];
  if (mode !== 'setup' && mode !== 'check') {
    throw new Error('npm run auth:setup-naver 또는 npm run auth:check를 사용해 주세요.');
  }

  const env = parseEnv(readFileSync(new URL('../.env', import.meta.url), 'utf8'));
  const url = new URL(requireValue(env, 'SUPABASE_URL'));
  if (url.protocol !== 'https:' || url.href !== `${url.origin}/`) {
    throw new Error('SUPABASE_URL에 Supabase 프로젝트의 HTTPS 기본 주소를 입력해 주세요.');
  }
  if (env.VITE_SUPABASE_URL && new URL(env.VITE_SUPABASE_URL).origin !== url.origin) {
    throw new Error('SUPABASE_URL과 VITE_SUPABASE_URL이 같은 프로젝트를 가리켜야 합니다.');
  }

  const secret = requireValue(env, 'SUPABASE_SECRET_KEY');
  const clientId = mode === 'setup' ? requireValue(env, 'NAVER_CLIENT_ID') : null;
  const clientSecret = mode === 'setup' ? requireValue(env, 'NAVER_CLIENT_SECRET') : null;
  const { auth } = createClient(url.origin, secret, {
    auth: { persistSession: false, autoRefreshToken: false, detectSessionInUrl: false },
  });
  const api = auth.admin.customProviders;
  const list = await api.listProviders();
  if (list.error) throw new Error(`Supabase 공급자 조회 실패 (HTTP ${list.error.status ?? '미확인'}).`);
  const existing = list.data.providers.find((provider) => provider.identifier === identifier);

  if (mode === 'setup') {
    if (existing && (existing.provider_type !== 'oidc' || existing.client_id !== clientId)) {
      throw new Error('다른 유형 또는 Client ID로 등록된 custom:naver가 이미 있습니다.');
    }
    const config = {
      name: 'Naver',
      client_id: clientId,
      client_secret: clientSecret,
      issuer,
      scopes: ['openid'],
      pkce_enabled: true,
      email_optional: true,
      enabled: true,
    };
    const result = existing
      ? await api.updateProvider(identifier, config)
      : await api.createProvider({ identifier, provider_type: 'oidc', ...config });
    if (result.error) throw new Error(`네이버 공급자 등록 실패 (HTTP ${result.error.status ?? '미확인'}).`);
    console.log(`${url.hostname}: custom:naver OIDC 설정을 저장했습니다.`);
    return;
  }

  const response = await fetch(`${issuer}/.well-known/openid-configuration`, {
    signal: AbortSignal.timeout(10000),
  });
  if (!response.ok) throw new Error(`네이버 OIDC 공개 설정 조회 실패 (HTTP ${response.status}).`);
  const discovery = await response.json();
  const checks = {
    naverProviderExists: Boolean(existing),
    naverEnabled: existing?.enabled === true,
    naverUsesOidc: existing?.provider_type === 'oidc',
    naverIssuerMatches: existing?.issuer === issuer,
    naverRequestsOpenId: existing?.scopes?.includes('openid') === true,
    naverPkceEnabled: existing?.pkce_enabled === true,
    naverAllowsMissingEmail: existing?.email_optional === true,
    naverDiscoveryIssuerMatches: discovery.issuer === issuer,
    naverDiscoverySupportsPkce: discovery.code_challenge_methods_supported?.includes('S256') === true,
  };
  console.log(JSON.stringify({ providerCallback: `${url.origin}/auth/v1/callback`, checks }, null, 2));
  if (Object.values(checks).some((value) => !value)) process.exitCode = 1;
}

main().catch(({ message }) => {
  console.error(message);
  process.exitCode = 1;
});
