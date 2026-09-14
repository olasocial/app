import React, { useState } from 'react';
import {
  LayoutDashboard,
  Users,
  ShieldAlert,
  Megaphone,
  TrendingUp,
  Sliders,
  Server,
  Lock,
  FileText,
  Sparkles,
  ShieldCheck,
  Heart
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { AdminSection } from '../types';

import { AdminDashboardTab } from './admin/AdminDashboardTab';
import { AdminUsersTab } from './admin/AdminUsersTab';
import { AdminModerationTab } from './admin/AdminModerationTab';
import { AdminContentTab } from './admin/AdminContentTab';
import { AdminGrowthTab } from './admin/AdminGrowthTab';
import { AdminSystemTab } from './admin/AdminSystemTab';
import { AdminSupabaseTab } from './admin/AdminSupabaseTab';
import { AdminSecurityTab } from './admin/AdminSecurityTab';
import { AdminAuditTab } from './admin/AdminAuditTab';
import { AdminDonationsTab } from './admin/AdminDonationsTab';

export const AdminPanel: React.FC = () => {
  const { user, isSuperAdmin } = useAuth();
  const [activeSection, setActiveSection] = useState<AdminSection>('dashboard');

  const navigationItems: { id: AdminSection; label: string; icon: React.ReactNode }[] = [
    { id: 'dashboard', label: 'Dashboard', icon: <LayoutDashboard className="w-4 h-4" /> },
    { id: 'donations', label: 'Donaciones', icon: <Heart className="w-4 h-4" /> },
    { id: 'users', label: 'Usuarios', icon: <Users className="w-4 h-4" /> },
    { id: 'moderation', label: 'Moderación', icon: <ShieldAlert className="w-4 h-4" /> },
    { id: 'content', label: 'Contenido y Avisos', icon: <Megaphone className="w-4 h-4" /> },
    { id: 'growth', label: 'Crecimiento', icon: <TrendingUp className="w-4 h-4" /> },
    { id: 'system', label: 'Sistema y Flags', icon: <Sliders className="w-4 h-4" /> },
    { id: 'supabase', label: 'Supabase y Limpieza', icon: <Server className="w-4 h-4" /> },
    { id: 'security', label: 'Seguridad y RBAC', icon: <Lock className="w-4 h-4" /> },
    { id: 'audit', label: 'Auditoría y Errores', icon: <FileText className="w-4 h-4" /> }
  ];

  return (
    <div className="space-y-6 max-w-7xl mx-auto pb-16">
      {/* Top Banner Header */}
      <div className="bg-slate-900 text-white rounded-3xl p-6 sm:p-7 shadow-xl border border-slate-800">
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          <div>
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-500/20 text-emerald-300 text-xs font-bold mb-2">
              <Sparkles className="w-3.5 h-3.5" />
              <span>
                Panel de Control de Producción • Rol: {user?.role || 'ADMIN'} {isSuperAdmin ? '(SUPER)' : ''}
              </span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-black tracking-tight">
              Centro de Administración OLA SOCIAL
            </h1>
            <p className="text-slate-400 text-xs sm:text-sm mt-1">
              Consola unificada de gestión comunitaria, control de usuarios, moderación en tiempo real y seguridad.
            </p>
          </div>

          <div className="flex items-center gap-2">
            <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-slate-800 border border-slate-700 text-xs font-semibold text-slate-300">
              <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" />
              <span>Operador Oficial Autenticado</span>
            </span>
          </div>
        </div>

        {/* Navigation Bar */}
        <div className="mt-6 pt-4 border-t border-slate-800/80 flex items-center gap-1.5 overflow-x-auto no-scrollbar touch-pan-x">
          {navigationItems.map((item) => {
            const isActive = activeSection === item.id;
            return (
              <button
                key={item.id}
                onClick={() => setActiveSection(item.id)}
                className={`flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-bold whitespace-nowrap shrink-0 transition-all ${
                  isActive
                    ? 'bg-sky-600 text-white shadow-xs'
                    : 'text-slate-400 hover:text-white hover:bg-slate-800/70'
                }`}
              >
                {item.icon}
                <span>{item.label}</span>
              </button>
            );
          })}
        </div>
      </div>

      {/* Render Active Section Tab */}
      <div className="animate-in fade-in duration-150">
        {activeSection === 'dashboard' && (
          <AdminDashboardTab onNavigateSection={(sec) => setActiveSection(sec)} />
        )}
        {activeSection === 'donations' && <AdminDonationsTab />}
        {activeSection === 'users' && <AdminUsersTab />}
        {activeSection === 'moderation' && <AdminModerationTab />}
        {activeSection === 'content' && <AdminContentTab />}
        {activeSection === 'growth' && <AdminGrowthTab />}
        {activeSection === 'system' && <AdminSystemTab />}
        {activeSection === 'supabase' && <AdminSupabaseTab />}
        {activeSection === 'security' && <AdminSecurityTab />}
        {activeSection === 'audit' && <AdminAuditTab />}
      </div>
    </div>
  );
};
