import { LanguageKey } from '../types';
import { TRANSLATIONS as RICH_TRANSLATIONS, getTranslationValue, interpolate } from '../i18n';

export { RICH_TRANSLATIONS as TRANSLATIONS };

/**
 * Backward-compatible static translation function
 */
export function t(key: string, lang: LanguageKey = 'es', params?: Record<string, string | number>): string {
  const dict = RICH_TRANSLATIONS[lang] || RICH_TRANSLATIONS.es;
  let text = getTranslationValue(dict, key);
  if (!text && lang !== 'es') {
    text = getTranslationValue(RICH_TRANSLATIONS.es, key);
  }
  return interpolate(text || key, params);
}

