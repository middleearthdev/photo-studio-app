'use client'

import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { toast } from 'sonner'
import {
  getPaginatedPayments,
  getPaymentById,
  createPayment,
  updatePayment,
  updatePaymentStatus,
  deletePayment,
  getPaymentStats,
  getPaymentMethods,
  completePaymentAction,
  type CreatePaymentData,
  type UpdatePaymentData,
  type PaymentStatus
} from '@/actions/payments'
import { PaginationParams } from '@/lib/constants/pagination'
import { reservationKeys } from './use-reservations'

// Query keys
export const paymentKeys = {
  all: ['payments'] as const,
  lists: () => [...paymentKeys.all, 'list'] as const,
  paginatedLists: () => [...paymentKeys.all, 'paginated'] as const,
  paginatedList: (studioId: string, params: any) => [...paymentKeys.paginatedLists(), { studioId, ...params }] as const,
  details: () => [...paymentKeys.all, 'detail'] as const,
  detail: (id: string) => [...paymentKeys.details(), id] as const,
  stats: (studioId: string) => [...paymentKeys.all, 'stats', studioId] as const,
  methods: (studioId: string) => [...paymentKeys.all, 'methods', studioId] as const,
}

// ===== PAYMENT HOOKS =====

// Get paginated payments
export function usePaginatedPayments(
  studioId: string,
  params: PaginationParams & {
    search?: string
    status?: string
    payment_type?: string
    date_from?: string
    date_to?: string
    payment_method?: string
  } = {}
) {
  return useQuery({
    queryKey: paymentKeys.paginatedList(studioId, params),
    queryFn: () => getPaginatedPayments(studioId, params as any),
    enabled: !!studioId,
    staleTime: 30 * 1000, // 30 seconds
  })
}

// Get payment by ID
export function usePayment(id?: string) {
  return useQuery({
    queryKey: paymentKeys.detail(id!),
    queryFn: () => getPaymentById(id!),
    enabled: !!id,
  })
}

// Get payment statistics
export function usePaymentStats(studioId?: string) {
  return useQuery({
    queryKey: paymentKeys.stats(studioId!),
    queryFn: () => getPaymentStats(studioId!),
    enabled: !!studioId,
    staleTime: 2 * 60 * 1000, // 2 minutes
  })
}

// Get payment methods
export function usePaymentMethods(studioId?: string) {
  return useQuery({
    queryKey: paymentKeys.methods(studioId!),
    queryFn: () => getPaymentMethods(studioId!),
    enabled: !!studioId,
    staleTime: 10 * 60 * 1000, // 10 minutes
  })
}

// Create payment mutation
export function useCreatePayment() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: createPayment,
    onSuccess: (data) => {
      toast.success('Payment berhasil dibuat')
      // Invalidate relevant queries
      queryClient.invalidateQueries({ queryKey: paymentKeys.lists() })
      queryClient.invalidateQueries({ queryKey: paymentKeys.paginatedLists() })
      // Note: stats will be invalidated by parent component refetch
    },
    onError: (error: Error) => {
      toast.error(`Gagal membuat payment: ${error.message}`)
    },
  })
}

// Update payment mutation
export function useUpdatePayment() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: UpdatePaymentData }) =>
      updatePayment(id, data),
    onSuccess: (data) => {
      toast.success('Payment berhasil diperbarui')
      // Invalidate relevant queries
      queryClient.invalidateQueries({ queryKey: paymentKeys.lists() })
      queryClient.invalidateQueries({ queryKey: paymentKeys.paginatedLists() })
      queryClient.invalidateQueries({ queryKey: paymentKeys.detail(data.id) })
      // Note: stats will be invalidated by parent component refetch
    },
    onError: (error: Error) => {
      toast.error(`Gagal memperbarui payment: ${error.message}`)
    },
  })
}

// Update payment status mutation
export function useUpdatePaymentStatus() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: ({ id, status }: { id: string; status: PaymentStatus }) =>
      updatePaymentStatus(id, status),
    onSuccess: (data) => {
      const statusMessages = {
        pending: 'Payment dikembalikan ke status pending',
        paid: 'Payment berhasil dikonfirmasi',
        failed: 'Payment ditandai sebagai gagal',
        partial: 'Payment ditandai sebagai partial',
        cancelled: 'Payment dibatalkan',
        refunded: 'Payment di-refund'
      }
      toast.success(statusMessages[data.status] || 'Status payment berhasil diperbarui')

      // Invalidate relevant queries
      queryClient.invalidateQueries({ queryKey: paymentKeys.lists() })
      queryClient.invalidateQueries({ queryKey: paymentKeys.paginatedLists() })
      queryClient.invalidateQueries({ queryKey: paymentKeys.detail(data.id) })
      // Note: stats will be invalidated by parent component refetch
    },
    onError: (error: Error) => {
      toast.error(`Gagal mengubah status payment: ${error.message}`)
    },
  })
}

// Delete payment mutation
export function useDeletePayment() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: deletePayment,
    onSuccess: () => {
      toast.success('Payment berhasil dihapus')
      // Invalidate all payment queries
      queryClient.invalidateQueries({ queryKey: paymentKeys.all })
    },
    onError: (error: Error) => {
      toast.error(`Gagal menghapus payment: ${error.message}`)
    },
  })
}

// Complete payment (Lunas) mutation
export function useCompletePayment() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: ({ reservationId, paymentMethodId }: { reservationId: string; paymentMethodId?: string }) =>
      completePaymentAction(reservationId, paymentMethodId),
    onSuccess: (result) => {
      if (result.success) {
        toast.success('Pembayaran berhasil diselesaikan (Lunas)')
        // Invalidate all relevant queries
        queryClient.invalidateQueries({ queryKey: paymentKeys.all })
        queryClient.invalidateQueries({ queryKey: reservationKeys.all }) // Also invalidate reservations
      } else {
        toast.error(result.error || 'Gagal menyelesaikan pembayaran')
      }
    },
    onError: (error: Error) => {
      toast.error(`Gagal menyelesaikan pembayaran: ${error.message}`)
    },
  })
}