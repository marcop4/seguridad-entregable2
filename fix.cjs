const fs = require('fs');

let roles = fs.readFileSync('src/components/admin/PanelRolesJerarquia.tsx', 'utf8');
const idx = roles.indexOf(") : activeAdminSubTab === 'passwords'");

if (idx !== -1) {
    const passwordsContent = roles.slice(idx);
    roles = roles.slice(0, idx) + '\n  );\n}';
    fs.writeFileSync('src/components/admin/PanelRolesJerarquia.tsx', roles);

    let audit = fs.readFileSync('src/components/admin/PanelAuditoriaCifrado.tsx', 'utf8');
    audit = audit.replace('return (\n', 'return (\n    <div className="space-y-6">\n');
    let passStripped = passwordsContent.replace(") : activeAdminSubTab === 'passwords' && currentUser.level === 5 ? (", '');
    // Need to strip the trailing `: null}` which might be in the passwordsContent? No wait, passwordsContent contains the end of the file.
    passStripped = passStripped.replace(') : null', '');
    
    // In PanelRolesJerarquia.tsx, passwords ends with `  );` and `}` because I appended it manually.
    passStripped = passStripped.replace('  );\n}', '');
    
    audit = audit.replace('  );\n}', '      {currentUser.level === 5 && (\n' + passStripped + '\n      )}\n    </div>\n  );\n}');
    fs.writeFileSync('src/components/admin/PanelAuditoriaCifrado.tsx', audit);
    console.log("Fixed successfully!");
} else {
    console.log("Not found.");
}
