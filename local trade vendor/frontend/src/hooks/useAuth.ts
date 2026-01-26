import { useMutation, useQueryClient } from '@tanstack/react-query'
import { useAuthStore } from '../stores/authStore'
import { User } from '../types'

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3001'

interface LoginCredentials {
  email: string
  password: string
}

interface RegisterData {
  email: string
  password: string
  fullName: string
  role: 'buyer' | 'vendor'
  preferredLanguage?: string
}

// Login mutation
export const useLogin = () => {
  const { login } = useAuthStore()
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async (credentials: LoginCredentials) => {
      const response = await fetch(`${API_URL}/api/auth/login`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(credentials),
      })
      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.message || 'Login failed')
      }
      return response.json() as Promise<{ user: User; token: string }>
    },
    onSuccess: (data) => {
      login(data.user, data.token)
      queryClient.clear() // Clear all queries on login
    },
  })
}

// Register mutation
export const useRegister = () => {
  const { login } = useAuthStore()
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async (data: RegisterData) => {
      const response = await fetch(`${API_URL}/api/auth/register`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(data),
      })
      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.message || 'Registration failed')
      }
      return response.json() as Promise<{ user: User; token: string }>
    },
    onSuccess: (data) => {
      login(data.user, data.token)
      queryClient.clear() // Clear all queries on register
    },
  })
}

// Logout mutation
export const useLogout = () => {
  const { logout } = useAuthStore()
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async () => {
      // Optional: Call logout endpoint if you have one
      const token = localStorage.getItem('auth-storage')
      if (token) {
        await fetch(`${API_URL}/api/auth/logout`, {
          method: 'POST',
          headers: {
            Authorization: `Bearer ${token}`,
          },
        })
      }
    },
    onSuccess: () => {
      logout()
      queryClient.clear() // Clear all queries on logout
    },
  })
}

// Update profile mutation
export const useUpdateProfile = () => {
  const { updateUser } = useAuthStore()

  return useMutation({
    mutationFn: async (updates: Partial<User>) => {
      const token = localStorage.getItem('auth-storage')
      const response = await fetch(`${API_URL}/api/users/profile`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(updates),
      })
      if (!response.ok) throw new Error('Failed to update profile')
      return response.json() as Promise<User>
    },
    onSuccess: (data) => {
      updateUser(data)
    },
  })
}
