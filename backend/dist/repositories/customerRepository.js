"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const db_1 = __importDefault(require("../db"));
const mapRow = (row) => ({
    ...row,
    gender: Boolean(row.gender),
    notes: row.notes ?? undefined,
    isDeleted: Boolean(row.isDeleted),
});
const buildFilters = (search) => {
    const clauses = [];
    const params = {};
    clauses.push('isDeleted = 0');
    if (search) {
        clauses.push(`(
      LOWER(fullName) LIKE LOWER(@search)
      OR phone LIKE @search
      OR LOWER(address) LIKE LOWER(@search)
      OR LOWER(treatment) LIKE LOWER(@search)
    )`);
        params.search = `%${search}%`;
    }
    const where = clauses.length ? `WHERE ${clauses.join(' AND ')}` : '';
    return { where, params };
};
const customerRepository = {
    getAll(search) {
        const { where, params } = buildFilters(search);
        const statement = db_1.default.prepare(`
      SELECT * FROM customers
      ${where}
      ORDER BY datetime(createdAt) DESC
    `);
        const rows = statement.all(params);
        return rows.map(mapRow);
    },
    getDeleted(search) {
        const clauses = [];
        const params = {};
        clauses.push('isDeleted = 1');
        if (search) {
            clauses.push(`(
        LOWER(fullName) LIKE LOWER(@search)
        OR phone LIKE @search
        OR LOWER(address) LIKE LOWER(@search)
        OR LOWER(treatment) LIKE LOWER(@search)
      )`);
            params.search = `%${search}%`;
        }
        const where = clauses.length ? `WHERE ${clauses.join(' AND ')}` : '';
        const statement = db_1.default.prepare(`
      SELECT * FROM customers
      ${where}
      ORDER BY datetime(updatedAt) DESC
    `);
        const rows = statement.all(params);
        return rows.map(mapRow);
    },
    getById(id) {
        const row = db_1.default.prepare('SELECT * FROM customers WHERE id = ?').get(id);
        return row ? mapRow(row) : undefined;
    },
    getByPhone(phone) {
        const row = db_1.default.prepare('SELECT * FROM customers WHERE phone = ? AND isDeleted = 0').get(phone);
        return row ? mapRow(row) : undefined;
    },
    getHistory(id) {
        const customer = this.getById(id);
        if (!customer)
            return undefined;
        const visits = db_1.default
            .prepare(`
        SELECT id, treatment, amount, createdAt
        FROM customers
        WHERE phone = ? AND isDeleted = 0
        ORDER BY datetime(createdAt) DESC
      `)
            .all(customer.phone);
        return {
            customer,
            visits,
        };
    },
    create(input) {
        const now = new Date().toISOString();
        const statement = db_1.default.prepare(`
      INSERT INTO customers (
        fullName, gender, dateOfBirth, age, address, phone, treatment, amount, notes, createdAt, updatedAt, isDeleted
      ) VALUES (
        @fullName, @gender, @dateOfBirth, @age, @address, @phone, @treatment, @amount, @notes, @createdAt, @updatedAt, 0
      )
    `);
        const info = statement.run({
            ...input,
            gender: input.gender ? 1 : 0,
            age: input.age ?? null,
            createdAt: now,
            updatedAt: now,
            notes: input.notes ?? null,
        });
        return this.getById(Number(info.lastInsertRowid));
    },
    update(id, input) {
        const existing = this.getById(id);
        if (!existing)
            return undefined;
        const updates = [];
        const params = { id };
        const fields = [
            'fullName',
            'gender',
            'dateOfBirth',
            'age',
            'address',
            'phone',
            'treatment',
            'amount',
            'notes',
        ];
        fields.forEach((field) => {
            if (field in input && input[field] !== undefined) {
                if (field === 'gender') {
                    updates.push(`gender = @gender`);
                    params.gender = input.gender ? 1 : 0;
                }
                else if (field === 'age') {
                    updates.push(`age = @age`);
                    params.age = input.age ?? null;
                }
                else {
                    updates.push(`${field} = @${field}`);
                    params[field] = field === 'notes' ? (input[field] ?? null) : input[field];
                }
            }
        });
        if (!updates.length) {
            return existing;
        }
        updates.push('updatedAt = @updatedAt');
        params.updatedAt = new Date().toISOString();
        db_1.default.prepare(`UPDATE customers SET ${updates.join(', ')} WHERE id = @id`).run(params);
        return this.getById(id);
    },
    delete(id) {
        const info = db_1.default.prepare('UPDATE customers SET isDeleted = 1, updatedAt = ? WHERE id = ?').run(new Date().toISOString(), id);
        return info.changes > 0;
    },
    restore(id) {
        const info = db_1.default.prepare('UPDATE customers SET isDeleted = 0, updatedAt = ? WHERE id = ?').run(new Date().toISOString(), id);
        return info.changes > 0;
    },
    getMetrics() {
        const summary = db_1.default.prepare(`
      SELECT
        COUNT(*) as total,
        IFNULL(SUM(amount), 0) as amount,
        IFNULL(AVG(
          CAST((julianday('now') - julianday(dateOfBirth)) / 365.25 AS INTEGER)
        ), 0) as avgAge
      FROM customers
      WHERE isDeleted = 0
    `).get() ?? {
            total: 0,
            amount: 0,
            avgAge: 0,
        };
        return {
            totalCustomers: summary.total ?? 0,
            totalAmount: summary.amount ?? 0,
            averageAge: Math.round(summary.avgAge ?? 0),
        };
    },
};
exports.default = customerRepository;
//# sourceMappingURL=customerRepository.js.map