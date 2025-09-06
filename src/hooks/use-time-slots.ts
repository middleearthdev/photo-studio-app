'use client'

import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { toast } from 'sonner'
import {
  getAvailableTimeSlotsAction,
  getPaginatedTimeSlots,
  deleteTimeSlotAction,
  toggleTimeSlotAvailabilityAction,
  createTimeSlotAction,
  updateTimeSlotAction,
  bulkCreateTimeSlotsAction,
  type TimeSlot
} from '@/actions/time-slots'
import { PaginationParams } from '@/lib/constants/pagination'

export const timeSlotKeys = {
  all: ['timeSlots'] as const,
  availableSlots: (studioId?: string, date?: string, duration?: number) =>
    [...timeSlotKeys.all, 'available', { studioId, date, duration }] as const,
  paginatedLists: () => [...timeSlotKeys.all, 'paginated'] as const,
  paginatedList: (params: any) => [...timeSlotKeys.paginatedLists(), params] as const,
  details: () => [...timeSlotKeys.all, 'detail'] as const,
  detail: (id: string) => [...timeSlotKeys.details(), id] as const,
}

export function useAvailableTimeSlots(studioId?: string, date?: string, packageDurationMinutes?: number) {
  return useQuery({
    queryKey: timeSlotKeys.availableSlots(studioId, date, packageDurationMinutes),
    queryFn: async () => {
      if (!studioId || !date) {
        return []
      }

      const result = await getAvailableTimeSlotsAction(studioId, date, packageDurationMinutes)
      if (!result.success) {
        throw new Error(result.error || 'Failed to fetch time slots')
      }
      return result.data || []
    },
    enabled: !!studioId && !!date,
  })
}

// Get paginated time slots
export function usePaginatedTimeSlots(
  params: PaginationParams & {
    studioId?: string
    search?: string
    status?: 'all' | 'available' | 'blocked' | 'unavailable'
    facilityId?: string
    startDate?: string
    endDate?: string
  } = {}
) {
  return useQuery({
    queryKey: timeSlotKeys.paginatedList(params),
    queryFn: () => getPaginatedTimeSlots(params),
    staleTime: 30 * 1000, // 30 seconds
  })
}

// Create time slot mutation
export function useCreateTimeSlot() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: ({ studioId, facilityId, date, startTime, endTime, isBlocked, notes }: {
      studioId: string,
      facilityId: string,
      date: string,
      startTime: string,
      endTime: string,
      isBlocked?: boolean,
      notes?: string
    }) => createTimeSlotAction(studioId, facilityId, date, startTime, endTime, isBlocked, notes),
    onSuccess: () => {
      toast.success('Time slot berhasil dibuat')
      // Invalidate relevant queries
      queryClient.invalidateQueries({ queryKey: timeSlotKeys.all })
    },
    onError: (error: Error) => {
      toast.error(`Gagal membuat time slot: ${error.message}`)
    },
  })
}

// Update time slot mutation
export function useUpdateTimeSlot() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: ({ slotId, updates }: { slotId: string, updates: { is_available?: boolean, is_blocked?: boolean, notes?: string } }) =>
      updateTimeSlotAction(slotId, updates),
    onSuccess: () => {
      toast.success('Time slot berhasil diperbarui')
      // Invalidate relevant queries
      queryClient.invalidateQueries({ queryKey: timeSlotKeys.all })
    },
    onError: (error: Error) => {
      toast.error(`Gagal memperbarui time slot: ${error.message}`)
    },
  })
}

// Bulk create time slots mutation
export function useBulkCreateTimeSlots() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: ({ studioId, facilityId, startDate, endDate, timeRanges, skipWeekends }: {
      studioId: string,
      facilityId: string,
      startDate: string,
      endDate: string,
      timeRanges: { startTime: string; endTime: string }[],
      skipWeekends?: boolean
    }) => bulkCreateTimeSlotsAction(studioId, facilityId, startDate, endDate, timeRanges, skipWeekends),
    onSuccess: () => {
      toast.success('Time slots berhasil dibuat')
      // Invalidate relevant queries
      queryClient.invalidateQueries({ queryKey: timeSlotKeys.all })
    },
    onError: (error: Error) => {
      toast.error(`Gagal membuat time slots: ${error.message}`)
    },
  })
}

// Delete time slot mutation
export function useDeleteTimeSlot() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: deleteTimeSlotAction,
    onSuccess: () => {
      toast.success('Time slot berhasil dihapus')
      // Invalidate relevant queries
      queryClient.invalidateQueries({ queryKey: timeSlotKeys.all })
    },
    onError: (error: Error) => {
      toast.error(`Gagal menghapus time slot: ${error.message}`)
    },
  })
}

// Toggle time slot availability mutation
export function useToggleTimeSlotAvailability() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: toggleTimeSlotAvailabilityAction,
    onSuccess: () => {
      toast.success('Status time slot berhasil diperbarui')
      // Invalidate relevant queries
      queryClient.invalidateQueries({ queryKey: timeSlotKeys.all })
    },
    onError: (error: Error) => {
      toast.error(`Gagal memperbarui status time slot: ${error.message}`)
    },
  })
}