'use client'

import { useMutation } from '@tanstack/react-query'
import { toast } from 'sonner'

interface CreateXenditPaymentParams {
  reservationId: string
  paymentType: 'dp' | 'remaining' | 'full'
  paymentMethod?: string
}

interface CreateXenditPaymentResponse {
  success: boolean
  data?: {
    payment: any
    invoice_url: string | null
  }
  error?: string
}

export function useCreateXenditPayment() {
  console.log('useCreateXenditPayment')
  return useMutation({
    mutationFn: async ({ reservationId, paymentType, paymentMethod }: CreateXenditPaymentParams) => {
      const response = await fetch('/api/payments/xendit', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          reservationId,
          paymentType,
          paymentMethod,
        }),
      })

      const data: CreateXenditPaymentResponse = await response.json()
      console.log(data)

      if (!response.ok || !data.success) {
        throw new Error(data.error || 'Gagal membuat pembayaran')
      }

      return data
    },
    onSuccess: (data) => {
      toast.success('Pembayaran berhasil dibuat')
      if (data.data?.invoice_url) {
        // For Xendit payments, we might want to redirect or provide instructions
        toast.info('Mengalihkan ke halaman pembayaran...')
      } else {
        // For manual payments, show instructions
        toast.info('Catatan pembayaran dibuat. Silakan ikuti instruksi pembayaran manual.')
      }
    },
    onError: (error: Error) => {
      toast.error(`Gagal membuat pembayaran: ${error.message}`)
    },
  })
}