import { HomeOutlined, TeamOutlined } from '@ant-design/icons'
import { Layout, Menu, Typography } from 'antd'
import { useMemo } from 'react'
import { useLocation, useNavigate } from 'react-router-dom'

const { Sider } = Layout
const { Text } = Typography

const menuItems = [
  { key: 'home', icon: <HomeOutlined />, label: 'Trang chủ', path: '/' },
  { key: 'customers', icon: <TeamOutlined />, label: 'Khách hàng', path: '/customers' },
]

export function useNavigation() {
  const location = useLocation()
  const navigate = useNavigate()

  const selectedKey = useMemo(() => {
    // Tìm tất cả các items mà path hiện tại bắt đầu bằng path của item đó
    const matchingItems = menuItems.filter((item) => location.pathname.startsWith(item.path))
    // Sắp xếp theo độ dài path giảm dần để lấy cái cụ thể nhất (ví dụ: '/customers' dài hơn '/')
    const current = matchingItems.sort((a, b) => b.path.length - a.path.length)[0]
    return current?.key ?? 'home'
  }, [location.pathname])

  const pageTitle = useMemo(() => {
    switch (selectedKey) {
      case 'customers':
        return 'Khách hàng'
      case 'home':
      default:
        return 'Trang chủ'
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
    <Sider breakpoint="lg" collapsedWidth="0" style={{ height: '100vh' }}>
      <div style={{
        display: 'flex',
        alignItems: 'center',
        gap: 16,
        padding: '24px 20px',
        marginBottom: 8,
      }}>
        <div style={{
          width: 40,
          height: 40,
          background: 'linear-gradient(135deg, #1890ff 0%, #001529 100%)',
          borderRadius: 12,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          boxShadow: '0 4px 12px rgba(24, 144, 255, 0.3)'
        }}>
          <img src="/vite.svg" alt="CRM" style={{ width: 24, height: 24 }} />
        </div>
        <div style={{ display: 'flex', flexDirection: 'column' }}>
          <Text strong style={{
            fontSize: 18,
            color: '#fff',
            letterSpacing: '0.5px'
          }}>
            SmileCare
          </Text>
          <Text style={{
            fontSize: 12,
            color: 'rgba(255,255,255,0.45)',
            textTransform: 'uppercase',
            letterSpacing: '1px'
          }}>
            Dental CRM
          </Text>
        </div>
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
        // Custom styles cho selected item
        className="custom-menu"
      />
    </Sider>
  )
}
