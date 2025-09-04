'use client'

import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { toast } from 'sonner'
import { 
  getPortfolios,
  getPaginatedPortfolios,
  getPortfolioById,
  createPortfolio, 
  updatePortfolio, 
  deletePortfolio,
  togglePortfolioStatus,
  togglePortfolioFeatured,
  getPortfolioCategories,
  createPortfolioCategory,
  updatePortfolioCategory,
  deletePortfolioCategory,
  type CreatePortfolioData,
  type UpdatePortfolioData,
  type CreateCategoryData,
  type UpdateCategoryData
} from '@/actions/portfolios'
import { PaginationParams } from '@/lib/constants/pagination'

// Query keys
export const portfolioKeys = {
  all: ['portfolios'] as const,
  lists: () => [...portfolioKeys.all, 'list'] as const,
  list: (studioId?: string) => [...portfolioKeys.lists(), { studioId }] as const,
  paginatedLists: () => [...portfolioKeys.all, 'paginated'] as const,
  paginatedList: (studioId: string, params: any) => [...portfolioKeys.paginatedLists(), { studioId, ...params }] as const,
  details: () => [...portfolioKeys.all, 'detail'] as const,
  detail: (id: string) => [...portfolioKeys.details(), id] as const,
}

export const categoryKeys = {
  all: ['portfolio-categories'] as const,
  lists: () => [...categoryKeys.all, 'list'] as const,
  list: (studioId?: string) => [...categoryKeys.lists(), { studioId }] as const,
}

// ===== PORTFOLIO HOOKS =====

// Get all portfolios for a studio (legacy)
export function usePortfolios(studioId?: string) {
  return useQuery({
    queryKey: portfolioKeys.list(studioId),
    queryFn: () => studioId ? getPortfolios(studioId) : Promise.resolve([]),
    enabled: !!studioId,
    staleTime: 5 * 60 * 1000, // 5 minutes
  })
}

// Get paginated portfolios for a studio
export function usePaginatedPortfolios(
  studioId: string,
  params: PaginationParams & {
    status?: 'active' | 'inactive' | 'all'
    category?: string
    featured?: 'featured' | 'not_featured' | 'all'
  } = {}
) {
  return useQuery({
    queryKey: portfolioKeys.paginatedList(studioId, params),
    queryFn: () => getPaginatedPortfolios(studioId, params),
    enabled: !!studioId,
    staleTime: 5 * 60 * 1000, // 5 minutes
  })
}

// Get portfolio by ID
export function usePortfolio(id?: string) {
  return useQuery({
    queryKey: portfolioKeys.detail(id!),
    queryFn: () => getPortfolioById(id!),
    enabled: !!id,
  })
}

// Create portfolio mutation
export function useCreatePortfolio() {
  const queryClient = useQueryClient()
  
  return useMutation({
    mutationFn: createPortfolio,
    onSuccess: (data) => {
      toast.success('Portfolio berhasil dibuat')
      // Invalidate relevant queries
      queryClient.invalidateQueries({ queryKey: portfolioKeys.lists() })
      queryClient.invalidateQueries({ queryKey: portfolioKeys.paginatedLists() })
    },
    onError: (error: Error) => {
      toast.error(`Gagal membuat portfolio: ${error.message}`)
    },
  })
}

// Update portfolio mutation
export function useUpdatePortfolio() {
  const queryClient = useQueryClient()
  
  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: UpdatePortfolioData }) => 
      updatePortfolio(id, data),
    onSuccess: (data) => {
      toast.success('Portfolio berhasil diperbarui')
      // Invalidate relevant queries
      queryClient.invalidateQueries({ queryKey: portfolioKeys.lists() })
      queryClient.invalidateQueries({ queryKey: portfolioKeys.paginatedLists() })
      queryClient.invalidateQueries({ queryKey: portfolioKeys.detail(data.id) })
    },
    onError: (error: Error) => {
      toast.error(`Gagal memperbarui portfolio: ${error.message}`)
    },
  })
}

