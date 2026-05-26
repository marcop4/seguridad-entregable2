const fs = require('fs');
const oldContent = fs.readFileSync('AdminPanel.old.utf8.tsx', 'utf8').split('\n');

const extractFunc = (startLine, endLine) => oldContent.slice(startLine - 1, endLine).join('\n');

const handleUpdateRole = extractFunc(307, 329);
const hasFullAdminAccess = "  const hasFullAdminAccess = currentUser.level >= 5;";
const getFlagEmoji = extractFunc(349, 356);
const handleTimeLock = extractFunc(427, 454);
const handleChangeRole = extractFunc(456, 474);
const handleResetAttempts = extractFunc(476, 494);
const rolesListFetching = `
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
`;

// Inject into PanelGestorUsuarios
let users = fs.readFileSync('src/components/admin/PanelGestorUsuarios.tsx', 'utf8');
users = users.replace('const handleCreateUser =', rolesListFetching + '\n' + hasFullAdminAccess + '\n' + handleTimeLock + '\n' + handleChangeRole + '\n' + handleResetAttempts + '\n\n  const handleCreateUser =');
users = users.replace('const handleDeleteUser = async (userId: string, currentRole: string) => {', 'const handleDeleteUser = async (userId: string) => {\n    const currentRole = users.find(u => u.id === userId)?.role || "";');
fs.writeFileSync('src/components/admin/PanelGestorUsuarios.tsx', users);

// Inject into PanelRolesJerarquia
let roles = fs.readFileSync('src/components/admin/PanelRolesJerarquia.tsx', 'utf8');
roles = roles.replace('const handleDeleteRole = async', handleUpdateRole + '\n\n  const handleDeleteRole = async');
roles = roles.replace('const handleDeleteRole = async (roleId: string, roleKey: string) => {', 'const handleDeleteRole = async (roleId: string) => {\n    const roleKey = rolesList.find(r => r.id === roleId)?.key || "";');
fs.writeFileSync('src/components/admin/PanelRolesJerarquia.tsx', roles);

// Inject into PanelAuditoriaCifrado
let audit = fs.readFileSync('src/components/admin/PanelAuditoriaCifrado.tsx', 'utf8');
audit = audit.replace('const filteredLogs =', getFlagEmoji + '\n\n  const filteredLogs =');
fs.writeFileSync('src/components/admin/PanelAuditoriaCifrado.tsx', audit);

console.log("Functions injected!");
