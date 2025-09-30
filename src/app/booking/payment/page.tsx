'use client'

export const dynamic = 'force-dynamic'

import { useState, useEffect, Suspense } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { motion } from 'framer-motion'
import {
  CreditCard,
  Shield,
  Clock,
  ExternalLink,
  Loader2,
  AlertCircle
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { toast } from 'sonner'
import { shouldDisplayFeesToCustomers } from '@/lib/config/fee-config'

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
  paymentMethodDetails?: {
    id: string
    name: string
    type: string
    fee_type?: string
    fee_percentage: number
    fee_amount?: number
  }
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
  bank_transfer: {
    name: 'Transfer Bank',
    description: 'Transfer manual ke rekening studio',
    icon: CreditCard,
    redirectText: 'Anda akan melihat detail rekening untuk transfer'
  },
  virtual_account: {
    name: 'Transfer VA',
    description: 'Transfer Virtual Account',
    icon: CreditCard,
    redirectText: 'Anda akan di arahkan ke halaman pembayaran VA'
  },
  e_wallet: {
    name: 'E-Wallet',
    description: 'Pembayaran digital E-Wallet',
    icon: CreditCard,
    redirectText: 'Anda akan di arahkan ke halaman pembayaran E-Wallet'
  },
  qr_code: {
    name: 'QR Code',
    description: 'Pembayaran QR Code',
    icon: CreditCard,
    redirectText: 'Anda akan di arahkan ke halaman pembayaran QR Code'
  }
}