// Delete portfolio mutation
export function useDeletePortfolio() {
  const queryClient = useQueryClient()
  
  return useMutation({
    mutationFn: deletePortfolio,
    onSuccess: () => {
      toast.success('Portfolio berhasil dihapus')
      // Invalidate all portfolio queries
      queryClient.invalidateQueries({ queryKey: portfolioKeys.all })
    },
    onError: (error: Error) => {
      toast.error(`Gagal menghapus portfolio: ${error.message}`)
    },
  })
}

// Toggle portfolio status mutation
export function useTogglePortfolioStatus() {
  const queryClient = useQueryClient()
  
  return useMutation({
    mutationFn: togglePortfolioStatus,
    onSuccess: (data) => {
      toast.success(`Portfolio ${data.is_active ? 'diaktifkan' : 'dinonaktifkan'}`)
      // Invalidate queries
      queryClient.invalidateQueries({ queryKey: portfolioKeys.lists() })
      queryClient.invalidateQueries({ queryKey: portfolioKeys.paginatedLists() })
      queryClient.invalidateQueries({ queryKey: portfolioKeys.detail(data.id) })
    },
    onError: (error: Error) => {
      toast.error(`Gagal mengubah status portfolio: ${error.message}`)
    },
  })
}

// Toggle portfolio featured mutation
export function useTogglePortfolioFeatured() {
  const queryClient = useQueryClient()
  
  return useMutation({
    mutationFn: togglePortfolioFeatured,
    onSuccess: (data) => {
      toast.success(`Portfolio ${data.is_featured ? 'dijadikan unggulan' : 'dihapus dari unggulan'}`)
      // Invalidate queries
      queryClient.invalidateQueries({ queryKey: portfolioKeys.lists() })
      queryClient.invalidateQueries({ queryKey: portfolioKeys.paginatedLists() })
      queryClient.invalidateQueries({ queryKey: portfolioKeys.detail(data.id) })
    },
    onError: (error: Error) => {
      toast.error(`Gagal mengubah status unggulan: ${error.message}`)
    },
  })
}

// ===== CATEGORY HOOKS =====

// Get all categories for a studio
export function usePortfolioCategories(studioId?: string) {
  return useQuery({
    queryKey: categoryKeys.list(studioId),
    queryFn: () => studioId ? getPortfolioCategories(studioId) : Promise.resolve([]),
    enabled: !!studioId,
    staleTime: 10 * 60 * 1000, // 10 minutes
  })
}

// Create category mutation
export function useCreatePortfolioCategory() {
  const queryClient = useQueryClient()
  
  return useMutation({
    mutationFn: createPortfolioCategory,
    onSuccess: () => {
      toast.success('Kategori berhasil dibuat')
      queryClient.invalidateQueries({ queryKey: categoryKeys.lists() })
      queryClient.invalidateQueries({ queryKey: portfolioKeys.lists() })
      queryClient.invalidateQueries({ queryKey: portfolioKeys.paginatedLists() })
    },
    onError: (error: Error) => {
      toast.error(`Gagal membuat kategori: ${error.message}`)
    },
  })
}

// Update category mutation
export function useUpdatePortfolioCategory() {
  const queryClient = useQueryClient()
  
  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: UpdateCategoryData }) => 
      updatePortfolioCategory(id, data),
    onSuccess: () => {
      toast.success('Kategori berhasil diperbarui')
      queryClient.invalidateQueries({ queryKey: categoryKeys.lists() })
      queryClient.invalidateQueries({ queryKey: portfolioKeys.lists() })
      queryClient.invalidateQueries({ queryKey: portfolioKeys.paginatedLists() })
    },
    onError: (error: Error) => {
      toast.error(`Gagal memperbarui kategori: ${error.message}`)
    },
  })
}

// Delete category mutation
export function useDeletePortfolioCategory() {
  const queryClient = useQueryClient()
  
  return useMutation({
    mutationFn: deletePortfolioCategory,
    onSuccess: () => {
      toast.success('Kategori berhasil dihapus')
      queryClient.invalidateQueries({ queryKey: categoryKeys.lists() })
      queryClient.invalidateQueries({ queryKey: portfolioKeys.lists() })
      queryClient.invalidateQueries({ queryKey: portfolioKeys.paginatedLists() })
    },
    onError: (error: Error) => {
      toast.error(`Gagal menghapus kategori: ${error.message}`)
    },
  })
}