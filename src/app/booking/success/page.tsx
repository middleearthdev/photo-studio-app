'use client'

export const dynamic = 'force-dynamic'

import { useState, useEffect, Suspense } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { motion } from 'framer-motion'
import { format } from 'date-fns'
import { id as idLocale } from 'date-fns/locale'
import {
  CheckCircle,
  Calendar,
  Clock,
  MapPin,
  User,
  Phone,
  Mail,
  CreditCard,
  Download,
  Share2,
  Home,
  Camera,
  Gift,
  Printer,
  Copy
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Separator } from '@/components/ui/separator'
import { getReservationByBookingCodeAction } from '@/actions/reservations'
import { getPaymentsByReservationId, getPaymentMethodById } from '@/actions/payments'
import type { Reservation } from '@/actions/reservations'
import type { Payment } from '@/actions/payments'
import { shouldDisplayFeesToCustomers, formatFeeDisplay } from '@/lib/config/fee-config'
import { toast } from 'sonner'
import Link from 'next/link'

interface TransactionData {
  reservation: Reservation
  payment: Payment
  transactionId: string
  status: string
  createdAt: string
  paymentMethodDetails?: {
    id: string
    name: string
    type: string
    provider: string
    fee_type?: string
    fee_percentage: number
    fee_amount?: number
  }
}

