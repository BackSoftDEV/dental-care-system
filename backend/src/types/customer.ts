import { z } from 'zod'

const preprocessNumber = <T extends z.ZodNumber>(schema: T) =>
  z.preprocess(
    (val) => {
      if (val === undefined || val === null || val === '') {
        return undefined
      }
      const parsed = Number(val)
      return Number.isNaN(parsed) ? undefined : parsed
    },
    schema,
  )

const amountField = preprocessNumber(z.number().nonnegative())

export const createCustomerSchema = z.object({
  fullName: z.string().min(1, 'Vui lòng nhập họ tên'),
  gender: z.boolean(),
  dateOfBirth: z.string().datetime().or(z.string().regex(/^\d{4}-\d{2}-\d{2}$/)),
  age: z.number().int().min(0).max(150).optional(),
  address: z.string().min(1, 'Vui lòng nhập địa chỉ'),
  phone: z.string().min(6, 'Số điện thoại không hợp lệ'),
  treatment: z.string().min(1, 'Vui lòng nhập cách xử lý'),
  amount: amountField.default(0),
  notes: z.string().optional(),
})

export const updateCustomerSchema = createCustomerSchema.partial()

export type Customer = {
  id: number
  fullName: string
  gender: boolean
  dateOfBirth: string
  age?: number | null
  address: string
  phone: string
  treatment: string
  amount: number
  notes?: string | null
  createdAt: string
  updatedAt: string
  isDeleted: boolean
}

export type CreateCustomerInput = z.infer<typeof createCustomerSchema>
export type UpdateCustomerInput = z.infer<typeof updateCustomerSchema>

