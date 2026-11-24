const storageKey = 'pickfilm-recommendation-v1';

export function readRecommendation() {
  try {
    const state = JSON.parse(sessionStorage.getItem(storageKey));
    return state?.preferences ? state : null;
  } catch {
    return null;
  }
}

export function saveRecommendation(state) {
  sessionStorage.setItem(storageKey, JSON.stringify(state));
}
