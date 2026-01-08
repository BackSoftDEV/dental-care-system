import axios from 'axios'
import type { Customer } from '../types/customer'

const API_BASE_URL = import.meta.env.VITE_API_URL ?? '/api'

const http = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
})

export interface CreateCustomerPayload {
  fullName: string
  gender: boolean
  dateOfBirth: string
  address: string
  phone: string
  treatment: string
  amount?: number
  notes?: string
}

export const customerApi = {
  async list(search?: string): Promise<Customer[]> {
    const { data } = await http.get<{ customers: Customer[] }>('/customers', {
      params: { search },
    })
    return data.customers
  },

  async create(payload: CreateCustomerPayload): Promise<Customer> {
    const { data } = await http.post<Customer>('/customers', payload)
    return data
  },

  async update(id: number, payload: CreateCustomerPayload): Promise<Customer> {
    const { data } = await http.post<Customer>(`/customers/${id}/update`, payload)
    return data
  },

  async lookupByPhone(phone: string): Promise<Customer | null> {
    const { data } = await http.get<{ customer: Customer | null }>('/customers/lookup', {
      params: { phone },
    })
    return data.customer
  },

  async searchByPhonePrefix(phonePrefix: string): Promise<Customer[]> {
    const { data } = await http.get<{ customers: Customer[] }>('/customers', {
      params: { search: phonePrefix },
    })
    // Lọc chỉ những khách hàng có số điện thoại bắt đầu bằng prefix
    return data.customers.filter((customer) => customer.phone.startsWith(phonePrefix))
  },

  async remove(id: number): Promise<void> {
    await http.post(`/customers/${id}/delete`)
  },

  async history(id: number): Promise<{ customer: Customer; visits: CustomerVisit[] }> {
    const { data } = await http.get<{ customer: Customer; visits: CustomerVisit[] }>(
      `/customers/${id}/history`,
    )
    return data
  },

  async listDeleted(search?: string): Promise<Customer[]> {
    const { data } = await http.get<{ customers: Customer[] }>('/customers/deleted', {
      params: { search },
    })
    return data.customers
  },

  async restore(id: number): Promise<void> {
    await http.post(`/customers/${id}/restore`)
  },
}

export interface CustomerVisit {
  id: number
  treatment: string
  amount: number
  createdAt: string
}

