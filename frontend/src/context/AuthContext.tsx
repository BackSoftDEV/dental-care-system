import { createContext, useContext, useEffect, useState, type ReactNode } from 'react'
import { authApi, type User } from '../services/authApi'

interface AuthContextType {
  user: User | null
  token: string | null
  isAuthenticated: boolean
  loading: boolean
  login: (token: string, user: User) => void
  logout: () => void
}

const AuthContext = createContext<AuthContextType | undefined>(undefined)

export function AuthProvider({ children }: { children: ReactNode }) {
  const [token, setToken] = useState<string | null>(() => localStorage.getItem('smilecare_token'))
  const [user, setUser] = useState<User | null>(() => {
    const savedUser = localStorage.getItem('smilecare_user')
    return savedUser ? JSON.parse(savedUser) : null
  })
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const verifyExistingToken = async () => {
      const storedToken = localStorage.getItem('smilecare_token')
      if (!storedToken) {
        setLoading(false)
        return
      }

      try {
        const { user: verifiedUser } = await authApi.getMe(storedToken)
        setUser(verifiedUser)
        setToken(storedToken)
        localStorage.setItem('smilecare_user', JSON.stringify(verifiedUser))
      } catch (err) {
        console.warn('Phiên đăng nhập đã hết hạn:', err)
        logout()
      } finally {
        setLoading(false)
      }
    }

    verifyExistingToken()
  }, [])

  const login = (newToken: string, newUser: User) => {
    localStorage.setItem('smilecare_token', newToken)
    localStorage.setItem('smilecare_user', JSON.stringify(newUser))
    setToken(newToken)
    setUser(newUser)
  }

  const logout = () => {
    localStorage.removeItem('smilecare_token')
    localStorage.removeItem('smilecare_user')
    setToken(null)
    setUser(null)
  }

  return (
    <AuthContext.Provider
      value={{
        user,
        token,
        isAuthenticated: !!token && !!user,
        loading,
        login,
        logout,
      }}
    >
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth() {
  const context = useContext(AuthContext)
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider')
  }
  return context
}
