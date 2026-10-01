import dayjs, { Dayjs } from 'dayjs'
import type { Customer } from '../../types/customer'
import type { CustomerVisit } from '../../services/customerApi'

export interface CustomerFormValues {
  fullName: string
  gender: boolean
  age: number
  address: string
  phone: string
  treatment: string
  amount?: number | string
  notes?: string
}

export interface CustomerDetailData {
  customer: Customer
  visits: CustomerVisit[]
}

export const formatCurrencyInput = (value?: string | number) => {
  if (value === undefined || value === null || value === '') return ''
  const str = typeof value === 'number' ? `${value}` : value
  return str.replace(/\B(?=(\d{3})+(?!\d))/g, '.')
}

export const parseCurrencyInput = (value?: string) => {
  const numeric = value?.replace(/\./g, '')
  return Number(numeric || '0')
}

export const dobPresets: { label: string; value: [Dayjs, Dayjs] }[] = [
  { label: '1 năm gần nhất', value: [dayjs().subtract(1, 'year'), dayjs()] },
  { label: '3 năm gần nhất', value: [dayjs().subtract(3, 'year'), dayjs()] },
  { label: '5 năm gần nhất', value: [dayjs().subtract(5, 'year'), dayjs()] },
]

export const datePresets: { label: string; value: [Dayjs, Dayjs] }[] = [
  { label: 'Hôm nay', value: [dayjs().startOf('day'), dayjs().endOf('day')] },
  { label: '7 ngày qua', value: [dayjs().subtract(6, 'day').startOf('day'), dayjs().endOf('day')] },
  { label: '30 ngày qua', value: [dayjs().subtract(29, 'day').startOf('day'), dayjs().endOf('day')] },
  { label: 'Tháng này', value: [dayjs().startOf('month'), dayjs().endOf('month')] },
  { label: 'Tháng trước', value: [dayjs().subtract(1, 'month').startOf('month'), dayjs().subtract(1, 'month').endOf('month')] },
  { label: '3 tháng qua', value: [dayjs().subtract(2, 'month').startOf('month'), dayjs().endOf('month')] },
]

export function groupCustomersByPatient(customers: Customer[]): Customer[] {
  const map = new Map<string, { latest: Customer; totalAmount: number; visitCount: number }>()

  for (const item of customers) {
    const key = item.phone?.trim()
      ? `phone:${item.phone.trim()}`
      : `name:${item.fullName.trim()}_${item.dateOfBirth}`

    const existing = map.get(key)
    if (!existing) {
      map.set(key, {
        latest: { ...item },
        totalAmount: Number(item.amount || 0),
        visitCount: 1,
      })
    } else {
      existing.visitCount += 1
      existing.totalAmount += Number(item.amount || 0)

      const existingDate = dayjs(existing.latest.updatedAt || existing.latest.createdAt || 0).valueOf()
      const itemDate = dayjs(item.updatedAt || item.createdAt || 0).valueOf()
      if (itemDate > existingDate) {
        existing.latest = { ...item }
      }
    }
  }

  return Array.from(map.values()).map(({ latest, totalAmount, visitCount }) => ({
    ...latest,
    amount: totalAmount,
    visitCount,
  }))
}

