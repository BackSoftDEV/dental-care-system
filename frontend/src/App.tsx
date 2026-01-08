import { ConfigProvider, Layout, Typography, theme } from 'antd'
import viVN from 'antd/locale/vi_VN'
import { Navigate, Route, Routes } from 'react-router-dom'
import HomePage from './GiaoDien/Home/Home'
import CustomersPage from './GiaoDien/Customer/Customers'
import Navigation, { useNavigation } from './GiaoDien/BackGroud/navigation'
import './App.css'

const { Header, Content } = Layout
const { Title, Text } = Typography

function App() {
  const {
    token: { colorBgContainer },
  } = theme.useToken()

  const { pageTitle } = useNavigation()

  return (
    <ConfigProvider locale={viVN}>
      <Layout className="app-shell">
        <Navigation />
        <Layout>
          <Header style={{ background: colorBgContainer }} className="app-header">
            <div className="header-left">
              <Title level={3} style={{ margin: 0 }}>
                {pageTitle}
              </Title>
              <Text type="secondary">Theo dõi tình trạng điều trị theo thời gian thực</Text>
            </div>
          </Header>
          <Content className="app-content">
            <Routes>
              <Route path="/" element={<HomePage />} />
              <Route path="/customers" element={<CustomersPage />} />
              <Route path="*" element={<Navigate to="/" replace />} />
            </Routes>
          </Content>
        </Layout>
      </Layout>
    </ConfigProvider>
  )
}

export default App
