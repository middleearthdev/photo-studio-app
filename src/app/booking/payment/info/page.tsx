'use client'

export const dynamic = 'force-dynamic'

import { useState, useEffect, Suspense } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { motion } from 'framer-motion'
import { format } from 'date-fns'
import { id as idLocale } from 'date-fns/locale'
import {
  MessageCircle,
  Check,
  Clock,
  AlertCircle,
  Building2,
  Phone,
  Mail,
  User,
  Calendar,
  Camera,
  Copy,
  ExternalLink,
  CreditCard,
  MapPin
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { toast } from 'sonner'
import { shouldDisplayFeesToCustomers } from '@/lib/config/fee-config'

interface FinalBookingData {
  reservation: {
    id: string
    booking_code: string
    total_amount: number
    dp_amount: number
    reservation_date: string
    start_time: string
    end_time?: string
    special_requests?: string
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
    account_details?: {
      bank_code: string
      account_name: string
      account_number: string
    }
  }
  totalPrice: number
  dpAmount: number
}

const paymentMethodInfo = {
  bank_transfer: {
    name: 'Transfer Bank Manual',
    description: 'Transfer manual ke rekening studio',
    icon: Building2,
    instructions: 'Transfer ke rekening bank di bawah ini, lalu hubungi admin untuk konfirmasi pembayaran.',
    note: 'Setelah transfer, segera hubungi admin dengan bukti transfer untuk konfirmasi booking.'
  }
}

function PaymentInfoContent() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const paymentMethod = searchParams.get('method') || 'bank_transfer'
  const bookingCode = searchParams.get('booking')
  const paymentMethodId = searchParams.get('payment_method_id')

  const [bookingData, setBookingData] = useState<FinalBookingData | null>(null)
  const [copiedBookingId, setCopiedBookingId] = useState(false)

  // Calculate fee based on payment method (if available)
  const calculatePaymentFee = () => {
    if (!bookingData || !bookingData.paymentMethodDetails) return 0;

    const paymentMethodDetails = bookingData.paymentMethodDetails;
    const dpAmount = bookingData.reservation?.dp_amount || bookingData.dpAmount || 0;

    if (paymentMethodDetails.fee_type === 'fixed') {
      return paymentMethodDetails.fee_amount || 0;
    } else {
      // Percentage fee
      return Math.round(dpAmount * (paymentMethodDetails.fee_percentage || 0) / 100);
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

  const formatPrice = (price: number) => {
    return new Intl.NumberFormat('id-ID', {
      style: 'currency',
      currency: 'IDR',
      minimumFractionDigits: 0
    }).format(price)
  }

  const copyBookingId = async () => {
    if (!bookingCode) return
    
    try {
      await navigator.clipboard.writeText(bookingCode)
      setCopiedBookingId(true)
      toast.success('Booking ID disalin ke clipboard')
      
      setTimeout(() => setCopiedBookingId(false), 2000)
    } catch (error) {
      toast.error('Gagal menyalin booking ID')
    }
  }

  const generateWhatsAppMessage = () => {
    if (!bookingData || !bookingCode) return ''

    const reservation = bookingData.reservation
    const customer = bookingData.customer
    const totalAmount = getDisplayTotal()
    const selectedAddons = localStorage.getItem('bookingData')
    let addonsText = ''
    
    // Parse addons if available
    try {
      const storedBookingData = JSON.parse(localStorage.getItem('bookingData') || '{}')
      if (storedBookingData.addons) {
        const addonsEntries = Object.entries(storedBookingData.addons).filter(([_, quantity]) => (quantity as number) > 0)
        if (addonsEntries.length > 0) {
          addonsText = '\n*Add-ons:*\n' + addonsEntries.map(([name, quantity]) => `- ${name} (${quantity}x)`).join('\n')
        }
      }
    } catch (e) {
      // Ignore error
    }

    const reservationDate = new Date(reservation.reservation_date)
    const dateText = format(reservationDate, 'EEEE, dd MMMM yyyy', { locale: idLocale })

    const message = `Halo Admin,

Saya telah melakukan booking studio foto dan akan segera melakukan transfer DP.

*Detail Booking:*
📝 Booking ID: ${bookingCode}
👤 Nama: ${customer.full_name}
📞 WhatsApp: ${customer.phone}
📧 Email: ${customer.email}

*Detail Sesi:*
📅 Tanggal: ${dateText}
⏰ Waktu: ${reservation.start_time}${addonsText}

*Detail Pembayaran:*
💰 Total DP: ${formatPrice(totalAmount)}
🏦 Transfer ke: ${bookingData.paymentMethodDetails?.account_details?.bank_code || 'BCA'} - ${bookingData.paymentMethodDetails?.account_details?.account_number || '1234567890'}

${reservation.special_requests ? `*Catatan Khusus:*\n${reservation.special_requests}\n\n` : ''}Saya akan segera melakukan transfer dan mengirim bukti pembayaran untuk konfirmasi booking.

Terima kasih! 🙏`

    return encodeURIComponent(message)
  }

  const handleWhatsAppContact = () => {
    const adminWhatsApp = '6281234567890' // Replace with actual admin WhatsApp number
    const message = generateWhatsAppMessage()
    const whatsappUrl = `https://wa.me/${adminWhatsApp}?text=${message}`
    
    window.open(whatsappUrl, '_blank')
  }

  if (!bookingData) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#00052e] mx-auto mb-4"></div>
          <p className="text-slate-600">Memuat informasi pembayaran...</p>
        </div>
      </div>
    )
  }

  // This page is specifically for bank_transfer only
  if (paymentMethod !== 'bank_transfer') {
    router.push('/packages')
    return null
  }

  const methodInfo = paymentMethodInfo.bank_transfer
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
              <Check className="h-6 w-6 sm:h-8 sm:w-8 text-white" />
            </div>
            <h1 className="text-2xl sm:text-3xl font-bold text-[#00052e] mb-1 sm:mb-2">Booking Berhasil Dibuat!</h1>
            <p className="text-sm sm:text-base text-slate-600">
              Booking ID: <span className="font-mono font-medium">{bookingCode}</span>
            </p>
          </div>

          {/* Booking Summary */}
          <Card className="bg-white/90 backdrop-blur-sm border-0 shadow-xl">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-lg sm:text-xl text-[#00052e]">
                <Camera className="h-5 w-5" />
                Ringkasan Booking
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {/* Customer Info */}
              <div className="flex items-center gap-3 p-3 bg-slate-50 rounded-lg">
                <User className="h-5 w-5 text-slate-600" />
                <div>
                  <p className="font-medium text-slate-800">{bookingData.customer.full_name}</p>
                  <p className="text-sm text-slate-600">{bookingData.customer.phone}</p>
                </div>
              </div>

              {/* Date and Time */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div className="flex items-center gap-3 p-3 bg-slate-50 rounded-lg">
                  <Calendar className="h-5 w-5 text-slate-600" />
                  <div>
                    <p className="text-sm text-slate-600">Tanggal</p>
                    <p className="font-medium text-slate-800">
                      {format(new Date(bookingData.reservation.reservation_date), 'dd MMMM yyyy', { locale: idLocale })}
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-3 p-3 bg-slate-50 rounded-lg">
                  <Clock className="h-5 w-5 text-slate-600" />
                  <div>
                    <p className="text-sm text-slate-600">Waktu</p>
                    <p className="font-medium text-slate-800">{bookingData.reservation.start_time}</p>
                  </div>
                </div>
              </div>

              {/* Payment Amount */}
              <div className="border border-[#b0834d] bg-gradient-to-r from-[#b0834d]/5 to-[#00052e]/5 rounded-lg p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-slate-600">Total DP</p>
                    <p className="text-xl sm:text-2xl font-bold text-[#b0834d]">
                      {formatPrice(getDisplayTotal())}
                    </p>
                    {shouldDisplayFeesToCustomers() && calculatePaymentFee() > 0 && (
                      <p className="text-xs text-slate-500">
                        Termasuk fee {formatPrice(calculatePaymentFee())}
                      </p>
                    )}
                  </div>
                  <div className="text-right">
                    <Badge variant="outline" className="border-[#b0834d] text-[#b0834d]">
                      {bookingData.paymentMethodDetails?.name || methodInfo.name}
                    </Badge>
                  </div>
                </div>
              </div>

              {/* Booking ID with Copy */}
              <div className="flex items-center justify-between p-3 bg-blue-50 border border-blue-200 rounded-lg">
                <div>
                  <p className="text-sm text-blue-700 font-medium">Booking ID</p>
                  <p className="font-mono text-blue-900">{bookingCode}</p>
                </div>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={copyBookingId}
                  className="border-blue-300 text-blue-700 hover:bg-blue-100"
                >
                  {copiedBookingId ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
                </Button>
              </div>
            </CardContent>
          </Card>

          {/* Bank Account Details */}
          <Card className="bg-white/90 backdrop-blur-sm border-0 shadow-xl">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-lg sm:text-xl text-[#00052e]">
                <Icon className="h-5 w-5" />
                Detail Rekening Transfer
              </CardTitle>
              <CardDescription>
                Transfer DP ke rekening bank berikut
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {/* Bank Details */}
              <div className="grid gap-4">
                {/* Bank Name */}
                <div className="flex items-center justify-between p-3 sm:p-4 bg-slate-50 rounded-lg">
                  <div className="flex-1">
                    <p className="text-xs sm:text-sm text-slate-600 mb-1">Bank</p>
                    <p className="font-semibold text-sm sm:text-base text-[#00052e]">
                      {bookingData.paymentMethodDetails?.account_details?.bank_code || 'BCA'}
                    </p>
                  </div>
                </div>

                {/* Account Number */}
                <div className="flex items-center justify-between p-3 sm:p-4 bg-slate-50 rounded-lg">
                  <div className="flex-1">
                    <p className="text-xs sm:text-sm text-slate-600 mb-1">Nomor Rekening</p>
                    <p className="font-mono font-semibold text-sm sm:text-base text-[#00052e]">
                      {bookingData.paymentMethodDetails?.account_details?.account_number || '1234567890'}
                    </p>
                  </div>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => {
                      const accountNumber = bookingData.paymentMethodDetails?.account_details?.account_number || '1234567890'
                      navigator.clipboard.writeText(accountNumber)
                      toast.success('Nomor rekening disalin')
                    }}
                    className="text-[#00052e] hover:text-[#00052e]/80"
                  >
                    <Copy className="h-4 w-4" />
                  </Button>
                </div>

                {/* Account Name */}
                <div className="flex items-center justify-between p-3 sm:p-4 bg-slate-50 rounded-lg">
                  <div className="flex-1">
                    <p className="text-xs sm:text-sm text-slate-600 mb-1">Nama Penerima</p>
                    <p className="font-semibold text-sm sm:text-base text-[#00052e]">
                      {bookingData.paymentMethodDetails?.account_details?.account_name || 'Lumina Photography Studio'}
                    </p>
                  </div>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => {
                      const accountName = bookingData.paymentMethodDetails?.account_details?.account_name || 'Lumina Photography Studio'
                      navigator.clipboard.writeText(accountName)
                      toast.success('Nama penerima disalin')
                    }}
                    className="text-[#00052e] hover:text-[#00052e]/80"
                  >
                    <Copy className="h-4 w-4" />
                  </Button>
                </div>

                {/* Transfer Amount */}
                <div className="flex items-center justify-between p-3 sm:p-4 bg-green-50 border border-green-200 rounded-lg">
                  <div className="flex-1">
                    <p className="text-xs sm:text-sm text-green-700 mb-1">Jumlah Transfer</p>
                    <p className="font-bold text-lg sm:text-xl text-green-800">
                      {formatPrice(getDisplayTotal())}
                    </p>
                  </div>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => {
                      navigator.clipboard.writeText(getDisplayTotal().toString())
                      toast.success('Jumlah transfer disalin')
                    }}
                    className="text-green-700 hover:text-green-800"
                  >
                    <Copy className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Payment Instructions */}
          <Card className="bg-blue-50 border-blue-200">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-lg text-blue-900">
                <AlertCircle className="h-5 w-5" />
                Cara Transfer
              </CardTitle>
            </CardHeader>
            <CardContent>
              <ol className="space-y-2 text-sm text-blue-800">
                <li className="flex items-start gap-2">
                  <span className="bg-blue-600 text-white rounded-full w-5 h-5 flex items-center justify-center text-xs font-bold mt-0.5">1</span>
                  <span>Transfer <strong>tepat</strong> sejumlah {formatPrice(getDisplayTotal())} ke rekening di atas</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="bg-blue-600 text-white rounded-full w-5 h-5 flex items-center justify-center text-xs font-bold mt-0.5">2</span>
                  <span>Simpan bukti transfer (screenshot atau struk ATM)</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="bg-blue-600 text-white rounded-full w-5 h-5 flex items-center justify-center text-xs font-bold mt-0.5">3</span>
                  <span>Klik tombol "Konfirmasi ke Admin" di bawah</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="bg-blue-600 text-white rounded-full w-5 h-5 flex items-center justify-center text-xs font-bold mt-0.5">4</span>
                  <span>Kirim pesan WhatsApp untuk memberitahu admin bahwa Anda sudah transfer</span>
                </li>
              </ol>
            </CardContent>
          </Card>

          {/* WhatsApp Contact Button */}
          <Card className="bg-green-50 border-green-200">
            <CardContent className="pt-6">
              <div className="text-center space-y-4">
                <div className="flex items-center justify-center">
                  <div className="w-12 h-12 bg-green-600 rounded-full flex items-center justify-center">
                    <MessageCircle className="h-6 w-6 text-white" />
                  </div>
                </div>
                
                <div>
                  <h3 className="text-lg font-semibold text-green-900 mb-2">
                    Konfirmasi Transfer ke Admin
                  </h3>
                  <p className="text-sm text-green-700 mb-4">
                    Setelah melakukan transfer, hubungi admin untuk memberitahu bahwa Anda sudah booking dan transfer DP.
                    Pesan akan otomatis berisi detail booking lengkap Anda.
                  </p>
                </div>

                <Button
                  onClick={handleWhatsAppContact}
                  className="w-full bg-green-600 hover:bg-green-700 text-white py-3 text-base"
                  size="lg"
                >
                  <MessageCircle className="h-5 w-5 mr-2" />
                  Konfirmasi Transfer ke Admin
                  <ExternalLink className="h-4 w-4 ml-2" />
                </Button>

                <p className="text-xs text-green-600">
                  WhatsApp akan terbuka dengan detail booking dan konfirmasi transfer
                </p>
              </div>
            </CardContent>
          </Card>

          {/* Important Notes */}
          <Card className="bg-amber-50 border-amber-200">
            <CardContent className="pt-6">
              <div className="flex items-start gap-3">
                <AlertCircle className="h-5 w-5 text-amber-600 mt-0.5 flex-shrink-0" />
                <div className="space-y-2 text-sm text-amber-800">
                  <p className="font-medium">Penting untuk diingat:</p>
                  <ul className="space-y-1 list-disc list-inside">
                    <li>Transfer harus <strong>tepat</strong> sejumlah {formatPrice(getDisplayTotal())}</li>
                    <li>Simpan Booking ID: <strong>{bookingCode}</strong></li>
                    <li>Simpan bukti transfer untuk dikirim ke admin</li>
                    <li>Hubungi admin segera setelah transfer</li>
                    <li>Booking akan dikonfirmasi setelah admin verifikasi transfer</li>
                  </ul>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Contact Information */}
          <Card className="bg-slate-50 border-slate-200">
            <CardContent className="pt-6">
              <div className="text-center space-y-3">
                <h3 className="font-semibold text-slate-800">Kontak Studio</h3>
                <div className="flex flex-col sm:flex-row gap-2 sm:gap-4 justify-center">
                  <div className="flex items-center gap-2 text-sm text-slate-600">
                    <Phone className="h-4 w-4" />
                    <span>WhatsApp: 0812-3456-7890</span>
                  </div>
                  <div className="flex items-center gap-2 text-sm text-slate-600">
                    <Mail className="h-4 w-4" />
                    <span>Email: info@kalarasastudio.com</span>
                  </div>
                  <div className="flex items-center gap-2 text-sm text-slate-600">
                    <MapPin className="h-4 w-4" />
                    <span>Studio Kalarasa</span>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Back Button */}
          <div className="text-center">
            <Button
              variant="ghost"
              onClick={() => router.push('/packages')}
              className="text-slate-600 hover:text-[#00052e] text-sm py-2"
            >
              Kembali ke Halaman Utama
            </Button>
          </div>
        </motion.div>
      </div>
    </div>
  )
}

export default function PaymentInfoPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#00052e] mx-auto mb-4"></div>
          <p className="text-slate-600">Memuat informasi pembayaran...</p>
        </div>
      </div>
    }>
      <PaymentInfoContent />
    </Suspense>
  )
}