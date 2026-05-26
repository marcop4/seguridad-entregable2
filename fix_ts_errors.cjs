const fs = require('fs');

const fixTypesImport = (content) => content.replace("from '../types';", "from '../../types';");

// 1. PanelGestorUsuarios
let gestor = fs.readFileSync('src/components/admin/PanelGestorUsuarios.tsx', 'utf8');
gestor = fixTypesImport(gestor);
gestor = gestor.replace(/if \(activeAdminSubTab === 'passwords'\) fetchHashes\(\);/g, '');
fs.writeFileSync('src/components/admin/PanelGestorUsuarios.tsx', gestor);

// 2. PanelRolesJerarquia
let roles = fs.readFileSync('src/components/admin/PanelRolesJerarquia.tsx', 'utf8');
roles = fixTypesImport(roles);
fs.writeFileSync('src/components/admin/PanelRolesJerarquia.tsx', roles);

// 3. PanelAuditoriaCifrado
let audit = fs.readFileSync('src/components/admin/PanelAuditoriaCifrado.tsx', 'utf8');
audit = fixTypesImport(audit);
audit = audit.replace('users\n}: AdminPanelProps)', 'users,\n  onRefreshAudit\n}: AdminPanelProps)');
fs.writeFileSync('src/components/admin/PanelAuditoriaCifrado.tsx', audit);

// 4. AdminPanel
let admin = fs.readFileSync('src/components/AdminPanel.tsx', 'utf8');
// make sure onRefreshAudit is passed to PanelAuditoriaCifrado
if (!admin.includes('onRefreshAudit={onRefreshAudit}')) {
    admin = admin.replace('<PanelAuditoriaCifrado currentUser={currentUser} auditLogs={auditLogs} users={users} />', '<PanelAuditoriaCifrado currentUser={currentUser} auditLogs={auditLogs} users={users} onRefreshAudit={onRefreshAudit} />');
    fs.writeFileSync('src/components/AdminPanel.tsx', admin);
}

console.log("TS errors fixed!");
