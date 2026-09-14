import React, { useState, useEffect } from 'react';
import { motion } from 'motion/react';
import {
  Shield,
  KeyRound,
  Smartphone,
  AlertOctagon,
  LogOut,
  Trash2,
  CheckCircle2,
  Lock,
  Clock,
  Laptop,
  QrCode,
  Copy,
  Check,
  Plus,
  Loader2,
  AlertTriangle,
  RefreshCw
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { useOlaSocial } from '../context/OlaSocialContext';
import {
  supabase,
  isSupabaseConfigured,
  listUserMfaFactors,
  getAuthAssuranceLevel
} from '../services/supabaseClient';
import { MfaFactor, MfaEnrollResult } from '../types';

export const SecurityCenter: React.FC = () => {
  const { user, updateProfile, logout, enrollMfa, verifyMfaCode, unenrollMfa } = useAuth();
  const { addAuditLog } = useOlaSocial();

  // MFA State
  const [factors, setFactors] = useState<MfaFactor[]>([]);
  const [assuranceLevel, setAssuranceLevel] = useState<'aal1' | 'aal2' | null>(null);
  const [isLoadingFactors, setIsLoadingFactors] = useState<boolean>(true);

  // Enrollment Modal State
  const [enrollModalOpen, setEnrollModalOpen] = useState<boolean>(false);
  const [enrollFriendlyName, setEnrollFriendlyName] = useState<string>('Autenticador Principal');
  const [enrollData, setEnrollData] = useState<MfaEnrollResult | null>(null);
  const [verifyCode, setVerifyCode] = useState<string>('');
  const [isEnrolling, setIsEnrolling] = useState<boolean>(false);
  const [enrollError, setEnrollError] = useState<string | null>(null);
  const [copiedSecret, setCopiedSecret] = useState<boolean>(false);
  const [statusMessage, setStatusMessage] = useState<string | null>(null);

  // Account Deletion State
  const [deleteModalOpen, setDeleteModalOpen] = useState(false);
  const [deleteConfirmText, setDeleteConfirmText] = useState('');
  const [deleteReason, setDeleteReason] = useState('');

  // Close other sessions state
  const [isClosingSessions, setIsClosingSessions] = useState(false);

  // Load real MFA factors from Supabase Auth
  const loadFactors = async () => {
    setIsLoadingFactors(true);
    try {
      const res = await listUserMfaFactors();
      setFactors(res.totp);
      const aal = await getAuthAssuranceLevel();
      setAssuranceLevel(aal.currentLevel);
    } catch (err) {
      console.error('Error loading factors:', err);
    } finally {
      setIsLoadingFactors(false);
    }
  };

  useEffect(() => {
    loadFactors();
  }, []);

  // Start Enrollment
  const handleStartEnroll = async (friendlyName: string = 'Autenticador Principal') => {
    setIsEnrolling(true);
    setEnrollError(null);
    setVerifyCode('');
    setCopiedSecret(false);
    setEnrollFriendlyName(friendlyName);

    try {
      const res = await enrollMfa(friendlyName);
      if (!res) {
        setEnrollError('No fue posible generar el código QR con Supabase Auth.');
        return;
      }
      setEnrollData(res);
      setEnrollModalOpen(true);
    } catch (err: any) {
      setEnrollError(err.message || 'Error al iniciar inscripción 2FA');
    } finally {
      setIsEnrolling(false);
    }
  };

  // Confirm Verification
  const handleConfirmVerify = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!enrollData || verifyCode.trim().length < 6) return;

    setIsEnrolling(true);
    setEnrollError(null);

    try {
      const verified = await verifyMfaCode(verifyCode.trim(), enrollData.id);
      if (verified) {
        setStatusMessage('¡Factor 2FA activado y verificado exitosamente!');
        setEnrollModalOpen(false);
        setEnrollData(null);
        setVerifyCode('');
        await loadFactors();
        addAuditLog('MFA_ENABLED', 'SECURITY', user?.id || '', `Factor TOTP añadido: ${enrollFriendlyName}`);
      } else {
        setEnrollError('El código de 6 dígitos no es válido o ha expirado. Inténtalo de nuevo.');
      }
    } catch (err: any) {
      setEnrollError(err.message || 'Error al validar el código 2FA');
    } finally {
      setIsEnrolling(false);
    }
  };

  // Remove Factor
  const handleRemoveFactor = async (factorId: string, friendlyName: string) => {
    if (!confirm(`¿Estás seguro de desactivar el factor "${friendlyName}"? Tu cuenta tendrá menor nivel de protección.`)) {
      return;
    }

    try {
      const success = await unenrollMfa(factorId);
      if (success) {
        setStatusMessage(`Factor "${friendlyName}" desactivado.`);
        await loadFactors();
        addAuditLog('MFA_DISABLED', 'SECURITY', user?.id || '', `Factor TOTP eliminado: ${friendlyName}`);
      }
    } catch (err: any) {
      alert(err.message || 'Error al desactivar factor');
    }
  };

  // Terminate other sessions
  const handleCloseOtherSessions = async () => {
    if (!isSupabaseConfigured || !supabase) return;
    setIsClosingSessions(true);
    try {
      const { error } = await supabase.auth.signOut({ scope: 'others' });
      if (error) throw error;
      setStatusMessage('Todas las demás sesiones han sido cerradas exitosamente.');
      addAuditLog('OTHER_SESSIONS_TERMINATED', 'SECURITY', user?.id || '', 'Cierre remoto de otras sesiones');
    } catch (err: any) {
      alert(err.message || 'Error al cerrar sesiones');
    } finally {
      setIsClosingSessions(false);
    }
  };

  const handleCopySecret = () => {
    if (enrollData?.totp.secret) {
      navigator.clipboard.writeText(enrollData.totp.secret);
      setCopiedSecret(true);
      setTimeout(() => setCopiedSecret(false), 2000);
    }
  };

  const handleDeleteAccount = (e: React.FormEvent) => {
    e.preventDefault();
    if (deleteConfirmText.toLowerCase() === 'eliminar mi cuenta') {
      addAuditLog(
        'ACCOUNT_DELETION_REQUESTED',
        'USER',
        user?.id || '',
        `Motivo: ${deleteReason}. Soft-delete programado con retención legal de auditoría.`
      );
      alert('Tu solicitud de eliminación ha sido procesada conforme a las políticas de privacidad.');
      logout();
    }
  };

  return (
    <div className="space-y-8 max-w-4xl mx-auto pb-16">
      {/* Title Header */}
      <div className="bg-white rounded-3xl p-6 sm:p-8 border border-slate-100 shadow-sm flex items-center gap-4">
        <div className="w-12 h-12 rounded-2xl bg-teal-50 text-teal-600 flex items-center justify-center">
          <Shield className="w-6 h-6" />
        </div>
        <div>
          <h2 className="text-xl sm:text-2xl font-extrabold text-slate-900">
            Centro de Seguridad y Privacidad
          </h2>
          <p className="text-xs text-slate-500">
            Autenticación en dos pasos (TOTP real), control de sesiones y privacidad de identidad comunitaria.
          </p>
        </div>
      </div>

      {statusMessage && (
        <div className="p-4 rounded-2xl bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs font-semibold flex items-center justify-between">
          <span>{statusMessage}</span>
          <button
            onClick={() => setStatusMessage(null)}
            className="text-emerald-700 hover:text-emerald-900 font-bold ml-2"
          >
            ×
          </button>
        </div>
      )}

      {/* TWO-FACTOR AUTHENTICATION (REAL SUPABASE MFA TOTP) */}
      <div className="bg-white rounded-3xl p-6 sm:p-8 border border-slate-100 shadow-sm space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div className="flex items-start gap-3">
            <Smartphone className="w-6 h-6 text-sky-600 shrink-0 mt-1" />
            <div>
              <div className="flex items-center gap-2">
                <h3 className="font-extrabold text-slate-900 text-base">
                  Autenticación de Dos Factores (TOTP)
                </h3>
                {assuranceLevel === 'aal2' && (
                  <span className="px-2 py-0.5 rounded-full text-[10px] font-black bg-emerald-100 text-emerald-800 uppercase tracking-wider">
                    AAL2 Verificado
                  </span>
                )}
              </div>
              <p className="text-xs text-slate-500 mt-0.5">
                Genera claves temporales estándar RFC 6238 en Google Authenticator, Authy, Microsoft Authenticator o 1Password.
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={() => handleStartEnroll(factors.length === 0 ? 'Autenticador Principal' : 'Autenticador de Respaldo')}
              disabled={isEnrolling}
              className="px-4 py-2 rounded-xl text-xs font-bold bg-teal-600 hover:bg-teal-700 text-white transition-all shadow-xs flex items-center gap-1.5 cursor-pointer disabled:opacity-50"
            >
              {isEnrolling ? (
                <Loader2 className="w-3.5 h-3.5 animate-spin" />
              ) : (
                <Plus className="w-3.5 h-3.5" />
              )}
              <span>{factors.length === 0 ? 'Configurar 2FA (TOTP)' : 'Agregar Autenticador de Respaldo'}</span>
            </button>
          </div>
        </div>

        {/* Registered Factors List */}
        <div className="space-y-3 pt-2 border-t border-slate-100">
          <div className="text-xs font-bold text-slate-700">
            Factores Registrados ({factors.length})
          </div>

          {isLoadingFactors ? (
            <div className="py-4 text-center text-xs text-slate-400 flex items-center justify-center gap-2">
              <Loader2 className="w-4 h-4 animate-spin text-teal-600" />
              <span>Consultando factores en Supabase Auth...</span>
            </div>
          ) : factors.length === 0 ? (
            <div className="p-4 rounded-2xl bg-amber-50 border border-amber-200 text-amber-900 text-xs flex items-start gap-2.5">
              <AlertTriangle className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
              <div>
                <div className="font-bold">2FA Desactivado</div>
                <div className="text-[11px] text-amber-800 mt-0.5">
                  Tu cuenta actualmente está protegida únicamente por contraseña o proveedor OAuth. Te recomendamos activar TOTP para blindar tus colaboraciones y reputación.
                </div>
              </div>
            </div>
          ) : (
            <div className="space-y-2">
              {factors.map((factor) => (
                <div
                  key={factor.id}
                  className="p-3.5 rounded-2xl bg-slate-50 border border-slate-200/80 flex items-center justify-between gap-3 text-xs"
                >
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-xl bg-teal-100 text-teal-700 flex items-center justify-center">
                      <KeyRound className="w-4 h-4" />
                    </div>
                    <div>
                      <div className="font-bold text-slate-800 flex items-center gap-2">
                        <span>{factor.friendly_name || 'Autenticador TOTP'}</span>
                        <span className="text-[10px] font-semibold text-emerald-700 bg-emerald-50 border border-emerald-200 px-1.5 py-0.2 rounded-md">
                          {factor.status === 'verified' ? 'Verificado' : 'Pendiente'}
                        </span>
                      </div>
                      <div className="text-[10px] text-slate-400 mt-0.5">
                        Registrado el {new Date(factor.created_at).toLocaleDateString()} • Algoritmo SHA-1 (30s)
                      </div>
                    </div>
                  </div>

                  <button
                    onClick={() => handleRemoveFactor(factor.id, factor.friendly_name || 'Autenticador')}
                    className="text-xs text-rose-600 hover:text-rose-800 font-semibold px-2.5 py-1 rounded-lg hover:bg-rose-50 transition-colors"
                  >
                    Desvincular
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* ACTIVE SESSIONS & REMOTE SIGNOUT */}
      <div className="bg-white rounded-3xl p-6 sm:p-8 border border-slate-100 shadow-sm space-y-4">
        <div className="flex items-center justify-between">
          <h3 className="font-extrabold text-slate-900 text-base flex items-center gap-2">
            <Laptop className="w-5 h-5 text-slate-600" />
            <span>Sesiones y Dispositivos Conectados</span>
          </h3>
          <span className="text-[11px] font-bold px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800">
            Sesión Actual Activa
          </span>
        </div>

        <div className="p-4 rounded-2xl bg-slate-50 border border-slate-100 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 text-xs">
          <div>
            <div className="font-bold text-slate-900">Navegador Web Actual</div>
            <div className="text-slate-500 text-[11px] mt-0.5">
              Conectado como <strong className="text-slate-700">{user?.email}</strong> • Nivel de Seguridad:{' '}
              {assuranceLevel === 'aal2' ? 'AAL2 (TOTP verificado)' : 'AAL1'}
            </div>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={handleCloseOtherSessions}
              disabled={isClosingSessions}
              className="text-xs text-slate-700 bg-white border border-slate-200 px-3 py-1.5 rounded-xl font-bold hover:bg-slate-100 transition-colors flex items-center gap-1.5 disabled:opacity-50"
            >
              {isClosingSessions ? (
                <Loader2 className="w-3.5 h-3.5 animate-spin text-slate-600" />
              ) : (
                <RefreshCw className="w-3.5 h-3.5 text-slate-600" />
              )}
              <span>Cerrar otras sesiones</span>
            </button>
            <button
              onClick={logout}
              className="text-xs text-rose-600 font-bold hover:bg-rose-50 px-3 py-1.5 rounded-xl border border-rose-200 transition-colors flex items-center gap-1"
            >
              <LogOut className="w-3.5 h-3.5" />
              <span>Cerrar sesión</span>
            </button>
          </div>
        </div>
      </div>

      {/* ACCOUNT DELETION */}
      <div className="bg-white rounded-3xl p-6 sm:p-8 border border-rose-100 shadow-sm space-y-4">
        <div className="flex items-start gap-3">
          <AlertOctagon className="w-6 h-6 text-rose-600 shrink-0 mt-0.5" />
          <div>
            <h3 className="font-extrabold text-slate-900 text-base">Eliminación de Cuenta</h3>
            <p className="text-xs text-slate-500 mt-1">
              Conforme al derecho de supresión de datos, puedes solicitar la eliminación definitiva de tu cuenta. Se anonimizarán tus datos públicos garantizando la integridad de las colaboraciones previas.
            </p>
          </div>
        </div>

        <div className="pt-2">
          <button
            onClick={() => setDeleteModalOpen(true)}
            className="px-4 py-2 rounded-xl border border-rose-200 text-rose-700 text-xs font-bold hover:bg-rose-50 transition-colors inline-flex items-center gap-2"
          >
            <Trash2 className="w-4 h-4" />
            <span>Solicitar eliminación de mi cuenta</span>
          </button>
        </div>
      </div>

      {/* REAL MFA ENROLLMENT MODAL (SVG QR + SECRET KEY) */}
      {enrollModalOpen && enrollData && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-900/70 backdrop-blur-xs overflow-y-auto animate-in fade-in duration-200">
          <div className="bg-white rounded-3xl p-5 sm:p-7 max-w-md w-full max-h-[92vh] overflow-y-auto shadow-2xl border border-slate-100 text-center">
            <h3 className="font-extrabold text-slate-900 text-lg mb-1">
              Vincular Autenticador (TOTP)
            </h3>
            <p className="text-xs text-slate-500 mb-4">
              Escanea el código QR oficial con Google Authenticator, Authy o Microsoft Authenticator.
            </p>

            {/* REAL SVG QR CODE CONTAINER */}
            <div className="p-4 bg-slate-50 rounded-2xl border border-slate-200 inline-block mb-4">
              {enrollData.totp.qr_code ? (
                <div
                  className="w-44 h-44 mx-auto flex items-center justify-center [&>svg]:w-full [&>svg]:h-full"
                  dangerouslySetInnerHTML={{ __html: enrollData.totp.qr_code }}
                />
              ) : (
                <div className="w-44 h-44 flex items-center justify-center text-xs text-slate-400">
                  <QrCode className="w-16 h-16 text-slate-400" />
                </div>
              )}
            </div>

            {/* MANUAL SECRET KEY */}
            <div className="mb-4 text-left bg-slate-100/80 p-3 rounded-2xl border border-slate-200">
              <div className="flex items-center justify-between text-[11px] font-bold text-slate-600 mb-1">
                <span>Clave Secreta Manual</span>
                <button
                  type="button"
                  onClick={handleCopySecret}
                  className="text-teal-600 hover:text-teal-800 font-semibold flex items-center gap-1"
                >
                  {copiedSecret ? <Check className="w-3 h-3 text-emerald-600" /> : <Copy className="w-3 h-3" />}
                  <span>{copiedSecret ? 'Copiado' : 'Copiar'}</span>
                </button>
              </div>
              <div className="font-mono text-xs font-bold text-slate-800 tracking-wider break-all select-all">
                {enrollData.totp.secret}
              </div>
            </div>

            {enrollError && (
              <div className="mb-4 p-3 rounded-xl bg-rose-50 border border-rose-200 text-rose-800 text-xs font-medium flex items-start gap-2 text-left">
                <AlertTriangle className="w-4 h-4 text-rose-600 shrink-0 mt-0.5" />
                <span>{enrollError}</span>
              </div>
            )}

            {/* VERIFICATION CODE FORM */}
            <form onSubmit={handleConfirmVerify} className="space-y-3 text-left">
              <div>
                <label className="block text-xs font-bold text-slate-800 mb-1">
                  Código de 6 dígitos que muestra tu app:
                </label>
                <input
                  type="text"
                  required
                  maxLength={6}
                  value={verifyCode}
                  onChange={(e) => setVerifyCode(e.target.value.replace(/\D/g, ''))}
                  placeholder="000000"
                  className="w-full text-center text-2xl tracking-widest font-mono font-black rounded-xl border border-slate-300 p-2.5 focus:ring-2 focus:ring-teal-500 outline-none"
                />
              </div>

              <div className="flex items-center justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => {
                    setEnrollModalOpen(false);
                    setEnrollData(null);
                  }}
                  className="px-4 py-2.5 rounded-xl text-xs font-semibold text-slate-600 hover:bg-slate-100"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={verifyCode.length < 6 || isEnrolling}
                  className={`px-5 py-2.5 rounded-xl text-xs font-bold text-white shadow-md transition-all flex items-center gap-2 ${
                    verifyCode.length === 6 && !isEnrolling
                      ? 'bg-teal-600 hover:bg-teal-700 cursor-pointer'
                      : 'bg-slate-300 cursor-not-allowed'
                  }`}
                >
                  {isEnrolling ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin" />
                      <span>Validando con Supabase...</span>
                    </>
                  ) : (
                    <span>Verificar y Activar</span>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ACCOUNT DELETION MODAL */}
      {deleteModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-900/60 backdrop-blur-xs overflow-y-auto">
          <div className="bg-white rounded-3xl p-5 sm:p-6 max-w-md w-full max-h-[92vh] overflow-y-auto shadow-2xl border border-slate-100">
            <h3 className="font-extrabold text-rose-700 text-base sm:text-lg mb-2">
              Confirmar Eliminación de Cuenta
            </h3>
            <p className="text-xs text-slate-600 mb-3">
              Esta acción es irreversible. Se revocarán todas tus sesiones activas y se anonimizará tu perfil público.
            </p>

            <form onSubmit={handleDeleteAccount} className="space-y-3">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Motivo de tu salida (opcional)
                </label>
                <input
                  type="text"
                  value={deleteReason}
                  onChange={(e) => setDeleteReason(e.target.value)}
                  placeholder="Ayúdanos a mejorar..."
                  className="w-full text-base sm:text-xs rounded-xl border border-slate-200 p-2.5"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Escribe exactamente <span className="text-rose-600 font-mono">"eliminar mi cuenta"</span> para confirmar:
                </label>
                <input
                  type="text"
                  required
                  value={deleteConfirmText}
                  onChange={(e) => setDeleteConfirmText(e.target.value)}
                  className="w-full text-base sm:text-xs rounded-xl border border-slate-200 p-2.5"
                />
              </div>

              <div className="flex flex-col-reverse sm:flex-row items-center justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setDeleteModalOpen(false)}
                  className="w-full sm:w-auto px-4 py-2.5 rounded-xl text-xs font-semibold text-slate-600 hover:bg-slate-100 text-center"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={deleteConfirmText.toLowerCase() !== 'eliminar mi cuenta'}
                  className="w-full sm:w-auto px-5 py-2.5 rounded-xl bg-rose-600 disabled:opacity-40 text-white text-xs font-bold shadow-md text-center cursor-pointer"
                >
                  Eliminar Definitivamente
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
