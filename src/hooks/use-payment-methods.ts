'use client'

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import {
  getPaymentMethods,
  getAllPaymentMethods,
  createPaymentMethod,
  updatePaymentMethod,
  deletePaymentMethod,
  togglePaymentMethodStatus
} from '@/actions/payments'
import type {
  PaymentMethod,
  CreatePaymentMethodData,
  UpdatePaymentMethodData
} from '@/actions/payments'
import { toast } from 'sonner'

// Hook for admin - gets all payment methods (active and inactive)
export function usePaymentMethods(studioId: string) {
  return useQuery({
    queryKey: ['payment-methods', studioId],
    queryFn: () => getAllPaymentMethods(studioId),
    enabled: !!studioId,
    staleTime: 5 * 60 * 1000, // 5 minutes
  })
}

// Hook for booking - gets only active payment methods from gateway providers (Midtrans/Xendit)
export function useActivePaymentMethods(studioId: string) {
  return useQuery({
    queryKey: ['active-payment-methods', studioId],
    queryFn: async () => {
      const allMethods = await getPaymentMethods(studioId)
      // Filter for customer booking: only Midtrans and Xendit providers
      return allMethods.filter(method =>
        method.provider !== 'Cash'
      )
    },
    enabled: !!studioId,
    staleTime: 5 * 60 * 1000, // 5 minutes
  })
}

export function useActivePaymentManualMethods(studioId: string) {
  return useQuery({
    queryKey: ['active-manual-payment-methods', studioId],
    queryFn: async () => {
      const allMethods = await getPaymentMethods(studioId)
      // Filter for customer booking: only Midtrans and Xendit providers
      return allMethods.filter(method =>
        method.provider !== 'Midtrans' && method.provider !== 'Xendit'
      )
    },
    enabled: !!studioId,
    staleTime: 5 * 60 * 1000, // 5 minutes
  })
}

// Hook for creating payment methods
export function useCreatePaymentMethod() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: createPaymentMethod,
    onSuccess: (data) => {
      toast.success('Payment method created successfully')
      queryClient.invalidateQueries({ queryKey: ['payment-methods', data.studio_id] })
      queryClient.invalidateQueries({ queryKey: ['active-payment-methods', data.studio_id] })
      queryClient.invalidateQueries({ queryKey: ['active-manual-payment-methods', data.studio_id] })

    },
    onError: (error: Error) => {
      toast.error(error.message || 'Failed to create payment method')
    }
  })
}

// Hook for updating payment methods
export function useUpdatePaymentMethod() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: ({ id, data }: { id: string, data: UpdatePaymentMethodData }) =>
      updatePaymentMethod(id, data),
    onSuccess: (data) => {
      toast.success('Payment method updated successfully')
      queryClient.invalidateQueries({ queryKey: ['payment-methods', data.studio_id] })
      queryClient.invalidateQueries({ queryKey: ['active-payment-methods', data.studio_id] })
      queryClient.invalidateQueries({ queryKey: ['active-manual-payment-methods', data.studio_id] })
    },
    onError: (error: Error) => {
      toast.error(error.message || 'Failed to update payment method')
    }
  })
}

// Hook for deleting payment methods
export function useDeletePaymentMethod() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: deletePaymentMethod,
    onSuccess: () => {
      toast.success('Payment method deleted successfully')
      queryClient.invalidateQueries({ queryKey: ['payment-methods'] })
      queryClient.invalidateQueries({ queryKey: ['active-payment-methods'] })
    },
    onError: (error: Error) => {
      toast.error(error.message || 'Failed to delete payment method')
    }
  })
}

// Hook for toggling payment method status
export function useTogglePaymentMethodStatus() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: ({ id, isActive }: { id: string, isActive: boolean }) =>
      togglePaymentMethodStatus(id, isActive),
    onSuccess: (data) => {
      toast.success('Payment method status updated successfully')
      queryClient.invalidateQueries({ queryKey: ['payment-methods', data.studio_id] })
      queryClient.invalidateQueries({ queryKey: ['active-payment-methods', data.studio_id] })
      queryClient.invalidateQueries({ queryKey: ['active-manual-payment-methods', data.studio_id] })
    },
    onError: (error: Error) => {
      toast.error(error.message || 'Failed to update payment method status')
    }
  })
}

