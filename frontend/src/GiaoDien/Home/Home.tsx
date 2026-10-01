import {
  CalendarOutlined,
  CheckCircleOutlined,
  CheckOutlined,
  DollarOutlined,
  FilterOutlined,
  MedicineBoxOutlined,
  PlusOutlined,
  ReloadOutlined,
  RiseOutlined,
  SaveOutlined,
  TeamOutlined,
  TrophyOutlined,
  UserOutlined,
} from '@ant-design/icons'
import {
  Avatar,
  Button,
  Card,
  DatePicker,
  Empty,
  Flex,
  Input,
  List,
  Space,
  Tag,
  Tooltip,
  Typography,
  message,
} from 'antd'
import dayjs, { Dayjs } from 'dayjs'
import isSameOrAfter from 'dayjs/plugin/isSameOrAfter'
import isSameOrBefore from 'dayjs/plugin/isSameOrBefore'
import { useEffect, useMemo, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useCustomers } from '../../hooks/useCustomers'
import type { CustomerMetrics } from '../../types/customer'
import { groupCustomersByPatient } from '../Customer/types'

dayjs.extend(isSameOrAfter)
dayjs.extend(isSameOrBefore)

const { Title, Text } = Typography
const { RangePicker } = DatePicker

// Giá trị mặc định: tháng hiện tại
const defaultMonthRange: [Dayjs, Dayjs] = [
  dayjs().startOf('month'),
  dayjs().endOf('month'),
]

