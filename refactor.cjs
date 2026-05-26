const fs = require('fs');

let code = fs.readFileSync('src/components/AdminPanel.tsx', 'utf8');

// 1. Update sub-tabs definitions
code = code.replace(
  /\{\/\* SUB-TABS SELECTOR FOR CORE VIEWS \*\/\}[\s\S]*?(?=\{\/\* VIEW: USERS & ACTIVE SECURITY LOGGER \*\/)/,
  `{/* SUB-TABS SELECTOR FOR CORE VIEWS */}
      <div className="flex border-b border-white/5 space-x-6 pb-2 overflow-x-auto no-scrollbar" id="admin-sub-tabs">
        {[5, 4].includes(currentUser.level) && (
          <button
            onClick={() => setActiveAdminSubTab('users')}
            className={\`pb-3 text-sm font-semibold relative transition-all cursor-pointer \${
              activeAdminSubTab === 'users' ? 'text-blue-450 text-white border-b-2 border-blue-500' : 'text-slate-400 hover:text-slate-200'
            }\`}
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
            className={\`pb-3 text-sm font-semibold relative transition-all cursor-pointer \${
              activeAdminSubTab === 'roles' ? 'text-blue-450 text-white border-b-2 border-blue-500' : 'text-slate-400 hover:text-slate-200'
            }\`}
            id="tab-btn-roles"
          >
            <span className="flex items-center gap-2">
              <Shield className="w-4 h-4 text-blue-400" /> Roles y Jerarquías (CRUD)
            </span>
          </button>
        )}

        {[5, 3].includes(currentUser.level) && (
          <button
            onClick={() => setActiveAdminSubTab('audit')}
            className={\`pb-3 text-sm font-semibold relative transition-all cursor-pointer \${
              activeAdminSubTab === 'audit' ? 'text-blue-450 text-white border-b-2 border-blue-500' : 'text-slate-400 hover:text-slate-200'
            }\`}
            id="tab-btn-audit"
          >
            <span className="flex items-center gap-2">
              <Key className="w-4 h-4 text-emerald-400" /> Auditoría y Cifrado
            </span>
          </button>
        )}
      </div>

      `
);

// 2. Extract Timeline and Critical Alerts
const timelineMatch = code.match(/\{\/\* Timeline: Security Incidents \(REPLACES COUNTERS\) \*\/\}[\s\S]*?(?=\{\/\* Critical Alerts Table \*\/})/);
const timelineCode = timelineMatch ? timelineMatch[0] : '';
code = code.replace(timelineCode, '');

const criticalAlertsMatch = code.match(/\{\/\* Critical Alerts Table \*\/\}[\s\S]*?(?=\{\/\* USER DIRECTORY & SIEM PANELS CONTAINER \*\/})/);
const criticalAlertsCode = criticalAlertsMatch ? criticalAlertsMatch[0] : '';
code = code.replace(criticalAlertsCode, '');

// 3. Extract SIEM Logs Panel
const siemMatch = code.match(/\{\/\* PANEL B: AUDIT LOGS SEARCH ENGINE \*\/\}[\s\S]*?(?=\s*\<\/div>\s*\<\/div>\s*\)\s*:\s*activeAdminSubTab === 'roles' \? \()/);
const siemCode = siemMatch ? siemMatch[0] : '';
code = code.replace(siemCode, '');

// Clean up the grid cols in users tab:
// `<div className="grid grid-cols-1 lg:grid-cols-3 gap-6" id="directory-siem-parent">` -> `<div className="grid grid-cols-1 gap-6" id="directory-siem-parent">`
code = code.replace(
  /<div className="grid grid-cols-1 lg:grid-cols-3 gap-6" id="directory-siem-parent">/,
  '<div className="grid grid-cols-1 gap-6" id="directory-siem-parent">'
);
// Make user directory full width
// `className={\`bg-[#141414] rounded-2xl border border-white/5 shadow-2xl p-6 flex flex-col justify-between \${!isAuditorOnly ? 'lg:col-span-2' : 'hidden'}\`} id="col-user-dir"` -> `className="bg-[#141414] rounded-2xl border border-white/5 shadow-2xl p-6 flex flex-col justify-between col-span-1" id="col-user-dir"`
code = code.replace(
  /className=\{`bg-\[#141414\] rounded-2xl border border-white\/5 shadow-2xl p-6 flex flex-col justify-between \$\{\!isAuditorOnly \? 'lg:col-span-2' : 'hidden'\}`\} id="col-user-dir"/,
  'className="bg-[#141414] rounded-2xl border border-white/5 shadow-2xl p-6 flex flex-col justify-between col-span-1" id="col-user-dir"'
);
// The "Active Sessions" widget is currently in a grid lg:grid-cols-3 and it only uses 1 col. The timeline used 2.
// We remove the grid lg:grid-cols-3 on security-dashboard-metrics
code = code.replace(
  /<div className="grid grid-cols-1 lg:grid-cols-3 gap-6" id="security-dashboard-metrics">/,
  '<div className="grid grid-cols-1 gap-6" id="security-dashboard-metrics">'
);

// 4. Create the new Audit tab and inject the passwords tab inside it.
// Wait, we can just replace the passwords view with the new audit view.
const passwordsMatch = code.match(/activeAdminSubTab === 'passwords'[\s\S]*?(?=\s*\<\/div>\s*\<\/div>\s*\)\s*;\s*\})/);
const passwordsCode = passwordsMatch ? passwordsMatch[0] : '';
code = code.replace(passwordsCode, '');

