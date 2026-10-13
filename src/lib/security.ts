import crypto from 'crypto';

/**
 * Retrieves the cryptographic secret for HMAC session signing.
 * Strictly requires a high-entropy secret in production and fails safely if missing.
 */
export function getAuthSecret(): string {
  const secret = process.env.AUTH_SECRET || process.env.JWT_SECRET || process.env.SESSION_SECRET;
  if (!secret) {
    if (process.env.NODE_ENV === 'production') {
      throw new Error(
        'CRITICAL SECURITY CONFIGURATION ERROR: AUTH_SECRET environment variable is missing in production. Refusing to operate with fallback secret.'
      );
    }
    // Development/test fallback with clear identifier
    return 'filtec_local_dev_ephemeral_auth_secret_do_not_use_in_prod_x92!';
  }
  if (secret.length < 32 && process.env.NODE_ENV === 'production') {
    throw new Error(
      'CRITICAL SECURITY CONFIGURATION ERROR: AUTH_SECRET must be at least 32 characters (256-bit entropy) in production.'
    );
  }
  return secret;
}

/**
 * Hash a password using PBKDF2 with 100,000 iterations and SHA-512.
 */
export function hashPassword(password: string): string {
  const salt = crypto.randomBytes(16).toString('hex');
  const iterations = 100000;
  const hash = crypto.pbkdf2Sync(password, salt, iterations, 64, 'sha512').toString('hex');
  return `pbkdf2$${iterations}$${salt}$${hash}`;
}

/**
 * Verify password against stored password string.
 * Supports legacy plaintext passwords and signals if upgrade to hashed password is required.
 */
export function verifyPassword(
  attempt: string,
  storedPassword: string | null | undefined
): { valid: boolean; needsUpgrade: boolean } {
  if (!attempt || !storedPassword) {
    return { valid: false, needsUpgrade: false };
  }

  const trimmedAttempt = attempt.trim();
  const trimmedStored = storedPassword.trim();

  // If already hashed with PBKDF2
  if (trimmedStored.startsWith('pbkdf2$')) {
    const parts = trimmedStored.split('$');
    if (parts.length !== 4) {
      return { valid: false, needsUpgrade: false };
    }
    const iterations = parseInt(parts[1], 10);
    const salt = parts[2];
    const expectedHash = parts[3];

    const computed = crypto.pbkdf2Sync(trimmedAttempt, salt, iterations, 64, 'sha512').toString('hex');
    const computedBuf = Buffer.from(computed, 'utf-8');
    const expectedBuf = Buffer.from(expectedHash, 'utf-8');

    if (computedBuf.length !== expectedBuf.length) {
      return { valid: false, needsUpgrade: false };
    }

    const valid = crypto.timingSafeEqual(computedBuf, expectedBuf);
    return { valid, needsUpgrade: false };
  }

  // Legacy plaintext match
  const attemptBuf = Buffer.from(trimmedAttempt);
  const storedBuf = Buffer.from(trimmedStored);

  let match = false;
  if (attemptBuf.length === storedBuf.length) {
    match = crypto.timingSafeEqual(attemptBuf, storedBuf);
  } else {
    match = trimmedAttempt === trimmedStored;
  }

  return { valid: match, needsUpgrade: match };
}

export interface SessionPayload {
  userId: string;
  role: 'ADMIN' | 'EMPLOYEE' | 'DEALER';
  dealerId?: string;
  employeeCode?: string;
  phone?: string;
  name?: string;
  exp: number; // Unix timestamp in seconds
}

/**
 * Creates a signed tamper-proof session token using HMAC-SHA256
 */
export function createSessionToken(data: Omit<SessionPayload, 'exp'>, expiresInHours: number = 72): string {
  const exp = Math.floor(Date.now() / 1000) + expiresInHours * 3600;
  const payload: SessionPayload = { ...data, exp };
  const encodedPayload = Buffer.from(JSON.stringify(payload)).toString('base64url');
  const secret = getAuthSecret();
  const signature = crypto.createHmac('sha256', secret).update(encodedPayload).digest('base64url');
  return `${encodedPayload}.${signature}`;
}

/**
 * Verifies a signed session token. Returns null if invalid or expired.
 */
export function verifySessionToken(token: string | null | undefined): SessionPayload | null {
  if (!token || !token.includes('.')) return null;

  try {
    const [encodedPayload, signature] = token.split('.');
    if (!encodedPayload || !signature) return null;

    const secret = getAuthSecret();
    const expectedSig = crypto.createHmac('sha256', secret).update(encodedPayload).digest('base64url');

    const sigBuf = Buffer.from(signature);
    const expectedBuf = Buffer.from(expectedSig);
    if (sigBuf.length !== expectedBuf.length || !crypto.timingSafeEqual(sigBuf, expectedBuf)) {
      return null;
    }

    const payloadStr = Buffer.from(encodedPayload, 'base64url').toString('utf-8');
    const payload: SessionPayload = JSON.parse(payloadStr);

    const now = Math.floor(Date.now() / 1000);
    if (payload.exp && payload.exp < now) {
      return null; // Expired
    }

    return payload;
  } catch {
    return null;
  }
}

/**
 * Extracts and verifies the session from an incoming Request (via Cookie or Authorization header)
 */
export function getSessionFromRequest(req: Request): SessionPayload | null {
  // 1. Try Cookie
  const cookieHeader = req.headers.get('cookie') || '';
  const match = cookieHeader.match(/filtec_session=([^;]+)/);
  if (match && match[1]) {
    const session = verifySessionToken(decodeURIComponent(match[1]));
    if (session) return session;
  }

  // 2. Try Authorization header
  const authHeader = req.headers.get('authorization') || '';
  if (authHeader.startsWith('Bearer ')) {
    const token = authHeader.slice(7).trim();
    return verifySessionToken(token);
  }

  return null;
}