export default function HomePage() {
  const navigate = useNavigate()
  const { customers, loading } = useCustomers()
  const [dateRange, setDateRange] = useState<[Dayjs, Dayjs] | null>(defaultMonthRange)
  const [tempDateRange, setTempDateRange] = useState<[Dayjs, Dayjs] | null>(defaultMonthRange)
  const [notes, setNotes] = useState('')
  const [isSaved, setIsSaved] = useState(true)

  // Load and save quick notes from localStorage
  useEffect(() => {
    const savedNotes = localStorage.getItem('smilecare_quick_notes')
    if (savedNotes) setNotes(savedNotes)
  }, [])

  // Auto-save debounce (1.5 seconds)
  useEffect(() => {
    if (isSaved) return
    const timer = setTimeout(() => {
      localStorage.setItem('smilecare_quick_notes', notes)
      setIsSaved(true)
    }, 1500)
    return () => clearTimeout(timer)
  }, [notes, isSaved])

  const handleSaveNotes = () => {
    localStorage.setItem('smilecare_quick_notes', notes)
    setIsSaved(true)
    message.success('Đã lưu ghi chú thành công!')
  }

  const calcAge = (date?: string) => {
    if (!date) return 0
    const birth = dayjs(date)
    if (!birth.isValid()) return 0
    return Math.max(0, Math.floor(dayjs().diff(birth, 'year', true)))
  }

  const groupedCustomers = useMemo(() => {
    return groupCustomersByPatient(customers)
  }, [customers])

  const filteredCustomers = useMemo(() => {
    if (!dateRange) return groupedCustomers

    return groupedCustomers.filter((customer) => {
      const customerDate = dayjs(customer.createdAt ?? customer.updatedAt ?? 0)
      return (
        customerDate.isSameOrAfter(dateRange[0], 'day') &&
        customerDate.isSameOrBefore(dateRange[1], 'day')
      )
    })
  }, [groupedCustomers, dateRange])

  const metrics: CustomerMetrics & { avgPerCustomer: number } = useMemo(() => {
    const totalCustomers = filteredCustomers.length
    const totalAmount = filteredCustomers.reduce((sum, c) => sum + c.amount, 0)
    const averageAge =
      filteredCustomers.length > 0
        ? Math.round(
            filteredCustomers.reduce((sum, c) => sum + calcAge(c.dateOfBirth), 0) /
              filteredCustomers.length,
          )
        : 0
    const avgPerCustomer = totalCustomers > 0 ? Math.round(totalAmount / totalCustomers) : 0

    return { totalCustomers, totalAmount, averageAge, avgPerCustomer }
  }, [filteredCustomers])

  const recentCustomers = useMemo(() => {
    return [...filteredCustomers]
      .sort(
        (a, b) =>
          dayjs(b.createdAt ?? b.updatedAt ?? 0).valueOf() -
          dayjs(a.createdAt ?? a.updatedAt ?? 0).valueOf(),
      )
      .slice(0, 5)
  }, [filteredCustomers])

  const highValueCustomers = useMemo(() => {
    return [...filteredCustomers].sort((a, b) => b.amount - a.amount).slice(0, 5)
  }, [filteredCustomers])

  const datePresets: { label: string; value: [Dayjs, Dayjs] }[] = [
    { label: 'Hôm nay', value: [dayjs().startOf('day'), dayjs().endOf('day')] },
    { label: '7 ngày qua', value: [dayjs().subtract(6, 'day').startOf('day'), dayjs().endOf('day')] },
    { label: '30 ngày qua', value: [dayjs().subtract(29, 'day').startOf('day'), dayjs().endOf('day')] },
    { label: 'Tháng này', value: [dayjs().startOf('month'), dayjs().endOf('month')] },
    {
      label: 'Tháng trước',
      value: [
        dayjs().subtract(1, 'month').startOf('month'),
        dayjs().subtract(1, 'month').endOf('month'),
      ],
    },
    {
      label: '3 tháng qua',
      value: [dayjs().subtract(2, 'month').startOf('month'), dayjs().endOf('month')],
    },
  ]

  return (
    <Flex vertical gap={20}>

      {/* Date Filter Bar */}
      <Card bodyStyle={{ padding: '14px 20px' }}>
        <Flex justify="space-between" align="center" wrap="wrap" gap={12}>
          <Space size={10} align="center" wrap>
            <FilterOutlined style={{ color: '#0284c7', fontSize: 15 }} />
            <Text strong style={{ color: '#334155', fontSize: 13 }}>
              Lọc theo thời gian:
            </Text>
            <RangePicker
              allowClear
              placeholder={['Từ ngày', 'Đến ngày']}
              value={tempDateRange ?? undefined}
              format="DD/MM/YYYY"
              presets={datePresets}
              onChange={(values) =>
                values && values[0] && values[1]
                  ? setTempDateRange([values[0], values[1]])
                  : setTempDateRange(null)
              }
              style={{ width: 260 }}
            />
            <Button
              type="primary"
              icon={<CheckOutlined />}
              onClick={() => setDateRange(tempDateRange)}
            >
              Áp dụng
            </Button>
            <Button
              type="default"
              icon={<ReloadOutlined />}
              onClick={() => {
                setTempDateRange(null)
                setDateRange(null)
              }}
              disabled={!dateRange && !tempDateRange}
              style={{ color: '#64748b' }}
            >
              Đặt lại
            </Button>
          </Space>

          <Space size={8} align="center">
            <Text type="secondary" style={{ fontSize: 13 }}>
              {dateRange ? 'Dữ liệu trong kỳ:' : 'Tổng số bệnh nhân:'}
            </Text>
            <Tag
              color={dateRange ? 'cyan' : 'default'}
              style={{
                borderRadius: 6,
                fontWeight: 600,
                padding: '2px 10px',
                fontSize: 13,
                margin: 0,
              }}
            >
              {filteredCustomers.length} bệnh nhân
            </Tag>
          </Space>
        </Flex>
      </Card>

      {/* 4 Metric Cards */}
      <Flex gap={16} wrap>
        {/* Metric 1 */}
        <Card style={{ flex: 1, minWidth: 220 }} loading={loading}>
          <Flex justify="space-between" align="start">
            <div>
              <Text type="secondary" style={{ fontSize: 13, fontWeight: 500 }}>
                Tổng bệnh nhân
              </Text>
              <div style={{ fontSize: 28, fontWeight: 700, color: '#0f172a', marginTop: 4 }}>
                {metrics.totalCustomers.toLocaleString('vi-VN')}
              </div>
              <Text type="secondary" style={{ fontSize: 12 }}>
                Đã đăng ký hồ sơ
              </Text>
            </div>
            <div
              style={{
                width: 44,
                height: 44,
                borderRadius: 12,
                background: '#e0f2fe',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                color: '#0284c7',
                fontSize: 20,
              }}
            >
              <TeamOutlined />
            </div>
          </Flex>
        </Card>

        {/* Metric 2 */}
        <Card style={{ flex: 1, minWidth: 220 }} loading={loading}>
          <Flex justify="space-between" align="start">
            <div>
              <Text type="secondary" style={{ fontSize: 13, fontWeight: 500 }}>
                Tổng doanh thu
              </Text>
              <div style={{ fontSize: 26, fontWeight: 700, color: '#059669', marginTop: 4 }}>
                {metrics.totalAmount.toLocaleString('vi-VN', {
                  style: 'currency',
                  currency: 'VND',
                  maximumFractionDigits: 0,
                })}
              </div>
              <Text type="secondary" style={{ fontSize: 12 }}>
                Doanh thu điều trị
              </Text>
            </div>
            <div
              style={{
                width: 44,
                height: 44,
                borderRadius: 12,
                background: '#d1fae5',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                color: '#059669',
                fontSize: 20,
              }}
            >
              <DollarOutlined />
            </div>
          </Flex>
        </Card>

        {/* Metric 3 */}
        <Card style={{ flex: 1, minWidth: 220 }} loading={loading}>
          <Flex justify="space-between" align="start">
            <div>
              <Text type="secondary" style={{ fontSize: 13, fontWeight: 500 }}>
                Độ tuổi trung bình
              </Text>
              <div style={{ fontSize: 28, fontWeight: 700, color: '#7c3aed', marginTop: 4 }}>
                {metrics.averageAge}{' '}
                <span style={{ fontSize: 15, fontWeight: 500, color: '#64748b' }}>tuổi</span>
              </div>
              <Text type="secondary" style={{ fontSize: 12 }}>
                Nhân khẩu học bệnh nhân
              </Text>
            </div>
            <div
              style={{
                width: 44,
                height: 44,
                borderRadius: 12,
                background: '#ede9fe',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                color: '#7c3aed',
                fontSize: 20,
              }}
            >
              <CalendarOutlined />
            </div>
          </Flex>
        </Card>

        {/* Metric 4 */}
        <Card style={{ flex: 1, minWidth: 220 }} loading={loading}>
          <Flex justify="space-between" align="start">
            <div>
              <Text type="secondary" style={{ fontSize: 13, fontWeight: 500 }}>
                Chi tiêu trung bình
              </Text>
              <div style={{ fontSize: 24, fontWeight: 700, color: '#d97706', marginTop: 4 }}>
                {metrics.avgPerCustomer.toLocaleString('vi-VN', {
                  style: 'currency',
                  currency: 'VND',
                  maximumFractionDigits: 0,
                })}
              </div>
              <Text type="secondary" style={{ fontSize: 12 }}>
                Trung bình mỗi khách
              </Text>
            </div>
            <div
              style={{
                width: 44,
                height: 44,
                borderRadius: 12,
                background: '#fef3c7',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                color: '#d97706',
                fontSize: 20,
              }}
            >
              <RiseOutlined />
            </div>
          </Flex>
        </Card>
      </Flex>

      {/* Customer Lists Section */}
      <Flex gap={20} wrap>
        {/* Recent Customers */}
        <Card
          title={
            <Space>
              <MedicineBoxOutlined style={{ color: '#0284c7' }} />
              <span>Khách hàng gần đây</span>
            </Space>
          }
          style={{ flex: 1, minWidth: 340 }}
          loading={loading}
        >
          <List
            dataSource={recentCustomers}
            locale={{
              emptyText: (
                <Empty
                  image={Empty.PRESENTED_IMAGE_SIMPLE}
                  description={
                    <Space direction="vertical" size={2}>
                      <Text strong style={{ color: '#475569' }}>
                        Chưa có lượt khám gần đây
                      </Text>
                      <Text type="secondary" style={{ fontSize: 12 }}>
                        Bệnh nhân mới tiếp nhận sẽ hiển thị tại đây
                      </Text>
                    </Space>
                  }
                  style={{ margin: '20px 0' }}
                >
                  <Button
                    type="dashed"
                    size="small"
                    icon={<PlusOutlined />}
                    onClick={() => navigate('/customers')}
                  >
                    Tiếp nhận bệnh nhân
                  </Button>
                </Empty>
              ),
            }}
            renderItem={(item) => {
              const services = (item.treatment || 'Khám tổng quát')
                .split(',')
                .map((s) => s.trim())
                .filter(Boolean)

              return (
                <List.Item style={{ padding: '12px 0' }}>
                  <List.Item.Meta
                    style={{ minWidth: 0, width: '100%' }}
                    avatar={
                      <Avatar
                        style={{
                          backgroundColor: '#e0f2fe',
                          color: '#0284c7',
                          fontWeight: 600,
                          flexShrink: 0,
                        }}
                        icon={<UserOutlined />}
                      >
                        {item.fullName ? item.fullName.charAt(0).toUpperCase() : 'K'}
                      </Avatar>
                    }
                    title={
                      <div
                        style={{
                          display: 'flex',
                          justifyContent: 'space-between',
                          alignItems: 'center',
                          gap: 8,
                          width: '100%',
                          minWidth: 0,
                        }}
                      >
                        <Text
                          strong
                          style={{
                            color: '#0f172a',
                            fontSize: 14,
                            whiteSpace: 'nowrap',
                            overflow: 'hidden',
                            textOverflow: 'ellipsis',
                            minWidth: 0,
                            flex: 1,
                          }}
                          title={item.fullName}
                        >
                          {item.fullName}
                        </Text>
                        <Text
                          strong
                          style={{
                            color: '#0284c7',
                            fontSize: 13,
                            whiteSpace: 'nowrap',
                            flexShrink: 0,
                          }}
                        >
                          {(item.amount ?? 0).toLocaleString('vi-VN', {
                            style: 'currency',
                            currency: 'VND',
                            maximumFractionDigits: 0,
                          })}
                        </Text>
                      </div>
                    }
                    description={
                      <div
                        style={{
                          display: 'flex',
                          justifyContent: 'space-between',
                          alignItems: 'center',
                          marginTop: 6,
                          gap: 8,
                          width: '100%',
                          minWidth: 0,
                        }}
                      >
                        <Text type="secondary" style={{ fontSize: 12, flexShrink: 0 }}>
                          SĐT: {item.phone || '—'}
                        </Text>

                        <div
                          style={{
                            display: 'flex',
                            alignItems: 'center',
                            gap: 4,
                            overflow: 'hidden',
                            justifyContent: 'flex-end',
                            minWidth: 0,
                            flex: 1,
                          }}
                        >
                          {services.length <= 1 ? (
                            <Tag
                              color="cyan"
                              style={{
                                fontSize: 11,
                                borderRadius: 4,
                                margin: 0,
                                maxWidth: '100%',
                                overflow: 'hidden',
                                textOverflow: 'ellipsis',
                                whiteSpace: 'nowrap',
                              }}
                              title={services[0]}
                            >
                              {services[0]}
                            </Tag>
                          ) : (
                            <Tooltip
                              title={
                                <div>
                                  <div style={{ fontWeight: 600, marginBottom: 4, color: '#38bdf8' }}>
                                    Dịch vụ thực hiện:
                                  </div>
                                  {services.map((s, idx) => (
                                    <div key={idx} style={{ fontSize: 12, lineHeight: 1.5 }}>
                                      • {s}
                                    </div>
                                  ))}
                                </div>
                              }
                              placement="topLeft"
                            >
                              <div
                                style={{
                                  display: 'flex',
                                  alignItems: 'center',
                                  gap: 4,
                                  cursor: 'pointer',
                                  overflow: 'hidden',
                                  minWidth: 0,
                                }}
                              >
                                <Tag
                                  color="cyan"
                                  style={{
                                    fontSize: 11,
                                    borderRadius: 4,
                                    margin: 0,
                                    maxWidth: 130,
                                    overflow: 'hidden',
                                    textOverflow: 'ellipsis',
                                    whiteSpace: 'nowrap',
                                  }}
                                >
                                  {services[0]}
                                </Tag>
                                <Tag
                                  color="processing"
                                  style={{
                                    fontSize: 11,
                                    borderRadius: 4,
                                    margin: 0,
                                    flexShrink: 0,
                                  }}
                                >
                                  +{services.length - 1}
                                </Tag>
                              </div>
                            </Tooltip>
                          )}
                        </div>
                      </div>
                    }
                  />
                </List.Item>
              )
            }}
          />
        </Card>

        {/* High Value Customers */}
        <Card
          title={
            <Space>
              <TrophyOutlined style={{ color: '#f59e0b' }} />
              <span>Bệnh nhân chi tiêu cao</span>
            </Space>
          }
          style={{ flex: 1, minWidth: 340 }}
          loading={loading}
        >
          <List
            dataSource={highValueCustomers}
            locale={{
              emptyText: (
                <Empty
                  image={Empty.PRESENTED_IMAGE_SIMPLE}
                  description={
                    <Space direction="vertical" size={2}>
                      <Text strong style={{ color: '#475569' }}>
                        Chưa có dữ liệu chi tiêu
                      </Text>
                      <Text type="secondary" style={{ fontSize: 12 }}>
                        Danh sách bệnh nhân VIP sẽ cập nhật theo doanh thu
                      </Text>
                    </Space>
                  }
                  style={{ margin: '20px 0' }}
                >
                  <Button
                    type="dashed"
                    size="small"
                    icon={<PlusOutlined />}
                    onClick={() => navigate('/customers')}
                  >
                    Thêm hồ sơ bệnh nhân
                  </Button>
                </Empty>
              ),
            }}
            renderItem={(item, index) => (
              <List.Item style={{ padding: '12px 0' }}>
                <List.Item.Meta
                  style={{ minWidth: 0, width: '100%' }}
                  avatar={
                    <div
                      style={{
                        width: 32,
                        height: 32,
                        borderRadius: '50%',
                        background:
                          index === 0
                            ? '#fef3c7'
                            : index === 1
                            ? '#f1f5f9'
                            : index === 2
                            ? '#ffedd5'
                            : '#f8fafc',
                        color:
                          index === 0
                            ? '#d97706'
                            : index === 1
                            ? '#475569'
                            : index === 2
                            ? '#c2410c'
                            : '#94a3b8',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        fontWeight: 700,
                        fontSize: 13,
                        flexShrink: 0,
                      }}
                    >
                      {index + 1}
                    </div>
                  }
                  title={
                    <div
                      style={{
                        display: 'flex',
                        justifyContent: 'space-between',
                        alignItems: 'center',
                        gap: 8,
                        width: '100%',
                        minWidth: 0,
                      }}
                    >
                      <div
                        style={{
                          display: 'flex',
                          alignItems: 'center',
                          gap: 6,
                          minWidth: 0,
                          flex: 1,
                          overflow: 'hidden',
                        }}
                      >
                        <Text
                          strong
                          style={{
                            color: '#0f172a',
                            fontSize: 14,
                            whiteSpace: 'nowrap',
                            overflow: 'hidden',
                            textOverflow: 'ellipsis',
                          }}
                          title={item.fullName}
                        >
                          {item.fullName}
                        </Text>
                        <Tag
                          color="gold"
                          style={{ fontSize: 10, borderRadius: 4, margin: 0, flexShrink: 0 }}
                        >
                          VIP
                        </Tag>
                      </div>
                      <Text
                        strong
                        style={{
                          color: '#059669',
                          fontSize: 14,
                          whiteSpace: 'nowrap',
                          flexShrink: 0,
                        }}
                      >
                        {(item.amount ?? 0).toLocaleString('vi-VN', {
                          style: 'currency',
                          currency: 'VND',
                          maximumFractionDigits: 0,
                        })}
                      </Text>
                    </div>
                  }
                  description={
                    <Flex justify="space-between" align="center" style={{ marginTop: 6, minWidth: 0 }}>
                      <Text
                        type="secondary"
                        style={{
                          fontSize: 12,
                          whiteSpace: 'nowrap',
                          overflow: 'hidden',
                          textOverflow: 'ellipsis',
                          minWidth: 0,
                          flex: 1,
                        }}
                        title={item.address}
                      >
                        {item.address || '—'}
                      </Text>
                      <Text type="secondary" style={{ fontSize: 12, flexShrink: 0, marginLeft: 8 }}>
                        SĐT: {item.phone || '—'}
                      </Text>
                    </Flex>
                  }
                />
              </List.Item>
            )}
          />
        </Card>
      </Flex>

      {/* Quick Notes Card */}
      <Card
        title={
          <Flex justify="space-between" align="center">
            <span>Ghi chú & Lời nhắc đội ngũ CSKH</span>
            {isSaved ? (
              <Tag color="success" style={{ borderRadius: 10, fontSize: 11, border: 'none' }}>
                <CheckCircleOutlined style={{ marginRight: 4 }} />
                Đã lưu
              </Tag>
            ) : (
              <Tag color="warning" style={{ borderRadius: 10, fontSize: 11, border: 'none' }}>
                Chưa lưu thay đổi
              </Tag>
            )}
          </Flex>
        }
      >
        <Input.TextArea
          rows={3}
          value={notes}
          onChange={(e) => {
            setNotes(e.target.value)
            setIsSaved(false)
          }}
          onKeyDown={(e) => {
            if ((e.ctrlKey || e.metaKey) && e.key === 'Enter') {
              e.preventDefault()
              handleSaveNotes()
            }
          }}
          placeholder="Nhập nhắc việc cho lễ tân, thông tin ca phẫu thuật đặc biệt hoặc lưu ý thuốc cho bệnh nhân..."
          style={{ borderRadius: 8 }}
        />
        <Flex justify="flex-end" align="center" style={{ marginTop: 12 }}>
          <Button
            type="primary"
            icon={<SaveOutlined />}
            onClick={handleSaveNotes}
          >
            Lưu ghi chú
          </Button>
        </Flex>
      </Card>
    </Flex>
  )
}

