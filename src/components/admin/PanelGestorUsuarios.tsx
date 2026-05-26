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
import { User, AuditLog, UserRole, CustomRole } from '../../types';
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


const LockCountdown = ({ lockedUntil }: { lockedUntil: string }) => {
  const [timeLeft, setTimeLeft] = React.useState('');

  React.useEffect(() => {
    const updateCountdown = () => {
      const remainingMs = new Date(lockedUntil).getTime() - Date.now();
      if (remainingMs <= 0) {
        setTimeLeft('Expirado');
        return;
      }
      const h = Math.floor(remainingMs / 3600000);
      const m = Math.floor((remainingMs % 3600000) / 60000);
      const s = Math.floor((remainingMs % 60000) / 1000);
      let timeStr = '';
      if (h > 0) timeStr += `${h}h `;
      if (m > 0 || h > 0) timeStr += `${m}m `;
      timeStr += `${s}s`;
      setTimeLeft(timeStr);
    };

    updateCountdown();
    const interval = setInterval(updateCountdown, 1000);
    return () => clearInterval(interval);
  }, [lockedUntil]);

  return (
    <span className="block text-[9px] text-pink-400 font-mono leading-tight mt-1 bg-pink-500/10 border border-pink-500/20 px-1.5 py-0.5 rounded w-fit">
      Vence: {new Date(lockedUntil).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})} <br/>
      ⏳ Faltan: {timeLeft}
    </span>
  );
};

export default function PanelGestorUsuarios({
  currentUser,
  users,
  onRefreshUsers,
  onRefreshAudit
}: AdminPanelProps) {
  // --- STATES FOR USERS ---
  const [searchTerm, setSearchTerm] = useState('');
  const [roleFilter, setRoleFilter] = useState<string>('all');
  const [loadingUserId, setLoadingUserId] = useState<string | null>(null);
  const [activeLockSelectUserId, setActiveLockSelectUserId] = useState<string | null>(null);

  const [activeSessions, setActiveSessions] = useState<any[]>([]);
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

  const isAuditorOnly = currentUser.level === 3;
  const isSupportOnly = currentUser.level === 2;
  const hasModeratorAccess = currentUser.level >= 4;

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

  useEffect(() => {
    fetchActiveSessions();
    const interval = setInterval(() => {
      fetchActiveSessions();
    }, 30000);
    return () => clearInterval(interval);
  }, []);

  
  const [rolesList, setRolesList] = useState<CustomRole[]>([]);
  const fetchRoles = async () => {
    try {
      const response = await fetch('/api/admin/roles');
      if (response.ok) {
        const data = await response.json();
        setRolesList(data);
      }
    } catch (e) {
      console.error(e);
    }
  };
  useEffect(() => {
    fetchRoles();
  }, []);

  const hasFullAdminAccess = currentUser.level >= 5;
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
        onRefreshUsers(); 
        onRefreshAudit(); 
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

  const handleRevokeSession = async (targetUserId: string) => {
    if (!window.confirm("¿Seguro que desea revocar esta sesión en tiempo real? El usuario será desconectado inmediatamente.")) return;
    try {
      const response = await fetch(`/api/admin/revoke-session/${targetUserId}`, {
        method: 'POST'
      });
      if (response.ok) {
        fetchActiveSessions();
        onRefreshAudit();
      }
    } catch (err) {
      console.error("Error al revocar sesión", err);
    }
  };

  const handleDeleteUser = async (userId: string) => {
    const currentRole = users.find(u => u.id === userId)?.role || "";
    if (currentRole === 'admin') {
      alert("No se puede eliminar un perfil SuperAdmin (Nivel 5) desde la interfaz.");
      return;
    }
    if (!window.confirm("CRÍTICO: ¿Estás seguro de eliminar PERMANENTEMENTE a este usuario?")) return;
    
    setLoadingUserId(userId);
    try {
      const response = await fetch(`/api/admin/users/${userId}`, { method: 'DELETE' });
      if (response.ok) {
        onRefreshUsers();
        onRefreshAudit();
      } else {
        alert("Fallo al eliminar.");
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoadingUserId(null);
    }
  };

  const handleToggleLock = async (userId: string, currentLockState: boolean, hours: number = 0) => {
    if (!currentLockState && hours === 0) return;
    
    setLoadingUserId(userId);
    setActiveLockSelectUserId(null);
    try {
      const response = await fetch(`/api/admin/users/${userId}/lock`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ locked: !currentLockState, hours })
      });
      if (response.ok) {
        onRefreshUsers();
        onRefreshAudit();
        if (!currentLockState) fetchActiveSessions();
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoadingUserId(null);
    }
  };

  const filteredUsers = users.filter(user => {
    const matchesSearch = user.username.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         user.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         user.fullName.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesRole = roleFilter === 'all' || user.role === roleFilter;
    return matchesSearch && matchesRole;
  });

  return (
<div className="space-y-8 animate-fade-in" id="users-parent-view">
          
          {/* DASHBOARD DE SEGURIDAD */}
          <div className="grid grid-cols-1 gap-6" id="security-dashboard-metrics">
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
                            {hasModeratorAccess && (currentUser.level > session.level || currentUser.level >= 5) && (
                              <button
                                onClick={() => handleRevokeSession(session.userId)}
                                className="p-1 px-1.5 bg-red-500/10 hover:bg-red-500 text-red-500 hover:text-white rounded border border-red-500/20 transition-all cursor-pointer"
                                title="Finalizar sesión remotamente"
                              >
                                <ShieldX className="w-2.5 h-2.5" />
                              </button>
                            )}
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


          </div>

          <div className="grid grid-cols-1 gap-8" id="users-parent-grid">
          
          {/* PANEL A: MASTER USERS CRUD */}
          {!isAuditorOnly && (
            <div className="col-span-1 bg-[#141414] rounded-2xl border border-white/5 shadow-2xl space-y-6 p-6 md:p-8" id="col-crud-users">
            
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
                                {user.lockedUntil && <LockCountdown lockedUntil={user.lockedUntil} />}
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
                                  <>
                                    <div className="fixed inset-0 z-[90]" onClick={(e) => { e.stopPropagation(); setActiveLockSelectUserId(null); }} />
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
                                  </>
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
                              {user.lockedUntil && <LockCountdown lockedUntil={user.lockedUntil} />}
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
                              <>
                                <div className="fixed inset-0 z-[40]" onClick={(e) => { e.stopPropagation(); setActiveLockSelectUserId(null); }} />
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
                              </>
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

          
        </div>
      </div>
  );
}
