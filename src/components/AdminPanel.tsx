/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import { 
  Users, ShieldAlert, FileSliders, Search, ShieldX, 
  UserCheck, RefreshCw, Key, LogOut, CheckCircle, 
  Trash2, ShieldCheck, HeartPulse, Clock, Globe,
  UserPlus, PlusCircle, Shield, Award, Edit, Eye, EyeOff,
  Activity, AlertTriangle, Monitor, ShieldEllipsis, Chrome, X
} from 'lucide-react';
import { User, AuditLog, UserRole, CustomRole } from '../types';
import { 
  PieChart, Pie, Cell, ResponsiveContainer, Tooltip, Legend, 
  BarChart, Bar, XAxis, YAxis, CartesianGrid, LineChart, Line 
} from 'recharts';

interface AdminPanelProps {
  currentUser: Omit<User, 'passwordHash' | 'recoveryToken'>;
  auditLogs: AuditLog[];
  onRefreshAudit: () => void;
  onRefreshUsers: () => void;
  users: Omit<User, 'passwordHash' | 'recoveryToken'>[];
  notifications: any[];
  onClearNotifications: () => void;
}

export default function AdminPanel({
  currentUser,
  auditLogs,
  onRefreshAudit,
  onRefreshUsers,
  users,
  notifications,
  onClearNotifications
}: AdminPanelProps) {
  const [searchTerm, setSearchTerm] = useState('');
  const [roleFilter, setRoleFilter] = useState<string>('all');
  const [logSearchTerm, setLogSearchTerm] = useState('');
  const [logFilter, setLogFilter] = useState<string>('all');
  const [loadingUserId, setLoadingUserId] = useState<string | null>(null);
  const [activeLockSelectUserId, setActiveLockSelectUserId] = useState<string | null>(null);

  const isAuditorOnly = currentUser.level === 3;
  const isSupportOnly = currentUser.level === 2;

  // States for dynamic password-hashes viewing
  const [passwordHashes, setPasswordHashes] = useState<{ id: string; username: string; fullName: string; email: string; role: string; passwordHash: string }[]>([]);
  const [loadingHashes, setLoadingHashes] = useState(false);
  const [hashesError, setHashesError] = useState<string | null>(null);

  const [activeAdminSubTab, setActiveAdminSubTab] = useState<'users' | 'roles' | 'passwords'>(() => {
    return (localStorage.getItem('sentinel_admin_subtab') as any) || 'users';
  });

  useEffect(() => {
    localStorage.setItem('sentinel_admin_subtab', activeAdminSubTab);
  }, [activeAdminSubTab]);

  // Smart Silence logic for critical alerts
  const [isAlertSilenced, setIsAlertSilenced] = useState(() => 
    sessionStorage.getItem('sentinel_alert_silenced') === 'true'
  );
  const [previouslySeenBlockedIds, setPreviouslySeenBlockedIds] = useState<string[]>([]);

  // Custom roles state
  const [rolesList, setRolesList] = useState<CustomRole[]>([]);
  const [loadingRoles, setLoadingRoles] = useState(false);

  // New user creation state
  const [showCreateUser, setShowCreateUser] = useState(false);
  const [newUserForm, setNewUserForm] = useState({
    username: '',
    email: '',
    fullName: '',
    password: '',
    role: 'user' as UserRole
  });
  const [createUserError, setCreateUserError] = useState<string | null>(null);
  const [createUserSuccess, setCreateUserSuccess] = useState<string | null>(null);
  const [showNewUserPassword, setShowNewUserPassword] = useState(false);

  // Custom role creation/edit state
  const [showAddRole, setShowAddRole] = useState(false);
  const [newRoleForm, setNewRoleForm] = useState({
    name: '',
    key: '',
    description: '',
    privilegeLevel: 3
  });
  const [editingRoleId, setEditingRoleId] = useState<string | null>(null);
  const [editingRoleForm, setEditingRoleForm] = useState({
    name: '',
    key: '',
    description: '',
    privilegeLevel: 3
  });
  const [roleError, setRoleError] = useState<string | null>(null);
  const [roleSuccess, setRoleSuccess] = useState<string | null>(null);

  // Security dashboard stats state
  const [securityStats, setSecurityStats] = useState<{ 
    timeline: { timestamp: number; failures: number; blocks: number }[];
    criticalAlerts: { id: string; createdAt: string; target: string; type: string; status: string }[];
  } | null>(null);

  const [activeSessions, setActiveSessions] = useState<any[]>([]);

  // Fetch security statistics
  const fetchSecurityStats = async () => {
    try {
      const response = await fetch('/api/admin/security-stats');
      if (response.ok) {
        const data = await response.json();
        setSecurityStats(data);
      }
    } catch (e) {
      console.error("Error fetching security stats:", e);
    }
  };

  const fetchActiveSessions = async () => {
    try {
      const response = await fetch('/api/admin/active-sessions');
      if (response.ok) {
        const data = await response.json();
        setActiveSessions(data);
      }
    } catch (e) {
      console.error("Error fetching sessions:", e);
    }
  };

  // Fetch custom roles
  const fetchRoles = async () => {
    setLoadingRoles(true);
    try {
      const response = await fetch('/api/admin/roles');
      if (response.ok) {
        const data = await response.json();
        setRolesList(data);
      }
    } catch (e) {
      console.error("Error fetching custom roles:", e);
    } finally {
      setLoadingRoles(false);
    }
  };

  // Fetch cryptographic password hashes
  const fetchHashes = async () => {
    setLoadingHashes(true);
    setHashesError(null);
    try {
      const response = await fetch('/api/admin/password-hashes');
      if (response.ok) {
        const data = await response.json();
        setPasswordHashes(data);
      } else {
        setHashesError("No se pudieron cargar los registros criptográficos.");
      }
    } catch (e) {
      setHashesError("Error de red al consultar hashes.");
    } finally {
      setLoadingHashes(false);
    }
  };

  useEffect(() => {
    if (currentUser.level >= 4) {
      fetchRoles();
    }
    if (currentUser.level >= 2) {
      fetchSecurityStats();
    }
    if (currentUser.level >= 5) {
      fetchActiveSessions();
    }
    
    // Refresh stats every 30 seconds
    const interval = setInterval(() => {
      if (currentUser.level >= 2) fetchSecurityStats();
      if (currentUser.level >= 5) fetchActiveSessions();
    }, 30000);
    return () => clearInterval(interval);
  }, [currentUser]);

  // Monitor for NEW blocked users to break silence
  useEffect(() => {
    const currentlyLockedIds = users.filter(u => u.isLocked).map(u => u.id).sort();
    
    // Check if there is any ID in currentlyLockedIds that was NOT in previouslySeenBlockedIds
    const hasNewBlock = currentlyLockedIds.some(id => !previouslySeenBlockedIds.includes(id));
    
    if (hasNewBlock) {
      // New threat detected! Break silence
      setIsAlertSilenced(false);
      sessionStorage.removeItem('sentinel_alert_silenced');
    }
    
    setPreviouslySeenBlockedIds(currentlyLockedIds);
  }, [users]);

  useEffect(() => {
    if (activeAdminSubTab === 'passwords') {
      fetchHashes();
    }
  }, [activeAdminSubTab]);

  const handleCreateUser = async (e: React.FormEvent) => {
    e.preventDefault();
    setCreateUserError(null);
    setCreateUserSuccess(null);

    if (!newUserForm.username || !newUserForm.email || !newUserForm.fullName || !newUserForm.password) {
      setCreateUserError("Por favor completa todos los campos obligatorios.");
      return;
    }

    try {
      const response = await fetch('/api/admin/users', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(newUserForm)
      });
      const data = await response.json();
      if (response.ok) {
        setCreateUserSuccess(data.message || "Usuario dado de alta exitosamente.");
        onRefreshUsers(); // refresh the main user list
        onRefreshAudit(); // sync SIEM
        setNewUserForm({
          username: '',
          email: '',
          fullName: '',
          password: '',
          role: 'user' as UserRole
        });
        setTimeout(() => {
          setShowCreateUser(false);
          setCreateUserSuccess(null);
        }, 1500);
      } else {
        setCreateUserError(data.message || "No se pudo crear el usuario.");
      }
    } catch (err) {
      setCreateUserError("Error de comunicación de red.");
    }
  };

  const handleCreateRole = async (e: React.FormEvent) => {
    e.preventDefault();
    setRoleError(null);
    setRoleSuccess(null);

    if (!newRoleForm.name || !newRoleForm.key || !newRoleForm.description) {
      setRoleError("Todos los campos del rol son requeridos.");
      return;
    }

    try {
      const response = await fetch('/api/admin/roles', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(newRoleForm)
      });
      const data = await response.json();
      if (response.ok) {
        setRoleSuccess(data.message || "Rol creado de forma segura.");
        fetchRoles();
        onRefreshAudit();
        setNewRoleForm({ name: '', key: '', description: '', privilegeLevel: 3 });
        setTimeout(() => {
          setShowAddRole(false);
          setRoleSuccess(null);
        }, 1200);
      } else {
        setRoleError(data.message || "Fallo al crear rol.");
      }
    } catch (err) {
      setRoleError("No se pudo conectar con el servidor.");
    }
  };

  const handleRevokeSession = async (targetUserId: string) => {
    if (!window.confirm("¿Seguro que desea revocar esta sesión en tiempo real? El usuario será desconectado inmediatamente.")) return;
    
    try {
      const response = await fetch(`/api/admin/revoke-session/${targetUserId}`, {
        method: 'POST'
      });
      const data = await response.json();
      if (response.ok) {
        setRoleSuccess(data.message);
        fetchActiveSessions();
        setTimeout(() => setRoleSuccess(null), 3000);
      } else {
        setRoleError(data.message);
        setTimeout(() => setRoleError(null), 3000);
      }
    } catch (e) {
      setRoleError("Error de conexión al intentar revocar la sesión.");
    }
  };

  const handleUpdateRole = async (e: React.FormEvent, roleId: string) => {
    e.preventDefault();
    setRoleError(null);
    setRoleSuccess(null);

    try {
      const response = await fetch(`/api/admin/roles/${roleId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(editingRoleForm)
      });
      const data = await response.json();
      if (response.ok) {
        setEditingRoleId(null);
        fetchRoles();
        onRefreshAudit();
      } else {
        setRoleError(data.message);
      }
    } catch (err) {
      setRoleError("Fallo de comunicación.");
    }
  };

  const handleDeleteRole = async (roleId: string) => {
    if (!confirm("¿Está completamente seguro de eliminar esta jerarquía? Esto removerá la definición de rol y alertará al sistema SIEM.")) return;
    try {
      const response = await fetch(`/api/admin/roles/${roleId}`, {
        method: 'DELETE'
      });
      if (response.ok) {
        fetchRoles();
        onRefreshAudit();
      }
    } catch (err) {
      console.error(err);
    }
  };

  const hasFullAdminAccess = currentUser.level >= 5;
  const hasModeratorAccess = currentUser.level >= 4;

  const getFlagEmoji = (countryCode: string) => {
    if (countryCode === "LOC") return "🏠";
    const codePoints = countryCode
      .toUpperCase()
      .split("")
      .map(char => 127397 + char.charCodeAt(0));
    return String.fromCodePoint(...codePoints);
  };

  // Filters for user list
  const filteredUsers = (users as any[]).filter(user => {
    const matchesSearch = 
      user.username.toLowerCase().includes(searchTerm.toLowerCase()) ||
      user.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
      user.fullName.toLowerCase().includes(searchTerm.toLowerCase());
    
    if (roleFilter === 'all') return matchesSearch;
    return matchesSearch && user.role === roleFilter;
  });

  // Calculate dashboard data
  const roleDistribution = rolesList.map(role => ({
    name: role.name,
    value: users.filter(u => u.role === role.key).length,
    color: role.key === 'admin' ? '#ef4444' : role.key === 'moderator' ? '#3b82f6' : '#10b981'
  })).filter(d => d.value > 0);

  const recentBlocks = auditLogs.filter(log => 
    (log.action === 'ACCOUNT_LOCKED_LIMIT_REACHED' || log.action === 'BRUTE_FORCE_ATTEMPT_ADMIN') && 
    (new Date().getTime() - new Date(log.timestamp).getTime() < 24 * 60 * 60 * 1000)
  ).length;

  const failedLogins = auditLogs.filter(log => 
    log.action === 'LOGIN_FAILED_WRONG_PASSWORD' && 
    (new Date().getTime() - new Date(log.timestamp).getTime() < 24 * 60 * 60 * 1000)
  ).length;

  // Filters for audit log list
  const filteredLogs = auditLogs.filter(log => {
    const matchesSearch = 
      (log.username && log.username.toLowerCase().includes(logSearchTerm.toLowerCase())) ||
      (log.action && log.action.toLowerCase().includes(logSearchTerm.toLowerCase())) ||
      (log.details && log.details.toLowerCase().includes(logSearchTerm.toLowerCase())) ||
      log.ipAddress.includes(logSearchTerm);

    if (logFilter === 'all') return matchesSearch;
    if (logFilter === 'success') return matchesSearch && log.status === 'success';
    if (logFilter === 'failure') return matchesSearch && log.status === 'failure';
    if (logFilter === 'warn') return matchesSearch && log.status === 'warn';
    return matchesSearch;
  });

  // Locked users to display in security shield alerts
  const lockedUsers = users.filter(user => user.isLocked);

  // Administrative action handlers
  const handleToggleLock = async (userId: string, currentLockState: boolean) => {
    if (!hasModeratorAccess) return;
    setLoadingUserId(userId);
    try {
      const response = await fetch(`/api/admin/users/${userId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ isLocked: !currentLockState })
      });
      if (response.ok) {
        onRefreshUsers();
        onRefreshAudit();
        if (activeAdminSubTab === 'passwords') fetchHashes();
      }
    } catch (e) {
      console.error(e);
    } finally {
      setLoadingUserId(null);
      setActiveLockSelectUserId(null);
    }
  };

  const handleTimeLock = async (userId: string, durationMinutes: number | null) => {
    if (!hasModeratorAccess) return;
    setLoadingUserId(userId);
    let lockedUntil: string | null = null;
    if (durationMinutes !== null) {
      lockedUntil = new Date(Date.now() + durationMinutes * 60 * 1000).toISOString();
    }
    try {
      const response = await fetch(`/api/admin/users/${userId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          isLocked: true,
          lockedUntil: lockedUntil
        })
      });
      if (response.ok) {
        onRefreshUsers();
        onRefreshAudit();
        if (activeAdminSubTab === 'passwords') fetchHashes();
      }
    } catch (e) {
      console.error(e);
    } finally {
      setLoadingUserId(null);
      setActiveLockSelectUserId(null);
    }
  };

  const handleChangeRole = async (userId: string, newRole: UserRole) => {
    if (!hasFullAdminAccess) return;
    setLoadingUserId(userId);
    try {
      const response = await fetch(`/api/admin/users/${userId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ role: newRole })
      });
      if (response.ok) {
        onRefreshUsers();
        onRefreshAudit();
      }
    } catch (e) {
      console.error(e);
    } finally {
      setLoadingUserId(null);
    }
  };

  const handleResetAttempts = async (userId: string) => {
    if (!hasModeratorAccess) return;
    setLoadingUserId(userId);
    try {
      const response = await fetch(`/api/admin/users/${userId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ resetAttempts: true, isLocked: false })
      });
      if (response.ok) {
        onRefreshUsers();
        onRefreshAudit();
      }
    } catch (e) {
      console.error(e);
    } finally {
      setLoadingUserId(null);
    }
  };

  const handleDeleteUser = async (userId: string) => {
    if (!hasFullAdminAccess) return;
    if (userId === currentUser.id) {
      alert("No puedes autoeliminarte de la plataforma.");
      return;
    }
    if (!confirm("¿Está completamente seguro de dar de baja definitiva a este usuario?")) return;

    setLoadingUserId(userId);
    try {
      const response = await fetch(`/api/admin/users/${userId}`, {
        method: 'DELETE'
      });
      if (response.ok) {
        onRefreshUsers();
        onRefreshAudit();
      }
    } catch (e) {
      console.error(e);
    } finally {
      setLoadingUserId(null);
    }
  };

  return (
    <div className="space-y-8" id="admin-panel-container">
      {/* SECTION: BRUTE FORCE THREAT ALERT (glowing crimson banner if users locked and NOT silenced) */}
      {lockedUsers.length > 0 && !isAlertSilenced && (
        <div className="bg-red-950/20 border border-red-500/20 rounded-2xl p-6 flex flex-col md:flex-row items-start md:items-center justify-between gap-4 animate-slide-down shadow-lg shadow-red-500/5" id="brute-force-threat-alert">
          <div className="flex items-start gap-4">
            <div className="p-3 bg-red-500/10 text-red-400 border border-red-500/15 rounded-xl shrink-0">
              <ShieldAlert className="w-6 h-6 animate-pulse" />
            </div>
            <div>
              <h4 className="text-sm font-bold text-red-300 uppercase tracking-wide flex items-center gap-2">
                CUENTAS BLOQUEADAS DETECTADAS ({lockedUsers.length})
                <span className="h-2 w-2 rounded-full bg-red-500 animate-ping" />
              </h4>
              <p className="text-[11px] text-red-400/80 leading-relaxed mt-1 max-w-2xl">
                Trazas del SIEM detectaron actividad inusual de fuerza bruta. El sistema de defensa Shield Block ha congelado preventivamente las identidades comprometidas para mitigar riesgos de intrusión lateral.
              </p>
              <div className="mt-3 flex flex-wrap gap-2">
                {lockedUsers.slice(0, 3).map(lu => (
                  <span key={lu.id} className="inline-flex items-center gap-1.5 px-3 py-1 rounded-lg bg-red-500/10 text-red-300 border border-red-500/10 text-[10px] font-bold">
                    @{lu.username}
                  </span>
                ))}
                {lockedUsers.length > 3 && (
                  <span className="inline-flex items-center px-3 py-1 rounded-lg bg-slate-800/50 text-slate-400 border border-white/5 text-[10px] font-bold">
                    +{lockedUsers.length - 3} más
                  </span>
                )}
              </div>
            </div>
          </div>
          <button 
            onClick={() => {
              setIsAlertSilenced(true);
              sessionStorage.setItem('sentinel_alert_silenced', 'true');
            }} 
            className="px-4 py-2 bg-red-500/10 hover:bg-red-500/20 text-red-400 border border-red-500/20 rounded-lg text-xs font-bold font-mono transition-all uppercase whitespace-nowrap active:scale-97 cursor-pointer"
            id="btn-silence-threat"
          >
            Silenciar Alertas
          </button>
        </div>
      )}

      {/* SUB-TABS SELECTOR FOR CORE VIEWS */}
      <div className="flex border-b border-white/5 space-x-6 pb-2 overflow-x-auto no-scrollbar" id="admin-sub-tabs">
        {[5, 4, 2].includes(currentUser.level) && (
          <button
            onClick={() => setActiveAdminSubTab('users')}
            className={`pb-3 text-sm font-semibold relative transition-all cursor-pointer ${
              activeAdminSubTab === 'users' ? 'text-blue-450 text-white border-b-2 border-blue-500' : 'text-slate-400 hover:text-slate-200'
            }`}
            id="tab-btn-users"
          >
            <span className="flex items-center gap-2">
              <Users className="w-4 h-4 text-blue-400" /> Monitoreo y Usuarios
            </span>
          </button>
        )}

        {currentUser.level === 5 && (
          <button
            onClick={() => setActiveAdminSubTab('roles')}
            className={`pb-3 text-sm font-semibold relative transition-all cursor-pointer ${
              activeAdminSubTab === 'roles' ? 'text-blue-450 text-white border-b-2 border-blue-500' : 'text-slate-400 hover:text-slate-200'
            }`}
            id="tab-btn-roles"
          >
            <span className="flex items-center gap-2">
              <Shield className="w-4 h-4 text-blue-400" /> Roles y Jerarquías (CRUD)
            </span>
          </button>
        )}

        {currentUser.level === 5 && (
          <button
            onClick={() => setActiveAdminSubTab('passwords')}
            className={`pb-3 text-sm font-semibold relative transition-all cursor-pointer ${
              activeAdminSubTab === 'passwords' ? 'text-blue-450 text-white border-b-2 border-blue-500' : 'text-slate-400 hover:text-slate-200'
            }`}
            id="tab-btn-passwords"
          >
            <span className="flex items-center gap-2">
              <Key className="w-4 h-4 text-emerald-400 animate-pulse" /> Cripto-Auditoría (Probar Cifrado)
            </span>
          </button>
        )}
      </div>

      {/* VIEW: USERS & ACTIVE SECURITY LOGGER */}
      {activeAdminSubTab === 'users' ? (
        <div className="space-y-8 animate-fade-in" id="users-parent-view">
          
          {/* DASHBOARD DE SEGURIDAD */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6" id="security-dashboard-metrics">
            {/* Widget: Active Sessions Table (REPLACES ROLE CHART) */}
            <div className="bg-[#141414] rounded-2xl border border-white/5 p-5 shadow-sm overflow-hidden flex flex-col">
              <h4 className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-4 flex items-center gap-2">
                <Activity className="w-4 h-4 text-emerald-400" /> Perfiles Activos
              </h4>
              <div className="flex-1 overflow-y-auto no-scrollbar max-h-[180px]">
                {activeSessions.filter(s => s.userId !== currentUser.id).length > 0 ? (
                  <table className="w-full text-left text-[9px]">
                    <thead>
                      <tr className="text-slate-500 uppercase font-black border-b border-white/5">
                        <th className="pb-1.5">Usuario</th>
                        <th className="pb-1.5">Dispositivo / IP</th>
                        <th className="pb-1.5 text-right">Acción</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-white/5">
                      {activeSessions.filter(s => s.userId !== currentUser.id).map(session => (
                        <tr key={session.userId} className="group">
                          <td className="py-2">
                            <div className="flex items-center gap-1.5">
                              <img src={session.avatarUrl} className="w-5 h-5 rounded-full border border-white/10" alt="" />
                              <div className="leading-tight">
                                <p className="font-bold text-slate-200">@{session.username}</p>
                                <p className="text-[7px] text-slate-500">{new Date(session.startedAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', hour12: false })}</p>
                              </div>
                            </div>
                          </td>
                          <td className="py-2 text-slate-400">
                            <p className="truncate max-w-[80px]" title={session.browser}>{session.browser}</p>
                            <p className="text-[7px] font-mono">{session.ipAddress}</p>
                          </td>
                          <td className="py-2 text-right">
                            <button
                              onClick={() => handleRevokeSession(session.userId)}
                              className="p-1 px-1.5 bg-red-500/10 hover:bg-red-500 text-red-500 hover:text-white rounded border border-red-500/20 transition-all cursor-pointer"
                              title="Finalizar sesión remotamente"
                            >
                              <ShieldX className="w-2.5 h-2.5" />
                            </button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                ) : (
                  <div className="h-full flex flex-col items-center justify-center text-center p-4">
                    <Monitor className="w-8 h-8 text-slate-700 mb-2 opacity-50" />
                    <p className="text-[10px] text-slate-500 italic">No hay otros perfiles activos en este momento.</p>
                  </div>
                )}
              </div>
            </div>

            {/* Timeline: Security Incidents (REPLACES COUNTERS) */}
            <div className="lg:col-span-2 bg-[#141414] rounded-2xl border border-white/5 p-5 shadow-sm">
              <div className="flex items-center justify-between mb-4">
                <h4 className="text-xs font-bold text-slate-400 uppercase tracking-widest flex items-center gap-2">
                  <ShieldAlert className="w-4 h-4 text-rose-400" /> Timeline de Ataques (24h)
                </h4>
                <div className="flex items-center gap-4 text-[9px] uppercase font-bold tracking-tighter">
                  <span className="flex items-center gap-1.5 text-amber-500">
                    <span className="w-2 h-2 rounded-full bg-amber-500" /> Fallos de Login
                  </span>
                  <span className="flex items-center gap-1.5 text-rose-500">
                    <span className="w-2 h-2 rounded-full bg-rose-500" /> Bloqueos Efectuados
                  </span>
                </div>
              </div>
              
              <div className="h-[180px] w-full">
                {securityStats ? (
                  <ResponsiveContainer width="100%" height="100%">
                    <LineChart data={securityStats.timeline}>
                      <CartesianGrid strokeDasharray="3 3" stroke="#222" vertical={false} />
                      <XAxis 
                        dataKey="timestamp" 
                        stroke="#444" 
                        fontSize={9} 
                        tickLine={false} 
                        axisLine={false}
                        interval={3}
                        tickFormatter={(ts) => new Date(ts).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', hour12: false })}
                      />
                      <YAxis 
                        stroke="#444" 
                        fontSize={9} 
                        tickLine={false} 
                        axisLine={false}
                        width={25}
                      />
                      <Tooltip 
                        contentStyle={{ backgroundColor: '#0A0A0A', border: '1px solid #333', borderRadius: '8px', fontSize: '10px' }}
                        itemStyle={{ fontSize: '10px' }}
                        labelFormatter={(label) => new Date(label).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', hour12: false })}
                      />
                      <Line 
                        type="monotone" 
                        dataKey="failures" 
                        stroke="#f59e0b" 
                        strokeWidth={2} 
                        dot={false}
                        activeDot={{ r: 4 }}
                      />
                      <Line 
                        type="monotone" 
                        dataKey="blocks" 
                        stroke="#ef4444" 
                        strokeWidth={2} 
                        dot={false}
                        activeDot={{ r: 4 }}
                      />
                    </LineChart>
                  </ResponsiveContainer>
                ) : (
                  <div className="h-full flex items-center justify-center text-slate-600 text-[10px] animate-pulse">
                    Analizando trazas del SIEM...
                  </div>
                )}
              </div>
            </div>

            {/* Critical Alerts Table */}
            <div className="lg:col-span-3 bg-[#141414] rounded-2xl border border-white/5 p-5 shadow-sm">
                <h4 className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-4 flex items-center gap-2">
                  <AlertTriangle className="w-4 h-4 text-amber-500" /> Últimas Alertas Críticas (Real-Time)
                </h4>
                <div className="overflow-x-auto">
                  <table className="w-full text-left text-[10px]">
                    <thead>
                      <tr className="border-b border-white/5 text-slate-500 uppercase font-bold">
                        <th className="pb-2">Hora</th>
                        <th className="pb-2">Usuario / IP</th>
                        <th className="pb-2">Evento</th>
                        <th className="pb-2 text-right">Estado</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-white/5">
                      {securityStats?.criticalAlerts.length ? (
                        securityStats.criticalAlerts.map(alert => (
                          <tr key={alert.id} className="text-slate-300">
                            <td className="py-2.5 font-mono text-slate-500">
                              {new Date(alert.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', hour12: false })}
                            </td>
                            <td className="py-2.5">
                              <span className="bg-white/5 px-2 py-0.5 rounded-lg border border-white/5">
                                {alert.target}
                              </span>
                            </td>
                            <td className="py-2.5">
                              <span className={`font-bold ${alert.type === 'Fallo' ? 'text-amber-400' : 'text-rose-400'}`}>
                                {alert.type} de Seguridad
                              </span>
                            </td>
                            <td className="py-2.5 text-right">
                              <span className={`px-2 py-0.5 rounded-full text-[9px] font-black uppercase ${
                                alert.status === 'success' ? 'bg-emerald-500/10 text-emerald-400' : 
                                alert.status === 'warn' ? 'bg-rose-500/10 text-rose-400' : 
                                'bg-amber-500/10 text-amber-400'
                              }`}>
                                {alert.status}
                              </span>
                            </td>
                          </tr>
                        ))
                      ) : (
                        <tr>
                          <td colSpan={4} className="py-4 text-center text-slate-600">No hay alertas recientes en este ciclo.</td>
                        </tr>
                      )}
                    </tbody>
                  </table>
                </div>
            </div>
          </div>

          <div className={`grid grid-cols-1 gap-8 ${!isAuditorOnly && !isSupportOnly ? 'lg:grid-cols-3' : ''}`} id="users-parent-grid">
          
          {/* PANEL A: MASTER USERS CRUD */}
          {!isAuditorOnly && (
            <div className={`${!isSupportOnly ? 'lg:col-span-2' : 'col-span-1'} bg-[#141414] rounded-2xl border border-white/5 shadow-2xl space-y-6 p-6 md:p-8`} id="col-crud-users">
            
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between pb-4 border-b border-white/5 gap-4">
              <div>
                <h3 className="text-lg font-semibold text-white flex items-center gap-2">
                  <Users className="w-5 h-5 text-blue-400" />
                  Gestión de Usuarios y Accesos
                </h3>
                <p className="text-xs text-slate-400 mt-0.5">Control exhaustivo de perfiles, permisos y restricciones de seguridad.</p>
              </div>

              {/* Action buttons + search */}
              <div className="flex flex-wrap gap-2 items-center">
                {hasModeratorAccess && (
                  <button
                    onClick={() => setShowCreateUser(!showCreateUser)}
                    className="bg-blue-600 hover:bg-blue-500 text-white rounded-lg px-3 py-1.5 text-xs font-semibold flex items-center gap-1.5 transition-all cursor-pointer"
                    id="btn-admin-open-create-user"
                  >
                    <UserPlus className="w-3.5 h-3.5" />
                    Crear Usuario
                  </button>
                )}

                <div className="relative">
                  <Search className="absolute left-3 top-2.5 h-4 w-4 text-slate-400" />
                  <input
                    type="text"
                    placeholder="Buscar usuario..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="pl-9 pr-3 py-1.5 text-xs bg-[#0A0A0A] border border-white/5 rounded-lg text-slate-200 focus:outline-hidden focus:border-blue-500 w-[120px] md:w-[150px]"
                  />
                </div>

                <select
                  value={roleFilter}
                  onChange={(e) => setRoleFilter(e.target.value)}
                  className="py-1.5 px-2 bg-[#0A0A0A] border border-white/5 rounded-lg text-xs font-medium text-slate-300 focus:outline-hidden focus:border-blue-500"
                >
                  <option value="all">Filtro: Todos</option>
                  <option value="admin">Administrador</option>
                  <option value="moderator">Moderador</option>
                  <option value="user">Usuario Final</option>
                </select>
              </div>
            </div>

            {/* EXPANDABLE NEW USER FORM */}
            {showCreateUser && (
              <form onSubmit={handleCreateUser} className="bg-[#0A0A0A] border border-white/10 rounded-2xl p-5 space-y-4 animate-fade-in" id="admin-create-user-form">
                <div className="flex justify-between items-center pb-2 border-b border-white/5">
                  <h4 className="text-xs font-bold uppercase tracking-wider text-blue-400 flex items-center gap-1.5">
                    <UserPlus className="w-4 h-4 text-blue-400" /> Alta de Nuevo Usuario
                  </h4>
                  <span className="text-[10px] text-slate-500">Privilegios Administrativos</span>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="space-y-1">
                    <label className="text-[11px] font-bold text-slate-300 block">Nombre Completo</label>
                    <input
                      type="text"
                      placeholder="ej. Juan Pérez"
                      required
                      value={newUserForm.fullName}
                      onChange={(e) => setNewUserForm({ ...newUserForm, fullName: e.target.value })}
                      className="w-full p-2 text-xs rounded-xl border border-white/10 bg-[#141414] text-slate-200 focus:outline-hidden focus:border-blue-500"
                    />
                  </div>

                  <div className="space-y-1">
                    <label className="text-[11px] font-bold text-slate-300 block">Nombre de Usuario (@username)</label>
                    <input
                      type="text"
                      placeholder="ej. juan_perez"
                      required
                      value={newUserForm.username}
                      onChange={(e) => setNewUserForm({ ...newUserForm, username: e.target.value.toLowerCase().trim() })}
                      className="w-full p-2 text-xs rounded-xl border border-white/10 bg-[#141414] text-slate-200 focus:outline-hidden focus:border-blue-500"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="space-y-1">
                    <label className="text-[11px] font-bold text-slate-300 block">Correo Electrónico</label>
                    <input
                      type="email"
                      placeholder="ej. juan@gmail.com"
                      required
                      value={newUserForm.email}
                      onChange={(e) => setNewUserForm({ ...newUserForm, email: e.target.value })}
                      className="w-full p-2 text-xs rounded-xl border border-white/10 bg-[#141414] text-slate-200 focus:outline-hidden focus:border-blue-500"
                    />
                  </div>

                  <div className="space-y-1">
                    <label className="text-[11px] font-bold text-slate-300 block">Contraseña Inicial Segura</label>
                    <div className="relative">
                      <input
                        type={showNewUserPassword ? "text" : "password"}
                        placeholder="••••••••••••"
                        required
                        value={newUserForm.password}
                        onChange={(e) => setNewUserForm({ ...newUserForm, password: e.target.value })}
                        className="w-full pl-2 pr-10 py-2 text-xs rounded-xl border border-white/10 bg-[#141414] text-slate-200 focus:outline-hidden focus:border-blue-500"
                      />
                      <button
                        type="button"
                        onClick={() => setShowNewUserPassword(!showNewUserPassword)}
                        className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-white"
                      >
                        {showNewUserPassword ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
                      </button>
                    </div>
                  </div>
                </div>

                <div className="space-y-1">
                  <label className="text-[11px] font-bold text-slate-300 block">Rol y Atributo RBAC</label>
                  <select
                    value={newUserForm.role}
                    onChange={(e) => setNewUserForm({ ...newUserForm, role: e.target.value as UserRole })}
                    className="w-full p-2 text-xs rounded-xl border border-white/10 bg-[#141414] text-slate-200 focus:outline-hidden focus:border-blue-500"
                  >
                    {rolesList.map(r => (
                      <option key={r.id} value={r.key}>{r.name}</option>
                    ))}
                  </select>
                </div>

                {createUserError && (
                  <p className="text-xs text-red-400 font-bold">⚠️ Error: {createUserError}</p>
                )}
                {createUserSuccess && (
                  <p className="text-xs text-emerald-400 font-bold">✨ ¡Éxito! {createUserSuccess}</p>
                )}

                <div className="flex justify-end gap-2">
                  <button
                    type="button"
                    onClick={() => setShowCreateUser(false)}
                    className="px-3 py-1.5 bg-white/5 hover:bg-white/10 text-slate-300 text-xs rounded-lg transition-all"
                  >
                    Cancelar
                  </button>
                  <button
                    type="submit"
                    className="px-4 py-1.5 bg-blue-600 hover:bg-blue-500 text-white text-xs font-bold rounded-lg transition-all shadow-md active:scale-97 cursor-pointer"
                  >
                    Registrar Perfil Seguro
                  </button>
                </div>
              </form>
            )}

            <div className="w-full overflow-visible">
              <table className="hidden sm:table w-full text-left text-xs text-slate-400 border-collapse">
                <thead>
                  <tr className="border-b border-white/5 text-[10px] uppercase font-bold tracking-wider text-slate-500 bg-[#0F0F0F]">
                    <th className="py-3 px-4">Usuario</th>
                    <th className="py-3 px-4">Rol Asignado</th>
                    <th className="py-3 px-4">Estado Seguridad</th>
                    <th className="py-3 px-4">Sesión Navegador</th>
                    <th className="py-3 px-4 text-right">Acciones Administrativas</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-white/5" id="users-table-body">
                  {filteredUsers.length === 0 ? (
                    <tr>
                      <td colSpan={5} className="py-8 text-center text-slate-400">
                        No se encontraron usuarios con los criterios seleccionados.
                      </td>
                    </tr>
                  ) : (
                    filteredUsers.map((user) => (
                      <tr key={user.id} className="hover:bg-white/5 transition-all text-slate-300">
                        <td className="py-4 px-4 flex items-center gap-3">
                          <img 
                            src={user.avatarUrl || "https://api.dicebear.com/7.x/initials/svg?seed=?"} 
                            alt="Avatar" 
                            referrerPolicy="no-referrer"
                            className="w-8 h-8 rounded-full border border-white/10 shrink-0 object-cover" 
                          />
                          <div>
                            <div className="flex items-center gap-1.5">
                              <p className="font-semibold text-white">{user.fullName}</p>
                              {(user as any).authType === 'google' && (
                                <span className="p-0.5 bg-white/10 rounded-full text-blue-400" title="Cuenta Vinculada con Google Identity Platform">
                                  <Chrome className="w-3 h-3" />
                                </span>
                              )}
                              {(user as any).authType === 'local' && (
                                <span className="p-0.5 bg-white/10 rounded-full text-slate-400" title="Cuenta de Seguridad Local">
                                  <Key className="w-3 h-3" />
                                </span>
                              )}
                            </div>
                            <p className="text-[10px] text-slate-500 font-mono">@{user.username} | {user.email}</p>
                          </div>
                        </td>

                        <td className="py-4 px-4">
                          {hasFullAdminAccess && user.id !== currentUser.id ? (
                            <select
                              value={user.role}
                              onChange={(e) => handleChangeRole(user.id, e.target.value as UserRole)}
                              disabled={loadingUserId === user.id}
                              className="bg-[#0A0A0A] border border-white/5 rounded-md p-1 font-medium text-xs text-slate-300 focus:outline-hidden"
                              id={`select-role-${user.id}`}
                            >
                              {rolesList.map(r => (
                                <option key={r.id} value={r.key}>{r.name}</option>
                              ))}
                            </select>
                          ) : (
                            <span className="font-semibold text-slate-400 capitalize font-mono text-[11px]">
                              {rolesList.find(r => r.key === user.role)?.name || user.role}
                            </span>
                          )}
                        </td>

                        <td className="py-4 px-4">
                          <div className="flex flex-col gap-1">
                            {user.isLocked ? (
                              <div className="space-y-1">
                                <span className="inline-flex items-center gap-1 text-[10px] font-bold text-red-400 bg-red-400/10 border border-red-500/20 px-2 py-0.5 rounded-full w-fit">
                                  <ShieldX className="w-3 h-3" /> Bloqueado
                                </span>
                                {user.lockedUntil && (
                                  <span className="block text-[9px] text-pink-400 font-mono leading-tight" title={new Date(user.lockedUntil).toLocaleString()}>
                                    🔑 Temp: {new Date(user.lockedUntil).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', hour12: false })}
                                  </span>
                                )}
                              </div>
                            ) : (
                              <span className="inline-flex items-center gap-1 text-[10px] font-bold text-emerald-400 bg-emerald-400/10 border border-emerald-500/20 px-2 py-0.5 rounded-full w-fit">
                                <ShieldCheck className="w-3 h-3" /> Verificado
                              </span>
                            )}
                            {user.failedAttempts > 0 && (
                              <span className="text-[10px] text-amber-400 font-mono">
                                Fallos: {user.failedAttempts}
                              </span>
                            )}
                          </div>
                        </td>

                        <td className="py-4 px-4 font-mono text-[10px]">
                          {user.activeSessionId ? (
                            <div className="text-slate-300 space-y-0.5 bg-emerald-500/5 p-1.5 rounded-lg border border-emerald-500/10 w-fit">
                              <p className="flex items-center gap-1 font-semibold text-emerald-400">
                                <Globe className="w-3 h-3 text-emerald-400" /> ACTIVO
                              </p>
                              <p className="text-[9px] text-slate-400">{user.activeSessionBrowser}</p>
                              <p className="text-[9px] text-slate-500">IP: {user.activeSessionIp}</p>
                            </div>
                          ) : (
                            <span className="text-slate-500 italic">Desconectado</span>
                          )}
                        </td>

                        <td className="py-4 px-4 text-right">
                          <div className="flex items-center justify-end gap-1.5 flex-wrap">
                            {/* Revoke active session */}
                            {user.activeSessionId && hasModeratorAccess && user.id !== currentUser.id && (
                              <button
                                type="button"
                                onClick={() => handleRevokeSession(user.id)}
                                disabled={loadingUserId === user.id}
                                title="Cerrar sesión remotamente por seguridad"
                                className="p-1.5 bg-amber-500/10 hover:bg-amber-500/20 text-amber-400 rounded-lg transition-all font-semibold font-mono text-[10px] flex items-center gap-0.5 hover:shadow-xs active:scale-97 border border-amber-500/20 cursor-pointer"
                                id={`btn-revoke-session-${user.id}`}
                              >
                                <LogOut className="w-3 h-3" /> Revocar
                              </button>
                            )}

                            {/* Unlock count */}
                            {user.isLocked && hasModeratorAccess && user.id !== currentUser.id && (
                              <button
                                type="button"
                                onClick={() => handleResetAttempts(user.id)}
                                disabled={loadingUserId === user.id}
                                className="p-1.5 bg-blue-500/10 hover:bg-blue-500/20 text-blue-400 rounded-lg transition-all font-semibold font-mono text-[10px] flex items-center gap-0.5 border border-blue-500/20 cursor-pointer"
                                id={`btn-unlock-${user.id}`}
                              >
                                Desbloquear
                              </button>
                            )}

                            {/* Toggle locking */}
                            {hasModeratorAccess && user.id !== currentUser.id && (
                              <div className="relative inline-block text-left" id={`lock-selector-container-${user.id}`}>
                                <button
                                  type="button"
                                  onClick={() => {
                                    if (user.isLocked) {
                                      handleToggleLock(user.id, true);
                                    } else {
                                      setActiveLockSelectUserId(activeLockSelectUserId === user.id ? null : user.id);
                                    }
                                  }}
                                  disabled={loadingUserId === user.id || user.role === 'admin'}
                                  className={`p-1.5 rounded-lg border transition-all ${
                                    user.isLocked
                                      ? 'bg-rose-500/10 text-rose-450 border-rose-500/25 hover:bg-rose-550/25 shadow-xs'
                                      : 'bg-[#0A0A0A] text-slate-404 hover:text-white border-white/5 disabled:opacity-30 disabled:cursor-not-allowed'
                                  } cursor-pointer`}
                                  id={`btn-lock-toggle-${user.id}`}
                                  title={user.role === 'admin' ? "Los administradores tienen inmunidad contra bloqueos" : (user.isLocked ? "Desbloquear usuario inmediatamente" : "Establecer bloqueo por tiempo")}
                                >
                                  <ShieldX className="w-3.5 h-3.5" />
                                </button>

                                {activeLockSelectUserId === user.id && (
                                  <div className="absolute top-full right-0 mt-1.5 w-44 rounded-xl shadow-2xl bg-[#141414] border border-white/10 ring-1 ring-black ring-opacity-5 z-[100] overflow-hidden" id={`lock-time-dropdown-menu-${user.id}`}>
                                    <div className="py-1 text-left">
                                      <div className="px-3 py-1 font-extrabold text-[9px] text-slate-500 uppercase tracking-widest border-b border-white/5">
                                        Tiempo de Bloqueo
                                      </div>
                                      <button
                                        type="button"
                                        onClick={() => handleTimeLock(user.id, null)}
                                        className="block w-full text-left px-3 py-1.5 text-xs text-rose-450 hover:bg-white/5 font-semibold cursor-pointer"
                                      >
                                        Bloqueo Permanente
                                      </button>
                                      <button
                                        type="button"
                                        onClick={() => handleTimeLock(user.id, 1)}
                                        className="block w-full text-left px-3 py-1.5 text-xs text-slate-300 hover:bg-white/5 font-semibold cursor-pointer"
                                      >
                                        1 Minuto (Prueba)
                                      </button>
                                      <button
                                        type="button"
                                        onClick={() => handleTimeLock(user.id, 5)}
                                        className="block w-full text-left px-3 py-1.5 text-xs text-slate-300 hover:bg-white/5 cursor-pointer"
                                      >
                                        5 Minutos
                                      </button>
                                      <button
                                        type="button"
                                        onClick={() => handleTimeLock(user.id, 30)}
                                        className="block w-full text-left px-3 py-1.5 text-xs text-slate-300 hover:bg-white/5 cursor-pointer"
                                      >
                                        30 Minutos
                                      </button>
                                      <button
                                        type="button"
                                        onClick={() => handleTimeLock(user.id, 1440)}
                                        className="block w-full text-left px-3 py-1.5 text-xs text-slate-300 hover:bg-white/5 cursor-pointer"
                                      >
                                        24 Horas
                                      </button>
                                      <div className="border-t border-white/5 my-1" />
                                      <button
                                        type="button"
                                        onClick={() => setActiveLockSelectUserId(null)}
                                        className="block w-full text-center py-1 text-[10px] text-slate-500 hover:text-slate-300 font-bold cursor-pointer"
                                      >
                                        Cerrar menú
                                      </button>
                                    </div>
                                  </div>
                                )}
                              </div>
                            )}

                            {/* Delete account */}
                            {hasFullAdminAccess && (
                              <button
                                type="button"
                                onClick={() => handleDeleteUser(user.id)}
                                disabled={loadingUserId === user.id || user.id === currentUser.id}
                                className="p-1.5 bg-red-500/10 hover:bg-red-500/20 text-red-400 rounded-lg transition-all border border-red-500/20 cursor-pointer disabled:opacity-50"
                                id={`btn-delete-${user.id}`}
                                title="Dar de baja definitiva de la base de datos"
                              >
                                <Trash2 className="w-3.5 h-3.5" />
                              </button>
                            )}
                          </div>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>

              {/* MOBILE ONLY USER CARDS */}
              <div className="sm:hidden space-y-4" id="users-cards-mobile">
                {filteredUsers.length === 0 ? (
                  <div className="py-8 text-center text-slate-400 text-xs">
                    No se encontraron usuarios con los criterios seleccionados.
                  </div>
                ) : (
                  filteredUsers.map((user) => (
                    <div key={user.id} className="bg-[#0A0A0A]/80 border border-white/5 rounded-xl p-4 space-y-3">
                      <div className="flex items-center gap-3">
                        <img 
                          src={user.avatarUrl || "https://api.dicebear.com/7.x/initials/svg?seed=?"} 
                          alt="Avatar" 
                          referrerPolicy="no-referrer"
                          className="w-10 h-10 rounded-full border border-white/10 shrink-0 object-cover" 
                        />
                        <div className="grow min-w-0">
                          <p className="font-bold text-white text-xs truncate">{user.fullName}</p>
                          <p className="text-[10px] text-slate-500 font-mono truncate">@{user.username} | {user.email}</p>
                        </div>
                        <div className="shrink-0 text-right">
                          {user.isLocked ? (
                            <div className="flex flex-col items-end gap-0.5">
                              <span className="text-[9px] font-bold text-red-400 bg-red-400/10 border border-red-500/20 px-2 py-0.5 rounded-full inline-flex items-center gap-0.5">
                                <ShieldX className="w-2.5 h-2.5" /> Bloqueado
                              </span>
                              {user.lockedUntil && (
                                <span className="block text-[8px] text-pink-400 font-mono scale-90 origin-right">
                                  🔑 Temp: {new Date(user.lockedUntil).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                </span>
                              )}
                            </div>
                          ) : (
                            <span className="text-[9px] font-bold text-emerald-400 bg-emerald-400/10 border border-emerald-500/20 px-2 py-0.5 rounded-full inline-flex items-center gap-0.5">
                              <ShieldCheck className="w-2.5 h-2.5" /> Activo
                            </span>
                          )}
                        </div>
                      </div>

                      <div className="grid grid-cols-2 gap-2 text-[11px] bg-[#141414] p-2.5 rounded-lg border border-white/5 font-mono">
                        <div>
                          <span className="text-slate-500 block text-[9px] uppercase">Rol asignado:</span>
                          {hasFullAdminAccess ? (
                            <select
                              value={user.role}
                              onChange={(e) => handleChangeRole(user.id, e.target.value as UserRole)}
                              disabled={loadingUserId === user.id}
                              className="bg-[#0A0A0A] border border-white/5 rounded-md p-0.5 font-medium text-[10px] text-slate-300 focus:outline-hidden mt-0.5 w-full"
                            >
                              {rolesList.map(r => (
                                <option key={r.id} value={r.key}>{r.name}</option>
                              ))}
                            </select>
                          ) : (
                            <span className="font-bold text-slate-300 text-[10px] uppercase mt-0.5 block">
                              {rolesList.find(r => r.key === user.role)?.name || user.role}
                            </span>
                          )}
                        </div>
                        <div>
                          <span className="text-slate-500 block text-[9px] uppercase">Sesión:</span>
                          {user.activeSessionId ? (
                            <div className="mt-0.5">
                              <span className="text-emerald-400 font-bold text-[10px] flex items-center gap-0.5">
                                <span className="h-1.5 w-1.5 bg-emerald-500 rounded-full animate-pulse" /> ACTIVO
                              </span>
                              <span className="text-[8px] text-slate-500 block truncate leading-tight mt-0.5">
                                {user.activeSessionBrowser}
                                <br/>IP: {user.activeSessionIp}
                              </span>
                            </div>
                          ) : (
                            <span className="text-slate-500 italic text-[10px] mt-0.5 block">Desconectado</span>
                          )}
                        </div>
                      </div>

                      <div className="flex items-center justify-end gap-1.5 pt-1 border-t border-white/5">
                        {user.activeSessionId && hasModeratorAccess && user.id !== currentUser.id && (
                          <button
                            onClick={() => handleRevokeSession(user.id)}
                            disabled={loadingUserId === user.id}
                            className="px-2 py-1 bg-amber-500/10 hover:bg-amber-500/20 text-amber-400 rounded-lg text-[10px] font-bold font-mono border border-amber-500/20 flex items-center gap-0.5 cursor-pointer"
                          >
                            <LogOut className="w-3 h-3" /> Revocar
                          </button>
                        )}
                        
                        {user.isLocked && hasModeratorAccess && user.id !== currentUser.id && (
                          <button
                            onClick={() => handleResetAttempts(user.id)}
                            disabled={loadingUserId === user.id}
                            className="px-2 py-1 bg-blue-500/10 hover:bg-blue-500/20 text-blue-400 rounded-lg text-[10px] font-bold font-mono border border-blue-500/20 flex items-center gap-0.5 cursor-pointer"
                          >
                            Liberar
                          </button>
                        )}

                        {hasModeratorAccess && user.id !== currentUser.id && (
                          <div className="relative inline-block text-left" id={`lock-selector-mobile-container-${user.id}`}>
                            <button
                              onClick={() => {
                                if (user.isLocked) {
                                  handleToggleLock(user.id, true);
                                } else {
                                  setActiveLockSelectUserId(activeLockSelectUserId === user.id ? null : user.id);
                                }
                              }}
                              disabled={loadingUserId === user.id || user.role === 'admin'}
                              className={`p-1.5 rounded-lg border text-[10px] ${
                                user.isLocked
                                  ? 'bg-rose-500/10 text-rose-450 border border-rose-500/25'
                                  : 'bg-[#0A0A0A] text-slate-400 border border-white/5'
                              } cursor-pointer`}
                              title="Modificar bloqueo"
                            >
                              <ShieldX className="w-3.5 h-3.5" />
                            </button>

                            {activeLockSelectUserId === user.id && (
                              <div className="absolute right-0 bottom-full mb-1.5 w-40 rounded-xl shadow-2xl bg-[#141414] border border-white/10 ring-1 ring-black ring-opacity-5 z-50 overflow-hidden" id="lock-time-dropdown-mobile">
                                <div className="py-1 text-left">
                                  <div className="px-3 py-1 font-extrabold text-[8px] text-slate-500 uppercase tracking-widest border-b border-white/5">
                                    Bloqueo Temporal
                                  </div>
                                  <button
                                    type="button"
                                    onClick={() => handleTimeLock(user.id, null)}
                                    className="block w-full text-left px-3 py-1.5 text-xs text-rose-400 hover:bg-white/5 font-semibold cursor-pointer"
                                  >
                                    Permanente
                                  </button>
                                  <button
                                    type="button"
                                    onClick={() => handleTimeLock(user.id, 1)}
                                    className="block w-full text-left px-3 py-1.5 text-xs text-slate-300 hover:bg-white/5 font-semibold cursor-pointer"
                                  >
                                    1 Min (Test)
                                  </button>
                                  <button
                                    type="button"
                                    onClick={() => handleTimeLock(user.id, 5)}
                                    className="block w-full text-left px-3 py-1.5 text-xs text-slate-300 hover:bg-white/5 cursor-pointer"
                                  >
                                    5 Minutos
                                  </button>
                                  <button
                                    type="button"
                                    onClick={() => handleTimeLock(user.id, 30)}
                                    className="block w-full text-left px-3 py-1.5 text-xs text-slate-300 hover:bg-white/5 cursor-pointer"
                                  >
                                    30 Minutos
                                  </button>
                                  <button
                                    type="button"
                                    onClick={() => handleTimeLock(user.id, 1440)}
                                    className="block w-full text-left px-3 py-1.5 text-xs text-slate-300 hover:bg-white/5 cursor-pointer"
                                  >
                                    24 Horas
                                  </button>
                                  <div className="border-t border-white/5 my-1" />
                                  <button
                                    onClick={() => setActiveLockSelectUserId(null)}
                                    className="block w-full text-center py-1 text-[9px] text-slate-500 hover:text-slate-300 font-bold cursor-pointer"
                                  >
                                    Cerrar menú
                                  </button>
                                </div>
                              </div>
                            )}
                          </div>
                        )}

                        {hasFullAdminAccess && (
                          <button
                            onClick={() => handleDeleteUser(user.id)}
                            disabled={loadingUserId === user.id || user.id === currentUser.id}
                            className="p-1.5 bg-red-500/10 hover:bg-red-500/20 text-red-400 rounded-lg border border-red-500/20 cursor-pointer"
                            title="Eliminar usuario"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        )}
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>
            </div>
          )}

          {/* PANEL B: AUDIT LOGS SEARCH ENGINE */}
          {!isSupportOnly && (
            <div className={`bg-[#141414] rounded-2xl border border-white/5 shadow-2xl p-6 space-y-6 flex flex-col justify-between ${!isAuditorOnly ? 'lg:col-span-1' : 'col-span-1'}`} id="col-audit-logs">
              <div className="space-y-4">
              <div className="border-b border-white/5 pb-4">
                <h3 className="font-semibold text-white flex items-center gap-2">
                  <FileSliders className="w-4.5 h-4.5 text-blue-400" />
                  Auditoría y Traza de Seguridad
                </h3>
                <p className="text-[11px] text-slate-400 mt-0.5">Bitácora técnica e inmutable (SIEM) de operaciones en tiempo real.</p>
              </div>

              {/* Filter tools */}
              <div className="space-y-2">
                <div className="relative">
                  <Search className="absolute left-2.5 top-2.5 h-3.5 w-3.5 text-slate-500" />
                  <input
                    type="text"
                    placeholder="Buscar en traza o IP..."
                    value={logSearchTerm}
                    onChange={(e) => setLogSearchTerm(e.target.value)}
                    className="pl-8 pr-3 py-1.5 text-xs bg-[#0A0A0A] border border-white/5 rounded-lg text-slate-200 focus:outline-hidden focus:border-blue-500 w-full"
                  />
                </div>

                <div className="flex gap-1">
                  {(['all', 'success', 'failure', 'warn'] as const).map(f => (
                    <button
                      key={f}
                      onClick={() => setLogFilter(f)}
                      className={`px-2 py-1 rounded text-[10px] font-semibold border transition-all grow cursor-pointer ${
                        logFilter === f
                          ? 'bg-blue-600 text-white border-blue-650 shadow-md shadow-blue-550/15'
                          : 'bg-[#0A0A0A] text-slate-400 hover:text-white hover:bg-white/5 border-white/5'
                      }`}
                    >
                      {f === 'all' ? 'Todos' : f === 'success' ? 'Éxito' : f === 'failure' ? 'Fallos' : 'Aviso'}
                    </button>
                  ))}
                </div>
              </div>

              {/* Inmutable log viewer */}
              <div className="space-y-2.5 max-h-[445px] overflow-y-auto pr-1" id="audit-logs-scroll-container">
                {filteredLogs.length === 0 ? (
                  <div className="py-12 text-center text-slate-500 text-xs">
                    No hay registros de auditoría filtrados.
                  </div>
                ) : (
                  filteredLogs.map((log) => (
                    <div 
                      key={log.id} 
                      className={`p-3 rounded-xl border text-[11px] space-y-1.5 transition-all ${
                        log.status === 'failure' 
                          ? 'bg-red-950/20 border-red-500/15 text-slate-300' 
                          : log.status === 'warn'
                          ? 'bg-amber-950/15 border-amber-500/15 text-slate-300'
                          : 'bg-[#0A0A0A] border-white/5 text-slate-300'
                      }`}
                    >
                      <div className="flex justify-between items-start gap-1">
                        <span className="font-mono text-[10px] font-semibold text-slate-300 uppercase bg-[#141414] px-1.5 py-0.2 rounded border border-white/5">
                          {log.action.replace(/_/g, " ")}
                        </span>
                        <span className="text-[9px] text-slate-500 font-mono shrink-0 flex items-center gap-0.5">
                          <Clock className="w-2.5 h-2.5" />
                          {new Date(log.timestamp).toLocaleTimeString()}
                        </span>
                      </div>

                      <p className="text-slate-300 font-normal leading-relaxed text-[11px]">
                        {log.details}
                      </p>

                      <div className="flex justify-between items-center text-[9px] text-slate-500 font-mono border-t border-white/5 pt-1.5">
                        <span className="flex items-center gap-1.5">
                          <span className="uppercase text-[8px] font-bold">Ref:</span>
                          <strong className="text-blue-400 bg-blue-500/10 px-2 py-0.5 rounded-full border border-blue-500/20 text-[10px]">@{log.username}</strong>
                        </span>
                        {log.location && (
                          <span className="flex items-center gap-1 text-slate-300">
                             <span className="opacity-70">{log.location}</span>
                             {log.countryCode && <span className="scale-125 ml-0.5">{getFlagEmoji(log.countryCode)}</span>}
                          </span>
                        )}
                        <span className="flex items-center gap-0.5 px-2 py-0.5 rounded-full bg-white/5 border border-white/5">
                          <Globe className="w-2.5 h-2.5 text-slate-500" />
                          IP: {log.ipAddress}
                        </span>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>

            <button
              onClick={onRefreshAudit}
              className="w-full mt-4 py-2 bg-blue-600/10 hover:bg-blue-600/20 text-blue-400 text-xs font-semibold rounded-lg flex justify-center items-center gap-2 transition-all cursor-pointer"
            >
              <RefreshCw className="w-3.5 h-3.5" />
              Sincronizar Panel de Auditoría
            </button>
          </div>
          )}
        </div>
      </div>
      ) : activeAdminSubTab === 'roles' ? (
        /* VIEW: CONTRACT & ROLE CRED MANIFEST CRUDS (Roles y Jerarquías) */
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 animate-fade-in" id="roles-crud-container">
          
          <div className="lg:col-span-2 bg-[#141414] rounded-2xl border border-white/5 shadow-2xl p-6 md:p-8 space-y-6">
            
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between pb-4 border-b border-white/5 gap-4">
              <div>
                <h3 className="text-lg font-semibold text-white flex items-center gap-2">
                  <Award className="w-5 h-5 text-blue-400" />
                  Catálogo de Roles y Jerarquías (CRUD)
                </h3>
                <p className="text-xs text-slate-400 mt-0.5">Define privilegios personalizados y jerarquías dinámicas en el sistema Sentinel.</p>
              </div>
              {currentUser.level === 5 && (
                <button
                  onClick={() => setShowAddRole(!showAddRole)}
                  className="bg-blue-600 hover:bg-blue-500 text-white rounded-lg px-3 py-1.5 text-xs font-semibold flex items-center gap-1.5 transition-all cursor-pointer self-start sm:self-auto"
                  id="btn-admin-open-create-role"
                >
                  <PlusCircle className="w-3.5 h-3.5" />
                  Nuevo Rol
                </button>
              )}
            </div>

            {/* EXPANDABLE NEW ROLE FORM */}
            {showAddRole && currentUser.level === 5 && (
              <form onSubmit={handleCreateRole} className="bg-[#0A0A0A] border border-white/10 rounded-2xl p-5 space-y-4 animate-fade-in" id="admin-create-role-form">
                <h4 className="text-xs font-bold uppercase tracking-wider text-blue-400">Crear Nueva Definición de Rol</h4>
                
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="space-y-1">
                    <label className="text-[11px] font-bold text-slate-300 block">Nombre del Rol</label>
                    <input
                      type="text"
                      placeholder="ej. Auditor Externo"
                      required
                      value={newRoleForm.name}
                      onChange={(e) => setNewRoleForm({...newRoleForm, name: e.target.value})}
                      className="w-full p-2 text-xs rounded-xl border border-white/10 bg-[#141414] text-slate-200 focus:outline-hidden focus:border-blue-500"
                    />
                  </div>

                  <div className="space-y-1">
                    <label className="text-[11px] font-bold text-slate-300 block">Identificador del Atributo (Clave)</label>
                    <input
                      type="text"
                      placeholder="ej. auditor"
                      required
                      value={newRoleForm.key}
                      onChange={(e) => setNewRoleForm({...newRoleForm, key: e.target.value.toLowerCase().trim()})}
                      className="w-full p-2 text-xs rounded-xl border border-white/10 bg-[#141414] text-slate-200 focus:outline-hidden focus:border-blue-500"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="space-y-1">
                    <label className="text-[11px] font-bold text-slate-300 block">Nivel de Jerarquía (1-5)</label>
                    <select
                      value={newRoleForm.privilegeLevel}
                      onChange={(e) => setNewRoleForm({...newRoleForm, privilegeLevel: Number(e.target.value)})}
                      className="w-full p-2 text-xs rounded-xl border border-white/10 bg-[#141414] text-slate-200 focus:outline-hidden focus:border-blue-500"
                    >
                      <option value="1">Nivel 1 - Lectura Básica o Invitado</option>
                      <option value="2">Nivel 2 - Soporte Operativo Regular</option>
                      <option value="3">Nivel 3 - Auditoría de Trazas SIEM</option>
                      <option value="4">Nivel 4 - Administrador de Accesos local</option>
                      <option value="5">Nivel 5 - Root / SuperAdmin global</option>
                    </select>
                  </div>

                  <div className="space-y-1">
                    <label className="text-[11px] font-bold text-slate-300 block">Descripción del Privilegio</label>
                    <input
                      type="text"
                      placeholder="ej. Permite el monitoreo y reseteo preventivo."
                      required
                      value={newRoleForm.description}
                      onChange={(e) => setNewRoleForm({...newRoleForm, description: e.target.value})}
                      className="w-full p-2 text-xs rounded-xl border border-white/10 bg-[#141414] text-slate-200 focus:outline-hidden focus:border-blue-500"
                    />
                  </div>
                </div>

                {roleError && (
                  <p className="text-xs text-red-400 font-bold">⚠️ {roleError}</p>
                )}
                {roleSuccess && (
                  <p className="text-xs text-emerald-400 font-bold">✨ {roleSuccess}</p>
                )}

                <div className="flex justify-end gap-2">
                  <button
                    type="button"
                    onClick={() => setShowAddRole(false)}
                    className="px-3 py-1.5 bg-white/5 hover:bg-white/10 text-slate-300 text-xs rounded-lg transition-all"
                  >
                    Cancelar
                  </button>
                  <button
                    type="submit"
                    className="px-4 py-1.5 bg-blue-600 hover:bg-blue-500 text-white text-xs font-bold rounded-lg transition-all active:scale-97 cursor-pointer"
                  >
                    Guardar Jerarquía
                  </button>
                </div>
              </form>
            )}

            <div className="w-full overflow-visible">
              <table className="hidden sm:table w-full text-left text-xs text-slate-400 border-collapse">
                <thead>
                  <tr className="border-b border-white/5 text-[10px] uppercase font-bold tracking-wider text-slate-500 bg-[#0F0F0F]">
                    <th className="py-3 px-4">Definición de Rol / Clave</th>
                    <th className="py-3 px-4">Jerarquía de Seguridad</th>
                    <th className="py-3 px-4">Funciones y Alcances</th>
                    <th className="py-3 px-4 text-right">Mantenimiento</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-white/5">
                  {loadingRoles ? (
                    <tr>
                      <td colSpan={4} className="py-8 text-center text-slate-450">
                        Espere un momento, cargando catálogo operativo...
                      </td>
                    </tr>
                  ) : rolesList.length === 0 ? (
                    <tr>
                      <td colSpan={4} className="py-8 text-center text-slate-500">
                        No hay jerarquías dinámicas dadas de alta.
                      </td>
                    </tr>
                  ) : (
                    rolesList.map((role) => (
                      <tr key={role.id} className="hover:bg-white/5 transition-all text-slate-300">
                        <td className="py-4 px-4 font-semibold text-white">
                          <div>
                            <span className="text-slate-200 font-bold">{role.name}</span>
                            <p className="text-[10px] text-blue-400 font-mono">ID: {role.key}</p>
                          </div>
                        </td>

                        <td className="py-4 px-4">
                          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-lg bg-blue-500/10 text-blue-400 border border-blue-500/20 font-bold">
                            Nivel {role.privilegeLevel}
                          </span>
                        </td>

                        <td className="py-4 px-4">
                          {editingRoleId === role.id ? (
                            <div className="space-y-2">
                              <input
                                type="text"
                                value={editingRoleForm.name}
                                onChange={(e) => setEditingRoleForm({ ...editingRoleForm, name: e.target.value })}
                                className="w-full p-1.5 text-xs bg-[#0A0A0A] border border-white/10 rounded-lg text-slate-200"
                                placeholder="Nombre comercial"
                              />
                              <input
                                type="text"
                                value={editingRoleForm.description}
                                onChange={(e) => setEditingRoleForm({ ...editingRoleForm, description: e.target.value })}
                                className="w-full p-1.5 text-xs bg-[#0A0A0A] border border-white/10 rounded-lg text-slate-200"
                                placeholder="Descripción operativa"
                              />
                            </div>
                          ) : (
                            <div>
                              <p className="text-slate-300 leading-normal">{role.description}</p>
                              <p className="text-[9px] text-slate-500 mt-0.5">Creado: {new Date(role.createdAt).toLocaleDateString()}</p>
                            </div>
                          )}
                        </td>

                        <td className="py-4 px-4 text-right">
                          {editingRoleId === role.id ? (
                            <div className="flex gap-1 justify-end">
                              <button
                                onClick={(e) => handleUpdateRole(e, role.id)}
                                className="px-2.5 py-1.5 bg-emerald-600 hover:bg-emerald-500 text-white rounded-lg text-[10px] font-bold cursor-pointer"
                              >
                                Guardar
                              </button>
                              <button
                                onClick={() => setEditingRoleId(null)}
                                className="px-2.5 py-1.5 bg-white/10 hover:bg-white/15 text-slate-300 rounded-lg text-[10px] cursor-pointer"
                              >
                                Cancelar
                              </button>
                            </div>
                          ) : (
                            !(role.key === 'admin' || role.key === 'user' || role.id === 'role-admin' || role.id === 'role-user') && currentUser.level === 5 ? (
                              <div className="flex gap-1.5 justify-end">
                                <button
                                  onClick={() => {
                                    setEditingRoleId(role.id);
                                    setEditingRoleForm({
                                      name: role.name,
                                      key: role.key,
                                      description: role.description,
                                      privilegeLevel: role.privilegeLevel
                                    });
                                  }}
                                  className="p-1.5 bg-blue-500/10 hover:bg-blue-500/20 text-blue-400 border border-blue-500/10 rounded-lg cursor-pointer"
                                  title="Editar parámetros o descripción del rol"
                                >
                                  <Edit className="w-3.5 h-3.5" />
                                </button>
                                <button
                                  onClick={() => handleDeleteRole(role.id)}
                                  className="p-1.5 bg-red-500/10 hover:bg-red-500/20 text-red-400 border border-red-500/10 rounded-lg cursor-pointer"
                                  title="Eliminar jerarquía definitivamente"
                                >
                                  <Trash2 className="w-3.5 h-3.5" />
                                </button>
                              </div>
                            ) : (
                              <div className="flex justify-end">
                                <span className="text-[10px] font-bold text-slate-500 uppercase tracking-widest bg-white/5 px-3 py-1.5 rounded-lg border border-white/5">
                                  Protegido
                                </span>
                              </div>
                            )
                          )}
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>

              {/* MOBILE ONLY ROLES CARDS */}
              <div className="sm:hidden space-y-4" id="roles-cards-mobile">
                {loadingRoles ? (
                  <div className="py-8 text-center text-slate-400 text-xs">
                    Cargando catálogo operativo...
                  </div>
                ) : rolesList.length === 0 ? (
                  <div className="py-8 text-center text-slate-500 text-xs">
                    No hay jerarquías dinámicas dadas de alta.
                  </div>
                ) : (
                  rolesList.map((role) => (
                    <div key={role.id} className="bg-[#0A0A0A]/80 border border-white/5 rounded-xl p-4 space-y-3">
                      <div className="flex justify-between items-start gap-2">
                        <div>
                          <h4 className="font-bold text-white text-xs">{role.name}</h4>
                          <span className="text-[9px] text-blue-400 font-mono">Clave: {role.key}</span>
                        </div>
                        <span className="shrink-0 px-2.5 py-0.5 rounded bg-blue-500/10 text-blue-400 border border-blue-500/20 text-[10px] font-bold font-mono">
                          Nivel {role.privilegeLevel}
                        </span>
                      </div>

                      <div className="text-[11px] text-slate-300 leading-normal bg-[#141414] p-3 rounded-lg border border-white/5">
                        {editingRoleId === role.id ? (
                          <div className="space-y-2">
                            <input
                              type="text"
                              value={editingRoleForm.name}
                              onChange={(e) => setEditingRoleForm({ ...editingRoleForm, name: e.target.value })}
                              className="w-full p-2 text-xs bg-[#0A0A0A] border border-white/10 rounded-lg text-slate-200"
                              placeholder="Nombre comercial"
                            />
                            <input
                              type="text"
                              value={editingRoleForm.description}
                              onChange={(e) => setEditingRoleForm({ ...editingRoleForm, description: e.target.value })}
                              className="w-full p-2 text-xs bg-[#0A0A0A] border border-white/10 rounded-lg text-slate-200"
                              placeholder="Descripción operativa"
                            />
                          </div>
                        ) : (
                          <p>{role.description}</p>
                        )}
                      </div>

                      <div className="flex justify-between items-center text-[9px] text-slate-500 font-mono mt-1 border-t border-white/5 pt-2">
                        <span>Ref: {new Date(role.createdAt).toLocaleDateString()}</span>
                        
                        {editingRoleId === role.id ? (
                          <div className="flex gap-1">
                            <button
                              onClick={(e) => handleUpdateRole(e, role.id)}
                              className="px-2.5 py-1 bg-emerald-600 hover:bg-emerald-500 text-white rounded text-[10px] font-bold cursor-pointer"
                            >
                              Guardar
                            </button>
                            <button
                              onClick={() => setEditingRoleId(null)}
                              className="px-2.5 py-1 bg-white/10 hover:bg-white/15 text-slate-300 rounded text-[10px] cursor-pointer"
                            >
                              Cancelar
                            </button>
                          </div>
                        ) : (
                          <div className="flex gap-1.5">
                            {!(role.key === 'admin' || role.key === 'user' || role.id === 'role-admin' || role.id === 'role-user') && currentUser.level === 5 ? (
                              <>
                                <button
                                  onClick={() => {
                                    setEditingRoleId(role.id);
                                    setEditingRoleForm({
                                      name: role.name,
                                      key: role.key,
                                      description: role.description,
                                      privilegeLevel: role.privilegeLevel
                                    });
                                  }}
                                  className="p-1.5 bg-blue-500/10 hover:bg-blue-500/20 text-blue-400 border border-blue-500/10 rounded-lg cursor-pointer"
                                  title="Editar"
                                >
                                  <Edit className="w-3.5 h-3.5" />
                                </button>
                                <button
                                  onClick={() => handleDeleteRole(role.id)}
                                  className="p-1.5 bg-red-500/10 hover:bg-red-500/20 text-red-400 border border-red-500/10 rounded-lg cursor-pointer"
                                  title="Eliminar"
                                >
                                  <Trash2 className="w-3.5 h-3.5" />
                                </button>
                              </>
                            ) : (
                              <span className="text-[8px] font-bold text-slate-500 uppercase tracking-widest bg-white/5 px-2 py-1 rounded border border-white/5">
                                Protegido
                              </span>
                            )}
                          </div>
                        )}
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>

          </div>

          {/* PANEL REAL-TIME INFORMATION CARD */}
          <div className="bg-[#141414] rounded-2xl border border-white/5 shadow-2xl p-6 md:p-8 space-y-6 flex flex-col justify-between" id="roles-info-card">
            <div className="space-y-4">
              <h3 className="font-semibold text-white flex items-center gap-2 border-b border-white/5 pb-4">
                <Shield className="w-4.5 h-4.5 text-blue-400" />
                Políticas de Control de Acceso (RBAC)
              </h3>
              <div className="space-y-4 text-xs text-slate-400 leading-relaxed">
                <p>
                  Las políticas RBAC de Sentinel se rigen por el principio de <strong>Mínimo Privilegio</strong> y un estricto <strong>Control de Acceso Vertical</strong>. Esto garantiza que ningún usuario pueda modificar, revocar permisos o eliminar cuentas de una jerarquía superior a la suya, previniendo cualquier tipo de escalada de privilegios no autorizada.
                </p>
                <div className="p-3.5 bg-blue-500/5 rounded-xl border border-blue-500/10 space-y-2.5">
                  <p className="font-bold text-blue-300">Catálogo y Jerarquía de Niveles de Seguridad:</p>
                  <ul className="space-y-3 text-[10px] text-slate-400">
                    <li>
                      <strong className="text-white">Nivel 5 - SuperAdmin (Root Global):</strong> Máxima autoridad del sistema desplegado en la nube. Único perfil con autorización para crear, auditar y revocar accesos de los Administradores (Nivel 4) y gestionar configuraciones globales del entorno (ej. credenciales de integración OAuth de Google).
                    </li>
                    <li>
                      <strong className="text-white">Nivel 4 - Administrador de Accesos local:</strong> Gestión operativa del personal. Posee control total (CRUD) exclusivamente sobre los usuarios de Nivel 1, Nivel 2 y Nivel 3. <strong className="text-red-400">Restricción estricta:</strong> No puede visualizar, alterar permisos ni eliminar cuentas de Nivel 5 u otros de Nivel 4.
                    </li>
                    <li>
                      <strong className="text-white">Nivel 3 - Auditoría de Trazas SIEM:</strong> Perfil estrictamente analítico (solo lectura). Accede al registro de eventos y reportes de incidentes. Por su naturaleza de auditor, el sistema le bloquea automáticamente cualquier intento de modificar datos o revocar accesos a cualquier usuario.
                    </li>
                    <li>
                      <strong className="text-white">Nivel 2 - Soporte Operativo Regular:</strong> Acceso de mesa de ayuda. Autorizado para tareas de soporte básico (como reseteo preventivo de contraseñas encriptadas de cuentas estándar), sin privilegios sobre configuraciones de seguridad.
                    </li>
                    <li>
                      <strong className="text-white">Nivel 1 - Lectura Básica (Invitado):</strong> Interfaz restringida. Únicamente accede a su información de perfil y a pantallas genéricas del sistema, sin botones de acción.
                    </li>
                  </ul>
                </div>
                <div className="mt-4 p-3.5 bg-slate-800/30 rounded-xl border border-white/5 space-y-2">
                  <p className="font-bold text-amber-300">Motor de Inmutabilidad y Bloqueo Vertical:</p>
                  <p className="text-[11px] text-slate-400">
                    Cualquier alteración en los permisos genera una traza inmutable (<strong className="font-mono text-[10px]">CUSTOM_ROLE_CREATED</strong>, <strong className="font-mono text-[10px]">MODIFIED</strong> o <strong className="font-mono text-[10px]">DELETED</strong>). Adicionalmente, las reglas de validación en el backend bloquean cualquier petición fraudulenta donde un rol inferior intente vulnerar a un superior, devolviendo un error <strong>403 (Acceso Denegado)</strong>.
                  </p>
                </div>
              </div>
            </div>

            <button
              onClick={fetchRoles}
              className="w-full py-2 bg-blue-500/10 hover:bg-blue-500/15 text-blue-400 border border-blue-500/15 rounded-lg text-xs font-semibold flex items-center justify-center gap-1.5 transition-all active:scale-98 cursor-pointer mt-6"
            >
              <RefreshCw className="w-3.5 h-3.5" />
              Sincronizar Roles de Sistema
            </button>
          </div>

        </div>
      ) : activeAdminSubTab === 'passwords' && currentUser.level === 5 ? (
        <div className="space-y-6 animate-fade-in" id="passwords-parent-view">
          <div className="bg-[#141414] rounded-2xl border border-white/5 p-6 md:p-8 space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between pb-4 border-b border-white/5 gap-4 col-span-full">
              <div>
                <h3 className="text-base font-extrabold text-white uppercase tracking-wider flex items-center gap-2">
                  <Key className="w-5 h-5 text-emerald-400" /> Registro Criptográfico de Contraseñas
                </h3>
                <p className="text-xs text-slate-400 mt-1">
                  Verificación de almacenamiento "Zero-Knowledge" mediante algoritmos hash irreversibles de nivel bancario.
                </p>
              </div>
              <button
                onClick={fetchHashes}
                disabled={loadingHashes}
                className="self-start sm:self-center px-3.5 py-2 bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-400 border border-emerald-500/15 rounded-lg text-xs font-bold font-mono flex items-center gap-1.5 transition-all cursor-pointer active:scale-97"
              >
                <RefreshCw className={`w-3.5 h-3.5 ${loadingHashes ? 'animate-spin' : ''}`} /> Sincronizar Hashes
              </button>
            </div>

            <div className="p-4 bg-emerald-500/5 rounded-xl border border-emerald-500/10 text-xs text-slate-300 leading-normal space-y-2">
              <span className="font-extrabold text-emerald-400 uppercase tracking-widest text-[9px] font-mono px-2 py-0.5 rounded bg-emerald-500/15 border border-emerald-500/20">
                Garantía Inmutable de Cero Conocimiento (Zero-Knowledge Proof)
              </span>
              <p>
                Este visor demuestra con absoluta transparencia matemática cómo se almacenan las credenciales. Las contraseñas de los usuarios pasaron por una iteración del algoritmo de firma segura <strong>BCrypt con factor de costo 10</strong>.
              </p>
              <ul className="list-disc list-inside space-y-1 font-mono text-[10px] text-slate-400 pl-1">
                <li>El prefijo <code className="text-emerald-300 font-bold">$2a$</code> o <code className="text-emerald-300 font-bold">$2b$</code> indica la variante del algoritmo BCrypt segura.</li>
                <li>El factor <code className="text-emerald-400 font-bold">10</code> indica que el algoritmo procesó la contraseña <code className="text-emerald-400 font-bold">2^10 = 1024</code> veces con un valor aleatorio de sal ("Salt") para mitigar ataques de diccionario y colisiones.</li>
                <li>Ni la base de datos ni los administradores del sistema pueden recuperar, descifrar o deducir la contraseña original de estos hashes.</li>
              </ul>
            </div>

            {loadingHashes ? (
              <div className="py-12 text-center text-slate-400 text-xs text-center justify-center">
                Cargando hashes de seguridad del sistema de forma segura...
              </div>
            ) : hashesError ? (
              <div className="py-12 text-center text-red-400 text-xs font-mono">
                {hashesError}
              </div>
            ) : (
              <div className="overflow-x-auto rounded-xl border border-white/5">
                <table className="w-full text-left text-xs text-slate-400 border-collapse">
                  <thead>
                    <tr className="border-b border-white/5 text-[10px] uppercase font-bold tracking-wider text-slate-500 bg-[#0F0F0F]">
                      <th className="py-3 px-4">Usuario Relacionado</th>
                      <th className="py-3 px-4">Rol / Nivel</th>
                      <th className="py-3 px-4">Algoritmo</th>
                      <th className="py-3 px-4">Hash Cifrado (BCrypt Raw)</th>
                      <th className="py-3 px-3 text-center">Inversión</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-white/5">
                    {passwordHashes.map(u => (
                      <tr key={u.id} className="hover:bg-white/5 transition-all text-slate-300">
                        <td className="py-4 px-4 font-semibold text-white">
                          <p className="text-xs">{u.fullName}</p>
                          <p className="text-[10px] text-slate-500 font-mono">@{u.username} | {u.email}</p>
                        </td>
                        <td className="py-4 px-4 font-mono font-bold text-[10px] uppercase text-blue-400">
                          {u.role}
                        </td>
                        <td className="py-4 px-4 font-mono text-[10px] text-slate-400">
                          <code>BCRYPT_BLOWFISH</code>
                        </td>
                        <td className="py-4 px-4 font-mono text-[10px] select-all tracking-tight break-all">
                          <span className="inline-block text-emerald-400/90 bg-emerald-500/5 px-2.5 py-1.5 rounded-lg border border-emerald-500/10 font-bold select-all">
                            {u.passwordHash}
                          </span>
                        </td>
                        <td className="py-4 px-3 text-center">
                          <span className="inline-flex items-center gap-1 text-[9px] font-bold text-emerald-400 bg-emerald-400/5 border border-emerald-500/10 px-2 py-0.5 rounded-full uppercase tracking-wider">
                            <ShieldCheck className="w-3 h-3" /> Blindado
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>
      ) : null}
    </div>
  );
}
