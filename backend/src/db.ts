import Database from 'better-sqlite3'
import fs from 'node:fs'
import path from 'node:path'
const dataDir = path.resolve(__dirname, '../data')
if (!fs.existsSync(dataDir)) {
  fs.mkdirSync(dataDir, { recursive: true })
}

const dbPath = path.join(dataDir, 'clinic.db')
const db = new Database(dbPath)

db.pragma('journal_mode = WAL')
db.pragma('foreign_keys = ON')

const expectedColumns = [
  'id',
  'fullName',
  'gender',
  'dateOfBirth',
  'age',
  'address',
  'phone',
  'treatment',
  'amount',
  'notes',
  'createdAt',
  'updatedAt',
  'isDeleted',
] as const

const targetSchemaVersion = 4
const createTableSQL = `
  CREATE TABLE IF NOT EXISTS customers (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    fullName TEXT NOT NULL,
    gender INTEGER NOT NULL,
    dateOfBirth TEXT NOT NULL,
    age INTEGER,
    address TEXT NOT NULL,
    phone TEXT NOT NULL,
    treatment TEXT NOT NULL,
    amount INTEGER DEFAULT 0,
    notes TEXT,
    createdAt TEXT NOT NULL DEFAULT (datetime('now')),
    updatedAt TEXT NOT NULL DEFAULT (datetime('now')),
    isDeleted INTEGER NOT NULL DEFAULT 0
  );
`

const currentVersion = db.pragma('user_version', { simple: true }) as number
const tableInfo = db.prepare(`PRAGMA table_info(customers)`).all() as { name: string }[]
const schemaChanged =
  tableInfo.length > 0 &&
  (tableInfo.length !== expectedColumns.length ||
    expectedColumns.some((column) => !tableInfo.some((info) => info.name === column)))

if (schemaChanged || currentVersion < targetSchemaVersion) {
  // Migration: Thêm cột age nếu chưa có
  const tableInfo = db.prepare(`PRAGMA table_info(customers)`).all() as { name: string }[]
  const hasAgeColumn = tableInfo.some((col) => col.name === 'age')
  
  if (!hasAgeColumn && tableInfo.length > 0) {
    // Thêm cột age vào bảng hiện có
    db.exec('ALTER TABLE customers ADD COLUMN age INTEGER')
    
    // Tính và cập nhật tuổi từ dateOfBirth cho các record hiện có
    const customers = db.prepare('SELECT id, dateOfBirth FROM customers').all() as { id: number; dateOfBirth: string }[]
    const updateStmt = db.prepare('UPDATE customers SET age = ? WHERE id = ?')
    
    for (const customer of customers) {
      try {
        const birthDate = new Date(customer.dateOfBirth)
        const today = new Date()
        let age = today.getFullYear() - birthDate.getFullYear()
        const monthDiff = today.getMonth() - birthDate.getMonth()
        if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birthDate.getDate())) {
          age--
        }
        updateStmt.run(age, customer.id)
      } catch (error) {
        // Nếu không tính được tuổi, để null
        updateStmt.run(null, customer.id)
      }
    }
  } else if (currentVersion < targetSchemaVersion) {
    // Nếu version cũ, drop và tạo lại
    db.exec('DROP TABLE IF EXISTS customers')
    db.exec(createTableSQL)
  }
} else {
  db.exec(createTableSQL)
}

db.pragma(`user_version = ${targetSchemaVersion}`)

export default db