const newAuditTabCode = `activeAdminSubTab === 'audit' ? (
        <div className="space-y-8 animate-fade-in" id="audit-parent-view">
          
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6" id="audit-dashboard-metrics">
            ${timelineCode.replace(/lg:col-span-2/, 'col-span-1 lg:col-span-3')}
          </div>

          <div className="grid grid-cols-1 gap-6">
            ${criticalAlertsCode}
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            ${siemCode.replace(/lg:col-span-1/, 'col-span-1')}

            <div className="bg-[#141414] rounded-2xl border border-white/5 shadow-2xl p-6 flex flex-col justify-between col-span-1">
              <div className="border-b border-white/5 pb-4 mb-4">
                <h3 className="font-semibold text-white flex items-center gap-2">
                  <Key className="w-4.5 h-4.5 text-emerald-400" />
                  Registro Criptográfico (Hashing BCrypt)
                </h3>
                <p className="text-[11px] text-slate-400 mt-0.5">Visibilidad temporal de los hashes de contraseñas de todos los perfiles de la base de datos local para fines de auditoría técnica. Por políticas de seguridad, las contraseñas en texto plano no pueden ser desencriptadas.</p>
              </div>

              {loadingHashes ? (
                <div className="h-40 flex flex-col items-center justify-center text-slate-500 animate-pulse">
                  <Key className="w-8 h-8 mb-2 opacity-30" />
                  <p className="text-xs">Extrayendo registro criptográfico desde la Base de Datos...</p>
                </div>
              ) : hashesError ? (
                <div className="h-40 flex items-center justify-center">
                  <p className="text-xs font-bold text-red-400 flex items-center gap-2"><ShieldAlert className="w-4 h-4"/> {hashesError}</p>
                </div>
              ) : (
                <div className="flex-1 overflow-x-auto overflow-y-auto max-h-[500px]">
                  <table className="w-full text-left text-[10px] whitespace-nowrap">
                    <thead>
                      <tr className="border-b border-white/10 text-slate-400 uppercase font-bold sticky top-0 bg-[#141414] z-10 shadow-sm shadow-black/50">
                        <th className="pb-3 px-3">Identidad</th>
                        <th className="pb-3 px-3">Rol del Sistema</th>
                        <th className="pb-3 px-3 w-full">Hash BCrypt Almacenado</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-white/5">
                      {passwordHashes.map(h => (
                        <tr key={h.id} className="hover:bg-white/5 transition-colors group">
                          <td className="py-3 px-3">
                            <p className="font-bold text-slate-200">@{h.username}</p>
                            <p className="text-[8px] text-slate-500 truncate max-w-[150px]">{h.id}</p>
                          </td>
                          <td className="py-3 px-3">
                            <span className="px-2 py-0.5 rounded bg-blue-500/10 text-blue-400 border border-blue-500/10 font-bold uppercase text-[9px]">{h.role}</span>
                          </td>
                          <td className="py-3 px-3">
                            <code className="text-emerald-400/80 font-mono tracking-tight bg-black/40 px-2 py-1 rounded select-all block overflow-hidden text-ellipsis max-w-[300px]" title={h.passwordHash}>
                              {h.passwordHash || 'SIN_CONTRASEÑA_REGISTRADA'}
                            </code>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
              
              <div className="mt-4 pt-4 border-t border-white/5 flex justify-end">
                <button 
                  onClick={fetchHashes}
                  className="px-3 py-1.5 bg-white/5 hover:bg-white/10 text-slate-300 text-xs rounded border border-white/10 transition-colors flex items-center gap-2 cursor-pointer"
                >
                  <Activity className="w-3.5 h-3.5" />
                  Refrescar Registros
                </button>
              </div>
            </div>
          </div>
        </div>
`;

code = code.replace(
  /(\)\s*:\s*activeAdminSubTab === 'roles' \? \([\s\S]*?\)\s*:\s*null\s*\})/m,
  (match) => {
    // wait, we need to carefully replace the end.
    // Replace `) : null}` with `) : ${newAuditTabCode} : null}`
    return match.replace(/\)\s*:\s*null\s*\}/, `) : ${newAuditTabCode} : null}`);
  }
);

// We need to also fix activeAdminSubTab state in the file
code = code.replace(
  /const \[activeAdminSubTab, setActiveAdminSubTab\] = useState\<'users' \| 'roles' \| 'passwords'\>\(\(\) \=\> \{[\s\S]*?\}\);/,
  "const [activeAdminSubTab, setActiveAdminSubTab] = useState<'users' | 'roles' | 'audit'>(() => {\n" +
  "  return (localStorage.getItem('sentinel_admin_subtab') as any) || (currentUser.level === 3 ? 'audit' : 'users');\n" +
  "});\n\n" +
  "useEffect(() => {\n" +
  "  if (activeAdminSubTab === 'audit' && (currentUser.level === 5 || currentUser.level === 3)) {\n" +
  "    fetchHashes();\n" +
  "  }\n" +
  "}, [activeAdminSubTab, currentUser]);"
);
// Remove old fetchHashes useEffect if it exists
code = code.replace(
  /useEffect\(\(\) \=\> \{\s*if \(activeAdminSubTab === 'passwords'\) fetchHashes\(\);\s*\}, \[activeAdminSubTab\]\);/,
  ''
);

fs.writeFileSync('src/components/AdminPanel.tsx', code);
console.log('AdminPanel refactored!');
