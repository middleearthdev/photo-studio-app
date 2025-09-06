'use client'

import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { toast } from 'sonner'
import { 
  getPaginatedCustomers,
  getCustomerById,
  createCustomer, 
  updateCustomer, 
  deleteCustomer,
  getCustomerStats,
  getCustomerReservations,
  type CreateCustomerData,
  type UpdateCustomerData
} from '@/actions/customers'
import { PaginationParams } from '@/lib/constants/pagination'

// Query keys
export const customerKeys = {
  all: ['customers'] as const,
  lists: () => [...customerKeys.all, 'list'] as const,
  paginatedLists: () => [...customerKeys.all, 'paginated'] as const,
  paginatedList: (params: any) => [...customerKeys.paginatedLists(), params] as const,
  details: () => [...customerKeys.all, 'detail'] as const,
  detail: (id: string) => [...customerKeys.details(), id] as const,
  stats: () => [...customerKeys.all, 'stats'] as const,
  reservations: (id: string) => [...customerKeys.all, 'reservations', id] as const,
}

// ===== CUSTOMER HOOKS =====

// Get paginated customers
export function usePaginatedCustomers(
  params: PaginationParams & {
    type?: 'all' | 'registered' | 'guest'
    search?: string
    studioId?: string
  } = {}
) {
  return useQuery({
    queryKey: customerKeys.paginatedList(params),
    queryFn: () => getPaginatedCustomers(params),
    staleTime: 30 * 1000, // 30 seconds
  })
}

// Get customer by ID
export function useCustomer(id?: string) {
  return useQuery({
    queryKey: customerKeys.detail(id!),
    queryFn: () => getCustomerById(id!),
    enabled: !!id,
  })
}

// Get customer statistics
export function useCustomerStats(studioId?: string) {
  return useQuery({
    queryKey: customerKeys.stats(),
    queryFn: () => getCustomerStats(studioId),
    staleTime: 5 * 60 * 1000, // 5 minutes
  })
}

// Get customer reservations
export function useCustomerReservations(customerId?: string) {
  return useQuery({
    queryKey: customerKeys.reservations(customerId!),
    queryFn: () => getCustomerReservations(customerId!),
    enabled: !!customerId,
    staleTime: 30 * 1000, // 30 seconds
  })
}

// Create customer mutation
export function useCreateCustomer() {
  const queryClient = useQueryClient()
  
  return useMutation({
    mutationFn: createCustomer,
    onSuccess: (data) => {
      toast.success('Customer berhasil dibuat')
      // Invalidate relevant queries
      queryClient.invalidateQueries({ queryKey: customerKeys.lists() })
      queryClient.invalidateQueries({ queryKey: customerKeys.paginatedLists() })
      queryClient.invalidateQueries({ queryKey: customerKeys.stats() })
    },
    onError: (error: Error) => {
      toast.error(`Gagal membuat customer: ${error.message}`)
    },
  })
}

// Update customer mutation
export function useUpdateCustomer() {
  const queryClient = useQueryClient()
  
  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: UpdateCustomerData }) => 
      updateCustomer(id, data),
    onSuccess: (data) => {
      toast.success('Customer berhasil diperbarui')
      // Invalidate relevant queries
      queryClient.invalidateQueries({ queryKey: customerKeys.lists() })
      queryClient.invalidateQueries({ queryKey: customerKeys.paginatedLists() })
      queryClient.invalidateQueries({ queryKey: customerKeys.detail(data.id) })
      queryClient.invalidateQueries({ queryKey: customerKeys.stats() })
    },
    onError: (error: Error) => {
      toast.error(`Gagal memperbarui customer: ${error.message}`)
    },
  })
}

// Delete customer mutation
export function useDeleteCustomer() {
  const queryClient = useQueryClient()
  
  return useMutation({
    mutationFn: deleteCustomer,
    onSuccess: () => {
      toast.success('Customer berhasil dihapus')
      // Invalidate all customer queries
      queryClient.invalidateQueries({ queryKey: customerKeys.all })
    },
    onError: (error: Error) => {
      toast.error(`Gagal menghapus customer: ${error.message}`)
    },
  })
}