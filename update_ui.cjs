const fs = require('fs');
let content = fs.readFileSync('src/components/admin/PanelGestorUsuarios.tsx', 'utf8');

const countdownComponent = `
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
      if (h > 0) timeStr += \`\${h}h \`;
      if (m > 0 || h > 0) timeStr += \`\${m}m \`;
      timeStr += \`\${s}s\`;
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

`;

content = content.replace('export default function PanelGestorUsuarios({', countdownComponent + 'export default function PanelGestorUsuarios({');

content = content.replace('{activeLockSelectUserId === user.id && (\n                                    <div className="absolute top-full right-0 mt-1.5 w-44 rounded-xl shadow-2xl bg-[#141414] border border-white/10 ring-1 ring-black ring-opacity-5 z-[100] overflow-hidden" id={`lock-time-dropdown-menu-${user.id}`}>', '{activeLockSelectUserId === user.id && (\n                                  <>\n                                    <div className="fixed inset-0 z-[90]" onClick={(e) => { e.stopPropagation(); setActiveLockSelectUserId(null); }} />\n                                    <div className="absolute top-full right-0 mt-1.5 w-44 rounded-xl shadow-2xl bg-[#141414] border border-white/10 ring-1 ring-black ring-opacity-5 z-[100] overflow-hidden" id={`lock-time-dropdown-menu-${user.id}`}>');

content = content.replace('{activeLockSelectUserId === user.id && (\n                                <div className="absolute right-0 bottom-full mb-1.5 w-40 rounded-xl shadow-2xl bg-[#141414] border border-white/10 ring-1 ring-black ring-opacity-5 z-50 overflow-hidden" id="lock-time-dropdown-mobile">', '{activeLockSelectUserId === user.id && (\n                                <>\n                                <div className="fixed inset-0 z-[40]" onClick={(e) => { e.stopPropagation(); setActiveLockSelectUserId(null); }} />\n                                <div className="absolute right-0 bottom-full mb-1.5 w-40 rounded-xl shadow-2xl bg-[#141414] border border-white/10 ring-1 ring-black ring-opacity-5 z-50 overflow-hidden" id="lock-time-dropdown-mobile">');

content = content.replace(/{user\.lockedUntil && \([\s\S]*?<\/[^>]+>[\s\S]*?\)}/g, '{user.lockedUntil && <LockCountdown lockedUntil={user.lockedUntil} />}');

content = content.replace(/<\/div>\n                                      <div className="py-1/g, '</>\n                                      <div className="py-1');
content = content.replace(/Cerrar men\u01E7/g, 'Cerrar menú');

// properly close the React fragments since the script replaces the opening but doesn't add closing
content = content.replace(/<\/div>\n                                  <\/div>\n                                \)\}/g, '</div>\n                                  </div>\n                                  </>\n                                )}');

fs.writeFileSync('src/components/admin/PanelGestorUsuarios.tsx', content);
console.log('UI Updated');
