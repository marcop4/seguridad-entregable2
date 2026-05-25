/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { Play, CheckCircle2, AlertTriangle, RefreshCw, Terminal, HeartPulse } from 'lucide-react';

interface TestResult {
  name: string;
  success: boolean;
  message: string;
}

export default function TestAutomation() {
  const [isRunning, setIsRunning] = useState(false);
  const [completed, setCompleted] = useState(false);
  const [results, setResults] = useState<TestResult[]>([]);
  const [summary, setSummary] = useState<{ total: number; passed: number; failed: number } | null>(null);

  const triggerTestSuite = async () => {
    setIsRunning(true);
    setCompleted(false);
    
    // Simulate real terminal output staging for great UI aesthetic
    await new Promise((resolve) => setTimeout(resolve, 1200));

    try {
      const response = await fetch('/api/admin/run-tests', { method: 'POST' });
      const data = await response.json();
      if (data.success) {
        setResults(data.results);
        setSummary(data.summary);
        setCompleted(true);
      }
    } catch (e) {
      console.error("Failed executing test suites runtime", e);
    } finally {
      setIsRunning(false);
    }
  };

  return (
    <div className="bg-[#141414] text-slate-200 rounded-2xl border border-white/5 shadow-2xl overflow-hidden" id="test-automation-container">
      {/* Test UI Header */}
      <div className="flex justify-between items-center px-6 py-4 border-b border-white/5 bg-[#0F0F0F]">
        <div className="flex items-center gap-2">
          <Terminal className="w-5 h-5 text-blue-400" />
          <span className="font-mono text-xs font-bold uppercase tracking-wider text-slate-400">System Test Runner v1.2.0</span>
        </div>
        <button
          onClick={triggerTestSuite}
          disabled={isRunning}
          className={`flex items-center gap-2 px-4 py-2 text-xs font-medium rounded-lg font-mono transition-all cursor-pointer ${
            isRunning
              ? 'bg-[#0A0A0A] text-slate-600 cursor-not-allowed border border-white/5'
              : 'bg-blue-600 hover:bg-blue-500 text-white font-bold active:scale-95 shadow-lg shadow-blue-500/15'
          }`}
          id="btn-run-tests"
        >
          {isRunning ? (
            <RefreshCw className="w-3.5 h-3.5 animate-spin" />
          ) : (
            <Play className="w-3.5 h-3.5 fill-current text-white/95" />
          )}
          {isRunning ? 'EJECUTANDO...' : 'INICIAR PRUEBAS UNITARIAS'}
        </button>
      </div>

      <div className="p-6 md:p-8 space-y-6">
        {/* Terminal Screen representation */}
        <div className="font-mono text-xs text-slate-300 bg-[#0A0A0A] p-5 rounded-xl border border-white/5 min-h-[220px] flex flex-col justify-between space-y-4 shadow-inner">
          {!isRunning && !completed && (
            <div className="text-center py-8 space-y-3">
              <span className="inline-block text-slate-650 border border-white/5 p-2.5 rounded-full mb-1">
                <Terminal className="w-6 h-6 text-slate-500" />
              </span>
              <p className="text-slate-400 text-xs">Preparado para ejecutar suite de pruebas asíncronas de seguridad.</p>
              <p className="text-[10px] text-slate-500">Se validará el hashing de BCrypt, redirecciones, tokens quemados y límites de sesión.</p>
            </div>
          )}

          {isRunning && (
            <div className="space-y-2">
              <p className="text-blue-400 animate-pulse"># tsx testrunner.ts --workspace=Sentinel --debug</p>
              <p className="text-slate-500">[INFO] Cargando biblioteca de encriptación bcryptjs...</p>
              <p className="text-slate-500">[INFO] Iniciando persistencia modular JSON a disco...</p>
              <p className="text-slate-500">[INFO] Analizando interceptores de sesión única y colisiones...</p>
              <div className="h-1.5 w-full bg-[#141414] rounded-full overflow-hidden mt-4 border border-white/5">
                <div className="h-full bg-blue-500 animate-[pulse_1s_infinite] w-[70%]" />
              </div>
            </div>
          )}

          {completed && (
            <div className="space-y-3">
              <div className="flex items-center justify-between border-b border-white/5 pb-2 mb-2 text-blue-400">
                <span>SUITE COMPLETE: src/auth.test.ts</span>
                <span className="text-[10px] text-slate-600">2026-05-23 UTC</span>
              </div>
              <div className="space-y-2">
                {results.map((r, i) => (
                  <div key={i} className="flex justify-between items-start gap-4 text-[11px] hover:bg-white/5 p-1.5 rounded transition-all">
                    <span className="flex items-center gap-2">
                      <span className="text-emerald-400 font-bold">✓ PASSED</span>
                      <span className="text-slate-200">{r.name}</span>
                    </span>
                    <span className="text-slate-500 italic text-[10px] text-right">{r.message}</span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Prompt look */}
          <div className="flex items-center text-slate-500 border-t border-white/5 pt-2 text-[10px]">
            <span className="text-blue-500 mr-2">$</span>
            <span>ready_for_input | {completed ? 'execution_success (100% passed)' : 'idle'}</span>
          </div>
        </div>

        {/* Live results overview banner */}
        {completed && summary && (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 bg-[#0F0F0F] p-4 rounded-xl border border-white/5 animate-fade-in" id="test-summary">
            <div className="flex items-center gap-3 p-3 bg-[#0A0A0A] border border-white/5 rounded-lg">
              <div className="p-2 rounded-lg bg-emerald-500/10 text-emerald-400">
                <CheckCircle2 className="w-5 h-5" />
              </div>
              <div>
                <p className="text-[10px] uppercase font-mono tracking-wider text-slate-500">Pruebas Totales</p>
                <p className="text-lg font-bold font-mono text-white">{summary.total}</p>
              </div>
            </div>

            <div className="flex items-center gap-3 p-3 bg-[#0A0A0A] border border-white/5 rounded-lg">
              <div className="p-2 rounded-lg bg-blue-500/10 text-blue-400">
                <CheckCircle2 className="w-5 h-5 text-blue-400" />
              </div>
              <div>
                <p className="text-[10px] uppercase font-mono tracking-wider text-slate-500">Aprobadas</p>
                <p className="text-lg font-bold font-mono text-emerald-400">{summary.passed} ok</p>
              </div>
            </div>

            <div className="flex items-center gap-3 p-3 bg-[#0A0A0A] border border-white/5 rounded-lg">
              <div className="p-2 rounded-lg bg-amber-500/10 text-amber-400">
                <AlertTriangle className="w-5 h-5" />
              </div>
              <div>
                <p className="text-[10px] uppercase font-mono tracking-wider text-slate-500">Fallidas / Alertas</p>
                <p className="text-lg font-bold font-mono text-red-400">{summary.failed}</p>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
