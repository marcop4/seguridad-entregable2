/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

export type UserRole = string;

export interface CustomRole {
  id: string;
  name: string;
  key: string;
  description: string;
  privilegeLevel: number;
  createdAt: string;
}

export interface User {
  id: string;
  email: string;
  username: string;
  fullName: string;
  role: UserRole;
  level: number;
  passwordHash?: string;
  avatarUrl?: string;
  isLocked: boolean;
  lockedUntil?: string | null;
  failedAttempts: number;
  activeSessionId: string | null;
  activeSessionBrowser: string | null;
  activeSessionIp: string | null;
  activeSessionStartedAt: string | null;
  recoveryToken: string | null;
  recoveryTokenExpiresAt: string | null;
  authType: 'local' | 'google';
  createdAt: string;
}

export interface AuditLog {
  id: string;
  timestamp: string;
  userId: string | null;
  username: string | null;
  action: string; // e.g., 'LOGIN_SUCCESS', 'LOGIN_FAILED', 'PASSWORD_RESET_REQUEST', 'ACCOUNT_LOCKED'
  status: 'success' | 'failure' | 'warn';
  ipAddress: string;
  userAgent: string;
  details: string;
  location?: string;
  countryCode?: string;
}

export interface SecurityEvent {
  id: string;
  userId: string | null;
  username: string | null;
  eventType: 'LOGIN_FAILED' | 'ACCOUNT_LOCKED' | 'BRUTE_FORCE_DETECTED';
  ipAddress: string;
  createdAt: string;
}

export interface SystemNotification {
  id: string;
  timestamp: string;
  type: 'security_alert' | 'info' | 'audit';
  title: string;
  message: string;
  read: boolean;
}

export interface AuthResponse {
  success: boolean;
  message: string;
  user?: Omit<User, 'passwordHash' | 'recoveryToken'>;
  token?: string;
  sessionId?: string;
  requiresSessionOverrideConfirm?: boolean;
}

export interface EmailSandboxItem {
  id: string;
  to: string;
  subject: string;
  body: string;
  token: string;
  timestamp: string;
  used: boolean;
}
