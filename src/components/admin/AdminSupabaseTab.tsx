import React, { useState, useEffect } from 'react';
import {
  Database,
  Server,
  HardDrive,
  Activity,
  ShieldCheck,
  AlertTriangle,
  Play,
  RefreshCw,
  CheckCircle2,
  Lock,
  FileCode2,
  ExternalLink,
  Layers
} from 'lucide-react';
import { CleanupDryRunResult } from '../../types';
import { runCleanupDryRun, testEdgeFunctionHealth } from '../../services/adminService';
import { ConfirmActionModal } from './ConfirmActionModal';

export const AdminSupabaseTab: React.FC = () => {
  const [dryRunResult, setDryRunResult] = useState<CleanupDryRunResult | null>(null);
  const [runningDryRun, setRunningDryRun] = useState<boolean>(false);
  const [edgeStatus, setEdgeStatus] = useState<{ status: string; latency: number; details: string }>({
    status: 'INICIALIZANDO',
    latency: 0,
    details: 'Verificando...'
  });

  const handleRunDryRun = async () => {
    setRunningDryRun(true);
    try {
      const res = await runCleanupDryRun();
      setDryRunResult(res);
    } catch (err) {
      console.error('Error running cleanup dry run:', err);
    } finally {
      setRunningDryRun(false);
    }
  };

  const checkEdgeHealth = async () => {
    const res = await testEdgeFunctionHealth('verify-turnstile');
    setEdgeStatus({
      status: res.status,
      latency: res.latencyMs,
      details: res.details
    });
  };

  useEffect(() => {
    checkEdgeHealth();
  }, []);

  const coreTables = [
    { name: 'profiles', desc: 'Perfiles de usuario y reputación', rls: true },
    { name: 'social_profiles', desc: 'Perfiles vinculados e inmutables', rls: true },
    { name: 'campaigns', desc: 'Campañas de abrazos creadas', rls: true },
    { name: 'campaign_tasks', desc: 'Oportunidades y ejecuciones de apoyo', rls: true },
    { name: 'invitations', desc: 'Enlaces y registros referidos', rls: true },
    { name: 'admin_audit_log', desc: 'Auditoría inmutable append-only', rls: true },
    { name: 'moderation_reports', desc: 'Cola de denuncias e incidencias', rls: true },
    { name: 'announcements', desc: 'Anuncios y comunicados globales', rls: true },
    { name: 'feature_flags', desc: 'Banderas dinámicas de funcionalidad', rls: true },
    { name: 'user_restrictions', desc: 'Restricciones granulares por cuenta', rls: true }
  ];

  return (
    <div className="space-y-6">
      {/* Cleanup Center Safe Workflow */}
      <div className="bg-white p-6 rounded-2xl border border-slate-200/80 shadow-xs space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-100 pb-4">
          <div>
            <div className="flex items-center gap-2">
              <span className="px-2.5 py-0.5 rounded-full text-xs font-bold bg-sky-100 text-sky-800">
                PROTOCOLO SEGURO ANTI-PÉRDIDA
              </span>
            </div>
            <h2 className="text-base font-extrabold text-slate-900 mt-1">
              Centro de Limpieza Segura de Supabase (Safe Cleanup)
            </h2>
            <p className="text-xs text-slate-500 mt-0.5">
              Flujo mandatorio: SCAN → DRY RUN → CLASIFICACIÓN → CONFIRMACIÓN EXPLÍCITA.
              Nunca se eliminan registros REALES ni DESCONOCIDOS.
            </p>
          </div>

          <button
            onClick={handleRunDryRun}
            disabled={runningDryRun}
            className="inline-flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold text-white bg-slate-900 hover:bg-slate-800 transition-colors shadow-xs"
          >
            <Play className={`w-3.5 h-3.5 ${runningDryRun ? 'animate-spin' : ''}`} />
            <span>{runningDryRun ? 'Ejecutando Scan...' : 'Ejecutar Dry Run'}</span>
          </button>
        </div>

        {/* Dry Run Classification Results */}
        {dryRunResult && (
          <div className="space-y-4 animate-in fade-in duration-200">
            <div className="p-3.5 bg-emerald-50 rounded-xl border border-emerald-200 text-xs font-bold text-emerald-800 flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
              <span>{dryRunResult.notice}</span>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-5 gap-3">
              <div className="p-3.5 bg-slate-50 rounded-xl border border-slate-200">
                <span className="text-[10px] font-bold text-emerald-700 uppercase">REALES (Protegidos)</span>
                <div className="text-xl font-black text-slate-900 mt-1">{dryRunResult.real_records}</div>
                <div className="text-[10px] text-slate-400 mt-0.5">Cuentas Google OAuth legítimas</div>
              </div>

              <div className="p-3.5 bg-slate-50 rounded-xl border border-slate-200">
                <span className="text-[10px] font-bold text-amber-700 uppercase">DE PRUEBA (Test)</span>
                <div className="text-xl font-black text-slate-900 mt-1">{dryRunResult.test_records}</div>
                <div className="text-[10px] text-slate-400 mt-0.5">Correos tipo @example.com</div>
              </div>

              <div className="p-3.5 bg-slate-50 rounded-xl border border-slate-200">
                <span className="text-[10px] font-bold text-slate-500 uppercase">SIMULADOS</span>
                <div className="text-xl font-black text-slate-900 mt-1">{dryRunResult.simulated_records}</div>
                <div className="text-[10px] text-slate-400 mt-0.5">Datos sintéticos</div>
              </div>

              <div className="p-3.5 bg-slate-50 rounded-xl border border-slate-200">
                <span className="text-[10px] font-bold text-rose-700 uppercase">HUÉRFANOS</span>
                <div className="text-xl font-black text-slate-900 mt-1">{dryRunResult.orphan_records}</div>
                <div className="text-[10px] text-slate-400 mt-0.5">Sin usuario asociado</div>
              </div>

              <div className="p-3.5 bg-slate-50 rounded-xl border border-slate-200">
                <span className="text-[10px] font-bold text-slate-500 uppercase">DESCONOCIDOS (Blindados)</span>
                <div className="text-xl font-black text-slate-900 mt-1">{dryRunResult.unknown_records}</div>
                <div className="text-[10px] text-slate-400 mt-0.5">Prohibido borrado automático</div>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Database Tables & RLS Status */}
      <div className="bg-white p-6 rounded-2xl border border-slate-200/80 shadow-xs space-y-4">
        <h2 className="text-base font-extrabold text-slate-900 flex items-center gap-2">
          <Database className="w-4 h-4 text-sky-600" />
          <span>Esquema de Base de Datos y Row Level Security (RLS)</span>
        </h2>
        <p className="text-xs text-slate-500">
          Todas las tablas críticas cuentan con RLS habilitado, impidiendo el acceso a través de consultas abiertas sin autenticar.
        </p>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-3 pt-1">
          {coreTables.map((t) => (
            <div
              key={t.name}
              className="p-3.5 rounded-xl border border-slate-100 bg-slate-50/60 flex items-center justify-between"
            >
              <div>
                <div className="font-mono font-bold text-xs text-slate-900">public.{t.name}</div>
                <div className="text-[11px] text-slate-500 mt-0.5">{t.desc}</div>
              </div>
              <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-100 text-emerald-800">
                <Lock className="w-3 h-3" />
                <span>RLS ACTIVO</span>
              </span>
            </div>
          ))}
        </div>
      </div>

      {/* Edge Functions Diagnostics */}
      <div className="bg-white p-6 rounded-2xl border border-slate-200/80 shadow-xs space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="text-base font-extrabold text-slate-900 flex items-center gap-2">
            <Server className="w-4 h-4 text-indigo-600" />
            <span>Supabase Edge Functions en Producción</span>
          </h2>
          <button
            onClick={checkEdgeHealth}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold text-slate-700 hover:bg-slate-100"
          >
            <RefreshCw className="w-3.5 h-3.5" />
            <span>Probar Latencia</span>
          </button>
        </div>

        <div className="p-4 rounded-xl border border-slate-100 bg-slate-50 flex items-center justify-between">
          <div>
            <div className="font-mono font-bold text-xs text-slate-900">verify-turnstile</div>
            <div className="text-xs text-slate-500 mt-0.5">{edgeStatus.details}</div>
          </div>
          <div className="text-right">
            <span
              className={`px-2.5 py-1 rounded-full text-xs font-bold ${
                edgeStatus.status === 'OK' ? 'bg-emerald-100 text-emerald-800' : 'bg-amber-100 text-amber-800'
              }`}
            >
              {edgeStatus.status}
            </span>
            <div className="text-[11px] text-slate-400 mt-1 font-mono">{edgeStatus.latency} ms</div>
          </div>
        </div>
      </div>

      {/* Backup & Recovery Info */}
      <div className="bg-white p-6 rounded-2xl border border-slate-200/80 shadow-xs space-y-3">
        <h2 className="text-base font-extrabold text-slate-900 flex items-center gap-2">
          <HardDrive className="w-4 h-4 text-sky-600" />
          <span>Respaldo y Recuperación (Backup & Recovery)</span>
        </h2>
        <p className="text-xs text-slate-600 leading-relaxed">
          Los respaldos continuos (Point-in-Time Recovery y Snapshots automáticos diarios) se gestionan directamente a nivel de infraestructura en la consola oficial de Supabase.
        </p>
        <div className="p-3.5 bg-sky-50 rounded-xl border border-sky-100 text-xs text-sky-800 flex items-center justify-between">
          <span>Para restauraciones físicas o rollback completo de la base de datos:</span>
          <a
            href="https://supabase.com/dashboard/project/ocyjnplyywvctqikjrrh"
            target="_blank"
            rel="noreferrer"
            className="font-bold underline flex items-center gap-1"
          >
            <span>Supabase Dashboard</span>
            <ExternalLink className="w-3.5 h-3.5" />
          </a>
        </div>
      </div>
    </div>
  );
};
