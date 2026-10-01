import type { Request, Response, NextFunction } from 'express'
import { verifyToken, type UserTokenPayload } from '../utils/security'

// Mở rộng Request type của Express để chứa user
declare global {
  namespace Express {
    interface Request {
      user?: UserTokenPayload
    }
  }
}

// In-memory IP rate limiter cho login endpoint (chống brute-force DDoS)
interface IpRateRecord {
  attempts: number
  firstAttempt: number
}

const ipAttempts = new Map<string, IpRateRecord>()
const MAX_IP_ATTEMPTS = 15 // Tối đa 15 lần thử trên 1 IP trong 10 phút
const WINDOW_MS = 10 * 60 * 1000

export function rateLimitLogin(req: Request, res: Response, next: NextFunction): void {
  const clientIp = req.ip || req.socket.remoteAddress || 'unknown-ip'
  const now = Date.now()
  const record = ipAttempts.get(clientIp)

  if (record) {
    if (now - record.firstAttempt > WINDOW_MS) {
      // Đã hết chu kỳ window, reset
      ipAttempts.set(clientIp, { attempts: 1, firstAttempt: now })
    } else if (record.attempts >= MAX_IP_ATTEMPTS) {
      const waitMinutes = Math.ceil((WINDOW_MS - (now - record.firstAttempt)) / 60000)
      res.status(429).json({
        message: `Quá nhiều lượt thử đăng nhập từ địa chỉ IP này. Vui lòng thử lại sau ${waitMinutes} phút.`,
      })
      return
    } else {
      record.attempts++
    }
  } else {
    ipAttempts.set(clientIp, { attempts: 1, firstAttempt: now })
  }

  next()
}

/**
 * Middleware bắt buộc phải có token hợp lệ
 */
export function requireAuth(req: Request, res: Response, next: NextFunction): void {
  const authHeader = req.headers.authorization
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    res.status(401).json({
      message: 'Yêu cầu đăng nhập. Không tìm thấy token xác thực hợp lệ.',
    })
    return
  }

  const token = authHeader.substring(7).trim()
  const user = verifyToken(token)

  if (!user) {
    res.status(401).json({
      message: 'Phiên đăng nhập đã hết hạn hoặc không hợp lệ. Vui lòng đăng nhập lại.',
    })
    return
  }

  req.user = user
  next()
}
