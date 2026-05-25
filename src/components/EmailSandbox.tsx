/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useEffect, useState } from 'react';
import { Mail, ArrowRight, Trash2, Clock, CheckCircle } from 'lucide-react';
import { EmailSandboxItem } from '../types';

interface EmailSandboxProps {
  onSelectToken: (token: string) => void;
  refreshTrigger: number;
}

export default function EmailSandbox({ onSelectToken, refreshTrigger }: EmailSandboxProps) {
  const [emails, setEmails] = useState<EmailSandboxItem[]>([]);
  const [loading, setLoading] = useState(false);

  const fetchEmails = async () => {
    try {
      const response = await fetch('/api/emails');
      if (response.ok) {
        const data = await response.json();
        setEmails(data);
      }
    } catch (e) {
      console.error("Failed fetching sandbox emails:", e);
    }
  };

  const clearEmails = async () => {
    setLoading(true);
    try {
      const response = await fetch('/api/emails/clear', { method: 'POST' });
      if (response.ok) {
        setEmails([]);
      }
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchEmails();
    // Poll every 5 seconds to capture dynamically triggered emails instantly
    const interval = setInterval(fetchEmails, 5000);
    return () => clearInterval(interval);
  }, [refreshTrigger]);

  return (
    <div className="bg-[#141414] rounded-2xl border border-white/5 p-5 shadow-lg space-y-4" id="email-sandbox-window">
      <div className="flex justify-between items-center pb-2 border-b border-white/5">
        <div className="flex items-center gap-2">
          <span className="p-1 px-2.5 bg-blue-500/15 text-blue-400 text-xs font-bold rounded-lg uppercase tracking-wider font-mono border border-blue-500/20">
            RECEPTOR SMTP
          </span>
          <h3 className="text-sm font-semibold text-white flex items-center gap-1.5">
            <Mail className="w-4 h-4 text-blue-400" />
            Servidor de Correos de Alerta (SMTP Relay)
          </h3>
        </div>
        
        {emails.length > 0 && (
          <button
            onClick={clearEmails}
            disabled={loading}
            className="text-xs text-red-400 hover:text-red-300 flex items-center gap-1 hover:bg-red-500/10 p-1.5 px-2.5 rounded-lg font-medium transition-all"
            id="btn-clear-emails"
          >
            <Trash2 className="w-3.5 h-3.5" />
            Limpiar logs
          </button>
        )}
      </div>

      <p className="text-[11px] text-slate-400 leading-relaxed">
        <strong>Para validación de incidentes de red:</strong> Cuando un usuario solicita restablecer su contraseña, el servidor genera un token seguro y temporizado, transmitiéndolo por este relé SMTP seguro. Haz clic en <strong>"Abrir Enlace de Recuperación Seguro"</strong> para validar la llegada al portal y configurar el nuevo hash con BCrypt.
      </p>

      {emails.length === 0 ? (
        <div className="p-8 text-center bg-[#0A0A0A] rounded-xl border border-dashed border-white/10 text-slate-500 space-y-2">
          <Mail className="w-8 h-8 mx-auto text-slate-600 animate-pulse" />
          <p className="text-xs font-medium text-slate-400">Log de correos vacío</p>
          <p className="text-[10px] text-slate-500">Las alertas de transmisión para restablecer claves aparecerán aquí de forma instantánea.</p>
        </div>
      ) : (
        <div className="space-y-3 max-h-[280px] overflow-y-auto pr-1" id="emails-list-container">
          {emails.map((email) => (
            <div
              key={email.id}
              className={`p-4 bg-[#0A0A0A] rounded-xl border transition-all hover:bg-white/5 flex flex-col justify-between gap-3 ${
                email.used 
                  ? 'border-emerald-500/20 bg-emerald-500/5 opacity-70' 
                  : 'border-white/5 shadow-md'
              }`}
            >
              <div className="flex justify-between items-start gap-2">
                <div>
                  <div className="flex items-center gap-1.5">
                    <span className="text-xs font-bold text-white">Para: {email.to}</span>
                    {email.used && (
                      <span className="text-[9px] font-semibold bg-emerald-500/15 text-emerald-400 border border-emerald-500/20 px-1.5 py-0.2 rounded flex items-center gap-0.5">
                        <CheckCircle className="w-2.5 h-2.5" /> Quemado / Usado
                      </span>
                    )}
                  </div>
                  <h4 className="text-xs font-semibold text-blue-400 mt-1">{email.subject}</h4>
                </div>
                <div className="flex items-center gap-1 text-[10px] text-slate-500 font-mono">
                  <Clock className="w-3 h-3" />
                  {new Date(email.timestamp).toLocaleTimeString()}
                </div>
              </div>

              {/* Message content summary */}
              <div className="bg-[#121212] rounded-lg p-2.5 border border-white/5 text-[10px] text-slate-400 leading-relaxed font-mono whitespace-pre-line">
                {email.body}
              </div>

              {/* Action */}
              {!email.used && (
                <button
                  onClick={() => onSelectToken(email.token)}
                  className="w-full py-1.5 px-3 bg-blue-600 hover:bg-blue-500 text-white rounded-lg text-xs font-semibold flex items-center justify-center gap-1 transition-all active:scale-99 shadow-md shadow-blue-500/10 cursor-pointer"
                  id={`btn-visit-link-${email.id}`}
                >
                  Abrir Enlace de Recuperación Seguro
                  <ArrowRight className="w-3.5 h-3.5" />
                </button>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
