/**
 * Security & Input Sanitization Utilities for Persian Wedding Invitation App
 */

// Convert Persian and Arabic numbers to standard English digits
export function normalizeDigits(input: string): string {
  if (!input) return '';
  return input
    .replace(/[۰-۹]/g, (d) => String.fromCharCode(d.charCodeAt(0) - 1776 + 48))
    .replace(/[٠-٩]/g, (d) => String.fromCharCode(d.charCodeAt(0) - 1632 + 48))
    .trim();
}

// Robust HTML sanitization to prevent XSS injection in user-submitted strings (RSVP & Guestbook)
export function sanitizeString(input: string, maxLength = 500): string {
  if (!input || typeof input !== 'string') return '';
  return input
    .replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '') // Remove scripts
    .replace(/<iframe\b[^<]*(?:(?!<\/iframe>)<[^<]*)*<\/iframe>/gi, '') // Remove iframes
    .replace(/<style\b[^<]*(?:(?!<\/style>)<[^<]*)*<\/style>/gi, '') // Remove styles
    .replace(/<object\b[^<]*(?:(?!<\/object>)<[^<]*)*<\/object>/gi, '') // Remove objects
    .replace(/<embed\b[^<]*(?:(?!<\/embed>)<[^<]*)*<\/embed>/gi, '') // Remove embeds
    .replace(/<[^>]+>/g, '') // Strip HTML tags
    .replace(/javascript\s*:/gi, '')
    .replace(/data\s*:\s*text\/html/gi, '')
    .replace(/vbscript\s*:/gi, '')
    .replace(/\bon\w+\s*=/gi, '') // Remove onload=, onerror=, onclick=, etc.
    .replace(/[<>]/g, '') // Escape angle brackets
    .trim()
    .slice(0, maxLength);
}

// Simple fast SHA-256 hash using Web Crypto API
export async function sha256Hex(message: string): Promise<string> {
  const normalized = normalizeDigits(message);
  try {
    if (typeof window !== 'undefined' && window.crypto && window.crypto.subtle) {
      const msgUint8 = new TextEncoder().encode(normalized + '_salt_persian_wedding_2025');
      const hashBuffer = await window.crypto.subtle.digest('SHA-256', msgUint8);
      const hashArray = Array.from(new Uint8Array(hashBuffer));
      return hashArray.map((b) => b.toString(16).padStart(2, '0')).join('');
    }
  } catch {
    // Fallback if subtle crypto is unavailable
  }
  // Basic deterministic fallback hash
  let hash = 0;
  for (let i = 0; i < normalized.length; i++) {
    const char = normalized.charCodeAt(i);
    hash = (hash << 5) - hash + char;
    hash |= 0;
  }
  return 'h_' + Math.abs(hash).toString(16);
}

// Verify input password against target PIN or target hash
export async function verifyPasswordSecurely(entered: string, storedTarget: string): Promise<boolean> {
  const normEntered = normalizeDigits(entered);
  const normTarget = normalizeDigits(storedTarget);

  if (!normEntered || !normTarget) return false;

  // Direct match with normalization
  if (normEntered === normTarget) return true;

  // Check if target is a hashed string
  if (normTarget.startsWith('h_') || normTarget.length === 64) {
    const enteredHash = await sha256Hex(normEntered);
    return enteredHash === normTarget;
  }

  return false;
}

// Brute Force Lockout Management
const MAX_ATTEMPTS = 5;
const LOCKOUT_DURATION_MS = 60 * 1000; // 60 seconds
const STORAGE_KEY = 'admin_security_lockout';

interface LockoutState {
  failedAttempts: number;
  lockedUntil: number;
}

function getStoredLockout(): LockoutState {
  try {
    const saved = localStorage.getItem(STORAGE_KEY);
    if (saved) {
      const parsed = JSON.parse(saved);
      return {
        failedAttempts: parsed.failedAttempts || 0,
        lockedUntil: parsed.lockedUntil || 0
      };
    }
  } catch {
    // ignore
  }
  return { failedAttempts: 0, lockedUntil: 0 };
}