function BookingSuccessPageContent() {
  const router = useRouter()
  const searchParams = useSearchParams()

  const [transactionData, setTransactionData] = useState<TransactionData | null>(null)
  const [isDownloading, setIsDownloading] = useState(false)
  const [isVerifying, setIsVerifying] = useState(true)
  const [verificationError, setVerificationError] = useState<string | null>(null)

  useEffect(() => {
    const verifyBookingAndPayment = async () => {
      try {
        setIsVerifying(true)
        setVerificationError(null)

        // Get parameters from URL - simplified to just payment and booking
        const paymentStatus = searchParams.get('payment')
        const bookingCode = searchParams.get('booking')

        // Validate required parameters
        if (paymentStatus !== 'completed' || !bookingCode) {
          setVerificationError('Parameter tidak valid. Akses tidak sah.')
          return
        }

        // Fetch reservation data
        const reservationResult = await getReservationByBookingCodeAction(bookingCode)
        if (!reservationResult.success || !reservationResult.data) {
          setVerificationError('Reservasi tidak ditemukan.')
          return
        }

        const reservation = reservationResult.data

        // Fetch and verify payment data
        const paymentsResult = await getPaymentsByReservationId(reservation.id)
        if (!paymentsResult.success || !paymentsResult.data) {
          setVerificationError('Data pembayaran tidak ditemukan.')
          return
        }

        // Find the most recent completed payment
        const completedPayments = paymentsResult.data.filter(p => p.status === 'completed')
        if (completedPayments.length === 0) {
          setVerificationError('Belum ada pembayaran yang selesai untuk reservasi ini.')
          return
        }

        // Get the most recent completed payment
        const latestPayment = completedPayments[0] // Already ordered by created_at desc

        // Verify payment was completed recently (within last 24 hours) to prevent old links
        const paymentDate = new Date(latestPayment.paid_at || latestPayment.created_at)
        const now = new Date()
        const hoursDiff = (now.getTime() - paymentDate.getTime()) / (1000 * 60 * 60)

        if (hoursDiff > 24) {
          setVerificationError('Link sudah kadaluarsa. Silakan hubungi customer service.')
          return
        }

        // Fetch payment method details if available
        let paymentMethodDetails = undefined
        if (latestPayment.payment_method_id) {
          try {
            const paymentMethodResult = await getPaymentMethodById(latestPayment.payment_method_id)
            if (paymentMethodResult.success) {
              paymentMethodDetails = paymentMethodResult.data
            }
          } catch (err) {
            console.error('Error fetching payment method details:', err)
          }
        }

        // All verifications passed - set the data
        setTransactionData({
          reservation,
          payment: latestPayment,
          transactionId: latestPayment.id,
          status: latestPayment.status,
          createdAt: latestPayment.created_at,
          paymentMethodDetails
        })

        // Clear temporary data
        localStorage.removeItem('finalBookingData')
        localStorage.removeItem('transactionData')

      } catch (error) {
        console.error('Error verifying booking:', error)
        setVerificationError('Terjadi kesalahan saat memverifikasi data.')
      } finally {
        setIsVerifying(false)
      }
    }

    verifyBookingAndPayment()
  }, [router, searchParams])

  // Show loading state
  if (isVerifying) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#00052e] mx-auto mb-4"></div>
          <p className="text-slate-600">Memverifikasi pembayaran...</p>
        </div>
      </div>
    )
  }

  // Show error state
  if (verificationError) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-red-50 to-slate-100 flex items-center justify-center">
        <div className="text-center max-w-md mx-auto p-4 sm:p-6">
          <div className="w-12 h-12 sm:w-16 sm:h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-3 sm:mb-4">
            <svg className="w-6 h-6 sm:w-8 sm:h-8 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          </div>
          <h1 className="text-xl sm:text-2xl font-bold text-[#00052e] mb-2">Akses Ditolak</h1>
          <p className="text-xs sm:text-base text-slate-600 mb-4 sm:mb-6">{verificationError}</p>
          <div className="space-y-2 sm:space-y-3">
            <Link href="/packages">
              <Button className="w-full bg-gradient-to-r from-[#00052e] to-[#b0834d] hover:from-[#00052e]/90 hover:to-[#b0834d]/90 text-xs sm:text-sm py-2 sm:py-3">
                <Camera className="h-3 w-3 sm:h-4 sm:w-4 mr-1.5 sm:mr-2" />
                Buat Booking Baru
              </Button>
            </Link>
            <Link href="/">
              <Button variant="outline" className="w-full text-xs sm:text-sm py-2 sm:py-3 border-[#00052e]/30 text-[#00052e] hover:bg-[#00052e]/10">
                <Home className="h-3 w-3 sm:h-4 sm:w-4 mr-1.5 sm:mr-2" />
                Kembali ke Beranda
              </Button>
            </Link>
          </div>
        </div>
      </div>
    )
  }

  // Show error if no transaction data after verification
  if (!transactionData) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 flex items-center justify-center">
        <div className="text-center">
          <p className="text-slate-600">Data transaksi tidak ditemukan.</p>
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

  const formatDuration = (minutes: number) => {
    const hours = Math.floor(minutes / 60)
    const mins = minutes % 60
    if (hours === 0) return `${mins} menit`
    if (mins === 0) return `${hours} jam`
    return `${hours}j ${mins}m`
  }

  const getSelectedAddons = () => {
    if (!transactionData?.reservation?.reservation_addons) return []

    return transactionData.reservation.reservation_addons.map(addon => ({
      id: addon.id,
      name: addon.addon?.name || 'Unknown',
      price: addon.unit_price,
      quantity: addon.quantity
    }))
  }

  const handleDownloadInvoice = async () => {
    setIsDownloading(true)

    try {
      const { generateInvoicePDF } = await import('@/lib/utils/pdf-generator')

      const pdfBlob = await generateInvoicePDF({
        reservation: transactionData.reservation,
        payment: transactionData.payment,
        paymentMethodDetails: transactionData.paymentMethodDetails,
        feeBreakdown
      })

      const url = URL.createObjectURL(pdfBlob)
      const a = document.createElement('a')
      a.href = url
      a.download = `invoice-${transactionData.reservation.booking_code}.pdf`
      document.body.appendChild(a)
      a.click()
      document.body.removeChild(a)
      URL.revokeObjectURL(url)

      toast.success('Invoice berhasil didownload')
    } catch (error) {
      console.error('Error generating PDF:', error)
      toast.error('Gagal mendownload invoice')
    } finally {
      setIsDownloading(false)
    }
  }

  const handleCopyBookingId = () => {
    navigator.clipboard.writeText(transactionData.reservation.booking_code)
    toast.success('Booking ID disalin!')
  }

  const handleShareWhatsApp = () => {
    const reservation = transactionData.reservation
    const selectedDate = new Date(reservation.reservation_date)
    const message = `Halo! Booking foto saya sudah berhasil!\n\n` +
      `📸 Paket: ${reservation.package?.name}\n` +
      `📅 Tanggal: ${format(selectedDate, 'EEEE, dd MMMM yyyy', { locale: idLocale })}\n` +
      `⏰ Jam: ${reservation.start_time}\n` +
      `🆔 Booking ID: ${reservation.booking_code}\n\n` +
      `Terima kasih!`

    const whatsappUrl = `https://wa.me/?text=${encodeURIComponent(message)}`
    window.open(whatsappUrl, '_blank')
  }

  const selectedDate = transactionData?.reservation ? new Date(transactionData.reservation.reservation_date) : null
  const selectedAddons = getSelectedAddons()
  const remainingPayment = transactionData?.reservation ? transactionData.reservation.remaining_amount : 0

  // Calculate fee breakdown for display
  const calculateFeeBreakdown = () => {
    if (!transactionData?.paymentMethodDetails || !transactionData?.payment) {
      return {
        subtotal: transactionData?.reservation?.dp_amount || 0,
        fee: 0,
        total: transactionData?.reservation?.dp_amount || 0
      }
    }

    const { paymentMethodDetails, payment, reservation } = transactionData
    const dpAmount = reservation.dp_amount

    // Calculate fee if it exists
    let feeAmount = 0
    if (paymentMethodDetails.fee_type === 'fixed') {
      feeAmount = paymentMethodDetails.fee_amount || 0
    } else {
      feeAmount = Math.round(dpAmount * (paymentMethodDetails.fee_percentage || 0) / 100)
    }

    return {
      subtotal: dpAmount,
      fee: feeAmount,
      total: payment.amount,
      paymentMethodName: paymentMethodDetails.name,
      feeDisplay: formatFeeDisplay(
        paymentMethodDetails.fee_type || 'percentage',
        paymentMethodDetails.fee_percentage,
        paymentMethodDetails.fee_amount || 0
      )
    }
  }

  const feeBreakdown = calculateFeeBreakdown()

  return (
    <div className="min-h-screen bg-gradient-to-br from-green-50 via-blue-50/30 to-slate-100">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8 sm:py-12">
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8 }}
          className="space-y-6 sm:space-y-8"
        >
          {/* Success Header */}
          <div className="text-center">
            <motion.div
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              transition={{ duration: 0.6, delay: 0.2 }}
              className="w-16 h-16 sm:w-20 sm:h-20 bg-gradient-to-r from-[#00052e] to-[#b0834d] rounded-full flex items-center justify-center mx-auto mb-4 sm:mb-6 shadow-lg"
            >
              <CheckCircle className="h-8 w-8 sm:h-12 sm:w-12 text-white" />
            </motion.div>

            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.4 }}
            >
              <h1 className="text-2xl sm:text-4xl md:text-5xl font-bold text-[#00052e] mb-2 sm:mb-4">
                Booking Berhasil!
              </h1>
              <p className="text-base sm:text-xl text-slate-600 mb-4 sm:mb-6">
                Terima kasih atas kepercayaan Anda. Kami akan segera mengkonfirmasi detail sesi foto.
              </p>

              <div className="flex items-center justify-center gap-2 sm:gap-4 flex-wrap">
                <div className="flex items-center gap-1.5 sm:gap-2 bg-white/80 rounded-full px-3 py-1.5 sm:px-4 sm:py-2 shadow-sm">
                  <span className="text-xs sm:text-sm text-slate-600">Booking ID:</span>
                  <code className="font-mono font-semibold text-[#b0834d] text-xs sm:text-sm">{transactionData.reservation.booking_code}</code>
                  <Button
                    size="sm"
                    variant="ghost"
                    onClick={handleCopyBookingId}
                    className="h-5 w-5 sm:h-6 sm:w-6 p-0 hover:bg-[#b0834d]/10"
                  >
                    <Copy className="h-3 w-3" />
                  </Button>
                </div>

                <Badge className="bg-green-100 text-green-800 hover:bg-green-100 text-xs sm:text-sm py-0.5 px-2">
                  <CheckCircle className="h-3 w-3 mr-1" />
                  Pembayaran Berhasil
                </Badge>
              </div>
            </motion.div>
          </div>

          {/* Booking Details */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.6 }}
          >
            <Card className="bg-white/90 backdrop-blur-sm border-0 shadow-xl">
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-lg sm:text-xl text-[#00052e]">
                  <Camera className="h-4 w-4 sm:h-5 sm:w-5 text-[#00052e]" />
                  Detail Booking
                </CardTitle>
              </CardHeader>

              <CardContent className="space-y-4 sm:space-y-6">
                {/* Package Info */}
                <div className="flex items-start gap-3 sm:gap-4">
                  <div className="w-12 h-12 sm:w-16 sm:h-16 bg-gradient-to-r from-[#00052e] to-[#b0834d] rounded-xl flex items-center justify-center flex-shrink-0">
                    <Camera className="h-6 w-6 sm:h-8 sm:w-8 text-white" />
                  </div>
                  <div className="flex-1">
                    <h3 className="text-base sm:text-xl font-semibold text-[#00052e]">{transactionData.reservation.package?.name}</h3>
                    <p className="text-xs sm:text-base text-slate-600">{transactionData.reservation.studio?.name}</p>
                    <div className="flex items-center gap-2 sm:gap-4 mt-1.5 sm:mt-2 text-xs sm:text-sm text-slate-600">
                      <div className="flex items-center gap-1">
                        <Clock className="h-3 w-3 sm:h-4 sm:w-4" />
                        {formatDuration(transactionData.reservation.package?.duration_minutes || 0)}
                      </div>
                      <div className="flex items-center gap-1">
                        <MapPin className="h-3 w-3 sm:h-4 sm:w-4" />
                        Studio Foto
                      </div>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="text-lg sm:text-2xl font-bold text-[#b0834d]">
                      {formatPrice(transactionData.reservation.total_amount)}
                    </p>
                    <p className="text-xs sm:text-sm text-slate-600">Total</p>
                  </div>
                </div>

                <Separator />

                {/* Schedule Info */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 sm:gap-6">
                  <div className="space-y-3 sm:space-y-4">
                    <h4 className="font-semibold text-[#00052e] flex items-center gap-1.5 sm:gap-2 text-base sm:text-lg">
                      <Calendar className="h-4 w-4 sm:h-5 sm:w-5 text-[#00052e]" />
                      Jadwal Sesi Foto
                    </h4>

                    {selectedDate && (
                      <div className="bg-[#00052e]/5 p-3 sm:p-4 rounded-lg">
                        <p className="font-medium text-[#00052e] text-sm sm:text-base">
                          {format(selectedDate, 'EEEE, dd MMMM yyyy', { locale: idLocale })}
                        </p>
                        <p className="text-[#b0834d] font-semibold text-sm sm:text-base">
                          Pukul {transactionData.reservation.start_time}
                        </p>
                      </div>
                    )}
                  </div>

                  <div className="space-y-3 sm:space-y-4">
                    <h4 className="font-semibold text-[#00052e] flex items-center gap-1.5 sm:gap-2 text-base sm:text-lg">
                      <User className="h-4 w-4 sm:h-5 sm:w-5 text-[#00052e]" />
                      Informasi Pelanggan
                    </h4>

                    <div className="space-y-1.5 sm:space-y-2">
                      <div className="flex items-center gap-1.5 sm:gap-2 text-xs sm:text-sm">
                        <User className="h-3 w-3 sm:h-4 sm:w-4 text-slate-500" />
                        <span>{transactionData.reservation.customer?.full_name}</span>
                      </div>
                      <div className="flex items-center gap-1.5 sm:gap-2 text-xs sm:text-sm">
                        <Phone className="h-3 w-3 sm:h-4 sm:w-4 text-slate-500" />
                        <span>{transactionData.reservation.customer?.phone}</span>
                      </div>
                      {transactionData.reservation.customer?.email && (
                        <div className="flex items-center gap-1.5 sm:gap-2 text-xs sm:text-sm">
                          <Mail className="h-3 w-3 sm:h-4 sm:w-4 text-slate-500" />
                          <span>{transactionData.reservation.customer.email}</span>
                        </div>
                      )}
                    </div>
                  </div>
                </div>

                {/* Add-ons */}
                {selectedAddons.length > 0 && (
                  <>
                    <Separator />
                    <div>
                      <h4 className="font-semibold text-[#00052e] mb-2 sm:mb-3 flex items-center gap-1.5 sm:gap-2 text-base sm:text-lg">
                        <Gift className="h-4 w-4 sm:h-5 sm:w-5 text-[#00052e]" />
                        Add-ons Terpilih
                      </h4>
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 sm:gap-3">
                        {selectedAddons.map((addon) => (
                          <div key={addon.id} className="flex justify-between items-center bg-slate-50 p-2 sm:p-3 rounded-lg">
                            <span className="text-xs sm:text-sm">
                              {addon.name} {addon.quantity > 1 && `(${addon.quantity}x)`}
                            </span>
                            <span className="font-medium text-[#00052e] text-xs sm:text-sm">
                              {formatPrice(addon.price * addon.quantity)}
                            </span>
                          </div>
                        ))}
                      </div>
                    </div>
                  </>
                )}

                {/* Payment Summary */}
                <Separator />
                <div>
                  <h4 className="font-semibold text-[#00052e] mb-2 sm:mb-3 flex items-center gap-1.5 sm:gap-2 text-base sm:text-lg">
                    <CreditCard className="h-4 w-4 sm:h-5 sm:w-5 text-[#00052e]" />
                    Ringkasan Pembayaran
                  </h4>

                  <div className="space-y-2 sm:space-y-3">
                    {/* Payment Method Used */}
                    {feeBreakdown.paymentMethodName && (
                      <div className="bg-slate-50 p-2 sm:p-3 rounded-lg">
                        <div className="flex items-center gap-2 mb-2">
                          <CreditCard className="h-4 w-4 text-slate-600" />
                          <span className="text-sm font-medium text-slate-700">Metode Pembayaran</span>
                        </div>
                        <p className="text-sm text-[#00052e] font-medium">{feeBreakdown.paymentMethodName}</p>
                      </div>
                    )}

                    {/* Detailed Fee Breakdown */}
                    <div className="space-y-1.5 sm:space-y-2">
                      {/* Package Price */}
                      <div className="flex justify-between text-xs sm:text-sm">
                        <span className="text-slate-600">Harga Paket ({transactionData.reservation.package?.name})</span>
                        <span className="font-medium">{formatPrice(transactionData.reservation.package_price)}</span>
                      </div>

                      {/* Add-ons (if any) */}
                      {selectedAddons.length > 0 && selectedAddons.map((addon) => (
                        <div key={addon.id} className="flex justify-between text-xs sm:text-sm">
                          <span className="text-slate-600">
                            {addon.name} {addon.quantity > 1 && `(${addon.quantity}x)`}
                          </span>
                          <span className="font-medium">{formatPrice(addon.price * addon.quantity)}</span>
                        </div>
                      ))}

                      {/* Subtotal */}
                      <div className="flex justify-between text-xs sm:text-sm pt-1 border-t border-slate-100">
                        <span className="text-slate-700 font-medium">Subtotal</span>
                        <span className="font-medium">{formatPrice(transactionData.reservation.total_amount)}</span>
                      </div>

                      {/* DP Calculation */}
                      <div className="flex justify-between text-xs sm:text-sm">
                        <span className="text-slate-600">DP ({Math.round((transactionData.reservation.dp_amount / transactionData.reservation.total_amount) * 100)}%)</span>
                        <span className="font-medium">{formatPrice(feeBreakdown.subtotal)}</span>
                      </div>

                      {/* Admin Fee (if applicable) */}
                      {shouldDisplayFeesToCustomers() && feeBreakdown.fee > 0 && (
                        <div className="flex justify-between text-xs sm:text-sm">
                          <span className="text-slate-600 flex items-center gap-1">
                            Biaya Transfer
                            <Badge variant="outline" className="text-xs py-0.5 px-1.5">
                              {feeBreakdown.feeDisplay}
                            </Badge>
                          </span>
                          <span className="font-medium text-amber-600">+{formatPrice(feeBreakdown.fee)}</span>
                        </div>
                      )}

                      {/* Total DP Paid */}
                      <div className="flex justify-between text-sm sm:text-base font-bold pt-2 border-t border-slate-200">
                        <span className="text-green-700">DP Dibayar</span>
                        <span className="text-green-600">{formatPrice(feeBreakdown.total)}</span>
                      </div>

                      {/* Remaining Payment */}
                      <div className="flex justify-between text-xs sm:text-sm">
                        <span className="text-slate-600">Sisa Pembayaran</span>
                        <span className="font-medium text-amber-600">{formatPrice(remainingPayment)}</span>
                      </div>

                      {/* Grand Total */}
                      <div className="flex justify-between text-base sm:text-lg font-bold pt-2 border-t border-slate-300">
                        <span>Total Keseluruhan</span>
                        <span className="text-[#b0834d]">{formatPrice(transactionData.reservation.total_amount)}</span>
                      </div>
                    </div>
                  </div>

                  <div className="mt-3 sm:mt-4 p-2 sm:p-3 bg-amber-50 rounded-lg border border-amber-200">
                    <p className="text-xs sm:text-sm text-amber-800">
                      <strong>Catatan:</strong> Sisa pembayaran sebesar {formatPrice(remainingPayment)} akan dibayar pada hari sesi foto.
                    </p>
                  </div>
                </div>

                {/* Notes */}
                {transactionData.reservation.special_requests && (
                  <>
                    <Separator />
                    <div>
                      <h4 className="font-semibold text-[#00052e] mb-1.5 sm:mb-2 text-base sm:text-lg">Catatan Tambahan</h4>
                      <p className="text-xs sm:text-sm text-slate-600 bg-slate-50 p-2 sm:p-3 rounded-lg">
                        {transactionData.reservation.special_requests}
                      </p>
                    </div>
                  </>
                )}
              </CardContent>
            </Card>
          </motion.div>

          {/* Actions */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.8 }}
            className="space-y-3 sm:space-y-4"
          >
            <Card className="bg-white/90 backdrop-blur-sm border-0 shadow-lg">
              <CardContent className="pt-4 sm:pt-6">
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 sm:gap-4">
                  <Button
                    onClick={handleDownloadInvoice}
                    disabled={isDownloading}
                    className="flex items-center gap-1.5 sm:gap-2 bg-gradient-to-r from-[#00052e] to-[#b0834d] hover:from-[#00052e]/90 hover:to-[#b0834d]/90 text-xs sm:text-sm py-2 sm:py-3"
                  >
                    {isDownloading ? (
                      <>
                        <div className="animate-spin rounded-full h-3 w-3 sm:h-4 sm:w-4 border-b-2 border-white"></div>
                        Memproses...
                      </>
                    ) : (
                      <>
                        <Download className="h-3 w-3 sm:h-4 sm:w-4" />
                        Download Invoice
                      </>
                    )}
                  </Button>

                  <Button
                    onClick={handleShareWhatsApp}
                    variant="outline"
                    className="flex items-center gap-1.5 sm:gap-2 border-green-200 text-green-700 hover:bg-green-50 text-xs sm:text-sm py-2 sm:py-3"
                  >
                    <Share2 className="h-3 w-3 sm:h-4 sm:w-4" />
                    Share ke WhatsApp
                  </Button>

                  <Button
                    onClick={() => window.print()}
                    variant="outline"
                    className="flex items-center gap-1.5 sm:gap-2 text-xs sm:text-sm py-2 sm:py-3 border-[#00052e]/30 text-[#00052e] hover:bg-[#00052e]/10"
                  >
                    <Printer className="h-3 w-3 sm:h-4 sm:w-4" />
                    Print
                  </Button>
                </div>
              </CardContent>
            </Card>

            {/* Navigation */}
            <div className="flex flex-col sm:flex-row gap-3 sm:gap-4 justify-center">
              <Link href="/packages">
                <Button variant="outline" className="flex items-center gap-1.5 sm:gap-2 text-xs sm:text-sm py-2 sm:py-3 border-[#00052e]/30 text-[#00052e] hover:bg-[#00052e]/10">
                  <Camera className="h-3 w-3 sm:h-4 sm:w-4" />
                  Booking Lagi
                </Button>
              </Link>

              <Link href="/">
                <Button className="flex items-center gap-1.5 sm:gap-2 bg-gradient-to-r from-[#00052e] to-[#b0834d] hover:from-[#00052e]/90 hover:to-[#b0834d]/90 text-xs sm:text-sm py-2 sm:py-3">
                  <Home className="h-3 w-3 sm:h-4 sm:w-4" />
                  Kembali ke Beranda
                </Button>
              </Link>
            </div>
          </motion.div>

          {/* Next Steps */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 1 }}
          >
            <Card className="bg-gradient-to-r from-[#00052e]/5 to-[#b0834d]/5 border-[#00052e]/20">
              <CardContent className="pt-4 sm:pt-6">
                <h3 className="font-semibold text-[#00052e] mb-3 sm:mb-4 text-base sm:text-lg">Langkah Selanjutnya:</h3>
                <div className="space-y-2 sm:space-y-3 text-xs sm:text-sm text-slate-700">
                  <div className="flex items-start gap-2 sm:gap-3">
                    <div className="w-5 h-5 sm:w-6 sm:h-6 bg-[#00052e] text-white rounded-full flex items-center justify-center text-xs font-bold flex-shrink-0">1</div>
                    <p>Kami akan menghubungi Anda via WhatsApp untuk konfirmasi detail sesi foto</p>
                  </div>
                  <div className="flex items-start gap-2 sm:gap-3">
                    <div className="w-5 h-5 sm:w-6 sm:h-6 bg-[#00052e] text-white rounded-full flex items-center justify-center text-xs font-bold flex-shrink-0">2</div>
                    <p>Datang 15 menit sebelum jadwal dengan membawa invoice ini</p>
                  </div>
                  <div className="flex items-start gap-2 sm:gap-3">
                    <div className="w-5 h-5 sm:w-6 sm:h-6 bg-[#00052e] text-white rounded-full flex items-center justify-center text-xs font-bold flex-shrink-0">3</div>
                    <p>Selesaikan sisa pembayaran sebelum sesi foto dimulai</p>
                  </div>
                  <div className="flex items-start gap-2 sm:gap-3">
                    <div className="w-5 h-5 sm:w-6 sm:h-6 bg-[#00052e] text-white rounded-full flex items-center justify-center text-xs font-bold flex-shrink-0">4</div>
                    <p>Nikmati sesi foto profesional dan dapatkan hasil terbaik!</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </motion.div>
        </motion.div>
      </div>
    </div>
  )
}

export default function BookingSuccessPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#00052e] mx-auto mb-4"></div>
          <p className="text-slate-600">Memuat halaman sukses...</p>
        </div>
      </div>
    }>
      <BookingSuccessPageContent />
    </Suspense>
  )
}