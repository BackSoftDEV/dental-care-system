import {
  DeleteOutlined,
  EditOutlined,
  EyeOutlined,
  UndoOutlined,
} from '@ant-design/icons'
import {
  Avatar,
  Button,
  Card,
  Popconfirm,
  Space,
  Table,
  Tabs,
  Tag,
  Tooltip,
  Typography,
} from 'antd'
import type { ColumnsType } from 'antd/es/table'
import { createStyles } from 'antd-style'
import dayjs from 'dayjs'
import type { Customer } from '../../../types/customer'

const { Text, Link } = Typography

const useStyle = createStyles(({ css }) => ({
  customTable: css`
    .ant-table {
      .ant-table-container {
        .ant-table-body,
        .ant-table-content {
          scrollbar-width: thin;
          scrollbar-color: #eaeaea transparent;
          scrollbar-gutter: stable;

          &::-webkit-scrollbar {
            width: 8px;
            height: 8px;
          }

          &::-webkit-scrollbar-track {
            background: transparent;
          }

          &::-webkit-scrollbar-thumb {
            background-color: #eaeaea;
            border-radius: 4px;
          }

          &::-webkit-scrollbar-thumb:hover {
            background-color: #d0d0d0;
          }
        }
      }
    }
  `,
}))

interface CustomerTableProps {
  activeTab: string
  onTabChange: (key: string) => void
  customers: Customer[]
  loading: boolean
  deletedCustomers: Customer[]
  deletedLoading: boolean
  onViewDetails: (customer: Customer) => void
  onEditCustomer: (customer: Customer) => void
  onDeleteCustomer: (customer: Customer) => void
  deletingId: number | null
  onRestoreCustomer: (customer: Customer) => void
  restoringId: number | null
  pageSize: number
  onPageSizeChange: (size: number) => void
}

