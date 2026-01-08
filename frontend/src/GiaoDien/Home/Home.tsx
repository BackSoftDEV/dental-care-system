import { ArrowUpOutlined, UserOutlined } from '@ant-design/icons'
import { Avatar, Button, Card, DatePicker, Flex, Input, List, Space, Statistic, Typography } from 'antd'
import dayjs, { Dayjs } from 'dayjs'
import isSameOrAfter from 'dayjs/plugin/isSameOrAfter'
import isSameOrBefore from 'dayjs/plugin/isSameOrBefore'
import { useMemo, useState } from 'react'
import { useCustomers } from '../../hooks/useCustomers'
import type { CustomerMetrics } from '../../types/customer'

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
  const { customers, loading } = useCustomers()
  const [dateRange, setDateRange] = useState<[Dayjs, Dayjs] | null>(defaultMonthRange)
  const [tempDateRange, setTempDateRange] = useState<[Dayjs, Dayjs] | null>(defaultMonthRange)

  const calcAge = (date?: string) => {
    if (!date) return 0
    const birth = dayjs(date)
    if (!birth.isValid()) return 0
    return Math.max(0, Math.floor(dayjs().diff(birth, 'year', true)))
  }

  const filteredCustomers = useMemo(() => {
    if (!dateRange) return customers
    
    return customers.filter((customer) => {
      const customerDate = dayjs(customer.createdAt ?? customer.updatedAt ?? 0)
      return (
        customerDate.isSameOrAfter(dateRange[0], 'day') &&
        customerDate.isSameOrBefore(dateRange[1], 'day')
      )
    })
  }, [customers, dateRange])

  const metrics: CustomerMetrics = useMemo(() => {
    const totalCustomers = filteredCustomers.length
    const totalAmount = filteredCustomers.reduce((sum, c) => sum + c.amount, 0)
    const averageAge =
      filteredCustomers.length > 0
        ? Math.round(filteredCustomers.reduce((sum, c) => sum + calcAge(c.dateOfBirth), 0) / filteredCustomers.length)
        : 0

    return { totalCustomers, totalAmount, averageAge }
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
    { label: 'Tháng trước', value: [dayjs().subtract(1, 'month').startOf('month'), dayjs().subtract(1, 'month').endOf('month')] },
    { label: '3 tháng qua', value: [dayjs().subtract(2, 'month').startOf('month'), dayjs().endOf('month')] },
  ]

  return (
    <Flex vertical gap="large">
      <div>
        <Title level={3} style={{ marginBottom: 4 }}>
          Chào mừng trở lại ✨
        </Title>
        <Text type="secondary">Theo dõi thông tin điều trị và chi phí mỗi ngày</Text>
      </div>

      <Card>
        <Space direction="vertical" size={4} style={{ width: '100%' }}>
          <Text type="secondary">Lọc theo khoảng thời gian</Text>
          <Space>
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
              style={{ width: 300 }}
            />
            <Button
              type="primary"
              onClick={() => setDateRange(tempDateRange)}
              disabled={!tempDateRange}
            >
              OK
            </Button>
            <Button
              onClick={() => {
                setTempDateRange(null)
                setDateRange(null)
              }}
              disabled={!dateRange && !tempDateRange}
            >
              Xóa
            </Button>
            {dateRange && (
              <Text type="secondary">
                ({filteredCustomers.length} khách hàng trong khoảng thời gian đã chọn)
              </Text>
            )}
          </Space>
        </Space>
      </Card>

      <Flex gap="middle" wrap>
        <Card style={{ flex: 1, minWidth: 220 }} loading={loading}>
          <Statistic title="Tổng khách hàng" value={metrics.totalCustomers} />
        </Card>
        <Card style={{ flex: 1, minWidth: 220 }} loading={loading}>
          <Statistic
            title="Tổng doanh thu"
            value={metrics.totalAmount}
            valueStyle={{ color: '#52c41a' }}
            prefix={<ArrowUpOutlined />}
            formatter={(value) =>
              Number(value).toLocaleString('vi-VN', {
                style: 'currency',
                currency: 'VND',
                maximumFractionDigits: 0,
              })
            }
          />
        </Card>
        <Card style={{ flex: 1, minWidth: 220 }} loading={loading}>
          <Statistic title="Tuổi trung bình" value={metrics.averageAge} suffix=" tuổi" />
        </Card>
      </Flex>

      <Flex gap="large" wrap>
        <Card title="Khách hàng mới" style={{ flex: 1, minWidth: 340 }} loading={loading}>
          <List
            dataSource={recentCustomers}
            locale={{ emptyText: 'Chưa có dữ liệu' }}
            renderItem={(item) => (
              <List.Item>
                <List.Item.Meta
                  avatar={<Avatar icon={<UserOutlined />} />}
                  title={item.fullName}
                  description={
                    <>
                      <Text type="secondary">{item.phone}</Text>
                      <br />
                      <Text>
                        {item.treatment || '—'} ·{' '}
                        {(item.amount ?? 0).toLocaleString('vi-VN', {
                          style: 'currency',
                          currency: 'VND',
                          maximumFractionDigits: 0,
                        })}
                      </Text>
                    </>
                  }
                />
              </List.Item>
            )}
          />
        </Card>

        <Card title="Chi tiêu cao" style={{ flex: 1, minWidth: 340 }} loading={loading}>
          <List
            dataSource={highValueCustomers}
            locale={{ emptyText: 'Chưa có dữ liệu' }}
            renderItem={(item) => (
              <List.Item>
                <List.Item.Meta
                  title={item.fullName}
                  description={
                    <>
                      <Text type="secondary">{item.address || '—'}</Text>
                      <br />
                      <Text>
                        {(item.amount ?? 0).toLocaleString('vi-VN', {
                          style: 'currency',
                          currency: 'VND',
                          maximumFractionDigits: 0,
                        })}
                      </Text>
                    </>
                  }
                />
              </List.Item>
            )}
          />
        </Card>
      </Flex>

      <Card title="Ghi chú nhanh">
        <Input.TextArea rows={4} placeholder="Ghi nhớ cho đội ngũ CSKH..." />
      </Card>
    </Flex>
  )
}
