export interface DentalServiceItem {
  id: string
  name: string
  price: number
  duration: string
  description?: string
  status: 'active' | 'inactive'
  updatedAt: string
}

export const DEFAULT_SERVICES: DentalServiceItem[] = [
  {
    id: 'srv-1',
    name: 'Khám & Tư vấn tổng quát',
    price: 0,
    duration: '15 phút',
    description: 'Kiểm tra răng miệng toàn diện, chụp film (nếu có) và lên phác đồ điều trị.',
    status: 'active',
    updatedAt: '2026-01-01',
  },
  {
    id: 'srv-2',
    name: 'Lấy cao răng & Đánh bóng',
    price: 200000,
    duration: '30 phút',
    description: 'Làm sạch mảng bám vôi răng bằng sóng siêu âm không đau, đánh bóng men răng.',
    status: 'active',
    updatedAt: '2026-01-01',
  },
  {
    id: 'srv-3',
    name: 'Trám răng thẩm mỹ Composite',
    price: 300000,
    duration: '30 phút',
    description: 'Hàn trám răng sâu, mẻ răng bằng vật liệu Composite trùng màu răng tự nhiên.',
    status: 'active',
    updatedAt: '2026-01-01',
  },
  {
    id: 'srv-4',
    name: 'Nhổ răng khôn (Răng số 8)',
    price: 1500000,
    duration: '45 phút',
    description: 'Tiểu phẫu nhổ răng khôn mọc lệch, mọc ngầm bằng công nghệ Piezotome hạn chế xâm lấn.',
    status: 'active',
    updatedAt: '2026-01-01',
  },
  {
    id: 'srv-5',
    name: 'Tẩy trắng răng Laser Whitening',
    price: 1800000,
    duration: '60 phút',
    description: 'Bật 2-3 tone men răng tự nhiên bằng ánh sáng Laser chuẩn Châu Âu.',
    status: 'active',
    updatedAt: '2026-01-01',
  },
  {
    id: 'srv-6',
    name: 'Bọc răng sứ toàn sứ Cercon',
    price: 3000000,
    duration: '60 phút',
    description: 'Răng toàn sứ chính hãng Đức chịu lực gấp 5 lần răng thật, bảo hành 10 năm.',
    status: 'active',
    updatedAt: '2026-01-01',
  },
  {
    id: 'srv-7',
    name: 'Điều trị tủy răng công nghệ cao',
    price: 1000000,
    duration: '45 phút',
    description: 'Làm sạch ống tủy và trám bít kín khít bằng hệ thống trâm máy WaveOne.',
    status: 'active',
    updatedAt: '2026-01-01',
  },
  {
    id: 'srv-8',
    name: 'Cấy ghép Implant Biotem Hàn Quốc',
    price: 14000000,
    duration: '60 phút',
    description: 'Phục hồi răng mất trọn đời gồm trụ Implant và khớp nối Abutment chính hãng.',
    status: 'active',
    updatedAt: '2026-01-01',
  },
]

const STORAGE_KEY = 'smilecare_dental_services'
const EVENT_KEY = 'smilecare_services_updated'

export const serviceStorage = {
  getAll(): DentalServiceItem[] {
    try {
      const data = localStorage.getItem(STORAGE_KEY)
      if (!data) {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(DEFAULT_SERVICES))
        return DEFAULT_SERVICES
      }
      return JSON.parse(data)
    } catch {
      return DEFAULT_SERVICES
    }
  },

  saveAll(services: DentalServiceItem[]) {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(services))
      window.dispatchEvent(new Event(EVENT_KEY))
    } catch (err) {
      console.error('Failed to save dental services to localStorage:', err)
    }
  },

  create(data: Omit<DentalServiceItem, 'id' | 'updatedAt'>): DentalServiceItem {
    const services = this.getAll()
    const newService: DentalServiceItem = {
      ...data,
      id: `srv-${Date.now()}`,
      updatedAt: new Date().toISOString().split('T')[0],
    }
    const updated = [newService, ...services]
    this.saveAll(updated)
    return newService
  },

  update(id: string, patch: Partial<DentalServiceItem>): DentalServiceItem | null {
    const services = this.getAll()
    const index = services.findIndex((s) => s.id === id)
    if (index === -1) return null

    const updatedItem: DentalServiceItem = {
      ...services[index],
      ...patch,
      updatedAt: new Date().toISOString().split('T')[0],
    }
    services[index] = updatedItem
    this.saveAll(services)
    return updatedItem
  },

  delete(id: string): boolean {
    const services = this.getAll()
    const filtered = services.filter((s) => s.id !== id)
    if (filtered.length === services.length) return false
    this.saveAll(filtered)
    return true
  },

  reset(): DentalServiceItem[] {
    this.saveAll(DEFAULT_SERVICES)
    return DEFAULT_SERVICES
  },

  onUpdate(callback: () => void): () => void {
    const handler = () => callback()
    window.addEventListener(EVENT_KEY, handler)
    window.addEventListener('storage', handler)
    return () => {
      window.removeEventListener(EVENT_KEY, handler)
      window.removeEventListener('storage', handler)
    }
  },
}
