import { create } from 'zustand'
import { Product } from '../types'

interface ProductFilters {
  category?: string
  minPrice?: number
  maxPrice?: number
  searchQuery?: string
  location?: [number, number]
  radius?: number
}

interface ProductState {
  products: Product[]
  selectedProduct: Product | null
  filters: ProductFilters
  setProducts: (products: Product[]) => void
  setSelectedProduct: (product: Product | null) => void
  updateFilters: (filters: Partial<ProductFilters>) => void
  clearFilters: () => void
  addProduct: (product: Product) => void
  updateProduct: (id: string, updates: Partial<Product>) => void
  removeProduct: (id: string) => void
}

export const useProductStore = create<ProductState>((set) => ({
  products: [],
  selectedProduct: null,
  filters: {},

  setProducts: (products: Product[]) => set({ products }),

  setSelectedProduct: (product: Product | null) => set({ selectedProduct: product }),

  updateFilters: (newFilters: Partial<ProductFilters>) =>
    set((state) => ({
      filters: { ...state.filters, ...newFilters },
    })),

  clearFilters: () => set({ filters: {} }),

  addProduct: (product: Product) =>
    set((state) => ({
      products: [...state.products, product],
    })),

  updateProduct: (id: string, updates: Partial<Product>) =>
    set((state) => ({
      products: state.products.map((p) =>
        p.id === id ? { ...p, ...updates } : p
      ),
      selectedProduct:
        state.selectedProduct?.id === id
          ? { ...state.selectedProduct, ...updates }
          : state.selectedProduct,
    })),

  removeProduct: (id: string) =>
    set((state) => ({
      products: state.products.filter((p) => p.id !== id),
      selectedProduct:
        state.selectedProduct?.id === id ? null : state.selectedProduct,
    })),
}))
