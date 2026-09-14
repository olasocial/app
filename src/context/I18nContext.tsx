import React, { createContext, useContext, useState, useEffect, useCallback, useMemo } from 'react';
import { LanguageKey } from '../types';
import {
  TRANSLATIONS,
  SUPPORTED_LANGUAGES,
  SupportedLanguage,
  getTranslationValue,
  interpolate
} from '../i18n';
import { supabase } from '../services/supabaseClient';

const STORAGE_KEY = 'ola_social_language';

interface I18nContextType {
  language: LanguageKey;
  setLanguage: (lang: LanguageKey) => Promise<void>;
  t: (key: string, params?: Record<string, string | number>, fallback?: string) => string;
  formatDate: (date: Date | string | number, options?: Intl.DateTimeFormatOptions) => string;
  formatTime: (date: Date | string | number) => string;
  formatNumber: (num: number, options?: Intl.NumberFormatOptions) => string;
  formatCurrency: (amount: number, currency?: string) => string;
  formatRelativeTime: (date: Date | string | number) => string;
  supportedLanguages: SupportedLanguage[];
  activeLanguageDetails: SupportedLanguage;
}

const I18nContext = createContext<I18nContextType | null>(null);

function detectInitialLanguage(): LanguageKey {
  if (typeof window === 'undefined') return 'es';

  // 1. Check local storage
  try {
    const saved = localStorage.getItem(STORAGE_KEY) as LanguageKey | null;
    if (saved && (saved === 'es' || saved === 'en' || saved === 'pt' || saved === 'fr')) {
      return saved;
    }
  } catch (e) {
    console.warn('Unable to access localStorage for language:', e);
  }

  // 2. Check browser navigator
  try {
    const navLang = navigator.language || (navigator as any).userLanguage || '';
    const clean = navLang.toLowerCase();
    if (clean.startsWith('en')) return 'en';
    if (clean.startsWith('pt')) return 'pt';
    if (clean.startsWith('fr')) return 'fr';
    if (clean.startsWith('es')) return 'es';
  } catch (e) {
    console.warn('Unable to detect browser language:', e);
  }

  // 3. Default to Spanish
  return 'es';
}

