import { DownloadOutlined } from '@ant-design/icons'
import {
  Button,
  Descriptions,
  Divider,
  Modal,
  Skeleton,
  Space,
  Table,
  Tag,
  Typography,
} from 'antd'
import dayjs from 'dayjs'
import type { CustomerDetailData } from '../types'

const { Text } = Typography

interface CustomerDetailModalProps {
  open: boolean
  onClose: () => void
  detailData: CustomerDetailData | null
  detailLoading: boolean
  onExportDetail: () => void
}

export default function CustomerDetailModal({
  open,
  onClose,
  detailData,
  detailLoading,
  onExportDetail,
}: CustomerDetailModalProps) {
  return (
    <Modal
      centered
      open={open}
      onCancel={onClose}
      footer={
        <div style={{ display: 'flex', justifyContent: 'space-between' }}>
          <Button
            icon={<DownloadOutlined />}
            onClick={onExportDetail}
            disabled={!detailData}
          >
            Xuất file
          </Button>
          <Button onClick={onClose}>Đóng</Button>
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
                  render: (val?: string) => {
                    if (!val) return '—'
                    const services = val
                      .split(',')
                      .map((s) => s.trim())
                      .filter(Boolean)
                    return (
                      <Space size={[4, 6]} wrap style={{ padding: '2px 0' }}>
                        {services.map((service, idx) => (
                          <Tag
                            key={idx}
                            color="cyan"
                            style={{
                              borderRadius: 4,
                              margin: 0,
                              fontSize: 12,
                              fontWeight: 500,
                            }}
                          >
                            {service}
                          </Tag>
                        ))}
                      </Space>
                    )
                  },
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
  )
}
