/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import { 
  Key, Mail, LogIn, UserPlus, LogOut, ShieldCheck, 
  HelpCircle, Terminal, User as UserIcon, Globe, Info, 
  Settings, Sparkles, ToggleLeft, Activity, BellRing, CheckCircle,
  Eye, EyeOff
} from 'lucide-react';
import { useGoogleLogin } from '@react-oauth/google';
import { User, AuditLog, UserRole } from './types';
import ManualTabs from './components/ManualTabs';
import TestAutomation from './components/TestAutomation';
import EmailSandbox from './components/EmailSandbox';
import AdminPanel from './components/AdminPanel';

export default function App() {
  // Session persistence
  const [currentUser, setCurrentUser] = useState<Omit<User, 'passwordHash' | 'recoveryToken'> | null>(null);
  const [sessionToken, setSessionToken] = useState<string | null>(null);
  const [currentSessionId, setCurrentSessionId] = useState<string | null>(null);

  // View engine
  const [view, setView] = useState<'auth' | 'app'>('auth');
  const [subView, setSubView] = useState<'login' | 'register' | 'forgot' | 'reset'>('login');
  const [appTab, setAppTab] = useState<'dashboard' | 'admin' | 'manual' | 'testing'>(() => {
    return (localStorage.getItem('sentinel_app_tab') as any) || 'dashboard';
  });

  useEffect(() => {
    localStorage.setItem('sentinel_app_tab', appTab);
  }, [appTab]);

  // Registration & login fields state
  const [loginInput, setLoginInput] = useState('');
  const [loginPassword, setLoginPassword] = useState('');
  const [regUsername, setRegUsername] = useState('');
  const [regEmail, setRegEmail] = useState('');
  const [regFullName, setRegFullName] = useState('');
  const [regPassword, setRegPassword] = useState('');
  const [regConfirmPassword, setRegConfirmPassword] = useState('');

  // Password reset fields state
  const [forgotEmail, setForgotEmail] = useState('');
  const [resetToken, setResetToken] = useState('');
  const [resetPassword, setResetPassword] = useState('');

  // Password visibility states
  const [showLoginPassword, setShowLoginPassword] = useState(false);
  const [showRegPassword, setShowRegPassword] = useState(false);
  const [showRegConfirmPassword, setShowRegConfirmPassword] = useState(false);
  const [showResetPassword, setShowResetPassword] = useState(false);

  // Form interactive feedback states
  const [shakeForm, setShakeForm] = useState(false);
  const [hasLoginInputError, setHasLoginInputError] = useState(false);

  // Diagnostics & Logs
  const [usersList, setUsersList] = useState<Omit<User, 'passwordHash' | 'recoveryToken'>[]>([]);
  const [auditLogs, setAuditLogs] = useState<AuditLog[]>([]);
  const [notifications, setNotifications] = useState<any[]>([]);
  const [refreshSeed, setRefreshSeed] = useState(0);

  // Errors / Overlays
  const [apiError, setApiError] = useState<string | null>(null);
  const [apiSuccess, setApiSuccess] = useState<string | null>(null);
  const [systemAlertOverlay, setSystemAlertOverlay] = useState<string | null>(null);
  const [overrideUserRef, setOverrideUserRef] = useState<string | null>(null);

  // Audio simulation toggler
  const [audioEnabled, setAudioEnabled] = useState(true);

  // Google Simulator state
  const [googleSimulatorOpen, setGoogleSimulatorOpen] = useState(false);
  const [googleCustomEmail, setGoogleCustomEmail] = useState('');
  const [googleCustomName, setGoogleCustomName] = useState('');

  // Audio trigger
  const playPing = (type: 'success' | 'alert' | 'pop') => {
    if (!audioEnabled) return;
    try {
      const audioCtx = new (window.AudioContext || (window as any).webkitAudioContext)();
      const osc = audioCtx.createOscillator();
      const gain = audioCtx.createGain();
      
      osc.connect(gain);
      gain.connect(audioCtx.destination);

      if (type === 'success') {
        osc.frequency.setValueAtTime(587.33, audioCtx.currentTime); // D5
        osc.frequency.setValueAtTime(880, audioCtx.currentTime + 0.12); // A5
        gain.gain.setValueAtTime(0.08, audioCtx.currentTime);
        gain.gain.exponentialRampToValueAtTime(0.01, audioCtx.currentTime + 0.35);
        osc.start();
        osc.stop(audioCtx.currentTime + 0.45);
      } else if (type === 'alert') {
        osc.type = 'sawtooth';
        osc.frequency.setValueAtTime(140, audioCtx.currentTime);
        osc.frequency.exponentialRampToValueAtTime(80, audioCtx.currentTime + 0.25);
        gain.gain.setValueAtTime(0.12, audioCtx.currentTime);
        gain.gain.exponentialRampToValueAtTime(0.01, audioCtx.currentTime + 0.3);
        osc.start();
        osc.stop(audioCtx.currentTime + 0.35);
      } else {
        osc.frequency.setValueAtTime(440, audioCtx.currentTime);
        gain.gain.setValueAtTime(0.05, audioCtx.currentTime);
        gain.gain.exponentialRampToValueAtTime(0.01, audioCtx.currentTime + 0.1);
        osc.start();
        osc.stop(audioCtx.currentTime + 0.12);
      }
    } catch (e) {}
  };

  // Restore local storage session on mount
  useEffect(() => {
    const cachedUser = localStorage.getItem('secure_auth_user');
    const cachedToken = localStorage.getItem('secure_auth_token');
    const cachedSessionId = localStorage.getItem('secure_auth_session_id');

    if (cachedUser && cachedToken && cachedSessionId) {
      setCurrentUser(JSON.parse(cachedUser));
      setSessionToken(cachedToken);
      setCurrentSessionId(cachedSessionId);
      setView('app');
    }
  }, []);

  // Cross-tab split-brain synchronization
  useEffect(() => {
    const handleStorageChange = (e: StorageEvent) => {
      if (e.key === 'secure_auth_session_id' && e.newValue !== currentSessionId) {
        window.location.reload();
      }
    };
    window.addEventListener('storage', handleStorageChange);
    return () => window.removeEventListener('storage', handleStorageChange);
  }, [currentSessionId]);

  const syncAdminData = async () => {
    if (!currentUser || currentUser.level < 2) return;
    
    // Fallback protection just in case
    if (localStorage.getItem('secure_auth_session_id') !== currentSessionId) {
      window.location.reload();
      return;
    }

    try {
      let uRes, logRes, notifRes;

      if (currentUser.level >= 2 && currentUser.level !== 3) {
        uRes = await fetch('/api/admin/users');
      }
      if (currentUser.level >= 3) {
        logRes = await fetch('/api/admin/audit-logs');
        notifRes = await fetch('/api/admin/notifications');
      }

      if (uRes?.ok) setUsersList(await uRes.json());
      if (logRes?.ok) setAuditLogs(await logRes.json());
      if (notifRes?.ok) setNotifications(await notifRes.json());
    } catch (e) {
      console.error('Error syncing admin data', e);
    }
  };

  useEffect(() => {
    if (view === 'app' && currentUser && currentUser.level >= 2) {
      syncAdminData();
      const interval = setInterval(syncAdminData, 6000);
      return () => clearInterval(interval);
    }
  }, [view, currentUser, refreshSeed]);

  // Real-time Push (SSE) Client Handler
  useEffect(() => {
    if (!currentUser || !currentSessionId) return;

    // Connect to Server-Sent Events notifications
    const sse = new EventSource(`/api/notifications/stream?userId=${currentUser.id}`);

    sse.addEventListener('session_revoked', (e: MessageEvent) => {
      const data = JSON.parse(e.data);
      if (data.sessionId === currentSessionId) {
        // Enforce browser kick
        playPing('alert');
        localStorage.clear();
        setCurrentUser(null);
        setSessionToken(null);
        setCurrentSessionId(null);
        setView('auth');
        setSubView('login');
        setSystemAlertOverlay(`Sesión revocada remotamente: ${data.reason}`);
      }
    });

    sse.addEventListener('notification', (e: MessageEvent) => {
      const notif = JSON.parse(e.data);
      playPing('pop');
      setNotifications(prev => [notif, ...prev]);
    });

    sse.addEventListener('audit_update', (e: MessageEvent) => {
      const log = JSON.parse(e.data);
      setAuditLogs(prev => [log, ...prev]);
    });

    return () => {
      sse.close();
    };
  }, [currentUser, currentSessionId]);

  // Auto-dismiss feedback messages
  useEffect(() => {
    if (apiError || apiSuccess || systemAlertOverlay) {
      const timer = setTimeout(() => {
        setApiError(null);
        setApiSuccess(null);
        setSystemAlertOverlay(null);
      }, 6000);
      return () => clearTimeout(timer);
    }
  }, [apiError, apiSuccess, systemAlertOverlay]);

  // General login trigger
  const handleLogin = async (e: React.FormEvent, forceOverride = false) => {
    e.preventDefault();
    setApiError(null);
    setApiSuccess(null);
    setHasLoginInputError(false);

    // Basic fields validation
    if (!loginInput || !loginPassword) {
      setApiError("Por favor ingrese todos los campos requeridos.");
      setHasLoginInputError(true);
      return;
    }

    try {
      const response = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          usernameOrEmail: loginInput,
          password: loginPassword,
          overrideSession: forceOverride
        })
      });

      const data = await response.json();

      if (!response.ok) {
        setApiError(data.message || "Fallo de ingreso.");
        setHasLoginInputError(true);
        setShakeForm(true);
        playPing('alert');
        setTimeout(() => {
          setShakeForm(false);
        }, 500);
        return;
      }

      if (data.requiresSessionOverrideConfirm) {
        // Collisions flow! Prompt warning
        setOverrideUserRef(loginInput);
        playPing('alert');
        return;
      }

      if (data.success && data.user) {
        localStorage.setItem('secure_auth_user', JSON.stringify(data.user));
        localStorage.setItem('secure_auth_token', data.token || '');
        localStorage.setItem('secure_auth_session_id', data.sessionId || '');
        
        setCurrentUser(data.user);
        setSessionToken(data.token || null);
        setCurrentSessionId(data.sessionId || null);
        setHasLoginInputError(false);
        
        // Reset states
        setLoginPassword('');
        setOverrideUserRef(null);
        if (data.user) {
          setAppTab('dashboard');
        }
        setView('app');
        setApiSuccess("Conectado exitosamente.");
        playPing('success');
      }
    } catch (err) {
      setApiError("Error de comunicación de red con el servidor.");
      setHasLoginInputError(true);
      setShakeForm(true);
      setTimeout(() => {
        setShakeForm(false);
      }, 500);
    }
  };

  // Google Actual OAuth Integration
  const loginWithGoogle = useGoogleLogin({
    onSuccess: async (tokenResponse) => {
      setApiError(null);
      setApiSuccess(null);

      try {
        const response = await fetch('/api/auth/google', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            credential: tokenResponse.access_token
          })
        });

        const data = await response.json();
        if (!response.ok) {
          setApiError(data.message);
          playPing('alert');
          return;
        }

        if (data.success && data.user) {
          localStorage.setItem('secure_auth_user', JSON.stringify(data.user));
          localStorage.setItem('secure_auth_token', data.token || '');
          localStorage.setItem('secure_auth_session_id', data.sessionId || '');
          
          setCurrentUser(data.user);
          setSessionToken(data.token || null);
          setCurrentSessionId(data.sessionId || null);

          setView('app');
          setAppTab('dashboard');
          playPing('success');
        }
      } catch (err) {
        setApiError("Error contactando al servidor para verificar Google.");
      }
    },
    onError: () => {
      setApiError("Inicio de sesión de Google cancelado o fallido.");
      playPing('alert');
    }
  });

  // Registration callback
  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    setApiError(null);
    setApiSuccess(null);

    if (!regUsername || !regEmail || !regFullName || !regPassword || !regConfirmPassword) {
      setApiError("Se requieren todos los campos para el alta.");
      return;
    }

    if (regPassword !== regConfirmPassword) {
      setApiError("Las contraseñas no coinciden. Por favor verifique.");
      playPing('alert');
      return;
    }

    try {
      const response = await fetch('/api/auth/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          username: regUsername,
          email: regEmail,
          fullName: regFullName,
          password: regPassword
        })
      });

      const data = await response.json();
      if (!response.ok) {
        setApiError(data.message);
        playPing('alert');
        return;
      }

      setApiSuccess("¡Registro exitoso! Ya puede iniciar sesión abajo.");
      setSubView('login');
      setLoginInput(regUsername);
      setRegPassword('');
      setRegConfirmPassword('');
      playPing('success');
    } catch (err) {
      setApiError("Error de conexión al dar de alta al usuario.");
    }
  };

  // Logout callback
  const handleLogout = async () => {
    if (!currentUser) return;
    try {
      fetch('/api/auth/logout', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userId: currentUser.id,
          sessionId: currentSessionId
        })
      }).catch(() => {}); // Fire and forget
    } catch (e) {}

    localStorage.clear();
    setCurrentUser(null);
    setSessionToken(null);
    setCurrentSessionId(null);
    setView('auth');
    setSubView('login');
    setApiSuccess("Sesión cerrada correctamente.");
    playPing('pop');
  };

  // Forgot Password callback
  const handleForgotPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setApiError(null);
    setApiSuccess(null);

    if (!forgotEmail) {
      setApiError("Ingrese su dirección de correo por favor.");
      return;
    }

    try {
      const response = await fetch('/api/auth/forgot-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: forgotEmail })
      });
      const data = await response.json();
      setApiSuccess(data.message);
      setRefreshSeed(prev => prev + 1);
      playPing('success');
    } catch (err) {
      setApiError("Fallo de red en recuperación.");
    }
  };

  // Password Reset with Token callback
  const handleResetPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setApiError(null);
    setApiSuccess(null);

    if (!resetToken || !resetPassword) {
      setApiError("El token y la nueva contraseña son obligatorios.");
      return;
    }

    try {
      const response = await fetch('/api/auth/reset-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          token: resetToken,
          newPassword: resetPassword
        })
      });

      const data = await response.json();
      if (!response.ok) {
        setApiError(data.message);
        playPing('alert');
        return;
      }

      setApiSuccess(data.message);
      setSubView('login');
      setResetPassword('');
      setResetToken('');
      setRefreshSeed(prev => prev + 1);
      playPing('success');
    } catch (e) {
      setApiError("Error al procesar el cambio definitivo de contraseña.");
    }
  };

  const handleClearNotifications = async () => {
    try {
      await fetch('/api/admin/notifications/read', { method: 'POST' });
      syncAdminData();
    } catch (e) {}
  };

  return (
    <div className="min-h-screen bg-[#0A0A0A] text-slate-200 flex flex-col justify-between font-sans selection:bg-blue-600/30 selection:text-slate-100 outline-none" id="main-frame-wrapper" tabIndex={-1}>
      
      {/* HEADER BAR */}
      <header className="bg-[#0F0F0F] border-b border-white/10 sticky top-0 z-40 transition-colors" id="app-nav-bar">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="h-9 w-9 bg-blue-600 rounded-lg flex items-center justify-center text-white font-black" id="brand-launcher">
              <ShieldCheck className="w-5.5 h-5.5" />
            </div>
            <div>
              <h1 className="text-sm font-extrabold text-white tracking-tight leading-none uppercase">SENTI<span className="text-blue-500">NEL</span></h1>
              <span className="text-[9px] text-slate-500 font-mono tracking-widest uppercase">Centro de Operaciones de Seguridad</span>
            </div>
          </div>

          <div className="flex items-center gap-3">
            {/* Audio Toggle button */}
            <button
              onClick={() => { setAudioEnabled(!audioEnabled); playPing('pop'); }}
              className={`p-1.5 rounded-lg border text-xs font-semibold flex items-center gap-1.5 transition-all ${
                audioEnabled 
                  ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20' 
                  : 'bg-white/5 text-slate-500 border-white/10'
              }`}
              title="Activar/Desactivar efectos de audio del sistema"
            >
              <BellRing className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">{audioEnabled ? 'Efectos Activos' : 'Silencio'}</span>
            </button>

            {/* Authenticated Controls */}
            {currentUser ? (
              <div className="flex items-center gap-2" id="nav-user-chip">
                <div className="relative shrink-0">
                  <img 
                    src={currentUser.avatarUrl || "https://api.dicebear.com/7.x/initials/svg?seed=?"} 
                    alt="Perfil" 
                    referrerPolicy="no-referrer"
                    className="w-8 h-8 rounded-full border border-white/10"
                  />
                  <span className="absolute bottom-0 right-0 block h-2 w-2 rounded-full bg-emerald-500 ring-1 ring-[#0A0A0A] animate-pulse" title="En línea" />
                </div>
                <div className="hidden md:block leading-none mr-2 space-y-1">
                  <div className="flex items-center gap-1.5">
                    <p className="text-xs font-bold text-white">{currentUser.fullName}</p>
                    <span className="inline-flex items-center px-1.5 py-0.5 rounded-md bg-emerald-500/15 text-emerald-400 border border-emerald-500/20 text-[8px] font-bold uppercase tracking-wider shrink-0">
                      En Línea
                    </span>
                  </div>
                  <p className="text-[9px] font-mono font-bold text-blue-400 uppercase">{currentUser.role}</p>
                </div>
                <button
                  onClick={handleLogout}
                  className="p-1.5 sm:p-1 sm:px-3 bg-red-500/10 hover:bg-red-500/20 text-red-400 border border-red-500/20 rounded-lg text-xs font-bold transition-all flex items-center justify-center gap-1 uppercase tracking-wider"
                  id="btn-nav-logout"
                  title="Cerrar sesión"
                >
                  <LogOut className="w-3.5 h-3.5 sm:w-3 sm:h-3" />
                  <span className="hidden sm:inline">Salir</span>
                </button>
              </div>
            ) : (
              <span className="text-[10px] text-slate-500 font-mono italic">Sin Autenticar</span>
            )}
          </div>
        </div>
      </header>

      {/* CORE BODY WRAPPER */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 flex-1 w-full space-y-8 outline-none" id="core-main-body" tabIndex={-1}>
        
        {/* API FEEDS FEEDBACK BAR */}
        {(apiSuccess || systemAlertOverlay) && (
          <div className="space-y-2 animate-fade-in" id="feedbacks-container">
            {apiSuccess && (
              <div className="p-4 bg-emerald-500/10 border border-emerald-500/20 text-emerald-200 rounded-xl text-xs font-semibold flex items-center gap-2">
                <CheckCircle className="w-4 h-4 text-emerald-400 grow-0 shrink-0" />
                <span>{apiSuccess}</span>
              </div>
            )}
            {systemAlertOverlay && (
              <div className="p-4 bg-amber-500/10 border border-amber-500/20 text-amber-200 rounded-xl text-xs font-bold flex flex-col sm:flex-row sm:items-center justify-between gap-3 shadow-md">
                <div className="flex items-center gap-2">
                  <span className="h-2 w-2 rounded-full bg-amber-500 animate-ping" />
                  <span>{systemAlertOverlay}</span>
                </div>
                <button 
                  onClick={() => setSystemAlertOverlay(null)} 
                  className="px-2.5 py-1 bg-amber-600 text-white rounded text-[10px] font-semibold uppercase hover:bg-amber-550 transition-colors"
                >
                  Cerrar Aviso
                </button>
              </div>
            )}
          </div>
        )}

        {/* CONTROLS MODALS / AUTH LAYOUT */}
        {view === 'auth' ? (
          <div className="max-w-md mx-auto bg-[#141414] rounded-2xl border border-white/5 shadow-2xl overflow-hidden p-6 md:p-8 space-y-6 animate-slide-up" id="auth-sub-frame">
            
            {/* Nav Auth Subviews */}
            <div className="flex border-b border-white/10 pb-3 justify-center gap-4">
              <button
                onClick={() => { setSubView('login'); setApiError(null); setApiSuccess(null); }}
                className={`text-sm font-bold pb-2 transition-all border-b-2 ${
                  subView === 'login' ? 'border-blue-500 text-blue-500' : 'border-transparent text-slate-500 hover:text-slate-300'
                }`}
                id="tab-login"
              >
                Inicia Sesión
              </button>
              <button
                onClick={() => { setSubView('register'); setApiError(null); setApiSuccess(null); }}
                className={`text-sm font-bold pb-2 transition-all border-b-2 ${
                  subView === 'register' ? 'border-blue-500 text-blue-500' : 'border-transparent text-slate-500 hover:text-slate-300'
                }`}
                id="tab-register"
              >
                Registro Seguro
              </button>
            </div>

            {/* COLLISION DETECTOR PROMPT */}
            {overrideUserRef && (
              <div className="p-4 bg-amber-500/10 border border-amber-500/20 rounded-xl space-y-3" id="session-override-alert">
                <h4 className="text-xs font-bold text-amber-300 flex items-center gap-1.5 uppercase tracking-wide">
                  <Activity className="w-4 h-4 text-amber-400 animate-pulse" />
                  Sesión activa previa detectada
                </h4>
                <p className="text-[11px] text-amber-200/80 leading-relaxed">
                  Ya existe una sesión abierta para este usuario en otro navegador de internet. Si continúas, esa sesión será <strong>revocada y cerrada automáticamente</strong> en tiempo real.
                </p>
                <div className="flex gap-2">
                  <button
                    onClick={(e) => handleLogin(e, true)}
                    className="px-3 py-1.5 bg-amber-600 hover:bg-amber-500 text-white text-xs font-bold rounded-lg transition-all cursor-pointer"
                    id="btn-confirm-override"
                  >
                    Sí, cerrar anterior e ingresar aquí
                  </button>
                  <button
                    onClick={() => { setOverrideUserRef(null); setLoginPassword(''); }}
                    className="px-3 py-1.5 bg-white/5 hover:bg-white/10 text-slate-300 text-xs font-semibold rounded-lg transition-all cursor-pointer"
                    id="btn-cancel-override"
                  >
                    Cancelar
                  </button>
                </div>
              </div>
            )}

            {/* VIEW SUBFORM: LOGIN */}
            {subView === 'login' && !overrideUserRef && (
              <form onSubmit={(e) => handleLogin(e, false)} className={`space-y-4 animate-fade-in ${shakeForm ? 'shake' : ''}`} id="form-login">
                <div className="text-center space-y-1 mb-2">
                  <h3 className="text-base font-bold text-white">Bienvenido de vuelta</h3>
                  <p className="text-xs text-slate-400">Ingrese sus credenciales de acceso analítico.</p>
                </div>

                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-slate-300 block">Usuario o Correo</label>
                  <input
                    type="text"
                    required
                    placeholder="ej. admin o admin@example.com"
                    value={loginInput}
                    onChange={(e) => {
                      setLoginInput(e.target.value);
                      if (hasLoginInputError) setHasLoginInputError(false);
                    }}
                    className={`w-full p-2.5 text-xs rounded-xl border bg-[#0A0A0A] text-slate-200 focus:outline-hidden focus:border-blue-500 placeholder-slate-600 transition-all ${
                      hasLoginInputError ? 'input-error border-red-500 ring-1 ring-red-500/30' : 'border-white/10'
                    }`}
                    id="login-username"
                  />
                </div>

                <div className="space-y-1.5">
                  <div className="flex justify-between items-center">
                    <label className="text-xs font-bold text-slate-300">Contraseña</label>
                    <button
                      type="button"
                      onClick={() => setSubView('forgot')}
                      className="text-[11px] font-semibold text-blue-400 hover:underline cursor-pointer"
                    >
                      ¿Olvidaste tu contraseña?
                    </button>
                  </div>
                  <div className="relative">
                    <input
                      type={showLoginPassword ? "text" : "password"}
                      required
                      placeholder="Contraseña del sistema"
                      value={loginPassword}
                      onChange={(e) => {
                        setLoginPassword(e.target.value);
                        if (hasLoginInputError) setHasLoginInputError(false);
                      }}
                      className={`w-full pl-2.5 pr-10 py-2.5 text-xs rounded-xl border bg-[#0A0A0A] text-slate-200 focus:outline-hidden focus:border-blue-500 placeholder-slate-600 transition-all ${
                        hasLoginInputError ? 'input-error border-red-500 ring-1 ring-red-500/30' : 'border-white/10'
                      }`}
                      id="login-password"
                    />
                    <button
                      type="button"
                      onClick={() => setShowLoginPassword(!showLoginPassword)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-white transition-colors cursor-pointer"
                      title={showLoginPassword ? "Ocultar contraseña" : "Mostrar contraseña"}
                    >
                      {showLoginPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </button>
                  </div>
                </div>

                {hasLoginInputError && apiError && (
                  <div className="text-xs text-red-400 bg-red-950/40 border border-red-900/50 p-2.5 rounded-xl text-left animate-fade-in flex items-start gap-2" id="inline-login-error">
                    <span className="text-sm">⚠️</span>
                    <div>
                      <p className="font-bold">Error de Autenticación</p>
                      <p className="text-[10px] text-red-300 mt-0.5 leading-tight">{apiError}</p>
                    </div>
                  </div>
                )}

                <button
                  type="submit"
                  className="w-full py-2.5 bg-blue-600 hover:bg-blue-500 text-white text-xs font-bold rounded-xl transition-all shadow-md shadow-blue-500/10 flex items-center justify-center gap-1.5 uppercase tracking-wide cursor-pointer active:scale-98"
                  id="btn-submit-login"
                >
                  <LogIn className="w-4 h-4" />
                  Iniciar Sesión
                </button>

                {/* Simulated Google Sign-In button container */}
                <div className="relative flex py-2 items-center">
                  <div className="flex-grow border-t border-white/10"></div>
                  <span className="flex-shrink mx-4 text-slate-500 text-[10px] tracking-wider uppercase font-mono">o</span>
                  <div className="flex-grow border-t border-white/10"></div>
                </div>

                <button
                  type="button"
                  onClick={() => loginWithGoogle()}
                  className="w-full py-2.5 bg-white/5 hover:bg-white/10 text-slate-200 border border-white/10 text-xs font-bold rounded-xl transition-all flex items-center justify-center gap-2 shadow-xs cursor-pointer active:scale-98"
                  id="btn-google-real"
                >
                  {/* Google Custom identity SVG */}
                  <svg className="w-4 h-4 shrink-0" viewBox="0 0 24 24">
                    <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
                    <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
                    <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z"/>
                    <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z"/>
                  </svg>
                  Inicia con Google
                </button>
              </form>
            )}

            {/* VIEW SUBFORM: REGISTER */}
            {subView === 'register' && (
              <form onSubmit={handleRegister} className="space-y-4 animate-fade-in animate-slide-up" id="form-register">
                <div className="text-center space-y-1 mb-2">
                  <h3 className="text-base font-bold text-white">Crear una cuenta nueva</h3>
                  <p className="text-xs text-slate-400">Complete los datos para su registro seguro.</p>
                </div>

                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-slate-300 block text-left">Nombre de Usuario (Username)</label>
                  <input
                    type="text"
                    required
                    placeholder="ej. paco"
                    value={regUsername}
                    onChange={(e) => setRegUsername(e.target.value.toLowerCase().trim())}
                    className="w-full p-2.5 text-xs rounded-xl border border-white/10 bg-[#0A0A0A] text-slate-200 focus:outline-hidden focus:border-blue-500 placeholder-slate-600"
                    id="reg-username"
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-slate-300 block text-left">Correo Electrónico</label>
                  <input
                    type="email"
                    required
                    placeholder="ej. paco@example.com"
                    value={regEmail}
                    onChange={(e) => setRegEmail(e.target.value)}
                    className="w-full p-2.5 text-xs rounded-xl border border-white/10 bg-[#0A0A0A] text-slate-200 focus:outline-hidden focus:border-blue-500 placeholder-slate-600"
                    id="reg-email"
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-slate-300 block text-left">Nombre completo</label>
                  <input
                    type="text"
                    required
                    placeholder="ej. Francisco Ramirez"
                    value={regFullName}
                    onChange={(e) => setRegFullName(e.target.value)}
                    className="w-full p-2.5 text-xs rounded-xl border border-white/10 bg-[#0A0A0A] text-slate-200 focus:outline-hidden focus:border-blue-500 placeholder-slate-600"
                    id="reg-fullname"
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-slate-300 block text-left">Contraseña segura</label>
                  <div className="relative">
                    <input
                      type={showRegPassword ? "text" : "password"}
                      required
                      placeholder="Contraseña robusta"
                      value={regPassword}
                      onChange={(e) => setRegPassword(e.target.value)}
                      className="w-full pl-2.5 pr-10 py-2.5 text-xs rounded-xl border border-white/10 bg-[#0A0A0A] text-slate-200 focus:outline-hidden focus:border-blue-500 placeholder-slate-600"
                      id="reg-password"
                    />
                    <button
                      type="button"
                      onClick={() => setShowRegPassword(!showRegPassword)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-white transition-colors cursor-pointer"
                      title={showRegPassword ? "Ocultar contraseña" : "Mostrar contraseña"}
                    >
                      {showRegPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </button>
                  </div>
                </div>

                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-slate-300 block text-left">Confirmar Contraseña</label>
                  <div className="relative">
                    <input
                      type={showRegConfirmPassword ? "text" : "password"}
                      required
                      placeholder="Repita su contraseña"
                      value={regConfirmPassword}
                      onChange={(e) => setRegConfirmPassword(e.target.value)}
                      className="w-full pl-2.5 pr-10 py-2.5 text-xs rounded-xl border border-white/10 bg-[#0A0A0A] text-slate-200 focus:outline-hidden focus:border-blue-500 placeholder-slate-600"
                      id="reg-confirm-password"
                    />
                    <button
                      type="button"
                      onClick={() => setShowRegConfirmPassword(!showRegConfirmPassword)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-white transition-colors cursor-pointer"
                      title={showRegConfirmPassword ? "Ocultar contraseña" : "Mostrar contraseña"}
                    >
                      {showRegConfirmPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </button>
                  </div>
                </div>

                <button
                  type="submit"
                  className="w-full py-2.5 bg-blue-600 hover:bg-blue-500 text-white text-xs font-bold rounded-xl transition-all shadow-md shadow-blue-500/10 flex items-center justify-center gap-1.5 uppercase tracking-wide cursor-pointer active:scale-98"
                  id="btn-submit-register"
                >
                  <UserPlus className="w-4 h-4" />
                  Registrar e Ingresar
                </button>

                {apiError && (
                  <div className="text-xs text-red-400 bg-red-950/40 border border-red-900/50 p-2.5 rounded-xl text-left animate-fade-in flex items-start gap-2" id="inline-register-error">
                    <span className="text-sm">⚠️</span>
                    <div>
                      <p className="font-bold">Error de Registro</p>
                      <p className="text-[10px] text-red-300 mt-0.5 leading-tight">{apiError}</p>
                    </div>
                  </div>
                )}
              </form>
            )}

            {/* VIEW SUBFORM: FORGOT PASSWORD */}
            {subView === 'forgot' && (
              <form onSubmit={handleForgotPassword} className="space-y-4 animate-fade-in" id="form-forgot">
                <div className="text-center space-y-1 mb-2">
                  <h3 className="text-base font-bold text-white">Restablecer contraseña</h3>
                  <p className="text-xs text-slate-400 font-normal">Introduzca su correo. Se generará un enlace temporal.</p>
                </div>

                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-slate-300 block text-left">Correo Electrónico de la Cuenta</label>
                  <input
                    type="email"
                    required
                    placeholder="ej. admin@example.com"
                    value={forgotEmail}
                    onChange={(e) => setForgotEmail(e.target.value)}
                    className="w-full p-2.5 text-xs rounded-xl border border-white/10 bg-[#0A0A0A] text-slate-200 focus:outline-hidden focus:border-blue-500 placeholder-slate-600"
                    id="forgot-email-input"
                  />
                </div>

                <button
                  type="submit"
                  className="w-full py-2.5 bg-blue-600 hover:bg-blue-500 text-white text-xs font-bold rounded-xl transition-all shadow-md flex items-center justify-center gap-1.5 uppercase cursor-pointer"
                  id="btn-forgot-submit"
                >
                  <Mail className="w-4 h-4" />
                  Emitir Token de Recuperación
                </button>

                {apiError && (
                  <div className="text-xs text-red-400 bg-red-950/40 border border-red-900/50 p-2.5 rounded-xl text-left animate-fade-in flex items-start gap-2" id="inline-forgot-error">
                    <span className="text-sm">⚠️</span>
                    <div>
                      <p className="font-bold">Error de Recuperación</p>
                      <p className="text-[10px] text-red-300 mt-0.5 leading-tight">{apiError}</p>
                    </div>
                  </div>
                )}

                <button
                  type="button"
                  onClick={() => setSubView('login')}
                  className="w-full text-center text-xs text-slate-400 hover:text-white hover:underline cursor-pointer"
                >
                  Volver a Inicio de Sesión
                </button>
              </form>
            )}

            {/* VIEW SUBFORM: RESET PASSWORD WITH ACTIVE TOKEN */}
            {subView === 'reset' && (
              <form onSubmit={handleResetPassword} className="space-y-4 animate-fade-in" id="form-reset">
                <div className="text-center space-y-1 mb-2">
                  <h3 className="text-base font-bold text-white">Canjear Contraseña</h3>
                  <p className="text-xs text-slate-400">Un enlace temporal te trajo aquí. Proceda a licuar la clave.</p>
                </div>

                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-slate-300 block text-left">Token de Seguridad (Automático)</label>
                  <input
                    type="text"
                    required
                    readOnly
                    placeholder="Token temporario"
                    value={resetToken}
                    className="w-full p-2.5 text-xs rounded-xl border border-white/10 bg-[#121212] text-slate-400 font-mono focus:outline-hidden"
                    id="reset-token-input"
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-slate-300 block text-left">Nueva Contraseña Segura</label>
                  <div className="relative">
                    <input
                      type={showResetPassword ? "text" : "password"}
                      required
                      placeholder="Nueva clave del sistema"
                      value={resetPassword}
                      onChange={(e) => setResetPassword(e.target.value)}
                      className="w-full pl-2.5 pr-10 py-2.5 text-xs rounded-xl border border-white/10 bg-[#0A0A0A] text-slate-200 focus:outline-hidden focus:border-blue-500 placeholder-slate-600"
                      id="reset-password-input"
                    />
                    <button
                      type="button"
                      onClick={() => setShowResetPassword(!showResetPassword)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-white transition-colors cursor-pointer"
                      title={showResetPassword ? "Ocultar contraseña" : "Mostrar contraseña"}
                    >
                      {showResetPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </button>
                  </div>
                </div>

                <button
                  type="submit"
                  className="w-full py-2.5 bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold rounded-xl transition-all shadow-md flex items-center justify-center gap-1.5 uppercase cursor-pointer"
                  id="btn-reset-submit"
                >
                  Licuar clave (Hashing BCrypt) & Quemar Token
                </button>

                {apiError && (
                  <div className="text-xs text-red-400 bg-red-950/40 border border-red-900/50 p-2.5 rounded-xl text-left animate-fade-in flex items-start gap-2" id="inline-reset-error">
                    <span className="text-sm">⚠️</span>
                    <div>
                      <p className="font-bold">Error al Restablecer</p>
                      <p className="text-[10px] text-red-300 mt-0.5 leading-tight">{apiError}</p>
                    </div>
                  </div>
                )}

                <button
                  type="button"
                  onClick={() => { setSubView('login'); setResetToken(''); }}
                  className="w-full text-center text-xs text-slate-400 hover:text-white hover:underline cursor-pointer"
                >
                  Cancelar
                </button>
              </form>
            )}
          </div>
        ) : (
          /* SYSTEM INTERNAL APPLICATION INTERFACE (User Logged-In view) */
          <div className="space-y-8 animate-fade-in outline-none" id="private-app-view" tabIndex={-1}>
            
            {/* Nav app tabs */}
            <div className="flex bg-[#0F0F0F] p-2 pb-3 gap-1.5 rounded-2xl border border-white/5 sticky top-16 z-30 overflow-x-auto thin-scrollbar outline-none" id="nav-app-tabs-container" tabIndex={-1}>
              {currentUser && (
                <button
                  onClick={() => setAppTab('dashboard')}
                  className={`flex items-center gap-1.5 px-4 py-2 text-xs font-extrabold rounded-xl transition-all uppercase tracking-wider whitespace-nowrap cursor-pointer ${
                    appTab === 'dashboard'
                      ? 'bg-blue-600 text-white shadow-md shadow-blue-500/10'
                      : 'text-slate-400 hover:text-white hover:bg-white/5'
                  }`}
                  id="tab-btn-dash"
                >
                  <Activity className="w-4 h-4" />
                  Mi Conexión
                </button>
              )}
              
              {currentUser && currentUser.level >= 3 && (
                <button
                  onClick={() => setAppTab('admin')}
                  className={`flex items-center gap-1.5 px-4 py-2 text-xs font-extrabold rounded-xl transition-all uppercase tracking-wider whitespace-nowrap cursor-pointer ${
                    appTab === 'admin'
                      ? 'bg-blue-600 text-white shadow-md shadow-blue-500/10'
                      : 'text-slate-400 hover:text-white hover:bg-white/5'
                  }`}
                  id="tab-btn-admin"
                >
                  <Settings className="w-4 h-4" />
                  {currentUser.level >= 5 ? "Consola de Administrador" : currentUser.level === 4 ? "Consola de Moderador" : "Consola de Auditor"}
                </button>
              )}

              {currentUser && (currentUser.level === 5 || currentUser.level === 3) && (
                <button
                  onClick={() => setAppTab('testing')}
                  className={`flex items-center gap-1.5 px-4 py-2 text-xs font-extrabold rounded-xl transition-all uppercase tracking-wider whitespace-nowrap cursor-pointer ${
                    appTab === 'testing'
                      ? 'bg-blue-600 text-white shadow-md shadow-blue-500/10'
                      : 'text-slate-400 hover:text-white hover:bg-white/5'
                  }`}
                  id="tab-btn-testing"
                >
                  <Terminal className="w-4 h-4" />
                  Suite de Pruebas Unitarias
                </button>
              )}

              <button
                onClick={() => setAppTab('manual')}
                className={`flex items-center gap-1.5 px-4 py-2 text-xs font-extrabold rounded-xl transition-all uppercase tracking-wider whitespace-nowrap cursor-pointer ${
                  appTab === 'manual'
                    ? 'bg-blue-600 text-white shadow-md shadow-blue-500/10'
                    : 'text-slate-400 hover:text-white hover:bg-white/5'
                }`}
                id="tab-btn-manual"
              >
                <HelpCircle className="w-4 h-4" />
                Informe y Manual
              </button>
            </div>

            {/* TAB INTERACTIVE CONTENT PANEL */}
            <div className="transition-all duration-300 outline-none" id="core-main-body" tabIndex={-1}>
              {appTab === 'dashboard' && currentUser && (
                <div className="grid grid-cols-1 md:grid-cols-3 gap-8 outline-none" id="dashboard-main-view" tabIndex={-1}>
                  {/* Left Column (Quick summary & session cards) */}
                  <div className="space-y-6">
                    <div className="bg-[#141414] rounded-2xl border border-white/5 p-6 shadow-lg relative overflow-hidden" id="dashboard-user-hero">
                      <div className="flex items-center gap-4">
                        <div className="relative shrink-0">
                          <img 
                            src={currentUser.avatarUrl || "https://api.dicebear.com/7.x/initials/svg?seed=?"} 
                            alt="Avatar" 
                            referrerPolicy="no-referrer"
                            className="w-14 h-14 rounded-full border border-white/15 shrink-0 object-cover" 
                          />
                          <span className="absolute bottom-0 right-0 block h-3.5 w-3.5 rounded-full bg-emerald-500 ring-2 ring-[#141414] animate-pulse" title="En línea" />
                        </div>
                        <div className="min-w-0 flex-1">
                          <h3 className="text-base font-bold text-white leading-snug break-words">{currentUser.fullName}</h3>
                          <p className="text-xs text-slate-500 font-mono mt-1">@{currentUser.username}</p>
                          <div className="mt-2 text-[10px] font-bold font-mono text-blue-400 bg-blue-500/10 border border-blue-500/20 rounded-lg p-1 px-2 w-fit">
                            Perfil: {currentUser.role.toUpperCase()}
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* Mostrar Detalles de Sesión SÓLO si es Nivel >= 3 */}
                    {currentUser.level >= 3 && (
                      <div className="bg-[#141414] rounded-2xl border border-white/5 p-6 shadow-lg space-y-4" id="active-session-widget">
                        <div>
                          <h4 className="font-bold text-white text-xs uppercase tracking-wider flex items-center gap-1.5">
                            <Globe className="w-4.5 h-4.5 text-blue-400" />
                            Detalle de Sesión Exclusiva
                          </h4>
                          <p className="text-[11px] text-slate-500 mt-0.5">La huella inmutable asociada a este navegador.</p>
                        </div>

                        <div className="space-y-3 font-mono text-[11px] bg-[#0A0A0A] rounded-xl p-4 border border-white/5">
                          <div className="flex justify-between border-b border-white/5 pb-2">
                            <span className="text-slate-500">Identificador:</span>
                            <span className="text-slate-300 font-semibold text-right">{currentSessionId}</span>
                          </div>
                          <div className="flex justify-between border-b border-white/5 pb-2">
                            <span className="text-slate-500">Navegador:</span>
                            <span className="text-slate-300 font-semibold text-right text-[10px]">{currentUser.activeSessionBrowser || 'Chrome'}</span>
                          </div>
                          <div className="flex justify-between border-b border-white/5 pb-2">
                            <span className="text-slate-500">Dirección IP:</span>
                            <span className="text-slate-300 font-semibold text-right">{currentUser.activeSessionIp || '127.0.0.1'}</span>
                          </div>
                          <div className="flex justify-between">
                            <span className="text-slate-500">Iniciado el:</span>
                            <span className="text-slate-300 font-semibold text-right">{currentUser.activeSessionStartedAt ? new Date(currentUser.activeSessionStartedAt).toLocaleTimeString() : 'Ahora'}</span>
                          </div>
                        </div>
                      </div>
                    )}
                  </div>

                  {/* Right Column */}
                  <div className="md:col-span-2 bg-[#141414] rounded-2xl border border-white/5 p-6 md:p-8 shadow-lg space-y-6" id="dashboard-general-intro">
                    <div>
                      <h3 className="text-lg font-bold text-white flex items-center gap-2">
                        {currentUser.level >= 3 ? <ShieldCheck className="w-5 h-5 text-blue-400" /> : <Info className="w-5 h-5 text-blue-400" />}
                        Bienvenido a SENTINEL: Plataforma de Seguridad
                      </h3>
                      <p className="text-xs text-slate-400 mt-1">
                        Estás conectado de manera segura. Tu perfil actual está limitado a las capacidades de tu rol ({currentUser.role}).
                      </p>
                    </div>

                    {currentUser.level >= 3 ? (
                      <>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                          <div className="border border-white/5 rounded-xl p-4 space-y-1.5 bg-[#0A0A0A]">
                            <h4 className="font-semibold text-xs uppercase tracking-wider text-blue-400">Control de Sesión Único</h4>
                            <p className="text-[11px] text-slate-400 leading-relaxed">
                              La base de datos realiza un seguimiento continuo de tu navegador. Si abres este mismo usuario en otra pantalla e inicias sesión de manera simultánea, el servidor disparará una notificación de revocación en tiempo real desconectando este terminal al instante.
                            </p>
                          </div>

                          <div className="border border-white/5 rounded-xl p-4 space-y-1.5 bg-[#0A0A0A]">
                            <h4 className="font-semibold text-xs uppercase tracking-wider text-blue-400">Mitigación Brute Force</h4>
                            <p className="text-[11px] text-slate-400 leading-relaxed">
                              Nuestra protección de logins deshabilita y congela transitoriamente las tentativas ilegítimas después del tercer password erróneo sucesivo, emitiendo trazas de incidentes que pueden ser validadas en la pestaña de la Auditoría.
                            </p>
                          </div>
                        </div>

                        <div className="bg-amber-500/10 rounded-xl p-4 border border-amber-500/20 text-xs text-amber-200 flex items-start gap-2.5">
                          <Info className="w-5 h-5 text-amber-400 shrink-0 mt-0.5" />
                          <div>
                            <h5 className="font-bold text-amber-300">¿Cómo probar la funcionalidad de Sesión Única?</h5>
                            <p className="mt-1 leading-relaxed text-[11px] text-amber-200/80">
                              Para presenciar la potencia del Server-Sent Events (SSE), mantén abierta esta ventana, abre una nueva ventana en <strong>modo incógnito</strong> de tu navegador e intenta loguearte con este mismo usuario (<code>@{currentUser.username}</code>). Al aceptar sobreescribir la sesión en el segundo navegador, advertirás cómo esta primera interfaz de forma sincronizada se desvanece de inmediato informándote del redireccionamiento preventivo.
                            </p>
                          </div>
                        </div>
                      </>
                    ) : (
                      <div className="bg-blue-500/10 rounded-xl p-4 border border-blue-500/20 text-xs text-blue-200 flex items-start gap-2.5">
                        <Info className="w-5 h-5 text-blue-400 shrink-0 mt-0.5" />
                        <div>
                          <h5 className="font-bold text-blue-300">Perfil Estándar Restringido</h5>
                          <p className="mt-1 leading-relaxed text-[11px] text-blue-200/80">
                            Como usuario estándar, no tienes acceso a las consolas administrativas, a los registros criptográficos ni a la suite de pruebas unitarias. Si necesitas privilegios adicionales, contacta al Administrador de Seguridad para escalar tu perfil.
                          </p>
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              )}

              {appTab === 'admin' && currentUser && currentUser.level >= 2 && (
                <AdminPanel
                  currentUser={currentUser}
                  auditLogs={auditLogs}
                  onRefreshAudit={syncAdminData}
                  onRefreshUsers={syncAdminData}
                  users={usersList}
                  notifications={notifications}
                  onClearNotifications={handleClearNotifications}
                />
              )}

              {appTab === 'testing' && <TestAutomation />}

              {appTab === 'manual' && <ManualTabs />}
            </div>

          </div>
        )}

      </main>

      {/* FOOTER AREA DISPLAYING THE CRITICAL EMAIL SANDBOX */}
      <footer className="bg-[#0F0F0F] border-t border-white/10 mt-12 py-8 px-4 sm:px-6 lg:px-8 shadow-xs" id="app-footer">
        <div className="max-w-7xl mx-auto space-y-8">
          
          {/* SANDBOX CONTAINER */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 items-start">
            <div className="lg:col-span-1 space-y-3">
              <span className="text-[10px] font-bold font-mono tracking-widest text-blue-400 uppercase">Servidor de Correo Interno</span>
              <h2 className="text-base font-extrabold text-white tracking-tight leading-none">SMTP Relay Corporativo</h2>
              <p className="text-xs text-slate-400 leading-relaxed">
                Este panel captura el tráfico de correos de seguridad para restablecimientos de claves en tiempo real de forma local, sincronizado con la base persistente <code>database.json</code>.
              </p>
            </div>
            
            <div className="lg:col-span-2">
              <EmailSandbox 
                onSelectToken={(token) => {
                  setResetToken(token);
                  setView('auth');
                  setSubView('reset');
                  setApiSuccess("¡Vínculo de recuperación detectado! Por favor, ingrese su nueva clave.");
                  playPing('success');
                }}
                refreshTrigger={refreshSeed}
              />
            </div>
          </div>

          <div className="pt-6 border-t border-white/5 flex flex-col md:flex-row items-center justify-between gap-4 text-xs font-mono text-slate-500">
            <span>UNSM - © 2026 SENTINEL | Plataforma de Control de Autenticación de Alta Gama</span>
            <span className="flex items-center gap-1">
              <span className="h-1.5 w-1.5 bg-emerald-500 rounded-full animate-pulse" />
              Sesión Única de Red: Activa en Contenedores de Cloud Run
            </span>
          </div>
        </div>
      </footer>
    </div>
  );
}

