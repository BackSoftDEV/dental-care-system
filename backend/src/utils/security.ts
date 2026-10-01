import crypto from 'node:crypto'

export interface UserTokenPayload {
  id: number
  username: string
  fullName: string
  role: string
}

// Secret key for HMAC signature - fallback to a deterministic machine key or generated secret
const JWT_SECRET = process.env.JWT_SECRET || 'smilecare-dental-secure-key-2026-x9f8!#z'

/**
 * Hash password with cryptographically secure random salt using Scrypt (memory-hard, resistant to GPU attacks)
 */
export function hashPassword(password: string): { salt: string; hash: string } {
  const salt = crypto.randomBytes(16).toString('hex')
  const hash = crypto.scryptSync(password, salt, 64).toString('hex')
  return { salt, hash }
}

/**
 * Verify password against salt and hash using timingSafeEqual (prevents side-channel timing attacks)
 */
export function verifyPassword(password: string, salt: string, hash: string): boolean {
  try {
    const calculatedHash = crypto.scryptSync(password, salt, 64).toString('hex')
    const hashBuf = Buffer.from(hash, 'hex')
    const calculatedBuf = Buffer.from(calculatedHash, 'hex')
    if (hashBuf.length !== calculatedBuf.length) return false
    return crypto.timingSafeEqual(hashBuf, calculatedBuf)
  } catch {
    return false
  }
}

/**
 * Generate RFC 7519 JSON Web Token with HMAC-SHA256 signature
 */
export function generateToken(payload: UserTokenPayload, expiresInHours = 24): string {
  const header = Buffer.from(JSON.stringify({ alg: 'HS256', typ: 'JWT' })).toString('base64url')
  const exp = Date.now() + expiresInHours * 60 * 60 * 1000
  const body = Buffer.from(JSON.stringify({ ...payload, exp })).toString('base64url')
  const signature = crypto.createHmac('sha256', JWT_SECRET).update(`${header}.${body}`).digest('base64url')
  return `${header}.${body}.${signature}`
}

/**
 * Verify and decode JSON Web Token with expiration check & timing-safe signature comparison
 */
export function verifyToken(token: string): UserTokenPayload | null {
  try {
    const parts = token.split('.')
    if (parts.length !== 3) return null
    const [header, body, signature] = parts
    const expectedSignature = crypto.createHmac('sha256', JWT_SECRET).update(`${header}.${body}`).digest('base64url')

    const sigBuf = Buffer.from(signature)
    const expSigBuf = Buffer.from(expectedSignature)
    if (sigBuf.length !== expSigBuf.length || !crypto.timingSafeEqual(sigBuf, expSigBuf)) {
      return null
    }

    const payload = JSON.parse(Buffer.from(body, 'base64url').toString('utf8'))
    if (payload.exp && payload.exp < Date.now()) {
      return null // Expired
    }

    return {
      id: payload.id,
      username: payload.username,
      fullName: payload.fullName,
      role: payload.role,
    }
  } catch {
    return null
  }
}
