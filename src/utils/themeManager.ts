import { ThemeSettings } from '../types';

const THEME_STORAGE_KEY = 'qatrah_theme_settings_v2';

export const THEME_PRESETS: Record<string, Omit<ThemeSettings, 'voiceGender'>> = {
  dark: {
    isDarkMode: true,
    preset: 'dark',
    bgMain: '#020617', // slate-950
    bgCard: '#0f172a', // slate-900
    textMain: '#f8fafc', // white-slate
    textMuted: '#94a3b8', // slate-400
    accentPrimary: '#06b6d4', // cyan-500
    borderColor: 'rgba(255, 255, 255, 0.1)',
  },
  light: {
    isDarkMode: false,
    preset: 'light',
    bgMain: '#f8fafc', // pure white-slate background
    bgCard: '#ffffff', // bright clean card
    textMain: '#0f172a', // crisp black / deep slate text
    textMuted: '#475569', // slate-600 readable secondary text
    accentPrimary: '#0284c7', // royal sky-blue
    borderColor: 'rgba(15, 23, 42, 0.14)',
  },
  hydro: {
    isDarkMode: true,
    preset: 'hydro',
    bgMain: '#031726', // deep Nile water navy
    bgCard: '#0b2942', // marine blue card
    textMain: '#e0f2fe', // sky-100
    textMuted: '#7dd3fc', // sky-300
    accentPrimary: '#38bdf8', // sky-400
    borderColor: 'rgba(56, 189, 248, 0.25)',
  },
  lab: {
    isDarkMode: true,
    preset: 'lab',
    bgMain: '#022c22', // emerald chemistry dark
    bgCard: '#064e3b', // deep emerald card
    textMain: '#ecfdf5', // emerald-50
    textMuted: '#6ee7b7', // emerald-300
    accentPrimary: '#10b981', // emerald-500
    borderColor: 'rgba(16, 185, 129, 0.25)',
  },
  royal: {
    isDarkMode: true,
    preset: 'royal',
    bgMain: '#18181b', // zinc-900
    bgCard: '#27272a', // zinc-800
    textMain: '#fef08a', // amber-200
    textMuted: '#fde047', // amber-300
    accentPrimary: '#eab308', // amber-500
    borderColor: 'rgba(234, 179, 8, 0.3)',
  },
};

export const DEFAULT_THEME_SETTINGS: ThemeSettings = {
  ...THEME_PRESETS.dark,
  voiceGender: 'male',
};

export const getThemeSettings = (): ThemeSettings => {
  try {
    const raw = localStorage.getItem(THEME_STORAGE_KEY);
    if (!raw) {
      return DEFAULT_THEME_SETTINGS;
    }
    return { ...DEFAULT_THEME_SETTINGS, ...JSON.parse(raw) };
  } catch (err) {
    console.error('Error loading theme settings:', err);
    return DEFAULT_THEME_SETTINGS;
  }
};

export const saveThemeSettings = (settings: ThemeSettings): void => {
  try {
    localStorage.setItem(THEME_STORAGE_KEY, JSON.stringify(settings));
    applyThemeToDOM(settings);
  } catch (err) {
    console.error('Error saving theme settings:', err);
  }
};

export const applyThemeToDOM = (settings: ThemeSettings): void => {
  if (typeof document === 'undefined') return;

  const root = document.documentElement;

  // Set CSS Variables
  root.style.setProperty('--bg-main', settings.bgMain);
  root.style.setProperty('--bg-card', settings.bgCard);
  root.style.setProperty('--text-main', settings.textMain);
  root.style.setProperty('--text-muted', settings.textMuted);
  root.style.setProperty('--accent-primary', settings.accentPrimary);
  root.style.setProperty('--border-color', settings.borderColor);

  // Toggle class for light vs dark if needed
  if (!settings.isDarkMode) {
    root.classList.add('light-theme');
    root.classList.remove('dark-theme');
    document.body.style.backgroundColor = settings.bgMain;
    document.body.style.color = settings.textMain;
  } else {
    root.classList.add('dark-theme');
    root.classList.remove('light-theme');
    document.body.style.backgroundColor = settings.bgMain;
    document.body.style.color = settings.textMain;
  }
};

export const getVoiceGender = (): 'male' | 'female' => {
  return getThemeSettings().voiceGender || 'male';
};

export const setVoiceGender = (gender: 'male' | 'female'): void => {
  const current = getThemeSettings();
  saveThemeSettings({ ...current, voiceGender: gender });
};
