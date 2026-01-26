import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { Product } from '../types'

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3001'

interface ProductFilters {
  category?: string
  minPrice?: number
  maxPrice?: number
  search?: string
  location?: [number, number]
  radius?: number
}

// Fetch products with filters
export const useProducts = (filters?: ProductFilters) => {
  return useQuery({
    queryKey: ['products', filters],
    queryFn: async () => {
      const params = new URLSearchParams()
      if (filters?.category) params.append('category', filters.category)
      if (filters?.minPrice) params.append('minPrice', filters.minPrice.toString())
      if (filters?.maxPrice) params.append('maxPrice', filters.maxPrice.toString())
      if (filters?.search) params.append('search', filters.search)
      if (filters?.location) {
        params.append('latitude', filters.location[0].toString())
        params.append('longitude', filters.location[1].toString())
      }
      if (filters?.radius) params.append('radius', filters.radius.toString())

      const response = await fetch(`${API_URL}/api/products?${params}`)
      if (!response.ok) throw new Error('Failed to fetch products')
      return response.json() as Promise<Product[]>
    },
  })
}

// Fetch single product
export const useProduct = (id: string) => {
  return useQuery({
    queryKey: ['product', id],
    queryFn: async () => {
      const response = await fetch(`${API_URL}/api/products/${id}`)
      if (!response.ok) throw new Error('Failed to fetch product')
      return response.json() as Promise<Product>
    },
    enabled: !!id,
  })
}

// Create product mutation
export const useCreateProduct = () => {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async (productData: Partial<Product>) => {
      const token = localStorage.getItem('auth-storage')
      const response = await fetch(`${API_URL}/api/products`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(productData),
      })
      if (!response.ok) throw new Error('Failed to create product')
      return response.json() as Promise<Product>
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['products'] })
    },
  })
}

// Update product mutation
export const useUpdateProduct = () => {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async ({ id, updates }: { id: string; updates: Partial<Product> }) => {
      const token = localStorage.getItem('auth-storage')
      const response = await fetch(`${API_URL}/api/products/${id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(updates),
      })
      if (!response.ok) throw new Error('Failed to update product')
      return response.json() as Promise<Product>
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['products'] })
      queryClient.invalidateQueries({ queryKey: ['product', variables.id] })
    },
  })
}

// Delete product mutation
export const useDeleteProduct = () => {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async (id: string) => {
      const token = localStorage.getItem('auth-storage')
      const response = await fetch(`${API_URL}/api/products/${id}`, {
        method: 'DELETE',
        headers: {
          Authorization: `Bearer ${token}`,
        },
      })
      if (!response.ok) throw new Error('Failed to delete product')
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['products'] })
    },
  })
}
