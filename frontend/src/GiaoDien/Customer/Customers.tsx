import { DownloadOutlined, PlusOutlined, TeamOutlined, UploadOutlined } from '@ant-design/icons'
import {
  AutoComplete,
  Button,
  Card,
  DatePicker,
  Descriptions,
  Divider,
  Flex,
  Form,
  Input,
  InputNumber,
  Modal,
  Popconfirm,
  Radio,
  Select,
  Skeleton,
  Space,
  Table,
  Tabs,
  Typography,
  Upload,
  message,
} from 'antd'
import type { ColumnsType } from 'antd/es/table'
import { createStyles } from 'antd-style'
import dayjs, { Dayjs } from 'dayjs'
import 'dayjs/locale/vi'
import isSameOrAfter from 'dayjs/plugin/isSameOrAfter'
import isSameOrBefore from 'dayjs/plugin/isSameOrBefore'
import { useEffect, useMemo, useState } from 'react'
import { useCustomers } from '../../hooks/useCustomers'
import { customerApi, type CustomerVisit } from '../../services/customerApi'
import type { Customer } from '../../types/customer'
import { exportToExcel, importFromExcel } from '../../utils/excelUtils'
import type { UploadProps } from 'antd'
import { utils, writeFile } from 'xlsx'

dayjs.extend(isSameOrAfter)
dayjs.extend(isSameOrBefore)
dayjs.locale('vi')

const { Text } = Typography
const { RangePicker } = DatePicker

const useStyle = createStyles(({ css }) => {
  return {
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
  }
})

const formatCurrencyInput = (value?: string | number) => {
  if (value === undefined || value === null || value === '') return ''
  const str = typeof value === 'number' ? `${value}` : value
  return str.replace(/\B(?=(\d{3})+(?!\d))/g, '.')
}

const parseCurrencyInput = (value?: string) => {
  const numeric = value?.replace(/\./g, '')
  return Number(numeric || '0')
}

interface CustomerFormValues {
  fullName: string
  gender: boolean
  age: number
  address: string
  phone: string
  treatment: string
  amount?: number | string
  notes?: string
}

