import React, { useState, useRef, useEffect } from 'react';
import { Play, CheckCircle2, AlertTriangle, RefreshCw, Terminal, XCircle } from 'lucide-react';
import { fetchEventSource } from '@microsoft/fetch-event-source';

interface TestSummary {
  total: number;
  passed: number;
  failed: number;
}

export default function TestAutomation() {
  const [isRunning, setIsRunning] = useState(false);
  const [completed, setCompleted] = useState(false);
  const [liveLogs, setLiveLogs] = useState<string[]>([]);
  const [summary, setSummary] = useState<TestSummary | null>(null);

  const abortControllerRef = useRef<AbortController | null>(null);

  // Cleanup on unmount to prevent memory leaks and zombie SSE streams
  useEffect(() => {
    return () => {
      if (abortControllerRef.current) {
        abortControllerRef.current.abort();
      }
    };
  }, []);

  const triggerTestSuite = async () => {
    setIsRunning(true);
    setCompleted(false);
    setLiveLogs([]);
    setSummary(null);
    
    abortControllerRef.current = new AbortController();
    const token = localStorage.getItem('secure_auth_token');

    let passedCount = 0;
    let failedCount = 0;
    let totalCount = 0;

    try {
      await fetchEventSource('/api/admin/run-security-tests', {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Accept': 'text/event-stream',
          'bypass-tunnel-reminder': 'true',
          'ngrok-skip-browser-warning': 'true'
        },
        signal: abortControllerRef.current.signal,
        async onopen(response) {
          if (response.ok && response.headers.get('content-type')?.includes('text/event-stream')) {
            return; // everything's good
          }
          throw new Error('Error al conectar con el servidor de pruebas.');
        },
        onmessage(msg) {
          if (msg.data === '[DONE]') {
            setCompleted(true);
            setIsRunning(false);
            setSummary({ total: totalCount, passed: passedCount, failed: failedCount });
            abortControllerRef.current?.abort();
            return;
          }
          try {
            const data = JSON.parse(msg.data);
            setLiveLogs(prev => [...prev, data.message]);
            totalCount++;
            if (data.message.includes('[OK]')) passedCount++;
            if (data.message.includes('[ERROR]')) failedCount++;
          } catch (e) {
            console.error('Error parseando evento SSE:', e);
          }
        },
        onerror(err) {
          console.error('SSE Error:', err);
          setLiveLogs(prev => [...prev, '[ERROR] Se perdió la conexión con el servidor de pruebas.']);
          setIsRunning(false);
          abortControllerRef.current?.abort();
          throw err; // Stop retrying
        }
      });
    } catch (e) {
      setIsRunning(false);
    }
  };

  return (
    <div className="bg-[#141414] text-slate-200 rounded-2xl border border-white/5 shadow-2xl overflow-hidden" id="test-automation-container">
      <div className="flex justify-between items-center px-6 py-4 border-b border-white/5 bg-[#0F0F0F]">
        <div className="flex items-center gap-2">
          <Terminal className="w-5 h-5 text-blue-400" />
          <span className="font-mono text-xs font-bold uppercase tracking-wider text-slate-400">System Test Runner v2.0.0 (SSE)</span>
        </div>
        <button
          onClick={triggerTestSuite}
          disabled={isRunning}
          className={`flex items-center gap-2 px-4 py-2 text-xs font-medium rounded-lg font-mono transition-all cursor-pointer ${
            isRunning
              ? 'bg-[#0A0A0A] text-slate-600 cursor-not-allowed border border-white/5'
              : 'bg-blue-600 hover:bg-blue-500 text-white font-bold active:scale-95 shadow-lg shadow-blue-500/15'
          }`}
        >
          {isRunning ? <RefreshCw className="w-3.5 h-3.5 animate-spin" /> : <Play className="w-3.5 h-3.5 fill-current text-white/95" />}
          {isRunning ? 'EJECUTANDO...' : 'INICIAR PRUEBAS UNITARIAS'}
        </button>
      </div>

      <div className="p-6 md:p-8 space-y-6">
        <div className="font-mono text-xs text-slate-300 bg-[#0A0A0A] p-5 rounded-xl border border-white/5 min-h-[220px] flex flex-col justify-between space-y-4 shadow-inner">
          {!isRunning && !completed && liveLogs.length === 0 && (
            <div className="text-center py-8 space-y-3">
              <span className="inline-block text-slate-650 border border-white/5 p-2.5 rounded-full mb-1">
                <Terminal className="w-6 h-6 text-slate-500" />
              </span>
              <p className="text-slate-400 text-xs">Preparado para ejecutar suite de pruebas asíncronas de seguridad.</p>
              <p className="text-[10px] text-slate-500">Se utilizará SSE para recibir datos en tiempo real de la CPU del servidor con protección Anti-DoS.</p>
            </div>
          )}

          <div className="space-y-2 flex-1 overflow-y-auto">
            {(isRunning || liveLogs.length > 0) && (
              <p className="text-blue-400 mb-4"># tsx testrunner.ts --sse=true --auth=Bearer --secure</p>
            )}
            {liveLogs.map((log, i) => (
              <div key={i} className="flex gap-2 items-start">
                <span className="text-slate-500">[{new Date().toLocaleTimeString([], { hour12: false })}]</span>
                <span className={
                  log.includes('[OK]') ? 'text-emerald-400' : log.includes('[ERROR]') ? 'text-red-400' : 'text-slate-300'
                }>{log}</span>
              </div>
            ))}
            {isRunning && (
              <div className="h-1.5 w-full bg-[#141414] rounded-full overflow-hidden mt-6 border border-white/5">
                <div className="h-full bg-blue-500 animate-[pulse_1s_infinite] w-[70%]" />
              </div>
            )}
          </div>

          <div className="flex items-center text-slate-500 border-t border-white/5 pt-3 text-[10px] mt-4">
            <span className="text-blue-500 mr-2">$</span>
            <span>ready_for_input | {completed ? 'execution_success' : isRunning ? 'running_tests...' : 'idle'}</span>
          </div>
        </div>

        {completed && summary && (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 bg-[#0F0F0F] p-4 rounded-xl border border-white/5 animate-fade-in">
            <div className="flex items-center gap-3 p-3 bg-[#0A0A0A] border border-white/5 rounded-lg">
              <div className="p-2 rounded-lg bg-slate-500/10 text-slate-400">
                <Terminal className="w-5 h-5" />
              </div>
              <div>
                <p className="text-[10px] uppercase font-mono tracking-wider text-slate-500">Eventos SSE</p>
                <p className="text-lg font-bold font-mono text-white">{summary.total}</p>
              </div>
            </div>

            <div className="flex items-center gap-3 p-3 bg-[#0A0A0A] border border-white/5 rounded-lg">
              <div className="p-2 rounded-lg bg-emerald-500/10 text-emerald-400">
                <CheckCircle2 className="w-5 h-5" />
              </div>
              <div>
                <p className="text-[10px] uppercase font-mono tracking-wider text-slate-500">Pruebas OK</p>
                <p className="text-lg font-bold font-mono text-emerald-400">{summary.passed}</p>
              </div>
            </div>

            <div className="flex items-center gap-3 p-3 bg-[#0A0A0A] border border-white/5 rounded-lg">
              <div className="p-2 rounded-lg bg-rose-500/10 text-rose-400">
                {summary.failed > 0 ? <XCircle className="w-5 h-5" /> : <AlertTriangle className="w-5 h-5 text-slate-500" />}
              </div>
              <div>
                <p className="text-[10px] uppercase font-mono tracking-wider text-slate-500">Fallos</p>
                <p className="text-lg font-bold font-mono text-rose-400">{summary.failed}</p>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
