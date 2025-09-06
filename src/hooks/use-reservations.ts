'use client'

import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { toast } from 'sonner'
import { 
  getPaginatedReservations,
  getReservationById,
  createReservation, 
  updateReservation, 
  updateReservationStatus,
  deleteReservation,
  getReservationStats,
  type CreateReservationData,
  type UpdateReservationData,
  type ReservationStatus
} from '@/actions/reservations'
import { PaginationParams } from '@/lib/constants/pagination'

// Query keys
export const reservationKeys = {
  all: ['reservations'] as const,
  lists: () => [...reservationKeys.all, 'list'] as const,
  paginatedLists: () => [...reservationKeys.all, 'paginated'] as const,
  paginatedList: (studioId: string, params: any) => [...reservationKeys.paginatedLists(), { studioId, ...params }] as const,
  details: () => [...reservationKeys.all, 'detail'] as const,
  detail: (id: string) => [...reservationKeys.details(), id] as const,
  stats: (studioId: string) => [...reservationKeys.all, 'stats', studioId] as const,
}

// ===== RESERVATION HOOKS =====

// Get paginated reservations
export function usePaginatedReservations(
  studioId: string,
  params: PaginationParams & {
    status?: string
    payment_status?: string
    date_from?: string
    date_to?: string
    booking_type?: 'guest' | 'user' | 'all'
  } = {}
) {
  return useQuery({
    queryKey: reservationKeys.paginatedList(studioId, params),
    queryFn: () => getPaginatedReservations(studioId, params as any),
    enabled: !!studioId,
    staleTime: 30 * 1000, // 30 seconds
  })
}

// Get reservation by ID
export function useReservation(id?: string) {
  return useQuery({
    queryKey: reservationKeys.detail(id!),
    queryFn: () => getReservationById(id!),
    enabled: !!id,
  })
}

// Get reservation statistics
export function useReservationStats(studioId?: string) {
  return useQuery({
    queryKey: reservationKeys.stats(studioId!),
    queryFn: () => getReservationStats(studioId!),
    enabled: !!studioId,
    staleTime: 5 * 60 * 1000, // 5 minutes
  })
}

// Create reservation mutation
export function useCreateReservation() {
  const queryClient = useQueryClient()
  
  return useMutation({
    mutationFn: createReservation,
    onSuccess: (data) => {
      toast.success('Reservasi berhasil dibuat')
      // Invalidate relevant queries
      queryClient.invalidateQueries({ queryKey: reservationKeys.lists() })
      queryClient.invalidateQueries({ queryKey: reservationKeys.paginatedLists() })
      queryClient.invalidateQueries({ queryKey: reservationKeys.stats(data.studio_id) })
    },
    onError: (error: Error) => {
      toast.error(`Gagal membuat reservasi: ${error.message}`)
    },
  })
}

// Update reservation mutation
export function useUpdateReservation() {
  const queryClient = useQueryClient()
  
  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: UpdateReservationData }) => 
      updateReservation(id, data),
    onSuccess: (data) => {
      toast.success('Reservasi berhasil diperbarui')
      // Invalidate relevant queries
      queryClient.invalidateQueries({ queryKey: reservationKeys.lists() })
      queryClient.invalidateQueries({ queryKey: reservationKeys.paginatedLists() })
      queryClient.invalidateQueries({ queryKey: reservationKeys.detail(data.id) })
      queryClient.invalidateQueries({ queryKey: reservationKeys.stats(data.studio_id) })
    },
    onError: (error: Error) => {
      toast.error(`Gagal memperbarui reservasi: ${error.message}`)
    },
  })
}

// Update reservation status mutation
export function useUpdateReservationStatus() {
  const queryClient = useQueryClient()
  
  return useMutation({
    mutationFn: ({ id, status }: { id: string; status: ReservationStatus }) => 
      updateReservationStatus(id, status),
    onSuccess: (data) => {
      const statusMessages = {
        pending: 'Reservasi dikembalikan ke status pending',
        confirmed: 'Reservasi dikonfirmasi',
        in_progress: 'Reservasi dimulai',
        completed: 'Reservasi diselesaikan',
        cancelled: 'Reservasi dibatalkan'
      }
      toast.success(statusMessages[data.status] || 'Status reservasi berhasil diperbarui')
      
      // Invalidate relevant queries
      queryClient.invalidateQueries({ queryKey: reservationKeys.lists() })
      queryClient.invalidateQueries({ queryKey: reservationKeys.paginatedLists() })
      queryClient.invalidateQueries({ queryKey: reservationKeys.detail(data.id) })
      queryClient.invalidateQueries({ queryKey: reservationKeys.stats(data.studio_id) })
    },
    onError: (error: Error) => {
      toast.error(`Gagal mengubah status reservasi: ${error.message}`)
    },
  })
}

// Delete reservation mutation
export function useDeleteReservation() {
  const queryClient = useQueryClient()
  
  return useMutation({
    mutationFn: deleteReservation,
    onSuccess: () => {
      toast.success('Reservasi berhasil dihapus')
      // Invalidate all reservation queries
      queryClient.invalidateQueries({ queryKey: reservationKeys.all })
    },
    onError: (error: Error) => {
      toast.error(`Gagal menghapus reservasi: ${error.message}`)
    },
  })
}