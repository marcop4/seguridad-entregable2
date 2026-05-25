/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { BookOpen, ShieldCheck, Terminal, HeartPulse, HardDrive, Cpu, HelpCircle } from 'lucide-react';

export default function ManualTabs() {
  const [activeTab, setActiveTab] = useState<'tech' | 'user' | 'maintenance'>('tech');

  return (
    <div className="bg-[#141414] rounded-2xl border border-white/5 shadow-2xl overflow-hidden" id="doc-section">
      {/* Tab Headers */}
      <div className="flex border-b border-white/5 bg-[#0F0F0F] p-2 gap-1 overflow-x-auto">
        <button
          onClick={() => setActiveTab('tech')}
          className={`flex items-center gap-2 px-4 py-2.5 text-sm font-medium rounded-xl transition-all whitespace-nowrap cursor-pointer ${
            activeTab === 'tech'
              ? 'bg-blue-600 text-white shadow-md shadow-blue-500/15'
              : 'text-slate-400 hover:text-white hover:bg-white/5'
          }`}
          id="btn-tab-tech"
        >
          <ShieldCheck className="w-4.5 h-4.5" />
          Informe Técnico y Seguridad
        </button>
        <button
          onClick={() => setActiveTab('user')}
          className={`flex items-center gap-2 px-4 py-2.5 text-sm font-medium rounded-xl transition-all whitespace-nowrap cursor-pointer ${
            activeTab === 'user'
              ? 'bg-blue-600 text-white shadow-md shadow-blue-500/15'
              : 'text-slate-400 hover:text-white hover:bg-white/5'
          }`}
          id="btn-tab-user"
        >
          <BookOpen className="w-4.5 h-4.5" />
          Manual de Usuario
        </button>
        <button
          onClick={() => setActiveTab('maintenance')}
          className={`flex items-center gap-2 px-4 py-2.5 text-sm font-medium rounded-xl transition-all whitespace-nowrap cursor-pointer ${
            activeTab === 'maintenance'
              ? 'bg-blue-600 text-white shadow-md shadow-blue-500/15'
              : 'text-slate-400 hover:text-white hover:bg-white/5'
          }`}
          id="btn-tab-maint"
        >
          <HeartPulse className="w-4.5 h-4.5" />
          Plan de Mantenimiento
        </button>
      </div>

      {/* Tab Panels */}
      <div className="p-6 md:p-8 space-y-6">
        {activeTab === 'tech' && (
          <div className="space-y-6 animate-fade-in" id="panel-tech">
            <div>
              <h3 className="text-xl font-semibold text-white flex items-center gap-2">
                <Terminal className="w-5 h-5 text-blue-400" />
                Arquitectura de Seguridad y Flujos Críticos
              </h3>
              <p className="mt-1 text-sm text-slate-400">
                Detalles analíticos de los algoritmos de encriptación, control estatal de sesiones y protección de auditoría.
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="border border-white/5 bg-[#0A0A0A] rounded-xl p-5 space-y-3">
                <h4 className="font-semibold text-white flex items-center gap-2">
                  <span className="flex h-6 w-6 items-center justify-center rounded-lg bg-blue-500/15 text-blue-400 text-xs font-bold border border-blue-500/20">1</span>
                  Encriptación con BCrypt CJS
                </h4>
                <p className="text-xs text-slate-400 leading-relaxed">
                  Las contraseñas de los usuarios no se guardan directamente en texto plano bajo ninguna circunstancia. Durante el registro, la contraseña pasa por un proceso de hashing usando <strong>BCrypt (compilación pura bcryptjs)</strong> con una ronda de 10 coeficientes de sal (Salt rounds). El algoritmo genera hashes del tipo <code>$2a$10$...</code> que impiden ataques por fuerza bruta, tablas de arcoíris y accesos de intermediarios (MITM). En cada inicio de sesión, el hash es comparado de manera asíncrona contra la base persistente.
                </p>
              </div>

              <div className="border border-white/5 bg-[#0A0A0A] rounded-xl p-5 space-y-3">
                <h4 className="font-semibold text-white flex items-center gap-2">
                  <span className="flex h-6 w-6 items-center justify-center rounded-lg bg-blue-500/15 text-blue-400 text-xs font-bold border border-blue-500/20">2</span>
                  Algoritmo de Sesión Única
                </h4>
                <p className="text-xs text-slate-400 leading-relaxed">
                  Para evitar accesos simultáneos y garantizar un solo navegador por cuenta, el servidor almacena un <code>activeSessionId</code> dinámico por usuario. Al loguearse en otra pestaña, navegador o dispositivo, el backend interactúa:
                  <br />
                  <strong className="text-amber-400">Aviso preventivo:</strong> Se alerta al usuario que existe una sesión activa y se le solicita autorización para revocarla. Si procede, la sesión antigua queda destruida mediante notificaciones push en tiempo real (SSE) y el nuevo terminal toma el mando de control.
                </p>
              </div>

              <div className="border border-white/5 bg-[#0A0A0A] rounded-xl p-5 space-y-3">
                <h4 className="font-semibold text-white flex items-center gap-2">
                  <span className="flex h-6 w-6 items-center justify-center rounded-lg bg-blue-500/15 text-blue-400 text-xs font-bold border border-blue-500/20">3</span>
                  Brute-Force Shield & Admin Alert
                </h4>
                <p className="text-xs text-slate-400 leading-relaxed">
                  El sistema bloquea cuentas de forma reactiva al registrarse <strong>3 intentos fallidos consecutivos</strong> de inicio de sesión de contraseña incorrecta. Cuando esto sucede, un correo de alerta es simulado en tiempo de ejecución, el estado del usuario cambia a <code>isLocked = true</code>, y se levanta una <strong>Alerta de Seguridad prioritaria en el panel administrativo</strong> para que se audite la IP o dispositivo agresor y se autorice manualmente su desbloqueo.
                </p>
              </div>

              <div className="border border-white/5 bg-[#0A0A0A] rounded-xl p-5 space-y-3">
                <h4 className="font-semibold text-white flex items-center gap-2">
                  <span className="flex h-6 w-6 items-center justify-center rounded-lg bg-blue-500/15 text-blue-400 text-xs font-bold border border-blue-500/20">4</span>
                  Token Quemado Secuencial (Burn Alert)
                </h4>
                <p className="text-xs text-slate-400 leading-relaxed">
                  La reconfiguración de accesos por correo genera un token temporal en memoria con exactamente 15 minutos de caducidad. En el instante preciso en el que el enlace es consumido en la pantalla de restablecimiento, el token es <strong>quemado permanentemente (pasa a null)</strong> del registro antes que se complete la confirmación del nuevo hash, garantizando inmunidad frente a repeticiones de solicitudes HTTP maliciosas.
                </p>
              </div>
            </div>

            <div className="border border-white/5 bg-blue-950/20 rounded-2xl p-6">
              <h4 className="font-semibold text-blue-300 flex items-center gap-2 text-sm md:text-base">
                <Cpu className="w-5 h-5 text-blue-400" />
                Evidencia de Despliegue en la Nube (Google Cloud Run)
              </h4>
              <p className="mt-2 text-xs md:text-sm text-slate-300 leading-relaxed">
                Este sistema se encuentra desplegado de forma activa en contenedores basados en la nube de <strong>Google Cloud Run</strong> con integración automatizada SSL. Puedes confirmar su velocidad de latencia, direccionamiento HTTPS seguro, y disponibilidad multiusuario abriéndolo directamente en el navegador del dispositivo móvil o compartiendo el ID del applet <code>abd07806-1b2b-41c2-9ed0-4b76369c3ae4</code> de AI Studio.
              </p>
            </div>
          </div>
        )}

        {activeTab === 'user' && (
          <div className="space-y-6 animate-fade-in" id="panel-user">
            <div>
              <h3 className="text-xl font-semibold text-white flex items-center gap-2">
                <BookOpen className="w-5 h-5 text-blue-400" />
                Guía de Usuario Interactiva
              </h3>
              <p className="mt-1 text-sm text-slate-400">
                Pasos sencillos para demostrar las características avanzadas de seguridad en el sistema.
              </p>
            </div>

            <div className="space-y-4">
              <div className="flex gap-4 items-start pb-4 border-b border-white/5">
                <span className="font-mono text-sm font-bold bg-white/5 text-slate-300 h-8 w-8 rounded-lg flex items-center justify-center shrink-0 border border-white/5">01</span>
                <div>
                  <h4 className="font-semibold text-white text-sm md:text-base">Acceso Inicial y Prueba de Contraseñas Encriptadas</h4>
                  <p className="text-xs text-slate-400 mt-1">
                    Inicia sesión utilizando las cuentas de demostración del sistema como el Administrador (<code>admin</code> / clave <code>password123</code>) u otros roles de prueba. Prueba a registrar un nuevo usuario con clave propia; la base persistente calculará de inmediato su hash seguro con BCrypt visible en el Sandbox de base de datos.
                  </p>
                </div>
              </div>

              <div className="flex gap-4 items-start pb-4 border-b border-white/5">
                <span className="font-mono text-sm font-bold bg-white/5 text-slate-300 h-8 w-8 rounded-lg flex items-center justify-center shrink-0 border border-white/5">02</span>
                <div>
                  <h4 className="font-semibold text-white text-sm md:text-base">Demostración de Sesión Única (Kicking / Revocación)</h4>
                  <p className="text-xs text-slate-400 mt-1">
                    Abre el sistema en dos navegadores diferentes o en una ventana de incógnito paralela. Intenta iniciar sesión con el mismo usuario. El sistema mostrará un anuncio: "Existe una sesión previa activa". Si decides sobreescribirla, verás cómo de forma mágica e instantánea la pantalla del primer navegador cambia a un bloqueo avisándote que su sesión fue revocada remotamente.
                  </p>
                </div>
              </div>

              <div className="flex gap-4 items-start pb-4 border-b border-white/5">
                <span className="font-mono text-sm font-bold bg-white/5 text-slate-300 h-8 w-8 rounded-lg flex items-center justify-center shrink-0 border border-white/5">03</span>
                <div>
                  <h4 className="font-semibold text-white text-sm md:text-base">Activación del Escudo Anti Fuerza Bruta</h4>
                  <p className="text-xs text-slate-400 mt-1">
                    Cierra sesión e intenta acceder con un usuario válido ingresando una contraseña incorrecta repetidas veces. Observa cómo al tercer fallo, la interfaz bloquea el formulario por seguridad. Posteriormente, inicia sesión como Administrador y localiza la tarjeta de alerta roja, selecciona el registro de auditoría y desbloquea al usuario agredido de inmediato.
                  </p>
                </div>
              </div>

              <div className="flex gap-4 items-start">
                <span className="font-mono text-sm font-bold bg-white/5 text-slate-300 h-8 w-8 rounded-lg flex items-center justify-center shrink-0 border border-white/5">04</span>
                <div>
                  <h4 className="font-semibold text-white text-sm md:text-base">Simulador de Recuperación de Cuenta por Email Sandbox</h4>
                  <p className="text-xs text-slate-400 mt-1">
                    Si olvidas tu clave, haz clic en "¿Olvidaste tu contraseña?" e introduce tu correo. Se generará un token que llegará inmediatamente al buzón interactivo "Email Sandbox" en el banner inferior. Simplemente lee el correo adentro del panel, haz clic en el enlace entregado y modifique la contraseña de inmediato. El robot quemará el token para evitar duplicaciones.
                  </p>
                </div>
              </div>
            </div>
          </div>
        )}

        {activeTab === 'maintenance' && (
          <div className="space-y-6 animate-fade-in" id="panel-maintenance">
            <div>
              <h3 className="text-xl font-semibold text-white flex items-center gap-2">
                <HeartPulse className="w-5 h-5 text-blue-400" />
                Plan de Mantenimiento Continuo del Sistema
              </h3>
              <p className="mt-1 text-sm text-slate-400">
                Compromiso estructurado para garantizar la estabilidad, escalabilidad y la actualización tecnológica de la plataforma.
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              <div className="border border-white/5 rounded-xl p-4 bg-[#0A0A0A] space-y-2">
                <span className="text-xs font-semibold px-2 py-1 rounded bg-blue-500/15 text-blue-400 border border-blue-500/20 font-mono">FASE H1</span>
                <h4 className="font-semibold text-white text-sm">Auditorías Periódicas</h4>
                <p className="text-[11px] text-slate-400 leading-relaxed">
                  Inspección y depuración quincenal de los registros de auditoría y bloqueos de seguridad. Análisis de anomalías de IP para añadir restricciones de cortafuegos basados en Cloud Armor de Google.
                </p>
              </div>

              <div className="border border-white/5 rounded-xl p-4 bg-[#0A0A0A] space-y-2">
                <span className="text-xs font-semibold px-2 py-1 rounded bg-blue-500/15 text-blue-400 border border-blue-500/20 font-mono">FASE H2</span>
                <h4 className="font-semibold text-white text-sm">Actualización de Parches</h4>
                <p className="text-[11px] text-slate-400 leading-relaxed">
                  Monitoreo mensual de vulnerabilidades NPM (mediante <code>npm audit</code>). Actualización constante de bibliotecas criptográficas como `bcryptjs`, dependencias Express y seguridad de CORS.
                </p>
              </div>

              <div className="border border-white/5 rounded-xl p-4 bg-[#0A0A0A] space-y-2">
                <span className="text-xs font-semibold px-2 py-1 rounded bg-blue-500/15 text-blue-400 border border-blue-500/20 font-mono">FASE H3</span>
                <h4 className="font-semibold text-white text-sm">Escalabilidad de DB</h4>
                <p className="text-[11px] text-slate-400 leading-relaxed">
                   Migración transparente de almacenamiento local en archivos JSON hacia bases relacionales escalables (como PostgreSQL o Google Cloud SQL / Spanner) cuando la densidad de accesos exceda el umbral operativo.
                </p>
              </div>

              <div className="border border-white/5 rounded-xl p-4 bg-[#0A0A0A] space-y-2">
                <span className="text-xs font-semibold px-2 py-1 rounded bg-blue-500/15 text-blue-400 border border-blue-500/20 font-mono">FASE H4</span>
                <h4 className="font-semibold text-white text-sm">Soporte y QA</h4>
                <p className="text-[11px] text-slate-400 leading-relaxed">
                  Ejecución sistemática de pruebas de regresión, simulación de cargas de peticiones masivas y entrenamiento al equipo TI en gestión de alertas tempranas e ingeniería social.
                </p>
              </div>
            </div>

            <div className="border border-emerald-500/10 bg-emerald-500/5 rounded-xl p-5 flex items-start gap-3">
              <div className="p-2 bg-emerald-500/15 text-emerald-400 rounded-lg border border-emerald-500/20">
                <HardDrive className="w-5 h-5" />
              </div>
              <div>
                <h4 className="text-sm font-semibold text-emerald-300">Cifrado de Alta Calidad</h4>
                <p className="text-xs text-emerald-400/95 leading-relaxed mt-0.5">
                  El plan contempla ráfagas rotativas de tokens JWT, control de CORS mediante cabeceras HTTP de origen verificado, y destrucción de sesiones inactivas a los 30 minutos de inactividad operativa.
                </p>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
