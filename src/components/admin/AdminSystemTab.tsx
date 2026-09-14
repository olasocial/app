import React, { useState, useEffect } from 'react';
import {
  Zap,
  Sliders,
  AlertTriangle,
  ShieldAlert,
  Server,
  RefreshCw,
  CheckCircle2,
  Lock,
  Radio,
  Clock,
  Smartphone
} from 'lucide-react';
import { FeatureFlag, MaintenanceConfig } from '../../types';
import {
  fetchFeatureFlags,
  toggleFeatureFlag,
  fetchMaintenanceConfig,
  setMaintenanceMode
} from '../../services/adminService';
import { ConfirmActionModal } from './ConfirmActionModal';

export const AdminSystemTab: React.FC = () => {
  const [flags, setFlags] = useState<FeatureFlag[]>([]);
  const [maintenance, setMaintenance] = useState<MaintenanceConfig>({
    enabled: false,
    emergency: false,
    message: 'Estamos realizando mejoras programadas. Regresamos en breve.',
    allow_admin: true
  });
  const [loading, setLoading] = useState<boolean>(true);
  const [actionLoading, setActionLoading] = useState<boolean>(false);

  // Emergency Modal
  const [emergencyModal, setEmergencyModal] = useState<boolean>(false);

  const loadData = async () => {
    setLoading(true);
    try {
      const [flagsRes, maintRes] = await Promise.all([
        fetchFeatureFlags(),
        fetchMaintenanceConfig()
      ]);
      setFlags(flagsRes);
      setMaintenance(maintRes);
    } catch (err) {
      console.error('Error loading system configs:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const handleToggleFlag = async (flag: FeatureFlag) => {
    const nextState = !flag.enabled;
    const reason = prompt(`Motivo para ${nextState ? 'activar' : 'desactivar'} la función "${flag.key}":`) || 'Ajuste administrativo';

    setActionLoading(true);
    const res = await toggleFeatureFlag(flag.key, nextState, reason);
    setActionLoading(false);

    if (res.success) {
      await loadData();
    } else {
      alert(res.message);
    }
  };

  const handleSaveMaintenance = async (enabled: boolean, emergency: boolean = false) => {
    setActionLoading(true);
    const res = await setMaintenanceMode({
      ...maintenance,
      enabled,
      emergency
    });
    setActionLoading(false);

    if (res.success) {
      setEmergencyModal(false);
      await loadData();
      alert(`Modo ${emergency ? 'de Emergencia' : 'de Mantenimiento'} ${enabled ? 'ACTIVADO' : 'DESACTIVADO'}.`);
    } else {
      alert(res.message);
    }
  };

  return (
    <div className="space-y-6">
      {/* Maintenance & Emergency Section */}
      <div className="bg-white p-6 rounded-2xl border border-slate-200/80 shadow-xs space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-100 pb-4">
          <div>
            <div className="flex items-center gap-2">
              <span
                className={`px-2.5 py-0.5 rounded-full text-xs font-bold ${
                  maintenance.emergency
                    ? 'bg-rose-100 text-rose-800'
                    : maintenance.enabled
                    ? 'bg-amber-100 text-amber-800'
                    : 'bg-emerald-100 text-emerald-800'
                }`}
              >
                {maintenance.emergency
                  ? 'EMERGENCIA ACTIVA'
                  : maintenance.enabled
                  ? 'MANTENIMIENTO PROGRAMADO'
                  : 'OPERACIÓN NORMAL'}
              </span>
              <span className="text-xs text-slate-500">Control de Disponibilidad Global</span>
            </div>
            <h2 className="text-base font-extrabold text-slate-900 mt-1">
              Modo de Mantenimiento y Modo de Emergencia
            </h2>
          </div>

          <div className="flex items-center gap-2">
            {!maintenance.enabled ? (
              <button
                onClick={() => handleSaveMaintenance(true, false)}
                disabled={actionLoading}
                className="px-4 py-2 rounded-xl text-xs font-bold text-amber-900 bg-amber-100 hover:bg-amber-200 transition-colors"
              >
                Activar Mantenimiento
              </button>
            ) : (
              <button
                onClick={() => handleSaveMaintenance(false, false)}
                disabled={actionLoading}
                className="px-4 py-2 rounded-xl text-xs font-bold text-emerald-900 bg-emerald-100 hover:bg-emerald-200 transition-colors"
              >
                Desactivar Mantenimiento
              </button>
            )}

            {!maintenance.emergency ? (
              <button
                onClick={() => setEmergencyModal(true)}
                disabled={actionLoading}
                className="px-4 py-2 rounded-xl text-xs font-bold text-white bg-rose-600 hover:bg-rose-700 transition-colors shadow-xs"
              >
                Modo de Emergencia
              </button>
            ) : (
              <button
                onClick={() => handleSaveMaintenance(false, false)}
                disabled={actionLoading}
                className="px-4 py-2 rounded-xl text-xs font-bold text-white bg-slate-900 hover:bg-slate-800 transition-colors"
              >
                Finalizar Emergencia
              </button>
            )}
          </div>
        </div>

        {/* Maintenance Message Config */}
        <div className="space-y-3 pt-1">
          <div>
            <label className="text-xs font-bold text-slate-700 block mb-1">
              Mensaje público mostrado a los usuarios:
            </label>
            <input
              type="text"
              value={maintenance.message}
              onChange={(e) => setMaintenance(prev => ({ ...prev, message: e.target.value }))}
              placeholder="Ej: Estamos realizando mejoras de infraestructura..."
              className="w-full p-2.5 text-xs border border-slate-200 rounded-xl focus:outline-hidden focus:ring-2 focus:ring-sky-500"
            />
          </div>

          <div className="flex items-center justify-between text-xs text-slate-500">
            <span>
              Acceso administrativo reservado: <strong>Permitido automáticamente para administradores</strong>
            </span>
            <button
              onClick={() => handleSaveMaintenance(maintenance.enabled, maintenance.emergency)}
              disabled={actionLoading}
              className="px-3 py-1.5 rounded-xl text-xs font-bold text-slate-800 bg-slate-100 hover:bg-slate-200"
            >
              Guardar Mensaje
            </button>
          </div>
        </div>
      </div>

      {/* Feature Flags Center */}
      <div className="bg-white p-6 rounded-2xl border border-slate-200/80 shadow-xs space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-base font-extrabold text-slate-900 flex items-center gap-2">
              <Zap className="w-4 h-4 text-sky-600" />
              <span>Banderas de Funcionalidad (Feature Flags)</span>
            </h2>
            <p className="text-xs text-slate-500 mt-0.5">
              Habilita o pausa módulos funcionales en caliente de forma instantánea sin requerir nuevo despliegue.
            </p>
          </div>

          <button
            onClick={loadData}
            disabled={loading}
            className="p-1.5 rounded-lg text-slate-600 hover:bg-slate-100"
          >
            <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
          </button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-3 pt-2">
          {flags.map((flag) => (
            <div
              key={flag.key}
              className="p-3.5 rounded-xl border border-slate-100 bg-slate-50/70 flex items-center justify-between gap-3"
            >
              <div className="min-w-0">
                <div className="flex items-center gap-2">
                  <span className="font-mono font-bold text-xs text-slate-900">{flag.key}</span>
                  <span className="px-1.5 py-0.2 rounded text-[9px] font-bold bg-slate-200/70 text-slate-700">
                    {flag.category}
                  </span>
                </div>
                <div className="text-[11px] text-slate-500 mt-0.5 leading-snug">{flag.description}</div>
                {flag.reason && (
                  <div className="text-[10px] text-slate-400 mt-0.5 italic">Nota: {flag.reason}</div>
                )}
              </div>

              <button
                onClick={() => handleToggleFlag(flag)}
                disabled={actionLoading}
                className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all shrink-0 ${
                  flag.enabled
                    ? 'bg-emerald-600 text-white shadow-xs hover:bg-emerald-700'
                    : 'bg-slate-200 text-slate-700 hover:bg-slate-300'
                }`}
              >
                {flag.enabled ? 'ACTIVO' : 'PAUSADO'}
              </button>
            </div>
          ))}
        </div>
      </div>

      {/* PWA & Cache Management */}
      <div className="bg-white p-6 rounded-2xl border border-slate-200/80 shadow-xs space-y-3">
        <h2 className="text-base font-extrabold text-slate-900 flex items-center gap-2">
          <Smartphone className="w-4 h-4 text-sky-600" />
          <span>Control de Progressive Web App (PWA) y Caché</span>
        </h2>
        <p className="text-xs text-slate-600 leading-relaxed">
          La aplicación utiliza un Service Worker configurado con caché offline y revalidación automática.
        </p>
        <div className="flex items-center gap-4 text-xs pt-1">
          <div className="p-2.5 rounded-xl bg-slate-50 border border-slate-100">
            <span className="text-slate-500">Manifest:</span>{' '}
            <strong className="text-slate-800">/manifest.webmanifest (OK)</strong>
          </div>
          <div className="p-2.5 rounded-xl bg-slate-50 border border-slate-100">
            <span className="text-slate-500">Service Worker:</span>{' '}
            <strong className="text-slate-800">/sw.js (Activo)</strong>
          </div>
        </div>
      </div>

      {/* Emergency Confirmation Modal */}
      <ConfirmActionModal
        isOpen={emergencyModal}
        title="Activar Modo de Emergencia Global"
        description="Esta acción desactiva de inmediato todas las operaciones sociales comunitarias y bloquea el registro de nuevas transacciones. Exclusivo para contención de incidentes graves."
        confirmPhrase="MODO EMERGENCIA"
        confirmButtonText="Activar Emergencia"
        isDestructive={true}
        onConfirm={() => handleSaveMaintenance(true, true)}
        onClose={() => setEmergencyModal(false)}
        isLoading={actionLoading}
      />
    </div>
  );
};
