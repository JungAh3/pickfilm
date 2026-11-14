export function createOttBadges(movie) {
  const wrapper = document.createElement('div');
  wrapper.className = 'ott-section';

  const label = document.createElement('p');
  label.className = 'ott-label';
  label.textContent = '시청 가능한 OTT';

  const list = document.createElement('ul');
  list.className = 'ott-badges';
  list.setAttribute('aria-label', '한국 구독형 시청 제공처');

    const rawProviders = movie.availability?.providers ?? [];
    const uniqueProviders = new Map();

    for (const provider of rawProviders) {
    const isNetflix =
        provider.name === 'Netflix' ||
        provider.name === 'Netflix Standard with Ads';

    const key = isNetflix ? 'netflix' : String(provider.id);
    const existing = uniqueProviders.get(key);

    // 넷플릭스는 일반 로고를 우선 사용합니다.
    if (!existing || (isNetflix && provider.name === 'Netflix')) {
        uniqueProviders.set(key, {
        ...provider,
        name: isNetflix ? 'Netflix' : provider.name,
        });
    }
    }

    const providers = [...uniqueProviders.values()];

  for (const provider of providers) {
    const item = document.createElement('li');
    item.className = 'ott-badge';
    item.title = provider.name;

    if (provider.logoUrl) {
      const image = document.createElement('img');
      image.src = provider.logoUrl;
      image.alt = provider.name;
      image.width = 32;
      image.height = 32;
      image.loading = 'lazy';

      image.addEventListener('error', () => {
        image.remove();
        item.textContent = provider.name;
        item.classList.add('ott-badge-fallback');
      }, { once: true });

      item.append(image);
    } else {
      item.textContent = provider.name;
      item.classList.add('ott-badge-fallback');
    }

    list.append(item);
  }

  wrapper.append(label);

  if (providers.length) {
    wrapper.append(list);
  } else {
    const message = document.createElement('p');
    message.textContent = '提供처 미확인'.replace('提供', '제공');
    wrapper.append(message);
  }

  return wrapper;
}