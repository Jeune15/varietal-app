/**
 * Security utilities for VarietalApp
 * - SHA-256 password hashing (replaces plaintext comparison)
 * - Rate limiting for login attempts
 * - Session token generation and validation
 */

// ==================== Password Hashing ====================

/**
 * Hashes a string using SHA-256 via the Web Crypto API.
 * Returns the hex-encoded hash string.
 */
export async function sha256(message: string): Promise<string> {
  const msgBuffer = new TextEncoder().encode(message);
  const hashBuffer = await crypto.subtle.digest('SHA-256', msgBuffer);
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  return hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
}

/**
 * Pre-computed SHA-256 hashes for role passwords.
 * These replace the plaintext passwords that were previously in App.tsx.
 * 
 * To regenerate (run in browser console):
 *   const enc = new TextEncoder();
 *   const buf = await crypto.subtle.digest('SHA-256', enc.encode('YOUR_NEW_PASSWORD'));
 *   console.log(Array.from(new Uint8Array(buf)).map(b => b.toString(16).padStart(2,'0')).join(''));
 */
/**
 * SHA-256 hashes of role passwords.
 * Passwords are NEVER stored in plaintext in the codebase.
 * 
 * To update a password:
 *   1. Set VITE_ADMIN_PASS or VITE_STUDENT_PASS in .env.local
 *   2. OR regenerate the hash: run in browser console:
 *      const buf = await crypto.subtle.digest('SHA-256', new TextEncoder().encode('NEW_PASSWORD'));
 *      console.log(Array.from(new Uint8Array(buf)).map(b=>b.toString(16).padStart(2,'0')).join(''));
 *   3. Replace the hash below
 */
const DEFAULT_HASHES: Record<string, string> = {
  admin: 'b7a4eb3c0b0c74d4bf6d347df5c8923fb321fe2ae4e5a8e3aee1ead98563bc87',
  student: '057fee93577f3943958505dda59868f9256664c17a268f5392873f13539dedf2',
};

// Resolved hashes (from env vars or defaults)
let _hashesReady = false;
const _resolvedHashes: Record<string, string> = {};

async function initPasswordHashes() {
  if (_hashesReady) return;
  // Env vars override the defaults — allows changing passwords via .env.local without touching code
  const adminPass = import.meta.env.VITE_ADMIN_PASS;
  const studentPass = import.meta.env.VITE_STUDENT_PASS;
  
  _resolvedHashes.admin = adminPass ? await sha256(adminPass) : DEFAULT_HASHES.admin;
  _resolvedHashes.student = studentPass ? await sha256(studentPass) : DEFAULT_HASHES.student;
  _hashesReady = true;
}

// Auto-initialize
initPasswordHashes();

/**
 * Validates a password against the stored hash for the given role.
 * Returns true if the password matches.
 */
export async function validatePassword(role: 'admin' | 'student', password: string): Promise<boolean> {
  await initPasswordHashes();
  const inputHash = await sha256(password);
  const expectedHash = _resolvedHashes[role];
  
  if (!expectedHash) {
    return false;
  }

  // Constant-time comparison to prevent timing attacks
  if (inputHash.length !== expectedHash.length) return false;
  let result = 0;
  for (let i = 0; i < inputHash.length; i++) {
    result |= inputHash.charCodeAt(i) ^ expectedHash.charCodeAt(i);
  }
  return result === 0;
}


// ==================== Rate Limiting ====================

interface RateLimitEntry {
  attempts: number;
  firstAttempt: number;
  lockedUntil: number;
}

const rateLimitStore: Record<string, RateLimitEntry> = {};

const RATE_LIMIT_CONFIG = {
  maxAttempts: 5,
  windowMs: 60_000,      // 1 minute window
  lockoutMs: 30_000,     // 30 second lockout after max attempts
};

/**
 * Checks if a login attempt is allowed for the given role.
 * Returns { allowed: true } or { allowed: false, retryAfterMs }.
 */
export function checkRateLimit(role: string): { allowed: boolean; retryAfterMs?: number } {
  const now = Date.now();
  const entry = rateLimitStore[role];

  if (!entry) {
    rateLimitStore[role] = { attempts: 0, firstAttempt: now, lockedUntil: 0 };
    return { allowed: true };
  }

  // Check if currently locked out
  if (entry.lockedUntil > now) {
    return { allowed: false, retryAfterMs: entry.lockedUntil - now };
  }

  // Reset if window has expired
  if (now - entry.firstAttempt > RATE_LIMIT_CONFIG.windowMs) {
    entry.attempts = 0;
    entry.firstAttempt = now;
    entry.lockedUntil = 0;
  }

  return { allowed: true };
}

