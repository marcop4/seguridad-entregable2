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

export default function PanelRolesJerarquia({
  currentUser,
  onRefreshAudit
}: AdminPanelProps) {
  const [rolesList, setRolesList] = useState<CustomRole[]>([]);
  const [loadingRoles, setLoadingRoles] = useState(false);
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

  useEffect(() => {
    fetchRoles();
  }, []);

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

  const handleEditRole = async (roleId: string, e: React.FormEvent) => {
    e.preventDefault();
    if (!editingRoleForm.name || !editingRoleForm.description) {
      alert("Nombre y descripcin son requeridos");
      return;
    }
    
    try {
      const response = await fetch(`/api/admin/roles/${roleId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(editingRoleForm)
      });
      if (response.ok) {
        fetchRoles();
        onRefreshAudit();
        setEditingRoleId(null);
      } else {
        const data = await response.json();
        alert(data.message || "Fallo al actualizar rol");
      }
    } catch (err) {
      console.error(err);
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
      setRoleError("Fallo de comunicaci├│n.");
    }
  };

  const handleDeleteRole = async (roleId: string) => {
    const roleKey = rolesList.find(r => r.id === roleId)?.key || "";
    if (['admin','moderator','user','auditor'].includes(roleKey)) {
      alert("Roles del sistema core están protegidos contra borrado.");
      return;
    }
    if (!window.confirm("Eliminar definitivamente este rol personalizado?")) return;
    
    try {
      const response = await fetch(`/api/admin/roles/${roleId}`, { method: 'DELETE' });
      if (response.ok) {
        fetchRoles();
        onRefreshAudit();
      }
    } catch (err) {
      console.error(err);
    }
  };

  return (
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
                            !(role.key === 'superadmin' || role.key === 'admin' || role.key === 'user' || role.id === 'role-superadmin' || role.id === 'role-admin' || role.id === 'role-user') && currentUser.level === 5 ? (
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
                            {!(role.key === 'superadmin' || role.key === 'admin' || role.key === 'user' || role.id === 'role-superadmin' || role.id === 'role-admin' || role.id === 'role-user') && currentUser.level === 5 ? (
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
      
  );
}