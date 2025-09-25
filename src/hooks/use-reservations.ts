'use client'

import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { toast } from 'sonner'
import { 
  createReservationAction,
  getReservationByBookingCodeAction,
  getReservationsAction,
  updateReservationStatusAction,
  updateReservationAction,
  deleteReservationAction,
  type CreateReservationData,
  type Reservation
} from '@/actions/reservations'
import { PaginationParams } from '@/lib/constants/pagination'

// Local types
export type ReservationStatus = 'pending' | 'confirmed' | 'in_progress' | 'completed' | 'cancelled'

export interface UpdateReservationData {
  // Add fields as needed - TODO: Define proper update interface
  [key: string]: any
}

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

// Helper functions to wrap server actions
const getPaginatedReservations = async (
  studioId: string, 
  params: PaginationParams & {
    search?: string
    status?: string
    payment_status?: string
    date_from?: string
    date_to?: string
    booking_type?: 'guest' | 'user' | 'all'
  }
) => {
  const result = await getReservationsAction()
  if (!result.success) {
    throw new Error(result.error || 'Failed to fetch reservations')
  }
  
  // Filter reservations based on parameters
  const reservations = result.data || []
  let filteredReservations = reservations.filter((r: Reservation) => 
    r.studio_id === studioId
  )
  
  // Apply search filter
  if (params.search) {
    const searchLower = params.search.toLowerCase()
    filteredReservations = filteredReservations.filter((r: Reservation) => 
      r.booking_code?.toLowerCase().includes(searchLower) ||
      r.customer?.full_name?.toLowerCase().includes(searchLower) ||
      r.customer?.email?.toLowerCase().includes(searchLower) ||
      r.customer?.phone?.toLowerCase().includes(searchLower) ||
      r.guest_email?.toLowerCase().includes(searchLower) ||
      r.guest_phone?.toLowerCase().includes(searchLower)
    )
  }
  
  // Apply status filter
  if (params.status && params.status !== 'all') {
    filteredReservations = filteredReservations.filter((r: Reservation) => 
      r.status === params.status
    )
  }
  
  // Apply payment status filter
  if (params.payment_status && params.payment_status !== 'all') {
    filteredReservations = filteredReservations.filter((r: Reservation) => 
      r.payment_status === params.payment_status
    )
  }
  
  // Apply booking type filter
  if (params.booking_type && params.booking_type !== 'all') {
    if (params.booking_type === 'guest') {
      filteredReservations = filteredReservations.filter((r: Reservation) => 
        r.is_guest_booking === true
      )
    } else if (params.booking_type === 'user') {
      filteredReservations = filteredReservations.filter((r: Reservation) => 
        r.is_guest_booking === false
      )
    }
  }
  
  // Apply date filters
  if (params.date_from) {
    const fromDate = new Date(params.date_from)
    filteredReservations = filteredReservations.filter((r: Reservation) => 
      new Date(r.reservation_date) >= fromDate
    )
  }
  
  if (params.date_to) {
    const toDate = new Date(params.date_to)
    // Set to end of day
    toDate.setHours(23, 59, 59, 999)
    filteredReservations = filteredReservations.filter((r: Reservation) => 
      new Date(r.reservation_date) <= toDate
    )
  }
  
  // Apply pagination
  const page = params.page || 1
  const pageSize = params.pageSize || 10
  const startIndex = (page - 1) * pageSize
  const endIndex = startIndex + pageSize
  
  const paginatedReservations = filteredReservations.slice(startIndex, endIndex)
  
  return {
    data: paginatedReservations,
    pagination: {
      page,
      pageSize,
      total: filteredReservations.length,
      totalPages: Math.ceil(filteredReservations.length / pageSize)
    }
  }
}

// ===== RESERVATION HOOKS =====

