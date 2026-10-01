import axios from 'axios'

const API_BASE_URL = import.meta.env.VITE_API_URL ?? '/api'

export interface User {
  id: number
  username: string
  fullName: string
  role: string
}

export interface LoginResponse {
  token: string
  user: User
}

export const authApi = {
  async login(username: string, password: string): Promise<LoginResponse> {
    const { data } = await axios.post<LoginResponse>(`${API_BASE_URL}/auth/login`, {
      username,
      password,
    })
    return data
  },

  async getMe(token: string): Promise<{ user: User }> {
    const { data } = await axios.get<{ user: User }>(`${API_BASE_URL}/auth/me`, {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    })
    return data
  },

  async changePassword(currentPassword: string, newPassword: string, token: string): Promise<{ message: string }> {
    const { data } = await axios.post<{ message: string }>(
      `${API_BASE_URL}/auth/change-password`,
      { currentPassword, newPassword },
      {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      }
    )
    return data
  },
}
