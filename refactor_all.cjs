const fs = require('fs');

const content = fs.readFileSync('src/components/AdminPanel.tsx', 'utf8');

const imports = content.slice(0, content.indexOf('interface AdminPanelProps'));

const usersStart = content.indexOf(`activeAdminSubTab === 'users' ? (`);
const rolesStart = content.indexOf(`) : activeAdminSubTab === 'roles' ? (`);
const auditStart = content.indexOf(`) : activeAdminSubTab === 'audit' ? (`);
const rootEnd = content.lastIndexOf(`: null}`);

let usersJSX = content.slice(usersStart + `activeAdminSubTab === 'users' ? (`.length, rolesStart).trim();
let rolesJSX = content.slice(rolesStart + `) : activeAdminSubTab === 'roles' ? (`.length, auditStart).trim();
let auditJSX = content.slice(auditStart + `) : activeAdminSubTab === 'audit' ? (`.length, rootEnd).trim();

// The goal is not to write perfect state variables parsing, but to extract the UI parts correctly
// I will create the new AdminPanel.tsx first
const newAdminPanel = `import React, { useState, useEffect } from 'react';
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
    return (localStorage.getItem('sentinel_admin_subtab') as any) || (currentUser.level === 3 ? 'audit' : 'users');
  });

  useEffect(() => {
    localStorage.setItem('sentinel_admin_subtab', activeTab);
  }, [activeTab]);

  const isSuperAdmin = currentUser.level === 5;
  const isModerador = currentUser.level === 4;
  const isAuditor = currentUser.level === 3;

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex items-center gap-6 border-b border-white/10 mb-6">
        {(isSuperAdmin || isModerador) && (
          <button
            onClick={() => setActiveTab('users')}
            className={\`pb-3 text-sm font-semibold transition-all \${
              activeTab === 'users' ? 'text-blue-400 border-b-2 border-blue-500' : 'text-slate-400 hover:text-slate-200'
            }\`}
          >
            <Users className="w-4 h-4 inline mr-2" />
            Monitoreo y Usuarios
          </button>
        )}
        {isSuperAdmin && (
          <button
            onClick={() => setActiveTab('roles')}
            className={\`pb-3 text-sm font-semibold transition-all \${
              activeTab === 'roles' ? 'text-blue-400 border-b-2 border-blue-500' : 'text-slate-400 hover:text-slate-200'
            }\`}
          >
            <FileSliders className="w-4 h-4 inline mr-2" />
            Roles y Jerarquías (CRUD)
          </button>
        )}
        {(isSuperAdmin || isAuditor) && (
          <button
            onClick={() => setActiveTab('audit')}
            className={\`pb-3 text-sm font-semibold transition-all \${
              activeTab === 'audit' ? 'text-blue-400 border-b-2 border-blue-500' : 'text-slate-400 hover:text-slate-200'
            }\`}
          >
            <ShieldAlert className="w-4 h-4 inline mr-2" />
            Auditoría y Cifrado
          </button>
        )}
      </div>

      <div className="mt-6">
        {activeTab === 'users' && (isSuperAdmin || isModerador) && (
          <PanelGestorUsuarios {...props} />
        )}
        {activeTab === 'roles' && isSuperAdmin && (
          <PanelRolesJerarquia {...props} />
        )}
        {activeTab === 'audit' && (isSuperAdmin || isAuditor) && (
          <PanelAuditoriaCifrado {...props} />
        )}
        {activeTab === 'roles' && !isSuperAdmin && (
          <div className="p-4 bg-red-500/10 text-red-500 rounded border border-red-500/20">
            Acceso Denegado. Privilegios Insuficientes (Nivel 5 requerido).
          </div>
        )}
      </div>
    </div>
  );
}
`;

fs.writeFileSync('src/components/AdminPanel.tsx', newAdminPanel);


const gestorUsuariosTop = imports + `
interface AdminPanelProps {
  currentUser: Omit<User, 'passwordHash' | 'recoveryToken'>;
  auditLogs: AuditLog[];
  onRefreshAudit: () => void;
  onRefreshUsers: () => void;
  users: Omit<User, 'passwordHash' | 'recoveryToken'>[];
  notifications: any[];
  onClearNotifications: () => void;
}

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
      const response = await fetch(\`/api/admin/revoke-session/\${targetUserId}\`, {
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

  const handleDeleteUser = async (userId: string, currentRole: string) => {
    if (currentRole === 'admin') {
      alert("No se puede eliminar un perfil SuperAdmin (Nivel 5) desde la interfaz.");
      return;
    }
    if (!window.confirm("CRÍTICO: ¿Estás seguro de eliminar PERMANENTEMENTE a este usuario?")) return;
    
    setLoadingUserId(userId);
    try {
      const response = await fetch(\`/api/admin/users/\${userId}\`, { method: 'DELETE' });
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
      const response = await fetch(\`/api/admin/users/\${userId}/lock\`, {
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
`;
const gestorUsuariosBottom = `
  );
}
`;
fs.writeFileSync('src/components/admin/PanelGestorUsuarios.tsx', gestorUsuariosTop + usersJSX + gestorUsuariosBottom);

