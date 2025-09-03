'use client'

import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { toast } from 'sonner'
import { 
  getFacilitiesAction, 
  getFacilityAction,
  createFacilityAction, 
  updateFacilityAction, 
  deleteFacilityAction,
  toggleFacilityAvailabilityAction,
  type CreateFacilityData,
  type UpdateFacilityData
} from '@/actions/facilities'

// Query keys
export const facilityKeys = {
  all: ['facilities'] as const,
  lists: () => [...facilityKeys.all, 'list'] as const,
  list: (studioId?: string) => [...facilityKeys.lists(), { studioId }] as const,
  details: () => [...facilityKeys.all, 'detail'] as const,
  detail: (id: string) => [...facilityKeys.details(), id] as const,
}

// Hooks
export function useFacilities(studioId?: string) {
  return useQuery({
    queryKey: facilityKeys.list(studioId),
    queryFn: async () => {
      const result = await getFacilitiesAction(studioId)
      if (!result.success) {
        throw new Error(result.error || 'Failed to fetch facilities')
      }
      return result.data || []
    },
  })
}

export function useFacility(facilityId: string) {
  return useQuery({
    queryKey: facilityKeys.detail(facilityId),
    queryFn: async () => {
      const result = await getFacilityAction(facilityId)
      if (!result.success) {
        throw new Error(result.error || 'Failed to fetch facility')
      }
      return result.data
    },
    enabled: !!facilityId,
  })
}

export function useCreateFacility() {
  const queryClient = useQueryClient()
  
  return useMutation({
    mutationFn: (facilityData: CreateFacilityData) => createFacilityAction(facilityData),
    onSuccess: (result) => {
      if (result.success) {
        queryClient.invalidateQueries({ queryKey: facilityKeys.lists() })
        toast.success('Fasilitas berhasil dibuat')
      } else {
        toast.error(result.error || 'Gagal membuat fasilitas')
      }
    },
    onError: (error: Error) => {
      toast.error(error.message || 'Terjadi kesalahan saat membuat fasilitas')
    },
  })
}

export function useUpdateFacility() {
  const queryClient = useQueryClient()
  
  return useMutation({
    mutationFn: ({ facilityId, facilityData }: { facilityId: string; facilityData: UpdateFacilityData }) =>
      updateFacilityAction(facilityId, facilityData),
    onSuccess: (result, { facilityId }) => {
      if (result.success) {
        queryClient.invalidateQueries({ queryKey: facilityKeys.lists() })
        queryClient.invalidateQueries({ queryKey: facilityKeys.detail(facilityId) })
        toast.success('Fasilitas berhasil diperbarui')
      } else {
        toast.error(result.error || 'Gagal memperbarui fasilitas')
      }
    },
    onError: (error: Error) => {
      toast.error(error.message || 'Terjadi kesalahan saat memperbarui fasilitas')
    },
  })
}

export function useDeleteFacility() {
  const queryClient = useQueryClient()
  
  return useMutation({
    mutationFn: (facilityId: string) => deleteFacilityAction(facilityId),
    onSuccess: (result) => {
      if (result.success) {
        queryClient.invalidateQueries({ queryKey: facilityKeys.lists() })
        toast.success('Fasilitas berhasil dihapus')
      } else {
        toast.error(result.error || 'Gagal menghapus fasilitas')
      }
    },
    onError: (error: Error) => {
      toast.error(error.message || 'Terjadi kesalahan saat menghapus fasilitas')
    },
  })
}

export function useToggleFacilityAvailability() {
  const queryClient = useQueryClient()
  
  return useMutation({
    mutationFn: (facilityId: string) => toggleFacilityAvailabilityAction(facilityId),
    onSuccess: (result) => {
      if (result.success) {
        queryClient.invalidateQueries({ queryKey: facilityKeys.lists() })
        toast.success('Status ketersediaan fasilitas berhasil diubah')
      } else {
        toast.error(result.error || 'Gagal mengubah status ketersediaan fasilitas')
      }
    },
    onError: (error: Error) => {
      toast.error(error.message || 'Terjadi kesalahan saat mengubah status ketersediaan')
    },
  })
}