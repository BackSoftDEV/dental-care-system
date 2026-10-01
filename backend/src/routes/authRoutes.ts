import { Router } from 'express'
import { z } from 'zod'
import userRepository from '../repositories/userRepository'
import { generateToken, hashPassword, verifyPassword } from '../utils/security'
import { rateLimitLogin, requireAuth } from '../middleware/authMiddleware'

const router = Router()

const loginSchema = z.object({
  username: z.string().trim().min(1, 'Tên đăng nhập không được để trống'),
  password: z.string().min(1, 'Mật khẩu không được để trống'),
})

const changePasswordSchema = z.object({
  currentPassword: z.string().min(1, 'Vui lòng nhập mật khẩu hiện tại'),
  newPassword: z.string().min(6, 'Mật khẩu mới phải có ít nhất 6 ký tự'),
})

// Đăng nhập bảo mật cao
router.post('/login', (req, res) => {
  const parseResult = loginSchema.safeParse(req.body)
  if (!parseResult.success) {
    return res.status(400).json({
      message: parseResult.error.issues[0]?.message || 'Dữ liệu không hợp lệ',
    })
  }

  const { username, password } = parseResult.data
  const user = userRepository.findByUsername(username)

  // Nếu user không tồn tại, vẫn chạy verify giả để tránh timing attack (chống dò tài khoản)
  if (!user) {
    verifyPassword(password, '00000000000000000000000000000000', '0'.repeat(128))
    return res.status(401).json({
      message: 'Tên đăng nhập hoặc mật khẩu không chính xác',
    })
  }

  // Xác thực mật khẩu qua Scrypt băm một chiều với muối ngẫu nhiên
  const isMatch = verifyPassword(password, user.salt, user.passwordHash)

  if (!isMatch) {
    return res.status(401).json({
      message: 'Tên đăng nhập hoặc mật khẩu không chính xác',
    })
  }

  // Tạo token JWT có thời hạn 24 giờ
  const token = generateToken({
    id: user.id,
    username: user.username,
    fullName: user.fullName,
    role: user.role,
  })

  return res.json({
    token,
    user: {
      id: user.id,
      username: user.username,
      fullName: user.fullName,
      role: user.role,
    },
  })
})

// Lấy thông tin user hiện tại (kiểm tra token còn hạn không)
router.get('/me', requireAuth, (req, res) => {
  if (!req.user) {
    return res.status(401).json({ message: 'Chưa đăng nhập' })
  }
  const user = userRepository.findById(req.user.id)
  if (!user) {
    return res.status(404).json({ message: 'Tài khoản không tồn tại' })
  }

  return res.json({
    user: {
      id: user.id,
      username: user.username,
      fullName: user.fullName,
      role: user.role,
    },
  })
})

// Đổi mật khẩu
router.post('/change-password', requireAuth, (req, res) => {
  const parseResult = changePasswordSchema.safeParse(req.body)
  if (!parseResult.success) {
    return res.status(400).json({
      message: parseResult.error.issues[0]?.message || 'Dữ liệu không hợp lệ',
    })
  }

  const { currentPassword, newPassword } = parseResult.data
  const user = userRepository.findById(req.user!.id)
  if (!user) {
    return res.status(404).json({ message: 'Tài khoản không tồn tại' })
  }

  const isMatch = verifyPassword(currentPassword, user.salt, user.passwordHash)
  if (!isMatch) {
    return res.status(400).json({ message: 'Mật khẩu hiện tại không đúng' })
  }

  const { salt, hash } = hashPassword(newPassword)
  userRepository.updatePassword(user.id, hash, salt)

  return res.json({ message: 'Đổi mật khẩu thành công' })
})

export default router
