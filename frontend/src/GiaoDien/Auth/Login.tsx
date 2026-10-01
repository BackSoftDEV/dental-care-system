import { useState } from 'react'
import { Alert, Button, Card, Form, Input, Typography, message } from 'antd'
import { LockOutlined, UserOutlined } from '@ant-design/icons'
import { useNavigate } from 'react-router-dom'
import { authApi } from '../../services/authApi'
import { useAuth } from '../../context/AuthContext'

const { Title, Text } = Typography

export default function LoginPage() {
  const [form] = Form.useForm()
  const [loading, setLoading] = useState(false)
  const [errorMessage, setErrorMessage] = useState<string | null>(null)
  const { login } = useAuth()
  const navigate = useNavigate()

  const handleFinish = async (values: { username: string; password: string }) => {
    setLoading(true)
    setErrorMessage(null)
    try {
      const data = await authApi.login(values.username, values.password)
      login(data.token, data.user)
      message.success(`Chào mừng trở lại, ${data.user.fullName}!`)
      navigate('/', { replace: true })
    } catch (err: unknown) {
      if (err && typeof err === 'object' && 'response' in err) {
        const axiosErr = err as { response?: { data?: { message?: string } } }
        setErrorMessage(axiosErr.response?.data?.message || 'Đăng nhập không thành công')
      } else {
        setErrorMessage('Không thể kết nối đến máy chủ xác thực')
      }
    } finally {
      setLoading(false)
    }
  }

  return (
    <div
      style={{
        minHeight: '100vh',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        background: 'linear-gradient(135deg, #0f172a 0%, #1e293b 50%, #0c4a6e 100%)',
        padding: '20px',
        position: 'relative',
        overflow: 'hidden',
      }}
    >
      {/* Background Decorative Rings */}
      <div
        style={{
          position: 'absolute',
          width: 500,
          height: 500,
          borderRadius: '50%',
          background: 'radial-gradient(circle, rgba(14, 165, 233, 0.15) 0%, transparent 70%)',
          top: -100,
          left: -100,
          pointerEvents: 'none',
        }}
      />
      <div
        style={{
          position: 'absolute',
          width: 600,
          height: 600,
          borderRadius: '50%',
          background: 'radial-gradient(circle, rgba(6, 182, 212, 0.12) 0%, transparent 70%)',
          bottom: -150,
          right: -150,
          pointerEvents: 'none',
        }}
      />

      <Card
        style={{
          width: '100%',
          maxWidth: 420,
          borderRadius: 16,
          boxShadow: '0 20px 40px -15px rgba(0, 0, 0, 0.5)',
          background: '#ffffff',
          border: '1px solid rgba(255, 255, 255, 0.2)',
          zIndex: 1,
        }}
        bodyStyle={{ padding: '40px 32px' }}
      >
        {/* Brand Header */}
        <div style={{ textAlign: 'center', marginBottom: 28 }}>
          <div style={{ display: 'inline-flex', alignItems: 'center', justifyContent: 'center', marginBottom: 12 }}>
            <img
              src="/dental-logo.svg"
              alt="SmileCare"
              style={{ width: 52, height: 52, borderRadius: 14 }}
            />
          </div>
          <Title level={3} style={{ margin: 0, fontWeight: 700, color: '#0f172a' }}>
            SmileCare Dental CRM
          </Title>
          <Text type="secondary" style={{ fontSize: 13, display: 'block', marginTop: 4 }}>
            Đăng nhập hệ thống quản lý nha khoa
          </Text>
        </div>

        {/* Error Alert */}
        {errorMessage && (
          <Alert
            type="error"
            showIcon
            message={errorMessage}
            style={{ marginBottom: 20, borderRadius: 8 }}
          />
        )}

        {/* Form */}
        <Form
          form={form}
          layout="vertical"
          onFinish={handleFinish}
          requiredMark={false}
          size="large"
        >
          <Form.Item
            label={<Text strong style={{ fontSize: 13 }}>Tên đăng nhập</Text>}
            name="username"
            rules={[{ required: true, message: 'Vui lòng nhập tên đăng nhập' }]}
          >
            <Input
              prefix={<UserOutlined style={{ color: '#94a3b8' }} />}
              placeholder="Nhập tên tài khoản..."
              autoFocus
              style={{ borderRadius: 8 }}
            />
          </Form.Item>

          <Form.Item
            label={<Text strong style={{ fontSize: 13 }}>Mật khẩu</Text>}
            name="password"
            rules={[{ required: true, message: 'Vui lòng nhập mật khẩu' }]}
          >
            <Input.Password
              prefix={<LockOutlined style={{ color: '#94a3b8' }} />}
              placeholder="Nhập mật khẩu..."
              style={{ borderRadius: 8 }}
            />
          </Form.Item>

          <Form.Item style={{ marginBottom: 0, marginTop: 8 }}>
            <Button
              type="primary"
              htmlType="submit"
              loading={loading}
              block
              style={{
                height: 44,
                borderRadius: 8,
                fontSize: 15,
                fontWeight: 600,
                background: 'linear-gradient(135deg, #0284c7 0%, #0369a1 100%)',
              }}
            >
              Đăng nhập
            </Button>
          </Form.Item>
        </Form>
      </Card>
    </div>
  )
}
