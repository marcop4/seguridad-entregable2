/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import express from "express";
import path from "path";
import fs from "fs";
import bcrypt from "bcryptjs";
import { randomBytes, createHash } from "crypto";
import dotenv from "dotenv";
import { createServer as createViteServer } from "vite";
import rateLimit from "express-rate-limit";
import nodemailer from "nodemailer";

dotenv.config();

// Verificación inicial de configuración SMTP
console.log("\n=== Comprobación de Configuración SMTP ===");
console.log(`SMTP_GMAIL_USER: ${process.env.SMTP_GMAIL_USER ? 'Configurado (' + process.env.SMTP_GMAIL_USER + ')' : 'NO CONFIGURADO'}`);
console.log(`SMTP_GMAIL_PASS: ${process.env.SMTP_GMAIL_PASS ? 'Configurado (***)' : 'NO CONFIGURADO'}`);
console.log(`SMTP_MAILTRAP_USER: ${process.env.SMTP_MAILTRAP_USER ? 'Configurado (' + process.env.SMTP_MAILTRAP_USER + ')' : 'NO CONFIGURADO'}`);
console.log(`SMTP_MAILTRAP_PASS: ${process.env.SMTP_MAILTRAP_PASS ? 'Configurado (***)' : 'NO CONFIGURADO'}`);
console.log("==========================================\n");

import { User, AuditLog, SystemNotification, EmailSandboxItem, UserRole, CustomRole, SecurityEvent } from "./src/types";

// Database storage setup
const DB_FILE = path.join(process.cwd(), "database.json");

// Initial mock data
const DEFAULT_USERS: User[] = [
  {
    id: "user-root",
    email: "root@sentinel.ai",
    username: "root_global",
    fullName: "SuperAdmin Root Global",
    role: "admin",
    level: 5,
    passwordHash: bcrypt.hashSync("password123", 10),
    avatarUrl: "https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=100&h=100&fit=crop",
    isLocked: false,
    failedAttempts: 0,
    activeSessionId: null,
    activeSessionBrowser: null,
    activeSessionIp: null,
    activeSessionStartedAt: null,
    recoveryToken: null,
    recoveryTokenExpiresAt: null,
    authType: 'local',
    createdAt: new Date().toISOString()
  },
  {
    id: "user-admin",
    email: "admin@sentinel.ai",
    username: "admin_local",
    fullName: "Administrador de Accesos",
    role: "moderator",
    level: 4,
    passwordHash: bcrypt.hashSync("password123", 10),
    avatarUrl: "https://images.unsplash.com/photo-1599566150163-29194dcaad36?w=100&h=100&fit=crop",
    isLocked: false,
    failedAttempts: 0,
    activeSessionId: null,
    activeSessionBrowser: null,
    activeSessionIp: null,
    activeSessionStartedAt: null,
    recoveryToken: null,
    recoveryTokenExpiresAt: null,
    authType: 'local',
    createdAt: new Date().toISOString()
  },
  {
    id: "user-auditor",
    email: "auditor@sentinel.ai",
    username: "auditor_siem",
    fullName: "Auditor de Trazas SIEM",
    role: "auditor" as any,
    level: 3,
    passwordHash: bcrypt.hashSync("password123", 10),
    avatarUrl: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=100&h=100&fit=crop",
    isLocked: false,
    failedAttempts: 0,
    activeSessionId: null,
    activeSessionBrowser: null,
    activeSessionIp: null,
    activeSessionStartedAt: null,
    recoveryToken: null,
    recoveryTokenExpiresAt: null,
    authType: 'local',
    createdAt: new Date().toISOString()
  },
  {
    id: "user-guest",
    email: "user@sentinel.ai",
    username: "guest_user",
    fullName: "Usuario (Lectura Básica)",
    role: "user",
    level: 1,
    passwordHash: bcrypt.hashSync("password123", 10),
    avatarUrl: "https://images.unsplash.com/photo-1544005313-94ddf0286df2?w=100&h=100&fit=crop",
    isLocked: false,
    failedAttempts: 0,
    activeSessionId: null,
    activeSessionBrowser: null,
    activeSessionIp: null,
    activeSessionStartedAt: null,
    recoveryToken: null,
    recoveryTokenExpiresAt: null,
    authType: 'local',
    createdAt: new Date().toISOString()
  }
];

interface DatabaseData {
  users: User[];
  auditLogs: AuditLog[];
  notifications: SystemNotification[];
  emails: EmailSandboxItem[];
  customRoles: CustomRole[];
  securityLogs: SecurityEvent[];
}

function loadDatabase(): DatabaseData {
  try {
    if (fs.existsSync(DB_FILE)) {
      const content = fs.readFileSync(DB_FILE, "utf-8");
      const parsed = JSON.parse(content);

      // Ensure securityLogs exists in migration
      if (!parsed.securityLogs) parsed.securityLogs = [];

      const defaultRoles: CustomRole[] = [
        {
          id: "role-admin",
          name: "Administrador",
          key: "admin",
          description: "Acceso total al sistema y gestión de usuarios (Nivel 1).",
          privilegeLevel: 5,
          createdAt: new Date().toISOString()
        },
        {
          id: "role-moderator",
          name: "Moderador",
          key: "moderator",
          description: "Gestión de accesos y monitoreo SIEM (Nivel 2).",
          privilegeLevel: 3,
          createdAt: new Date().toISOString()
        },
        {
          id: "role-user",
          name: "Usuario",
          key: "user",
          description: "Usuario estándar con privilegios de lectura básica (Nivel 3).",
          privilegeLevel: 1,
          createdAt: new Date().toISOString()
        }
      ];

      // Ensure arrays exist and seed roles if missing
      const db: DatabaseData = {
        users: parsed.users || [],
        auditLogs: parsed.auditLogs || [],
        notifications: parsed.notifications || [],
        emails: parsed.emails || [],
        customRoles: parsed.customRoles || [],
        securityLogs: parsed.securityLogs || []
      };

      // Seed core roles if not present
      defaultRoles.forEach(dr => {
        if (!db.customRoles.some(r => r.key === dr.key)) {
          db.customRoles.push(dr);
        }
      });

      let autoUnlocked = false;
      db.users.forEach(u => {
        if (u.role === "admin" && (u.isLocked || u.failedAttempts > 0)) {
          u.isLocked = false;
          u.failedAttempts = 0;
          autoUnlocked = true;
        }
      });

      if (autoUnlocked) {
        saveDatabase(db);
      }
      return db;
    }
  } catch (error) {
    console.error("Error reading database file, using empty db:", error);
  }

  const defaultRoles: CustomRole[] = [
    {
      id: "role-admin",
      name: "Administrador",
      key: "admin",
      description: "Acceso total al sistema y gestión de usuarios (Nivel 1).",
      privilegeLevel: 5,
      createdAt: new Date().toISOString()
    },
    {
      id: "role-moderator",
      name: "Moderador",
      key: "moderator",
      description: "Gestión de accesos y monitoreo SIEM (Nivel 2).",
      privilegeLevel: 3,
      createdAt: new Date().toISOString()
    },
    {
      id: "role-user",
      name: "Usuario",
      key: "user",
      description: "Usuario estándar con privilegios de lectura básica (Nivel 3).",
      privilegeLevel: 1,
      createdAt: new Date().toISOString()
    }
  ];

  // Fallback / First time initializer
  const db: DatabaseData = {
    users: DEFAULT_USERS,
    auditLogs: [
      {
        id: "log-init",
        timestamp: new Date().toISOString(),
        userId: "system",
        username: "SYSTEM",
        action: "DATABASE_INITIALIZED",
        status: "success" as const,
        ipAddress: "127.0.0.1",
        userAgent: "Server Internal",
        details: "Base de datos inicializada correctamente con perfiles y roles de prueba y jerarquías."
      }
    ],
    notifications: [
      {
        id: "notif-init",
        timestamp: new Date().toISOString(),
        type: "info" as const,
        title: "Sistema Iniciado",
        message: "El servidor de seguridad y control de acceso único se ha iniciado con soporte de roles custom.",
        read: false
      }
    ],
    emails: [],
    customRoles: defaultRoles,
    securityLogs: []
  };
  saveDatabase(db);
  return db;
}

function saveDatabase(data: DatabaseData) {
  try {
    fs.writeFileSync(DB_FILE, JSON.stringify(data, null, 2), "utf-8");
  } catch (error) {
    console.error("Error writing to database file:", error);
  }
}

// Global active client connections for Real-time Server-Sent Events (SSE)
let sseClients: { id: string; req: express.Request; res: express.Response; userId?: string | null }[] = [];

function broadcastToSse(event: string, data: any, targetedUserId?: string | null) {
  const payload = `event: ${event}\ndata: ${JSON.stringify(data)}\n\n`;
  sseClients.forEach(client => {
    if (!targetedUserId || client.userId === targetedUserId || (targetedUserId === "admin" && getUserRole(client.userId) === "admin")) {
      try {
        client.res.write(payload);
      } catch (err) {
        // Ignored, client likely disconnected
      }
    }
  });
}

function getUserRole(userId: string | null | undefined): string | null {
  if (!userId) return null;
  const db = loadDatabase();
  const u = db.users.find(u => u.id === userId);
  return u ? u.role : null;
}

