import React, { useState } from 'react';
import { motion } from 'motion/react';
import { Sparkles, ShieldCheck, Check, Heart, Globe, ArrowRight } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { OlaLogo } from './OlaLogo';
import { LanguageKey } from '../types';

interface OnboardingModalProps {
  isOpen: boolean;
  onComplete: () => void;
}

export const OnboardingModal: React.FC<OnboardingModalProps> = ({ isOpen, onComplete }) => {
  const { user, loginWithGoogle, updateProfile, setLanguage, language } = useAuth();

  const [step, setStep] = useState<number>(1);
  const [is18Confirmed, setIs18Confirmed] = useState<boolean>(false);
  const [termsAccepted, setTermsAccepted] = useState<boolean>(false);
  const [customEmail, setCustomEmail] = useState('');
  const [displayName, setDisplayName] = useState('');

  if (!isOpen) return null;

  const handleGoogleLogin = async () => {
    await loginWithGoogle(customEmail || undefined);
    setStep(2);
  };

  const handleFinishOnboarding = () => {
    if (!is18Confirmed || !termsAccepted) return;

    updateProfile({
      display_name: displayName || user?.display_name,
      is_18_confirmed: true,
      terms_accepted_at: new Date().toISOString()
    });

    onComplete();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/70 backdrop-blur-md">
      <div className="bg-white rounded-3xl p-6 sm:p-8 max-w-md w-full shadow-2xl border border-slate-100 relative text-center">
        {/* Animated Brand Logo */}
        <div className="mb-4">
          <OlaLogo variant="hero" animate={true} className="p-0" />
        </div>

        {step === 1 ? (
          <div className="space-y-4 text-left">
            <div className="text-center">
              <h3 className="text-xl font-extrabold text-slate-900">Bienvenido a OLA SOCIAL</h3>
              <p className="text-xs text-slate-500 mt-1">
                La plataforma de comunidad y apoyo auténtico entre creadores humanos.
              </p>
            </div>

            <div className="space-y-2 pt-2">
              <label className="block text-xs font-bold text-slate-700">
                Correo para iniciar sesión (o usa la cuenta admin predeterminada)
              </label>
              <input
                type="email"
                value={customEmail}
                onChange={(e) => setCustomEmail(e.target.value)}
                placeholder="v19629049@gmail.com (Administrador inicial)"
                className="w-full text-xs rounded-xl border border-slate-200 p-2.5 focus:ring-2 focus:ring-sky-500"
              />
            </div>

            <button
              onClick={handleGoogleLogin}
              className="w-full py-3 px-4 rounded-2xl bg-white border border-slate-300 hover:bg-slate-50 text-slate-800 font-bold text-xs shadow-xs transition-all flex items-center justify-center gap-3"
            >
              <svg className="w-4 h-4" viewBox="0 0 24 24">
                <path
                  fill="#4285F4"
                  d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                />
                <path
                  fill="#34A853"
                  d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                />
                <path
                  fill="#FBBC05"
                  d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z"
                />
                <path
                  fill="#EA4335"
                  d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z"
                />
              </svg>
              <span>Continuar con Google</span>
            </button>

            <p className="text-[11px] text-center text-slate-400">
              Autenticación segura mediante Supabase Auth con Google OAuth.
            </p>
          </div>
        ) : (
          <div className="space-y-4 text-left">
            <div className="text-center">
              <h3 className="text-lg font-extrabold text-slate-900">Completa tu Registro</h3>
              <p className="text-xs text-slate-500">Pasos requeridos de cumplimiento</p>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">Nombre visible</label>
              <input
                type="text"
                value={displayName}
                onChange={(e) => setDisplayName(e.target.value)}
                placeholder={user?.display_name || 'Tu nombre o alias'}
                className="w-full text-xs rounded-xl border border-slate-200 p-2.5"
              />
            </div>

            {/* Language Selector */}
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">Idioma preferido</label>
              <select
                value={language}
                onChange={(e) => setLanguage(e.target.value as LanguageKey)}
                className="w-full text-xs rounded-xl border border-slate-200 p-2.5 bg-white"
              >
                <option value="es">Español</option>
                <option value="en">English</option>
                <option value="pt">Português</option>
                <option value="fr">Français</option>
              </select>
            </div>

            {/* Section 38 Verification 18+ */}
            <div className="p-3 bg-slate-50 rounded-2xl border border-slate-100 space-y-2 text-xs text-slate-700">
              <label className="flex items-start gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={is18Confirmed}
                  onChange={(e) => setIs18Confirmed(e.target.checked)}
                  className="mt-0.5 rounded-sm text-sky-600 focus:ring-sky-500"
                />
                <span className="font-semibold">Confirmo que tengo 18 años o más.</span>
              </label>

              <label className="flex items-start gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={termsAccepted}
                  onChange={(e) => setTermsAccepted(e.target.checked)}
                  className="mt-0.5 rounded-sm text-sky-600 focus:ring-sky-500"
                />
                <span>Acepto los Términos de Servicio y la Política de Privacidad de OLA SOCIAL.</span>
              </label>
            </div>

            <button
              disabled={!is18Confirmed || !termsAccepted}
              onClick={handleFinishOnboarding}
              className="w-full py-3 rounded-2xl bg-gradient-to-r from-sky-600 to-emerald-600 text-white font-bold text-xs shadow-md disabled:opacity-40 transition-all flex items-center justify-center gap-2"
            >
              <span>Entrar al Lobby de OLA SOCIAL</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          </div>
        )}
      </div>
    </div>
  );
};
