/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect, useRef, useMemo } from 'react';
import {
  Users, ShieldAlert, FileSliders, Search, ShieldX,
  UserCheck, RefreshCw, Key, LogOut, CheckCircle,
  Trash2, ShieldCheck, HeartPulse, Clock, Globe,
  UserPlus, PlusCircle, Shield, Award, Edit, Eye, EyeOff,
  Activity, AlertTriangle, Monitor, ShieldEllipsis, Chrome, X, ChevronDown
} from 'lucide-react';
import { User, AuditLog, UserRole, CustomRole } from '../../types';
import {
  PieChart, Pie, Cell, ResponsiveContainer, Tooltip, Legend,
  BarChart, Bar, XAxis, YAxis, CartesianGrid, LineChart, Line
} from 'recharts';


interface AdminPanelProps {
  currentUser: Omit<User, 'passwordHash' | 'recoveryToken'>;
  auditLogs: AuditLog[];
  onRefreshAudit: () => void;
  onRefreshUsers: () => void;
  users: Omit<User, 'passwordHash' | 'recoveryToken'>[];
  notifications: any[];
  onClearNotifications: () => void;
}

export default function PanelAuditoriaCifrado({
  currentUser,
  auditLogs,
  users,
  onRefreshAudit
}: AdminPanelProps) {
  const [securityStats, setSecurityStats] = useState<{
    timeline: { timestamp: number; failures: number; blocks: number }[];
    criticalAlerts: { id: string; createdAt: string; target: string; type: string; status: string }[];
  } | null>(null);

  const [passwordHashes, setPasswordHashes] = useState<{ id: string; username: string; fullName: string; email: string; role: string; authType?: string; passwordHash: string }[]>([]);
  const [loadingHashes, setLoadingHashes] = useState(false);
  const [hashesError, setHashesError] = useState<string | null>(null);
  const [logSearchTerm, setLogSearchTerm] = useState('');
  const [logFilter, setLogFilter] = useState<string>('all');
  const [userFilter, setUserFilter] = useState<string>('all');
  const [actionFilter, setActionFilter] = useState<string>('all');
  const [dateFilter, setDateFilter] = useState<string>('all');
  const [userDropdownOpen, setUserDropdownOpen] = useState(false);
  const [userDropdownSearch, setUserDropdownSearch] = useState('');
  const [actionDropdownOpen, setActionDropdownOpen] = useState(false);
  const [isAlertSilenced, setIsAlertSilenced] = useState(() =>
    sessionStorage.getItem('sentinel_alert_silenced') === 'true'
  );
  const [previouslySeenBlockedIds, setPreviouslySeenBlockedIds] = useState<string[]>([]);
  const [timelineWindow, setTimelineWindow] = useState<string>('24h');
  const [zoomedDate, setZoomedDate] = useState<number | null>(null);
  const [zoomLevel, setZoomLevel] = useState<'day' | 'hour' | null>(null);

  const isSupportOnly = currentUser.level === 2;
  const isAuditorOnly = currentUser.level === 3;

  const fetchSecurityStats = async (window?: string, targetDate?: number | null, zl?: 'day' | 'hour' | null) => {
    try {
      const w = window || timelineWindow;
      let url = `/api/admin/security-stats?window=${w}`;
      if (targetDate) url += `&targetDate=${targetDate}&zoomLevel=${zl || zoomLevel || ''}`;
      const response = await fetch(url);
      if (response.ok) {
        const data = await response.json();
        setSecurityStats(data);
      }
    } catch (e) {
      console.error("Error fetching security stats:", e);
    }
  };

  const fetchHashes = async () => {
    setLoadingHashes(true);
    setHashesError(null);
    try {
      const response = await fetch('/api/admin/password-hashes');
      if (response.ok) {
        const data = await response.json();
        setPasswordHashes(data);
      } else {
        setHashesError("No se pudieron cargar los registros criptográficos.");
      }
    } catch (e) {
      setHashesError("Error de red al consultar hashes.");
    } finally {
      setLoadingHashes(false);
    }
  };

  useEffect(() => {
    fetchSecurityStats(timelineWindow, zoomedDate, zoomLevel);
    if (currentUser.level >= 3) {
      fetchHashes();
    }
    const interval = setInterval(() => {
      fetchSecurityStats(timelineWindow, zoomedDate, zoomLevel);
    }, 30000);
    return () => clearInterval(interval);
  }, [timelineWindow, zoomedDate, zoomLevel]);

  useEffect(() => {
    const currentlyLockedIds = users.filter(u => u.isLocked).map(u => u.id).sort();
    const hasNewBlock = currentlyLockedIds.some(id => !previouslySeenBlockedIds.includes(id));
    if (hasNewBlock) {
      setIsAlertSilenced(false);
      sessionStorage.removeItem('sentinel_alert_silenced');
    }
    setPreviouslySeenBlockedIds(currentlyLockedIds);
  }, [users]);

  const getFlagEmoji = (countryCode: string) => {
    if (countryCode === "LOC") return "🏠";
    const codePoints = countryCode
      .toUpperCase()
      .split("")
      .map(char => 127397 + char.charCodeAt(0));
    return String.fromCodePoint(...codePoints);
  };

  // Refs for click-outside dropdown handling
  const userDropdownRef = useRef<HTMLDivElement>(null);
  const actionDropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (userDropdownRef.current && !userDropdownRef.current.contains(e.target as Node)) {
        setUserDropdownOpen(false);
        setUserDropdownSearch('');
      }
      if (actionDropdownRef.current && !actionDropdownRef.current.contains(e.target as Node)) {
        setActionDropdownOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Derived filter data from logs
  const uniqueUsers = [...new Set(auditLogs.map(l => l.username).filter(Boolean))].sort();
  const uniqueActions = [...new Set(auditLogs.map(l => l.action).filter(Boolean))].sort();
  const filteredUniqueUsers = uniqueUsers.filter(u =>
    u.toLowerCase().includes(userDropdownSearch.toLowerCase())
  );

  const statusCounts = {
    all: auditLogs.length,
    success: auditLogs.filter(l => l.status === 'success').length,
    failure: auditLogs.filter(l => l.status === 'failure').length,
    warn: auditLogs.filter(l => l.status === 'warn').length,
  };

  const filteredLogs = auditLogs.filter(log => {
    const matchesSearch = log.username?.toLowerCase().includes(logSearchTerm.toLowerCase()) ||
      log.ipAddress?.includes(logSearchTerm) ||
      log.action.toLowerCase().includes(logSearchTerm.toLowerCase()) ||
      log.details?.toLowerCase().includes(logSearchTerm.toLowerCase());
    const matchesStatus = logFilter === 'all' || log.status === logFilter;
    const matchesUser = userFilter === 'all' || log.username === userFilter;
    const matchesAction = actionFilter === 'all' || log.action === actionFilter;

    let matchesDate = true;
    if (dateFilter === 'today') {
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      matchesDate = new Date(log.timestamp) >= today;
    } else if (dateFilter === '24h') {
      matchesDate = new Date(log.timestamp) >= new Date(Date.now() - 24 * 60 * 60 * 1000);
    } else if (dateFilter === 'week') {
      matchesDate = new Date(log.timestamp) >= new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);
    }

    return matchesSearch && matchesStatus && matchesUser && matchesAction && matchesDate;
  });

  const chartComponent = useMemo(() => {
    if (!securityStats) {
      return (
        <div className="h-full flex items-center justify-center text-slate-600 text-[10px] animate-pulse">
          Analizando trazas del SIEM...
        </div>
      );
    }
    return (
      <ResponsiveContainer width="100%" height="100%">
        <LineChart 
          data={securityStats.timeline}
          className="focus:outline-none outline-none"
          onClick={(e) => {
            if (!e) return;
            let ts = null;
            if (e.activeLabel) ts = e.activeLabel;
            else if ((e as any).activePayload && (e as any).activePayload.length > 0) ts = (e as any).activePayload[0].payload.timestamp;
            if (!ts) return;

            if (!zoomedDate) {
              if (timelineWindow === '7d' || timelineWindow === '30d') {
                setSecurityStats(null);
                setZoomLevel('day');
                setZoomedDate(ts);
              } else if (timelineWindow === '24h') {
                setSecurityStats(null);
                setZoomLevel('hour');
                setZoomedDate(ts);
              }
            } else if (zoomLevel === 'day') {
              setSecurityStats(null);
              setZoomLevel('hour');
              setZoomedDate(ts);
            }
          }}
          style={{ cursor: (!zoomedDate && (timelineWindow === '7d' || timelineWindow === '30d' || timelineWindow === '24h')) || zoomLevel === 'day' ? 'pointer' : 'default' }}
        >
          <CartesianGrid strokeDasharray="3 3" stroke="#222" vertical={false} />
          <XAxis
            dataKey="timestamp"
            stroke="#444"
            fontSize={9}
            tickLine={false}
            axisLine={false}
            interval={zoomLevel === 'hour' ? 1 : (zoomedDate ? 2 : (timelineWindow === '30d' ? 4 : timelineWindow === '7d' ? 3 : 2))}
            tickFormatter={(ts) => {
              const d = new Date(ts);
              if (zoomLevel === 'hour') return d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', hour12: false });
              if (zoomedDate) return d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', hour12: false });
              if (timelineWindow === '30d') return d.toLocaleDateString([], { day: '2-digit', month: '2-digit' });
              if (timelineWindow === '7d') return `${d.toLocaleDateString([], { day: '2-digit', month: '2-digit' })} ${d.toLocaleTimeString([], { hour: '2-digit', hour12: false })}h`;
              return d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', hour12: false });
            }}
          />
          <YAxis
            stroke="#444"
            fontSize={9}
            tickLine={false}
            axisLine={false}
            width={25}
          />
          <Tooltip
            cursor={{ stroke: '#333', strokeWidth: 1, strokeDasharray: '4 4' }}
            contentStyle={{ backgroundColor: '#111', borderColor: '#333', borderRadius: '8px', fontSize: '10px', color: '#ccc' }}
            itemStyle={{ fontSize: '10px' }}
            labelFormatter={(label) => new Date(label).toLocaleString([], { day: '2-digit', month: '2-digit', hour: '2-digit', minute: '2-digit', hour12: false }) + 'h'}
          />
          <Line
            type="monotone"
            dataKey="failures"
            stroke="#f59e0b"
            strokeWidth={2}
            dot={false}
            activeDot={{ r: 4, fill: '#f59e0b', stroke: '#141414', strokeWidth: 2 }}
          />
          <Line
            type="monotone"
            dataKey="blocks"
            stroke="#ef4444"
            strokeWidth={2}
            dot={false}
            activeDot={{ r: 4, fill: '#ef4444', stroke: '#141414', strokeWidth: 2 }}
          />
        </LineChart>
      </ResponsiveContainer>
    );
  }, [securityStats, zoomedDate, zoomLevel, timelineWindow]);

  return (
    <div className="space-y-6">
      <div className="space-y-8 animate-fade-in" id="audit-parent-view">

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6" id="audit-dashboard-metrics">
          {/* Timeline: Security Incidents (REPLACES COUNTERS) */}
          <div className="col-span-1 lg:col-span-3 bg-[#141414] rounded-2xl border border-white/5 p-5 shadow-sm">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between mb-4 gap-3">
              <div className="flex items-center gap-4">
                <h4 className="text-xs font-bold text-slate-400 uppercase tracking-widest flex items-center gap-2">
                  <ShieldAlert className="w-4 h-4 text-rose-400" /> Timeline de Ataques {zoomedDate && (zoomLevel === 'hour' ? `(${new Date(zoomedDate).toLocaleString([], { day: '2-digit', month: '2-digit', hour: '2-digit', minute: '2-digit', hour12: false })}h)` : `(${new Date(zoomedDate).toLocaleDateString()})`)}
                </h4>
                {!zoomedDate ? (
                  <div className="flex gap-1">
                    {[
                      { key: '1h', label: '1h' },
                      { key: '6h', label: '6h' },
                      { key: '24h', label: '24h' },
                      { key: '7d', label: '7d' },
                      { key: '30d', label: '30d' },
                    ].map(w => (
                      <button
                        key={w.key}
                        onClick={() => { setTimelineWindow(w.key); setZoomedDate(null); setSecurityStats(null); }}
                        className={`px-2 py-0.5 rounded-md text-[9px] font-bold uppercase transition-all cursor-pointer ${
                          timelineWindow === w.key
                            ? 'bg-rose-500/15 text-rose-400 border border-rose-500/25'
                            : 'text-slate-500 hover:text-slate-300 border border-transparent hover:border-white/10'
                        }`}
                      >
                        {w.label}
                      </button>
                    ))}
                  </div>
                ) : (
                  <button
                    onClick={() => {
                      if (zoomLevel === 'hour' && (timelineWindow === '7d' || timelineWindow === '30d')) {
                        // Go back to day zoom if we came from 7d or 30d
                        setZoomLevel('day');
                        // Optional: we can keep the same zoomedDate or reset it to 00:00 of that day. Let's just switch back.
                        setSecurityStats(null);
                      } else {
                        // Reset completely
                        setZoomedDate(null);
                        setZoomLevel(null);
                        setSecurityStats(null);
                      }
                    }}
                    className="flex items-center gap-1 text-[10px] text-rose-400 hover:text-rose-300 transition-colors cursor-pointer"
                  >
                    {zoomLevel === 'hour' && (timelineWindow === '7d' || timelineWindow === '30d') ? 'Volver al día' : 'Volver a vista general'}
                  </button>
                )}
              </div>
              <div className="flex items-center gap-4 text-[9px] uppercase font-bold tracking-tighter">
                <span className="flex items-center gap-1.5 text-amber-500">
                  <span className="w-2 h-2 rounded-full bg-amber-500" /> Fallos de Login
                </span>
                <span className="flex items-center gap-1.5 text-rose-500">
                  <span className="w-2 h-2 rounded-full bg-rose-500" /> Bloqueos Efectuados
                </span>
              </div>
            </div>

            <div className="h-[180px] w-full">
              {chartComponent}
            </div>
          </div>


        </div>

        <div className="grid grid-cols-1 gap-6">
          {/* Critical Alerts Table */}
          <div className="bg-[#141414] rounded-2xl border border-white/5 p-5 shadow-sm">
            <h4 className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-4 flex items-center gap-2">
              <AlertTriangle className="w-4 h-4 text-amber-500" /> {zoomedDate ? 'ALERTAS CRÍTICAS DEL PERIODO' : 'ÚLTIMAS ALERTAS CRÍTICAS'}
            </h4>
            <div className="overflow-x-auto">
              <table className="w-full text-left text-[10px]">
                <thead>
                  <tr className="border-b border-white/5 text-slate-500 uppercase font-bold">
                    <th className="pb-2">Fecha / Hora</th>
                    <th className="pb-2">Usuario / IP</th>
                    <th className="pb-2">Evento</th>
                    <th className="pb-2 text-right">Estado</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-white/5">
                  {securityStats?.criticalAlerts.length ? (
                    securityStats.criticalAlerts.slice(0, 10).map(alert => (
                      <tr key={alert.id} className="text-slate-300">
                        <td className="py-2.5 font-mono text-slate-500">
                          {new Date(alert.createdAt).toLocaleDateString([], { day: '2-digit', month: '2-digit' })} {new Date(alert.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', hour12: false })}
                        </td>
                        <td className="py-2.5">
                          <span className="bg-white/5 px-2 py-0.5 rounded-lg border border-white/5">
                            {alert.target}
                          </span>
                        </td>
                        <td className="py-2.5">
                          <span className={`font-bold ${alert.type === 'Fallo' ? 'text-amber-400' : 'text-rose-400'}`}>
                            {alert.type} de Seguridad
                          </span>
                        </td>
                        <td className="py-2.5 text-right">
                          <span className={`px-2 py-0.5 rounded-full text-[9px] font-black uppercase ${alert.status === 'success' ? 'bg-emerald-500/10 text-emerald-400' :
                            alert.status === 'warn' ? 'bg-rose-500/10 text-rose-400' :
                              'bg-amber-500/10 text-amber-400'
                            }`}>
                            {alert.status}
                          </span>
                        </td>
                      </tr>
                    ))
                  ) : (
                    <tr>
                      <td colSpan={4} className="py-4 text-center text-slate-600">No hay alertas recientes en este ciclo.</td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 gap-6">
          {/* PANEL B: AUDIT LOGS SEARCH ENGINE */}
          {!isSupportOnly && (
            <div className={`bg-[#141414] rounded-2xl border border-white/5 shadow-2xl p-6 space-y-6 flex flex-col justify-between ${!isAuditorOnly ? 'col-span-1' : 'col-span-1'}`} id="col-audit-logs">
              <div className="space-y-4">
                <div className="border-b border-white/5 pb-4">
                  <h3 className="font-semibold text-white flex items-center gap-2">
                    <FileSliders className="w-4.5 h-4.5 text-blue-400" />
                    Auditoría y Traza de Seguridad
                  </h3>
                  <p className="text-[11px] text-slate-400 mt-0.5">Bitácora técnica e inmutable (SIEM) de operaciones en tiempo real.</p>
                </div>

                {/* Filter tools */}
                <div className="space-y-3">
                  {/* Search input with clear button */}
                  <div className="relative">
                    <Search className="absolute left-2.5 top-2.5 h-3.5 w-3.5 text-slate-500" />
                    <input
                      type="text"
                      placeholder="Buscar en traza o IP..."
                      value={logSearchTerm}
                      onChange={(e) => setLogSearchTerm(e.target.value)}
                      className="pl-8 pr-8 py-1.5 text-xs bg-[#0A0A0A] border border-white/5 rounded-lg text-slate-200 focus:outline-hidden focus:border-blue-500 w-full"
                    />
                    {logSearchTerm && (
                      <button
                        onClick={() => setLogSearchTerm('')}
                        className="absolute right-2.5 top-2.5 text-slate-500 hover:text-white transition-colors cursor-pointer"
                        title="Limpiar búsqueda"
                      >
                        <X className="h-3.5 w-3.5" />
                      </button>
                    )}
                  </div>

                  {/* Advanced filters row */}
                  <div className="flex flex-wrap gap-2 items-center">
                    {/* User filter dropdown */}
                    <div className="relative" ref={userDropdownRef}>
                      <button
                        onClick={() => { setUserDropdownOpen(!userDropdownOpen); setActionDropdownOpen(false); }}
                        className={`flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-[10px] font-semibold border transition-all cursor-pointer ${
                          userFilter !== 'all'
                            ? 'bg-blue-500/15 text-blue-400 border-blue-500/25'
                            : 'bg-[#0A0A0A] text-slate-400 hover:text-white border-white/5 hover:border-white/10'
                        }`}
                      >
                        <Users className="w-3 h-3" />
                        {userFilter === 'all' ? 'Usuario' : `@${userFilter}`}
                        <ChevronDown className={`w-3 h-3 transition-transform ${userDropdownOpen ? 'rotate-180' : ''}`} />
                      </button>
                      {userDropdownOpen && (
                        <div className="absolute top-full left-0 mt-1 w-56 bg-[#141414] border border-white/10 rounded-xl shadow-2xl z-50 overflow-hidden animate-fade-in">
                          <div className="p-2 border-b border-white/5">
                            <input
                              type="text"
                              placeholder="Filtrar usuario..."
                              value={userDropdownSearch}
                              onChange={(e) => setUserDropdownSearch(e.target.value)}
                              className="w-full px-2.5 py-1.5 text-[10px] bg-[#0A0A0A] border border-white/5 rounded-lg text-slate-200 focus:outline-hidden focus:border-blue-500 placeholder-slate-600"
                              autoFocus
                            />
                          </div>
                          <div className="max-h-[180px] overflow-y-auto p-1">
                            <button
                              onClick={() => { setUserFilter('all'); setUserDropdownOpen(false); setUserDropdownSearch(''); }}
                              className={`w-full text-left px-2.5 py-1.5 rounded-lg text-[10px] font-semibold transition-all cursor-pointer ${
                                userFilter === 'all' ? 'bg-blue-500/15 text-blue-400' : 'text-slate-400 hover:text-white hover:bg-white/5'
                              }`}
                            >
                              Todos los usuarios
                            </button>
                            {filteredUniqueUsers.map(username => (
                              <button
                                key={username}
                                onClick={() => { setUserFilter(username); setUserDropdownOpen(false); setUserDropdownSearch(''); }}
                                className={`w-full text-left px-2.5 py-1.5 rounded-lg text-[10px] font-mono transition-all cursor-pointer ${
                                  userFilter === username ? 'bg-blue-500/15 text-blue-400 font-bold' : 'text-slate-400 hover:text-white hover:bg-white/5'
                                }`}
                              >
                                @{username}
                              </button>
                            ))}
                            {filteredUniqueUsers.length === 0 && (
                              <p className="text-[10px] text-slate-600 text-center py-2">Sin coincidencias</p>
                            )}
                          </div>
                        </div>
                      )}
                    </div>

                    {/* Action filter dropdown */}
                    <div className="relative" ref={actionDropdownRef}>
                      <button
                        onClick={() => { setActionDropdownOpen(!actionDropdownOpen); setUserDropdownOpen(false); }}
                        className={`flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-[10px] font-semibold border transition-all cursor-pointer ${
                          actionFilter !== 'all'
                            ? 'bg-blue-500/15 text-blue-400 border-blue-500/25'
                            : 'bg-[#0A0A0A] text-slate-400 hover:text-white border-white/5 hover:border-white/10'
                        }`}
                      >
                        <Activity className="w-3 h-3" />
                        {actionFilter === 'all' ? 'Acción' : actionFilter.replace(/_/g, ' ')}
                        <ChevronDown className={`w-3 h-3 transition-transform ${actionDropdownOpen ? 'rotate-180' : ''}`} />
                      </button>
                      {actionDropdownOpen && (
                        <div className="absolute top-full left-0 mt-1 w-64 bg-[#141414] border border-white/10 rounded-xl shadow-2xl z-50 overflow-hidden animate-fade-in">
                          <div className="max-h-[200px] overflow-y-auto p-1">
                            <button
                              onClick={() => { setActionFilter('all'); setActionDropdownOpen(false); }}
                              className={`w-full text-left px-2.5 py-1.5 rounded-lg text-[10px] font-semibold transition-all cursor-pointer ${
                                actionFilter === 'all' ? 'bg-blue-500/15 text-blue-400' : 'text-slate-400 hover:text-white hover:bg-white/5'
                              }`}
                            >
                              Todas las acciones
                            </button>
                            {uniqueActions.map(action => (
                              <button
                                key={action}
                                onClick={() => { setActionFilter(action); setActionDropdownOpen(false); }}
                                className={`w-full text-left px-2.5 py-1.5 rounded-lg text-[10px] font-mono uppercase transition-all cursor-pointer ${
                                  actionFilter === action ? 'bg-blue-500/15 text-blue-400 font-bold' : 'text-slate-400 hover:text-white hover:bg-white/5'
                                }`}
                              >
                                {action.replace(/_/g, ' ')}
                              </button>
                            ))}
                          </div>
                        </div>
                      )}
                    </div>

                    {/* Date filter chips */}
                    <div className="flex gap-1 ml-auto">
                      {[
                        { key: 'all', label: 'Siempre' },
                        { key: 'today', label: 'Hoy' },
                        { key: '24h', label: '24h' },
                        { key: 'week', label: 'Semana' },
                      ].map(d => (
                        <button
                          key={d.key}
                          onClick={() => setDateFilter(d.key)}
                          className={`flex items-center gap-1 px-2 py-1.5 rounded-lg text-[10px] font-semibold border transition-all cursor-pointer ${
                            dateFilter === d.key
                              ? 'bg-blue-500/15 text-blue-400 border-blue-500/25'
                              : 'bg-[#0A0A0A] text-slate-400 hover:text-white border-white/5 hover:border-white/10'
                          }`}
                        >
                          {d.key === 'all' && <Clock className="w-3 h-3" />}
                          {d.label}
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Status filter buttons with badges */}
                  <div className="flex gap-1">
                    {(['all', 'success', 'failure', 'warn'] as const).map(f => (
                      <button
                        key={f}
                        onClick={() => setLogFilter(f)}
                        className={`px-2 py-1 rounded text-[10px] font-semibold border transition-all grow cursor-pointer flex items-center justify-center gap-1.5 ${logFilter === f
                          ? 'bg-blue-600 text-white border-blue-650 shadow-md shadow-blue-550/15'
                          : 'bg-[#0A0A0A] text-slate-400 hover:text-white hover:bg-white/5 border-white/5'
                          }`}
                      >
                        {f === 'all' ? 'Todos' : f === 'success' ? 'Éxito' : f === 'failure' ? 'Fallos' : 'Aviso'}
                        <span className={`text-[8px] font-bold min-w-[18px] px-1 py-0.5 rounded-full ${
                          logFilter === f ? 'bg-white/20 text-white' : 'bg-white/5 text-slate-500'
                        }`}>
                          {statusCounts[f]}
                        </span>
                      </button>
                    ))}
                  </div>

                  {/* Results indicator */}
                  <div className="text-[10px] text-slate-500 font-mono flex items-center justify-between">
                    <span>
                      Mostrando <strong className="text-slate-300">{filteredLogs.length}</strong> de <strong className="text-slate-300">{auditLogs.length}</strong> registros
                    </span>
                    {(userFilter !== 'all' || actionFilter !== 'all' || dateFilter !== 'all' || logSearchTerm) && (
                      <button
                        onClick={() => { setUserFilter('all'); setActionFilter('all'); setDateFilter('all'); setLogSearchTerm(''); setLogFilter('all'); }}
                        className="text-blue-400 hover:text-blue-300 transition-colors cursor-pointer flex items-center gap-1"
                      >
                        <X className="w-3 h-3" /> Limpiar filtros
                      </button>
                    )}
                  </div>
                </div>

                {/* Inmutable log viewer */}
                <div className="space-y-2.5 max-h-[445px] overflow-y-auto pr-1" id="audit-logs-scroll-container">
                  {filteredLogs.length === 0 ? (
                    <div className="py-12 text-center text-slate-500 text-xs">
                      No hay registros de auditoría filtrados.
                    </div>
                  ) : (
                    filteredLogs.map((log) => (
                      <div
                        key={log.id}
                        className={`p-3 rounded-xl border text-[11px] space-y-1.5 transition-all ${log.status === 'failure'
                          ? 'bg-red-950/20 border-red-500/15 text-slate-300'
                          : log.status === 'warn'
                            ? 'bg-amber-950/15 border-amber-500/15 text-slate-300'
                            : 'bg-[#0A0A0A] border-white/5 text-slate-300'
                          }`}
                      >
                        <div className="flex justify-between items-start gap-1">
                          <span className="font-mono text-[10px] font-semibold text-slate-300 uppercase bg-[#141414] px-1.5 py-0.2 rounded border border-white/5">
                            {log.action.replace(/_/g, " ")}
                          </span>
                          <span className="text-[9px] text-slate-500 font-mono shrink-0 flex items-center gap-0.5">
                            <Clock className="w-2.5 h-2.5" />
                            {new Date(log.timestamp).toLocaleDateString([], { day: '2-digit', month: '2-digit' })} {new Date(log.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit', hour12: false })}
                          </span>
                        </div>

                        <p className="text-slate-300 font-normal leading-relaxed text-[11px]">
                          {log.details}
                        </p>

                        <div className="flex justify-between items-center text-[9px] text-slate-500 font-mono border-t border-white/5 pt-1.5">
                          <span className="flex items-center gap-1.5">
                            <span className="uppercase text-[8px] font-bold">Ref:</span>
                            <strong className="text-blue-400 bg-blue-500/10 px-2 py-0.5 rounded-full border border-blue-500/20 text-[10px]">@{log.username}</strong>
                          </span>
                          {log.location && (
                            <span className="flex items-center gap-1 text-slate-300">
                              <span className="opacity-70">{log.location}</span>
                              {log.countryCode && <span className="scale-125 ml-0.5">{getFlagEmoji(log.countryCode)}</span>}
                            </span>
                          )}
                          <span className="flex items-center gap-0.5 px-2 py-0.5 rounded-full bg-white/5 border border-white/5">
                            <Globe className="w-2.5 h-2.5 text-slate-500" />
                            IP: {log.ipAddress}
                          </span>
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </div>

              <button
                onClick={onRefreshAudit}
                className="w-full mt-4 py-2 bg-blue-600/10 hover:bg-blue-600/20 text-blue-400 text-xs font-semibold rounded-lg flex justify-center items-center gap-2 transition-all cursor-pointer"
              >
                <RefreshCw className="w-3.5 h-3.5" />
                Sincronizar Panel de Auditoría
              </button>
            </div>
          )}


        </div>
      </div>
      {(currentUser.level === 5 || currentUser.level === 3) && (

        <div className="space-y-6 animate-fade-in" id="passwords-parent-view">
          <div className="bg-[#141414] rounded-2xl border border-white/5 p-6 md:p-8 space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between pb-4 border-b border-white/5 gap-4 col-span-full">
              <div>
                <h3 className="text-base font-extrabold text-white uppercase tracking-wider flex items-center gap-2">
                  <Key className="w-5 h-5 text-emerald-400" /> Registro Criptográfico de Contraseñas
                </h3>
                <p className="text-xs text-slate-400 mt-1">
                  Verificación de almacenamiento "Zero-Knowledge" mediante algoritmos hash irreversibles de nivel bancario.
                </p>
              </div>
              <button
                onClick={fetchHashes}
                disabled={loadingHashes}
                className="self-start sm:self-center px-3.5 py-2 bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-400 border border-emerald-500/15 rounded-lg text-xs font-bold font-mono flex items-center gap-1.5 transition-all cursor-pointer active:scale-97"
              >
                <RefreshCw className={`w-3.5 h-3.5 ${loadingHashes ? 'animate-spin' : ''}`} /> Sincronizar Hashes
              </button>
            </div>

            <div className="p-4 bg-emerald-500/5 rounded-xl border border-emerald-500/10 text-xs text-slate-300 leading-normal space-y-2">
              <span className="font-extrabold text-emerald-400 uppercase tracking-widest text-[9px] font-mono px-2 py-0.5 rounded bg-emerald-500/15 border border-emerald-500/20">
                Garantía Inmutable de Cero Conocimiento (Zero-Knowledge Proof)
              </span>
              <p>
                Este visor demuestra con absoluta transparencia matemática cómo se almacenan las credenciales. Las contraseñas de los usuarios pasaron por una iteración del algoritmo de firma segura <strong>BCrypt con factor de costo 10</strong>.
              </p>
              <ul className="list-disc list-inside space-y-1 font-mono text-[10px] text-slate-400 pl-1">
                <li>El prefijo <code className="text-emerald-300 font-bold">$2a$</code> o <code className="text-emerald-300 font-bold">$2b$</code> indica la variante del algoritmo BCrypt segura.</li>
                <li>El factor <code className="text-emerald-400 font-bold">10</code> indica que el algoritmo procesó la contraseña <code className="text-emerald-400 font-bold">2^10 = 1024</code> veces con un valor aleatorio de sal ("Salt") para mitigar ataques de diccionario y colisiones.</li>
                <li>Ni la base de datos ni los administradores del sistema pueden recuperar, descifrar o deducir la contraseña original de estos hashes.</li>
              </ul>
            </div>

            {loadingHashes ? (
              <div className="py-12 text-center text-slate-400 text-xs text-center justify-center">
                Cargando hashes de seguridad del sistema de forma segura...
              </div>
            ) : hashesError ? (
              <div className="py-12 text-center text-red-400 text-xs font-mono">
                {hashesError}
              </div>
            ) : (
              <div className="overflow-x-auto rounded-xl border border-white/5">
                <table className="w-full text-left text-xs text-slate-400 border-collapse hidden md:table">
                  <thead>
                    <tr className="border-b border-white/5 text-[10px] uppercase font-bold tracking-wider text-slate-500 bg-[#0F0F0F]">
                      <th className="py-3 px-4">Usuario Relacionado</th>
                      <th className="py-3 px-4">Rol / Nivel</th>
                      <th className="py-3 px-4">Algoritmo</th>
                      <th className="py-3 px-4">Hash Cifrado (BCrypt Raw)</th>
                      <th className="py-3 px-3 text-center">Inversión</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-white/5">
                    {passwordHashes.map(u => (
                      <tr key={u.id} className="hover:bg-white/5 transition-all text-slate-300">
                        <td className="py-4 px-4 font-semibold text-white">
                          <p className="text-xs">{u.fullName}</p>
                          <p className="text-[10px] text-slate-500 font-mono">@{u.username} | {u.email}</p>
                        </td>
                        <td className="py-4 px-4 font-mono font-bold text-[10px] uppercase text-blue-400">
                          {u.role}
                        </td>
                        <td className="py-4 px-4 font-mono text-[10px] text-slate-400">
                          <code>{u.authType === 'google' ? 'OAUTH2_FEDERATED' : 'BCRYPT_BLOWFISH'}</code>
                        </td>
                        <td className="py-4 px-4 font-mono text-[10px] select-all tracking-tight break-all">
                          <span className={`inline-block px-2.5 py-1.5 rounded-lg border font-bold select-all ${u.authType === 'google' ? 'text-blue-400/90 bg-blue-500/5 border-blue-500/10' : 'text-emerald-400/90 bg-emerald-500/5 border-emerald-500/10'}`}>
                            {u.authType === 'google' ? 'OAUTH2_GOOGLE_SSO_PROVIDER' : (u.passwordHash || 'SIN_CONTRASEÑA_REGISTRADA')}
                          </span>
                        </td>
                        <td className="py-4 px-3 text-center">
                          <span className={`inline-flex items-center gap-1 text-[9px] font-bold px-2 py-0.5 rounded-full uppercase tracking-wider ${u.authType === 'google' ? 'text-blue-400 bg-blue-400/5 border-blue-500/10' : 'text-emerald-400 bg-emerald-400/5 border-emerald-500/10'}`}>
                            <ShieldCheck className="w-3 h-3" /> {u.authType === 'google' ? 'Federado' : 'Blindado'}
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
                  
                  {/* Vista móvil: Tarjetas apiladas (oculta en escritorio) */}
                  <div className="flex flex-col divide-y divide-white/5 block md:hidden">
                    {passwordHashes.map(u => (
                      <div key={u.id} className="p-4 space-y-3 hover:bg-white/5 transition-all">
                        <div className="flex justify-between items-start gap-2">
                          <div className="font-semibold text-white">
                            <p className="text-xs">{u.fullName}</p>
                            <p className="text-[10px] text-slate-500 font-mono">@{u.username} | {u.email}</p>
                          </div>
                          <span className={`inline-flex items-center gap-1 text-[9px] font-bold px-2 py-0.5 rounded-full uppercase tracking-wider ${u.authType === 'google' ? 'text-blue-400 bg-blue-400/5 border-blue-500/10' : 'text-emerald-400 bg-emerald-400/5 border-emerald-500/10'}`}>
                            <ShieldCheck className="w-3 h-3" /> {u.authType === 'google' ? 'Federado' : 'Blindado'}
                          </span>
                        </div>
                        <div className="flex justify-between items-center text-[10px]">
                          <span className="font-mono font-bold uppercase text-blue-400">
                            {u.role}
                          </span>
                        </div>
                      </div>
                    ))}
                  </div>
              </div>
            )}
          </div>
        </div>


      )}
    </div>
  );
}