export const I18nProvider: React.FC<{ children: React.ReactNode; userLanguage?: LanguageKey }> = ({
  children,
  userLanguage
}) => {
  const [language, setLanguageState] = useState<LanguageKey>(detectInitialLanguage);

  // Sync when user logs in and has a profile language preference
  useEffect(() => {
    if (userLanguage && (userLanguage === 'es' || userLanguage === 'en' || userLanguage === 'pt' || userLanguage === 'fr')) {
      if (userLanguage !== language) {
        setLanguageState(userLanguage);
        try {
          localStorage.setItem(STORAGE_KEY, userLanguage);
        } catch (e) {
          // ignore
        }
      }
    }
  }, [userLanguage]);

  // Keep <html lang="..."> in sync with current language
  useEffect(() => {
    if (typeof document !== 'undefined') {
      document.documentElement.lang = language;
      document.documentElement.dir = 'ltr';
    }
  }, [language]);

  const setLanguage = useCallback(async (newLang: LanguageKey) => {
    setLanguageState(newLang);
    try {
      localStorage.setItem(STORAGE_KEY, newLang);
    } catch (e) {
      console.warn('Could not persist language to localStorage:', e);
    }

    if (typeof document !== 'undefined') {
      document.documentElement.lang = newLang;
    }

    // Persist to user profile if user is authenticated
    try {
      if (supabase) {
        const { data: { session } } = await supabase.auth.getSession();
        if (session?.user?.id) {
          await supabase
            .from('profiles')
            .update({ language: newLang })
            .eq('id', session.user.id);
        }
      }
    } catch (err) {
      console.warn('Could not sync language to user profile:', err);
    }
  }, []);

  const t = useCallback(
    (key: string, params?: Record<string, string | number>, fallback?: string): string => {
      const activeDict = TRANSLATIONS[language] || TRANSLATIONS.es;
      let text = getTranslationValue(activeDict, key);

      // Fallback to Spanish if missing in current language
      if (!text && language !== 'es') {
        text = getTranslationValue(TRANSLATIONS.es, key);
      }

      // Fallback to provided fallback string or key itself
      if (!text) {
        text = fallback !== undefined ? fallback : key;
      }

      return interpolate(text, params);
    },
    [language]
  );

  const formatDate = useCallback(
    (date: Date | string | number, options?: Intl.DateTimeFormatOptions): string => {
      try {
        const d = date instanceof Date ? date : new Date(date);
        if (isNaN(d.getTime())) return '';
        const locale = language === 'en' ? 'en-US' : language === 'pt' ? 'pt-BR' : language === 'fr' ? 'fr-FR' : 'es-ES';
        return new Intl.DateTimeFormat(locale, options || { dateStyle: 'medium' }).format(d);
      } catch (e) {
        return String(date);
      }
    },
    [language]
  );

  const formatTime = useCallback(
    (date: Date | string | number): string => {
      try {
        const d = date instanceof Date ? date : new Date(date);
        if (isNaN(d.getTime())) return '';
        const locale = language === 'en' ? 'en-US' : language === 'pt' ? 'pt-BR' : language === 'fr' ? 'fr-FR' : 'es-ES';
        return new Intl.DateTimeFormat(locale, { hour: '2-digit', minute: '2-digit' }).format(d);
      } catch (e) {
        return String(date);
      }
    },
    [language]
  );

  const formatNumber = useCallback(
    (num: number, options?: Intl.NumberFormatOptions): string => {
      try {
        const locale = language === 'en' ? 'en-US' : language === 'pt' ? 'pt-BR' : language === 'fr' ? 'fr-FR' : 'es-ES';
        return new Intl.NumberFormat(locale, options).format(num);
      } catch (e) {
        return String(num);
      }
    },
    [language]
  );

  const formatCurrency = useCallback(
    (amount: number, currency: string = 'USD'): string => {
      try {
        const locale = language === 'en' ? 'en-US' : language === 'pt' ? 'pt-BR' : language === 'fr' ? 'fr-FR' : 'es-ES';
        return new Intl.NumberFormat(locale, { style: 'currency', currency }).format(amount);
      } catch (e) {
        return `${currency} ${amount}`;
      }
    },
    [language]
  );

  const formatRelativeTime = useCallback(
    (date: Date | string | number): string => {
      try {
        const d = date instanceof Date ? date : new Date(date);
        if (isNaN(d.getTime())) return '';
        const diffSeconds = Math.round((d.getTime() - Date.now()) / 1000);
        const locale = language === 'en' ? 'en-US' : language === 'pt' ? 'pt-BR' : language === 'fr' ? 'fr-FR' : 'es-ES';
        const rtf = new Intl.RelativeTimeFormat(locale, { numeric: 'auto' });

        if (Math.abs(diffSeconds) < 60) {
          return rtf.format(diffSeconds, 'second');
        }
        const diffMinutes = Math.round(diffSeconds / 60);
        if (Math.abs(diffMinutes) < 60) {
          return rtf.format(diffMinutes, 'minute');
        }
        const diffHours = Math.round(diffMinutes / 60);
        if (Math.abs(diffHours) < 24) {
          return rtf.format(diffHours, 'hour');
        }
        const diffDays = Math.round(diffHours / 24);
        return rtf.format(diffDays, 'day');
      } catch (e) {
        return formatDate(date);
      }
    },
    [language, formatDate]
  );

  const activeLanguageDetails = useMemo(() => {
    return SUPPORTED_LANGUAGES.find((l) => l.code === language) || SUPPORTED_LANGUAGES[0];
  }, [language]);

  const value = useMemo(
    () => ({
      language,
      setLanguage,
      t,
      formatDate,
      formatTime,
      formatNumber,
      formatCurrency,
      formatRelativeTime,
      supportedLanguages: SUPPORTED_LANGUAGES,
      activeLanguageDetails
    }),
    [
      language,
      setLanguage,
      t,
      formatDate,
      formatTime,
      formatNumber,
      formatCurrency,
      formatRelativeTime,
      activeLanguageDetails
    ]
  );

  return <I18nContext.Provider value={value}>{children}</I18nContext.Provider>;
};

export const useI18n = (): I18nContextType => {
  const context = useContext(I18nContext);
  if (!context) {
    throw new Error('useI18n must be used within an I18nProvider');
  }
  return context;
};
