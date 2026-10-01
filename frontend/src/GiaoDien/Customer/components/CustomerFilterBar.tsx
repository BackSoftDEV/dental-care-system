import {
  DownloadOutlined,
  PlusOutlined,
  ReloadOutlined,
  SearchOutlined,
  UploadOutlined,
} from '@ant-design/icons'
import {
  Button,
  Card,
  DatePicker,
  Divider,
  Flex,
  Input,
  InputNumber,
  Select,
  Space,
  Typography,
  Upload,
  type UploadProps,
} from 'antd'
import type { Dayjs } from 'dayjs'
import {
  datePresets,
  dobPresets,
  formatCurrencyInput,
  parseCurrencyInput,
} from '../types'

const { Text } = Typography
const { RangePicker } = DatePicker

interface CustomerFilterBarProps {
  searchTerm: string
  onSearchChange: (val: string) => void
  genderFilter: 'all' | 'male' | 'female'
  onGenderFilterChange: (val: 'all' | 'male' | 'female') => void
  dobRange: [Dayjs, Dayjs] | null
  onDobRangeChange: (val: [Dayjs, Dayjs] | null) => void
  dateRange: [Dayjs, Dayjs] | null
  onDateRangeChange: (val: [Dayjs, Dayjs] | null) => void
  minAmount?: number
  onMinAmountChange: (val?: number) => void
  maxAmount?: number
  onMaxAmountChange: (val?: number) => void
  onResetFilters: () => void
  onOpenCreateModal: () => void
  onExportExcel: () => void
  uploadProps: UploadProps
  importing: boolean
  onRefresh: () => void
}

export default function CustomerFilterBar({
  searchTerm,
  onSearchChange,
  genderFilter,
  onGenderFilterChange,
  dobRange,
  onDobRangeChange,
  dateRange,
  onDateRangeChange,
  minAmount,
  onMinAmountChange,
  maxAmount,
  onMaxAmountChange,
  onResetFilters,
  onOpenCreateModal,
  onExportExcel,
  uploadProps,
  importing,
  onRefresh,
}: CustomerFilterBarProps) {
  return (
    <Card style={{ marginBottom: 20 }}>
      <Flex vertical gap={16}>
        {/* Top Actions Bar */}
        <Flex justify="space-between" align="center" wrap="wrap" gap={12}>
          <Input
            allowClear
            prefix={<SearchOutlined style={{ color: '#94a3b8' }} />}
            placeholder="Tìm theo tên, số điện thoại, địa chỉ hoặc điều trị..."
            value={searchTerm}
            onChange={(e) => onSearchChange(e.target.value)}
            style={{ width: 360, borderRadius: 8 }}
          />
          <Flex gap={8} wrap>
            <Button
              type="primary"
              icon={<PlusOutlined />}
              onClick={onOpenCreateModal}
            >
              Thêm khách hàng
            </Button>
            <Button icon={<DownloadOutlined />} onClick={onExportExcel}>
              Xuất Excel
            </Button>
            <Upload {...uploadProps}>
              <Button icon={<UploadOutlined />} loading={importing}>
                Nhập Excel
              </Button>
            </Upload>
            <Button icon={<ReloadOutlined />} onClick={onRefresh}>
              Tải lại
            </Button>
          </Flex>
        </Flex>

        <Divider style={{ margin: '2px 0' }} />

        {/* Filter Criteria Bar */}
        <Flex gap={16} wrap align="flex-end">
          <Space direction="vertical" size={4}>
            <Text type="secondary" style={{ fontSize: 12, fontWeight: 500 }}>
              Giới tính
            </Text>
            <Select<'all' | 'male' | 'female'>
              value={genderFilter}
              style={{ width: 120 }}
              onChange={onGenderFilterChange}
              options={[
                { value: 'all', label: 'Tất cả' },
                { value: 'male', label: 'Nam' },
                { value: 'female', label: 'Nữ' },
              ]}
            />
          </Space>

          <Space direction="vertical" size={4}>
            <Text type="secondary" style={{ fontSize: 12, fontWeight: 500 }}>
              Ngày sinh
            </Text>
            <RangePicker
              allowClear
              placeholder={['Từ ngày', 'Đến ngày']}
              value={dobRange ?? undefined}
              format="DD/MM/YYYY"
              presets={dobPresets}
              style={{ width: 250 }}
              onChange={(values) =>
                values && values[0] && values[1]
                  ? onDobRangeChange([values[0], values[1]])
                  : onDobRangeChange(null)
              }
            />
          </Space>

          <Space direction="vertical" size={4}>
            <Text type="secondary" style={{ fontSize: 12, fontWeight: 500 }}>
              Ngày tạo / Cập nhật
            </Text>
            <RangePicker
              allowClear
              placeholder={['Từ ngày', 'Đến ngày']}
              value={dateRange ?? undefined}
              format="DD/MM/YYYY"
              presets={datePresets}
              style={{ width: 250 }}
              onChange={(values) =>
                values && values[0] && values[1]
                  ? onDateRangeChange([values[0], values[1]])
                  : onDateRangeChange(null)
              }
            />
          </Space>

          <Space direction="vertical" size={4}>
            <Text type="secondary" style={{ fontSize: 12, fontWeight: 500 }}>
              Thành tiền (VNĐ)
            </Text>
            <Space>
              <InputNumber
                placeholder="Tối thiểu"
                min={0}
                value={minAmount}
                formatter={(value) => formatCurrencyInput(value ?? '')}
                parser={(value) => parseCurrencyInput(value)}
                onChange={(value) => onMinAmountChange(value ?? undefined)}
                style={{ width: 135 }}
              />
              <InputNumber
                placeholder="Tối đa"
                min={0}
                value={maxAmount}
                formatter={(value) => formatCurrencyInput(value ?? '')}
                parser={(value) => parseCurrencyInput(value)}
                onChange={(value) => onMaxAmountChange(value ?? undefined)}
                style={{ width: 135 }}
              />
            </Space>
          </Space>

          <Button onClick={onResetFilters} style={{ alignSelf: 'flex-end' }}>
            Đặt lại lọc
          </Button>
        </Flex>
      </Flex>
    </Card>
  )
}