export default function CustomerTable({
  activeTab,
  onTabChange,
  customers,
  loading,
  deletedCustomers,
  deletedLoading,
  onViewDetails,
  onEditCustomer,
  onDeleteCustomer,
  deletingId,
  onRestoreCustomer,
  restoringId,
  pageSize,
  onPageSizeChange,
}: CustomerTableProps) {
  const { styles } = useStyle()

  const columns: ColumnsType<Customer> = [
    {
      title: 'Khách hàng',
      dataIndex: 'fullName',
      key: 'fullName',
      width: 230,
      render: (_: string, record: Customer) => (
        <Space size={12} align="center">
          <Tooltip title="Bấm để xem chi tiết hồ sơ bệnh nhân">
            <Avatar
              style={{
                backgroundColor: record.gender ? '#e0f2fe' : '#fce7f3',
                color: record.gender ? '#0284c7' : '#db2777',
                fontWeight: 600,
                cursor: 'pointer',
              }}
              onClick={() => onViewDetails(record)}
            >
              {record.fullName ? record.fullName.charAt(0).toUpperCase() : 'K'}
            </Avatar>
          </Tooltip>
          <Space direction="vertical" size={2}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
              <Link
                onClick={() => onViewDetails(record)}
                style={{
                  fontWeight: 600,
                  color: '#0f172a',
                  fontSize: 14,
                }}
                title="Bấm để xem chi tiết hồ sơ bệnh nhân"
              >
                {record.fullName}
              </Link>
              {record.visitCount && record.visitCount > 1 ? (
                <Tag
                  color="blue"
                  style={{
                    borderRadius: 10,
                    fontSize: 10,
                    padding: '0 6px',
                    margin: 0,
                    fontWeight: 500,
                    lineHeight: '18px',
                    border: 'none',
                    cursor: 'pointer',
                  }}
                  onClick={() => onViewDetails(record)}
                  title="Xem lịch sử các lần khám"
                >
                  {record.visitCount} lần khám
                </Tag>
              ) : null}
            </div>
            <Text type="secondary" style={{ fontSize: 12 }}>{record.phone}</Text>
          </Space>
        </Space>
      ),
    },
    {
      title: 'Giới tính',
      dataIndex: 'gender',
      key: 'gender',
      width: 90,
      render: (value: Customer['gender']) =>
        value ? (
          <Tag color="processing" style={{ borderRadius: 6, margin: 0 }}>Nam</Tag>
        ) : (
          <Tag color="magenta" style={{ borderRadius: 6, margin: 0 }}>Nữ</Tag>
        ),
    },
    {
      title: 'Tuổi',
      dataIndex: 'age',
      key: 'age',
      width: 90,
      render: (value: number | null | undefined, record: Customer) => {
        if (value !== null && value !== undefined) {
          return `${value} tuổi`
        }
        const age = dayjs().diff(dayjs(record.dateOfBirth), 'year')
        return `${age} tuổi`
      },
      sorter: (a, b) => {
        const ageA = a.age ?? dayjs().diff(dayjs(a.dateOfBirth), 'year')
        const ageB = b.age ?? dayjs().diff(dayjs(b.dateOfBirth), 'year')
        return ageA - ageB
      },
    },
    {
      title: 'Địa chỉ',
      dataIndex: 'address',
      key: 'address',
      ellipsis: true,
      render: (val?: string) => <Text style={{ color: '#475569' }}>{val || '—'}</Text>,
    },
    {
      title: 'Cách xử lý',
      dataIndex: 'treatment',
      key: 'treatment',
      width: 230,
      render: (val?: string) => {
        if (!val) return '—'
        const services = val
          .split(',')
          .map((s) => s.trim())
          .filter(Boolean)

        if (services.length === 0) return '—'

        if (services.length <= 2) {
          return (
            <Space size={[4, 4]} wrap>
              {services.map((item, idx) => (
                <Tag
                  key={idx}
                  color="cyan"
                  style={{
                    borderRadius: 4,
                    fontSize: 12,
                    margin: 0,
                    fontWeight: 500,
                    maxWidth: 190,
                    overflow: 'hidden',
                    textOverflow: 'ellipsis',
                    whiteSpace: 'nowrap',
                  }}
                  title={item}
                >
                  {item}
                </Tag>
              ))}
            </Space>
          )
        }

        const visibleServices = services.slice(0, 2)
        const remaining = services.length - 2

        return (
          <Tooltip
            title={
              <div>
                <div style={{ fontWeight: 600, marginBottom: 4, color: '#38bdf8' }}>
                  Các dịch vụ điều trị:
                </div>
                {services.map((item, idx) => (
                  <div key={idx} style={{ fontSize: 12, lineHeight: 1.5 }}>
                    • {item}
                  </div>
                ))}
              </div>
            }
            placement="topLeft"
          >
            <Space size={[4, 4]} wrap style={{ cursor: 'pointer' }}>
              {visibleServices.map((item, idx) => (
                <Tag
                  key={idx}
                  color="cyan"
                  style={{
                    borderRadius: 4,
                    fontSize: 12,
                    margin: 0,
                    fontWeight: 500,
                    maxWidth: 130,
                    overflow: 'hidden',
                    textOverflow: 'ellipsis',
                    whiteSpace: 'nowrap',
                  }}
                >
                  {item}
                </Tag>
              ))}
              <Tag
                style={{
                  borderRadius: 4,
                  fontSize: 11,
                  margin: 0,
                  background: '#f1f5f9',
                  color: '#0284c7',
                  border: '1px solid #bae6fd',
                  fontWeight: 600,
                }}
              >
                +{remaining}
              </Tag>
            </Space>
          </Tooltip>
        )
      },
    },
    {
      title: 'Thành tiền',
      dataIndex: 'amount',
      key: 'amount',
      width: 140,
      render: (value?: number) => (
        <Text strong style={{ color: '#059669', fontSize: 13 }}>
          {(value ?? 0).toLocaleString('vi-VN', { style: 'currency', currency: 'VND' })}
        </Text>
      ),
      sorter: (a, b) => (a.amount ?? 0) - (b.amount ?? 0),
    },
    {
      title: 'Cập nhật',
      dataIndex: 'updatedAt',
      key: 'updatedAt',
      width: 150,
      render: (value?: string) => (
        <Text type="secondary" style={{ fontSize: 12 }}>
          {value ? dayjs(value).format('HH:mm DD/MM/YYYY') : '—'}
        </Text>
      ),
    },
    {
      title: 'Thao tác',
      key: 'actions',
      fixed: 'right',
      width: 170,
      render: (_: unknown, record: Customer) => (
        <Space size={4}>
          <Button
            type="text"
            size="small"
            icon={<EyeOutlined style={{ color: '#0284c7' }} />}
            onClick={() => onViewDetails(record)}
          >
            Chi tiết
          </Button>
          <Button
            type="text"
            size="small"
            icon={<EditOutlined style={{ color: '#64748b' }} />}
            onClick={() => onEditCustomer(record)}
          />
          <Popconfirm
            title="Xóa khách hàng?"
            description="Khách hàng sẽ được ẩn khỏi danh sách."
            okText="Xóa"
            cancelText="Hủy"
            onConfirm={() => onDeleteCustomer(record)}
            okButtonProps={{ loading: deletingId === record.id, danger: true }}
          >
            <Button
              type="text"
              danger
              size="small"
              icon={<DeleteOutlined />}
              loading={deletingId === record.id}
            />
          </Popconfirm>
        </Space>
      ),
    },
  ]

  return (
    <Card>
      <Tabs
        activeKey={activeTab}
        onChange={onTabChange}
        items={[
          {
            key: 'active',
            label: 'Danh sách khách hàng',
            children: (
              <Table<Customer>
                className={styles.customTable}
                dataSource={customers}
                columns={columns}
                rowKey="id"
                loading={loading}
                scroll={{ x: 'max-content', y: 560 }}
                pagination={{
                  pageSize: pageSize,
                  showSizeChanger: true,
                  showTotal: (total, range) => `${range[0]}-${range[1]} của ${total} khách hàng`,
                  pageSizeOptions: ['10', '20', '50', '100'],
                  onShowSizeChange: (_current, size) => {
                    onPageSizeChange(size)
                  },
                }}
                locale={{ emptyText: 'Không tìm thấy khách hàng nào' }}
              />
            ),
          },
          {
            key: 'deleted',
            label: `Đã xóa (${deletedCustomers.length})`,
            children: (
              <Table<Customer>
                className={styles.customTable}
                dataSource={deletedCustomers}
                columns={[
                  ...columns.slice(0, -1),
                  {
                    title: 'Thao tác',
                    key: 'actions',
                    fixed: 'right',
                    width: 170,
                    render: (_: unknown, record: Customer) => (
                      <Space size={4}>
                        <Button
                          type="text"
                          size="small"
                          icon={<EyeOutlined style={{ color: '#0284c7' }} />}
                          onClick={() => onViewDetails(record)}
                        >
                          Chi tiết
                        </Button>
                        <Popconfirm
                          title="Khôi phục khách hàng?"
                          description="Khách hàng sẽ được hiển thị lại trong danh sách."
                          okText="Khôi phục"
                          cancelText="Hủy"
                          onConfirm={() => onRestoreCustomer(record)}
                          okButtonProps={{ loading: restoringId === record.id }}
                        >
                          <Button
                            type="text"
                            size="small"
                            icon={<UndoOutlined style={{ color: '#10b981' }} />}
                            loading={restoringId === record.id}
                          >
                            Khôi phục
                          </Button>
                        </Popconfirm>
                      </Space>
                    ),
                  },
                ]}
                rowKey="id"
                loading={deletedLoading}
                scroll={{ x: 'max-content', y: 400 }}
                pagination={{
                  pageSize: pageSize,
                  showSizeChanger: true,
                  showTotal: (total, range) => `${range[0]}-${range[1]} của ${total} khách hàng đã xóa`,
                  pageSizeOptions: ['10', '20', '50', '100'],
                  total: deletedCustomers.length,
                  onShowSizeChange: (_current, size) => {
                    onPageSizeChange(size)
                  },
                }}
                locale={{ emptyText: 'Không có khách hàng đã xóa' }}
              />
            ),
          },
        ]}
      />
    </Card>
  )
}
