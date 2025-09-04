'use client'

import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { toast } from 'sonner'
import { 
  getTimeSlotsAction, 
  getPaginatedTimeSlots,
  getTimeSlotAction,
  createTimeSlotAction, 
  updateTimeSlotAction, 
  deleteTimeSlotAction,
  toggleTimeSlotAvailabilityAction,
  bulkCreateTimeSlotsAction,
  type CreateTimeSlotData,
  type UpdateTimeSlotData
} from '@/actions/time-slots'
import { PaginationParams } from '@/lib/constants/pagination'

// Query keys
export const timeSlotKeys = {
  all: ['time-slots'] as const,
  lists: () => [...timeSlotKeys.all, 'list'] as const,
  list: (studioId?: string, facilityId?: string, startDate?: string, endDate?: string) => 
    [...timeSlotKeys.lists(), { studioId, facilityId, startDate, endDate }] as const,
  paginatedLists: () => [...timeSlotKeys.all, 'paginated'] as const,
  paginatedList: (studioId: string, params: any) => [...timeSlotKeys.paginatedLists(), { studioId, ...params }] as const,
  details: () => [...timeSlotKeys.all, 'detail'] as const,
  detail: (id: string) => [...timeSlotKeys.details(), id] as const,
}

// Get time slots with filters
export function useTimeSlots(
  studioId?: string,
  facilityId?: string,
  startDate?: string,
  endDate?: string
) {
  return useQuery({
    queryKey: timeSlotKeys.list(studioId, facilityId, startDate, endDate),
    queryFn: async () => {
      const result = await getTimeSlotsAction(studioId, facilityId, startDate, endDate)
      if (!result.success) {
        throw new Error(result.error || 'Failed to fetch time slots')
      }
      return result.data || []
    },
  })
}

// Get paginated time slots
export function usePaginatedTimeSlots(
  studioId: string,
  params: PaginationParams & {
    facilityId?: string
    status?: 'available' | 'blocked' | 'unavailable' | 'all'
    startDate?: string
    endDate?: string
  } = {}
) {
  return useQuery({
    queryKey: timeSlotKeys.paginatedList(studioId, params),
    queryFn: () => getPaginatedTimeSlots(studioId, params),
    enabled: !!studioId,
    staleTime: 5 * 60 * 1000, // 5 minutes
  })
}

// Get single time slot
export function useTimeSlot(timeSlotId: string) {
  return useQuery({
    queryKey: timeSlotKeys.detail(timeSlotId),
    queryFn: async () => {
      const result = await getTimeSlotAction(timeSlotId)
      if (!result.success) {
        throw new Error(result.error || 'Failed to fetch time slot')
      }
      return result.data
    },
    enabled: !!timeSlotId,
  })
}

// Create time slot
export function useCreateTimeSlot() {
  const queryClient = useQueryClient()
  
  return useMutation({
    mutationFn: (timeSlotData: CreateTimeSlotData) => createTimeSlotAction(timeSlotData),
    onSuccess: (result) => {
      if (result.success) {
        queryClient.invalidateQueries({ queryKey: timeSlotKeys.lists() })
        queryClient.invalidateQueries({ queryKey: timeSlotKeys.paginatedLists() })
        toast.success('Time slot berhasil dibuat')
      } else {
        toast.error(result.error || 'Gagal membuat time slot')
      }
    },
    onError: (error: Error) => {
      toast.error(error.message || 'Terjadi kesalahan saat membuat time slot')
    },
  })
}

// Update time slot
export function useUpdateTimeSlot() {
  const queryClient = useQueryClient()
  
  return useMutation({
    mutationFn: ({ timeSlotId, timeSlotData }: { timeSlotId: string; timeSlotData: UpdateTimeSlotData }) =>
      updateTimeSlotAction(timeSlotId, timeSlotData),
    onSuccess: (result, { timeSlotId }) => {
      if (result.success) {
        queryClient.invalidateQueries({ queryKey: timeSlotKeys.lists() })
        queryClient.invalidateQueries({ queryKey: timeSlotKeys.paginatedLists() })
        queryClient.invalidateQueries({ queryKey: timeSlotKeys.detail(timeSlotId) })
        toast.success('Time slot berhasil diperbarui')
      } else {
        toast.error(result.error || 'Gagal memperbarui time slot')
      }
    },
    onError: (error: Error) => {
      toast.error(error.message || 'Terjadi kesalahan saat memperbarui time slot')
    },
  })
}

// Delete time slot
export function useDeleteTimeSlot() {
  const queryClient = useQueryClient()
  
  return useMutation({
    mutationFn: (timeSlotId: string) => deleteTimeSlotAction(timeSlotId),
    onSuccess: (result) => {
      if (result.success) {
        queryClient.invalidateQueries({ queryKey: timeSlotKeys.lists() })
        queryClient.invalidateQueries({ queryKey: timeSlotKeys.paginatedLists() })
        toast.success('Time slot berhasil dihapus')
      } else {
        toast.error(result.error || 'Gagal menghapus time slot')
      }
    },
    onError: (error: Error) => {
      toast.error(error.message || 'Terjadi kesalahan saat menghapus time slot')
    },
  })
}

// Toggle time slot availability
export function useToggleTimeSlotAvailability() {
  const queryClient = useQueryClient()
  
  return useMutation({
    mutationFn: (timeSlotId: string) => toggleTimeSlotAvailabilityAction(timeSlotId),
    onSuccess: (result) => {
      if (result.success) {
        queryClient.invalidateQueries({ queryKey: timeSlotKeys.lists() })
        queryClient.invalidateQueries({ queryKey: timeSlotKeys.paginatedLists() })
        toast.success('Status time slot berhasil diubah')
      } else {
        toast.error(result.error || 'Gagal mengubah status time slot')
      }
    },
    onError: (error: Error) => {
      toast.error(error.message || 'Terjadi kesalahan saat mengubah status time slot')
    },
  })
}

// Bulk create time slots
export function useBulkCreateTimeSlots() {
  const queryClient = useQueryClient()
  
  return useMutation({
    mutationFn: (data: {
      studio_id: string
      facility_id: string
      start_date: string
      end_date: string
      time_ranges: { start_time: string; end_time: string }[]
      skip_weekends?: boolean
    }) => bulkCreateTimeSlotsAction(data),
    onSuccess: (result) => {
      if (result.success) {
        queryClient.invalidateQueries({ queryKey: timeSlotKeys.lists() })
        queryClient.invalidateQueries({ queryKey: timeSlotKeys.paginatedLists() })
        const count = result.data?.created_count || 0
        toast.success(`${count} time slot berhasil dibuat`)
      } else {
        toast.error(result.error || 'Gagal membuat time slot')
      }
    },
    onError: (error: Error) => {
      toast.error(error.message || 'Terjadi kesalahan saat membuat time slot')
    },
  })
}