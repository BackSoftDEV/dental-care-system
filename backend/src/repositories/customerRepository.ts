import db from '../db'
import { CreateCustomerInput, Customer, UpdateCustomerInput } from '../types/customer'

type CustomerRow = Omit<Customer, 'gender' | 'notes' | 'isDeleted' | 'age'> & {
  gender: number
  notes: string | null
  isDeleted: number
  age: number | null
}

const mapRow = (row: CustomerRow): Customer => ({
  ...row,
  gender: Boolean(row.gender),
  notes: row.notes ?? undefined,
  isDeleted: Boolean(row.isDeleted),
})

const buildFilters = (search?: string) => {
  const clauses: string[] = []
  const params: Record<string, unknown> = {}

  clauses.push('isDeleted = 0')

  if (search) {
    clauses.push(`(
      LOWER(fullName) LIKE LOWER(@search)
      OR phone LIKE @search
      OR LOWER(address) LIKE LOWER(@search)
      OR LOWER(treatment) LIKE LOWER(@search)
    )`)
    params.search = `%${search}%`
  }

  const where = clauses.length ? `WHERE ${clauses.join(' AND ')}` : ''
  return { where, params }
}

const customerRepository = {
  getAll(search?: string): Customer[] {
    const { where, params } = buildFilters(search)
    const statement = db.prepare(`
      SELECT * FROM customers
      ${where}
      ORDER BY datetime(createdAt) DESC
    `)
    const rows = statement.all(params) as CustomerRow[]
    return rows.map(mapRow)
  },

  getDeleted(search?: string): Customer[] {
    const clauses: string[] = []
    const params: Record<string, unknown> = {}

    clauses.push('isDeleted = 1')

    if (search) {
      clauses.push(`(
        LOWER(fullName) LIKE LOWER(@search)
        OR phone LIKE @search
        OR LOWER(address) LIKE LOWER(@search)
        OR LOWER(treatment) LIKE LOWER(@search)
      )`)
      params.search = `%${search}%`
    }

    const where = clauses.length ? `WHERE ${clauses.join(' AND ')}` : ''
    const statement = db.prepare(`
      SELECT * FROM customers
      ${where}
      ORDER BY datetime(updatedAt) DESC
    `)
    const rows = statement.all(params) as CustomerRow[]
    return rows.map(mapRow)
  },

  getById(id: number): Customer | undefined {
    const row = db.prepare('SELECT * FROM customers WHERE id = ?').get(id) as CustomerRow | undefined
    return row ? mapRow(row) : undefined
  },

  getByPhone(phone: string): Customer | undefined {
    const row = db.prepare('SELECT * FROM customers WHERE phone = ? AND isDeleted = 0').get(phone) as
      | CustomerRow
      | undefined
    return row ? mapRow(row) : undefined
  },

  getHistory(id: number) {
    const customer = this.getById(id)
    if (!customer) return undefined
    const visits = db
      .prepare(
        `
        SELECT id, treatment, amount, createdAt
        FROM customers
        WHERE phone = ? AND isDeleted = 0
        ORDER BY datetime(createdAt) DESC
      `,
      )
      .all(customer.phone) as { id: number; treatment: string; amount: number; createdAt: string }[]

    return {
      customer,
      visits,
    }
  },

  create(input: CreateCustomerInput): Customer {
    const now = new Date().toISOString()
    const statement = db.prepare(`
      INSERT INTO customers (
        fullName, gender, dateOfBirth, age, address, phone, treatment, amount, notes, createdAt, updatedAt, isDeleted
      ) VALUES (
        @fullName, @gender, @dateOfBirth, @age, @address, @phone, @treatment, @amount, @notes, @createdAt, @updatedAt, 0
      )
    `)

    const info = statement.run({
      ...input,
      gender: input.gender ? 1 : 0,
      age: input.age ?? null,
      createdAt: now,
      updatedAt: now,
      notes: input.notes ?? null,
    })

    return this.getById(Number(info.lastInsertRowid)) as Customer
  },

  update(id: number, input: UpdateCustomerInput): Customer | undefined {
    const existing = this.getById(id)
    if (!existing) return undefined

    const updates: string[] = []
    const params: Record<string, unknown> = { id }

    const fields: (keyof UpdateCustomerInput)[] = [
      'fullName',
      'gender',
      'dateOfBirth',
      'age',
      'address',
      'phone',
      'treatment',
      'amount',
      'notes',
    ]

    fields.forEach((field) => {
      if (field in input && input[field] !== undefined) {
        if (field === 'gender') {
          updates.push(`gender = @gender`)
          params.gender = input.gender ? 1 : 0
        } else if (field === 'age') {
          updates.push(`age = @age`)
          params.age = input.age ?? null
        } else {
          updates.push(`${field} = @${field}`)
          params[field] = field === 'notes' ? (input[field] ?? null) : (input[field] as unknown)
        }
      }
    })

    if (!updates.length) {
      return existing
    }

    updates.push('updatedAt = @updatedAt')
    params.updatedAt = new Date().toISOString()

    db.prepare(
      `UPDATE customers SET ${updates.join(', ')} WHERE id = @id`,
    ).run(params)

    return this.getById(id)
  },

  delete(id: number): boolean {
    const cust = this.getById(id)
    const now = new Date().toISOString()
    if (cust && cust.phone) {
      const info = db.prepare('UPDATE customers SET isDeleted = 1, updatedAt = ? WHERE phone = ?').run(
        now,
        cust.phone,
      )
      return info.changes > 0
    }
    const info = db.prepare('UPDATE customers SET isDeleted = 1, updatedAt = ? WHERE id = ?').run(
      now,
      id,
    )
    return info.changes > 0
  },

  restore(id: number): boolean {
    const cust = db.prepare('SELECT phone FROM customers WHERE id = ?').get(id) as { phone?: string } | undefined
    const now = new Date().toISOString()
    if (cust && cust.phone) {
      const info = db.prepare('UPDATE customers SET isDeleted = 0, updatedAt = ? WHERE phone = ?').run(
        now,
        cust.phone,
      )
      return info.changes > 0
    }
    const info = db.prepare('UPDATE customers SET isDeleted = 0, updatedAt = ? WHERE id = ?').run(
      now,
      id,
    )
    return info.changes > 0
  },

  getMetrics() {
    const summary =
      (db.prepare(`
      SELECT
        COUNT(*) as total,
        IFNULL(SUM(amount), 0) as amount,
        IFNULL(AVG(
          CAST((julianday('now') - julianday(dateOfBirth)) / 365.25 AS INTEGER)
        ), 0) as avgAge
      FROM customers
      WHERE isDeleted = 0
    `).get() as { total: number; amount: number; avgAge: number } | undefined) ?? {
        total: 0,
        amount: 0,
        avgAge: 0,
      }

    return {
      totalCustomers: summary.total ?? 0,
      totalAmount: summary.amount ?? 0,
      averageAge: Math.round(summary.avgAge ?? 0),
    }
  },
}

export default customerRepository