function saveLockout(state: LockoutState) {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
  } catch {
    // ignore
  }
}

export function checkLockoutStatus(): {
  isLocked: boolean;
  remainingSeconds: number;
  attemptsLeft: number;
} {
  const state = getStoredLockout();
  const now = Date.now();

  if (state.lockedUntil > now) {
    const remainingSeconds = Math.ceil((state.lockedUntil - now) / 1000);
    return {
      isLocked: true,
      remainingSeconds,
      attemptsLeft: 0
    };
  }

  // If lockout expired, reset attempts count
  if (state.lockedUntil > 0 && state.lockedUntil <= now) {
    saveLockout({ failedAttempts: 0, lockedUntil: 0 });
    return {
      isLocked: false,
      remainingSeconds: 0,
      attemptsLeft: MAX_ATTEMPTS
    };
  }

  const attemptsLeft = Math.max(0, MAX_ATTEMPTS - state.failedAttempts);
  return {
    isLocked: false,
    remainingSeconds: 0,
    attemptsLeft
  };
}

export function recordFailedAttempt(): {
  isLocked: boolean;
  remainingSeconds: number;
  attemptsLeft: number;
} {
  const state = getStoredLockout();
  const newAttempts = state.failedAttempts + 1;

  if (newAttempts >= MAX_ATTEMPTS) {
    const lockedUntil = Date.now() + LOCKOUT_DURATION_MS;
    saveLockout({ failedAttempts: newAttempts, lockedUntil });
    return {
      isLocked: true,
      remainingSeconds: 60,
      attemptsLeft: 0
    };
  }

  saveLockout({ failedAttempts: newAttempts, lockedUntil: 0 });
  return {
    isLocked: false,
    remainingSeconds: 0,
    attemptsLeft: MAX_ATTEMPTS - newAttempts
  };
}

export function resetLockout() {
  saveLockout({ failedAttempts: 0, lockedUntil: 0 });
}

// Session expiration helper (4 hours timeout)
const SESSION_EXPIRY_MS = 4 * 60 * 60 * 1000;
const SESSION_KEY = 'wedding_admin_auth_v2';

export function saveAdminSession(token?: string, pin?: string): void {
  try {
    const sessionData = {
      authenticated: true,
      token: token || 'admin_token_' + Date.now(),
      pin: pin ? normalizeDigits(pin) : undefined,
      expiresAt: Date.now() + SESSION_EXPIRY_MS
    };
    sessionStorage.setItem(SESSION_KEY, JSON.stringify(sessionData));
  } catch {
    // ignore
  }
}

export function getIsAdminSessionValid(): boolean {
  try {
    const sessionStr = sessionStorage.getItem(SESSION_KEY);
    if (!sessionStr) return false;
    const session = JSON.parse(sessionStr);
    if (session.authenticated && session.expiresAt && session.expiresAt > Date.now()) {
      return true;
    }
  } catch {
    // ignore
  }
  return false;
}

export function getAdminAuthHeaders(): Record<string, string> {
  try {
    const sessionStr = sessionStorage.getItem(SESSION_KEY);
    if (!sessionStr) return {};
    const session = JSON.parse(sessionStr);
    if (session.authenticated && session.expiresAt && session.expiresAt > Date.now()) {
      const headers: Record<string, string> = {};
      if (session.token) {
        headers['X-Admin-Token'] = session.token;
      }
      if (session.pin) {
        headers['X-Admin-Pin'] = session.pin;
      }
      return headers;
    }
  } catch {
    // ignore
  }
  return {};
}

export function clearAdminSession(): void {
  try {
    sessionStorage.removeItem(SESSION_KEY);
    sessionStorage.removeItem('wedding_admin_auth');
  } catch {
    // ignore
  }
}
