import {
  CheckCircleOutlined,
  ClockCircleOutlined,
  DeleteOutlined,
  DollarOutlined,
  DownloadOutlined,
  EditOutlined,
  MedicineBoxOutlined,
  PlusOutlined,
  ReloadOutlined,
  SearchOutlined,
} from '@ant-design/icons'
import {
  Badge,
  Button,
  Card,
  Col,
  Empty,
  Flex,
  Form,
  Input,
  InputNumber,
  Modal,
  Popconfirm,
  Radio,
  Row,
  Select,
  Space,
  Table,
  Typography,
  message,
} from 'antd'
import type { ColumnsType } from 'antd/es/table'
import { useEffect, useMemo, useState } from 'react'
import {
  serviceStorage,
  type DentalServiceItem,
} from '../../services/serviceStorage'
import { utils, writeFile } from 'xlsx'

const { Title, Text } = Typography

const formatCurrency = (val: number) => {
  return val.toLocaleString('vi-VN')
}

interface ServiceFormValues {
  name: string
  price: number
  duration: string
  description?: string
  status: 'active' | 'inactive'
}

export default function ServicesPage() {
  const [services, setServices] = useState<DentalServiceItem[]>([])
  const [loading, setLoading] = useState(false)
  const [searchTerm, setSearchTerm] = useState('')
  const [statusFilter, setStatusFilter] = useState<'all' | 'active' | 'inactive'>('all')

  const [modalOpen, setModalOpen] = useState(false)
  const [editingService, setEditingService] = useState<DentalServiceItem | null>(null)
  const [form] = Form.useForm<ServiceFormValues>()

  const loadServices = () => {
    setLoading(true)
    const list = serviceStorage.getAll()
    setServices(list)
    setLoading(false)
  }

  useEffect(() => {
    loadServices()
    const unsubscribe = serviceStorage.onUpdate(() => {
      loadServices()
    })
    return () => unsubscribe()
  }, [])

  // KPI Metrics (3 Thẻ gọn gàng)
  const metrics = useMemo(() => {
    const total = services.length
    const active = services.filter((s) => s.status === 'active').length
    const prices = services.map((s) => s.price)
    const avgPrice = total > 0 ? Math.round(prices.reduce((a, b) => a + b, 0) / total) : 0

    return { total, active, avgPrice }
  }, [services])

  // Filtered Services
  const filteredServices = useMemo(() => {
    const lower = searchTerm.toLowerCase().trim()
    return services.filter((item) => {
      const matchSearch =
        !lower ||
        item.name.toLowerCase().includes(lower) ||
        (item.description && item.description.toLowerCase().includes(lower))

      const matchStatus = statusFilter === 'all' || item.status === statusFilter

      return matchSearch && matchStatus
    })
  }, [services, searchTerm, statusFilter])

  const handleOpenCreateModal = () => {
    setEditingService(null)
    form.resetFields()
    form.setFieldsValue({
      price: 200000,
      duration: '30 phút',
      status: 'active',
    })
    setModalOpen(true)
  }

  const handleOpenEditModal = (record: DentalServiceItem) => {
    setEditingService(record)
    form.setFieldsValue({
      name: record.name,
      price: record.price,
      duration: record.duration,
      description: record.description,
      status: record.status,
    })
    setModalOpen(true)
  }

  const handleSubmit = async () => {
    try {
      const values = await form.validateFields()
      if (editingService) {
        serviceStorage.update(editingService.id, values)
        message.success(`Đã cập nhật dịch vụ: ${values.name}`)
      } else {
        serviceStorage.create({
          name: values.name,
          price: Number(values.price || 0),
          duration: values.duration,
          description: values.description,
          status: values.status,
        })
        message.success(`Đã thêm dịch vụ: ${values.name}`)
      }
      setModalOpen(false)
      loadServices()
    } catch {
      // Form validation failed
    }
  }

  const handleDelete = (id: string, name: string) => {
    serviceStorage.delete(id)
    message.success(`Đã xóa dịch vụ "${name}"`)
    loadServices()
  }

  const handleResetDefaults = () => {
    serviceStorage.reset()
    message.info('Đã khôi phục danh mục & bảng giá mặc định')
    loadServices()
  }

  const handleExportExcel = () => {
    if (services.length === 0) {
      message.warning('Không có dữ liệu dịch vụ để xuất')
      return
    }
    const dataToExport = services.map((s, idx) => ({
      STT: idx + 1,
      'Tên dịch vụ': s.name,
      'Đơn giá (VNĐ)': s.price,
      'Thời lượng': s.duration,
      'Trạng thái': s.status === 'active' ? 'Đang áp dụng' : 'Tạm dừng',
      'Mô tả': s.description || '',
    }))

    const ws = utils.json_to_sheet(dataToExport)
    const wb = utils.book_new()
    utils.book_append_sheet(wb, ws, 'Bang_Gia_Dich_Vu')
    writeFile(wb, `Bang_Gia_Nha_Khoa_${new Date().toISOString().split('T')[0]}.xlsx`)
    message.success('Đã xuất file Excel bảng giá thành công!')
  }

  const columns: ColumnsType<DentalServiceItem> = [
    {
      title: 'STT',
      key: 'index',
      width: 60,
      align: 'center',
      render: (_, __, index) => (
        <Text type="secondary" style={{ fontSize: 13 }}>
          {index + 1}
        </Text>
      ),
    },
    {
      title: 'Tên dịch vụ & Mô tả',
      dataIndex: 'name',
      key: 'name',
      render: (name: string, record) => (
        <div style={{ display: 'flex', flexDirection: 'column' }}>
          <Text strong style={{ fontSize: 14, color: '#0f172a' }}>
            {name}
          </Text>
          {record.description && (
            <Text type="secondary" style={{ fontSize: 12, marginTop: 2 }}>
              {record.description}
            </Text>
          )}
        </div>
      ),
    },
    {
      title: 'Đơn giá niêm yết',
      dataIndex: 'price',
      key: 'price',
      width: 170,
      align: 'right',
      render: (price: number) => (
        <Text strong style={{ color: price > 0 ? '#0284c7' : '#10b981', fontSize: 14 }}>
          {price > 0 ? `${formatCurrency(price)} đ` : 'Miễn phí'}
        </Text>
      ),
    },
    {
      title: 'Thời lượng',
      dataIndex: 'duration',
      key: 'duration',
      width: 130,
      render: (dur: string) => (
        <Space size={4} style={{ color: '#64748b', fontSize: 12 }}>
          <ClockCircleOutlined />
          <span>{dur}</span>
        </Space>
      ),
    },
    {
      title: 'Trạng thái',
      dataIndex: 'status',
      key: 'status',
      width: 140,
      render: (st: string) =>
        st === 'active' ? (
          <Badge status="success" text={<Text style={{ fontSize: 12, color: '#16a34a' }}>Đang áp dụng</Text>} />
        ) : (
          <Badge status="default" text={<Text type="secondary" style={{ fontSize: 12 }}>Tạm dừng</Text>} />
        ),
    },
    {
      title: 'Thao tác',
      key: 'action',
      width: 110,
      align: 'center',
      render: (_, record) => (
        <Space size={4}>
          <Button
            type="text"
            icon={<EditOutlined style={{ color: '#0284c7' }} />}
            onClick={() => handleOpenEditModal(record)}
            title="Chỉnh sửa dịch vụ"
          />
          <Popconfirm
            title="Xóa dịch vụ?"
            description={`Bạn có chắc muốn xóa dịch vụ "${record.name}"?`}
            onConfirm={() => handleDelete(record.id, record.name)}
            okText="Xóa"
            cancelText="Hủy"
            okButtonProps={{ danger: true }}
          >
            <Button type="text" danger icon={<DeleteOutlined />} title="Xóa dịch vụ" />
          </Popconfirm>
        </Space>
      ),
    },
  ]

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
      {/* 3 Thẻ KPI Thống số */}
      <Row gutter={[16, 16]}>
        <Col xs={24} sm={8}>
          <Card className="metric-card" bordered={false} bodyStyle={{ padding: '18px 20px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
              <div
                style={{
                  width: 44,
                  height: 44,
                  borderRadius: 12,
                  background: 'rgba(2, 132, 199, 0.1)',
                  color: '#0284c7',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontSize: 20,
                }}
              >
                <MedicineBoxOutlined />
              </div>
              <div>
                <Text type="secondary" style={{ fontSize: 12, display: 'block', fontWeight: 500 }}>
                  Tổng số dịch vụ
                </Text>
                <Title level={3} style={{ margin: 0, fontWeight: 700, color: '#0f172a' }}>
                  {metrics.total}
                </Title>
              </div>
            </div>
          </Card>
        </Col>

        <Col xs={24} sm={8}>
          <Card className="metric-card" bordered={false} bodyStyle={{ padding: '18px 20px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
              <div
                style={{
                  width: 44,
                  height: 44,
                  borderRadius: 12,
                  background: 'rgba(16, 185, 129, 0.1)',
                  color: '#10b981',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontSize: 20,
                }}
              >
                <CheckCircleOutlined />
              </div>
              <div>
                <Text type="secondary" style={{ fontSize: 12, display: 'block', fontWeight: 500 }}>
                  Đang hoạt động
                </Text>
                <Title level={3} style={{ margin: 0, fontWeight: 700, color: '#16a34a' }}>
                  {metrics.active}
                </Title>
              </div>
            </div>
          </Card>
        </Col>

        <Col xs={24} sm={8}>
          <Card className="metric-card" bordered={false} bodyStyle={{ padding: '18px 20px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
              <div
                style={{
                  width: 44,
                  height: 44,
                  borderRadius: 12,
                  background: 'rgba(245, 158, 11, 0.1)',
                  color: '#f59e0b',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontSize: 20,
                }}
              >
                <DollarOutlined />
              </div>
              <div>
                <Text type="secondary" style={{ fontSize: 12, display: 'block', fontWeight: 500 }}>
                  Đơn giá trung bình
                </Text>
                <Title level={3} style={{ margin: 0, fontWeight: 700, color: '#0f172a' }}>
                  {formatCurrency(metrics.avgPrice)} đ
                </Title>
              </div>
            </div>
          </Card>
        </Col>
      </Row>

      {/* Bảng Dịch Vụ & Thanh Công Cụ */}
      <Card bordered={false} style={{ borderRadius: 12, boxShadow: '0 1px 3px rgba(0,0,0,0.04)' }}>
        {/* Toolbar */}
        <Flex justify="space-between" align="center" wrap="wrap" gap={12} style={{ marginBottom: 16 }}>
          <Space wrap size={10}>
            <Input
              prefix={<SearchOutlined style={{ color: '#94a3b8' }} />}
              placeholder="Tìm theo tên dịch vụ hoặc mô tả..."
              allowClear
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              style={{ width: 280 }}
            />

            <Select
              value={statusFilter}
              onChange={setStatusFilter}
              style={{ width: 160 }}
              options={[
                { value: 'all', label: 'Tất cả trạng thái' },
                { value: 'active', label: 'Đang áp dụng' },
                { value: 'inactive', label: 'Tạm dừng' },
              ]}
            />
          </Space>

          <Space wrap size={10}>
            <Button icon={<DownloadOutlined />} onClick={handleExportExcel}>
              Xuất Excel
            </Button>
            <Popconfirm
              title="Khôi phục bảng giá mặc định?"
              description="Toàn bộ danh mục sẽ quay về các dịch vụ ban đầu. Dữ liệu dịch vụ thêm mới sẽ bị xóa."
              onConfirm={handleResetDefaults}
              okText="Đồng ý khôi phục"
              cancelText="Hủy"
              okButtonProps={{ danger: true }}
            >
              <Button icon={<ReloadOutlined />} danger style={{ borderColor: '#fca5a5' }}>
                Khôi phục mặc định
              </Button>
            </Popconfirm>
            <Button type="primary" icon={<PlusOutlined />} onClick={handleOpenCreateModal}>
              Thêm dịch vụ mới
            </Button>
          </Space>
        </Flex>

        {/* Table */}
        <Table
          columns={columns}
          dataSource={filteredServices}
          rowKey="id"
          loading={loading}
          scroll={{ x: 800 }}
          pagination={{
            pageSize: 10,
            showSizeChanger: true,
            pageSizeOptions: ['10', '20', '50'],
            showTotal: (total, range) => `${range[0]}-${range[1]} của ${total} dịch vụ`,
          }}
          locale={{
            emptyText: (
              <Empty
                image={Empty.PRESENTED_IMAGE_SIMPLE}
                description="Không tìm thấy dịch vụ nào phù hợp"
              >
                <Button type="primary" size="small" onClick={handleOpenCreateModal}>
                  + Tạo dịch vụ ngay
                </Button>
              </Empty>
            ),
          }}
        />
      </Card>

      {/* Modal Thêm / Chỉnh Sửa Dịch Vụ */}
      <Modal
        title={
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <MedicineBoxOutlined style={{ color: '#0284c7' }} />
            <span>{editingService ? 'Chỉnh sửa thông tin dịch vụ' : 'Thêm dịch vụ nha khoa mới'}</span>
          </div>
        }
        open={modalOpen}
        onCancel={() => setModalOpen(false)}
        onOk={handleSubmit}
        okText={editingService ? 'Cập nhật' : 'Thêm mới'}
        cancelText="Hủy"
        width={540}
        centered
      >
        <Form
          form={form}
          layout="vertical"
          style={{ marginTop: 12 }}
          onKeyDown={(e) => {
            if ((e.ctrlKey || e.metaKey) && e.key === 'Enter') {
              e.preventDefault()
              handleSubmit()
            }
          }}
        >
          <Form.Item
            label="Tên dịch vụ nha khoa"
            name="name"
            rules={[{ required: true, message: 'Vui lòng nhập tên dịch vụ' }]}
            style={{ marginBottom: 14 }}
          >
            <Input placeholder="VD: Cấy ghép Implant Biotem" autoFocus />
          </Form.Item>

          <Row gutter={12} style={{ marginBottom: 14 }}>
            <Col span={13}>
              <Form.Item
                label="Đơn giá niêm yết (VNĐ)"
                name="price"
                rules={[{ required: true, message: 'Vui lòng nhập đơn giá' }]}
                style={{ marginBottom: 0 }}
              >
                <InputNumber<number>
                  style={{ width: '100%' }}
                  min={0}
                  step={50000}
                  formatter={(value) => (value ? `${value}`.replace(/\B(?=(\d{3})+(?!\d))/g, '.') : '0')}
                  parser={(value) => Number(value?.replace(/\./g, '') || 0)}
                  placeholder="0"
                />
              </Form.Item>
            </Col>

            <Col span={11}>
              <Form.Item
                label="Thời lượng ước tính"
                name="duration"
                rules={[{ required: true, message: 'Chọn thời lượng' }]}
                style={{ marginBottom: 0 }}
              >
                <Select
                  options={[
                    { value: '15 phút', label: '15 phút' },
                    { value: '30 phút', label: '30 phút' },
                    { value: '45 phút', label: '45 phút' },
                    { value: '60 phút', label: '60 phút' },
                    { value: '90 phút', label: '90 phút' },
                    { value: '120 phút', label: '120 phút' },
                  ]}
                  placeholder="Thời gian làm"
                />
              </Form.Item>
            </Col>
          </Row>

          <Form.Item label="Trạng thái áp dụng" name="status" initialValue="active" style={{ marginBottom: 14 }}>
            <Radio.Group buttonStyle="solid" style={{ width: '100%' }}>
              <Radio.Button value="active" style={{ width: '50%', textAlign: 'center' }}>
                Đang áp dụng
              </Radio.Button>
              <Radio.Button value="inactive" style={{ width: '50%', textAlign: 'center' }}>
                Tạm dừng
              </Radio.Button>
            </Radio.Group>
          </Form.Item>

          <Form.Item label="Mô tả / Hướng dẫn điều trị" name="description" style={{ marginBottom: 0 }}>
            <Input.TextArea
              rows={3}
              placeholder="Chi tiết về phác đồ, vật liệu hoặc chỉ định sử dụng..."
              style={{ resize: 'none' }}
            />
          </Form.Item>
        </Form>
      </Modal>
    </div>
  )
}
