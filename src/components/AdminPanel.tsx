import React, { useState, useEffect } from 'react';
import { Users, ShieldAlert, FileSliders } from 'lucide-react';
import { User, AuditLog, CustomRole } from '../types';
import PanelGestorUsuarios from './admin/PanelGestorUsuarios';
import PanelRolesJerarquia from './admin/PanelRolesJerarquia';
import PanelAuditoriaCifrado from './admin/PanelAuditoriaCifrado';

interface AdminPanelProps {
  currentUser: Omit<User, 'passwordHash' | 'recoveryToken'>;
  auditLogs: AuditLog[];
  onRefreshAudit: () => void;
  onRefreshUsers: () => void;
  users: Omit<User, 'passwordHash' | 'recoveryToken'>[];
  notifications: any[];
  onClearNotifications: () => void;
}

export default function AdminPanel(props: AdminPanelProps) {
  const { currentUser } = props;
  const [activeTab, setActiveTab] = useState<'users' | 'roles' | 'audit'>(() => {
    const saved = localStorage.getItem('sentinel_admin_subtab') as 'users' | 'roles' | 'audit';
    const isLevel4or5 = currentUser.level === 4 || currentUser.level === 5;
    const isLevel3or5 = currentUser.level === 3 || currentUser.level === 5;
    const isLevel5 = currentUser.level >= 5;

    if (saved === 'roles' && !isLevel5) return isLevel4or5 ? 'users' : 'audit';
    if (saved === 'audit' && !isLevel3or5) return isLevel4or5 ? 'users' : 'roles';
    if (saved === 'users' && !isLevel4or5) return isLevel3or5 ? 'audit' : 'roles';
    
    if (saved) return saved;
    return isLevel4or5 ? 'users' : 'audit';
  });

  useEffect(() => {
    localStorage.setItem('sentinel_admin_subtab', activeTab);
  }, [activeTab]);

  const hasRolesAccess = currentUser.level >= 5;
  const hasUsersAccess = currentUser.level === 4 || currentUser.level === 5;
  const hasAuditAccess = currentUser.level === 3 || currentUser.level === 5;

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex items-center gap-6 border-b border-white/10 mb-6">
        {hasUsersAccess && (
          <button
            onClick={() => setActiveTab('users')}
            className={`pb-3 text-sm font-semibold transition-all ${
              activeTab === 'users' ? 'text-blue-400 border-b-2 border-blue-500' : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            <Users className="w-4 h-4 inline mr-2" />
            Monitoreo y Usuarios
          </button>
        )}
        {hasRolesAccess && (
          <button
            onClick={() => setActiveTab('roles')}
            className={`pb-3 text-sm font-semibold transition-all ${
              activeTab === 'roles' ? 'text-blue-400 border-b-2 border-blue-500' : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            <FileSliders className="w-4 h-4 inline mr-2" />
            Roles y Jerarquías (CRUD)
          </button>
        )}
        {hasAuditAccess && (
          <button
            onClick={() => setActiveTab('audit')}
            className={`pb-3 text-sm font-semibold transition-all ${
              activeTab === 'audit' ? 'text-blue-400 border-b-2 border-blue-500' : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            <ShieldAlert className="w-4 h-4 inline mr-2" />
            Auditoría y Cifrado
          </button>
        )}
      </div>

      <div className="mt-6">
        {activeTab === 'users' && hasUsersAccess && (
          <PanelGestorUsuarios {...props} />
        )}
        {activeTab === 'users' && !hasUsersAccess && (
          <div className="p-4 bg-red-500/10 text-red-500 rounded border border-red-500/20">
            Acceso Denegado. Privilegios Insuficientes (Nivel 4 o 5 requerido).
          </div>
        )}

        {activeTab === 'roles' && hasRolesAccess && (
          <PanelRolesJerarquia {...props} />
        )}
        {activeTab === 'roles' && !hasRolesAccess && (
          <div className="p-4 bg-red-500/10 text-red-500 rounded border border-red-500/20">
            Acceso Denegado. Privilegios Insuficientes (Nivel 5 requerido).
          </div>
        )}

        {activeTab === 'audit' && hasAuditAccess && (
          <PanelAuditoriaCifrado {...props} />
        )}
        {activeTab === 'audit' && !hasAuditAccess && (
          <div className="p-4 bg-red-500/10 text-red-500 rounded border border-red-500/20">
            Acceso Denegado. Privilegios Insuficientes (Nivel 3 o 5 requerido).
          </div>
        )}
      </div>
    </div>
  );
}
