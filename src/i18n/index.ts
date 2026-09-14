import { LanguageKey } from '../types';
import { es } from './locales/es';
import { en } from './locales/en';
import { pt } from './locales/pt';
import { fr } from './locales/fr';

export interface SupportedLanguage {
  code: LanguageKey;
  label: string;
  nativeName: string;
  flag: string;
  isReady: boolean;
}

export const SUPPORTED_LANGUAGES: SupportedLanguage[] = [
  {
    code: 'es',
    label: 'Español',
    nativeName: 'Español',
    flag: '🇪🇸',
    isReady: true
  },
  {
    code: 'en',
    label: 'English',
    nativeName: 'English',
    flag: '🇺🇸',
    isReady: true
  },
  {
    code: 'pt',
    label: 'Português',
    nativeName: 'Português',
    flag: '🇧🇷',
    isReady: true
  },
  {
    code: 'fr',
    label: 'Français',
    nativeName: 'Français',
    flag: '🇫🇷',
    isReady: true
  }
];

export const TRANSLATIONS: Record<LanguageKey, typeof es> = {
  es,
  en,
  pt,
  fr
};

/**
 * Resolves a dot-notated key (e.g. 'common.loading' or 'nav.lobby') in a dictionary.
 */
export function getTranslationValue(
  dict: Record<string, any>,
  key: string
): string | undefined {
  if (!dict || !key) return undefined;

  // Direct lookup
  if (typeof dict[key] === 'string') {
    return dict[key];
  }

  // Nested dot lookup
  const parts = key.split('.');
  let current: any = dict;
  for (const part of parts) {
    if (current && typeof current === 'object' && part in current) {
      current = current[part];
    } else {
      return undefined;
    }
  }

  return typeof current === 'string' ? current : undefined;
}

/**
 * Replaces parameters like {count} or {name} in a string
 */
export function interpolate(text: string, params?: Record<string, string | number>): string {
  if (!params || !text) return text;
  let result = text;
  for (const [k, v] of Object.entries(params)) {
    result = result.replace(new RegExp(`\\{${k}\\}`, 'g'), String(v));
  }
  return result;
}
