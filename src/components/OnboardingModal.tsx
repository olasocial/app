import React, { useState } from 'react';
import { ShieldCheck, Check, Heart, Globe, ArrowRight } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { useI18n } from '../context/I18nContext';
import { LanguageSelector } from './LanguageSelector';
import { OlaLogo } from './OlaLogo';
import { LanguageKey } from '../types';

interface OnboardingModalProps {
  isOpen: boolean;
  onComplete: () => void;
}

export const OnboardingModal: React.FC<OnboardingModalProps> = ({ isOpen, onComplete }) => {
  const { user, updateProfile } = useAuth();
  const { t, language, setLanguage } = useI18n();

  const [is18Confirmed, setIs18Confirmed] = useState<boolean>(false);
  const [termsAccepted, setTermsAccepted] = useState<boolean>(false);
  const [displayName, setDisplayName] = useState('');
  const [isSaving, setIsSaving] = useState<boolean>(false);

  if (!isOpen || !user) return null;

  const handleFinishOnboarding = async () => {
    if (!is18Confirmed || !termsAccepted) return;

    setIsSaving(true);
    try {
      await updateProfile({
        display_name: displayName.trim() || user.display_name,
        is_18_confirmed: true,
        terms_accepted_at: new Date().toISOString(),
        onboarding_completed: true
      });
      onComplete();
    } catch (err) {
      console.error('Error saving onboarding data:', err);
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-900/75 backdrop-blur-md animate-in fade-in duration-200 overflow-y-auto">
      <div className="bg-white rounded-3xl p-5 sm:p-8 max-w-md w-full max-h-[92vh] overflow-y-auto shadow-2xl border border-slate-100 relative text-center">
        {/* Animated Brand Logo */}
        <div className="mb-3 sm:mb-4">
          <OlaLogo variant="hero" animate={true} className="p-0" />
        </div>

        <div className="space-y-4 sm:space-y-5 text-left">
          <div className="text-center">
            <h3 className="text-lg sm:text-xl font-extrabold text-slate-900">{t('onboarding.welcome_title')}</h3>
            <p className="text-xs text-slate-500 mt-1">
              Hola, <span className="font-semibold text-slate-800">{user.email}</span>. {t('onboarding.welcome_desc')}
            </p>
          </div>

          <div className="space-y-1.5">
            <label className="block text-xs font-bold text-slate-700">{t('onboarding.step_profile')}</label>
            <input
              type="text"
              value={displayName}
              onChange={(e) => setDisplayName(e.target.value)}
              placeholder={user.display_name || 'Nombre'}
              className="w-full text-base sm:text-xs rounded-xl border border-slate-200 p-2.5 focus:ring-2 focus:ring-sky-500 outline-none"
            />
          </div>

          <div className="space-y-1.5">
            <label className="block text-xs font-bold text-slate-700">{t('common.language')}</label>
            <LanguageSelector variant="compact" />
          </div>

          {/* Legal and Compliance Verification (Section 26) */}
          <div className="space-y-3 pt-2 border-t border-slate-100">
            <label className="flex items-start gap-2.5 text-xs text-slate-700 cursor-pointer select-none">
              <input
                type="checkbox"
                checked={is18Confirmed}
                onChange={(e) => setIs18Confirmed(e.target.checked)}
                className="mt-0.5 rounded text-sky-600 focus:ring-sky-500"
              />
              <span>
                <strong>{t('common.verified')} (18+)</strong>: {t('onboarding.rule_reciprocity_desc')}
              </span>
            </label>

            <label className="flex items-start gap-2.5 text-xs text-slate-700 cursor-pointer select-none">
              <input
                type="checkbox"
                checked={termsAccepted}
                onChange={(e) => setTermsAccepted(e.target.checked)}
                className="mt-0.5 rounded text-sky-600 focus:ring-sky-500"
              />
              <span>
                {t('onboarding.rule_organic_desc')}
              </span>
            </label>
          </div>

          <button
            type="button"
            disabled={!is18Confirmed || !termsAccepted || isSaving}
            onClick={handleFinishOnboarding}
            className={`w-full py-3 px-4 rounded-2xl font-bold text-xs shadow-md transition-all flex items-center justify-center gap-2 ${
              is18Confirmed && termsAccepted && !isSaving
                ? 'bg-gradient-to-r from-sky-600 to-indigo-600 text-white hover:shadow-lg active:scale-98 cursor-pointer'
                : 'bg-slate-100 text-slate-400 cursor-not-allowed border border-slate-200'
            }`}
          >
            <span>{isSaving ? t('common.loading') : t('onboarding.complete_button')}</span>
            <ArrowRight className="w-4 h-4" />
          </button>
        </div>
      </div>
    </div>
  );
};
