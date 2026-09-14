import React, { useState, useRef, useEffect } from 'react';
import { Globe, Check, ChevronDown } from 'lucide-react';
import { useI18n } from '../context/I18nContext';
import { LanguageKey } from '../types';

interface LanguageSelectorProps {
  variant?: 'compact' | 'full' | 'buttons';
  className?: string;
  onLanguageChanged?: (lang: LanguageKey) => void;
}

export const LanguageSelector: React.FC<LanguageSelectorProps> = ({
  variant = 'compact',
  className = '',
  onLanguageChanged
}) => {
  const { language, setLanguage, supportedLanguages, t } = useI18n();
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  // Close dropdown on outside click
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };

    const handleEscape = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        setIsOpen(false);
      }
    };

    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
      document.addEventListener('keydown', handleEscape);
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
      document.removeEventListener('keydown', handleEscape);
    };
  }, [isOpen]);

  const handleSelect = (code: LanguageKey) => {
    setLanguage(code);
    setIsOpen(false);
    if (onLanguageChanged) {
      onLanguageChanged(code);
    }
  };

  const current = supportedLanguages.find((l) => l.code === language) || supportedLanguages[0];

  // If buttons variant (used in onboarding modal or settings):
  if (variant === 'buttons') {
    return (
      <div className={`grid grid-cols-2 gap-2.5 ${className}`}>
        {supportedLanguages
          .filter((l) => l.isReady)
          .map((lang) => {
            const isSelected = language === lang.code;
            return (
              <button
                key={lang.code}
                type="button"
                onClick={() => handleSelect(lang.code)}
                className={`flex items-center justify-between p-3 rounded-2xl border text-sm font-semibold transition-all ${
                  isSelected
                    ? 'border-sky-500 bg-sky-50 text-sky-900 shadow-xs ring-2 ring-sky-200'
                    : 'border-slate-200 bg-white text-slate-700 hover:border-slate-300 hover:bg-slate-50'
                }`}
              >
                <div className="flex items-center gap-2.5">
                  <span className="text-lg leading-none">{lang.flag}</span>
                  <span className="truncate">{lang.nativeName}</span>
                </div>
                {isSelected && <Check className="w-4 h-4 text-sky-600 shrink-0" />}
              </button>
            );
          })}
      </div>
    );
  }

  return (
    <div className={`relative inline-block text-left ${className}`} ref={dropdownRef}>
      <button
        type="button"
        id="language-selector-button"
        aria-haspopup="true"
        aria-expanded={isOpen}
        aria-label={t('nav.switch_language', undefined, 'Cambiar idioma / Switch language')}
        onClick={() => setIsOpen(!isOpen)}
        className="inline-flex items-center gap-1.5 px-2.5 py-1.5 rounded-xl text-xs font-semibold text-slate-700 hover:text-slate-900 bg-slate-100/90 hover:bg-slate-200/90 border border-slate-200/80 transition-all focus:outline-hidden focus:ring-2 focus:ring-sky-500/40"
      >
        <Globe className="w-3.5 h-3.5 text-sky-600 shrink-0" />
        <span className="text-base leading-none">{current.flag}</span>
        <span className="hidden sm:inline font-bold uppercase tracking-wider text-[11px]">
          {current.code}
        </span>
        <ChevronDown
          className={`w-3 h-3 text-slate-500 transition-transform duration-200 ${
            isOpen ? 'rotate-180' : ''
          }`}
        />
      </button>

      {isOpen && (
        <div
          role="menu"
          aria-orientation="vertical"
          aria-labelledby="language-selector-button"
          className="absolute right-0 mt-1.5 w-44 rounded-2xl bg-white shadow-xl border border-slate-200/90 py-1.5 z-50 animate-in fade-in zoom-in-95 duration-150 focus:outline-hidden"
        >
          <div className="px-3 py-1 text-[10px] font-bold text-slate-400 uppercase tracking-wider border-b border-slate-100">
            {t('nav.switch_language', undefined, 'Idioma / Language')}
          </div>
          {supportedLanguages
            .filter((lang) => lang.isReady)
            .map((lang) => {
              const isSelected = language === lang.code;
              return (
                <button
                  key={lang.code}
                  role="menuitem"
                  type="button"
                  onClick={() => handleSelect(lang.code)}
                  className={`w-full flex items-center justify-between px-3 py-2 text-xs font-medium transition-colors ${
                    isSelected
                      ? 'bg-sky-50 text-sky-900 font-bold'
                      : 'text-slate-700 hover:bg-slate-50 hover:text-slate-900'
                  }`}
                >
                  <div className="flex items-center gap-2">
                    <span className="text-base leading-none">{lang.flag}</span>
                    <span>{lang.nativeName}</span>
                  </div>
                  {isSelected && <Check className="w-3.5 h-3.5 text-sky-600" />}
                </button>
              );
            })}
        </div>
      )}
    </div>
  );
};
