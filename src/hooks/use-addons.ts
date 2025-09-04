'use client'

import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { toast } from 'sonner'
import { 
  getAddons, 
  getPaginatedAddons,
  getAddonById,
  createAddon, 
  updateAddon, 
  deleteAddon,
  toggleAddonStatus,
  getAddonsByType,
  getAddonsByFacility,
  type CreateAddonData,
  type UpdateAddonData,
  type Addon
} from '@/actions/addons'
import { PaginationParams } from '@/lib/constants/pagination'

// Query keys
export const addonKeys = {
  all: ['addons'] as const,
  lists: () => [...addonKeys.all, 'list'] as const,
  list: (studioId?: string) => [...addonKeys.lists(), { studioId }] as const,
  paginatedLists: () => [...addonKeys.all, 'paginated'] as const,
  paginatedList: (studioId: string, params: any) => [...addonKeys.paginatedLists(), { studioId, ...params }] as const,
  details: () => [...addonKeys.all, 'detail'] as const,
  detail: (id: string) => [...addonKeys.details(), id] as const,
  byType: (studioId: string, type: Addon['type']) => [...addonKeys.all, 'byType', { studioId, type }] as const,
  byFacility: (studioId: string, facilityId?: string) => [...addonKeys.all, 'byFacility', { studioId, facilityId }] as const,
}

// Get all addons for a studio
export function useAddons(studioId?: string) {
  return useQuery({
    queryKey: addonKeys.list(studioId),
    queryFn: () => studioId ? getAddons(studioId) : Promise.resolve([]),
    enabled: !!studioId,
    staleTime: 5 * 60 * 1000, // 5 minutes
  })
}

// Get paginated addons for a studio
export function usePaginatedAddons(
  studioId: string,
  params: PaginationParams & {
    status?: 'active' | 'inactive' | 'all'
    type?: string
    facilityId?: string
  } = {}
) {
  return useQuery({
    queryKey: addonKeys.paginatedList(studioId, params),
    queryFn: () => getPaginatedAddons(studioId, params),
    enabled: !!studioId,
    staleTime: 5 * 60 * 1000, // 5 minutes
  })
}

// Get addon by ID
export function useAddon(id?: string) {
  return useQuery({
    queryKey: addonKeys.detail(id!),
    queryFn: () => getAddonById(id!),
    enabled: !!id,
  })
}

// Get addons by type
export function useAddonsByType(studioId: string, type: Addon['type']) {
  return useQuery({
    queryKey: addonKeys.byType(studioId, type),
    queryFn: () => getAddonsByType(studioId, type),
    enabled: !!studioId,
    staleTime: 5 * 60 * 1000,
  })
}

// Get addons by facility
export function useAddonsByFacility(studioId: string, facilityId?: string) {
  return useQuery({
    queryKey: addonKeys.byFacility(studioId, facilityId),
    queryFn: () => getAddonsByFacility(studioId, facilityId),
    enabled: !!studioId,
    staleTime: 5 * 60 * 1000,
  })
}

// Create addon mutation
export function useCreateAddon() {
  const queryClient = useQueryClient()
  
  return useMutation({
    mutationFn: createAddon,
    onSuccess: (data) => {
      toast.success('Add-on berhasil dibuat')
      // Invalidate relevant queries
      queryClient.invalidateQueries({ queryKey: addonKeys.lists() })
      queryClient.invalidateQueries({ queryKey: addonKeys.paginatedLists() })
      queryClient.invalidateQueries({ queryKey: addonKeys.byType(data.studio_id, data.type) })
      if (data.facility_id) {
        queryClient.invalidateQueries({ queryKey: addonKeys.byFacility(data.studio_id, data.facility_id) })
      }
    },
    onError: (error: Error) => {
      toast.error(`Gagal membuat add-on: ${error.message}`)
    },
  })
}

// Update addon mutation
export function useUpdateAddon() {
  const queryClient = useQueryClient()
  
  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: UpdateAddonData }) => 
      updateAddon(id, data),
    onSuccess: (data) => {
      toast.success('Add-on berhasil diperbarui')
      // Invalidate relevant queries
      queryClient.invalidateQueries({ queryKey: addonKeys.lists() })
      queryClient.invalidateQueries({ queryKey: addonKeys.paginatedLists() })
      queryClient.invalidateQueries({ queryKey: addonKeys.detail(data.id) })
      queryClient.invalidateQueries({ queryKey: addonKeys.byType(data.studio_id, data.type) })
      if (data.facility_id) {
        queryClient.invalidateQueries({ queryKey: addonKeys.byFacility(data.studio_id, data.facility_id) })
      }
    },
    onError: (error: Error) => {
      toast.error(`Gagal memperbarui add-on: ${error.message}`)
    },
  })
}

// Delete addon mutation
export function useDeleteAddon() {
  const queryClient = useQueryClient()
  
  return useMutation({
    mutationFn: deleteAddon,
    onSuccess: () => {
      toast.success('Add-on berhasil dihapus')
      // Invalidate all addon queries
      queryClient.invalidateQueries({ queryKey: addonKeys.all })
    },
    onError: (error: Error) => {
      if (error.message.includes('being used in reservations')) {
        toast.error('Tidak dapat menghapus add-on yang sedang digunakan dalam reservasi')
      } else {
        toast.error(`Gagal menghapus add-on: ${error.message}`)
      }
    },
  })
}

// Toggle addon status mutation
export function useToggleAddonStatus() {
  const queryClient = useQueryClient()
  
  return useMutation({
    mutationFn: toggleAddonStatus,
    onSuccess: (data) => {
      toast.success(data.is_active ? 'Add-on berhasil diaktifkan' : 'Add-on berhasil dinonaktifkan')
      // Invalidate relevant queries
      queryClient.invalidateQueries({ queryKey: addonKeys.lists() })
      queryClient.invalidateQueries({ queryKey: addonKeys.detail(data.id) })
      queryClient.invalidateQueries({ queryKey: addonKeys.byType(data.studio_id, data.type) })
      if (data.facility_id) {
        queryClient.invalidateQueries({ queryKey: addonKeys.byFacility(data.studio_id, data.facility_id) })
      }
    },
    onError: (error: Error) => {
      toast.error(`Gagal mengubah status add-on: ${error.message}`)
    },
  })
}