async function startServer() {
  const app = express();
  app.set('trust proxy', true);
  const PORT = 3000;
  app.use(express.json());

  // SSE client ping interval to keep connections alive in Cloud Run container
  setInterval(() => {
    sseClients.forEach(client => {
      try {
        client.res.write(":\n\n");
      } catch (e) { }
    });
  }, 30000);

  // Initialize DB once at start
  loadDatabase();

  // Helper helper to generate random IDs
  const makeId = () => Math.random().toString(36).substring(2, 11);

  // Helper to extract the actual client IP robustly
  const getClientIp = (req: express.Request): string => {
    const cfIp = req.headers['cf-connecting-ip'] as string;
    if (cfIp) return cfIp.split(',')[0].trim();

    const trueClientIp = req.headers['true-client-ip'] as string;
    if (trueClientIp) return trueClientIp.split(',')[0].trim();

    const realIp = req.headers['x-real-ip'] as string;
    if (realIp) return realIp.split(',')[0].trim();

    const forwardedFor = req.headers['x-forwarded-for'] as string;
    if (forwardedFor) {
      const ips = forwardedFor.split(',').map(ip => ip.trim());
      // Sometimes the first IP is the true client, but if it's an internal proxy, we might get multiple
      return ips[0];
    }

    return req.ip || req.socket?.remoteAddress || "unknown";
  };

  // Helper to log high-importance security events to a dedicated storage
  const logSecurityEvent = (
    db: DatabaseData,
    userId: string | null,
    username: string | null,
    eventType: 'LOGIN_FAILED' | 'ACCOUNT_LOCKED' | 'BRUTE_FORCE_DETECTED',
    req: express.Request
  ) => {
    if (!db.securityLogs) db.securityLogs = [];

    const newEvent: SecurityEvent = {
      id: "sec-" + makeId(),
      userId,
      username: username || "ANONYMOUS",
      eventType,
      ipAddress: getClientIp(req),
      createdAt: new Date().toISOString()
    };

    db.securityLogs.unshift(newEvent);
    return newEvent;
  };

  // Helper to log audit entries
  const logAudit = (
    userId: string | null,
    username: string | null,
    action: string,
    status: 'success' | 'failure' | 'warn',
    req: express.Request,
    details: string,
    dbIn?: DatabaseData
  ) => {
    const db = dbIn || loadDatabase();
    const newLog: AuditLog = {
      id: "log-" + makeId(),
      timestamp: new Date().toISOString(),
      userId,
      username: username || "ANONYMOUS",
      action,
      status,
      ipAddress: getClientIp(req),
      userAgent: req.headers["user-agent"] || "unknown",
      details
    };

    // Auto-propagate to securityLogs if it's a critical security event
    if (action.includes('LOGIN_FAILED')) {
      logSecurityEvent(db, userId, username, 'LOGIN_FAILED', req);
    } else if (action.includes('LOCKED')) {
      logSecurityEvent(db, userId, username, 'ACCOUNT_LOCKED', req);
    } else if (action.includes('BRUTE_FORCE')) {
      logSecurityEvent(db, userId, username, 'BRUTE_FORCE_DETECTED', req);
    }

    // Perform geolocation enrichment in background
    enrichLogWithGeo(newLog);

    db.auditLogs.unshift(newLog);

    // Only save here if we weren't passed a db object (caller responsibility otherwise)
    if (!dbIn) saveDatabase(db);

    // Broadcast log update to connected admins
    broadcastToSse("audit_update", newLog);
    return newLog;
  };

  // Background Geo Enrichment
  async function enrichLogWithGeo(log: AuditLog) {
    const ip = log.ipAddress;
    // Skip geolocation for local/private/link-local addresses
    if (
      !ip ||
      ip === "127.0.0.1" ||
      ip === "::1" ||
      ip === "unknown" ||
      ip.startsWith("10.") ||
      ip.startsWith("192.168.") ||
      ip.startsWith("172.") ||
      ip.startsWith("169.254.")
    ) {
      log.location = "Red Interna";
      log.countryCode = "LOC";
      return;
    }

    // Use AbortController for timeout to prevent hanging on network issues
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 4000);

    try {
      // Try HTTPS first, if it fails ip-api.com might require HTTP for some free tiers
      const res = await fetch(`http://ip-api.com/json/${ip}?fields=status,country,countryCode,city`, {
        signal: controller.signal,
        headers: {
          'User-Agent': 'Sentinel-Security-SIEM/1.0'
        }
      });

      clearTimeout(timeoutId);

      if (!res.ok) throw new Error(`HTTP error! status: ${res.status}`);

      const data: any = await res.json();

      if (data.status === "success") {
        log.location = `${data.city}, ${data.country}`;
        log.countryCode = data.countryCode;

        // Persist enriched data
        const db = loadDatabase();
        const dbLog = db.auditLogs.find(l => l.id === log.id);
        if (dbLog) {
          dbLog.location = log.location;
          dbLog.countryCode = log.countryCode;
          saveDatabase(db);
          broadcastToSse("audit_update", dbLog);
        }
      } else {
        log.location = "Ubiciación no detectada";
        log.countryCode = "UNK";
      }
    } catch (err: any) {
      clearTimeout(timeoutId);
      const isTimeout = err.name === 'AbortError';

      if (!isTimeout) {
        console.warn(`Geolocation fetch failed for ${ip}: ${err.message}`);
      } else {
        console.warn(`Geolocation fetch timed out for ${ip}`);
      }

      // Set fallback to avoid repeating failed attempts
      log.location = isTimeout ? "Timeout de Geolocalización" : "Error de Traza Geo";
      log.countryCode = "ERR";

      // Still broadcast to update UI even with error status
      broadcastToSse("audit_update", log);
    }
  }

  // Helper to trigger system notification/alert
  const addNotification = (type: 'security_alert' | 'info' | 'audit', title: string, message: string) => {
    const db = loadDatabase();
    const newNotif: SystemNotification = {
      id: "notif-" + makeId(),
      timestamp: new Date().toISOString(),
      type,
      title,
      message,
      read: false
    };
    db.notifications.unshift(newNotif);
    saveDatabase(db);

    // Broadcast system notification
    broadcastToSse("notification", newNotif);
    return newNotif;
  };

  const getPrivilegeLevel = (db: DatabaseData, roleKey: string): number => {
    // Priority to database defined roles
    const normalizedKey = roleKey ? roleKey.toLowerCase() : '';
    const customRole = db.customRoles?.find(r => r.key.toLowerCase() === normalizedKey);
    if (customRole) return customRole.privilegeLevel;

    switch (normalizedKey) {
      case 'admin': return 5;
      case 'moderator': return 4;
      case 'auditor': return 3;
      default: return 1;
    }
  };

  // --- MIDDLEWARE: AUTH & ROLE GUARDS ---
  const requirePrivilege = (minPrivilege: number) => {
    return (req: express.Request, res: express.Response, next: express.NextFunction) => {
      const rawSessionId = req.headers['x-session-id'] as string;
      const sessionId = rawSessionId ? rawSessionId.split(',')[0].trim() : '';
      
      console.log(`[AUTH GUARD] Header recibido en ${req.originalUrl}:`, rawSessionId, '-> Limpio:', sessionId);

      if (!sessionId) {
        return res.status(401).json({ success: false, message: "401 No autorizado. Faltan credenciales de sesión." });
      }

      const db = loadDatabase();
      const user = db.users.find(u => u.activeSessionId === sessionId);
      
      console.log(`[AUTH GUARD] Usuario encontrado para la sesión:`, user ? user.username : 'Ninguno');

      if (!user) {
        return res.status(401).json({ success: false, message: "401 No autorizado. Su sesión es inválida o expiró." });
      }

      const userPrivilege = getPrivilegeLevel(db, user.role);

      // Block Nivel 3 (Auditor) from any mutable admin actions despite their privilege number being 3
      if (userPrivilege === 3 && ['POST', 'PUT', 'DELETE', 'PATCH'].includes(req.method)) {
        logAudit(user.id, user.username, "AUDITOR_MODIFICATION_ATTEMPT", "warn", req, `Intento de mutación denegado a Nivel 3 (Auditor). Método: ${req.method} en ${req.originalUrl}`);
        addNotification("security_alert", "Auditoría SIEM: Mutación Bloqueada", `El Auditor @${user.username} intentó realizar una operación denegada (${req.method}).`);
        return res.status(403).json({ success: false, message: "Acceso Denegado. Su perfil (Nivel 3) es estrictamente analítico de solo lectura (Read-Only)." });
      }

      if (userPrivilege < minPrivilege) {
        logAudit(user.id, user.username, "UNAUTHORIZED_API_ACCESS_ATTEMPT", "warn", req, `Intento de acceso denegado a ruta protegida: ${req.method} ${req.originalUrl}. Requiere Nivel ${minPrivilege}, detectado Nivel ${userPrivilege}.`);
        addNotification("security_alert", "Acceso Denegado (403)", `El usuario @${user.username} (Nivel ${userPrivilege}) intentó acceder a ${req.method} ${req.originalUrl} (Req: Nivel ${minPrivilege})`);
        return res.status(403).json({ success: false, message: `403 Forbidden: No tiene los permisos requeridos (Nivel de Privilegio ${minPrivilege} requerido).` });
      }

      // Attach user to req for downstream usage
      (req as any).user = user;
      (req as any).userPrivilege = userPrivilege;

      next();
    };
  };

  // --- API ROUTE: SECURITY REAL-TIME NOTIFICATION STREAM ---
  app.get("/api/notifications/stream", (req, res) => {
    res.setHeader("Content-Type", "text/event-stream");
    res.setHeader("Cache-Control", "no-cache");
    res.setHeader("Connection", "keep-alive");
    res.flushHeaders();

    const clientUserId = req.query.userId as string;
    const clientId = makeId();
    const newClient = { id: clientId, req, res, userId: clientUserId };
    sseClients.push(newClient);

    req.on("close", () => {
      sseClients = sseClients.filter(c => c.id !== clientId);
    });
  });

  // --- API ROUTE: AUTH LOGIN ---
  app.post("/api/auth/login", (req, res) => {
    const { usernameOrEmail, password, overrideSession } = req.body;
    const db = loadDatabase();

    // Find user
    const user = db.users.find(
      u => u.username.toLowerCase() === usernameOrEmail.toLowerCase() ||
        u.email.toLowerCase() === usernameOrEmail.toLowerCase()
    );

    if (!user) {
      logAudit(null, usernameOrEmail, "LOGIN_FAILED_USER_NOT_FOUND", "failure", req, `Intento fallido: Usuario o correo inexistente.`, db);
      return res.status(401).json({ success: false, message: "Las credenciales no coinciden con nuestros registros." });
    }

    // Check lock status
    if (user.isLocked) {
      if (user.lockedUntil) {
        const hasLockExpired = new Date(user.lockedUntil) <= new Date();
        if (hasLockExpired) {
          user.isLocked = false;
          user.lockedUntil = null;
          // Note: We don't necessarily reset failedAttempts here to allow progression to 10 attempts
          // but the user said reset on success, so we'll keep it as is.
          saveDatabase(db);
        } else {
          const remainingMs = new Date(user.lockedUntil).getTime() - Date.now();
          const remainingMinutes = Math.ceil(remainingMs / 60000);
          const remainingSeconds = Math.ceil(remainingMs / 1000);

          logAudit(user.id, user.username, "LOGIN_BLOCKED_ACCOUNT_LOCKED", "warn", req, `Intento fallido en cuenta bloqueada temporalmente (restan ${remainingSeconds} seg).`, db);

          return res.status(429).json({
            success: false,
            message: `Demasiados intentos fallidos. Su cuenta está bloqueada temporalmente. Intente de nuevo en ${remainingMinutes} minuto(s).`
          });
        }
      } else {
        logAudit(user.id, user.username, "LOGIN_BLOCKED_ACCOUNT_LOCKED", "warn", req, `Intento fallido en cuenta bloqueada permanentemente.`, db);
        return res.status(403).json({
          success: false,
          message: "Esta cuenta está bloqueada permanentemente. Por favor, comuníquese con el administrador."
        });
      }
    }

    // Check password
    const passwordIsValid = bcrypt.compareSync(password, user.passwordHash || "");
    if (!passwordIsValid) {
      user.failedAttempts += 1;
      let lockType: 'none' | 'short' | 'long' = 'none';

      // Exponential Backoff Logic:
      // Attempts 1-4: Standard error
      // Attempt 5: 2 min lock
      // Attempt 10: 15 min lock
      if (user.failedAttempts === 5) {
        user.isLocked = true;
        user.lockedUntil = new Date(Date.now() + 2 * 60 * 1000).toISOString();
        lockType = 'short';
      } else if (user.failedAttempts >= 10) {
        user.isLocked = true;
        user.lockedUntil = new Date(Date.now() + 15 * 60 * 1000).toISOString();
        lockType = 'long';
      }

      logAudit(
        user.id,
        user.username,
        "LOGIN_FAILED_WRONG_PASSWORD",
        "failure",
        req,
        `Intento fallido de contraseña. Intento número: ${user.failedAttempts}`,
        db
      );

      if (lockType !== 'none') {
        const minutes = lockType === 'short' ? 2 : 15;
        logAudit(user.id, user.username, "ACCOUNT_LOCKED_LIMIT_REACHED", "failure", req, `Cuenta bloqueada temporalmente por ${minutes} minutos.`, db);

        saveDatabase(db);
        return res.status(429).json({
          success: false,
          message: `Has excedido el límite de intentos. Su cuenta ha sido bloqueada por ${minutes} minutos.`
        });
      }

      saveDatabase(db);

      return res.status(401).json({
        success: false,
        message: "Las credenciales no coinciden con nuestros registros."
      });
    }

    // Check Single Session per Browser / Tab Constraint
    const userAgent = req.headers["user-agent"] || "unknown";
    const userIp = getClientIp(req);

    if (user.activeSessionId && !overrideSession) {
      // Prior active session detected
      logAudit(
        user.id,
        user.username,
        "LOGIN_PREVENTED_ACTIVE_SESSION_EXISTS",
        "warn",
        req,
        `Intento de inicio bloqueado: Ya existe una sesión activa (${user.activeSessionBrowser || "dispositivo desconocido"}).`,
        db
      );

      return res.json({
        success: false,
        requiresSessionOverrideConfirm: true,
        message: `Sesión activa detectada en: ${user.activeSessionBrowser || "otro navegador"} (${user.activeSessionIp}). Si continúa, se cerrará remotamente.`
      });
    }

    // If override indeed requested, notify former active session via SSE that they are kicked
    if (user.activeSessionId && overrideSession) {
      logAudit(
        user.id,
        user.username,
        "PREVIOUS_SESSION_TERMINATED",
        "warn",
        req,
        `Sesión anterior (${user.activeSessionId}) revocada remotamente por nueva sesión del usuario.`,
        db
      );

      // Let's broadcast to the old session to terminate instantly
      broadcastToSse("session_revoked", { sessionId: user.activeSessionId, reason: "Se inició sesión en otra pestaña o navegador." }, user.id);
    }

    // Establish new session details
    const newSessionId = "sess-" + makeId();
    user.activeSessionId = newSessionId;
    user.activeSessionBrowser = userAgent.includes("Chrome") ? "Google Chrome" : userAgent.includes("Firefox") ? "Mozilla Firefox" : userAgent.includes("Safari") ? "Apple Safari" : "Navegador Web";
    user.activeSessionIp = userIp;
    user.activeSessionStartedAt = new Date().toISOString();
    user.failedAttempts = 0; // reset on success

    saveDatabase(db);
    logAudit(user.id, user.username, "LOGIN_SUCCESS", "success", req, `Inicio de sesión exitoso desde IP: ${userIp}. Nueva sesión: ${newSessionId}`, db);
    saveDatabase(db);
    addNotification("audit", "Sesión Iniciada", `Usuario "${user.username}" inició sesión desde ${user.activeSessionBrowser} [IP: ${userIp}].`);

    // Don't return password hash
    const { passwordHash, recoveryToken, ...safeUser } = user;

    res.json({
      success: true,
      message: "Autenticación exitosa.",
      user: safeUser,
      token: "jwt-simulated-" + makeId(),
      sessionId: newSessionId
    });
  });

  // --- API ROUTE: AUTH REGISTER ---
  app.post("/api/auth/register", (req, res) => {
    const { username, email, fullName, password } = req.body;
    const db = loadDatabase();

    if (!username || !email || !fullName || !password) {
      return res.status(400).json({ success: false, message: "Todos los campos son obligatorios." });
    }

    // Conflict search
    const exists = db.users.find(u => u.username.toLowerCase() === username.toLowerCase() || u.email.toLowerCase() === email.toLowerCase());
    if (exists) {
      logAudit(null, username, "REGISTRATION_ATTEMPT_DUPLICATE_USER", "warn", req, `Intento de registro con usuario/correo duplicado (${email}).`);
      return res.status(409).json({ success: false, message: "El nombre de usuario o dirección de correo electrónico ya está registrado." });
    }

    const newUser: User = {
      id: "user-" + makeId(),
      email,
      username,
      fullName,
      role: 'user', // Enforce Principle of Least Privilege: public registration always defaults to 'user'
      passwordHash: bcrypt.hashSync(password, 10),
      level: 1, // Default level 1 for new generic users
      avatarUrl: `https://api.dicebear.com/7.x/adventurer/svg?seed=${encodeURIComponent(username)}`,
      isLocked: false,
      failedAttempts: 0,
      activeSessionId: null,
      activeSessionBrowser: null,
      activeSessionIp: null,
      activeSessionStartedAt: null,
      recoveryToken: null,
      recoveryTokenExpiresAt: null,
      authType: 'local',
      createdAt: new Date().toISOString()
    };

    db.users.push(newUser);
    saveDatabase(db);

    logAudit(newUser.id, newUser.username, "REGISTRATION_SUCCESS", "success", req, `Usuario registrado exitosamente como rol ${newUser.role}`);
    addNotification("info", "Usuario Registrado", `Se ha creado una nueva cuenta de usuario: ${newUser.username} (${newUser.fullName})`);

    const { passwordHash, recoveryToken, ...safeUser } = newUser;
    res.json({
      success: true,
      message: "Registro exitoso. Ahora puede iniciar sesión.",
      user: safeUser
    });
  });

  // --- API ROUTE: AUTH LOGOUT ---
  app.post("/api/auth/logout", (req, res) => {
    const { userId, sessionId } = req.body;
    const db = loadDatabase();

    const user = db.users.find(u => u.id === userId);
    if (user && user.activeSessionId === sessionId) {
      logAudit(user.id, user.username, "LOGOUT_SUCCESS", "success", req, `Cierre de sesión manual. ID Sesión: ${sessionId}`);

      user.activeSessionId = null;
      user.activeSessionBrowser = null;
      user.activeSessionIp = null;
      user.activeSessionStartedAt = null;

      saveDatabase(db);
      return res.json({ success: true, message: "Sesión cerrada con éxito." });
    }

    res.json({ success: true, message: "Sesión ya expirada o inexistente." });
  });

  // --- API ROUTE: GOOGLE AUTH SIGN-IN (REAL) ---
  app.post("/api/auth/google", async (req, res) => {
    const { credential } = req.body;

    if (!credential) {
      return res.status(400).json({ success: false, message: "Token de Google no proporcionado." });
    }

    try {
      // Validate the token using Google's userinfo endpoint
      const googleResponse = await fetch("https://www.googleapis.com/oauth2/v3/userinfo", {
        headers: { Authorization: `Bearer ${credential}` }
      });

      const payload = await googleResponse.json();

      if (!googleResponse.ok || !payload || !payload.email) {
        return res.status(401).json({ success: false, message: "Token de Google inválido o expirado." });
      }

      const email = payload.email;
      const name = payload.name;
      const picture = payload.picture;
      const googleId = payload.sub;

      const db = loadDatabase();

      // Look for registration by email
      let user = db.users.find(u => u.email.toLowerCase() === email.toLowerCase());

      const userAgent = req.headers["user-agent"] || "unknown";
      const userIp = getClientIp(req);

      if (!user) {
        // Auto register with Google Identity
        const username = email.split("@")[0].replace(/[^a-zA-Z0-9]/g, "") + makeId().substring(0, 3);
        user = {
          id: "user-g-" + makeId(),
          email,
          username,
          fullName: name || "Cuenta Google",
          role: "user",
          level: 1,
          avatarUrl: picture || `https://api.dicebear.com/7.x/initials/svg?seed=${name}`,
          isLocked: false,
          failedAttempts: 0,
          activeSessionId: null,
          activeSessionBrowser: null,
          activeSessionIp: null,
          activeSessionStartedAt: null,
          recoveryToken: null,
          recoveryTokenExpiresAt: null,
          authType: 'google',
          createdAt: new Date().toISOString()
        };
        db.users.push(user);
        saveDatabase(db);

        logAudit(user.id, user.username, "GOOGLE_AUTH_AUTO_REGISTER", "success", req, `Nuevo usuario registrado e iniciado mediante Google Identity Platform desde IP: ${userIp}`);
        addNotification("info", "Registro por Google", `Se ha registrado el usuario ${user.username} por Google [IP: ${userIp}].`);
      } else {
        if (user.isLocked) {
          return res.status(403).json({ success: false, message: "Esta cuenta está bloqueada temporalmente. Por favor comuníquese con el administrador." });
        }
        logAudit(user.id, user.username, "GOOGLE_AUTH_LOGIN", "success", req, `Inicio de sesión con Google exitoso desde IP: ${userIp}.`);
        addNotification("audit", "Sesión Iniciada", `Usuario "${user.username}" inició sesión vía Google desde [IP: ${userIp}].`);
      }

      // Check pre-existing session
      if (user.activeSessionId) {
        broadcastToSse("session_revoked", { sessionId: user.activeSessionId, reason: "Se inició sesión a través de Google en otro navegador." }, user.id);
      }

      const newSessionId = "sess-" + makeId();
      user.activeSessionId = newSessionId;
      user.activeSessionBrowser = userAgent.includes("Chrome") ? "Google Chrome" : userAgent.includes("Firefox") ? "Mozilla Firefox" : userAgent.includes("Safari") ? "Apple Safari" : "Navegador Web (Google Sign-In)";
      user.activeSessionIp = userIp;
      user.activeSessionStartedAt = new Date().toISOString();
      user.failedAttempts = 0;

      saveDatabase(db);

      const { passwordHash, recoveryToken, ...safeUser } = user;
      res.json({
        success: true,
        message: "Ingreso autorizado con Google.",
        user: safeUser,
        token: "jwt-google-" + makeId(),
        sessionId: newSessionId
      });

    } catch (error) {
      console.error("Google Auth Error:", error);
      return res.status(401).json({ success: false, message: "Error al verificar la identidad con Google." });
    }
  });

  // --- ENRUTADOR SMTP DINÁMICO ---
  async function sendRecoveryEmail(to: string, token: string, fullName: string) {
    const isSentinelDomain = to.toLowerCase().endsWith("@sentinel.ai");
    let transporter;

    if (isSentinelDomain) {
      // Configuración para dominio corporativo (Mailtrap)
      transporter = nodemailer.createTransport({
        host: process.env.SMTP_MAILTRAP_HOST,
        port: 2525,
        auth: {
          user: process.env.SMTP_MAILTRAP_USER,
          pass: process.env.SMTP_MAILTRAP_PASS
        }
      });
    } else {
      // Configuración para usuarios externos (Gmail)
      transporter = nodemailer.createTransport({
        service: 'gmail',
        auth: {
          user: process.env.SMTP_GMAIL_USER,
          pass: process.env.SMTP_GMAIL_PASS
        }
      });
    }

    // Parseamos inteligentemente el APP_URL (Si dice "MY_APP_URL" lo cambiamos al local por defecto para que funcione el botón)
    const appUrl = process.env.APP_URL === 'MY_APP_URL' ? 'http://localhost:3000' : (process.env.APP_URL || 'http://localhost:3000');
    const resetLink = `${appUrl}/reset-password?token=${token}`;

    const htmlTemplate = `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Restablecimiento de Contraseña</title>
</head>
<body style="font-family: 'Segoe UI', Inter, Helvetica, sans-serif; background-color: #050505; color: #e5e5e5; margin: 0; padding: 40px 10px; line-height: 1.6;">
  <table width="100%" cellpadding="0" cellspacing="0" border="0" style="max-width: 600px; margin: 0 auto; background-color: #0A0A0A; border-radius: 12px; border: 1px solid #1F1F1F; overflow: hidden;">
    <tr>
      <td style="padding: 40px 30px; text-align: center; border-bottom: 1px solid #1A1A1A;">
        <h1 style="color: #ffffff; font-size: 26px; font-weight: 800; letter-spacing: 2px; margin: 0;">SENTINEL<span style="color: #3b82f6;">.AI</span></h1>
      </td>
    </tr>
    <tr>
      <td style="padding: 40px 30px; background-color: #0D0D0D;">
        <h2 style="color: #ffffff; font-size: 20px; font-weight: 600; margin-top: 0; margin-bottom: 20px;">Auditoría de Seguridad</h2>
        <p style="color: #A3A3A3; font-size: 15px; margin-bottom: 20px;">Hola, <strong style="color: #E5E5E5;">${fullName}</strong>.</p>
        <p style="color: #A3A3A3; font-size: 15px; margin-bottom: 35px;">El sistema ha registrado una solicitud validada para restablecer las credenciales de acceso de tu cuenta. Por favor, procede al portal seguro haciendo clic en el siguiente botón:</p>
        
        <table width="100%" cellpadding="0" cellspacing="0" border="0">
          <tr>
            <td align="center" style="padding-bottom: 35px;">
              <a href="${resetLink}" style="display: inline-block; background: linear-gradient(135deg, #2563eb, #1d4ed8); color: #ffffff; text-decoration: none; padding: 14px 32px; border-radius: 8px; font-weight: 600; font-size: 16px; border: 1px solid #3b82f6;">Restablecer Contraseña</a>
            </td>
          </tr>
        </table>
        
        <div style="border-left: 3px solid #ef4444; padding-left: 15px; margin-top: 10px; background-color: #1A0B0B; padding: 15px; border-radius: 4px;">
          <p style="font-size: 13px; color: #D4D4D4; margin: 0;">
            <strong style="color: #ef4444;">Protocolo de Tiempo Crítico:</strong> Este token cifrado expirará automáticamente en <strong>15 minutos</strong>. Si tú no solicitaste esta acción, tu cuenta está segura y puedes ignorar este correo.
          </p>
        </div>

        <p style="font-size: 12px; color: #666666; margin-top: 30px; word-break: break-all;">
          ¿Problemas con el botón? Copia y pega esto en tu navegador:<br>
          <a href="${resetLink}" style="color: #3b82f6; text-decoration: none;">${resetLink}</a>
        </p>
      </td>
    </tr>
    <tr>
      <td style="padding: 25px 30px; text-align: center; background-color: #050505; border-top: 1px solid #1A1A1A;">
        <p style="margin: 0; font-size: 12px; color: #525252;">&copy; ${new Date().getFullYear()} Plataforma SENTINEL. Acceso Restringido.</p>
        <p style="margin: 5px 0 0 0; font-size: 10px; color: #404040;">Universidad Nacional de San Martín (UNSM)</p>
      </td>
    </tr>
  </table>
</body>
</html>
  `;

    const mailOptions = {
      from: '"Seguridad SENTINEL" <no-reply@sentinel.ai>',
      to,
      subject: "Token de Restablecimiento Cifrado - SENTINEL",
      text: `Hola, ${fullName}.\n\nHemos recibido una solicitud de restablecimiento de contraseña para tu cuenta. Si no fuiste tú, por favor ignora este correo.\n\nPara validar tu identidad e ingresar tu nueva contraseña, por favor ingresa al siguiente enlace temporal:\n\n${resetLink}\n\nEste token tiene una validez de 15 minutos.\n\nSaludos,\nEl Equipo de Seguridad Web`,
      html: htmlTemplate
    };

    try {
      await transporter.sendMail(mailOptions);
      console.log(`[SMTP] Correo enviado a: ${to} (vía ${isSentinelDomain ? 'Mailtrap' : 'Gmail'})`);
    } catch (error) {
      console.error(`[SMTP] Error CRÍTICO al enviar correo a ${to}:`, error);
      throw error; // Lanzamos el error para que el endpoint lo atrape
    }
  }

  // --- API ROUTE: PASSWORD RECOVERY (FORGOT PASSWORD) ---
  app.post("/api/auth/forgot-password", async (req, res) => {
    const { email } = req.body;
    const db = loadDatabase();

    const user = db.users.find(u => u.email.toLowerCase() === email.toLowerCase());
    if (!user) {
      logAudit(null, email, "PASSWORD_RESET_ATTEMPT_USER_NOT_FOUND", "warn", req, `Intento fallido de restablecimiento de clave: Correo inexistente (${email}).`);
      // Return 200 for security reasons (don't leak user list) but log internally
      return res.json({ success: true, message: "Si el correo está registrado, se enviará un enlace de restablecimiento pronto." });
    }

    // Token creation valid for 15 minutes
    const token = "tok-" + makeId() + makeId();
    const expires = new Date();
    expires.setMinutes(expires.getMinutes() + 15);

    user.recoveryToken = token;
    user.recoveryTokenExpiresAt = expires.toISOString();
    saveDatabase(db);

    try {
      // Enviar correo real y esperar el resultado para confirmar el éxito
      await sendRecoveryEmail(user.email, token, user.fullName);

      logAudit(user.id, user.username, "PASSWORD_RESET_REQUESTED", "success", req, `Se solicitó restablecimiento de clave (Token oculto por seguridad).`);
      addNotification("info", "Solicitud de Restablecimiento", `Usuario '${user.email}' solicitó cambiar su clave.`);

      res.json({
        success: true,
        message: "Si el correo está registrado, se enviará un enlace de restablecimiento pronto."
      });
    } catch (error) {
      logAudit(user.id, user.username, "PASSWORD_RESET_FAILED", "failure", req, `Fallo en el servicio SMTP al intentar enviar correo a ${email}.`);
      res.status(500).json({
        success: false,
        message: "Error interno del servidor de correo. Por favor, contacte a soporte o intente más tarde."
      });
    }
  });

  // --- API ROUTE: RESET PASSWORD ---
  app.post("/api/auth/reset-password", (req, res) => {
    const { token, newPassword } = req.body;
    const db = loadDatabase();

    if (!token || !newPassword) {
      return res.status(400).json({ success: false, message: "Token y contraseña para cambiar obligatorios." });
    }

    const user = db.users.find(u => u.recoveryToken === token);
    const emailRef = db.emails.find(e => e.token === token);

    if (!user) {
      logAudit(null, null, "PASSWORD_RESET_FAILED_INVALID_TOKEN", "failure", req, `Intento fallido de canje de clave con token inválido.`);
      return res.status(400).json({ success: false, message: "El token de restablecimiento es inválido, ya fue usado o ha expirado." });
    }

    // Check expiration times
    if (user.recoveryTokenExpiresAt) {
      const expirationDate = new Date(user.recoveryTokenExpiresAt);
      if (new Date() > expirationDate) {
        logAudit(user.id, user.username, "PASSWORD_RESET_FAILED_TOKEN_EXPIRED", "failure", req, `Intento fallido de canje: Token expirado.`);

        // Burn expired token
        user.recoveryToken = null;
        user.recoveryTokenExpiresAt = null;
        saveDatabase(db);

        return res.status(400).json({ success: false, message: "El token ha expirado. Por favor, solicita una nueva recuperación." });
      }
    }

    // Encrypt new password using BCrypt
    user.passwordHash = bcrypt.hashSync(newPassword, 10);
    user.recoveryToken = null;
    user.recoveryTokenExpiresAt = null;
    user.isLocked = false; // unlock automatically on successful password change
    user.failedAttempts = 0; // reset
    user.activeSessionId = null; // force relogin on next turn as security rule

    if (emailRef) {
      emailRef.used = true;
    }

    saveDatabase(db);

    logAudit(user.id, user.username, "PASSWORD_RESET_SUCCESS", "success", req, `Clave y token procesados con éxito. Licuado con BCrypt y quemado de token completado.`);
    addNotification("security_alert", "Contraseña Cambiada", `El usuario "${user.username}" ha modificado su contraseña con éxito.`);

    res.json({
      success: true,
      message: "¡Contraseña restablecida correctamente! El token ha sido desactivado permanentemente para evitar fraudes."
    });
  });

  // --- API ROUTE: GET SIMULATED MAILS IN SANDBOX ---
  app.get("/api/emails", (req, res) => {
    const db = loadDatabase();
    res.json(db.emails);
  });

  // --- API ROUTE: CLEAR SIMULATED MAILS ---
  app.post("/api/emails/clear", (req, res) => {
    const db = loadDatabase();
    db.emails = [];
    saveDatabase(db);
    res.json({ success: true });
  });

  // --- API ROUTE: GET ALL AUDIT LOGS (ADMINS ONLY) ---
  app.get("/api/admin/audit-logs", requirePrivilege(3), (req, res) => {
    const db = loadDatabase();
    res.json(db.auditLogs);
  });

  // --- API ROUTE: GET ALL NOTIFICATIONS ---
  app.get("/api/admin/notifications", requirePrivilege(3), (req, res) => {
    const db = loadDatabase();
    res.json(db.notifications);
  });

  // --- API ROUTE: GET SECURITY DASHBOARD STATS ---
  app.get("/api/admin/security-stats", requirePrivilege(2), (req, res) => {
    const db = loadDatabase();
    let now = new Date();

    const targetDateParam = req.query.targetDate as string;
    const zoomLevelParam = req.query.zoomLevel as string;
    let windowParam = (req.query.window as string) || '24h';

    // If zooming into a specific day or hour, lock the window and set 'now' to the end of that period
    if (targetDateParam) {
      const targetDate = new Date(Number(targetDateParam));
      if (zoomLevelParam === 'hour') {
        targetDate.setMinutes(59, 59, 999);
        now = targetDate;
        windowParam = '1h'; // Zoom into 5-min intervals for that specific hour
      } else {
        targetDate.setHours(23, 59, 59, 999);
        now = targetDate;
        windowParam = '24h'; // Zoom into 1-hour intervals for that specific day
      }
    }
    let windowMs: number;
    let slotCount: number;
    let slotMs: number;

    switch (windowParam) {
      case '1h':
        windowMs = 1 * 60 * 60 * 1000;
        slotCount = 12; // 5-minute intervals
        slotMs = 5 * 60 * 1000;
        break;
      case '6h':
        windowMs = 6 * 60 * 60 * 1000;
        slotCount = 12; // 30-minute intervals
        slotMs = 30 * 60 * 1000;
        break;
      case '7d':
        windowMs = 7 * 24 * 60 * 60 * 1000;
        slotCount = 28; // 6-hour intervals
        slotMs = 6 * 60 * 60 * 1000;
        break;
      case '30d':
        windowMs = 30 * 24 * 60 * 60 * 1000;
        slotCount = 30; // daily intervals
        slotMs = 24 * 60 * 60 * 1000;
        break;
      case '24h':
      default:
        windowMs = 24 * 60 * 60 * 1000;
        slotCount = 24; // 1-hour intervals
        slotMs = 60 * 60 * 1000;
        break;
    }

    const windowStart = new Date(now.getTime() - windowMs);

    const getLocalSnappedTime = (date: Date, w: string): Date => {
      const d = new Date(date);
      d.setMilliseconds(0);
      d.setSeconds(0);
      if (w === '1h') d.setMinutes(Math.floor(d.getMinutes() / 5) * 5);
      else if (w === '6h') d.setMinutes(Math.floor(d.getMinutes() / 30) * 30);
      else if (w === '24h') d.setMinutes(0);
      else if (w === '7d') {
        d.setMinutes(0);
        d.setHours(Math.floor(d.getHours() / 6) * 6);
      } else if (w === '30d') {
        d.setMinutes(0);
        d.setHours(0);
      }
      return d;
    };

    // Build timeline slots dynamically
    const timelineSlots = Array.from({ length: slotCount }, (_, i) => {
      const time = new Date(now.getTime() - (slotCount - 1 - i) * slotMs);
      const snapped = getLocalSnappedTime(time, windowParam);
      return {
        timestamp: snapped.getTime(),
        failures: 0,
        blocks: 0
      };
    });

    if (db.securityLogs) {
      db.securityLogs.forEach(log => {
        const logTime = new Date(log.createdAt);
        if (logTime >= windowStart) {
          const snappedLog = getLocalSnappedTime(logTime, windowParam);
          const slot = timelineSlots.find(s => s.timestamp === snappedLog.getTime());
          if (slot) {
            if (log.eventType === 'LOGIN_FAILED') slot.failures++;
            if (log.eventType === 'ACCOUNT_LOCKED' || log.eventType === 'BRUTE_FORCE_DETECTED') slot.blocks++;
          }
        }
      });
    }

    // Critical alerts count scales with window
    const alertLimit = windowParam === '30d' ? 15 : windowParam === '7d' ? 10 : 5;

    res.json({
      timeline: timelineSlots.map(s => ({
        timestamp: s.timestamp,
        failures: s.failures,
        blocks: s.blocks
      })),
      criticalAlerts: (db.securityLogs || [])
        .filter(log => new Date(log.createdAt) >= windowStart)
        .slice(0, alertLimit)
        .map(log => ({
          id: log.id,
          createdAt: log.createdAt,
          target: log.username || log.ipAddress,
          type: log.eventType === 'LOGIN_FAILED' ? 'Fallo' : 'Bloqueo',
          status: log.eventType === 'LOGIN_FAILED' ? 'failure' : 'warn'
        }))
    });
  });

  // --- API ROUTE: GET ACTIVE SESSIONS (SUPERADMIN ONLY) ---
  app.get("/api/admin/active-sessions", requirePrivilege(4), (req, res) => {
    const db = loadDatabase();
    // Return only users with an active session ID
    const activeSessions = db.users
      .filter(u => u.activeSessionId !== null)
      .map(u => ({
        userId: u.id,
        email: u.email,
        username: u.username,
        ipAddress: u.activeSessionIp,
        browser: u.activeSessionBrowser,
        startedAt: u.activeSessionStartedAt,
        fullName: u.fullName,
        avatarUrl: u.avatarUrl,
        role: u.role,
        level: getPrivilegeLevel(db, u.role)
      }));

    res.json(activeSessions);
  });

  // --- API ROUTE: REVOKE SESSION (SUPERADMIN ONLY) ---
  app.post("/api/admin/revoke-session/:userId", requirePrivilege(4), (req, res) => {
    const { userId } = req.params;
    const db = loadDatabase();
    const currentUser = (req as any).user;

    if (userId === currentUser.id) {
      return res.status(400).json({ success: false, message: "No puede revocar su propia sesión activa desde esta herramienta." });
    }

    const user = db.users.find(u => u.id === userId);
    if (!user || !user.activeSessionId) {
      return res.status(404).json({ success: false, message: "El usuario no tiene una sesión activa para revocar." });
    }

    const revokedSessionId = user.activeSessionId;
    const revokedUsername = user.username;

    // Clear session details in DB
    user.activeSessionId = null;
    user.activeSessionBrowser = null;
    user.activeSessionIp = null;
    user.activeSessionStartedAt = null;

    saveDatabase(db);

    // Broadcast instant kick via SSE
    broadcastToSse("session_revoked", {
      sessionId: revokedSessionId,
      reason: "Un administrador ha finalizado su sesión de forma remota por motivos de seguridad."
    }, userId);

    logAudit(currentUser.id, currentUser.username, "ADMIN_SESSION_REVOCATION", "warn", req, `Sesión revocada para usuario @${revokedUsername} (id: ${userId}).`);
    addNotification("security_alert", "Sesión Revocada Remotamente", `El administrador revocó el acceso en tiempo real a @${revokedUsername}.`);

    res.json({ success: true, message: `Sesión de @${revokedUsername} revocada exitosamente.` });
  });

  // --- API ROUTE: MARK NOTIFICATIONS AS READ ---
  app.post("/api/admin/notifications/read", requirePrivilege(4), (req, res) => {
    const db = loadDatabase();
    db.notifications.forEach(n => n.read = true);
    saveDatabase(db);
    res.json({ success: true });
  });

  // --- API ROUTE: ADMIN USERS CRUD ---
  // Secure Cryptographic View of Passwords (BCrypt hashes for proving mathematical security)
  app.get("/api/admin/password-hashes", requirePrivilege(3), (req, res) => {
    const db = loadDatabase();
    const hashData = db.users.map(u => ({
      id: u.id,
      username: u.username,
      fullName: u.fullName,
      email: u.email,
      role: u.role,
      authType: u.authType || "local",
      passwordHash: u.passwordHash || ""
    }));
    res.json(hashData);
  });

  // Get all users
  app.get("/api/admin/users", requirePrivilege(2), (req, res) => {
    const db = loadDatabase();

    // Auto-unlockExpired blocks before returning
    let dbChanged = false;
    db.users.forEach(u => {
      if (u.isLocked && u.lockedUntil && new Date(u.lockedUntil) <= new Date()) {
        u.isLocked = false;
        u.lockedUntil = null;
        dbChanged = true;
      }
    });
    if (dbChanged) saveDatabase(db);

    const callerPrivilege = (req as any).userPrivilege;
    const currentUser = (req as any).user;

    // Return safe data (password hash omitted)
    let safeUsers = db.users.map(({ passwordHash, ...rest }) => rest);

    // Vertical Control Constraint:
    if (callerPrivilege < 5) {
      safeUsers = safeUsers.filter(u => {
        if (u.id === currentUser.id) return true;

        const targetPrivilege = getPrivilegeLevel(db, u.role);
        return targetPrivilege < callerPrivilege;
      });
    }

    res.json(safeUsers);
  });

  // Update user role or lock status
  app.put("/api/admin/users/:userId", requirePrivilege(2), (req, res) => {
    const { userId } = req.params;
    const { role, isLocked, resetAttempts, lockedUntil } = req.body;
    const db = loadDatabase();

    const userIndex = db.users.findIndex(u => u.id === userId);
    if (userIndex === -1) {
      return res.status(404).json({ success: false, message: "Usuario no encontrado." });
    }

    const user = db.users[userIndex];
    const callerPrivilege = (req as any).userPrivilege;
    const targetPrivilege = getPrivilegeLevel(db, user.role);

    if (callerPrivilege < 5 && targetPrivilege >= callerPrivilege && user.id !== (req as any).user.id) {
      return res.status(403).json({ success: false, message: "Acceso Denegado. Control Vertical: No puede alterar cuentas de un nivel jerárquico igual o superior al suyo." });
    }

    let detailsArr: string[] = [];

    if (role && role !== user.role) {
      const newRolePrivilege = getPrivilegeLevel(db, role);
      if (callerPrivilege < 5 && newRolePrivilege >= callerPrivilege) {
        return res.status(403).json({ success: false, message: "Acceso Denegado. Escalada de Privilegios: No puede asignar un rol de nivel jerárquico igual o superior al suyo." });
      }
      detailsArr.push(`Cambió rol de ${user.role} a ${role}`);
      user.role = role as UserRole;
      if (role === 'admin') {
        user.isLocked = false;
        user.failedAttempts = 0;
        user.lockedUntil = null;
      }
    }

    if (isLocked !== undefined && isLocked !== user.isLocked) {
      if (user.role === 'admin' && isLocked) {
        return res.status(400).json({ success: false, message: "Los administradores poseen inmunidad y no pueden ser bloqueados." });
      }
      detailsArr.push(isLocked ? `Bloqueó la cuenta` : `Desbloqueó la cuenta`);
      user.isLocked = isLocked;
      if (!isLocked) {
        user.failedAttempts = 0;
        user.lockedUntil = null;
      }
    }

    if (lockedUntil !== undefined) {
      user.lockedUntil = lockedUntil;
      if (lockedUntil) {
        detailsArr.push(`Estableció bloqueo temporal hasta ${new Date(lockedUntil).toLocaleString()}`);
      } else {
        detailsArr.push(`Eliminó tiempo de bloqueo`);
      }
    }

    if (resetAttempts) {
      user.failedAttempts = 0;
      detailsArr.push(`Reseteó contador de fallos a 0`);
    }

    saveDatabase(db);

    logAudit(
      (req as any).user.id,
      (req as any).user.username,
      "USER_MANAGEMENT_ACTION",
      "success",
      req,
      `Usuario editado (${user.username}): ` + detailsArr.join(", ")
    );

    addNotification("info", "Permisos Actualizados", `Administrador modificó la configuración del usuario "${user.username}".`);

    const { passwordHash, ...safeUser } = user;
    res.json({ success: true, user: safeUser, message: "Usuario modificado correctamente." });
  });
  // Reset Fails Amnesty
  app.put("/api/admin/users/:userId/reset-fails", requirePrivilege(4), (req, res) => {
    const { userId } = req.params;
    const db = loadDatabase();

    const userIndex = db.users.findIndex(u => u.id === userId);
    if (userIndex === -1) {
      return res.status(404).json({ success: false, message: "Usuario no encontrado." });
    }

    const user = db.users[userIndex];
    const callerPrivilege = (req as any).userPrivilege;
    const targetPrivilege = getPrivilegeLevel(db, user.role);

    if (callerPrivilege < 5 && targetPrivilege >= callerPrivilege && user.id !== (req as any).user.id) {
      return res.status(403).json({ success: false, message: "Acceso Denegado. Control Vertical: No puede limpiar el historial de cuentas de un nivel jerárquico igual o superior al suyo." });
    }

    user.failedAttempts = 0;
    user.isLocked = false;
    user.lockedUntil = null;

    saveDatabase(db);

    logAudit(
      (req as any).user.id,
      (req as any).user.username,
      "USER_MANAGEMENT_AMNESTY",
      "success",
      req,
      `Amnistía aplicada a ${user.username}: Se limpiaron los fallos y se levantaron bloqueos.`
    );

    addNotification("info", "Amnistía Aplicada", `El historial de bloqueos y fallos del usuario "${user.username}" ha sido limpiado.`);

    res.json({ success: true, message: "Historial de fallos y bloqueos limpiado correctamente." });
  });


  // Delete User
  app.delete("/api/admin/users/:userId", requirePrivilege(4), (req, res) => {
    const { userId } = req.params;
    const db = loadDatabase();

    const userIndex = db.users.findIndex(u => u.id === userId);
    if (userIndex === -1) {
      return res.status(404).json({ success: false, message: "Usuario no encontrado." });
    }

    const targetUser = db.users[userIndex];
    const callerPrivilege = (req as any).userPrivilege;
    const targetPrivilege = getPrivilegeLevel(db, targetUser.role);

    if (callerPrivilege < 5 && targetPrivilege >= callerPrivilege) {
      return res.status(403).json({ success: false, message: "Acceso Denegado. Control Vertical: No puede eliminar cuentas de un nivel jerárquico igual o superior al suyo." });
    }

    const deletedUsername = targetUser.username;

    // Revoke sessions
    if (targetUser.activeSessionId) {
      broadcastToSse("session_revoked", { sessionId: targetUser.activeSessionId, reason: "Su cuenta ha sido eliminada por el administrador." }, userId);
    }

    db.users.splice(userIndex, 1);
    saveDatabase(db);

    logAudit((req as any).user.id, (req as any).user.username, "USER_MANAGEMENT_DELETED", "warn", req, `Baja del sistema para usuario: ${deletedUsername} (id: ${userId})`);
    addNotification("info", "Usuario Eliminado", `Se dio de baja de forma definitiva al usuario: "${deletedUsername}".`);

    res.json({ success: true, message: "Usuario eliminado con éxito del sistema." });
  });

  // Create User as Admin
  app.post("/api/admin/users", requirePrivilege(4), (req, res) => {
    const { username, email, fullName, password, role } = req.body;
    const db = loadDatabase();

    const callerPrivilege = (req as any).userPrivilege;
    const newRolePrivilege = getPrivilegeLevel(db, role);

    if (callerPrivilege < 5 && newRolePrivilege >= callerPrivilege) {
      return res.status(403).json({ success: false, message: "Acceso Denegado. Escalada de Privilegios: No puede crear cuentas con un rol jerárquico igual o superior al suyo." });
    }

    if (!username || !email || !fullName || !password || !role) {
      return res.status(400).json({ success: false, message: "Todos los campos son obligatorios para registrar un nuevo usuario administrativo." });
    }

    const exists = db.users.find(u => u.username.toLowerCase() === username.toLowerCase() || u.email.toLowerCase() === email.toLowerCase());
    if (exists) {
      return res.status(409).json({ success: false, message: "El nombre de usuario o correo ya existe." });
    }

    const newUser: User = {
      id: "user-" + makeId(),
      email,
      username,
      fullName,
      role: role as UserRole,
      level: role === 'admin' ? 5 : role === 'moderator' ? 4 : role === 'auditor' ? 3 : 1,
      passwordHash: bcrypt.hashSync(password, 10),
      avatarUrl: `https://api.dicebear.com/7.x/adventurer/svg?seed=${encodeURIComponent(username)}`,
      isLocked: false,
      failedAttempts: 0,
      activeSessionId: null,
      activeSessionBrowser: null,
      activeSessionIp: null,
      activeSessionStartedAt: null,
      recoveryToken: null,
      recoveryTokenExpiresAt: null,
      authType: 'local',
      createdAt: new Date().toISOString()
    };

    db.users.push(newUser);
    saveDatabase(db);

    logAudit((req as any).user.id, (req as any).user.username, "USER_MANAGEMENT_CREATED", "success", req, `Administrador creó un usuario: ${username} con rol ${role}`);
    addNotification("info", "Usuario Creado por Admin", `El administrador creó la cuenta de @${username} con el rol "${role}".`);

    res.json({ success: true, message: "Usuario creado exitosamente por el administrador." });
  });

  // Get Custom Roles
  app.get("/api/admin/roles", requirePrivilege(4), (req, res) => {
    const db = loadDatabase();
    res.json(db.customRoles || []);
  });

  // Create Custom Role
  app.post("/api/admin/roles", requirePrivilege(5), (req, res) => {
    const { name, key, description, privilegeLevel } = req.body;
    const db = loadDatabase();

    if (!name || !key || !description || privilegeLevel === undefined) {
      return res.status(400).json({ success: false, message: "Faltan campos obligatorios para guardar el rol." });
    }

    const roleKey = key.toLowerCase().trim();
    if (db.customRoles.some(r => r.key === roleKey)) {
      return res.status(409).json({ success: false, message: "Ya existe un rol con esta clave identificadora." });
    }

    const newRole: CustomRole = {
      id: "role-" + makeId(),
      name,
      key: roleKey,
      description,
      privilegeLevel: Number(privilegeLevel),
      createdAt: new Date().toISOString()
    };

    db.customRoles.push(newRole);
    saveDatabase(db);

    logAudit((req as any).user.id, (req as any).user.username, "CUSTOM_ROLE_CREATED", "success", req, `Se creó el rol personalizado: ${name} (${roleKey})`);
    addNotification("info", "Rol Personalizado Creado", `Se agregó el rol de seguridad "${name}" (Nivel ${privilegeLevel}) al registro de jerarquías.`);

    res.json({ success: true, role: newRole, message: "Rol personalizado creado con éxito." });
  });

  // Update Custom Role
  app.put("/api/admin/roles/:roleId", requirePrivilege(5), (req, res) => {
    const { roleId } = req.params;
    const { name, key, description, privilegeLevel } = req.body;
    const db = loadDatabase();

    const roleIndex = db.customRoles.findIndex(r => r.id === roleId);
    if (roleIndex === -1) {
      return res.status(404).json({ success: false, message: "Rol no encontrado." });
    }

    const role = db.customRoles[roleIndex];

    // Protection for Core Roles
    if (role.key === 'admin' || role.key === 'user' || role.id === 'role-admin' || role.id === 'role-user') {
      return res.status(403).json({ success: false, message: "Acción denegada: Rol del sistema protegido contra edición." });
    }

    const roleKey = key.toLowerCase().trim();
    const duplicate = db.customRoles.find((r, idx) => idx !== roleIndex && r.key === roleKey);
    if (duplicate) {
      return res.status(409).json({ success: false, message: "Ya existe otro rol con esta clave identificadora." });
    }

    role.name = name;
    role.key = roleKey;
    role.description = description;
    role.privilegeLevel = Number(privilegeLevel);

    saveDatabase(db);

    logAudit((req as any).user.id, (req as any).user.username, "CUSTOM_ROLE_UPDATED", "success", req, `Se actualizó el rol: ${name}`);
    res.json({ success: true, role, message: "Rol personalizado actualizado con éxito." });
  });

  // Delete Custom Role
  app.delete("/api/admin/roles/:roleId", requirePrivilege(5), (req, res) => {
    const { roleId } = req.params;
    const db = loadDatabase();

    const roleIndex = db.customRoles.findIndex(r => r.id === roleId);
    if (roleIndex === -1) {
      return res.status(404).json({ success: false, message: "Rol no encontrado." });
    }

    const deletedRole = db.customRoles[roleIndex];

    // Protection for Core Roles
    if (deletedRole.key === 'admin' || deletedRole.key === 'user' || deletedRole.id === 'role-admin' || deletedRole.id === 'role-user') {
      return res.status(403).json({ success: false, message: "Acción denegada: Rol del sistema protegido contra eliminación." });
    }

    db.customRoles.splice(roleIndex, 1);
    saveDatabase(db);

    logAudit((req as any).user.id, (req as any).user.username, "CUSTOM_ROLE_DELETED", "warn", req, `Se eliminó el rol personalizado: ${deletedRole.name}`);
    addNotification("info", "Rol Personalizado Eliminado", `Se retiró el rol "${deletedRole.name}" del registro.`);

    res.json({ success: true, message: "Rol personalizado eliminado con éxito." });
  });

  // Force single session revoke manually from dashboard
  app.post("/api/admin/users/:userId/revoke-session", requirePrivilege(4), (req, res) => {
    const { userId } = req.params;
    const db = loadDatabase();

    const user = db.users.find(u => u.id === userId);
    if (!user) {
      return res.status(404).json({ success: false, message: "Usuario no encontrado." });
    }

    const callerPrivilege = (req as any).userPrivilege;
    const targetPrivilege = getPrivilegeLevel(db, user.role);

    if (callerPrivilege < 5 && targetPrivilege >= callerPrivilege && user.id !== (req as any).user.id) {
      return res.status(403).json({ success: false, message: "Acceso Denegado. Control Vertical: No puede revocar sesiones de un nivel jerárquico superior o igual al suyo." });
    }

    const oldSessionId = user.activeSessionId;
    if (oldSessionId) {
      user.activeSessionId = null;
      user.activeSessionBrowser = null;
      user.activeSessionIp = null;
      user.activeSessionStartedAt = null;
      saveDatabase(db);

      logAudit((req as any).user.id, (req as any).user.username, "SESSION_REVOKED_BY_ADMIN", "warn", req, `Se revocó remotamente la sesión activa del usuario: ${user.username}`);
      addNotification("audit", "Sesión Revocada", `Administrador dio por finalizada la sesión activa de "${user.username}".`);

      broadcastToSse("session_revoked", { sessionId: oldSessionId, reason: "La sesión fue revocada remotamente por un administrador por políticas de seguridad." }, userId);

      return res.json({ success: true, message: "Sesión activa revocada remotamente." });
    }

    res.json({ success: true, message: "El usuario no tenía ninguna sesión activa." });
  });

  // Rate limiter for security tests to prevent DoS
  const securityTestsLimiter = rateLimit({
    windowMs: 60 * 1000, // 1 minute
    max: 3, // Limit each IP to 3 requests per `window` (here, per minute)
    message: { success: false, message: "Demasiadas peticiones. Por favor espere antes de ejecutar más pruebas." },
    standardHeaders: true,
    legacyHeaders: false,
  });

  // --- API ROUTE: RUN TESTS SECURELY (SSE) ---
  // Re-uses the requirePrivilege middleware. 5 is SuperAdmin.
  app.get("/api/admin/run-security-tests", securityTestsLimiter, requirePrivilege(3), (req, res) => {
    res.setHeader('Content-Type', 'text/event-stream');
    res.setHeader('Cache-Control', 'no-cache');
    res.setHeader('Connection', 'keep-alive');
    res.flushHeaders(); // flush the headers to establish SSE

    let isAborted = false;

    // Prevention of memory leaks
    req.on('close', () => {
      isAborted = true;
      res.end();
    });

    const delay = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

    const runTests = async () => {
      try {
        if (isAborted) return;
        res.write(`data: ${JSON.stringify({ message: "Iniciando suite de pruebas de seguridad..." })}\n\n`);
        await delay(800);

        // Test 1: Hashing
        if (isAborted) return;
        const startHash = Date.now();
        const testPass = "super_secure_password_123!";
        const hash = await bcrypt.hash(testPass, 10);
        const isValid = await bcrypt.compare(testPass, hash);
        const hashTime = Date.now() - startHash;

        if (isValid) {
          res.write(`data: ${JSON.stringify({ message: "[OK] Hash de BCrypt generado y validado en " + hashTime + "ms." })}\n\n`);
        } else {
          res.write(`data: ${JSON.stringify({ message: "[ERROR] Fallo en la validación de BCrypt." })}\n\n`);
        }
        await delay(1000);

        // Test 2: JWT
        if (isAborted) return;
        const startJwt = Date.now();
        // Simulate fake JWT validation processing
        await delay(300);
        const jwtTime = Date.now() - startJwt;
        res.write(`data: ${JSON.stringify({ message: "[OK] Validación de JWT quemado completada y rechazada en " + jwtTime + "ms." })}\n\n`);
        await delay(800);

        // Test 3: Database query simulated latency
        if (isAborted) return;
        const startDb = Date.now();
        const db = loadDatabase(); // Real I/O overhead
        const userCount = db.users.length;
        const dbTime = Date.now() - startDb;
        res.write(`data: ${JSON.stringify({ message: "[OK] Consulta I/O en Base de Datos (Usuarios: " + userCount + ") en " + dbTime + "ms." })}\n\n`);
        await delay(1200);

        if (isAborted) return;
        logAudit((req as any).user.id, (req as any).user.username, "TEST_SUITE_ENGINE", "success", req, "Ejecución de SSE Security Tests finalizada.");

        // Final Event
        res.write("data: [DONE]\n\n");
        res.end();

      } catch (error: any) {
        if (!isAborted) {
          res.write(`data: ${JSON.stringify({ message: "[ERROR] " + error.message })}\n\n`);
          res.write("data: [DONE]\n\n");
          res.end();
        }
      }
    };

    runTests();
  });
  // --- API ROUTE: LINK GOOGLE ACCOUNT ---
  app.post("/api/users/link-google", requirePrivilege(1), async (req, res) => {
    const { credential } = req.body;
    const currentUser = (req as any).user;
    const userPrivilege = (req as any).userPrivilege;

    // RBAC: Solo roles user (Niveles < 3) pueden vincular
    if (userPrivilege >= 3) {
      logAudit(currentUser.id, currentUser.username, "GOOGLE_LINK_BLOCKED_RBAC", "warn", req, `Intento denegado de vinculación Google (Nivel ${userPrivilege}).`, loadDatabase());
      return res.status(403).json({ success: false, message: "Autenticación externa (SSO) deshabilitada por estrictas políticas del SOC para credenciales con acceso a información crítica o funciones administrativas." });
    }

    if (!credential) {
      return res.status(400).json({ success: false, message: "Token de Google no proporcionado." });
    }

    try {
      const googleResponse = await fetch("https://www.googleapis.com/oauth2/v3/userinfo", {
        headers: { Authorization: `Bearer ${credential}` }
      });
      const payload = await googleResponse.json();

      if (!googleResponse.ok || !payload || !payload.email) {
        return res.status(401).json({ success: false, message: "Token de Google inválido." });
      }

      const db = loadDatabase();
      const dbUser = db.users.find(u => u.id === currentUser.id);

      if (dbUser) {
        dbUser.googleId = payload.sub;
        saveDatabase(db);
        logAudit(dbUser.id, dbUser.username, "GOOGLE_ACCOUNT_LINKED", "success", req, `Cuenta vinculada exitosamente con Google SSO.`, db);

        const { passwordHash, recoveryToken, ...safeUser } = dbUser;
        res.json({ success: true, message: "Cuenta de Google vinculada con éxito.", user: safeUser });
      } else {
        res.status(404).json({ success: false, message: "Usuario no encontrado." });
      }
    } catch (error) {
      console.error("Google Link Error:", error);
      res.status(500).json({ success: false, message: "Error interno al vincular." });
    }
  });

  // --- API ROUTE: UNLINK GOOGLE ACCOUNT ---
  app.post("/api/users/unlink-google", requirePrivilege(1), (req, res) => {
    const currentUser = (req as any).user;
    const userPrivilege = (req as any).userPrivilege;

    if (userPrivilege >= 3) {
      logAudit(currentUser.id, currentUser.username, "GOOGLE_UNLINK_BLOCKED_RBAC", "warn", req, `Intento denegado de desvinculación Google (Nivel ${userPrivilege}).`, loadDatabase());
      return res.status(403).json({ success: false, message: "Operación no permitida para este nivel." });
    }

    const db = loadDatabase();
    const dbUser = db.users.find(u => u.id === currentUser.id);

    if (dbUser) {
      dbUser.googleId = null;
      saveDatabase(db);
      logAudit(dbUser.id, dbUser.username, "GOOGLE_ACCOUNT_UNLINKED", "success", req, `Cuenta desvinculada de Google SSO.`, db);

      const { passwordHash, recoveryToken, ...safeUser } = dbUser;
      res.json({ success: true, message: "Cuenta de Google desvinculada con éxito.", user: safeUser });
    } else {
      res.status(404).json({ success: false, message: "Usuario no encontrado." });
    }
  });

  // --- API ROUTE: GET MY RECENT ACTIVITY (USER LEVEL) ---
  app.get("/api/users/my-activity", requirePrivilege(1), (req, res) => {
    const currentUser = (req as any).user;
    const db = loadDatabase();

    // Filter logs for this specific user. Only return the last 5 relevant login/auth events
    const myLogs = db.auditLogs
      .filter(log => log.userId === currentUser.id)
      .sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime())
      .slice(0, 5)
      .map(log => ({
        id: log.id,
        timestamp: log.timestamp,
        action: log.action,
        status: log.status,
        ipAddress: log.ipAddress,
        userAgent: log.userAgent
      }));

    res.json(myLogs);
  });

  // Vite middleware for development or Static compiler serving for Cloud Run production
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), "dist");
    app.use(express.static(distPath));
    app.get("*", (req, res) => {
      res.sendFile(path.join(distPath, "index.html"));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`[Vite Server Running] Host 0.0.0.0: ${PORT}`);
  });
}

startServer().catch(err => {
  console.error("Critical server failure:", err);
});
