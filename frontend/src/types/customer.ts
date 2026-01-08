export interface Customer {
  id: number
  fullName: string
  gender: boolean
  dateOfBirth: string
  age?: number | null
  address: string
  phone: string
  treatment: string
  amount: number
  notes?: string
  createdAt?: string
  updatedAt?: string
  isDeleted?: boolean
}

export interface CustomerMetrics {
  totalCustomers: number
  totalAmount: number
  averageAge: number
}

