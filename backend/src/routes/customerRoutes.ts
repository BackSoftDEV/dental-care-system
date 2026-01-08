import { Router, type Request, type Response } from 'express'
import customerRepository from '../repositories/customerRepository'
import { createCustomerSchema, updateCustomerSchema } from '../types/customer'

const router = Router()

router.get('/', (req, res) => {
  const search = (req.query.search as string) ?? undefined
  const customers = customerRepository.getAll(search)
  res.json({ customers })
})

// Đặt route /deleted TRƯỚC các route có parameter để tránh bị match nhầm
router.get('/deleted', (req, res) => {
  const search = (req.query.search as string) ?? undefined
  const customers = customerRepository.getDeleted(search)
  res.json({ customers })
})

router.get('/metrics', (_req, res) => {
  const metrics = customerRepository.getMetrics()
  res.json(metrics)
})

router.get('/lookup', (req, res) => {
  const phone = (req.query.phone as string)?.trim()
  if (!phone) {
    return res.status(400).json({ message: 'Phone is required' })
  }
  const customer = customerRepository.getByPhone(phone)
  res.json({ customer: customer ?? null })
})

router.get('/:id/history', (req, res) => {
  const result = customerRepository.getHistory(Number(req.params.id))
  if (!result) {
    return res.status(404).json({ message: 'Customer not found' })
  }
  res.json(result)
})

router.get('/:id', (req, res) => {
  const customer = customerRepository.getById(Number(req.params.id))
  if (!customer) {
    return res.status(404).json({ message: 'Customer not found' })
  }
  res.json(customer)
})

router.post('/', (req, res) => {
  try {
    const payload = createCustomerSchema.parse(req.body)
    const created = customerRepository.create(payload)
    res.status(201).json(created)
  } catch (error) {
    res.status(400).json({ message: 'Invalid payload', error })
  }
})

const handleUpdate = (req: Request, res: Response) => {
  try {
    const payload = updateCustomerSchema.parse(req.body)
    const updated = customerRepository.update(Number(req.params.id), payload)
    if (!updated) {
      return res.status(404).json({ message: 'Customer not found' })
    }
    res.json(updated)
  } catch (error) {
    res.status(400).json({ message: 'Invalid payload', error })
  }
}

router.put('/:id', handleUpdate)
router.post('/:id/update', handleUpdate)

router.post('/:id/delete', (req, res) => {
  const success = customerRepository.delete(Number(req.params.id))
  if (!success) {
    return res.status(404).json({ message: 'Customer not found' })
  }
  res.json({ success: true })
})

router.post('/:id/restore', (req, res) => {
  const success = customerRepository.restore(Number(req.params.id))
  if (!success) {
    return res.status(404).json({ message: 'Customer not found' })
  }
  res.json({ success: true })
})

router.delete('/:id', (req, res) => {
  const deleted = customerRepository.delete(Number(req.params.id))
  if (!deleted) {
    return res.status(404).json({ message: 'Customer not found' })
  }
  res.status(204).send()
})

export default router