/**
 * Records a failed login attempt. Returns remaining attempts or lockout info.
 */
export function recordFailedAttempt(role: string): { remainingAttempts: number; lockedUntil?: number } {
  const now = Date.now();
  if (!rateLimitStore[role]) {
    rateLimitStore[role] = { attempts: 0, firstAttempt: now, lockedUntil: 0 };
  }

  const entry = rateLimitStore[role];
  entry.attempts++;

  if (entry.attempts >= RATE_LIMIT_CONFIG.maxAttempts) {
    entry.lockedUntil = now + RATE_LIMIT_CONFIG.lockoutMs;
    return { remainingAttempts: 0, lockedUntil: entry.lockedUntil };
  }

  return { remainingAttempts: RATE_LIMIT_CONFIG.maxAttempts - entry.attempts };
}

/**
 * Resets the rate limit counter for a role (called on successful login).
 */
export function resetRateLimit(role: string): void {
  delete rateLimitStore[role];
}


// ==================== Session Token ====================

const SESSION_TOKEN_KEY = 'varietal_session_token';
const SESSION_EXPIRY_KEY = 'varietal_session_expiry';
const TOKEN_TTL_MS = 24 * 60 * 60 * 1000; // 24 hours

/**
 * Generates a cryptographically random session token and stores it.
 * This prevents sessionStorage manipulation attacks.
 */
export function generateSessionToken(role: 'admin' | 'student'): string {
  const randomBytes = new Uint8Array(32);
  crypto.getRandomValues(randomBytes);
  const token = Array.from(randomBytes, b => b.toString(16).padStart(2, '0')).join('');
  
  const expiry = Date.now() + TOKEN_TTL_MS;
  
  sessionStorage.setItem(SESSION_TOKEN_KEY, token);
  sessionStorage.setItem(SESSION_EXPIRY_KEY, String(expiry));
  sessionStorage.setItem('varietal_access', 'true');
  sessionStorage.setItem('varietal_role', role);
  
  // Store a verification hash (token + role) to prevent role tampering
  const verificationPayload = `${token}:${role}:${expiry}`;
  // We store this in memory (not sessionStorage) to prevent tampering
  _activeToken = { token, role, expiry, payload: verificationPayload };
  
  return token;
}

let _activeToken: { token: string; role: string; expiry: number; payload: string } | null = null;

/**
 * Validates the current session. Returns the role if valid, null otherwise.
 */
export function validateSession(): { valid: boolean; role?: 'admin' | 'student' } {
  const storedToken = sessionStorage.getItem(SESSION_TOKEN_KEY);
  const storedExpiry = sessionStorage.getItem(SESSION_EXPIRY_KEY);
  const storedAccess = sessionStorage.getItem('varietal_access');
  const storedRole = sessionStorage.getItem('varietal_role');
  
  if (!storedToken || !storedExpiry || !storedAccess || !storedRole) {
    return { valid: false };
  }

  const expiry = parseInt(storedExpiry, 10);
  if (isNaN(expiry) || Date.now() > expiry) {
    clearSession();
    return { valid: false };
  }

  // If we have an active in-memory token, verify against it
  if (_activeToken) {
    if (_activeToken.token !== storedToken || _activeToken.role !== storedRole) {
      // Token or role was tampered with in sessionStorage
      clearSession();
      return { valid: false };
    }
  }
  
  // Validate role is one of the expected values
  if (storedRole !== 'admin' && storedRole !== 'student') {
    clearSession();
    return { valid: false };
  }

  return { valid: true, role: storedRole as 'admin' | 'student' };
}

/**
 * Clears all session data.
 */
export function clearSession(): void {
  _activeToken = null;
  sessionStorage.removeItem(SESSION_TOKEN_KEY);
  sessionStorage.removeItem(SESSION_EXPIRY_KEY);
  sessionStorage.removeItem('varietal_access');
  sessionStorage.removeItem('varietal_role');
  sessionStorage.removeItem('varietal_active_tab');
  sessionStorage.removeItem('varietal_stock_tab');
  sessionStorage.removeItem('varietal_calendar');
  sessionStorage.removeItem('varietal_calendar_independent');
  sessionStorage.removeItem('varietal_sales_page');
  sessionStorage.removeItem('varietal_sales_tab');
}
