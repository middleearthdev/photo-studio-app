'use client'

import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { toast } from 'sonner'
import { 
  getPackageCategoriesAction,
  createPackageCategoryAction,
  updatePackageCategoryAction,
  deletePackageCategoryAction,
  getPortfolioCategoriesAction,
  createPortfolioCategoryAction,
  updatePortfolioCategoryAction,
  deletePortfolioCategoryAction,
  type PackageCategory,
  type PortfolioCategory,
  type CreateCategoryData,
  type UpdateCategoryData
} from '@/actions/categories'

// Query keys
export const categoryKeys = {
  all: ['categories'] as const,
  packages: () => [...categoryKeys.all, 'packages'] as const,
  portfolios: () => [...categoryKeys.all, 'portfolios'] as const,
}

// Package Category Hooks
export function usePackageCategories() {
  return useQuery({
    queryKey: categoryKeys.packages(),
    queryFn: async () => {
      const result = await getPackageCategoriesAction()
      if (!result.success) {
        throw new Error(result.error || 'Failed to fetch package categories')
      }
      return result.data || []
    },
  })
}

export function useCreatePackageCategory() {
  const queryClient = useQueryClient()
  
  return useMutation({
    mutationFn: ({ studioId, categoryData }: { studioId: string; categoryData: CreateCategoryData }) =>
      createPackageCategoryAction(studioId, categoryData),
    onSuccess: (result) => {
      if (result.success) {
        queryClient.invalidateQueries({ queryKey: categoryKeys.packages() })
        toast.success('Kategori paket berhasil dibuat')
      } else {
        toast.error(result.error || 'Gagal membuat kategori paket')
      }
    },
    onError: (error: Error) => {
      toast.error(error.message || 'Terjadi kesalahan saat membuat kategori paket')
    },
  })
}

export function useUpdatePackageCategory() {
  const queryClient = useQueryClient()
  
  return useMutation({
    mutationFn: ({ categoryId, categoryData }: { categoryId: string; categoryData: UpdateCategoryData }) =>
      updatePackageCategoryAction(categoryId, categoryData),
    onSuccess: (result) => {
      if (result.success) {
        queryClient.invalidateQueries({ queryKey: categoryKeys.packages() })
        toast.success('Kategori paket berhasil diperbarui')
      } else {
        toast.error(result.error || 'Gagal memperbarui kategori paket')
      }
    },
    onError: (error: Error) => {
      toast.error(error.message || 'Terjadi kesalahan saat memperbarui kategori paket')
    },
  })
}

export function useDeletePackageCategory() {
  const queryClient = useQueryClient()
  
  return useMutation({
    mutationFn: (categoryId: string) => deletePackageCategoryAction(categoryId),
    onSuccess: (result) => {
      if (result.success) {
        queryClient.invalidateQueries({ queryKey: categoryKeys.packages() })
        toast.success('Kategori paket berhasil dihapus')
      } else {
        toast.error(result.error || 'Gagal menghapus kategori paket')
      }
    },
    onError: (error: Error) => {
      toast.error(error.message || 'Terjadi kesalahan saat menghapus kategori paket')
    },
  })
}

// Portfolio Category Hooks
export function usePortfolioCategories() {
  return useQuery({
    queryKey: categoryKeys.portfolios(),
    queryFn: async () => {
      const result = await getPortfolioCategoriesAction()
      if (!result.success) {
        throw new Error(result.error || 'Failed to fetch portfolio categories')
      }
      return result.data || []
    },
  })
}

export function useCreatePortfolioCategory() {
  const queryClient = useQueryClient()
  
  return useMutation({
    mutationFn: ({ studioId, categoryData }: { studioId: string; categoryData: CreateCategoryData }) =>
      createPortfolioCategoryAction(studioId, categoryData),
    onSuccess: (result) => {
      if (result.success) {
        queryClient.invalidateQueries({ queryKey: categoryKeys.portfolios() })
        toast.success('Kategori portfolio berhasil dibuat')
      } else {
        toast.error(result.error || 'Gagal membuat kategori portfolio')
      }
    },
    onError: (error: Error) => {
      toast.error(error.message || 'Terjadi kesalahan saat membuat kategori portfolio')
    },
  })
}

export function useUpdatePortfolioCategory() {
  const queryClient = useQueryClient()
  
  return useMutation({
    mutationFn: ({ categoryId, categoryData }: { categoryId: string; categoryData: UpdateCategoryData }) =>
      updatePortfolioCategoryAction(categoryId, categoryData),
    onSuccess: (result) => {
      if (result.success) {
        queryClient.invalidateQueries({ queryKey: categoryKeys.portfolios() })
        toast.success('Kategori portfolio berhasil diperbarui')
      } else {
        toast.error(result.error || 'Gagal memperbarui kategori portfolio')
      }
    },
    onError: (error: Error) => {
      toast.error(error.message || 'Terjadi kesalahan saat memperbarui kategori portfolio')
    },
  })
}

export function useDeletePortfolioCategory() {
  const queryClient = useQueryClient()
  
  return useMutation({
    mutationFn: (categoryId: string) => deletePortfolioCategoryAction(categoryId),
    onSuccess: (result) => {
      if (result.success) {
        queryClient.invalidateQueries({ queryKey: categoryKeys.portfolios() })
        toast.success('Kategori portfolio berhasil dihapus')
      } else {
        toast.error(result.error || 'Gagal menghapus kategori portfolio')
      }
    },
    onError: (error: Error) => {
      toast.error(error.message || 'Terjadi kesalahan saat menghapus kategori portfolio')
    },
  })
}