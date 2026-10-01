import { message, type UploadProps } from 'antd'
import dayjs, { Dayjs } from 'dayjs'
import 'dayjs/locale/vi'
import isSameOrAfter from 'dayjs/plugin/isSameOrAfter'
import isSameOrBefore from 'dayjs/plugin/isSameOrBefore'
import { useEffect, useMemo, useState } from 'react'
import { utils, writeFile } from 'xlsx'
import { useCustomers } from '../../hooks/useCustomers'
import { customerApi } from '../../services/customerApi'
import type { Customer } from '../../types/customer'
import { exportToExcel, importFromExcel } from '../../utils/excelUtils'
import CustomerDetailModal from './components/CustomerDetailModal'
import CustomerFilterBar from './components/CustomerFilterBar'
import CustomerFormModal from './components/CustomerFormModal'
import CustomerTable from './components/CustomerTable'
import { groupCustomersByPatient, type CustomerDetailData } from './types'

dayjs.extend(isSameOrAfter)
dayjs.extend(isSameOrBefore)
dayjs.locale('vi')

export default function CustomersPage() {
  const { customers, loading, refresh, setCustomers } = useCustomers()
  const [searchTerm, setSearchTerm] = useState('')
  const [modalOpen, setModalOpen] = useState(false)
  const [editingCustomer, setEditingCustomer] = useState<Customer | null>(null)

  // Filters
  const [genderFilter, setGenderFilter] = useState<'all' | 'male' | 'female'>('all')
  const [dobRange, setDobRange] = useState<[Dayjs, Dayjs] | null>(null)
  const [dateRange, setDateRange] = useState<[Dayjs, Dayjs] | null>(null)
  const [minAmount, setMinAmount] = useState<number | undefined>()
  const [maxAmount, setMaxAmount] = useState<number | undefined>()

  // Detail Modal
  const [detailOpen, setDetailOpen] = useState(false)
  const [detailLoading, setDetailLoading] = useState(false)
  const [detailData, setDetailData] = useState<CustomerDetailData | null>(null)

  // Table & Tabs
  const [pageSize, setPageSize] = useState(10)
  const [activeTab, setActiveTab] = useState('active')
  const [deletedCustomers, setDeletedCustomers] = useState<Customer[]>([])
  const [deletedLoading, setDeletedLoading] = useState(false)
  const [deletingId, setDeletingId] = useState<number | null>(null)
  const [restoringId, setRestoringId] = useState<number | null>(null)
  const [importing, setImporting] = useState(false)
  const groupedCustomers = useMemo(() => {
    return groupCustomersByPatient(customers)
  }, [customers])

  const groupedDeletedCustomers = useMemo(() => {
    return groupCustomersByPatient(deletedCustomers)
  }, [deletedCustomers])

  const filteredCustomers = useMemo(() => {
    const lower = searchTerm.toLowerCase()
    return groupedCustomers.filter((customer) => {
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
  }, [groupedCustomers, searchTerm, genderFilter, dobRange, dateRange, minAmount, maxAmount])

  const openCreateModal = () => {
    setEditingCustomer(null)
    setModalOpen(true)
  }

  const handleEditCustomer = (customer: Customer) => {
    setEditingCustomer(customer)
    setModalOpen(true)
  }

  const handleFormSuccess = (customer: Customer, isEdit: boolean) => {
    if (isEdit) {
      setCustomers((prev) => prev.map((cust) => (cust.id === customer.id ? customer : cust)))
    } else {
      setCustomers((prev) => [customer, ...prev])
    }
    refresh()
  }

  const handleDeleteCustomer = async (customer: Customer) => {
    try {
      setDeletingId(customer.id)
      await customerApi.remove(customer.id)
      await refresh()
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

  useEffect(() => {
    if (activeTab === 'deleted') {
      fetchDeletedCustomers()
    }
  }, [activeTab])

  const handleResetFilters = () => {
    setSearchTerm('')
    setGenderFilter('all')
    setDobRange(null)
    setDateRange(null)
    setMinAmount(undefined)
    setMaxAmount(undefined)
  }

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

      const data: (string | number | undefined)[][] = [
        ['THÔNG TIN KHÁCH HÀNG'],
        ['Họ tên', customer.fullName],
        ['Số điện thoại', customer.phone],
        ['Giới tính', customer.gender ? 'Nam' : 'Nữ'],
        ['Ngày sinh', dayjs(customer.dateOfBirth).format('DD/MM/YYYY')],
        ['Tuổi', dayjs().diff(dayjs(customer.dateOfBirth), 'year')],
        ['Địa chỉ', customer.address],
        ['Ghi chú', customer.notes],
        [],
        ['LỊCH SỬ KHÁM BỆNH'],
        ['Ngày giờ', 'Cách xử lý', 'Thành tiền'],
      ]

      let totalAmount = 0
      visits.forEach((visit) => {
        totalAmount += visit.amount
        data.push([
          dayjs(visit.createdAt).format('HH:mm DD/MM/YYYY'),
          visit.treatment,
          visit.amount,
        ])
      })

      data.push(['', 'TỔNG CỘNG', totalAmount])

      const wb = utils.book_new()
      const ws = utils.aoa_to_sheet(data)
      ws['!cols'] = [{ wch: 20 }, { wch: 40 }, { wch: 15 }]

      utils.book_append_sheet(wb, ws, 'Chi tiết khách hàng')

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
      const importedCustomers = await importFromExcel(fileObj)

      if (importedCustomers.length === 0) {
        message.warning('Không tìm thấy dữ liệu khách hàng trong file Excel')
        onSuccess?.({})
        return
      }

      let successCount = 0
      let errorCount = 0

      for (const customerData of importedCustomers) {
        try {
          await customerApi.create(customerData)
          successCount++
        } catch (error) {
          console.error('Lỗi khi thêm khách hàng:', customerData, error)
          errorCount++
        }
      }

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
      const isExcel =
        file.type === 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' ||
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

  return (
    <>
      <CustomerFilterBar
        searchTerm={searchTerm}
        onSearchChange={setSearchTerm}
        genderFilter={genderFilter}
        onGenderFilterChange={setGenderFilter}
        dobRange={dobRange}
        onDobRangeChange={setDobRange}
        dateRange={dateRange}
        onDateRangeChange={setDateRange}
        minAmount={minAmount}
        onMinAmountChange={setMinAmount}
        maxAmount={maxAmount}
        onMaxAmountChange={setMaxAmount}
        onResetFilters={handleResetFilters}
        onOpenCreateModal={openCreateModal}
        onExportExcel={handleExportExcel}
        uploadProps={uploadProps}
        importing={importing}
        onRefresh={refresh}
      />

      <CustomerTable
        activeTab={activeTab}
        onTabChange={setActiveTab}
        customers={filteredCustomers}
        loading={loading}
        deletedCustomers={groupedDeletedCustomers}
        deletedLoading={deletedLoading}
        onViewDetails={handleViewDetails}
        onEditCustomer={handleEditCustomer}
        onDeleteCustomer={handleDeleteCustomer}
        deletingId={deletingId}
        onRestoreCustomer={handleRestoreCustomer}
        restoringId={restoringId}
        pageSize={pageSize}
        onPageSizeChange={setPageSize}
      />

      <CustomerFormModal
        open={modalOpen}
        onClose={() => {
          setModalOpen(false)
          setEditingCustomer(null)
        }}
        editingCustomer={editingCustomer}
        onSuccess={handleFormSuccess}
      />

      <CustomerDetailModal
        open={detailOpen}
        onClose={() => {
          setDetailOpen(false)
          setDetailData(null)
        }}
        detailData={detailData}
        detailLoading={detailLoading}
        onExportDetail={handleExportDetail}
      />
    </>
  )
}