// Get paginated reservations
export function usePaginatedReservations(
  studioId: string,
  params: PaginationParams & {
    search?: string
    status?: string
    payment_status?: string
    date_from?: string
    date_to?: string
    booking_type?: 'guest' | 'user' | 'all'
  } = {}
) {
  return useQuery({
    queryKey: reservationKeys.paginatedList(studioId, params),
    queryFn: () => getPaginatedReservations(studioId, params),
    enabled: !!studioId && studioId !== '',
    staleTime: 30 * 1000, // 30 seconds
  })
}

// Helper function for getting reservation by booking code (since we don't have getById)
const getReservationByBookingCode = async (bookingCode: string) => {
  const result = await getReservationByBookingCodeAction(bookingCode)
  if (!result.success) {
    throw new Error(result.error || 'Failed to fetch reservation')
  }
  return result.data
}

// Mock stats function - TODO: Implement proper stats calculation
const getReservationStats = async (studioId: string) => {
  const result = await getReservationsAction()
  if (!result.success) {
    throw new Error(result.error || 'Failed to fetch reservation stats')
  }
  
  const reservations = result.data || []
  const studioReservations = reservations.filter((r: Reservation) => r.studio_id === studioId)
  
  return {
    total: studioReservations.length,
    pending: studioReservations.filter((r: Reservation) => r.status === 'pending').length,
    completed: studioReservations.filter((r: Reservation) => r.status === 'completed').length,
    thisMonth: studioReservations.length, // TODO: Implement proper monthly calculation
    totalRevenue: studioReservations.reduce((sum: number, r: Reservation) => sum + r.total_amount, 0),
    pendingPayments: studioReservations
      .filter((r: Reservation) => r.payment_status !== 'completed')
      .reduce((sum: number, r: Reservation) => sum + r.remaining_amount, 0)
  }
}

// Get reservation by booking code (since we don't have by ID)
export function useReservation(bookingCode?: string) {
  return useQuery({
    queryKey: reservationKeys.detail(bookingCode!),
    queryFn: () => getReservationByBookingCode(bookingCode!),
    enabled: !!bookingCode,
  })
}

// Get reservation statistics
export function useReservationStats(studioId?: string) {
  return useQuery({
    queryKey: reservationKeys.stats(studioId || ''),
    queryFn: () => getReservationStats(studioId || ''),
    enabled: !!studioId && studioId !== '',
    staleTime: 5 * 60 * 1000, // 5 minutes
  })
}

// Create reservation mutation
export function useCreateReservation() {
  const queryClient = useQueryClient()
  
  return useMutation({
    mutationFn: async (data: CreateReservationData) => {
      const result = await createReservationAction(data)
      if (!result.success) {
        throw new Error(result.error || 'Failed to create reservation')
      }
      return result.data
    },
    onSuccess: (data) => {
      toast.success('Reservasi berhasil dibuat')
      // Invalidate relevant queries
      queryClient.invalidateQueries({ queryKey: reservationKeys.lists() })
      queryClient.invalidateQueries({ queryKey: reservationKeys.paginatedLists() })
      queryClient.invalidateQueries({ queryKey: reservationKeys.stats(data?.reservation?.studio_id || '') })
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
    mutationFn: async ({ id, data }: { id: string; data: UpdateReservationData }) => {
      const result = await updateReservationAction(id, data)
      if (!result.success) {
        throw new Error(result.error || 'Failed to update reservation')
      }
      if (!result.data) {
        throw new Error('No data returned from update operation')
      }
      return result.data
    },
    onSuccess: (data: Reservation) => {
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
    mutationFn: async ({ id, status }: { id: string; status: ReservationStatus }) => {
      const result = await updateReservationStatusAction(id, status)
      if (!result.success) {
        throw new Error(result.error || 'Failed to update reservation status')
      }
      if (!result.data) {
        throw new Error('No data returned from status update operation')
      }
      return result.data
    },
    onSuccess: (data: Reservation) => {
      const statusMessages: Record<ReservationStatus, string> = {
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
    mutationFn: async (id: string) => {
      const result = await deleteReservationAction(id)
      if (!result.success) {
        throw new Error(result.error || 'Failed to delete reservation')
      }
      return result
    },
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