export const LS_SETTINGS_KEY = "DA_GRAMATYK_SETTINGS";

export const defaultSettings = {
  fontSize: "normal",
  saveHistory: true,
  hideUnknown: false
};

export function readSettings() {
  if (typeof window === "undefined") return defaultSettings;
  try {
    const raw = localStorage.getItem(LS_SETTINGS_KEY);
    return raw ? { ...defaultSettings, ...JSON.parse(raw) } : defaultSettings;
  } catch (e) {
    return defaultSettings;
  }
}

export function updateSetting(key, value) {
  if (typeof window === "undefined") return;
  const current = readSettings();
  current[key] = value;
  localStorage.setItem(LS_SETTINGS_KEY, JSON.stringify(current));
}
