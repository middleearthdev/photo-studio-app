'use client'

import { useState, useEffect, useRef } from 'react'
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
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Separator } from '@/components/ui/separator'
import { getReservationByBookingCodeAction } from '@/actions/reservations'
import { getPaymentsByReservationId } from '@/actions/payments'
import type { Reservation } from '@/actions/reservations'
import type { Payment } from '@/actions/payments'
import { toast } from 'sonner'
import Link from 'next/link'

interface TransactionData {
  reservation: Reservation
  payment: Payment
  transactionId: string
  status: string
  createdAt: string
}

export default function BookingSuccessPage() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const invoiceRef = useRef<HTMLDivElement>(null)
  
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
        
        // All verifications passed - set the data
        setTransactionData({
          reservation,
          payment: latestPayment,
          transactionId: latestPayment.id,
          status: latestPayment.status,
          createdAt: latestPayment.created_at
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
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-slate-600">Memverifikasi pembayaran...</p>
        </div>
      </div>
    )
  }
  
  // Show error state
  if (verificationError) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-red-50 to-slate-100 flex items-center justify-center">
        <div className="text-center max-w-md mx-auto p-6">
          <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <svg className="w-8 h-8 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          </div>
          <h1 className="text-2xl font-bold text-slate-900 mb-2">Akses Ditolak</h1>
          <p className="text-slate-600 mb-6">{verificationError}</p>
          <div className="space-y-3">
            <Link href="/packages">
              <Button className="w-full">
                <Camera className="h-4 w-4 mr-2" />
                Buat Booking Baru
              </Button>
            </Link>
            <Link href="/">
              <Button variant="outline" className="w-full">
                <Home className="h-4 w-4 mr-2" />
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
      // In a real application, you would call an API to generate PDF
      // For now, we'll simulate the download
      await new Promise(resolve => setTimeout(resolve, 2000))
      
      // Create a mock PDF download
      const pdfContent = generateInvoiceContent()
      const blob = new Blob([pdfContent], { type: 'application/pdf' })
      const url = URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = `invoice-${transactionData.reservation.booking_code}.pdf`
      document.body.appendChild(a)
      a.click()
      document.body.removeChild(a)
      URL.revokeObjectURL(url)
      
      toast.success('Invoice berhasil didownload')
    } catch (error) {
      toast.error('Gagal mendownload invoice')
    } finally {
      setIsDownloading(false)
    }
  }

  const generateInvoiceContent = () => {
    // This is a mock function. In a real app, you would generate actual PDF content
    return `Invoice - ${transactionData.reservation.booking_code}\nBooking berhasil untuk ${transactionData.reservation.customer?.full_name}`
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

  return (
    <div className="min-h-screen bg-gradient-to-br from-green-50 via-blue-50/30 to-slate-100">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8 }}
          className="space-y-8"
        >
          {/* Success Header */}
          <div className="text-center">
            <motion.div
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              transition={{ duration: 0.6, delay: 0.2 }}
              className="w-20 h-20 bg-gradient-to-r from-green-500 to-green-600 rounded-full flex items-center justify-center mx-auto mb-6 shadow-lg"
            >
              <CheckCircle className="h-12 w-12 text-white" />
            </motion.div>
            
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.4 }}
            >
              <h1 className="text-4xl md:text-5xl font-bold text-slate-900 mb-4">
                Booking Berhasil!
              </h1>
              <p className="text-xl text-slate-600 mb-6">
                Terima kasih atas kepercayaan Anda. Kami akan segera mengkonfirmasi detail sesi foto.
              </p>
              
              <div className="flex items-center justify-center gap-4 flex-wrap">
                <div className="flex items-center gap-2 bg-white/80 rounded-full px-4 py-2 shadow-sm">
                  <span className="text-sm text-slate-600">Booking ID:</span>
                  <code className="font-mono font-semibold text-blue-600">{transactionData.reservation.booking_code}</code>
                  <Button
                    size="sm"
                    variant="ghost"
                    onClick={handleCopyBookingId}
                    className="h-6 w-6 p-0 hover:bg-blue-100"
                  >
                    <Copy className="h-3 w-3" />
                  </Button>
                </div>
                
                <Badge className="bg-green-100 text-green-800 hover:bg-green-100">
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
                <CardTitle className="flex items-center gap-2">
                  <Camera className="h-5 w-5 text-blue-600" />
                  Detail Booking
                </CardTitle>
              </CardHeader>
              
              <CardContent className="space-y-6">
                {/* Package Info */}
                <div className="flex items-start gap-4">
                  <div className="w-16 h-16 bg-gradient-to-r from-blue-500 to-purple-600 rounded-xl flex items-center justify-center flex-shrink-0">
                    <Camera className="h-8 w-8 text-white" />
                  </div>
                  <div className="flex-1">
                    <h3 className="text-xl font-semibold text-slate-900">{transactionData.reservation.package?.name}</h3>
                    <p className="text-slate-600">{transactionData.reservation.studio?.name}</p>
                    <div className="flex items-center gap-4 mt-2 text-sm text-slate-600">
                      <div className="flex items-center gap-1">
                        <Clock className="h-4 w-4" />
                        {formatDuration(transactionData.reservation.package?.duration_minutes || 0)}
                      </div>
                      <div className="flex items-center gap-1">
                        <MapPin className="h-4 w-4" />
                        Studio Foto
                      </div>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="text-2xl font-bold text-blue-600">
                      {formatPrice(transactionData.reservation.total_amount)}
                    </p>
                    <p className="text-sm text-slate-600">Total</p>
                  </div>
                </div>

                <Separator />

                {/* Schedule Info */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-4">
                    <h4 className="font-semibold text-slate-900 flex items-center gap-2">
                      <Calendar className="h-4 w-4 text-blue-600" />
                      Jadwal Sesi Foto
                    </h4>
                    
                    {selectedDate && (
                      <div className="bg-blue-50 p-4 rounded-lg">
                        <p className="font-medium text-slate-900">
                          {format(selectedDate, 'EEEE, dd MMMM yyyy', { locale: idLocale })}
                        </p>
                        <p className="text-blue-700 font-semibold">
                          Pukul {transactionData.reservation.start_time}
                        </p>
                      </div>
                    )}
                  </div>

                  <div className="space-y-4">
                    <h4 className="font-semibold text-slate-900 flex items-center gap-2">
                      <User className="h-4 w-4 text-blue-600" />
                      Informasi Pelanggan
                    </h4>
                    
                    <div className="space-y-2">
                      <div className="flex items-center gap-2 text-sm">
                        <User className="h-4 w-4 text-slate-500" />
                        <span>{transactionData.reservation.customer?.full_name}</span>
                      </div>
                      <div className="flex items-center gap-2 text-sm">
                        <Phone className="h-4 w-4 text-slate-500" />
                        <span>{transactionData.reservation.customer?.phone}</span>
                      </div>
                      {transactionData.reservation.customer?.email && (
                        <div className="flex items-center gap-2 text-sm">
                          <Mail className="h-4 w-4 text-slate-500" />
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
                      <h4 className="font-semibold text-slate-900 mb-3 flex items-center gap-2">
                        <Gift className="h-4 w-4 text-blue-600" />
                        Add-ons Terpilih
                      </h4>
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                        {selectedAddons.map((addon) => (
                          <div key={addon.id} className="flex justify-between items-center bg-slate-50 p-3 rounded-lg">
                            <span className="text-sm">
                              {addon.name} {addon.quantity > 1 && `(${addon.quantity}x)`}
                            </span>
                            <span className="font-medium text-slate-900">
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
                  <h4 className="font-semibold text-slate-900 mb-3 flex items-center gap-2">
                    <CreditCard className="h-4 w-4 text-blue-600" />
                    Ringkasan Pembayaran
                  </h4>
                  
                  <div className="space-y-2">
                    <div className="flex justify-between">
                      <span className="text-slate-600">DP Dibayar</span>
                      <span className="font-medium text-green-600">{formatPrice(transactionData.reservation.dp_amount)}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-slate-600">Sisa Pembayaran</span>
                      <span className="font-medium text-amber-600">{formatPrice(remainingPayment)}</span>
                    </div>
                    <div className="flex justify-between text-lg font-bold pt-2 border-t">
                      <span>Total</span>
                      <span className="text-blue-600">{formatPrice(transactionData.reservation.total_amount)}</span>
                    </div>
                  </div>
                  
                  <div className="mt-4 p-3 bg-amber-50 rounded-lg border border-amber-200">
                    <p className="text-sm text-amber-800">
                      <strong>Catatan:</strong> Sisa pembayaran sebesar {formatPrice(remainingPayment)} akan dibayar pada hari sesi foto.
                    </p>
                  </div>
                </div>

                {/* Notes */}
                {transactionData.reservation.special_requests && (
                  <>
                    <Separator />
                    <div>
                      <h4 className="font-semibold text-slate-900 mb-2">Catatan Tambahan</h4>
                      <p className="text-slate-600 bg-slate-50 p-3 rounded-lg">
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
            className="space-y-4"
          >
            <Card className="bg-white/90 backdrop-blur-sm border-0 shadow-lg">
              <CardContent className="pt-6">
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                  <Button
                    onClick={handleDownloadInvoice}
                    disabled={isDownloading}
                    className="flex items-center gap-2 bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800"
                  >
                    {isDownloading ? (
                      <>
                        <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                        Memproses...
                      </>
                    ) : (
                      <>
                        <Download className="h-4 w-4" />
                        Download Invoice
                      </>
                    )}
                  </Button>
                  
                  <Button
                    onClick={handleShareWhatsApp}
                    variant="outline"
                    className="flex items-center gap-2 border-green-200 text-green-700 hover:bg-green-50"
                  >
                    <Share2 className="h-4 w-4" />
                    Share ke WhatsApp
                  </Button>
                  
                  <Button
                    onClick={() => window.print()}
                    variant="outline"
                    className="flex items-center gap-2"
                  >
                    <Printer className="h-4 w-4" />
                    Print
                  </Button>
                </div>
              </CardContent>
            </Card>

            {/* Navigation */}
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Link href="/packages">
                <Button variant="outline" className="flex items-center gap-2">
                  <Camera className="h-4 w-4" />
                  Booking Lagi
                </Button>
              </Link>
              
              <Link href="/">
                <Button className="flex items-center gap-2">
                  <Home className="h-4 w-4" />
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
            <Card className="bg-gradient-to-r from-blue-50 to-indigo-50 border-blue-200">
              <CardContent className="pt-6">
                <h3 className="font-semibold text-slate-900 mb-4">Langkah Selanjutnya:</h3>
                <div className="space-y-3 text-sm text-slate-700">
                  <div className="flex items-start gap-3">
                    <div className="w-6 h-6 bg-blue-600 text-white rounded-full flex items-center justify-center text-xs font-bold flex-shrink-0">1</div>
                    <p>Kami akan menghubungi Anda via WhatsApp untuk konfirmasi detail sesi foto</p>
                  </div>
                  <div className="flex items-start gap-3">
                    <div className="w-6 h-6 bg-blue-600 text-white rounded-full flex items-center justify-center text-xs font-bold flex-shrink-0">2</div>
                    <p>Datang 15 menit sebelum jadwal dengan membawa invoice ini</p>
                  </div>
                  <div className="flex items-start gap-3">
                    <div className="w-6 h-6 bg-blue-600 text-white rounded-full flex items-center justify-center text-xs font-bold flex-shrink-0">3</div>
                    <p>Selesaikan sisa pembayaran sebelum sesi foto dimulai</p>
                  </div>
                  <div className="flex items-start gap-3">
                    <div className="w-6 h-6 bg-blue-600 text-white rounded-full flex items-center justify-center text-xs font-bold flex-shrink-0">4</div>
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