export default function CustomersPage() {
  const { styles } = useStyle()
  const { customers, loading, refresh, setCustomers } = useCustomers()
  const [searchTerm, setSearchTerm] = useState('')
  const [modalOpen, setModalOpen] = useState(false)
  const [editingCustomer, setEditingCustomer] = useState<Customer | null>(null)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [prefillLoading, setPrefillLoading] = useState(false)
  const [phoneOptions, setPhoneOptions] = useState<{ value: string; label: string; customer: Customer }[]>([])
  const [searchingPhones, setSearchingPhones] = useState(false)
  const [genderFilter, setGenderFilter] = useState<'all' | 'male' | 'female'>('all')
  const [dobRange, setDobRange] = useState<[Dayjs, Dayjs] | null>(null)
  const [dateRange, setDateRange] = useState<[Dayjs, Dayjs] | null>(null)
  const [tempDateRange, setTempDateRange] = useState<[Dayjs, Dayjs] | null>(null)
  const [minAmount, setMinAmount] = useState<number | undefined>()
  const [maxAmount, setMaxAmount] = useState<number | undefined>()
  const [detailOpen, setDetailOpen] = useState(false)
  const [detailLoading, setDetailLoading] = useState(false)
  const [detailData, setDetailData] = useState<{ customer: Customer; visits: CustomerVisit[] } | null>(
    null,
  )
  const [importing, setImporting] = useState(false)
  const [deletingId, setDeletingId] = useState<number | null>(null)
  const [restoringId, setRestoringId] = useState<number | null>(null)
  const [pageSize, setPageSize] = useState(10)
  const [activeTab, setActiveTab] = useState('active')
  const [deletedCustomers, setDeletedCustomers] = useState<Customer[]>([])
  const [deletedLoading, setDeletedLoading] = useState(false)
  const [form] = Form.useForm<CustomerFormValues>()
  const isEditing = Boolean(editingCustomer)
  const dobPresets: { label: string; value: [Dayjs, Dayjs] }[] = [
    { label: '1 năm gần nhất', value: [dayjs().subtract(1, 'year'), dayjs()] },
    { label: '3 năm gần nhất', value: [dayjs().subtract(3, 'year'), dayjs()] },
    { label: '5 năm gần nhất', value: [dayjs().subtract(5, 'year'), dayjs()] },
  ]

  const datePresets: { label: string; value: [Dayjs, Dayjs] }[] = [
    { label: 'Hôm nay', value: [dayjs().startOf('day'), dayjs().endOf('day')] },
    { label: '7 ngày qua', value: [dayjs().subtract(6, 'day').startOf('day'), dayjs().endOf('day')] },
    { label: '30 ngày qua', value: [dayjs().subtract(29, 'day').startOf('day'), dayjs().endOf('day')] },
    { label: 'Tháng này', value: [dayjs().startOf('month'), dayjs().endOf('month')] },
    { label: 'Tháng trước', value: [dayjs().subtract(1, 'month').startOf('month'), dayjs().subtract(1, 'month').endOf('month')] },
    { label: '3 tháng qua', value: [dayjs().subtract(2, 'month').startOf('month'), dayjs().endOf('month')] },
  ]

  const filteredCustomers = useMemo(() => {
    const lower = searchTerm.toLowerCase()
    return customers.filter((customer) => {
      const matchesKeyword =
        !searchTerm ||
        customer.fullName.toLowerCase().includes(lower) ||
        customer.phone.includes(searchTerm) ||
        customer.address.toLowerCase().includes(lower) ||
        customer.treatment.toLowerCase().includes(lower)

      const matchesGender =
        genderFilter === 'all' ||
        (genderFilter === 'male' && customer.gender) ||
        (genderFilter === 'female' && !customer.gender)

      const matchesDob =
        !dobRange ||
        (dobRange[0] &&
          dobRange[1] &&
          dayjs(customer.dateOfBirth).isSameOrAfter(dobRange[0], 'day') &&
          dayjs(customer.dateOfBirth).isSameOrBefore(dobRange[1], 'day'))

      const matchesDateRange =
        !dateRange ||
        (dateRange[0] &&
          dateRange[1] &&
          dayjs(customer.createdAt ?? customer.updatedAt ?? 0).isSameOrAfter(dateRange[0], 'day') &&
          dayjs(customer.createdAt ?? customer.updatedAt ?? 0).isSameOrBefore(dateRange[1], 'day'))

      const matchesAmount =
        (minAmount === undefined || customer.amount >= minAmount) &&
        (maxAmount === undefined || customer.amount <= maxAmount)

      return matchesKeyword && matchesGender && matchesDob && matchesDateRange && matchesAmount
    })
  }, [customers, searchTerm, genderFilter, dobRange, dateRange, minAmount, maxAmount])

  const openCreateModal = () => {
    setEditingCustomer(null)
    form.resetFields()
    setModalOpen(true)
  }

  const handleCloseModal = () => {
    setModalOpen(false)
    setEditingCustomer(null)
    form.resetFields()
    setPhoneOptions([])
  }

  const handleEditCustomer = (customer: Customer) => {
    setEditingCustomer(customer)
    const age = dayjs().diff(dayjs(customer.dateOfBirth), 'year')
    form.setFieldsValue({
      phone: customer.phone,
      fullName: customer.fullName,
      gender: customer.gender,
      age: age,
      address: customer.address,
      treatment: customer.treatment,
      amount: customer.amount,
      notes: customer.notes ?? undefined,
    })
    setModalOpen(true)
  }

  const handleSubmitCustomer = async () => {
    try {
      const values = await form.validateFields()
      setIsSubmitting(true)
      // Tính ngày sinh từ tuổi (giả sử sinh nhật là ngày 1/1)
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
        setCustomers((prev) => prev.map((cust) => (cust.id === updated.id ? updated : cust)))
        message.success('Đã cập nhật thông tin khách hàng')
      } else {
        const created = await customerApi.create(payload)
        setCustomers((prev) => [created, ...prev])
        message.success('Đã thêm khách hàng mới')
      }

      handleCloseModal()
    } catch (error) {
      if (error instanceof Error) {
        message.error(error.message)
      }
    } finally {
      setIsSubmitting(false)
    }
  }

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
    } catch (error) {
      console.error(error)
      setPhoneOptions([])
    } finally {
      setSearchingPhones(false)
    }
  }

  const handlePhoneSelect = (_value: string, option: { value: string; label: string; customer: Customer }) => {
    if (editingCustomer) return

    const selectedCustomer = option.customer
    if (selectedCustomer) {
      const age = dayjs().diff(dayjs(selectedCustomer.dateOfBirth), 'year')
      form.setFieldsValue({
        phone: selectedCustomer.phone,
        fullName: selectedCustomer.fullName,
        gender: selectedCustomer.gender,
        age: age,
        address: selectedCustomer.address,
        notes: selectedCustomer.notes ?? undefined,
      })
      message.info('Đã nạp thông tin khách cũ, vui lòng nhập Thành tiền & Cách xử lý mới.')
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

    // Nếu đã có trong options thì tự động chọn
    const existingOption = phoneOptions.find(opt => opt.value === phone)
    if (existingOption) {
      handlePhoneSelect(phone, existingOption)
      setPhoneOptions([])
      return
    }

    // Nếu không có trong options, thử lookup exact match
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
        message.info('Đã nạp thông tin khách cũ, vui lòng nhập Thành tiền & Cách xử lý mới.')
      }
    } catch (error) {
      console.error(error)
    } finally {
      setPrefillLoading(false)
      setPhoneOptions([])
    }
  }

  const handleDeleteCustomer = async (customer: Customer) => {
    try {
      setDeletingId(customer.id)
      await customerApi.remove(customer.id)
      // Refresh lại danh sách từ API để đảm bảo dữ liệu đồng bộ
      await refresh()
      // Nếu đang ở tab đã xóa, refresh lại danh sách đã xóa
      if (activeTab === 'deleted') {
        await fetchDeletedCustomers()
      }
      message.success('Đã xóa khách hàng')
    } catch (error) {
      if (error instanceof Error) {
        message.error(error.message || 'Lỗi khi xóa khách hàng')
      } else {
        message.error('Lỗi khi xóa khách hàng')
      }
    } finally {
      setDeletingId(null)
    }
  }

  const handleResetFilters = () => {
    setSearchTerm('')
    setGenderFilter('all')
    setDobRange(null)
    setDateRange(null)
    setTempDateRange(null)
    setMinAmount(undefined)
    setMaxAmount(undefined)
  }

  const fetchDeletedCustomers = async () => {
    try {
      setDeletedLoading(true)
      const data = await customerApi.listDeleted()
      setDeletedCustomers(data)
    } catch (error) {
      if (error instanceof Error) {
        message.error(`Lỗi khi tải danh sách khách hàng đã xóa: ${error.message}`)
      } else {
        message.error('Lỗi khi tải danh sách khách hàng đã xóa')
      }
      setDeletedCustomers([])
    } finally {
      setDeletedLoading(false)
    }
  }

  const handleRestoreCustomer = async (customer: Customer) => {
    try {
      setRestoringId(customer.id)
      await customerApi.restore(customer.id)
      await fetchDeletedCustomers()
      await refresh()
      message.success('Đã khôi phục khách hàng')
    } catch (error) {
      if (error instanceof Error) {
        message.error(error.message || 'Lỗi khi khôi phục khách hàng')
      } else {
        message.error('Lỗi khi khôi phục khách hàng')
      }
    } finally {
      setRestoringId(null)
    }
  }

  // Load deleted customers khi chuyển sang tab đã xóa
  useEffect(() => {
    if (activeTab === 'deleted') {
      fetchDeletedCustomers()
    }
  }, [activeTab])

  const handleViewDetails = async (customer: Customer) => {
    setDetailOpen(true)
    setDetailLoading(true)
    setDetailData({ customer, visits: [] })
    try {
      const data = await customerApi.history(customer.id)
      setDetailData(data)
    } catch (error) {
      if (error instanceof Error) {
        message.error(error.message)
      }
      setDetailData(null)
    } finally {
      setDetailLoading(false)
    }
  }

  const handleExportExcel = () => {
    try {
      exportToExcel(filteredCustomers)
      message.success('Đã xuất file Excel thành công')
    } catch (error) {
      console.error(error)
      message.error('Lỗi khi xuất file Excel')
    }
  }

  const handleExportDetail = () => {
    if (!detailData) return

    try {
      const { customer, visits } = detailData

      // Chuẩn bị dữ liệu xuất
      const data: (string | number | undefined)[][] = [
        ['THÔNG TIN KHÁCH HÀNG'],
        ['Họ tên', customer.fullName],
        ['Số điện thoại', customer.phone],
        ['Giới tính', customer.gender ? 'Nam' : 'Nữ'],
        ['Ngày sinh', dayjs(customer.dateOfBirth).format('DD/MM/YYYY')],
        ['Tuổi', dayjs().diff(dayjs(customer.dateOfBirth), 'year')],
        ['Địa chỉ', customer.address],
        ['Ghi chú', customer.notes],
        [], // Dòng trống
        ['LỊCH SỬ KHÁM BỆNH'],
        ['Ngày giờ', 'Cách xử lý', 'Thành tiền'],
      ]

      // Thêm lịch sử khám
      let totalAmount = 0
      visits.forEach((visit) => {
        totalAmount += visit.amount
        data.push([
          dayjs(visit.createdAt).format('HH:mm DD/MM/YYYY'),
          visit.treatment,
          visit.amount
        ])
      })

      // Thêm dòng tổng tiền
      data.push(['', 'TỔNG CỘNG', totalAmount])

      // Tạo workbook và xuất file
      const wb = utils.book_new()
      const ws = utils.aoa_to_sheet(data)

      // Format độ rộng cột
      const wscols = [
        { wch: 20 }, // A
        { wch: 40 }, // B
        { wch: 15 }, // C
      ]
      ws['!cols'] = wscols

      utils.book_append_sheet(wb, ws, 'Chi tiết khách hàng')

      // Tên file: ChiTietKhachHang_[TenKhachHang].xlsx
      const fileName = `ChiTietKhachHang_${customer.fullName.replace(/\s+/g, '_')}.xlsx`
      writeFile(wb, fileName)

      message.success('Đã xuất file chi tiết thành công')
    } catch (error) {
      console.error(error)
      message.error('Lỗi khi xuất file chi tiết')
    }
  }

  const handleImportExcel: UploadProps['customRequest'] = async (options) => {
    const { file, onSuccess, onError } = options
    const fileObj = file as File

    if (!fileObj) {
      onError?.(new Error('Không có file'))
      return
    }

    try {
      setImporting(true)
      const customers = await importFromExcel(fileObj)

      if (customers.length === 0) {
        message.warning('Không tìm thấy dữ liệu khách hàng trong file Excel')
        onSuccess?.({})
        return
      }

      // Thêm từng khách hàng
      let successCount = 0
      let errorCount = 0

      for (const customerData of customers) {
        try {
          await customerApi.create(customerData)
          successCount++
        } catch (error) {
          console.error('Lỗi khi thêm khách hàng:', customerData, error)
          errorCount++
        }
      }

      // Refresh danh sách
      await refresh()

      if (successCount > 0) {
        message.success(`Đã nhập ${successCount} khách hàng thành công`)
      }
      if (errorCount > 0) {
        message.warning(`${errorCount} khách hàng không thể nhập do lỗi`)
      }

      onSuccess?.({})
    } catch (error) {
      console.error('Lỗi khi import Excel:', error)
      message.error('Lỗi khi đọc file Excel')
      onError?.(error as Error)
    } finally {
      setImporting(false)
    }
  }

  const uploadProps: UploadProps = {
    accept: '.xlsx,.xls',
    showUploadList: false,
    customRequest: handleImportExcel,
    beforeUpload: (file) => {
      const isExcel = file.type === 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' ||
        file.type === 'application/vnd.ms-excel' ||
        file.name.endsWith('.xlsx') ||
        file.name.endsWith('.xls')
      if (!isExcel) {
        message.error('Chỉ chấp nhận file Excel (.xlsx, .xls)')
        return false
      }
      return true
    },
  }

  const columns: ColumnsType<Customer> = [
    {
      title: 'Khách hàng',
      dataIndex: 'fullName',
      key: 'fullName',
      render: (_: string, record: Customer) => (
        <Space direction="vertical" size={0}>
          <Text strong>{record.fullName}</Text>
          <Text type="secondary">{record.phone}</Text>
        </Space>
      ),
    },
    {
      title: 'Giới tính',
      dataIndex: 'gender',
      key: 'gender',
      render: (value: Customer['gender']) => (value ? 'Nam' : 'Nữ'),
    },
    {
      title: 'Tuổi',
      dataIndex: 'age',
      key: 'age',
      render: (value: number | null | undefined, record: Customer) => {
        // Ưu tiên dùng age từ DB, nếu không có thì tính từ dateOfBirth
        if (value !== null && value !== undefined) {
          return `${value} tuổi`
        }
        const age = dayjs().diff(dayjs(record.dateOfBirth), 'year')
        return `${age} tuổi`
      },
      sorter: (a, b) => {
        // Ưu tiên dùng age từ DB
        const ageA = a.age ?? dayjs().diff(dayjs(a.dateOfBirth), 'year')
        const ageB = b.age ?? dayjs().diff(dayjs(b.dateOfBirth), 'year')
        return ageA - ageB
      },
    },
    {
      title: 'Địa chỉ',
      dataIndex: 'address',
      key: 'address',
    },
    {
      title: 'Cách xử lý',
      dataIndex: 'treatment',
      key: 'treatment',
    },
    {
      title: 'Thành tiền',
      dataIndex: 'amount',
      key: 'amount',
      render: (value?: number) =>
        (value ?? 0).toLocaleString('vi-VN', { style: 'currency', currency: 'VND' }),
    },
    {
      title: 'Cập nhật',
      dataIndex: 'updatedAt',
      key: 'updatedAt',
      render: (value?: string) => (value ? dayjs(value).format('HH:mm DD/MM/YYYY') : '—'),
    },
    {
      title: 'Thao tác',
      key: 'actions',
      render: (_: unknown, record: Customer) => (
        <Space>
          <Button type="link" onClick={() => handleViewDetails(record)}>
            Chi tiết
          </Button>
          <Button type="link" onClick={() => handleEditCustomer(record)}>
            Sửa
          </Button>
          <Popconfirm
            title="Xóa khách hàng?"
            description="Khách hàng sẽ được ẩn khỏi danh sách."
            okText="Xóa"
            cancelText="Hủy"
            onConfirm={() => handleDeleteCustomer(record)}
            okButtonProps={{ loading: deletingId === record.id }}
          >
            <Button type="link" danger loading={deletingId === record.id}>
              Xóa
            </Button>
          </Popconfirm>
        </Space>
      ),
    },
  ]

  return (
    <>
      <Card className="filters-card" style={{ marginBottom: 24 }}>
        <Flex gap="large" wrap align="flex-end">
          <Space direction="vertical" size={4}>
            <Text type="secondary">Từ khóa</Text>
            <Space.Compact style={{ width: 320 }}>
              <Input
                allowClear
                placeholder="Tên, số điện thoại, địa chỉ hoặc cách xử lý"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
              <Button onClick={() => setSearchTerm('')}>Xóa</Button>
            </Space.Compact>
          </Space>
          <Space direction="vertical" size={4}>
            <Text type="secondary">Giới tính</Text>
            <Select<'all' | 'male' | 'female'>
              value={genderFilter}
              style={{ width: 200 }}
              onChange={(value) => setGenderFilter(value)}
              options={[
                { value: 'all', label: 'Tất cả' },
                { value: 'male', label: 'Nam' },
                { value: 'female', label: 'Nữ' },
              ]}
            />
          </Space>
          <Space direction="vertical" size={4}>
            <Text type="secondary">Ngày sinh</Text>
            <RangePicker
              allowClear
              placeholder={['Từ ngày', 'Đến ngày']}
              value={dobRange ?? undefined}
              format="DD/MM/YYYY"
              presets={dobPresets}
              onChange={(values) =>
                values && values[0] && values[1]
                  ? setDobRange([values[0], values[1]])
                  : setDobRange(null)
              }
            />
          </Space>
          <Space direction="vertical" size={4}>
            <Text type="secondary">Ngày tạo/cập nhật</Text>
            <Space.Compact>
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
            </Space.Compact>
          </Space>
          <Space direction="vertical" size={4}>
            <Text type="secondary">Thành tiền (VNĐ)</Text>
            <Space>
              <InputNumber
                placeholder="Tối thiểu"
                min={0}
                value={minAmount}
                formatter={(value) => formatCurrencyInput(value ?? '')}
                parser={(value) => parseCurrencyInput(value)}
                onChange={(value) => setMinAmount(value ?? undefined)}
              />
              <InputNumber
                placeholder="Tối đa"
                min={0}
                value={maxAmount}
                formatter={(value) => formatCurrencyInput(value ?? '')}
                parser={(value) => parseCurrencyInput(value)}
                onChange={(value) => setMaxAmount(value ?? undefined)}
              />
            </Space>
          </Space>
          <Space direction="vertical" size={4}>
            <Text type="secondary">&nbsp;</Text>
            <Button onClick={handleResetFilters}>Đặt lại lọc</Button>
          </Space>
          <Flex gap="small" wrap>
            <Button type="primary" icon={<PlusOutlined />} onClick={openCreateModal}>
              Thêm khách hàng
            </Button>
            <Button icon={<DownloadOutlined />} onClick={handleExportExcel}>
              Xuất Excel
            </Button>
            <Upload {...uploadProps}>
              <Button icon={<UploadOutlined />} loading={importing}>
                Nhập Excel
              </Button>
            </Upload>
            <Button icon={<TeamOutlined />} onClick={refresh}>
              Tải lại
            </Button>
          </Flex>
        </Flex>
      </Card>

      <Card>
        <Tabs
          activeKey={activeTab}
          onChange={setActiveTab}
          items={[
            {
              key: 'active',
              label: 'Danh sách khách hàng',
              children: (
                <Table<Customer>
                  className={styles.customTable}
                  dataSource={filteredCustomers}
                  columns={columns}
                  rowKey="id"
                  loading={loading}
                  scroll={{ x: 'max-content', y: 400 }}
                  pagination={{
                    pageSize: pageSize,
                    showSizeChanger: true,
                    showTotal: (total, range) => `${range[0]}-${range[1]} của ${total} khách hàng`,
                    pageSizeOptions: ['10', '20', '50', '100'],
                    total: filteredCustomers.length,
                    onShowSizeChange: (_current, size) => {
                      setPageSize(size)
                    },
                  }}
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
                    ...columns.slice(0, -1), // Tất cả columns trừ cột "Thao tác"
                    {
                      title: 'Thao tác',
                      key: 'actions',
                      render: (_: unknown, record: Customer) => (
                        <Space>
                          <Button type="link" onClick={() => handleViewDetails(record)}>
                            Chi tiết
                          </Button>
                          <Popconfirm
                            title="Khôi phục khách hàng?"
                            description="Khách hàng sẽ được hiển thị lại trong danh sách."
                            okText="Khôi phục"
                            cancelText="Hủy"
                            onConfirm={() => handleRestoreCustomer(record)}
                            okButtonProps={{ loading: restoringId === record.id }}
                          >
                            <Button type="link" loading={restoringId === record.id}>
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
                      setPageSize(size)
                    },
                  }}
                  locale={{ emptyText: 'Không có khách hàng đã xóa' }}
                />
              ),
            },
          ]}
        />
      </Card>

      <Modal
        centered
        title={isEditing ? 'Cập nhật khách hàng' : 'Thêm khách hàng mới'}
        open={modalOpen}
        onCancel={handleCloseModal}
        footer={
          <Space>
            <Button onClick={handleCloseModal}>Hủy</Button>
            <Button type="primary" onClick={handleSubmitCustomer} loading={isSubmitting}>
              Lưu
            </Button>
          </Space>
        }
      >
        <Form layout="vertical" form={form}>
          <Form.Item label="Số điện thoại" name="phone" rules={[{ required: true }]}>
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
              />
            </AutoComplete>
          </Form.Item>
          <Form.Item label="Họ tên" name="fullName" rules={[{ required: true }]}>
            <Input placeholder="VD: Nguyễn Thị Mai" />
          </Form.Item>
          <Form.Item
            label="Giới tính"
            name="gender"
            rules={[{ required: true }]}
            initialValue={true}
          >
            <Radio.Group>
              <Radio value={true}>Nam</Radio>
              <Radio value={false}>Nữ</Radio>
            </Radio.Group>
          </Form.Item>
          <Form.Item
            label="Tuổi"
            name="age"
            rules={[{ required: true, message: 'Vui lòng nhập tuổi' }]}
            initialValue={25}
          >
            <InputNumber
              min={0}
              max={150}
              style={{ width: '100%' }}
              placeholder="Nhập tuổi"
            />
          </Form.Item>
          <Form.Item label="Địa chỉ" name="address" rules={[{ required: true }]}>
            <Input />
          </Form.Item>

          <Form.Item label="Cách xử lý" name="treatment" rules={[{ required: true }]}>
            <Input.TextArea rows={2} placeholder="Mô tả phác đồ điều trị" />
          </Form.Item>
          <Form.Item label="Thành tiền" name="amount" initialValue={0}>
            <InputNumber<number>
              style={{ width: '100%' }}
              min={0}
              precision={0}
              formatter={(value) => formatCurrencyInput(value ?? '')}
              parser={(value) => parseCurrencyInput(value) ?? 0}
            />
          </Form.Item>
          <Form.Item label="Ghi chú" name="notes">
            <Input.TextArea rows={3} />
          </Form.Item>
        </Form>
      </Modal>

      <Modal
        centered
        open={detailOpen}
        onCancel={() => {
          setDetailOpen(false)
          setDetailData(null)
        }}
        footer={
          <div style={{ display: 'flex', justifyContent: 'space-between' }}>
            <Button
              icon={<DownloadOutlined />}
              onClick={handleExportDetail}
              disabled={!detailData}
            >
              Xuất file
            </Button>
            <Button onClick={() => {
              setDetailOpen(false)
              setDetailData(null)
            }}>
              Đóng
            </Button>
          </div>
        }
        title="Chi tiết khách hàng"
        width={800}
      >
        <Skeleton active loading={detailLoading}>
          {detailData && (
            <>
              <Descriptions column={2} size="small" bordered style={{ marginBottom: 24 }}>
                <Descriptions.Item label="Họ tên" span={2}>
                  <Text strong>{detailData.customer.fullName}</Text>
                </Descriptions.Item>
                <Descriptions.Item label="Số điện thoại">
                  {detailData.customer.phone}
                </Descriptions.Item>
                <Descriptions.Item label="Giới tính">
                  {detailData.customer.gender ? 'Nam' : 'Nữ'}
                </Descriptions.Item>
                <Descriptions.Item label="Ngày sinh">
                  {dayjs(detailData.customer.dateOfBirth).format('DD/MM/YYYY')}
                </Descriptions.Item>
                <Descriptions.Item label="Tuổi">
                  {dayjs().diff(dayjs(detailData.customer.dateOfBirth), 'year')} tuổi
                </Descriptions.Item>
                <Descriptions.Item label="Địa chỉ" span={2}>
                  {detailData.customer.address}
                </Descriptions.Item>
                <Descriptions.Item label="Ghi chú" span={2}>
                  {detailData.customer.notes || 'Không có'}
                </Descriptions.Item>
                <Descriptions.Item label="Ngày tạo">
                  {detailData.customer.createdAt
                    ? dayjs(detailData.customer.createdAt).format('HH:mm DD/MM/YYYY')
                    : '—'}
                </Descriptions.Item>
                <Descriptions.Item label="Cập nhật lần cuối">
                  {detailData.customer.updatedAt
                    ? dayjs(detailData.customer.updatedAt).format('HH:mm DD/MM/YYYY')
                    : '—'}
                </Descriptions.Item>
              </Descriptions>

              <Divider orientation="left">
                Lịch sử đến khám ({detailData.visits.length} lần)
              </Divider>

              {detailData.visits.length > 0 && (
                <div style={{ marginBottom: 16 }}>
                  <Text strong>
                    Tổng chi tiêu:{' '}
                    {detailData.visits
                      .reduce((sum, v) => sum + v.amount, 0)
                      .toLocaleString('vi-VN', {
                        style: 'currency',
                        currency: 'VND',
                      })}
                  </Text>
                </div>
              )}

              <Table
                dataSource={detailData.visits}
                columns={[
                  {
                    title: 'Ngày giờ',
                    dataIndex: 'createdAt',
                    key: 'createdAt',
                    width: 180,
                    render: (value: string) => dayjs(value).format('HH:mm DD/MM/YYYY'),
                    sorter: (a, b) => dayjs(a.createdAt).valueOf() - dayjs(b.createdAt).valueOf(),
                    defaultSortOrder: 'descend',
                  },
                  {
                    title: 'Cách xử lý',
                    dataIndex: 'treatment',
                    key: 'treatment',
                    ellipsis: true,
                  },
                  {
                    title: 'Thành tiền',
                    dataIndex: 'amount',
                    key: 'amount',
                    width: 150,
                    align: 'right',
                    render: (value: number) =>
                      value.toLocaleString('vi-VN', {
                        style: 'currency',
                        currency: 'VND',
                      }),
                  },
                ]}
                rowKey={(record, index) => `${record.createdAt}-${index}`}
                pagination={{
                  pageSize: 5,
                  showSizeChanger: false,
                  showTotal: (total) => `Tổng ${total} lần`,
                }}
                locale={{ emptyText: 'Chưa có lịch sử đến khám' }}
                size="small"
              />
            </>
          )}
        </Skeleton>
      </Modal>
    </>
  )
}

