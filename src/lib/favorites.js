export const LS_FAVORITES_KEY = "DA_GRAMATYK_FAVORITES";

export function readFavorites() {
  if (typeof window === "undefined") return [];
  try {
    const raw = localStorage.getItem(LS_FAVORITES_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch (e) {
    return [];
  }
}

export function saveToFavorites(word) {
  if (typeof window === "undefined") return;
  const list = readFavorites();
  if (!list.includes(word)) {
    list.unshift(word);
    localStorage.setItem(LS_FAVORITES_KEY, JSON.stringify(list));
  }
}

export function removeFromFavorites(word) {
  if (typeof window === "undefined") return;
  const list = readFavorites().filter(w => w !== word);
  localStorage.setItem(LS_FAVORITES_KEY, JSON.stringify(list));
}

export function isFavorite(word) {
  return readFavorites().includes(word);
}
