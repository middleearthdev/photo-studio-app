'use client'

import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { toast } from 'sonner'
import { 
  getPackagesAction, 
  getPackageAction,
  createPackageAction, 
  updatePackageAction, 
  deletePackageAction,
  togglePackageStatusAction,
  getPackageCategoriesAction,
  createPackageCategoryAction,
  updatePackageCategoryAction,
  deletePackageCategoryAction,
  type CreatePackageData,
  type UpdatePackageData,
  type CreatePackageCategoryData,
  type UpdatePackageCategoryData
} from '@/actions/packages'

// Query keys
export const packageKeys = {
  all: ['packages'] as const,
  lists: () => [...packageKeys.all, 'list'] as const,
  list: (studioId?: string) => [...packageKeys.lists(), { studioId }] as const,
  details: () => [...packageKeys.all, 'detail'] as const,
  detail: (id: string) => [...packageKeys.details(), id] as const,
}

export const packageCategoryKeys = {
  all: ['package-categories'] as const,
  lists: () => [...packageCategoryKeys.all, 'list'] as const,
  list: (studioId?: string) => [...packageCategoryKeys.lists(), { studioId }] as const,
}

// Package Category Hooks
export function usePackageCategories(studioId?: string) {
  return useQuery({
    queryKey: packageCategoryKeys.list(studioId),
    queryFn: async () => {
      const result = await getPackageCategoriesAction(studioId)
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
    mutationFn: (categoryData: CreatePackageCategoryData) => createPackageCategoryAction(categoryData),
    onSuccess: (result) => {
      if (result.success) {
        queryClient.invalidateQueries({ queryKey: packageCategoryKeys.lists() })
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
    mutationFn: ({ categoryId, categoryData }: { categoryId: string; categoryData: UpdatePackageCategoryData }) =>
      updatePackageCategoryAction(categoryId, categoryData),
    onSuccess: (result) => {
      if (result.success) {
        queryClient.invalidateQueries({ queryKey: packageCategoryKeys.lists() })
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
        queryClient.invalidateQueries({ queryKey: packageCategoryKeys.lists() })
        queryClient.invalidateQueries({ queryKey: packageKeys.lists() })
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

// Package Hooks
export function usePackages(studioId?: string) {
  return useQuery({
    queryKey: packageKeys.list(studioId),
    queryFn: async () => {
      const result = await getPackagesAction(studioId)
      if (!result.success) {
        throw new Error(result.error || 'Failed to fetch packages')
      }
      return result.data || []
    },
  })
}

export function usePackage(packageId: string) {
  return useQuery({
    queryKey: packageKeys.detail(packageId),
    queryFn: async () => {
      const result = await getPackageAction(packageId)
      if (!result.success) {
        throw new Error(result.error || 'Failed to fetch package')
      }
      return result.data
    },
    enabled: !!packageId,
  })
}

export function useCreatePackage() {
  const queryClient = useQueryClient()
  
  return useMutation({
    mutationFn: (packageData: CreatePackageData) => createPackageAction(packageData),
    onSuccess: (result) => {
      if (result.success) {
        queryClient.invalidateQueries({ queryKey: packageKeys.lists() })
        toast.success('Paket berhasil dibuat')
      } else {
        toast.error(result.error || 'Gagal membuat paket')
      }
    },
    onError: (error: Error) => {
      toast.error(error.message || 'Terjadi kesalahan saat membuat paket')
    },
  })
}

export function useUpdatePackage() {
  const queryClient = useQueryClient()
  
  return useMutation({
    mutationFn: ({ packageId, packageData }: { packageId: string; packageData: UpdatePackageData }) =>
      updatePackageAction(packageId, packageData),
    onSuccess: (result, { packageId }) => {
      if (result.success) {
        queryClient.invalidateQueries({ queryKey: packageKeys.lists() })
        queryClient.invalidateQueries({ queryKey: packageKeys.detail(packageId) })
        toast.success('Paket berhasil diperbarui')
      } else {
        toast.error(result.error || 'Gagal memperbarui paket')
      }
    },
    onError: (error: Error) => {
      toast.error(error.message || 'Terjadi kesalahan saat memperbarui paket')
    },
  })
}

export function useDeletePackage() {
  const queryClient = useQueryClient()
  
  return useMutation({
    mutationFn: (packageId: string) => deletePackageAction(packageId),
    onSuccess: (result) => {
      if (result.success) {
        queryClient.invalidateQueries({ queryKey: packageKeys.lists() })
        toast.success('Paket berhasil dihapus')
      } else {
        toast.error(result.error || 'Gagal menghapus paket')
      }
    },
    onError: (error: Error) => {
      toast.error(error.message || 'Terjadi kesalahan saat menghapus paket')
    },
  })
}

export function useTogglePackageStatus() {
  const queryClient = useQueryClient()
  
  return useMutation({
    mutationFn: (packageId: string) => togglePackageStatusAction(packageId),
    onSuccess: (result) => {
      if (result.success) {
        queryClient.invalidateQueries({ queryKey: packageKeys.lists() })
        toast.success('Status paket berhasil diubah')
      } else {
        toast.error(result.error || 'Gagal mengubah status paket')
      }
    },
    onError: (error: Error) => {
      toast.error(error.message || 'Terjadi kesalahan saat mengubah status paket')
    },
  })
}