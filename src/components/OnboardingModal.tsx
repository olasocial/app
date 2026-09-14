import React, { useState } from 'react';
import { ShieldCheck, Check, Heart, Globe, ArrowRight } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { OlaLogo } from './OlaLogo';
import { LanguageKey } from '../types';

interface OnboardingModalProps {
  isOpen: boolean;
  onComplete: () => void;
}

export const OnboardingModal: React.FC<OnboardingModalProps> = ({ isOpen, onComplete }) => {
  const { user, updateProfile, setLanguage, language } = useAuth();

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
            <h3 className="text-lg sm:text-xl font-extrabold text-slate-900">Bienvenido a OLA SOCIAL</h3>
            <p className="text-xs text-slate-500 mt-1">
              Hola, <span className="font-semibold text-slate-800">{user.email}</span>. Completa la activación de tu cuenta comunitaria.
            </p>
          </div>

          <div className="space-y-1.5">
            <label className="block text-xs font-bold text-slate-700">Nombre de Creador o Apodo</label>
            <input
              type="text"
              value={displayName}
              onChange={(e) => setDisplayName(e.target.value)}
              placeholder={user.display_name || 'Tu nombre en la comunidad'}
              className="w-full text-base sm:text-xs rounded-xl border border-slate-200 p-2.5 focus:ring-2 focus:ring-sky-500 outline-none"
            />
          </div>

          <div className="space-y-1.5">
            <label className="block text-xs font-bold text-slate-700">Idioma preferido</label>
            <div className="flex gap-2">
              <button
                type="button"
                onClick={() => setLanguage('es')}
                className={`flex-1 py-2 rounded-xl text-xs font-semibold border transition-all ${
                  language === 'es'
                    ? 'bg-sky-50 border-sky-400 text-sky-800 font-bold'
                    : 'border-slate-200 text-slate-600'
                }`}
              >
                Español
              </button>
              <button
                type="button"
                onClick={() => setLanguage('en')}
                className={`flex-1 py-2 rounded-xl text-xs font-semibold border transition-all ${
                  language === 'en'
                    ? 'bg-sky-50 border-sky-400 text-sky-800 font-bold'
                    : 'border-slate-200 text-slate-600'
                }`}
              >
                English
              </button>
            </div>
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
                <strong>Confirmo que tengo 18 años o más</strong> y que participo voluntariamente en la comunidad.
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
                Acepto los <strong>Términos de Servicio</strong>, las <strong>Políticas de Antifraude</strong> y el compromiso de interacciones 100% humanas.
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
            <span>{isSaving ? 'Guardando perfil...' : 'Entrar al Ecosistema OLA SOCIAL'}</span>
            <ArrowRight className="w-4 h-4" />
          </button>
        </div>
      </div>
    </div>
  );
};
