/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { BookOpen, ShieldCheck, Terminal, HeartPulse, HardDrive, Cpu, HelpCircle, Layers, ZoomIn, ShieldAlert } from 'lucide-react';
import { User } from '../types';

interface ManualTabsProps {
  currentUser: User;
}

export default function ManualTabs({ currentUser }: ManualTabsProps) {
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
          Conceptos Generales
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
          Manual de Operación
        </button>
        {currentUser.level >= 4 && (
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
            Mantenimiento y Soporte
          </button>
        )}
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

              <div className="border border-white/5 bg-[#0A0A0A] rounded-xl p-5 space-y-3 md:col-span-2 lg:col-span-1">
                <h4 className="font-semibold text-white flex items-center gap-2">
                  <span className="flex h-6 w-6 items-center justify-center rounded-lg bg-blue-500/15 text-blue-400 text-xs font-bold border border-blue-500/20">5</span>
                  Control de Acceso Basado en Roles (RBAC)
                </h4>
                <p className="text-xs text-slate-400 leading-relaxed">
                  El sistema implementa una matriz de privilegios estricta. El backend utiliza middlewares para evaluar en tiempo real si el nivel de autorización del usuario que solicita la acción (1 al 5) es suficiente, impidiendo escalamiento de privilegios y garantizando que solo el personal autorizado acceda a la administración.
                </p>
              </div>

              <div className="border border-white/5 bg-[#0A0A0A] rounded-xl p-5 space-y-3 md:col-span-2 lg:col-span-1">
                <h4 className="font-semibold text-white flex items-center gap-2">
                  <span className="flex h-6 w-6 items-center justify-center rounded-lg bg-blue-500/15 text-blue-400 text-xs font-bold border border-blue-500/20">6</span>
                  Google Identity Platform (SSO)
                </h4>
                <p className="text-xs text-slate-400 leading-relaxed">
                  Integración moderna que delega la validación de identidad a la infraestructura global de Google mediante OAuth 2.0 y OpenID. El backend verifica la autenticidad del Credential Token directamente con los servidores de Google, permitiendo inicios de sesión ultra rápidos y auto-registro de usuarios bajo políticas estrictas.
                </p>
              </div>
            </div>


          </div>
        )}

        {activeTab === 'user' && (
          <div className="space-y-6 animate-fade-in" id="panel-user">
            <div>
              <h3 className="text-xl font-semibold text-white flex items-center gap-2">
                <BookOpen className="w-5 h-5 text-blue-400" />
                Manual Específico de Operación ({currentUser.role})
              </h3>
              <p className="mt-1 text-sm text-slate-400">
                Guía de uso adaptada exclusivamente a tu nivel de privilegios y capacidades en el sistema.
              </p>
            </div>

            <div className="space-y-4">
              
              {/* SUPERADMIN / ADMIN MANUAL */}
              {currentUser.level >= 4 && (
                <>
                  <div className="flex gap-4 items-start pb-4 border-b border-white/5">
                    <span className="font-mono text-sm font-bold bg-white/5 text-slate-300 h-8 w-8 rounded-lg flex items-center justify-center shrink-0 border border-white/5">01</span>
                    <div>
                      <h4 className="font-semibold text-white text-sm md:text-base">Gestión y Creación de Usuarios (Consola)</h4>
                      <p className="text-xs text-slate-400 mt-1">
                        Desde la pestaña <strong>"Consola de Administrador"</strong>, puedes dar de alta nuevos perfiles con una contraseña inicial segura. Si eres SuperAdmin (Nivel 5), también puedes cambiar el nivel de privilegios (roles) de cualquier usuario en tiempo real y eliminar cuentas permanentemente del sistema.
                      </p>
                    </div>
                  </div>
                  <div className="flex gap-4 items-start pb-4 border-b border-white/5">
                    <span className="font-mono text-sm font-bold bg-white/5 text-slate-300 h-8 w-8 rounded-lg flex items-center justify-center shrink-0 border border-white/5">02</span>
                    <div>
                      <h4 className="font-semibold text-white text-sm md:text-base">Bloqueo Modular de Seguridad</h4>
                      <p className="text-xs text-slate-400 mt-1">
                        Usa el ícono de <strong>Escudo de Seguridad</strong> en un usuario para abrir el Modal de Bloqueo. Puedes restringir el acceso por Minutos, Horas, Días o aplicar un Bloqueo Permanente. Si el usuario ya está bloqueado, un clic en el mismo escudo rojo lo desbloqueará inmediatamente.
                      </p>
                    </div>
                  </div>
                  <div className="flex gap-4 items-start pb-4 border-b border-white/5">
                    <span className="font-mono text-sm font-bold bg-white/5 text-slate-300 h-8 w-8 rounded-lg flex items-center justify-center shrink-0 border border-white/5">03</span>
                    <div>
                      <h4 className="font-semibold text-white text-sm md:text-base">Limpieza de Fallos de Contraseña (Amnistía)</h4>
                      <p className="text-xs text-slate-400 mt-1">
                        Si un usuario se equivoca múltiples veces al iniciar sesión, aparecerá el botón de <strong>Escoba Verde (Limpiar Fallos)</strong> en su fila. Púlsalo para poner a cero su historial de intentos fallidos antes de que el sistema lo bloquee automáticamente.
                      </p>
                    </div>
                  </div>
                  <div className="flex gap-4 items-start pb-4 border-b border-white/5">
                    <span className="font-mono text-sm font-bold bg-white/5 text-slate-300 h-8 w-8 rounded-lg flex items-center justify-center shrink-0 border border-white/5">04</span>
                    <div>
                      <h4 className="font-semibold text-white text-sm md:text-base">Revocación de Sesiones Activas</h4>
                      <p className="text-xs text-slate-400 mt-1">
                        Si detectas una sesión anómala (indicada por el texto verde "ACTIVO" y la IP del dispositivo), usa el botón de <strong>Revocar</strong>. El sistema utilizará SSE para expulsar al usuario intruso en tiempo real.
                      </p>
                    </div>
                  </div>
                  <div className="flex gap-4 items-start pb-4 border-b border-white/5">
                    <span className="font-mono text-sm font-bold bg-white/5 text-slate-300 h-8 w-8 rounded-lg flex items-center justify-center shrink-0 border border-white/5">05</span>
                    <div>
                      <h4 className="font-semibold text-white text-sm md:text-base">Simulador Email Sandbox (Pie de página)</h4>
                      <p className="text-xs text-slate-400 mt-1">
                        Puedes auditar los correos de recuperación usando el panel inferior "Email Sandbox". Este entorno seguro atrapa los tokens de reseteo para que puedas depurar la entrega sin arriesgar datos en servidores externos.
                      </p>
                    </div>
                  </div>
                  {currentUser.level === 5 && (
                    <div className="flex gap-4 items-start pt-4 border-t border-white/5">
                      <span className="font-mono text-sm font-bold bg-white/5 text-slate-300 h-8 w-8 rounded-lg flex items-center justify-center shrink-0 border border-white/5">06</span>
                      <div>
                        <h4 className="font-semibold text-white text-sm md:text-base">Suite de Pruebas Unitarias (Testing)</h4>
                        <p className="text-xs text-slate-400 mt-1">
                          Dirígete a la pestaña <strong>"Suite de Pruebas Unitarias"</strong>. Como SuperAdmin, tienes acceso a la plataforma de Testing Automatizado para correr simulaciones de estrés, probar endpoints y validar criptografía.
                        </p>
                      </div>
                    </div>
                  )}
                  <div className="flex gap-4 items-start pt-4 border-t border-white/5">
                    <span className="font-mono text-sm font-bold bg-white/5 text-slate-300 h-8 w-8 rounded-lg flex items-center justify-center shrink-0 border border-white/5">07</span>
                    <div>
                      <h4 className="font-semibold text-white text-sm md:text-base">Mitigación de User Enumeration (CWE-203 / CWE-208)</h4>
                      <p className="text-xs text-slate-400 mt-1">
                        El sistema implementa una respuesta genérica y constante en los formularios de recuperación de contraseña. Al no revelar si un correo existe o no en la base de datos, mitigamos activamente vulnerabilidades de Enumeración de Usuarios, protegiendo la privacidad e identidad de todo el personal registrado.
                      </p>
                    </div>
                  </div>
                </>
              )}

              {/* AUDITOR MANUAL */}
              {currentUser.level === 3 && (
                <>
                  <div className="flex gap-4 items-start pb-4 border-b border-white/5">
                    <span className="font-mono text-sm font-bold bg-white/5 text-slate-300 h-8 w-8 rounded-lg flex items-center justify-center shrink-0 border border-white/5">01</span>
                    <div>
                      <h4 className="font-semibold text-white text-sm md:text-base">Navegación por el Timeline de Ataques (Consola)</h4>
                      <p className="text-xs text-slate-400 mt-1">
                        Dirígete a la pestaña <strong>"Consola de Auditor"</strong>. El panel principal contiene un gráfico avanzado de trazas de seguridad. Puedes visualizar fallos de login (ámbar) y bloqueos efectuados (rojo) agrupados en ventanas de 1h, 6h, 24h, 7D y 30D.
                      </p>
                    </div>
                  </div>
                  <div className="flex gap-4 items-start pb-4 border-b border-white/5">
                    <span className="font-mono text-sm font-bold bg-white/5 text-slate-300 h-8 w-8 rounded-lg flex items-center justify-center shrink-0 border border-white/5">02</span>
                    <div>
                      <h4 className="font-semibold text-white text-sm md:text-base">Drill-Down (Zoom Interactivo en Consola)</h4>
                      <p className="text-xs text-slate-400 mt-1">
                        Para investigar a fondo un ataque, <strong>haz clic directamente en cualquier punto o barra del gráfico</strong>. Esto hará un "zoom" a esa ventana temporal específica. Usa el botón "Volver al día" para retroceder.
                      </p>
                    </div>
                  </div>
                  <div className="flex gap-4 items-start pb-4 border-b border-white/5">
                    <span className="font-mono text-sm font-bold bg-white/5 text-slate-300 h-8 w-8 rounded-lg flex items-center justify-center shrink-0 border border-white/5">03</span>
                    <div>
                      <h4 className="font-semibold text-white text-sm md:text-base">Cacería de Amenazas (Consola)</h4>
                      <p className="text-xs text-slate-400 mt-1">
                        La tabla de "Alertas Críticas del Periodo" se sincroniza automáticamente con tu nivel de zoom en la gráfica. Utilízala para ver el IP y usuario exactos.
                      </p>
                    </div>
                  </div>
                  <div className="flex gap-4 items-start pb-4 border-b border-white/5">
                    <span className="font-mono text-sm font-bold bg-white/5 text-slate-300 h-8 w-8 rounded-lg flex items-center justify-center shrink-0 border border-white/5">04</span>
                    <div>
                      <h4 className="font-semibold text-white text-sm md:text-base">Motor de Búsqueda de Bitácora</h4>
                      <p className="text-xs text-slate-400 mt-1">
                        En la sección inferior de tu consola, cuentas con un motor de búsqueda inmutable. Puedes filtrar los logs por palabra clave o dirección IP.
                      </p>
                    </div>
                  </div>
                  <div className="flex gap-4 items-start pt-4 border-t border-white/5">
                    <span className="font-mono text-sm font-bold bg-white/5 text-slate-300 h-8 w-8 rounded-lg flex items-center justify-center shrink-0 border border-white/5">05</span>
                    <div>
                      <h4 className="font-semibold text-white text-sm md:text-base">Suite de Pruebas Unitarias (Testing)</h4>
                      <p className="text-xs text-slate-400 mt-1">
                        Dirígete a la pestaña <strong>"Suite de Pruebas Unitarias"</strong>. Tienes autorización de Auditoría para ejecutar y revisar las pruebas automatizadas del sistema, comprobando que las políticas de seguridad se cumplen a cabalidad en el motor criptográfico.
                      </p>
                    </div>
                  </div>
                </>
              )}

              {/* SUPPORT MANUAL (Level 2) */}
              {currentUser.level === 2 && (
                <>
                  <div className="flex gap-4 items-start pb-4 border-b border-white/5">
                    <span className="font-mono text-sm font-bold bg-white/5 text-slate-300 h-8 w-8 rounded-lg flex items-center justify-center shrink-0 border border-white/5">01</span>
                    <div>
                      <h4 className="font-semibold text-white text-sm md:text-base">Monitorización Básica de Tráfico</h4>
                      <p className="text-xs text-slate-400 mt-1">
                        Como personal de soporte, puedes observar el estado del tráfico y la salud de las conexiones del sistema. Esto es útil para confirmar si un usuario reporta un problema de acceso legítimo o si es una interrupción del servicio.
                      </p>
                    </div>
                  </div>
                  <div className="flex gap-4 items-start pb-4 border-b border-white/5">
                    <span className="font-mono text-sm font-bold bg-white/5 text-slate-300 h-8 w-8 rounded-lg flex items-center justify-center shrink-0 border border-white/5">02</span>
                    <div>
                      <h4 className="font-semibold text-white text-sm md:text-base">Revisión de Casos de Usuarios</h4>
                      <p className="text-xs text-slate-400 mt-1">
                        Puedes buscar el historial de actividad de un usuario específico usando el buscador rápido. Verifica cuándo fue su último inicio de sesión exitoso para ayudarle a diagnosticar olvidos de contraseña.
                      </p>
                    </div>
                  </div>
                  <div className="flex gap-4 items-start">
                    <span className="font-mono text-sm font-bold bg-white/5 text-slate-300 h-8 w-8 rounded-lg flex items-center justify-center shrink-0 border border-white/5">03</span>
                    <div>
                      <h4 className="font-semibold text-white text-sm md:text-base">Escalamiento de Alertas</h4>
                      <p className="text-xs text-slate-400 mt-1">
                        Si observas anomalías que salen de tus privilegios (como bloqueos de cuenta recurrentes o múltiples intentos fallidos desde una IP extraña), tu labor es escalar un ticket a los niveles SuperAdmin o Auditor para que apliquen correcciones severas.
                      </p>
                    </div>
                  </div>
                </>
              )}

              {/* BASIC USER MANUAL (Level 1) */}
              {currentUser.level === 1 && (
                <>
                  <div className="flex gap-4 items-start pb-4 border-b border-white/5">
                    <span className="font-mono text-sm font-bold bg-white/5 text-slate-300 h-8 w-8 rounded-lg flex items-center justify-center shrink-0 border border-white/5">01</span>
                    <div>
                      <h4 className="font-semibold text-white text-sm md:text-base">Mi Perfil y Conexión</h4>
                      <p className="text-xs text-slate-400 mt-1">
                        Desde tu panel principal puedes revisar los detalles de tu cuenta y asegurarte de que tu sesión es segura. Como usuario estándar, tus privilegios están limitados estrictamente a la gestión de tu propia cuenta (Solo Lectura).
                      </p>
                    </div>
                  </div>
                  <div className="flex gap-4 items-start pb-4 border-b border-white/5">
                    <span className="font-mono text-sm font-bold bg-white/5 text-slate-300 h-8 w-8 rounded-lg flex items-center justify-center shrink-0 border border-white/5">02</span>
                    <div>
                      <h4 className="font-semibold text-white text-sm md:text-base">Vinculación Segura SSO (Google)</h4>
                      <p className="text-xs text-slate-400 mt-1">
                        Puedes vincular de manera segura tu cuenta de Google en la pestaña "Mi Conexión". Esto te permitirá iniciar sesión rápidamente sin necesidad de recordar contraseñas, aprovechando la infraestructura de validación OAuth de Google.
                      </p>
                    </div>
                  </div>
                  <div className="flex gap-4 items-start">
                    <span className="font-mono text-sm font-bold bg-white/5 text-slate-300 h-8 w-8 rounded-lg flex items-center justify-center shrink-0 border border-white/5">03</span>
                    <div>
                      <h4 className="font-semibold text-white text-sm md:text-base">Privacidad en la Recuperación de Cuentas</h4>
                      <p className="text-xs text-slate-400 mt-1">
                        Por estrictas políticas de seguridad del SOC (prevención de ataques de Enumeración de Usuarios), el sistema está diseñado para nunca confirmar ni negar en pantalla si un correo está registrado. Esto evita que atacantes externos descubran la identidad de los usuarios registrados en Sentinel.
                      </p>
                    </div>
                  </div>
                </>
              )}

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