// Helper function to get payment method icon based on type and provider
export function getPaymentMethodIcon(type: string, _provider: string, name: string) {
  const lowerName = name.toLowerCase()

  // E-wallet specific icons
  if (type === 'e_wallet') {
    if (lowerName.includes('gopay')) return '💚'
    if (lowerName.includes('ovo')) return '🟣'
    if (lowerName.includes('dana')) return '🔵'
    if (lowerName.includes('shopeepay')) return '🧡'
    return '💳'
  }

  // Bank transfer icons (manual)
  if (type === 'bank_transfer') {
    if (lowerName.includes('bca')) return '🔵'
    if (lowerName.includes('mandiri')) return '🟡'
    if (lowerName.includes('bni')) return '🟠'
    if (lowerName.includes('bri')) return '⚪'
    if (lowerName.includes('cimb')) return '🔴'
    return '🏦'
  }

  // Virtual Account icons (Xendit)
  if (type === 'virtual_account') {
    if (lowerName.includes('bca')) return '💳'
    if (lowerName.includes('mandiri')) return '💳'
    if (lowerName.includes('bni')) return '💳'
    if (lowerName.includes('bri')) return '💳'
    return '🏧'
  }

  // QR Code
  if (type === 'qr_code' || type === 'qris') return '📱'

  // Virtual Account
  if (type === 'va') return '💳'

  // Credit card
  if (type === 'credit_card') return '💳'

  return '💳'
}

// Helper function to format payment method for display
export function formatPaymentMethod(method: PaymentMethod) {
  return {
    id: method.id,
    name: method.name,
    type: method.type,
    provider: method.provider,
    description: getPaymentMethodDescription(method),
    icon: getPaymentMethodIcon(method.type, method.provider || '', method.name),
    fee_type: method.fee_type,
    fee_percentage: method.fee_percentage,
    fee_amount: method.fee_amount,
    account_details: method.account_details,
    xendit_config: method.xendit_config
  }
}

// Helper function to calculate fee based on payment method
export function calculatePaymentFee(method: PaymentMethod, amount: number): number {
  if (method.fee_type === "fixed") {
    return method.fee_amount || 0;
  }
  // Default to percentage calculation
  return Math.round(amount * (method.fee_percentage || 0) / 100);
}

function getPaymentMethodDescription(method: PaymentMethod): string {
  const { type, provider, account_details, name } = method

  if (type === 'bank_transfer' && account_details) {
    const details = account_details as any
    if (details.account_number) {
      return `Transfer ke rekening ${details.account_number}`
    }
    return 'Transfer bank manual'
  }

  if (type === 'virtual_account') {
    if (name.toLowerCase().includes('bca')) return 'Virtual Account BCA via Xendit'
    if (name.toLowerCase().includes('mandiri')) return 'Virtual Account Mandiri via Xendit'
    if (name.toLowerCase().includes('bni')) return 'Virtual Account BNI via Xendit'
    if (name.toLowerCase().includes('bri')) return 'Virtual Account BRI via Xendit'
    return 'Virtual Account via Xendit'
  }

  if (type === 'e_wallet') {
    if (name.toLowerCase().includes('gopay')) return 'Pembayaran digital GoPay'
    if (name.toLowerCase().includes('ovo')) return 'Pembayaran digital OVO'
    if (name.toLowerCase().includes('dana')) return 'Pembayaran digital DANA'
    if (name.toLowerCase().includes('shopeepay')) return 'Pembayaran digital ShopeePay'
    return 'Pembayaran e-wallet'
  }

  if (type === 'qr_code' || type === 'qris') {
    return 'Scan QR code untuk bayar'
  }

  if (type === 'va') {
    return 'Virtual Account'
  }

  if (type === 'credit_card') {
    return 'Kartu kredit/debit'
  }

  return `Pembayaran via ${provider}`
}