import { useCallback, useEffect, useState } from 'react'
import { customerApi } from '../services/customerApi'
import type { Customer } from '../types/customer'

export function useCustomers() {
  const [customers, setCustomers] = useState<Customer[]>([])
  const [loading, setLoading] = useState(false)

  const fetchCustomers = useCallback(async () => {
    try {
      setLoading(true)
      const data = await customerApi.list()
      setCustomers(data)
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    fetchCustomers()
  }, [fetchCustomers])

  return { customers, loading, refresh: fetchCustomers, setCustomers }
}


