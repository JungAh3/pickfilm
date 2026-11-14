export function readSelectedProviders(form) {
  return [...new Set(
    new FormData(form)
      .getAll('providers')
      .flatMap((value) => String(value).split(',')),
  )];
}

export async function setupProviderFilter() {
  const form = document.querySelector('#preferences-form');

  if (!form || form.querySelector('#provider-filter')) return;

  const fieldset = document.createElement('fieldset');
  fieldset.id = 'provider-filter';
  fieldset.className = 'section-card';

  const legend = document.createElement('legend');
  legend.textContent = '이용하는 OTT';

  const description = document.createElement('p');
  description.className = 'catalog-message';
  description.textContent =
    '여러 개 선택할 수 있습니다. 선택하지 않으면 전체 OTT에서 추천합니다.';

  const options = document.createElement('div');
  options.className = 'provider-options';

  const status = document.createElement('p');
  status.className = 'catalog-message';
  status.textContent = '현재 후보의 OTT 목록을 가져오는 중입니다.';
  status.setAttribute('role', 'status');

  fieldset.append(legend, description, options, status);

  const summary = form.querySelector('.summary-bar');
  form.insertBefore(fieldset, summary);

  try {
    const response = await fetch('/.netlify/functions/movies');

    if (!response.ok) throw new Error();

    const data = await response.json();
    if (!Array.isArray(data.movies)) throw new Error();

    const groups = new Map();

    for (const movie of data.movies) {
      for (const provider of movie.availability?.providers ?? []) {
        const isNetflix =
          provider.name === 'Netflix' ||
          provider.name === 'Netflix Standard with Ads';

        const key = isNetflix ? 'netflix' : String(provider.id);

        if (!groups.has(key)) {
          groups.set(key, {
            name: isNetflix ? 'Netflix' : provider.name,
            ids: new Set(),
          });
        }

        groups.get(key).ids.add(String(provider.id));
      }
    }

    const sortedGroups = [...groups.values()].sort(
      (a, b) => a.name.localeCompare(b.name, 'ko'),
    );

    for (const group of sortedGroups) {
      const label = document.createElement('label');
      label.className = 'provider-option';

      const checkbox = document.createElement('input');
      checkbox.type = 'checkbox';
      checkbox.name = 'providers';
      checkbox.value = [...group.ids].join(',');

      const text = document.createElement('span');
      text.textContent = group.name;

      label.append(checkbox, text);
      options.append(label);
    }

    status.textContent = sortedGroups.length
      ? '현재 영화 후보에서 확인된 제공처입니다. 대여·구매 상품은 제외합니다.'
      : '현재 후보에서 구독형 OTT 제공 정보를 확인하지 못했습니다.';
  } catch {
    status.textContent =
      'OTT 선택 목록을 불러오지 못했습니다. 현재는 전체 OTT 추천만 가능합니다. 서버 실행을 확인한 뒤 새로고침해 주세요.';
  }
}