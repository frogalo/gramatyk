export const LS_HISTORY_KEY = "gramatyk_history";
export const OLD_LS_HISTORY_KEY = "leksyka_history";

export const readHistory = () => {
  try { 
    const history = localStorage.getItem(LS_HISTORY_KEY);
    if (history) return JSON.parse(history);
    // Migration
    const oldHistory = localStorage.getItem(OLD_LS_HISTORY_KEY);
    if (oldHistory) {
      localStorage.setItem(LS_HISTORY_KEY, oldHistory);
      localStorage.removeItem(OLD_LS_HISTORY_KEY);
      return JSON.parse(oldHistory);
    }
    return [];
  }
  catch { return []; }
};

export const saveToHistory = (word, count) => {
  const history = readHistory();
  const idx = history.findIndex((h) => h.word === word);
  if (idx !== -1) history.splice(idx, 1);
  history.unshift({ word, count, ts: Date.now() });
  localStorage.setItem(LS_HISTORY_KEY, JSON.stringify(history.slice(0, 30)));
};

export const removeFromHistory = (word) => {
  const history = readHistory().filter((h) => h.word !== word);
  localStorage.setItem(LS_HISTORY_KEY, JSON.stringify(history));
};

export const clearAllHistory = () => {
  localStorage.removeItem(LS_HISTORY_KEY);
};