const rolesJerarquiaTop = imports + `
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
      const response = await fetch(\`/api/admin/roles/\${roleId}\`, {
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

  const handleDeleteRole = async (roleId: string, roleKey: string) => {
    if (['admin','moderator','user','auditor'].includes(roleKey)) {
      alert("Roles del sistema core están protegidos contra borrado.");
      return;
    }
    if (!window.confirm("Eliminar definitivamente este rol personalizado?")) return;
    
    try {
      const response = await fetch(\`/api/admin/roles/\${roleId}\`, { method: 'DELETE' });
      if (response.ok) {
        fetchRoles();
        onRefreshAudit();
      }
    } catch (err) {
      console.error(err);
    }
  };

  return (
`;
const rolesJerarquiaBottom = `
  );
}
`;
fs.writeFileSync('src/components/admin/PanelRolesJerarquia.tsx', rolesJerarquiaTop + rolesJSX + rolesJerarquiaBottom);

const auditoriaCifradoTop = imports + `
interface AdminPanelProps {
  currentUser: Omit<User, 'passwordHash' | 'recoveryToken'>;
  auditLogs: AuditLog[];
  onRefreshAudit: () => void;
  onRefreshUsers: () => void;
  users: Omit<User, 'passwordHash' | 'recoveryToken'>[];
  notifications: any[];
  onClearNotifications: () => void;
}

export default function PanelAuditoriaCifrado({
  currentUser,
  auditLogs,
  users
}: AdminPanelProps) {
  const [securityStats, setSecurityStats] = useState<{ 
    timeline: { timestamp: number; failures: number; blocks: number }[];
    criticalAlerts: { id: string; createdAt: string; target: string; type: string; status: string }[];
  } | null>(null);

  const [passwordHashes, setPasswordHashes] = useState<{ id: string; username: string; fullName: string; email: string; role: string; passwordHash: string }[]>([]);
  const [loadingHashes, setLoadingHashes] = useState(false);
  const [hashesError, setHashesError] = useState<string | null>(null);
  const [logSearchTerm, setLogSearchTerm] = useState('');
  const [logFilter, setLogFilter] = useState<string>('all');
  const [isAlertSilenced, setIsAlertSilenced] = useState(() => 
    sessionStorage.getItem('sentinel_alert_silenced') === 'true'
  );
  const [previouslySeenBlockedIds, setPreviouslySeenBlockedIds] = useState<string[]>([]);

  const isSupportOnly = currentUser.level === 2;
  const isAuditorOnly = currentUser.level === 3;

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
    fetchSecurityStats();
    fetchHashes();
    const interval = setInterval(() => {
      fetchSecurityStats();
    }, 30000);
    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    const currentlyLockedIds = users.filter(u => u.isLocked).map(u => u.id).sort();
    const hasNewBlock = currentlyLockedIds.some(id => !previouslySeenBlockedIds.includes(id));
    if (hasNewBlock) {
      setIsAlertSilenced(false);
      sessionStorage.removeItem('sentinel_alert_silenced');
    }
    setPreviouslySeenBlockedIds(currentlyLockedIds);
  }, [users]);

  const filteredLogs = auditLogs.filter(log => {
    const matchesSearch = log.username?.toLowerCase().includes(logSearchTerm.toLowerCase()) ||
                         log.ipAddress?.includes(logSearchTerm) ||
                         log.action.toLowerCase().includes(logSearchTerm.toLowerCase()) ||
                         log.details?.toLowerCase().includes(logSearchTerm.toLowerCase());
    const matchesFilter = logFilter === 'all' || log.status === logFilter;
    return matchesSearch && matchesFilter;
  });

  return (
`;
const auditoriaCifradoBottom = `
  );
}
`;
fs.writeFileSync('src/components/admin/PanelAuditoriaCifrado.tsx', auditoriaCifradoTop + auditJSX + auditoriaCifradoBottom);

console.log("Refactoring successful!");
