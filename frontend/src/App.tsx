import {
  Avatar,
  Badge,
  ConfigProvider,
  Dropdown,
  Layout,
  Space,
  Spin,
  Tag,
  Typography,
  message,
  type MenuProps,
} from 'antd'
import viVN from 'antd/locale/vi_VN'
import { Navigate, Route, Routes, useNavigate } from 'react-router-dom'
import {
  BellOutlined,
  LogoutOutlined,
  SafetyCertificateOutlined,
  UserOutlined,
} from '@ant-design/icons'
import dayjs from 'dayjs'
import HomePage from './GiaoDien/Home/Home'
import CustomersPage from './GiaoDien/Customer/Customers'
import ServicesPage from './GiaoDien/Service/Services'
import LoginPage from './GiaoDien/Auth/Login'
import Navigation, { useNavigation } from './GiaoDien/BackGroud/navigation'
import { AuthProvider, useAuth } from './context/AuthContext'
import './App.css'

const { Header, Content } = Layout
const { Title, Text } = Typography

function ProtectedLayout() {
  const { pageTitle } = useNavigation()
  const { user, logout } = useAuth()
  const navigate = useNavigate()

  const handleLogout = () => {
    logout()
    message.info('Đã đăng xuất khỏi hệ thống an toàn.')
    navigate('/login', { replace: true })
  }

  const profileMenuItems: MenuProps['items'] = [
    {
      key: 'user-info',
      disabled: true,
      label: (
        <div style={{ padding: '4px 0' }}>
          <Text strong style={{ color: '#0f172a', display: 'block' }}>
            {user?.fullName || 'Bác sĩ Quản trị'}
          </Text>
          <Text type="secondary" style={{ fontSize: 12 }}>
            Tài khoản: @{user?.username || 'admin'} ({user?.role === 'admin' ? 'Quản trị viên' : 'Nhân viên'})
          </Text>
        </div>
      ),
    },
    { type: 'divider' },
    {
      key: 'logout',
      danger: true,
      icon: <LogoutOutlined />,
      label: 'Đăng xuất',
      onClick: handleLogout,
    },
  ]

  return (
    <Layout className="app-shell">
      <Navigation />
      <Layout>
        <Header className="app-header">
          <div className="header-left">
            <Space align="center" size={10} style={{ lineHeight: 1 }}>
              <Title level={4} style={{ margin: 0, fontWeight: 700, color: '#0f172a', lineHeight: 1.2 }}>
                {pageTitle}
              </Title>
              <Tag color="cyan" style={{ borderRadius: 12, border: 'none', padding: '2px 10px', fontWeight: 500, margin: 0 }}>
                Phòng khám hoạt động
              </Tag>
            </Space>
            <Text type="secondary" style={{ fontSize: 13, marginTop: 4, lineHeight: 1.4, display: 'block' }}>
              Hệ thống quản lý khách hàng & lịch trình điều trị nha khoa
            </Text>
          </div>
          <div className="header-right">
            <Tag
              style={{
                background: '#f8fafc',
                color: '#475569',
                border: '1px solid #e2e8f0',
                padding: '4px 12px',
                borderRadius: 8,
                fontSize: 12,
                fontWeight: 600,
                margin: 0,
              }}
            >
              {dayjs().format('dddd, DD/MM/YYYY')}
            </Tag>
            <Badge count={0} dot>
              <div
                style={{
                  width: 36,
                  height: 36,
                  borderRadius: '50%',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  background: '#f1f5f9',
                  color: '#64748b',
                  cursor: 'pointer',
                }}
              >
                <BellOutlined style={{ fontSize: 16 }} />
              </div>
            </Badge>
            <Dropdown menu={{ items: profileMenuItems }} placement="bottomRight" trigger={['click']}>
              <Space
                style={{
                  cursor: 'pointer',
                  padding: '4px 10px',
                  borderRadius: 8,
                  background: '#f8fafc',
                  border: '1px solid #e2e8f0',
                  transition: 'all 0.2s',
                }}
              >
                <Avatar
                  size="small"
                  style={{ backgroundColor: '#0284c7', fontWeight: 600 }}
                  icon={<UserOutlined />}
                >
                  {user?.fullName ? user.fullName.charAt(0).toUpperCase() : 'A'}
                </Avatar>
                <div style={{ display: 'flex', flexDirection: 'column', lineHeight: 1.2 }}>
                  <Text strong style={{ fontSize: 13 }}>
                    {user?.fullName || 'Nha Khoa SmileCare'}
                  </Text>
                  <Text type="secondary" style={{ fontSize: 11 }}>
                    {user?.role === 'admin' ? 'Quản trị viên' : 'Nhân viên'}
                  </Text>
                </div>
              </Space>
            </Dropdown>
          </div>
        </Header>
        <Content className="app-content">
          <Routes>
            <Route path="/" element={<HomePage />} />
            <Route path="/customers" element={<CustomersPage />} />
            <Route path="/services" element={<ServicesPage />} />
            <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>
        </Content>
      </Layout>
    </Layout>
  )
}

function RequireAuth({ children }: { children: React.ReactElement }) {
  const { isAuthenticated, loading } = useAuth()

  if (loading) {
    return (
      <div
        style={{
          display: 'flex',
          height: '100vh',
          alignItems: 'center',
          justifyContent: 'center',
          background: '#f8fafc',
        }}
      >
        <Spin size="large" tip="Đang kiểm tra bảo mật..." />
      </div>
    )
  }

  if (!isAuthenticated) {
    return <Navigate to="/login" replace />
  }

  return children
}

function RequireGuest({ children }: { children: React.ReactElement }) {
  const { isAuthenticated, loading } = useAuth()

  if (loading) {
    return (
      <div
        style={{
          display: 'flex',
          height: '100vh',
          alignItems: 'center',
          justifyContent: 'center',
          background: '#f8fafc',
        }}
      >
        <Spin size="large" tip="Đang tải..." />
      </div>
    )
  }

  if (isAuthenticated) {
    return <Navigate to="/" replace />
  }

  return children
}

function App() {
  return (
    <ConfigProvider
      locale={viVN}
      theme={{
        token: {
          colorPrimary: '#0284c7',
          colorInfo: '#0284c7',
          colorSuccess: '#10b981',
          colorWarning: '#f59e0b',
          colorError: '#ef4444',
          borderRadius: 8,
          fontFamily: "'Plus Jakarta Sans', system-ui, -apple-system, sans-serif",
          colorBgBase: '#ffffff',
          colorTextBase: '#0f172a',
          colorTextSecondary: '#64748b',
          colorBorder: '#e2e8f0',
        },
        components: {
          Card: {
            headerHeight: 48,
          },
          Table: {
            headerBg: '#f8fafc',
            headerColor: '#475569',
            rowHoverBg: '#f1f5f9',
          },
        },
      }}
    >
      <AuthProvider>
        <Routes>
          <Route
            path="/login"
            element={
              <RequireGuest>
                <LoginPage />
              </RequireGuest>
            }
          />
          <Route
            path="/*"
            element={
              <RequireAuth>
                <ProtectedLayout />
              </RequireAuth>
            }
          />
        </Routes>
      </AuthProvider>
    </ConfigProvider>
  )
}

export default App
