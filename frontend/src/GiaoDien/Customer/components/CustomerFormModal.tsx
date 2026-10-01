import {
  AppstoreOutlined,
  DeleteOutlined,
  PlusOutlined,
  SettingOutlined,
} from '@ant-design/icons'
import {
  AutoComplete,
  Button,
  Card,
  Col,
  Form,
  Input,
  InputNumber,
  Modal,
  Popconfirm,
  Radio,
  Row,
  Space,
  Table,
  Tag,
  Typography,
  message,
} from 'antd'
import dayjs from 'dayjs'
import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { customerApi } from '../../../services/customerApi'
import { serviceStorage, type DentalServiceItem } from '../../../services/serviceStorage'
import type { Customer } from '../../../types/customer'
import {
  formatCurrencyInput,
  parseCurrencyInput,
  type CustomerFormValues,
} from '../types'

const { Text } = Typography

interface CustomerFormModalProps {
  open: boolean
  onClose: () => void
  editingCustomer: Customer | null
  onSuccess: (customer: Customer, isEdit: boolean) => void
}

export default function CustomerFormModal({
  open,
  onClose,
  editingCustomer,
  onSuccess,
}: CustomerFormModalProps) {
  const navigate = useNavigate()
  const [form] = Form.useForm<CustomerFormValues>()
  const isEditing = Boolean(editingCustomer)

  const [isSubmitting, setIsSubmitting] = useState(false)
  const [prefillLoading, setPrefillLoading] = useState(false)
  const [phoneOptions, setPhoneOptions] = useState<{ value: string; label: string; customer: Customer }[]>([])
  const [searchingPhones, setSearchingPhones] = useState(false)

  const [selectedServiceIds, setSelectedServiceIds] = useState<string[]>([])
  const [serviceSettingsOpen, setServiceSettingsOpen] = useState(false)
  const [services, setServices] = useState<DentalServiceItem[]>(() => serviceStorage.getAll())
  const [newServiceName, setNewServiceName] = useState('')
  const [newServicePrice, setNewServicePrice] = useState<number | null>(null)

  const MAX_ADDRESS_PRESETS = 10
  const DEFAULT_ADDRESSES = ['Tại phòng khám', 'Hà Nội', 'Nội thành']
  const [addressPresets, setAddressPresets] = useState<string[]>(() => {
    try {
      const saved = localStorage.getItem('smilecare_address_presets')
      if (saved) {
        const parsed = JSON.parse(saved)
        if (Array.isArray(parsed) && parsed.length > 0) return parsed.slice(0, MAX_ADDRESS_PRESETS)
      }
    } catch {
      // fallback
    }
    return DEFAULT_ADDRESSES
  })
  const [inputAddressVisible, setInputAddressVisible] = useState(false)
  const [inputAddressValue, setInputAddressValue] = useState('')

  const handleAddAddressPreset = (newAddr: string) => {
    const trimmed = newAddr.trim()
    if (!trimmed) return
    if (addressPresets.length >= MAX_ADDRESS_PRESETS) {
      message.warning('Đã đạt tối đa 10 địa chỉ cài sẵn')
      return
    }
    if (addressPresets.includes(trimmed)) {
      message.warning('Địa chỉ này đã có sẵn')
      return
    }
    const next = [...addressPresets, trimmed]
    setAddressPresets(next)
    localStorage.setItem('smilecare_address_presets', JSON.stringify(next))
  }

  const handleDeleteAddressPreset = (addrToDelete: string) => {
    const next = addressPresets.filter((a) => a !== addrToDelete)
    setAddressPresets(next)
    localStorage.setItem('smilecare_address_presets', JSON.stringify(next))
  }

  const handleResetAddressPresets = () => {
    setAddressPresets(DEFAULT_ADDRESSES)
    localStorage.setItem('smilecare_address_presets', JSON.stringify(DEFAULT_ADDRESSES))
  }

  useEffect(() => {
    setServices(serviceStorage.getAll())
    return serviceStorage.onUpdate(() => {
      setServices(serviceStorage.getAll())
    })
  }, [])

  // Sync form values when opening
  useEffect(() => {
    if (open) {
      if (editingCustomer) {
        const age = dayjs().diff(dayjs(editingCustomer.dateOfBirth), 'year')
        form.setFieldsValue({
          phone: editingCustomer.phone,
          fullName: editingCustomer.fullName,
          gender: editingCustomer.gender,
          age: age,
          address: editingCustomer.address,
          treatment: editingCustomer.treatment,
          amount: editingCustomer.amount,
          notes: editingCustomer.notes ?? undefined,
        })
        const matched = services
          .filter((s) => editingCustomer.treatment.toLowerCase().includes(s.name.toLowerCase()))
          .map((s) => s.id)
        setSelectedServiceIds(matched)
      } else {
        form.resetFields()
        setSelectedServiceIds([])
        setPhoneOptions([])
      }
    }
  }, [open, editingCustomer, form, services])

  const handlePhoneSearch = async (value: string) => {
    if (editingCustomer) {
      setPhoneOptions([])
      return
    }

    const phonePrefix = value.trim()
    if (!phonePrefix || phonePrefix.length < 3) {
      setPhoneOptions([])
      return
    }

    try {
      setSearchingPhones(true)
      const results = await customerApi.searchByPhonePrefix(phonePrefix)

      const options = results.map((customer) => ({
        value: customer.phone,
        label: `${customer.phone} - ${customer.fullName}`,
        customer,
      }))

      setPhoneOptions(options)
    } catch {
      setPhoneOptions([])
    } finally {
      setSearchingPhones(false)
    }
  }

  const handlePhoneSelect = (_value: string, option: { value: string; label: string; customer: Customer }) => {
    if (editingCustomer) return

    const selected = option.customer
    if (selected) {
      const age = dayjs().diff(dayjs(selected.dateOfBirth), 'year')
      form.setFieldsValue({
        phone: selected.phone,
        fullName: selected.fullName,
        gender: selected.gender,
        age: age,
        address: selected.address,
        notes: selected.notes ?? undefined,
      })
      setSelectedServiceIds([])
      message.info('Đã nạp thông tin khách cũ, vui lòng chọn dịch vụ mới.')
      setPhoneOptions([])
    }
  }

  const handlePhoneBlur = async () => {
    if (editingCustomer) {
      setPhoneOptions([])
      return
    }

    const phone = (form.getFieldValue('phone') as string | undefined)?.trim()
    if (!phone) {
      setPhoneOptions([])
      return
    }

    const existingOption = phoneOptions.find((opt) => opt.value === phone)
    if (existingOption) {
      handlePhoneSelect(phone, existingOption)
      return
    }

    try {
      setPrefillLoading(true)
      const existing = await customerApi.lookupByPhone(phone)
      if (existing) {
        const age = dayjs().diff(dayjs(existing.dateOfBirth), 'year')
        form.setFieldsValue({
          fullName: existing.fullName,
          gender: existing.gender,
          age: age,
          address: existing.address,
          notes: existing.notes ?? undefined,
        })
        setSelectedServiceIds([])
        message.info('Đã nạp thông tin khách cũ, vui lòng chọn dịch vụ mới.')
      }
    } catch {
      // ignore
    } finally {
      setPrefillLoading(false)
    }
  }

  const handleToggleService = (service: DentalServiceItem) => {
    const currentTreatment = (form.getFieldValue('treatment') as string | undefined) || ''
    const currentAmount = Number(form.getFieldValue('amount') || 0)
    const isSelected = selectedServiceIds.includes(service.id)

    if (isSelected) {
      const nextSelected = selectedServiceIds.filter((id) => id !== service.id)
      setSelectedServiceIds(nextSelected)

      const parts = currentTreatment
        .split(',')
        .map((s) => s.trim())
        .filter((s) => s && s.toLowerCase() !== service.name.toLowerCase())
      form.setFieldValue('treatment', parts.join(', '))

      const nextAmount = Math.max(0, currentAmount - service.price)
      form.setFieldValue('amount', nextAmount)
    } else {
      const nextSelected = [...selectedServiceIds, service.id]
      setSelectedServiceIds(nextSelected)

      const parts = currentTreatment
        .split(',')
        .map((s) => s.trim())
        .filter(Boolean)
      if (!parts.some((s) => s.toLowerCase() === service.name.toLowerCase())) {
        parts.push(service.name)
      }
      form.setFieldValue('treatment', parts.join(', '))

      form.setFieldValue('amount', currentAmount + service.price)
    }
  }

  const handleAddQuickService = () => {
    const trimmed = newServiceName.trim()
    if (!trimmed) {
      message.warning('Vui lòng nhập tên dịch vụ')
      return
    }
    const created = serviceStorage.create({
      name: trimmed,
      price: Number(newServicePrice || 0),
      duration: '30 phút',
      status: 'active',
    })
    setNewServiceName('')
    setNewServicePrice(null)
    message.success(`Đã thêm dịch vụ: ${created.name}`)
  }

  const handleDeleteQuickService = (id: string) => {
    serviceStorage.delete(id)
    setSelectedServiceIds((prev) => prev.filter((item) => item !== id))
    message.success('Đã xóa dịch vụ khỏi danh mục')
  }

  const handleResetQuickServices = () => {
    serviceStorage.reset()
    message.info('Đã khôi phục bảng giá mặc định')
  }

  const handleSubmit = async () => {
    try {
      const values = await form.validateFields()
      setIsSubmitting(true)
      const dateOfBirth = dayjs().subtract(values.age, 'year').format('YYYY-MM-DD')
      const payload = {
        fullName: values.fullName,
        gender: values.gender,
        dateOfBirth: dateOfBirth,
        age: values.age,
        address: values.address,
        phone: values.phone,
        treatment: values.treatment,
        amount: Number(values.amount ?? 0),
        notes: values.notes,
      }

      if (editingCustomer) {
        const updated = await customerApi.update(editingCustomer.id, payload)
        message.success('Đã cập nhật thông tin khách hàng')
        onSuccess(updated, true)
      } else {
        const created = await customerApi.create(payload)
        message.success('Đã thêm khách hàng mới')
        onSuccess(created, false)
      }

      onClose()
    } catch (error) {
      if (error instanceof Error) {
        message.error(error.message)
      }
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <>
      <Modal
        centered
        title={
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', paddingRight: 24 }}>
            <span style={{ fontSize: 16, fontWeight: 600 }}>
              {isEditing ? 'Cập nhật thông tin khách hàng' : 'Thêm khách hàng mới'}
            </span>
          </div>
        }
        open={open}
        onCancel={onClose}
        width={780}
        footer={
          <div style={{ display: 'flex', justifyContent: 'flex-end', alignItems: 'center' }}>
            <Space>
              <Button onClick={onClose}>Hủy</Button>
              <Button type="primary" onClick={handleSubmit} loading={isSubmitting}>
                Lưu hồ sơ
              </Button>
            </Space>
          </div>
        }
      >
        <Form
          layout="vertical"
          form={form}
          onKeyDown={(e) => {
            if ((e.ctrlKey || e.metaKey) && e.key === 'Enter') {
              e.preventDefault()
              handleSubmit()
            }
          }}
          style={{ marginTop: 8 }}
        >
          <Row gutter={20}>
            {/* Cột 1: Thông tin cá nhân */}
            <Col span={12}>
              <div
                style={{
                  fontWeight: 600,
                  color: '#0284c7',
                  marginBottom: 10,
                  fontSize: 13,
                  borderBottom: '1px solid #f1f5f9',
                  paddingBottom: 4,
                }}
              >
                1. Thông tin cá nhân
              </div>

              <Form.Item
                label="Số điện thoại"
                name="phone"
                rules={[{ required: true, message: 'Vui lòng nhập SĐT' }]}
                style={{ marginBottom: 12 }}
              >
                <AutoComplete
                  options={phoneOptions}
                  onSearch={handlePhoneSearch}
                  onSelect={handlePhoneSelect}
                  placeholder="VD: 0903..."
                  notFoundContent={
                    searchingPhones
                      ? 'Đang tìm...'
                      : phoneOptions.length === 0 && !searchingPhones
                        ? 'Nhập ít nhất 3 số để tìm kiếm'
                        : 'Không tìm thấy'
                  }
                  allowClear
                  filterOption={false}
                  style={{ width: '100%' }}
                >
                  <Input
                    onBlur={handlePhoneBlur}
                    suffix={prefillLoading && !isEditing ? '...' : undefined}
                    autoFocus
                  />
                </AutoComplete>
              </Form.Item>

              <Form.Item
                label="Họ tên"
                name="fullName"
                rules={[{ required: true, message: 'Vui lòng nhập họ tên' }]}
                style={{ marginBottom: 12 }}
              >
                <Input placeholder="VD: Nguyễn Thị Mai" />
              </Form.Item>

              <Row gutter={10} style={{ marginBottom: 12 }}>
                <Col span={13}>
                  <Form.Item
                    label="Giới tính"
                    name="gender"
                    rules={[{ required: true }]}
                    initialValue={true}
                    style={{ marginBottom: 0 }}
                  >
                    <Radio.Group buttonStyle="solid" style={{ width: '100%' }}>
                      <Radio.Button value={true} style={{ width: '50%', textAlign: 'center' }}>
                        Nam
                      </Radio.Button>
                      <Radio.Button value={false} style={{ width: '50%', textAlign: 'center' }}>
                        Nữ
                      </Radio.Button>
                    </Radio.Group>
                  </Form.Item>
                </Col>
                <Col span={11}>
                  <Form.Item
                    label="Tuổi"
                    name="age"
                    rules={[{ required: true, message: 'Nhập tuổi' }]}
                    initialValue={25}
                    style={{ marginBottom: 0 }}
                  >
                    <InputNumber min={0} max={150} style={{ width: '100%' }} placeholder="Tuổi" />
                  </Form.Item>
                </Col>
              </Row>

              <Form.Item
                label="Địa chỉ"
                name="address"
                rules={[{ required: true, message: 'Vui lòng nhập địa chỉ' }]}
                style={{ marginBottom: 6 }}
              >
                <Input placeholder="Số nhà, đường, quận/huyện..." />
              </Form.Item>
              <div style={{ marginBottom: 10 }}>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 4 }}>
                  <Text type="secondary" style={{ fontSize: 11 }}>
                    Gợi ý địa chỉ ({addressPresets.length}/{MAX_ADDRESS_PRESETS}):
                  </Text>
                  {JSON.stringify(addressPresets) !== JSON.stringify(DEFAULT_ADDRESSES) && (
                    <Button
                      type="link"
                      size="small"
                      style={{ fontSize: 11, padding: 0, height: 'auto', color: '#64748b' }}
                      onClick={handleResetAddressPresets}
                    >
                      Khôi phục mặc định
                    </Button>
                  )}
                </div>
                <Space size={[4, 6]} wrap align="center">
                  {addressPresets.map((addr) => (
                    <Tag
                      key={addr}
                      closable
                      onClose={(e) => {
                        e.preventDefault()
                        e.stopPropagation()
                        handleDeleteAddressPreset(addr)
                      }}
                      style={{
                        cursor: 'pointer',
                        fontSize: 11,
                        background: '#f8fafc',
                        border: '1px solid #e2e8f0',
                        borderRadius: 4,
                        padding: '1px 6px',
                        userSelect: 'none',
                        display: 'inline-flex',
                        alignItems: 'center',
                        gap: 2,
                      }}
                      onClick={() => {
                        form.setFieldsValue({ address: addr })
                        form.validateFields(['address']).catch(() => {})
                      }}
                      title="Bấm để chọn vào ô địa chỉ"
                    >
                      📍 {addr}
                    </Tag>
                  ))}

                  {addressPresets.length < MAX_ADDRESS_PRESETS &&
                    (inputAddressVisible ? (
                      <Input
                        type="text"
                        size="small"
                        style={{ width: 130, height: 24, fontSize: 11, borderRadius: 4 }}
                        value={inputAddressValue}
                        onChange={(e) => setInputAddressValue(e.target.value)}
                        onBlur={() => {
                          if (inputAddressValue.trim()) {
                            handleAddAddressPreset(inputAddressValue)
                          }
                          setInputAddressVisible(false)
                          setInputAddressValue('')
                        }}
                        onKeyDown={(e) => {
                          if (e.key === 'Enter') {
                            e.preventDefault()
                            if (inputAddressValue.trim()) {
                              handleAddAddressPreset(inputAddressValue)
                            }
                            setInputAddressVisible(false)
                            setInputAddressValue('')
                          } else if (e.key === 'Escape') {
                            setInputAddressVisible(false)
                            setInputAddressValue('')
                          }
                        }}
                        placeholder="Tên địa chỉ..."
                        autoFocus
                      />
                    ) : (
                      <Tag
                        onClick={() => setInputAddressVisible(true)}
                        style={{
                          background: '#fff',
                          borderStyle: 'dashed',
                          borderColor: '#0284c7',
                          color: '#0284c7',
                          cursor: 'pointer',
                          fontSize: 11,
                          borderRadius: 4,
                          padding: '1px 8px',
                          display: 'inline-flex',
                          alignItems: 'center',
                          gap: 2,
                        }}
                      >
                        <PlusOutlined style={{ fontSize: 10 }} /> Thêm
                      </Tag>
                    ))}
                </Space>
              </div>
            </Col>

            {/* Cột 2: Phác đồ & Chi phí */}
            <Col span={12}>
              <div
                style={{
                  fontWeight: 600,
                  color: '#0284c7',
                  marginBottom: 10,
                  fontSize: 13,
                  borderBottom: '1px solid #f1f5f9',
                  paddingBottom: 4,
                }}
              >
                2. Phác đồ & Chi phí
              </div>

              <Form.Item
                label="Cách xử lý / Dịch vụ"
                name="treatment"
                rules={[{ required: true, message: 'Vui lòng nhập cách xử lý' }]}
                style={{ marginBottom: 6 }}
              >
                <Input placeholder="VD: Lấy cao răng, Trám răng..." />
              </Form.Item>

              <div style={{ marginBottom: 10 }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 4 }}>
                  <Text type="secondary" style={{ fontSize: 12 }}>
                    Dịch vụ:
                  </Text>
                  <Space size={8}>
                    <Button
                      type="link"
                      size="small"
                      icon={<AppstoreOutlined />}
                      style={{ fontSize: 11, padding: 0, height: 'auto', color: '#0284c7' }}
                      onClick={() => window.open('/services', '_blank')}
                      title="Mở trang quản lý dịch vụ ở tab mới để không mất thông tin đang nhập"
                    >
                      📋 Quản lý dịch vụ (tab mới)
                    </Button>
                    <Button
                      type="link"
                      size="small"
                      icon={<SettingOutlined />}
                      style={{ fontSize: 11, padding: 0, height: 'auto', color: '#64748b' }}
                      onClick={() => setServiceSettingsOpen(true)}
                    >
                      ⚙️ Cài đặt nhanh
                    </Button>
                  </Space>
                </div>
                <Space size={[4, 6]} wrap>
                  {services.map((service) => {
                    const isSelected = selectedServiceIds.includes(service.id)
                    const priceLabel =
                      service.price > 0
                        ? service.price >= 1000000
                          ? `${(service.price / 1000000).toLocaleString('vi-VN')}tr`
                          : `${(service.price / 1000).toLocaleString('vi-VN')}k`
                        : '0đ'

                    return (
                      <Tag
                        key={service.id}
                        style={{
                          cursor: 'pointer',
                          borderRadius: 6,
                          fontSize: 11,
                          padding: '2px 8px',
                          margin: 0,
                          userSelect: 'none',
                          transition: 'all 0.2s',
                          background: isSelected ? '#0284c7' : '#f8fafc',
                          color: isSelected ? '#ffffff' : '#334155',
                          borderColor: isSelected ? '#0284c7' : '#cbd5e1',
                          fontWeight: isSelected ? 500 : 400,
                          boxShadow: isSelected ? '0 1px 3px rgba(2, 132, 199, 0.3)' : 'none',
                        }}
                        onClick={() => handleToggleService(service)}
                      >
                        {isSelected ? '✓ ' : '+ '}
                        {service.name} <span style={{ opacity: isSelected ? 0.9 : 0.65, fontSize: 10 }}>({priceLabel})</span>
                      </Tag>
                    )
                  })}
                </Space>
              </div>

              <Form.Item label="Thành tiền (VNĐ)" name="amount" initialValue={0} style={{ marginBottom: 4 }}>
                <InputNumber<number>
                  style={{ width: '100%' }}
                  min={0}
                  step={50000}
                  formatter={(value) => formatCurrencyInput(value ?? '')}
                  parser={(value) => parseCurrencyInput(value) ?? 0}
                  placeholder="0"
                />
              </Form.Item>
              <div style={{ marginBottom: 10 }}>
                <Space size={[4, 4]} wrap>
                  {[50000, 100000, 200000, 500000].map((addVal) => (
                    <Button
                      key={addVal}
                      size="small"
                      style={{ fontSize: 11, padding: '0 6px', height: 22, background: '#f8fafc', borderColor: '#e2e8f0' }}
                      onClick={() => {
                        const cur = Number(form.getFieldValue('amount') || 0)
                        form.setFieldValue('amount', cur + addVal)
                      }}
                    >
                      +{formatCurrencyInput(addVal)}
                    </Button>
                  ))}
                  <Button
                    size="small"
                    style={{ fontSize: 11, padding: '0 6px', height: 22, color: '#ef4444' }}
                    onClick={() => {
                      form.setFieldValue('amount', 0)
                      setSelectedServiceIds([])
                    }}
                  >
                    Về 0đ
                  </Button>
                </Space>
              </div>

              <Form.Item label="Ghi chú lâm sàng" name="notes" style={{ marginBottom: 0 }}>
                <Input.TextArea
                  rows={2}
                  placeholder="Lưu ý bệnh lý nền, thuốc hoặc dặn dò..."
                  style={{ resize: 'none' }}
                />
              </Form.Item>
            </Col>
          </Row>
        </Form>
      </Modal>

      {/* Modal Cài đặt nhanh danh mục dịch vụ */}
      <Modal
        title={
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <SettingOutlined style={{ color: '#0284c7' }} />
            <span>Cài đặt danh mục & Bảng giá dịch vụ</span>
          </div>
        }
        open={serviceSettingsOpen}
        onCancel={() => setServiceSettingsOpen(false)}
        footer={[
          <Button key="reset" onClick={handleResetQuickServices}>
            Khôi phục mặc định
          </Button>,
          <Button key="close" type="primary" onClick={() => setServiceSettingsOpen(false)}>
            Đã xong
          </Button>,
        ]}
        width={580}
        centered
      >
        <Card size="small" style={{ marginBottom: 14, background: '#f8fafc', border: '1px solid #e2e8f0' }} title="Thêm dịch vụ mới">
          <Row gutter={8} align="middle">
            <Col span={12}>
              <Input
                placeholder="Tên dịch vụ (VD: Trồng răng Implant)"
                value={newServiceName}
                onChange={(e) => setNewServiceName(e.target.value)}
                onPressEnter={handleAddQuickService}
              />
            </Col>
            <Col span={8}>
              <InputNumber
                style={{ width: '100%' }}
                placeholder="Đơn giá (VNĐ)"
                min={0}
                step={50000}
                value={newServicePrice}
                onChange={(val) => setNewServicePrice(val)}
                formatter={(value) => formatCurrencyInput(value ?? '')}
                parser={(value) => parseCurrencyInput(value) ?? 0}
                onPressEnter={handleAddQuickService}
              />
            </Col>
            <Col span={4}>
              <Button type="primary" icon={<PlusOutlined />} onClick={handleAddQuickService} block>
                Thêm
              </Button>
            </Col>
          </Row>
        </Card>

        <Table
          size="small"
          dataSource={services}
          rowKey="id"
          pagination={false}
          scroll={{ y: 260 }}
          columns={[
            {
              title: 'Tên dịch vụ',
              dataIndex: 'name',
              key: 'name',
              render: (name: string) => <Text strong>{name}</Text>,
            },
            {
              title: 'Đơn giá mẫu',
              dataIndex: 'price',
              key: 'price',
              width: 140,
              render: (price: number) => (
                <Text style={{ color: price > 0 ? '#0284c7' : '#10b981', fontWeight: 600 }}>
                  {price > 0 ? `${formatCurrencyInput(price)} đ` : 'Miễn phí'}
                </Text>
              ),
            },
            {
              title: 'Xóa',
              key: 'action',
              width: 60,
              align: 'center',
              render: (_, record) => (
                <Popconfirm
                  title="Xóa dịch vụ này?"
                  description="Dịch vụ sẽ bị gỡ khỏi danh sách chọn nhanh."
                  onConfirm={() => handleDeleteQuickService(record.id)}
                  okText="Xóa"
                  cancelText="Hủy"
                  okButtonProps={{ danger: true }}
                >
                  <Button size="small" type="text" danger icon={<DeleteOutlined />} />
                </Popconfirm>
              ),
            },
          ]}
        />
      </Modal>
    </>
  )
}
