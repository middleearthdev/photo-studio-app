'use client'

import { useState, useEffect } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { motion } from 'framer-motion'
import { 
  CreditCard,
  Shield,
  Clock,
  ExternalLink,
  Loader2,
  CheckCircle,
  AlertCircle
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'

interface FinalBookingData {
  reservation: {
    id: string
    booking_code: string
    total_amount: number
    dp_amount: number
    customer?: {
      full_name: string
      phone: string
      email: string
    }
  }
  customer: {
    full_name: string
    phone: string
    email: string
  }
  paymentMethod: string
  totalPrice: number
  dpAmount: number
}

const paymentMethodInfo = {
  midtrans: {
    name: 'Kartu Kredit/Debit',
    description: 'Pembayaran aman dengan Midtrans',
    icon: CreditCard,
    redirectText: 'Anda akan diarahkan ke halaman pembayaran Midtrans'
  },
  gopay: {
    name: 'GoPay',
    description: 'Pembayaran digital GoPay',
    icon: CreditCard,
    redirectText: 'Anda akan diarahkan ke aplikasi GoPay atau scan QR code'
  },
  ovo: {
    name: 'OVO',
    description: 'Pembayaran digital OVO',
    icon: CreditCard,
    redirectText: 'Anda akan diarahkan ke aplikasi OVO atau scan QR code'
  },
  dana: {
    name: 'DANA',
    description: 'Pembayaran digital DANA',
    icon: CreditCard,
    redirectText: 'Anda akan diarahkan ke aplikasi DANA atau scan QR code'
  },
  bank_transfer: {
    name: 'Transfer Bank',
    description: 'Transfer manual ke rekening studio',
    icon: CreditCard,
    redirectText: 'Anda akan melihat detail rekening untuk transfer'
  }
}

export default function PaymentPage() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const paymentMethod = searchParams.get('method') || 'midtrans'
  const bookingCode = searchParams.get('booking')
  
  const [bookingData, setBookingData] = useState<FinalBookingData | null>(null)
  const [isProcessing, setIsProcessing] = useState(false)
  const [countdown, setCountdown] = useState(10)

  useEffect(() => {
    const storedData = localStorage.getItem('finalBookingData')
    if (storedData) {
      setBookingData(JSON.parse(storedData))
    } else {
      router.push('/packages')
    }
  }, [router])

  useEffect(() => {
    if (countdown > 0 && !isProcessing) {
      const timer = setTimeout(() => setCountdown(countdown - 1), 1000)
      return () => clearTimeout(timer)
    } else if (countdown === 0 && !isProcessing) {
      handlePayment()
    }
  }, [countdown, isProcessing])

  if (!bookingData) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-slate-600">Memuat halaman pembayaran...</p>
        </div>
      </div>
    )
  }

  const formatPrice = (price: number) => {
    return new Intl.NumberFormat('id-ID', {
      style: 'currency',
      currency: 'IDR',
      minimumFractionDigits: 0
    }).format(price)
  }

  const handlePayment = async () => {
    setIsProcessing(true)
    
    try {
      // Simulate payment gateway integration
      await new Promise(resolve => setTimeout(resolve, 2000))
      
      // Simulate payment gateway response
      const paymentResponse = {
        success: true,
        paymentUrl: generateMockPaymentUrl(paymentMethod, bookingData.reservation?.booking_code || 'UNKNOWN', bookingData.reservation?.dp_amount || bookingData.dpAmount),
        transactionId: `TXN-${Date.now()}`
      }
      
      if (paymentResponse.success && paymentResponse.paymentUrl) {
        // Store transaction data
        const transactionData = {
          ...bookingData,
          transactionId: paymentResponse.transactionId,
          paymentUrl: paymentResponse.paymentUrl,
          status: 'pending_payment',
          createdAt: new Date().toISOString()
        }
        
        localStorage.setItem('transactionData', JSON.stringify(transactionData))
        
        // Redirect to payment gateway (in real app, this would be the actual gateway)
        // For demo purposes, we'll redirect to our success page after a delay
        if (paymentMethod === 'bank_transfer') {
          router.push('/booking/bank-transfer')
        } else {
          // Simulate external payment gateway redirect
          setTimeout(() => {
            router.push('/booking/success?payment=completed')
          }, 3000)
        }
      } else {
        throw new Error('Payment initialization failed')
      }
      
    } catch (error) {
      setIsProcessing(false)
      // In real app, show error message
      console.error('Payment error:', error)
    }
  }

  const generateMockPaymentUrl = (method: string, bookingId: string, amount: number) => {
    const baseUrls = {
      midtrans: `https://app.sandbox.midtrans.com/snap/v2/vtweb/${bookingId}`,
      gopay: `https://simulator.sandbox.midtrans.com/gopay/partner/app/payment-pin?id=${bookingId}`,
      ovo: `https://api.ovo.id/payment/${bookingId}`,
      dana: `https://m.dana.id/m/portal/payment?id=${bookingId}`,
      bank_transfer: `/booking/bank-transfer?id=${bookingId}`
    }
    return baseUrls[method as keyof typeof baseUrls] || baseUrls.midtrans
  }

  const methodInfo = paymentMethodInfo[paymentMethod as keyof typeof paymentMethodInfo] || paymentMethodInfo.midtrans
  const Icon = methodInfo.icon

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50/30 to-slate-100">
      <div className="max-w-2xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          className="space-y-8"
        >
          {/* Header */}
          <div className="text-center">
            <div className="w-16 h-16 bg-gradient-to-r from-blue-600 to-blue-700 rounded-full flex items-center justify-center mx-auto mb-4">
              <CreditCard className="h-8 w-8 text-white" />
            </div>
            <h1 className="text-3xl font-bold text-slate-900 mb-2">Pembayaran</h1>
            <p className="text-slate-600">
              Booking ID: <span className="font-mono font-medium">{bookingData.reservation?.booking_code || bookingCode}</span>
            </p>
          </div>

          {/* Payment Method Info */}
          <Card className="bg-white/90 backdrop-blur-sm border-0 shadow-xl">
            <CardHeader className="text-center pb-4">
              <div className="flex items-center justify-center gap-3 mb-4">
                <Icon className="h-8 w-8 text-blue-600" />
                <div>
                  <CardTitle className="text-xl">{methodInfo.name}</CardTitle>
                  <CardDescription>{methodInfo.description}</CardDescription>
                </div>
              </div>
              
              <div className="text-3xl font-bold text-blue-600 mb-2">
                {formatPrice(bookingData.reservation?.dp_amount || bookingData.dpAmount)}
              </div>
              <p className="text-sm text-slate-600">
                DP untuk booking {bookingData.reservation?.customer?.full_name || bookingData.customer?.full_name}
              </p>
            </CardHeader>
          </Card>

          {/* Security Badge */}
          <div className="flex items-center justify-center gap-2 text-sm text-slate-600">
            <Shield className="h-4 w-4 text-green-500" />
            <span>Pembayaran diamankan dengan enkripsi SSL 256-bit</span>
          </div>

          {!isProcessing ? (
            /* Countdown and Manual Trigger */
            <Card className="bg-white/90 backdrop-blur-sm border-0 shadow-lg">
              <CardContent className="pt-6 text-center">
                <div className="space-y-4">
                  <div className="flex items-center justify-center gap-2 text-slate-600">
                    <Clock className="h-5 w-5" />
                    <span>Otomatis mengarahkan dalam {countdown} detik</span>
                  </div>
                  
                  <div className="space-y-3">
                    <Button
                      onClick={handlePayment}
                      className="w-full bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800"
                      size="lg"
                    >
                      Bayar Sekarang
                      <ExternalLink className="h-5 w-5 ml-2" />
                    </Button>
                    
                    <p className="text-xs text-slate-500">
                      {methodInfo.redirectText}
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
          ) : (
            /* Processing State */
            <Card className="bg-white/90 backdrop-blur-sm border-0 shadow-lg">
              <CardContent className="pt-6 text-center">
                <div className="space-y-4">
                  <div className="flex items-center justify-center">
                    <Loader2 className="h-12 w-12 text-blue-600 animate-spin" />
                  </div>
                  
                  <div>
                    <h3 className="text-lg font-semibold text-slate-900 mb-2">
                      Memproses Pembayaran...
                    </h3>
                    <p className="text-slate-600">
                      Mohon tunggu, Anda akan segera diarahkan ke halaman pembayaran
                    </p>
                  </div>
                  
                  <div className="bg-blue-50 p-4 rounded-lg">
                    <p className="text-sm text-blue-700">
                      <strong>Jangan tutup atau refresh halaman ini</strong> selama proses berlangsung
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Important Notes */}
          <Card className="bg-amber-50 border-amber-200">
            <CardContent className="pt-6">
              <div className="flex items-start gap-3">
                <AlertCircle className="h-5 w-5 text-amber-600 mt-0.5 flex-shrink-0" />
                <div className="space-y-2 text-sm text-amber-800">
                  <p className="font-medium">Penting:</p>
                  <ul className="space-y-1 list-disc list-inside">
                    <li>Selesaikan pembayaran dalam 15 menit</li>
                    <li>Simpan bukti pembayaran untuk konfirmasi</li>
                    <li>Hubungi customer service jika ada kendala</li>
                    <li>Booking akan dikonfirmasi setelah pembayaran berhasil</li>
                  </ul>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Cancel Button */}
          <div className="text-center">
            <Button
              variant="ghost"
              onClick={() => router.push('/packages')}
              className="text-slate-600 hover:text-slate-900"
            >
              Batalkan Booking
            </Button>
          </div>
        </motion.div>
      </div>
    </div>
  )
}