import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import {
  ShieldCheck,
  Lock,
  AlertTriangle,
  X,
  Sparkles,
  Loader2,
  Mail,
  KeyRound,
  User,
  ArrowRight,
  CheckCircle2,
  QrCode
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { OlaLogo } from './OlaLogo';
import { TurnstileWidget } from './TurnstileWidget';

interface LoginModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const LoginModal: React.FC<LoginModalProps> = ({ isOpen, onClose }) => {
  const {
    loginWithGoogle,
    loginWithEmail,
    registerWithEmail,
    resetPassword,
    verifyMfaCode,
    mfaNeedsVerification,
    isLoading,
    authError,
    clearAuthError
  } = useAuth();

  const [authMode, setAuthMode] = useState<'google' | 'email_login' | 'email_register' | 'forgot_password' | 'totp_challenge'>('google');
  const [turnstileToken, setTurnstileToken] = useState<string | null>(null);
  const [turnstileError, setTurnstileError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);

  // Email form states
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [displayName, setDisplayName] = useState('');
  const [inviteCode, setInviteCode] = useState('');
  const [totpCode, setTotpCode] = useState('');
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  // Check URL or storage for invite ref code
  useEffect(() => {
    if (typeof window === 'undefined') return;

    // Search in URL query or hash
    const params = new URLSearchParams(window.location.search);
    let code = params.get('ref');

    if (!code && window.location.hash.includes('?')) {
      const hashParams = new URLSearchParams(window.location.hash.split('?')[1]);
      code = hashParams.get('ref');
    }

    if (code) {
      const cleanCode = code.trim().toUpperCase();
      setInviteCode(cleanCode);
      sessionStorage.setItem('ola_ref_code', cleanCode);
    } else {
      const stored = sessionStorage.getItem('ola_ref_code');
      if (stored) setInviteCode(stored);
    }
  }, [isOpen]);

  // If user has MFA requirement triggered globally
  useEffect(() => {
    if (mfaNeedsVerification) {
      setAuthMode('totp_challenge');
    }
  }, [mfaNeedsVerification]);

  if (!isOpen) return null;

  const isVerified = Boolean(turnstileToken);

  const handleGoogleClick = async () => {
    if (!isVerified) {
      setTurnstileError('Primero debes completar la verificación humana.');
      return;
    }

    try {
      setIsSubmitting(true);
      await loginWithGoogle();
    } catch (err: any) {
      setIsSubmitting(false);
      setTurnstileError(err.message || 'No fue posible conectar con Google.');
    }
  };

  const handleEmailLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!isVerified) {
      setTurnstileError('Primero debes completar la verificación humana.');
      return;
    }

    setIsSubmitting(true);
    clearAuthError();
    setSuccessMessage(null);

    try {
      const res = await loginWithEmail(email, password);
      if (res.requiresMfa) {
        setAuthMode('totp_challenge');
      } else {
        onClose();
      }
    } catch (err) {
      // Error handled in AuthContext
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleEmailRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!isVerified) {
      setTurnstileError('Primero debes completar la verificación humana.');
      return;
    }

    setIsSubmitting(true);
    clearAuthError();
    setSuccessMessage(null);

    try {
      await registerWithEmail(email, password, displayName, inviteCode);
      setSuccessMessage('¡Cuenta creada exitosamente! Revisa tu bandeja si se requiere confirmación por correo.');
      setTimeout(() => {
        onClose();
      }, 1500);
    } catch (err) {
      // Error handled in AuthContext
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleForgotPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!isVerified) {
      setTurnstileError('Primero debes completar la verificación humana.');
      return;
    }

    setIsSubmitting(true);
    clearAuthError();
    setSuccessMessage(null);

    try {
      await resetPassword(email);
      setSuccessMessage('Si el correo existe en OLA SOCIAL, recibirás un enlace seguro para restablecer tu contraseña.');
    } catch (err) {
      // Error handled
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleTotpVerify = async (e: React.FormEvent) => {
    e.preventDefault();
    if (totpCode.trim().length < 6) return;

    setIsSubmitting(true);
    clearAuthError();

    try {
      const verified = await verifyMfaCode(totpCode.trim());
      if (verified) {
        onClose();
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-900/80 backdrop-blur-md animate-in fade-in duration-200 overflow-y-auto">
      <div className="bg-white rounded-3xl p-5 sm:p-8 max-w-md w-full max-h-[94vh] overflow-y-auto shadow-2xl border border-slate-100 relative text-center">
        {/* Close Button */}
        <button
          onClick={onClose}
          className="absolute top-4 right-4 p-2 rounded-full text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition-colors"
          title="Cerrar"
        >
          <X className="w-5 h-5" />
        </button>

        {/* Animated Brand Logo */}
        <div className="mb-3">
          <OlaLogo variant="hero" animate={true} className="p-0" />
        </div>

        <div className="space-y-1 mb-5">
          <h3 className="text-xl font-extrabold text-slate-900">
            Acceder a OLA SOCIAL
          </h3>
          <p className="text-xs text-slate-500 max-w-xs mx-auto">
            "Crece junto a una comunidad real." Identidad única sin cuentas duplicadas ni bots.
          </p>
        </div>

        {/* Auth Mode Tabs (Zero mock options) */}
        {authMode !== 'totp_challenge' && (
          <div className="flex rounded-2xl bg-slate-100 p-1 mb-5 text-xs font-bold text-slate-600">
            <button
              type="button"
              onClick={() => {
                setAuthMode('google');
                clearAuthError();
                setSuccessMessage(null);
              }}
              className={`flex-1 py-2 rounded-xl transition-all ${
                authMode === 'google'
                  ? 'bg-white text-slate-900 shadow-xs'
                  : 'hover:text-slate-900'
              }`}
            >
              Google
            </button>
            <button
              type="button"
              onClick={() => {
                setAuthMode('email_login');
                clearAuthError();
                setSuccessMessage(null);
              }}
              className={`flex-1 py-2 rounded-xl transition-all ${
                authMode === 'email_login' || authMode === 'forgot_password'
                  ? 'bg-white text-slate-900 shadow-xs'
                  : 'hover:text-slate-900'
              }`}
            >
              Iniciar Sesión
            </button>
            <button
              type="button"
              onClick={() => {
                setAuthMode('email_register');
                clearAuthError();
                setSuccessMessage(null);
              }}
              className={`flex-1 py-2 rounded-xl transition-all ${
                authMode === 'email_register'
                  ? 'bg-white text-slate-900 shadow-xs'
                  : 'hover:text-slate-900'
              }`}
            >
              Crear Cuenta
            </button>
          </div>
        )}

        {/* Turnstile Human Verification (Strict Human Check Barrier) */}
        <div className="mb-5">
          <TurnstileWidget
            onVerifySuccess={(token) => {
              setTurnstileToken(token);
              setTurnstileError(null);
            }}
            onVerifyExpired={() => {
              setTurnstileToken(null);
              setTurnstileError('La verificación humana expiró. Completa nuevamente el desafío.');
            }}
            onVerifyError={(err) => {
              setTurnstileToken(null);
              setTurnstileError(err);
            }}
          />
        </div>

        {/* Notifications & Error feedback */}
        {(turnstileError || authError) && (
          <div className="mb-4 p-3 rounded-xl bg-rose-50 border border-rose-200 text-rose-800 text-xs font-medium flex items-start gap-2 text-left">
            <AlertTriangle className="w-4 h-4 text-rose-600 shrink-0 mt-0.5" />
            <span>{turnstileError || authError}</span>
          </div>
        )}

        {successMessage && (
          <div className="mb-4 p-3 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs font-semibold flex items-start gap-2 text-left">
            <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
            <span>{successMessage}</span>
          </div>
        )}

        {/* TAB 1: GOOGLE OAUTH */}
        {authMode === 'google' && (
          <div className="space-y-3 text-left">
            <button
              type="button"
              disabled={!isVerified || isLoading || isSubmitting}
              onClick={handleGoogleClick}
              className={`w-full py-3.5 px-4 rounded-2xl font-bold text-xs shadow-md transition-all flex items-center justify-center gap-3 relative ${
                isVerified && !isLoading && !isSubmitting
                  ? 'bg-white border-2 border-slate-300 hover:border-sky-500 hover:bg-slate-50 text-slate-800 hover:shadow-lg active:scale-98 cursor-pointer'
                  : 'bg-slate-100 border border-slate-200 text-slate-400 cursor-not-allowed opacity-60'
              }`}
            >
              {isSubmitting || isLoading ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin text-sky-600" />
                  <span>Conectando con Google...</span>
                </>
              ) : (
                <>
                  <svg className="w-4 h-4 shrink-0" viewBox="0 0 24 24">
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
                </>
              )}
            </button>

            {!isVerified && (
              <p className="text-[11px] text-amber-700/90 font-medium text-center">
                El botón se activará al resolver el desafío de verificación humana.
              </p>
            )}

            {isVerified && (
              <p className="text-[11px] text-emerald-700 font-semibold text-center">
                ✓ Verificación humana completada.
              </p>
            )}
          </div>
        )}

        {/* TAB 2: EMAIL LOGIN */}
        {authMode === 'email_login' && (
          <form onSubmit={handleEmailLogin} className="space-y-3 text-left">
            <div>
              <label className="block text-[11px] font-bold text-slate-700 mb-1">
                Correo Electrónico
              </label>
              <div className="relative">
                <Mail className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
                <input
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="tu@correo.com"
                  className="w-full pl-9 pr-3 py-2 text-xs rounded-xl border border-slate-200 focus:ring-2 focus:ring-sky-500 outline-none"
                />
              </div>
            </div>

            <div>
              <div className="flex items-center justify-between mb-1">
                <label className="text-[11px] font-bold text-slate-700">
                  Contraseña
                </label>
                <button
                  type="button"
                  onClick={() => setAuthMode('forgot_password')}
                  className="text-[10px] text-sky-600 hover:underline font-semibold"
                >
                  ¿Olvidaste tu contraseña?
                </button>
              </div>
              <div className="relative">
                <Lock className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
                <input
                  type="password"
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  className="w-full pl-9 pr-3 py-2 text-xs rounded-xl border border-slate-200 focus:ring-2 focus:ring-sky-500 outline-none"
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={!isVerified || isSubmitting}
              className={`w-full py-2.5 rounded-xl font-bold text-xs text-white shadow-sm flex items-center justify-center gap-2 transition-all ${
                isVerified && !isSubmitting
                  ? 'bg-sky-600 hover:bg-sky-700 cursor-pointer'
                  : 'bg-slate-300 cursor-not-allowed'
              }`}
            >
              {isSubmitting ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  <span>Validando credenciales...</span>
                </>
              ) : (
                <span>Iniciar Sesión</span>
              )}
            </button>
          </form>
        )}

        {/* TAB 3: EMAIL REGISTER */}
        {authMode === 'email_register' && (
          <form onSubmit={handleEmailRegister} className="space-y-3 text-left">
            <div>
              <label className="block text-[11px] font-bold text-slate-700 mb-1">
                Nombre de Creador o Apodo
              </label>
              <div className="relative">
                <User className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
                <input
                  type="text"
                  required
                  value={displayName}
                  onChange={(e) => setDisplayName(e.target.value)}
                  placeholder="Tu nombre en la comunidad"
                  className="w-full pl-9 pr-3 py-2 text-xs rounded-xl border border-slate-200 focus:ring-2 focus:ring-sky-500 outline-none"
                />
              </div>
            </div>

            <div>
              <label className="block text-[11px] font-bold text-slate-700 mb-1">
                Correo Electrónico (Único)
              </label>
              <div className="relative">
                <Mail className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
                <input
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="tu@correo.com"
                  className="w-full pl-9 pr-3 py-2 text-xs rounded-xl border border-slate-200 focus:ring-2 focus:ring-sky-500 outline-none"
                />
              </div>
            </div>

            <div>
              <label className="block text-[11px] font-bold text-slate-700 mb-1">
                Contraseña (Mínimo 8 caracteres)
              </label>
              <div className="relative">
                <Lock className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
                <input
                  type="password"
                  required
                  minLength={8}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  className="w-full pl-9 pr-3 py-2 text-xs rounded-xl border border-slate-200 focus:ring-2 focus:ring-sky-500 outline-none"
                />
              </div>
            </div>

            <div>
              <label className="block text-[11px] font-bold text-slate-700 mb-1">
                Código de Invitación (Opcional)
              </label>
              <input
                type="text"
                value={inviteCode}
                onChange={(e) => setInviteCode(e.target.value.toUpperCase())}
                placeholder="Ej. OLA-A1B2C3"
                className="w-full px-3 py-2 text-xs rounded-xl border border-slate-200 focus:ring-2 focus:ring-sky-500 outline-none uppercase font-mono"
              />
              {inviteCode && (
                <p className="text-[10px] text-teal-600 font-semibold mt-1">
                  ✓ Atribución de invitación activa
                </p>
              )}
            </div>

            <button
              type="submit"
              disabled={!isVerified || isSubmitting}
              className={`w-full py-2.5 rounded-xl font-bold text-xs text-white shadow-sm flex items-center justify-center gap-2 transition-all ${
                isVerified && !isSubmitting
                  ? 'bg-teal-600 hover:bg-teal-700 cursor-pointer'
                  : 'bg-slate-300 cursor-not-allowed'
              }`}
            >
              {isSubmitting ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  <span>Creando cuenta segura...</span>
                </>
              ) : (
                <span>Crear Cuenta Comunitaria</span>
              )}
            </button>
          </form>
        )}

        {/* FORGOT PASSWORD */}
        {authMode === 'forgot_password' && (
          <form onSubmit={handleForgotPassword} className="space-y-3 text-left">
            <div>
              <label className="block text-[11px] font-bold text-slate-700 mb-1">
                Ingresa tu correo registrado
              </label>
              <div className="relative">
                <Mail className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
                <input
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="tu@correo.com"
                  className="w-full pl-9 pr-3 py-2 text-xs rounded-xl border border-slate-200 focus:ring-2 focus:ring-sky-500 outline-none"
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={!isVerified || isSubmitting}
              className={`w-full py-2.5 rounded-xl font-bold text-xs text-white shadow-sm flex items-center justify-center gap-2 transition-all ${
                isVerified && !isSubmitting
                  ? 'bg-sky-600 hover:bg-sky-700 cursor-pointer'
                  : 'bg-slate-300 cursor-not-allowed'
              }`}
            >
              {isSubmitting ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                <span>Enviar Enlace de Recuperación</span>
              )}
            </button>

            <div className="text-center pt-2">
              <button
                type="button"
                onClick={() => setAuthMode('email_login')}
                className="text-xs text-slate-600 hover:underline font-semibold"
              >
                Volver al inicio de sesión
              </button>
            </div>
          </form>
        )}

        {/* TOTP 2FA CHALLENGE */}
        {authMode === 'totp_challenge' && (
          <form onSubmit={handleTotpVerify} className="space-y-4 text-left">
            <div className="p-3 bg-amber-50 rounded-2xl border border-amber-200 text-amber-900 text-xs">
              <div className="font-bold flex items-center gap-1.5 mb-1">
                <KeyRound className="w-4 h-4 text-amber-700" />
                <span>Verificación en Dos Pasos (2FA TOTP)</span>
              </div>
              <p className="text-[11px] text-amber-800">
                Abre tu aplicación autenticadora (Google Authenticator, Authy o Microsoft Authenticator) e introduce el código de 6 dígitos.
              </p>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-800 mb-1 text-center">
                Código de 6 dígitos
              </label>
              <input
                type="text"
                required
                maxLength={6}
                value={totpCode}
                onChange={(e) => setTotpCode(e.target.value.replace(/\D/g, ''))}
                placeholder="000000"
                className="w-full text-center text-2xl tracking-widest font-mono font-bold py-2 rounded-xl border border-slate-300 focus:ring-2 focus:ring-amber-500 outline-none"
              />
            </div>

            <button
              type="submit"
              disabled={totpCode.length < 6 || isSubmitting}
              className={`w-full py-2.5 rounded-xl font-bold text-xs text-white shadow-sm flex items-center justify-center gap-2 transition-all ${
                totpCode.length === 6 && !isSubmitting
                  ? 'bg-amber-600 hover:bg-amber-700 cursor-pointer'
                  : 'bg-slate-300 cursor-not-allowed'
              }`}
            >
              {isSubmitting ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  <span>Verificando código TOTP...</span>
                </>
              ) : (
                <span>Validar y Entrar</span>
              )}
            </button>
          </form>
        )}

        {/* Security and Single-Identity Notice */}
        <div className="mt-5 pt-3 border-t border-slate-100 flex items-center justify-center gap-1.5 text-[11px] text-slate-400">
          <ShieldCheck className="w-3.5 h-3.5 text-teal-600" />
          <span>Autenticación oficial Supabase Auth • Un correo = Una cuenta</span>
        </div>
      </div>
    </div>
  );
};
