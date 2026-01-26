import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { Transaction } from '../types'

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3001'

// Fetch all transactions for current user
export const useTransactions = () => {
  return useQuery({
    queryKey: ['transactions'],
    queryFn: async () => {
      const token = localStorage.getItem('auth-storage')
      const response = await fetch(`${API_URL}/api/transactions`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      })
      if (!response.ok) throw new Error('Failed to fetch transactions')
      return response.json() as Promise<Transaction[]>
    },
  })
}

// Fetch single transaction
export const useTransaction = (id: string) => {
  return useQuery({
    queryKey: ['transaction', id],
    queryFn: async () => {
      const token = localStorage.getItem('auth-storage')
      const response = await fetch(`${API_URL}/api/transactions/${id}`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      })
      if (!response.ok) throw new Error('Failed to fetch transaction')
      return response.json() as Promise<Transaction>
    },
    enabled: !!id,
  })
}

// Create transaction mutation
export const useCreateTransaction = () => {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async (data: {
      negotiationId: string
      finalPrice: number
      quantity: number
    }) => {
      const token = localStorage.getItem('auth-storage')
      const response = await fetch(`${API_URL}/api/transactions`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(data),
      })
      if (!response.ok) throw new Error('Failed to create transaction')
      return response.json() as Promise<Transaction>
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['transactions'] })
      queryClient.invalidateQueries({ queryKey: ['negotiations'] })
    },
  })
}

// Update transaction status mutation
export const useUpdateTransactionStatus = () => {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async ({
      id,
      status,
    }: {
      id: string
      status: 'pending' | 'paid' | 'shipped' | 'delivered' | 'cancelled'
    }) => {
      const token = localStorage.getItem('auth-storage')
      const response = await fetch(`${API_URL}/api/transactions/${id}/status`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ status }),
      })
      if (!response.ok) throw new Error('Failed to update transaction status')
      return response.json() as Promise<Transaction>
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['transactions'] })
      queryClient.invalidateQueries({ queryKey: ['transaction', variables.id] })
    },
  })
}
