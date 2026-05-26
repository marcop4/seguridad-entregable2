const fs = require('fs');
const content = fs.readFileSync('src/components/AdminPanel.tsx', 'utf8');

const usersStart = content.indexOf(`activeAdminSubTab === 'users' ? (`);
const rolesStart = content.indexOf(`) : activeAdminSubTab === 'roles' ? (`);
const auditStart = content.indexOf(`) : activeAdminSubTab === 'audit' ? (`);
const rootEnd = content.lastIndexOf(`: null}`);

console.log('usersStart:', usersStart);
console.log('rolesStart:', rolesStart);
console.log('auditStart:', auditStart);
console.log('rootEnd:', rootEnd);
