import db from '../db'

export interface UserRecord {
  id: number
  username: string
  passwordHash: string
  salt: string
  fullName: string
  role: string
  failedAttempts: number
  lockedUntil: string | null
  createdAt: string
  updatedAt: string
}

export const userRepository = {
  findByUsername(username: string): UserRecord | null {
    const row = db.prepare('SELECT * FROM users WHERE username = ?').get(username)
    return (row as UserRecord) ?? null
  },

  findById(id: number): UserRecord | null {
    const row = db.prepare('SELECT * FROM users WHERE id = ?').get(id)
    return (row as UserRecord) ?? null
  },

  updateFailedAttempts(id: number, attempts: number, lockedUntil: string | null): void {
    db.prepare(`
      UPDATE users
      SET failedAttempts = ?, lockedUntil = ?, updatedAt = datetime('now')
      WHERE id = ?
    `).run(attempts, lockedUntil, id)
  },

  resetFailedAttempts(id: number): void {
    db.prepare(`
      UPDATE users
      SET failedAttempts = 0, lockedUntil = NULL, updatedAt = datetime('now')
      WHERE id = ?
    `).run(id)
  },

  updatePassword(id: number, passwordHash: string, salt: string): void {
    db.prepare(`
      UPDATE users
      SET passwordHash = ?, salt = ?, updatedAt = datetime('now')
      WHERE id = ?
    `).run(passwordHash, salt, id)
  },
}

export default userRepository
