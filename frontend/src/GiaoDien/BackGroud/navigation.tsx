import {
  CustomerServiceOutlined,
  HomeOutlined,
  MedicineBoxOutlined,
  TeamOutlined,
} from '@ant-design/icons'
import { Layout, Menu, Typography } from 'antd'
import { useMemo } from 'react'
import { useLocation, useNavigate } from 'react-router-dom'

const { Sider } = Layout
const { Text } = Typography

const menuItems = [
  { key: 'home', icon: <HomeOutlined />, label: 'Trang chủ & Thống kê', path: '/' },
  { key: 'customers', icon: <TeamOutlined />, label: 'Quản lý Khách hàng', path: '/customers' },
  { key: 'services', icon: <MedicineBoxOutlined />, label: 'Quản lý Dịch vụ', path: '/services' },
]

export function useNavigation() {
  const location = useLocation()
  const navigate = useNavigate()

  const selectedKey = useMemo(() => {
    const matchingItems = menuItems.filter((item) => location.pathname.startsWith(item.path))
    const current = matchingItems.sort((a, b) => b.path.length - a.path.length)[0]
    return current?.key ?? 'home'
  }, [location.pathname])

  const pageTitle = useMemo(() => {
    switch (selectedKey) {
      case 'customers':
        return 'Quản lý khách hàng'
      case 'services':
        return 'Quản lý Dịch vụ & Bảng giá'
      case 'home':
      default:
        return 'Bảng điều khiển'
    }
  }, [selectedKey])

  return {
    selectedKey,
    pageTitle,
    navigate,
    menuItems,
  }
}

export default function Navigation() {
  const { selectedKey, navigate, menuItems } = useNavigation()

  return (
    <Sider
      breakpoint="lg"
      collapsedWidth="0"
      width={250}
      style={{
        height: '100vh',
        position: 'sticky',
        top: 0,
        left: 0,
        backgroundColor: '#0f172a',
        borderRight: '1px solid rgba(255, 255, 255, 0.06)',
        display: 'flex',
        flexDirection: 'column',
      }}
    >
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: 12,
          padding: '24px 20px 20px',
        }}
      >
        <img
          src="/dental-logo.svg"
          alt="SmileCare"
          style={{ width: 40, height: 40, borderRadius: 10 }}
        />
        <div style={{ display: 'flex', flexDirection: 'column' }}>
          <Text
            strong
            style={{
              fontSize: 17,
              color: '#ffffff',
              fontWeight: 700,
              letterSpacing: '0.3px',
              lineHeight: 1.2,
            }}
          >
            SmileCare
          </Text>
          <Text
            style={{
              fontSize: 11,
              color: '#38bdf8',
              fontWeight: 600,
              letterSpacing: '0.8px',
              textTransform: 'uppercase',
              marginTop: 2,
            }}
          >
            Dental System
          </Text>
        </div>
      </div>

      <div style={{ padding: '0 16px 12px' }}>
        <div style={{ height: 1, backgroundColor: 'rgba(255, 255, 255, 0.08)' }} />
      </div>

      <Menu
        theme="dark"
        mode="inline"
        selectedKeys={[selectedKey]}
        items={menuItems}
        onClick={({ key }) => {
          const item = menuItems.find((menuItem) => menuItem.key === key)
          if (item?.path) navigate(item.path)
        }}
        style={{
          borderRight: 0,
        }}
        className="custom-menu"
      />

      <div
        style={{
          marginTop: 'auto',
          padding: '20px 16px',
        }}
      >
        <div
          style={{
            background: 'linear-gradient(135deg, rgba(30, 41, 59, 0.95) 0%, rgba(15, 23, 42, 0.95) 100%)',
            borderRadius: 12,
            padding: '14px 16px',
            border: '1px solid rgba(56, 189, 248, 0.25)',
            boxShadow: '0 4px 12px rgba(0, 0, 0, 0.25)',
            display: 'flex',
            alignItems: 'center',
            gap: 12,
          }}
        >
          <div
            style={{
              width: 36,
              height: 36,
              borderRadius: 10,
              background: 'rgba(14, 165, 233, 0.2)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: '#38bdf8',
              fontSize: 18,
              flexShrink: 0,
            }}
          >
            <CustomerServiceOutlined />
          </div>
          <div style={{ display: 'flex', flexDirection: 'column' }}>
            <Text style={{ color: '#ffffff', fontSize: 13, fontWeight: 700, letterSpacing: '0.2px' }}>
              Hỗ trợ kỹ thuật
            </Text>
            <Text style={{ color: '#38bdf8', fontSize: 12, fontWeight: 600, letterSpacing: '0.4px', marginTop: 1 }}>
              Hotline: 1900 6868
            </Text>
          </div>
        </div>
      </div>
    </Sider>
  )
}