function PaymentPageContent() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const paymentMethod = searchParams.get('method') || 'midtrans'
  const bookingCode = searchParams.get('booking')
  const paymentMethodId = searchParams.get('payment_method_id')


  const [bookingData, setBookingData] = useState<FinalBookingData | null>(null)
  const [isProcessing, setIsProcessing] = useState(false)
  const [countdown, setCountdown] = useState(10)
  const [hasError, setHasError] = useState(false)
  const [retryCount, setRetryCount] = useState(0)
  const [errorMessage, setErrorMessage] = useState('')

  // Calculate fee based on payment method (if available)
  const calculatePaymentFee = () => {
    if (!bookingData || !bookingData.paymentMethodDetails) return 0;

    const paymentMethod = bookingData.paymentMethodDetails;
    const dpAmount = bookingData.reservation?.dp_amount || bookingData.dpAmount || 0;

    if (paymentMethod.fee_type === 'fixed') {
      return paymentMethod.fee_amount || 0;
    } else {
      // Percentage fee
      return Math.round(dpAmount * (paymentMethod.fee_percentage || 0) / 100);
    }
  };

  const getDisplayTotal = () => {
    if (!bookingData) return 0;
    const baseAmount = bookingData.reservation?.dp_amount || bookingData.dpAmount || 0;
    const fee = calculatePaymentFee();
    return process.env.NEXT_PUBLIC_CUSTOMER_PAYS_FEES === 'true' ? baseAmount + fee : baseAmount;
  };

  useEffect(() => {
    const storedData = localStorage.getItem('finalBookingData')
    if (storedData) {
      setBookingData(JSON.parse(storedData))
    } else {
      router.push('/packages')
    }
  }, [router])

  useEffect(() => {
    // Don't auto-process if there's been an error or we've exceeded retry limit
    if (hasError || retryCount >= 3) {
      return
    }

    if (countdown > 0 && !isProcessing) {
      const timer = setTimeout(() => setCountdown(countdown - 1), 1000)
      return () => clearTimeout(timer)
    } else if (countdown === 0 && !isProcessing) {
      handlePayment()
    }
  }, [countdown, isProcessing, hasError, retryCount])

  if (!bookingData) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#00052e] mx-auto mb-4"></div>
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
    setHasError(false)
    setErrorMessage('')

    try {
      // Create payment through our API (which will use Xendit for Xendit payments)
      const response = await fetch('/api/payments/xendit', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          reservationId: bookingData.reservation?.booking_code || bookingCode,
          paymentType: 'dp', // We're always doing DP payments on this page
          paymentMethod: paymentMethod === 'midtrans' ? 'BANK_TRANSFER' : paymentMethod.toUpperCase(),
          paymentMethodId: paymentMethodId,
        }),
      })

      const result = await response.json()

      if (!response.ok || !result.success) {
        throw new Error(result.error || 'Gagal membuat pembayaran')
      }

      // Store transaction data
      const transactionData = {
        ...bookingData,
        transactionId: result.data.payment.id,
        paymentUrl: result.data.invoice_url,
        status: 'pending_payment',
        createdAt: new Date().toISOString()
      }

      localStorage.setItem('transactionData', JSON.stringify(transactionData))

      if (result.data.invoice_url) {
        // Redirect to Xendit payment page
        window.location.href = result.data.invoice_url
      } else {
        console.error('Payment error: No invoice URL for Xendit payment')
        throw new Error('Payment gateway tidak tersedia')
      }
    } catch (error) {
      const newRetryCount = retryCount + 1
      setRetryCount(newRetryCount)
      setIsProcessing(false)
      setHasError(true)

      const errorMsg = error instanceof Error ? error.message : 'Error tidak diketahui'
      setErrorMessage(errorMsg)

      if (newRetryCount >= 3) {
        toast.error(`Pembayaran gagal setelah 3 kali percobaan: ${errorMsg}`)
      } else {
        toast.error(`Pembayaran gagal (Percobaan ${newRetryCount}/3): ${errorMsg}`)
      }

      console.error('Payment error:', error)
    }
  }

  const handleRetry = () => {
    setHasError(false)
    setErrorMessage('')
    setCountdown(5) // Shorter countdown for retry
    setIsProcessing(false)
  }


  const methodInfo = paymentMethodInfo[paymentMethod as keyof typeof paymentMethodInfo] || paymentMethodInfo.midtrans
  const Icon = methodInfo.icon

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50/30 to-slate-100">
      <div className="max-w-2xl mx-auto px-4 sm:px-6 lg:px-8 py-8 sm:py-12">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          className="space-y-6 sm:space-y-8"
        >
          {/* Header */}
          <div className="text-center">
            <div className="w-12 h-12 sm:w-16 sm:h-16 bg-gradient-to-r from-[#00052e] to-[#b0834d] rounded-full flex items-center justify-center mx-auto mb-3 sm:mb-4">
              <CreditCard className="h-6 w-6 sm:h-8 sm:w-8 text-white" />
            </div>
            <h1 className="text-2xl sm:text-3xl font-bold text-[#00052e] mb-1 sm:mb-2">Pembayaran</h1>
            <p className="text-xs sm:text-base text-slate-600">
              Booking ID: <span className="font-mono font-medium">{bookingData.reservation?.booking_code || bookingCode}</span>
            </p>
          </div>

          {/* Payment Method Info */}
          <Card className="bg-white/90 backdrop-blur-sm border-0 shadow-xl">
            <CardHeader className="text-center pb-3 sm:pb-4">
              <div className="flex items-center justify-center gap-2 sm:gap-3 mb-3 sm:mb-4">
                <Icon className="h-6 w-6 sm:h-8 sm:w-8 text-[#00052e]" />
                <div>
                  <CardTitle className="text-lg sm:text-xl text-[#00052e]">{methodInfo.name}</CardTitle>
                  <CardDescription className="text-xs sm:text-sm">{methodInfo.description}</CardDescription>
                </div>
              </div>

              <div className="text-2xl sm:text-3xl font-bold text-[#b0834d] mb-1 sm:mb-2">
                {shouldDisplayFeesToCustomers() && calculatePaymentFee() > 0 ? (
                  <>{formatPrice(getDisplayTotal())} <span className="text-base sm:text-lg font-normal text-red-600">(+{formatPrice(calculatePaymentFee())} fee)</span></>
                ) : (
                  formatPrice(bookingData.reservation?.dp_amount || bookingData.dpAmount)
                )}
              </div>
              <p className="text-xs sm:text-sm text-slate-600">
                DP untuk booking {bookingData.reservation?.customer?.full_name || bookingData.customer?.full_name}
              </p>
            </CardHeader>
          </Card>

          {/* Security Badge */}
          <div className="flex items-center justify-center gap-1.5 sm:gap-2 text-xs sm:text-sm text-slate-600">
            <Shield className="h-3 w-3 sm:h-4 sm:w-4 text-green-500" />
            <span>Pembayaran diamankan dengan enkripsi SSL 256-bit</span>
          </div>

          {hasError && retryCount >= 3 ? (
            /* Maximum Retries Reached */
            <Card className="bg-red-50 border-red-200">
              <CardContent className="pt-4 sm:pt-6 text-center">
                <div className="space-y-3 sm:space-y-4">
                  <div className="flex items-center justify-center">
                    <AlertCircle className="h-8 w-8 sm:h-12 sm:w-12 text-red-600" />
                  </div>

                  <div>
                    <h3 className="text-base sm:text-lg font-semibold text-red-900 mb-1 sm:mb-2">
                      Pembayaran Gagal
                    </h3>
                    <p className="text-xs sm:text-sm text-red-700 mb-3 sm:mb-4">
                      Maaf, pembayaran tidak dapat diproses setelah 3 kali percobaan.
                    </p>
                    {errorMessage && (
                      <div className="bg-red-100 border border-red-300 rounded-lg p-2 sm:p-3 mb-3 sm:mb-4">
                        <p className="text-xs sm:text-sm text-red-800">
                          <strong>Error:</strong> {errorMessage}
                        </p>
                      </div>
                    )}
                  </div>

                  <div className="space-y-2 sm:space-y-3">
                    <Button
                      onClick={() => router.push('/packages')}
                      variant="destructive"
                      className="w-full text-xs sm:text-sm py-2 sm:py-3"
                      size="lg"
                    >
                      Kembali ke Paket
                    </Button>

                    <p className="text-xs text-red-600">
                      Silakan hubungi customer service untuk bantuan lebih lanjut
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
          ) : hasError ? (
            /* Error with Retry Option */
            <Card className="bg-amber-50 border-amber-200">
              <CardContent className="pt-4 sm:pt-6 text-center">
                <div className="space-y-3 sm:space-y-4">
                  <div className="flex items-center justify-center">
                    <AlertCircle className="h-8 w-8 sm:h-12 sm:w-12 text-amber-600" />
                  </div>

                  <div>
                    <h3 className="text-base sm:text-lg font-semibold text-amber-900 mb-1 sm:mb-2">
                      Terjadi Kesalahan
                    </h3>
                    <p className="text-xs sm:text-sm text-amber-700 mb-3 sm:mb-4">
                      Pembayaran gagal diproses. Percobaan {retryCount}/3
                    </p>
                    {errorMessage && (
                      <div className="bg-amber-100 border border-amber-300 rounded-lg p-2 sm:p-3 mb-3 sm:mb-4">
                        <p className="text-xs sm:text-sm text-amber-800">
                          <strong>Error:</strong> {errorMessage}
                        </p>
                      </div>
                    )}
                  </div>

                  <div className="space-y-2 sm:space-y-3">
                    <Button
                      onClick={handleRetry}
                      className="w-full bg-gradient-to-r from-[#00052e] to-[#b0834d] hover:from-[#00052e]/90 hover:to-[#b0834d]/90 text-xs sm:text-sm py-2 sm:py-3"
                      size="lg"
                    >
                      Coba Lagi ({3 - retryCount} percobaan tersisa)
                    </Button>

                    <Button
                      variant="ghost"
                      onClick={() => router.push('/packages')}
                      className="w-full text-xs sm:text-sm py-2 sm:py-3"
                    >
                      Batalkan
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          ) : !isProcessing ? (
            /* Countdown and Manual Trigger */
            <Card className="bg-white/90 backdrop-blur-sm border-0 shadow-lg">
              <CardContent className="pt-4 sm:pt-6 text-center">
                <div className="space-y-3 sm:space-y-4">
                  <div className="flex items-center justify-center gap-1.5 sm:gap-2 text-slate-600 text-xs sm:text-sm">
                    <Clock className="h-4 w-4 sm:h-5 sm:w-5" />
                    <span>Otomatis mengarahkan dalam {countdown} detik</span>
                  </div>

                  <div className="space-y-2 sm:space-y-3">
                    <Button
                      onClick={handlePayment}
                      className="w-full bg-gradient-to-r from-[#00052e] to-[#b0834d] hover:from-[#00052e]/90 hover:to-[#b0834d]/90 text-xs sm:text-base py-2.5 sm:py-6"
                      size="lg"
                    >
                      {shouldDisplayFeesToCustomers() && calculatePaymentFee() > 0
                        ? `Bayar ${formatPrice(getDisplayTotal())} (Termasuk Fee)`
                        : 'Bayar Sekarang'}
                      <ExternalLink className="h-4 w-4 sm:h-5 sm:w-5 ml-1.5 sm:ml-2" />
                    </Button>

                    <p className="text-xs text-slate-500">
                      {methodInfo.redirectText}
                    </p>
                  </div>

                  {retryCount > 0 && (
                    <div className="text-xs text-amber-600">
                      Percobaan ke-{retryCount + 1}
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          ) : (
            /* Processing State */
            <Card className="bg-white/90 backdrop-blur-sm border-0 shadow-lg">
              <CardContent className="pt-4 sm:pt-6 text-center">
                <div className="space-y-3 sm:space-y-4">
                  <div className="flex items-center justify-center">
                    <Loader2 className="h-8 w-8 sm:h-12 sm:w-12 text-[#00052e] animate-spin" />
                  </div>

                  <div>
                    <h3 className="text-base sm:text-lg font-semibold text-[#00052e] mb-1 sm:mb-2">
                      Memproses Pembayaran...
                    </h3>
                    <p className="text-xs sm:text-sm text-slate-600">
                      Mohon tunggu, Anda akan segera diarahkan ke halaman pembayaran
                    </p>
                  </div>

                  <div className="bg-[#00052e]/5 p-3 sm:p-4 rounded-lg">
                    <p className="text-xs sm:text-sm text-[#00052e]">
                      <strong>Jangan tutup atau refresh halaman ini</strong> selama proses berlangsung
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Important Notes */}
          <Card className="bg-amber-50 border-amber-200">
            <CardContent className="pt-4 sm:pt-6">
              <div className="flex items-start gap-2 sm:gap-3">
                <AlertCircle className="h-4 w-4 sm:h-5 sm:w-5 text-amber-600 mt-0.5 flex-shrink-0" />
                <div className="space-y-1.5 sm:space-y-2 text-xs sm:text-sm text-amber-800">
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
              className="text-slate-600 hover:text-[#00052e] text-xs sm:text-sm py-1.5 sm:py-2"
            >
              Batalkan Booking
            </Button>
          </div>
        </motion.div>
      </div>
    </div>
  )
}

export default function PaymentPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#00052e] mx-auto mb-4"></div>
          <p className="text-slate-600">Memuat halaman pembayaran...</p>
        </div>
      </div>
    }>
      <PaymentPageContent />
    </Suspense>
  )
}