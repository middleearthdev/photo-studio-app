'use client'

import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { toast } from 'sonner'
import { 
  getPublicAddonsAction, 
  getPublicAddonsGroupedAction,
  getPackageAddonsAction,
  getPackageAddonsGroupedAction,
  assignAddonToPackageAction,
  removeAddonFromPackageAction,
  getAddonsAction,
  getPaginatedAddonsAction,
  deleteAddonAction,
  toggleAddonStatusAction,
  createAddonAction,
  updateAddonAction
} from '@/actions/addons'
import { PaginationParams } from '@/lib/constants/pagination'

// Query keys
export const addonKeys = {
  all: ['addons'] as const,
  lists: () => [...addonKeys.all, 'list'] as const,
  list: (studioId?: string) => [...addonKeys.lists(), { studioId }] as const,
  grouped: (studioId?: string) => [...addonKeys.all, 'grouped', { studioId }] as const,
  paginatedLists: () => [...addonKeys.all, 'paginated'] as const,
  paginatedList: (params: any) => [...addonKeys.paginatedLists(), params] as const,
  // Package-specific addon keys
  packageLists: () => [...addonKeys.all, 'package'] as const,
  packageList: (packageId?: string) => [...addonKeys.packageLists(), { packageId }] as const,
  packageGrouped: (packageId?: string) => [...addonKeys.all, 'package-grouped', { packageId }] as const,
}

// Hook to get all public addons
export function usePublicAddons(studioId?: string) {
  return useQuery({
    queryKey: addonKeys.list(studioId),
    queryFn: async () => {
      const result = await getPublicAddonsAction(studioId)
      if (!result.success) {
        throw new Error(result.error || 'Failed to fetch addons')
      }
      return result.data || []
    },
    enabled: !!studioId,
  })
}

// Hook to get addons grouped by category
export function usePublicAddonsGrouped(studioId?: string) {
  return useQuery({
    queryKey: addonKeys.grouped(studioId),
    queryFn: async () => {
      const result = await getPublicAddonsGroupedAction(studioId)
      if (!result.success) {
        throw new Error(result.error || 'Failed to fetch grouped addons')
      }
      return result.data || {}
    },
    enabled: !!studioId,
  })
}

// Hook to get package-specific addons
export function usePackageAddons(packageId?: string) {
  return useQuery({
    queryKey: addonKeys.packageList(packageId),
    queryFn: async () => {
      if (!packageId) return []
      
      const result = await getPackageAddonsAction(packageId)
      if (!result.success) {
        throw new Error(result.error || 'Failed to fetch package addons')
      }
      return result.data || []
    },
    enabled: !!packageId,
  })
}

// Hook to get package addons grouped by category
export function usePackageAddonsGrouped(packageId?: string) {
  return useQuery({
    queryKey: addonKeys.packageGrouped(packageId),
    queryFn: async () => {
      if (!packageId) return {}
      
      const result = await getPackageAddonsGroupedAction(packageId)
      if (!result.success) {
        throw new Error(result.error || 'Failed to fetch grouped package addons')
      }
      return result.data || {}
    },
    enabled: !!packageId,
  })
}

// Hook to get all addons (admin view)
export function useAddons(studioId?: string) {
  return useQuery({
    queryKey: addonKeys.list(studioId),
    queryFn: async () => {
      const result = await getAddonsAction(studioId)
      if (!result.success) {
        throw new Error(result.error || 'Failed to fetch addons')
      }
      return result.data || []
    },
    enabled: !!studioId,
  })
}

// Hook to get paginated addons (admin view)
export function usePaginatedAddons(
  studioId: string,
  params: PaginationParams & {
    status?: 'all' | 'active' | 'inactive'
    type?: string
    facilityId?: string
  } = {}
) {
  return useQuery({
    queryKey: addonKeys.paginatedList({ studioId, ...params }),
    queryFn: () => getPaginatedAddonsAction({ studioId, ...params }),
    staleTime: 30 * 1000, // 30 seconds
  })
}

// Mutation hook to assign addon to package
export function useAssignAddonToPackage() {
  const queryClient = useQueryClient()
  
  return useMutation({
    mutationFn: ({ packageId, addonId, options }: { 
      packageId: string, 
      addonId: string, 
      options?: {
        is_included?: boolean
        discount_percentage?: number
        is_recommended?: boolean
        display_order?: number
      }
    }) => assignAddonToPackageAction(packageId, addonId, options),
    onSuccess: () => {
      toast.success('Add-on berhasil ditambahkan ke paket')
      // Invalidate related queries
      queryClient.invalidateQueries({ queryKey: addonKeys.all })
    },
    onError: (error: Error) => {
      toast.error(`Gagal menambahkan add-on ke paket: ${error.message}`)
    },
  })
}

// Mutation hook to remove addon from package
export function useRemoveAddonFromPackage() {
  const queryClient = useQueryClient()
  
  return useMutation({
    mutationFn: ({ packageId, addonId }: { packageId: string, addonId: string }) => 
      removeAddonFromPackageAction(packageId, addonId),
    onSuccess: () => {
      toast.success('Add-on berhasil dihapus dari paket')
      // Invalidate related queries
      queryClient.invalidateQueries({ queryKey: addonKeys.all })
    },
    onError: (error: Error) => {
      toast.error(`Gagal menghapus add-on dari paket: ${error.message}`)
    },
  })
}

// Mutation hook to delete addon
export function useDeleteAddon() {
  const queryClient = useQueryClient()
  
  return useMutation({
    mutationFn: (addonId: string) => deleteAddonAction(addonId),
    onSuccess: () => {
      toast.success('Add-on berhasil dihapus')
      // Invalidate related queries
      queryClient.invalidateQueries({ queryKey: addonKeys.all })
    },
    onError: (error: Error) => {
      toast.error(`Gagal menghapus add-on: ${error.message}`)
    },
  })
}

// Mutation hook to toggle addon status
export function useToggleAddonStatus() {
  const queryClient = useQueryClient()
  
  return useMutation({
    mutationFn: (addonId: string) => toggleAddonStatusAction(addonId),
    onSuccess: () => {
      toast.success('Status add-on berhasil diubah')
      // Invalidate related queries
      queryClient.invalidateQueries({ queryKey: addonKeys.all })
    },
    onError: (error: Error) => {
      toast.error(`Gagal mengubah status add-on: ${error.message}`)
    },
  })
}

// Mutation hook to create addon
export function useCreateAddon() {
  const queryClient = useQueryClient()
  
  return useMutation({
    mutationFn: (addonData: any) => createAddonAction(addonData),
    onSuccess: () => {
      toast.success('Add-on berhasil dibuat')
      // Invalidate related queries
      queryClient.invalidateQueries({ queryKey: addonKeys.all })
    },
    onError: (error: Error) => {
      toast.error(`Gagal membuat add-on: ${error.message}`)
    },
  })
}

// Mutation hook to update addon
export function useUpdateAddon() {
  const queryClient = useQueryClient()
  
  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: any }) => updateAddonAction(id, data),
    onSuccess: () => {
      toast.success('Add-on berhasil diperbarui')
      // Invalidate related queries
      queryClient.invalidateQueries({ queryKey: addonKeys.all })
    },
    onError: (error: Error) => {
      toast.error(`Gagal memperbarui add-on: ${error.message}`)
    },
  })
}