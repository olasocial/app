import React from 'react';
import {
  Shield,
  ShieldCheck,
  ShieldAlert,
  Lock,
  Key,
  CheckCircle2,
  XCircle,
  AlertTriangle,
  Server,
  UserCheck
} from 'lucide-react';

export const AdminSecurityTab: React.FC = () => {
  const rbacMatrix = [
    {
      permission: 'Ver Centro de Administración',
      superAdmin: true,
      admin: true,
      moderator: true,
      support: true,
      user: false
    },
    {
      permission: 'Bloquear / Suspender Usuarios',
      superAdmin: true,
      admin: true,
      moderator: true,
      support: false,
      user: false
    },
    {
      permission: 'Banear Cuentas Definitivamente',
      superAdmin: true,
      admin: true,
      moderator: false,
      support: false,
      user: false
    },
    {
      permission: 'Ajuste Manual de Reputación',
      superAdmin: true,
      admin: true,
      moderator: false,
      support: false,
      user: false
    },
    {
      permission: 'Publicar Anuncios y Campañas',
      superAdmin: true,
      admin: true,
      moderator: false,
      support: false,
      user: false
    },
    {
      permission: 'Alternar Feature Flags',
      superAdmin: true,
      admin: true,
      moderator: false,
      support: false,
      user: false
    },
    {
      permission: 'Activar Modo de Mantenimiento',
      superAdmin: true,
      admin: true,
      moderator: false,
      support: false,
      user: false
    },
    {
      permission: 'Activar Modo de Emergencia',
      superAdmin: true,
      admin: false,
      moderator: false,
      support: false,
      user: false
    },
    {
      permission: 'Limpieza Segura de Supabase (Dry Run)',
      superAdmin: true,
      admin: true,
      moderator: false,
      support: false,
      user: false
    },
    {
      permission: 'Exportar Registros de Auditoría',
      superAdmin: true,
      admin: true,
      moderator: false,
      support: false,
      user: false
    }
  ];

  return (
    <div className="space-y-6">
      {/* Super Admin Immutable Protection Card */}
      <div className="bg-white p-6 rounded-2xl border border-slate-200/80 shadow-xs space-y-3">
        <div className="flex items-center gap-2">
          <span className="px-2.5 py-0.5 rounded-full text-xs font-bold bg-amber-100 text-amber-800 flex items-center gap-1.5">
            <ShieldCheck className="w-3.5 h-3.5 text-amber-700" />
            PROTECCIÓN DE TRIGGER INMUTABLE ACTIVA
          </span>
        </div>
        <h2 className="text-base font-extrabold text-slate-900 mt-1">
          Blindaje de Cuenta Super Administradora
        </h2>
        <p className="text-xs text-slate-600 leading-relaxed">
          El trigger <code className="font-mono bg-slate-100 px-1 py-0.5 rounded text-slate-800">protect_super_admin</code> en PostgreSQL intercepta cualquier intento de degradación de rol, suspensión o borrado contra el operador administrativo supremo autorizado, impidiendo bloqueos accidentales o ataques por elevación indebida de privilegios.
        </p>
      </div>

      {/* RBAC Matrix Table */}
      <div className="bg-white p-6 rounded-2xl border border-slate-200/80 shadow-xs space-y-4">
        <div>
          <h2 className="text-base font-extrabold text-slate-900 flex items-center gap-2">
            <Lock className="w-4 h-4 text-sky-600" />
            <span>Matriz de Control de Acceso Basado en Roles (RBAC)</span>
          </h2>
          <p className="text-xs text-slate-500 mt-0.5">
            Jerarquía y privilegios operativos autorizados en la plataforma.
          </p>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-50 text-slate-500 font-bold border-b border-slate-200 uppercase">
              <tr>
                <th className="p-3">Permiso / Capacidad</th>
                <th className="p-3 text-center">Super Admin</th>
                <th className="p-3 text-center">Admin</th>
                <th className="p-3 text-center">Moderador</th>
                <th className="p-3 text-center">Soporte</th>
                <th className="p-3 text-center">Usuario</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {rbacMatrix.map((item, idx) => (
                <tr key={idx} className="hover:bg-slate-50/50">
                  <td className="p-3 font-semibold text-slate-800">{item.permission}</td>
                  <td className="p-3 text-center">
                    {item.superAdmin ? (
                      <CheckCircle2 className="w-4 h-4 text-emerald-600 mx-auto" />
                    ) : (
                      <XCircle className="w-4 h-4 text-slate-300 mx-auto" />
                    )}
                  </td>
                  <td className="p-3 text-center">
                    {item.admin ? (
                      <CheckCircle2 className="w-4 h-4 text-emerald-600 mx-auto" />
                    ) : (
                      <XCircle className="w-4 h-4 text-slate-300 mx-auto" />
                    )}
                  </td>
                  <td className="p-3 text-center">
                    {item.moderator ? (
                      <CheckCircle2 className="w-4 h-4 text-emerald-600 mx-auto" />
                    ) : (
                      <XCircle className="w-4 h-4 text-slate-300 mx-auto" />
                    )}
                  </td>
                  <td className="p-3 text-center">
                    {item.support ? (
                      <CheckCircle2 className="w-4 h-4 text-emerald-600 mx-auto" />
                    ) : (
                      <XCircle className="w-4 h-4 text-slate-300 mx-auto" />
                    )}
                  </td>
                  <td className="p-3 text-center">
                    {item.user ? (
                      <CheckCircle2 className="w-4 h-4 text-emerald-600 mx-auto" />
                    ) : (
                      <XCircle className="w-4 h-4 text-slate-300 mx-auto" />
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Cloudflare Turnstile Verification Diagnostics */}
      <div className="bg-white p-6 rounded-2xl border border-slate-200/80 shadow-xs space-y-4">
        <h2 className="text-base font-extrabold text-slate-900 flex items-center gap-2">
          <Shield className="w-4 h-4 text-sky-600" />
          <span>Diagnóstico de Cloudflare Turnstile y Validación Serverless</span>
        </h2>
        <p className="text-xs text-slate-600 leading-relaxed">
          Los desafíos invisibles de Turnstile previenen ataques de bots sin requerir retos manuales molestos (captchas de imágenes). La validación se realiza del lado del servidor en la Edge Function mediante la clave secreta inyectada en el entorno Supabase.
        </p>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
          <div className="p-3 bg-slate-50 rounded-xl border border-slate-100">
            <span className="text-[10px] text-slate-400 font-bold uppercase">Cliente Frontend</span>
            <div className="text-xs font-bold text-slate-800 mt-1">Turnstile Widget</div>
            <div className="text-[10px] text-emerald-600 font-semibold mt-0.5">VITE_TURNSTILE_SITE_KEY activa</div>
          </div>

          <div className="p-3 bg-slate-50 rounded-xl border border-slate-100">
            <span className="text-[10px] text-slate-400 font-bold uppercase">Validación Backend</span>
            <div className="text-xs font-bold text-slate-800 mt-1">Supabase Edge Function</div>
            <div className="text-[10px] text-emerald-600 font-semibold mt-0.5">Secret en vault de servidor</div>
          </div>

          <div className="p-3 bg-slate-50 rounded-xl border border-slate-100">
            <span className="text-[10px] text-slate-400 font-bold uppercase">Escaneo de Secretos</span>
            <div className="text-xs font-bold text-slate-800 mt-1">CI/CD Pipeline</div>
            <div className="text-[10px] text-emerald-600 font-semibold mt-0.5">0 secretos expuestos</div>
          </div>
        </div>
      </div>
    </div>
  );
};
