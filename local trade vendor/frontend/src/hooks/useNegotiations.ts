import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { Negotiation } from '../types'

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3001'

// Fetch all negotiations for current user
export const useNegotiations = () => {
  return useQuery({
    queryKey: ['negotiations'],
    queryFn: async () => {
      const token = localStorage.getItem('auth-storage')
      const response = await fetch(`${API_URL}/api/negotiations`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      })
      if (!response.ok) throw new Error('Failed to fetch negotiations')
      return response.json() as Promise<Negotiation[]>
    },
  })
}

// Fetch single negotiation
export const useNegotiation = (id: string) => {
  return useQuery({
    queryKey: ['negotiation', id],
    queryFn: async () => {
      const token = localStorage.getItem('auth-storage')
      const response = await fetch(`${API_URL}/api/negotiations/${id}`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      })
      if (!response.ok) throw new Error('Failed to fetch negotiation')
      return response.json() as Promise<Negotiation>
    },
    enabled: !!id,
  })
}

// Start negotiation mutation
export const useStartNegotiation = () => {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async (data: {
      productId: string
      initialOffer: number
      message: string
    }) => {
      const token = localStorage.getItem('auth-storage')
      const response = await fetch(`${API_URL}/api/negotiations`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(data),
      })
      if (!response.ok) throw new Error('Failed to start negotiation')
      return response.json() as Promise<Negotiation>
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['negotiations'] })
    },
  })
}

// Respond to negotiation mutation
export const useRespondToNegotiation = () => {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async ({
      id,
      action,
      counterOffer,
      message,
    }: {
      id: string
      action: 'accept' | 'reject' | 'counter'
      counterOffer?: number
      message?: string
    }) => {
      const token = localStorage.getItem('auth-storage')
      const response = await fetch(`${API_URL}/api/negotiations/${id}/respond`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ action, counterOffer, message }),
      })
      if (!response.ok) throw new Error('Failed to respond to negotiation')
      return response.json() as Promise<Negotiation>
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['negotiations'] })
      queryClient.invalidateQueries({ queryKey: ['negotiation', variables.id] })
    },
  })
}

// Get AI suggestion for counter offer
export const useCounterOfferSuggestion = (negotiationId: string) => {
  return useQuery({
    queryKey: ['counterOfferSuggestion', negotiationId],
    queryFn: async () => {
      const token = localStorage.getItem('auth-storage')
      const response = await fetch(
        `${API_URL}/api/negotiations/${negotiationId}/suggest-counter`,
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      )
      if (!response.ok) throw new Error('Failed to get counter offer suggestion')
      return response.json()
    },
    enabled: !!negotiationId,
  })
}
