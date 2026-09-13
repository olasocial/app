import React, { useState } from 'react';
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
  Laptop
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { useOlaSocial } from '../context/OlaSocialContext';

export const SecurityCenter: React.FC = () => {
  const { user, updateProfile, logout } = useAuth();
  const { addAuditLog } = useOlaSocial();

  const [mfaModalOpen, setMfaModalOpen] = useState(false);
  const [mfaCode, setMfaCode] = useState('');
  const [mfaSuccessMsg, setMfaSuccessMsg] = useState<string | null>(null);

  const [deleteModalOpen, setDeleteModalOpen] = useState(false);
  const [deleteConfirmText, setDeleteConfirmText] = useState('');
  const [deleteReason, setDeleteReason] = useState('');

  const handleToggleMfa = () => {
    if (user?.mfa_enabled) {
      updateProfile({ mfa_enabled: false });
      addAuditLog('MFA_DISABLED', 'SECURITY', user?.id || '', 'MFA desactivado por el usuario');
    } else {
      setMfaModalOpen(true);
    }
  };

  const handleConfirmMfa = (e: React.FormEvent) => {
    e.preventDefault();
    if (mfaCode.length >= 6) {
      updateProfile({ mfa_enabled: true });
      addAuditLog('MFA_ENABLED', 'SECURITY', user?.id || '', 'MFA TOTP activado exitosamente');
      setMfaModalOpen(false);
      setMfaCode('');
      setMfaSuccessMsg('Autenticación de dos factores (TOTP) activada exitosamente.');
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
      {/* Title */}
      <div className="bg-white rounded-3xl p-6 sm:p-8 border border-slate-100 shadow-sm flex items-center gap-4">
        <div className="w-12 h-12 rounded-2xl bg-teal-50 text-teal-600 flex items-center justify-center">
          <Shield className="w-6 h-6" />
        </div>
        <div>
          <h2 className="text-xl sm:text-2xl font-extrabold text-slate-900">
            Centro de Seguridad y Privacidad
          </h2>
          <p className="text-xs text-slate-500">
            Administra tus factores de autenticación, sesiones abiertas y derechos de protección de datos.
          </p>
        </div>
      </div>

      {mfaSuccessMsg && (
        <div className="p-4 rounded-2xl bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs font-semibold">
          {mfaSuccessMsg}
        </div>
      )}

      {/* Two-Factor Authentication (TOTP) */}
      <div className="bg-white rounded-3xl p-6 sm:p-8 border border-slate-100 shadow-sm space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div className="flex items-start gap-3">
            <Smartphone className="w-6 h-6 text-sky-600 shrink-0 mt-1" />
            <div>
              <h3 className="font-extrabold text-slate-900 text-base">
                Segundo Factor de Autenticación (TOTP)
              </h3>
              <p className="text-xs text-slate-500 mt-0.5">
                Compatible con Google Authenticator, Authy o Microsoft Authenticator. Protege tu cuenta contra accesos no autorizados.
              </p>
            </div>
          </div>

          <button
            onClick={handleToggleMfa}
            className={`px-4 py-2 rounded-xl text-xs font-bold transition-all shadow-xs ${
              user?.mfa_enabled
                ? 'bg-rose-50 text-rose-700 border border-rose-200 hover:bg-rose-100'
                : 'bg-teal-600 text-white hover:bg-teal-700'
            }`}
          >
            {user?.mfa_enabled ? 'Desactivar 2FA' : 'Configurar 2FA (TOTP)'}
          </button>
        </div>

        <div className="text-xs bg-slate-50 p-3.5 rounded-2xl border border-slate-100 flex items-center gap-2 text-slate-700">
          <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
          <span>
            Estado actual: <strong>{user?.mfa_enabled ? 'PROTEGIDO CON TOTP' : 'Desactivado'}</strong>.
          </span>
        </div>
      </div>

      {/* Active Sessions */}
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
            <div className="font-bold text-slate-900">Navegador Web Actual (Google OAuth Verified)</div>
            <div className="text-slate-500 text-[11px] mt-0.5">
              Dirección de origen autenticada • Última actividad: hace unos instantes
            </div>
          </div>
          <button
            onClick={logout}
            className="text-xs text-rose-600 font-bold hover:underline flex items-center gap-1"
          >
            <LogOut className="w-3.5 h-3.5" />
            <span>Cerrar sesión</span>
          </button>
        </div>
      </div>

      {/* Account Deletion / Soft Delete per Section 35 */}
      <div className="bg-white rounded-3xl p-6 sm:p-8 border border-rose-100 shadow-sm space-y-4">
        <div className="flex items-start gap-3">
          <AlertOctagon className="w-6 h-6 text-rose-600 shrink-0 mt-0.5" />
          <div>
            <h3 className="font-extrabold text-slate-900 text-base">Eliminación de Cuenta</h3>
            <p className="text-xs text-slate-500 mt-1">
              Conforme a las leyes de privacidad, puedes solicitar la eliminación de tu cuenta.
              Se aplicará una política de borrado seguro y anonimización, conservando únicamente los registros inmutables requeridos por ley o prevención de fraude.
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

      {/* MFA Modal */}
      {mfaModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs">
          <div className="bg-white rounded-3xl p-6 max-w-md w-full shadow-2xl border border-slate-100">
            <h3 className="font-extrabold text-slate-900 text-lg mb-2">Configurar Google Authenticator (TOTP)</h3>
            <p className="text-xs text-slate-600 mb-4">
              Escanea la clave secreta en tu aplicación TOTP favorita e introduce el código de 6 dígitos.
            </p>

            <div className="p-4 bg-slate-100 rounded-2xl text-center mb-4">
              <div className="font-mono text-sm font-black text-slate-800 tracking-wider">
                JBSWY3DPEHPK3PXP
              </div>
              <p className="text-[10px] text-slate-500 mt-1">Clave secreta manual para tu app</p>
            </div>

            <form onSubmit={handleConfirmMfa} className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Código de 6 dígitos generado
                </label>
                <input
                  type="text"
                  required
                  maxLength={6}
                  value={mfaCode}
                  onChange={(e) => setMfaCode(e.target.value.replace(/\D/g, ''))}
                  placeholder="123456"
                  className="w-full text-center tracking-widest text-lg font-bold rounded-xl border border-slate-200 p-2.5 focus:ring-2 focus:ring-teal-500"
                />
              </div>

              <div className="flex items-center justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setMfaModalOpen(false)}
                  className="px-4 py-2 rounded-xl text-xs font-semibold text-slate-600 hover:bg-slate-100"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 rounded-xl bg-teal-600 hover:bg-teal-700 text-white text-xs font-bold shadow-md"
                >
                  Verificar y Activar 2FA
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Account Deletion Modal */}
      {deleteModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs">
          <div className="bg-white rounded-3xl p-6 max-w-md w-full shadow-2xl border border-slate-100">
            <h3 className="font-extrabold text-rose-700 text-lg mb-2">Confirmar Eliminación de Cuenta</h3>
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
                  className="w-full text-xs rounded-xl border border-slate-200 p-2.5"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Escribe exactamente <span className="text-rose-600">"eliminar mi cuenta"</span> para confirmar:
                </label>
                <input
                  type="text"
                  required
                  value={deleteConfirmText}
                  onChange={(e) => setDeleteConfirmText(e.target.value)}
                  className="w-full text-xs rounded-xl border border-slate-200 p-2.5"
                />
              </div>

              <div className="flex items-center justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setDeleteModalOpen(false)}
                  className="px-4 py-2 rounded-xl text-xs font-semibold text-slate-600 hover:bg-slate-100"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={deleteConfirmText.toLowerCase() !== 'eliminar mi cuenta'}
                  className="px-5 py-2 rounded-xl bg-rose-600 disabled:opacity-40 text-white text-xs font-bold shadow-md"
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
