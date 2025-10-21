'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { motion } from 'framer-motion'
import { format } from 'date-fns'
import { id as idLocale } from 'date-fns/locale'
import {
  ArrowLeft,
  ArrowRight,
  Camera,
  Clock,
  User,
  Phone,
  CreditCard,
  CheckCircle,
  MapPin,
  Calendar,
  Gift,
  AlertCircle,
  Tag
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group'
import { Textarea } from '@/components/ui/textarea'
import { usePublicPackage } from '@/hooks/use-customer-packages'
import { usePublicAddonsGrouped } from '@/hooks/use-addons'
import { useActivePaymentMethods, formatPaymentMethod } from '@/hooks/use-payment-methods'
import { createReservationAction } from '@/actions/reservations'
import type { CreateReservationData } from '@/actions/reservations'
import { createBankTransferPayment } from '@/actions/payments'
import { getDiscountByCodeAction, validateDiscountAction } from '@/actions/discounts'
import { toast } from 'sonner'
import Link from 'next/link'
import { shouldDisplayFeesToCustomers, formatFeeDisplay } from '@/lib/config/fee-config'

const customerSchema = z.object({
  name: z.string().min(2, 'Nama minimal 2 karakter').max(100, 'Nama maksimal 100 karakter'),
  whatsapp: z.string()
    .min(10, 'Nomor WhatsApp tidak valid')
    .max(15, 'Nomor WhatsApp tidak valid')
    .regex(/^[\d+\-\s()]+$/, 'Format nomor WhatsApp tidak valid'),
  email: z.string().min(1, 'Email wajib diisi').email('Format email tidak valid'),
  notes: z.string().optional(),
  paymentMethod: z.string().min(1, 'Pilih metode pembayaran'),
  discountCode: z.string().optional()
})

type CustomerFormData = z.infer<typeof customerSchema>

interface BookingData {
  packageId: string
  date: string
  timeSlot: string
  addons?: { [key: string]: number }
  addonsTotal?: number
}

// Payment methods will be loaded from database

export default function BookingSummaryPage() {
  const router = useRouter()
  const [bookingData, setBookingData] = useState<BookingData | null>(null)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [discountAmount, setDiscountAmount] = useState(0)
  const [isValidatingDiscount, setIsValidatingDiscount] = useState(false)
  const [appliedDiscountCode, setAppliedDiscountCode] = useState('')
  const [appliedDiscountId, setAppliedDiscountId] = useState('')

  const { data: packageData } = usePublicPackage(bookingData?.packageId || '')
  const { data: addonsGrouped = {} } = usePublicAddonsGrouped(packageData?.studio_id)
  const { data: paymentMethods = [], isLoading: isLoadingPaymentMethods } = useActivePaymentMethods(packageData?.studio_id || '')

  const {
    register,
    handleSubmit,
    watch,
    setValue,
    formState: { errors }
  } = useForm<CustomerFormData>({
    resolver: zodResolver(customerSchema)
  })

  const selectedPaymentMethod = watch('paymentMethod')
  const discountCode = watch('discountCode')

  useEffect(() => {
    const storedData = localStorage.getItem('bookingData')
    if (storedData) {
      const data = JSON.parse(storedData)
      setBookingData(data)
    } else {
      router.push('/packages')
    }
  }, [router])

  // Database-integrated discount application function
  const applyDiscount = async () => {
    if (!discountCode || !packageData || discountCode.length < 3) {
      toast.error('Masukkan kode diskon yang valid')
      return
    }

    setIsValidatingDiscount(true)
    try {
      const code = discountCode.toUpperCase()
      const subtotal = getSubtotalPrice()

      // Get discount by code from database
      const discountResult = await getDiscountByCodeAction(code, packageData.studio_id)

      if (!discountResult.success || !discountResult.data) {
        toast.error('Kode diskon tidak valid atau sudah tidak berlaku')
        setDiscountAmount(0)
        setAppliedDiscountCode('')
        setAppliedDiscountId('')
        return
      }

      const discount = discountResult.data

      // Validate discount against current subtotal
      const validationResult = await validateDiscountAction(discount.id, subtotal, packageData.studio_id)

      if (!validationResult.success || !validationResult.data?.is_valid) {
        toast.error(validationResult.data?.error_message || 'Kode diskon tidak dapat diterapkan')
        setDiscountAmount(0)
        setAppliedDiscountCode('')
        setAppliedDiscountId('')
        return
      }

      const discountAmount = validationResult.data.discount_amount

      setDiscountAmount(discountAmount)
      setAppliedDiscountCode(code)
      setAppliedDiscountId(discount.id)

      const discountType = discount.type === 'percentage'
        ? `${discount.value}% off`
        : `Potongan ${formatPrice(discount.value)}`

      toast.success(`${discount.name} berhasil diterapkan! Hemat ${formatPrice(discountAmount)}`)

    } catch (error) {
      console.error('Discount validation error:', error)
      toast.error('Terjadi kesalahan saat memvalidasi kode diskon')
      setDiscountAmount(0)
      setAppliedDiscountCode('')
      setAppliedDiscountId('')
    } finally {
      setIsValidatingDiscount(false)
    }
  }

  // Function to remove applied discount
  const removeDiscount = () => {
    setDiscountAmount(0)
    setAppliedDiscountCode('')
    setAppliedDiscountId('')
    setValue('discountCode', '')
    toast.success('Diskon telah dihapus')
  }

  if (!bookingData || !packageData || isLoadingPaymentMethods) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#346754] mx-auto mb-4"></div>
          <p className="text-slate-600">Memuat ringkasan booking...</p>
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
    if (!bookingData.addons) return []

    // Get all addons from grouped data
    const allAddons = Object.values(addonsGrouped).flat()

    return Object.entries(bookingData.addons)
      .filter(([_, quantity]) => quantity > 0)
      .map(([addonId, quantity]) => {
        const addon = allAddons.find(a => a.id === addonId)
        return {
          id: addonId,
          name: addon?.name || 'Unknown',
          price: addon?.price || 0,
          quantity
        }
      })
  }

  const getTotalPrice = () => {
    const packagePrice = packageData.price
    const addonsPrice = bookingData.addonsTotal || 0
    const subtotal = packagePrice + addonsPrice
    return Math.max(0, subtotal - discountAmount) // Ensure total is never negative
  }

  const getSubtotalPrice = () => {
    const packagePrice = packageData.price
    const addonsPrice = bookingData.addonsTotal || 0
    return packagePrice + addonsPrice
  }

  const getDpAmount = () => {
    return getTotalPrice() * packageData.dp_percentage / 100
  }

  // Calculate fee for selected payment method
  const calculateSelectedMethodFee = () => {
    if (!selectedPaymentMethod || !paymentMethods.length) return 0;

    const selectedMethod = paymentMethods.find(method => method.id === selectedPaymentMethod);
    if (!selectedMethod) return 0;

    const dpAmount = getDpAmount();

    if (selectedMethod.fee_type === 'fixed') {
      return selectedMethod.fee_amount || 0;
    } else {
      // Percentage fee
      return Math.round(dpAmount * (selectedMethod.fee_percentage || 0) / 100);
    }
  };

  const getDisplayTotal = () => {
    const dpAmount = getDpAmount();
    const fee = calculateSelectedMethodFee();
    return process.env.NEXT_PUBLIC_CUSTOMER_PAYS_FEES === 'true' ? dpAmount + fee : dpAmount;
  };

  const onSubmit = async (data: CustomerFormData) => {
    setIsSubmitting(true)

    try {
      if (!packageData || !bookingData) {
        toast.error('Data booking tidak lengkap')
        return
      }

      // Get all addons for price calculation
      const allAddons = Object.values(addonsGrouped).flat()
      const selectedAddons = bookingData.addons ? Object.entries(bookingData.addons)
        .filter(([_, quantity]) => quantity > 0)
        .map(([addonId, quantity]) => {
          const addon = allAddons.find(a => a.id === addonId)
          return {
            addon_id: addonId,
            quantity,
            unit_price: addon?.price || 0
          }
        }) : []

      const totalAddonsPrice = selectedAddons.reduce((total, addon) =>
        total + (addon.unit_price * addon.quantity), 0
      )

      const reservationData: CreateReservationData = {
        studio_id: packageData.studio_id,
        package_id: packageData.id,
        customer_name: data.name,
        customer_email: data.email,
        customer_phone: data.whatsapp,
        customer_notes: data.notes,
        is_guest_booking: true,
        reservation_date: format(new Date(bookingData.date), 'yyyy-MM-dd'),
        start_time: bookingData.timeSlot,
        duration_minutes: packageData.duration_minutes,
        selected_addons: selectedAddons,
        package_price: packageData.price,
        dp_percentage: packageData.dp_percentage,
        total_addons_price: totalAddonsPrice,
        special_requests: data.notes,
        payment_method: data.paymentMethod,
        discount_amount: discountAmount,
        discount_id: appliedDiscountId || undefined
      }

      const result = await createReservationAction(reservationData)

      if (!result.success) {
        toast.error(result.error || 'Gagal membuat reservasi')
        return
      }

      // Find selected payment method details
      const selectedMethod = paymentMethods.find(method => method.id === data.paymentMethod);

      const finalBookingData = {
        reservation: result.data?.reservation,
        customer: result.data?.customer,
        paymentMethod: data.paymentMethod,
        paymentMethodDetails: selectedMethod,
        totalPrice: getTotalPrice(),
        dpAmount: getDpAmount()
      }

      localStorage.setItem('finalBookingData', JSON.stringify(finalBookingData))
      localStorage.removeItem('bookingData') // Clear temporary data

      toast.success('Reservasi berhasil dibuat!')

      const methodType = selectedMethod?.type || 'bank_transfer'

      // Conditional redirect based on payment method
      if (methodType === 'bank_transfer') {
        // Create payment record for bank transfer before redirect
        if (result.data?.reservation.id) {
          const paymentResult = await createBankTransferPayment(
            result.data.reservation.id,
            data.paymentMethod,
            getDpAmount()
          )
          
          if (!paymentResult.success) {
            toast.error('Reservasi berhasil dibuat, tetapi gagal membuat record pembayaran')
            console.error('Payment creation error:', paymentResult.error)
          }
        }
        
        // For manual bank transfer, redirect to info page with WhatsApp contact
        router.push(`/booking/payment/info?method=${methodType}&booking=${result.data?.reservation.booking_code}&payment_method_id=${data.paymentMethod}`)
      } else {
        // For Xendit payments (e_wallet, va, etc), use existing flow
        router.push(`/booking/payment?method=${methodType}&booking=${result.data?.reservation.booking_code}&payment_method_id=${data.paymentMethod}`)
      }

    } catch (error) {
      console.error('Error creating reservation:', error)
      toast.error('Terjadi kesalahan. Silakan coba lagi.')
    } finally {
      setIsSubmitting(false)
    }
  }

  const formatPhoneNumber = (value: string) => {
    // Remove all non-numeric characters except + at the beginning
    const cleaned = value.replace(/[^\d+]/g, '')

    // If starts with 0, replace with +62
    if (cleaned.startsWith('0')) {
      return `+62${cleaned.slice(1)}`
    }

    // If doesn't start with +, add +62
    if (!cleaned.startsWith('+')) {
      return `+62${cleaned}`
    }

    return cleaned
  }

  const handleWhatsAppChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const formatted = formatPhoneNumber(e.target.value)
    setValue('whatsapp', formatted)
  }

  const selectedDate = bookingData.date ? new Date(bookingData.date) : null
  const selectedAddons = getSelectedAddons()

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-green-50/30 to-slate-100">
      {/* Header */}
      <div className="bg-white/80 backdrop-blur-sm border-b border-slate-200 sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <Button
                variant="ghost"
                size="sm"
                onClick={() => router.back()}
                className="flex items-center gap-2"
              >
                <ArrowLeft className="h-4 w-4" />
                Kembali
              </Button>
              <div className="text-sm text-slate-600">
                <Link href="/packages" className="hover:text-[#346754]">Paket</Link> /
                <Link href={`/packages/${packageData.id}`} className="hover:text-[#346754] mx-1">{packageData.name}</Link> /
                <Link href="/booking/addons" className="hover:text-[#346754] mx-1">Add-ons</Link> /
                Ringkasan
              </div>
            </div>

            {/* Progress Indicator - Hidden on mobile */}
            <div className="hidden sm:flex items-center gap-2 text-sm text-slate-600">
              <div className="flex items-center gap-2">
                <CheckCircle className="h-4 w-4 text-green-500" />
                <span>Paket</span>
              </div>
              <div className="w-8 h-px bg-slate-300"></div>
              <div className="flex items-center gap-2">
                <CheckCircle className="h-4 w-4 text-green-500" />
                <span>Add-ons</span>
              </div>
              <div className="w-8 h-px bg-slate-300"></div>
              <div className="flex items-center gap-2">
                <div className="w-4 h-4 bg-[#346754] rounded-full flex items-center justify-center">
                  <div className="w-2 h-2 bg-white rounded-full"></div>
                </div>
                <span className="font-medium">Pembayaran</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 sm:py-8">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 sm:gap-8">
          {/* Customer Information Form - Left Side */}
          <div className="lg:col-span-2 space-y-4 sm:space-y-6">
            {/* Title */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6 }}
            >
              <h1 className="text-xl sm:text-3xl font-bold text-[#346754] mb-1 sm:mb-2">Konfirmasi Booking</h1>
              <p className="text-xs sm:text-base text-slate-600">
                Lengkapi data diri dan pilih metode pembayaran untuk menyelesaikan booking
              </p>
            </motion.div>

            <form onSubmit={handleSubmit(onSubmit)} className="space-y-4 sm:space-y-6">
              {/* Customer Data */}
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6, delay: 0.1 }}
              >
                <Card className="bg-white/80 backdrop-blur-sm border-0 shadow-lg">
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2 text-lg sm:text-xl text-[#346754]">
                      <User className="h-4 w-4 sm:h-5 sm:w-5 text-[#346754]" />
                      Data Pelanggan
                    </CardTitle>
                    <CardDescription className="text-xs sm:text-sm">
                      Masukkan data diri untuk keperluan booking dan komunikasi. Email diperlukan untuk konfirmasi booking.
                    </CardDescription>
                  </CardHeader>

                  <CardContent className="space-y-3 sm:space-y-4">
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 sm:gap-4">
                      <div className="space-y-1.5 sm:space-y-2">
                        <Label htmlFor="name" className="text-xs sm:text-sm">Nama Lengkap *</Label>
                        <Input
                          id="name"
                          {...register('name')}
                          placeholder="Masukkan nama lengkap"
                          className={`text-xs sm:text-sm ${errors.name ? 'border-red-500' : ''}`}
                        />
                        {errors.name && (
                          <p className="text-xs text-red-500 flex items-center gap-1">
                            <AlertCircle className="h-3 w-3 sm:h-4 sm:w-4" />
                            {errors.name.message}
                          </p>
                        )}
                      </div>

                      <div className="space-y-1.5 sm:space-y-2">
                        <Label htmlFor="whatsapp" className="text-xs sm:text-sm">Nomor WhatsApp *</Label>
                        <Input
                          id="whatsapp"
                          {...register('whatsapp')}
                          onChange={handleWhatsAppChange}
                          placeholder="+62812345678"
                          className={`text-xs sm:text-sm ${errors.whatsapp ? 'border-red-500' : ''}`}
                        />
                        {errors.whatsapp && (
                          <p className="text-xs text-red-500 flex items-center gap-1">
                            <AlertCircle className="h-3 w-3 sm:h-4 sm:w-4" />
                            {errors.whatsapp.message}
                          </p>
                        )}
                      </div>
                    </div>

                    <div className="space-y-1.5 sm:space-y-2">
                      <Label htmlFor="email" className="text-xs sm:text-sm">Email *</Label>
                      <Input
                        id="email"
                        type="email"
                        {...register('email')}
                        placeholder="email@example.com"
                        className={`text-xs sm:text-sm ${errors.email ? 'border-red-500' : ''}`}
                      />
                      {errors.email && (
                        <p className="text-xs text-red-500 flex items-center gap-1">
                          <AlertCircle className="h-3 w-3 sm:h-4 sm:w-4" />
                          {errors.email.message}
                        </p>
                      )}
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 sm:gap-4">
                      <div className="space-y-1.5 sm:space-y-2">
                        <Label htmlFor="notes" className="text-xs sm:text-sm">Catatan Tambahan (Opsional)</Label>
                        <Textarea
                          id="notes"
                          {...register('notes')}
                          placeholder="Permintaan khusus, tema foto, dll."
                          rows={3}
                          className="text-xs sm:text-sm"
                        />
                      </div>

                      <div className="space-y-1.5 sm:space-y-2">
                        <Label htmlFor="discountCode" className="text-xs sm:text-sm flex items-center gap-1">
                          <Tag className="h-3 w-3 sm:h-4 sm:w-4" />
                          Kode Diskon (Opsional)
                        </Label>

                        {appliedDiscountCode ? (
                          // Show applied discount
                          <div className="border border-green-500 bg-green-50 rounded-lg p-3 space-y-2">
                            <div className="flex items-center justify-between">
                              <div className="flex items-center gap-2">
                                <CheckCircle className="h-4 w-4 text-green-600" />
                                <span className="font-medium text-green-800 text-sm">
                                  Kode "{appliedDiscountCode}" Diterapkan
                                </span>
                              </div>
                              <Button
                                type="button"
                                variant="ghost"
                                size="sm"
                                onClick={removeDiscount}
                                className="h-6 px-2 text-xs text-red-600 hover:text-red-800 hover:bg-red-50"
                              >
                                Hapus
                              </Button>
                            </div>
                            <p className="text-xs text-green-700">
                              Hemat {formatPrice(discountAmount)} dari total pembayaran
                            </p>
                          </div>
                        ) : (
                          // Show discount input
                          <>
                            <div className="flex gap-2">
                              <Input
                                id="discountCode"
                                {...register('discountCode')}
                                placeholder="DISKON10, WELCOME20, dst"
                                className="text-xs sm:text-sm flex-1"
                                disabled={isValidatingDiscount}
                                onKeyDown={(e) => {
                                  if (e.key === 'Enter') {
                                    e.preventDefault()
                                    applyDiscount()
                                  }
                                }}
                              />
                              <Button
                                type="button"
                                variant="outline"
                                size="sm"
                                onClick={applyDiscount}
                                disabled={isValidatingDiscount || !discountCode}
                                className="px-3 text-xs shrink-0"
                              >
                                {isValidatingDiscount ? (
                                  <div className="animate-spin rounded-full h-3 w-3 border-b-2 border-current"></div>
                                ) : (
                                  'Apply'
                                )}
                              </Button>
                            </div>

                            {isValidatingDiscount && (
                              <div className="text-xs text-blue-600 flex items-center gap-1">
                                <div className="animate-spin rounded-full h-3 w-3 border-b-2 border-blue-600"></div>
                                Memvalidasi kode diskon...
                              </div>
                            )}

                            <p className="text-xs text-slate-500">
                              Masukkan kode diskon dan klik "Apply" untuk mendapatkan potongan harga
                            </p>
                          </>
                        )}
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </motion.div>

              {/* Payment Method */}
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6, delay: 0.2 }}
              >
                <Card className="bg-white/80 backdrop-blur-sm border-0 shadow-lg">
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2 text-lg sm:text-xl text-[#346754]">
                      <CreditCard className="h-4 w-4 sm:h-5 sm:w-5 text-[#346754]" />
                      Metode Pembayaran
                    </CardTitle>
                    <CardDescription className="text-xs sm:text-sm">
                      Pilih metode pembayaran untuk DP sebesar {formatPrice(getDpAmount())}
                    </CardDescription>
                  </CardHeader>

                  <CardContent>
                    {paymentMethods.length > 0 ? (
                      <RadioGroup
                        value={selectedPaymentMethod}
                        onValueChange={(value) => setValue('paymentMethod', value)}
                        className="space-y-2 sm:space-y-3"
                      >
                        {paymentMethods.map((method) => {
                          const formattedMethod = formatPaymentMethod(method)
                          return (
                            <div key={method.id} className="flex items-center space-x-2 sm:space-x-3">
                              <RadioGroupItem value={method.id} id={method.id} className="h-4 w-4 sm:h-5 sm:w-5" />
                              <Label
                                htmlFor={method.id}
                                className="flex-1 flex items-center gap-2 sm:gap-3 p-2 sm:p-3 rounded-lg border hover:bg-slate-50 cursor-pointer text-xs sm:text-sm"
                              >
                                <div className="text-lg sm:text-xl">{formattedMethod.icon}</div>
                                <div className="flex-1">
                                  <div className="flex items-center gap-1 sm:gap-2 flex-wrap">
                                    <span className="font-medium">{method.name}</span>
                                    {shouldDisplayFeesToCustomers() && (method.fee_percentage || 0) > 0 && (
                                      <Badge variant="outline" className="text-xs py-0.5 px-1.5">
                                        Fee {formatFeeDisplay(
                                          method.fee_type || 'percentage',
                                          method.fee_percentage || 0,
                                          method.fee_amount || 0
                                        )}
                                      </Badge>
                                    )}
                                    {method.type === 'e_wallet' && (
                                      <Badge variant="secondary" className="text-xs py-0.5 px-1.5">
                                        Populer
                                      </Badge>
                                    )}
                                  </div>
                                  <p className="text-xs text-slate-600 mt-0.5">{formattedMethod.description}</p>
                                </div>
                              </Label>
                            </div>
                          )
                        })}
                      </RadioGroup>
                    ) : (
                      <div className="text-center py-3 sm:py-4 text-slate-500 text-xs sm:text-sm">
                        <p>Metode pembayaran belum tersedia untuk studio ini</p>
                      </div>
                    )}

                    {errors.paymentMethod && (
                      <p className="text-xs sm:text-sm text-red-500 flex items-center gap-1 mt-2 sm:mt-3">
                        <AlertCircle className="h-3 w-3 sm:h-4 sm:w-4" />
                        {errors.paymentMethod.message}
                      </p>
                    )}
                  </CardContent>
                </Card>
              </motion.div>

              {/* Submit Button */}
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6, delay: 0.3 }}
                className="lg:hidden"
              >
                <Button
                  type="submit"
                  disabled={isSubmitting}
                  className="w-full bg-gradient-to-r from-[#346754] to-[#b0834d] hover:from-[#346754]/90 hover:to-[#b0834d]/90 text-xs sm:text-base py-2 sm:py-3"
                  size="lg"
                >
                  {isSubmitting ? (
                    <>
                      <div className="animate-spin rounded-full h-3 w-3 sm:h-4 sm:w-4 border-b-2 border-white mr-1.5 sm:mr-2"></div>
                      Memproses...
                    </>
                  ) : (
                    <>
                      Lanjut ke Pembayaran
                      <ArrowRight className="h-3 w-3 sm:h-4 sm:w-4 ml-1.5 sm:ml-2" />
                    </>
                  )}
                </Button>
              </motion.div>
            </form>
          </div>

          {/* Booking Summary - Right Side */}
          <div className="lg:col-span-1">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.4 }}
              className="sticky top-20 sm:top-24 space-y-4 sm:space-y-6"
            >
              {/* Booking Details */}
              <Card className="bg-white/90 backdrop-blur-sm border-0 shadow-xl">
                <CardHeader>
                  <CardTitle className="text-lg sm:text-xl text-[#346754]">Detail Booking</CardTitle>
                </CardHeader>

                <CardContent className="space-y-3 sm:space-y-4">
                  {/* Package Info */}
                  <div className="space-y-2 sm:space-y-3">
                    <div className="flex items-start gap-2 sm:gap-3">
                      <div className="w-10 h-10 sm:w-12 sm:h-12 bg-gradient-to-r from-[#346754] to-[#b0834d] rounded-lg flex items-center justify-center flex-shrink-0">
                        <Camera className="h-5 w-5 sm:h-6 sm:w-6 text-white" />
                      </div>
                      <div className="flex-1">
                        <h4 className="font-medium text-[#346754] text-sm sm:text-base">{packageData.name}</h4>
                        {packageData.category && (
                          <p className="text-xs sm:text-sm text-slate-600">{packageData.category.name}</p>
                        )}
                      </div>
                      <p className="font-semibold text-[#b0834d] text-sm sm:text-base">{formatPrice(packageData.price)}</p>
                    </div>

                    <div className="grid grid-cols-2 gap-2 sm:gap-4 text-xs sm:text-sm">
                      <div className="flex items-center gap-1.5 sm:gap-2 text-slate-600">
                        <Clock className="h-3 w-3 sm:h-4 sm:w-4" />
                        {formatDuration(packageData.duration_minutes)}
                      </div>
                      <div className="flex items-center gap-1.5 sm:gap-2 text-slate-600">
                        <MapPin className="h-3 w-3 sm:h-4 sm:w-4" />
                        Studio
                      </div>
                    </div>
                  </div>

                  {/* Date and Time */}
                  <div className="border-t pt-3 sm:pt-4">
                    <div className="space-y-1.5 sm:space-y-2">
                      {selectedDate && (
                        <div className="flex items-center gap-1.5 sm:gap-2 text-slate-600 text-xs sm:text-sm">
                          <Calendar className="h-3 w-3 sm:h-4 sm:w-4" />
                          <span>{format(selectedDate, 'EEEE, dd MMMM yyyy', { locale: idLocale })}</span>
                        </div>
                      )}
                      <div className="flex items-center gap-1.5 sm:gap-2 text-slate-600 text-xs sm:text-sm">
                        <Clock className="h-3 w-3 sm:h-4 sm:w-4" />
                        <span>{bookingData.timeSlot}</span>
                      </div>
                    </div>
                  </div>

                  {/* Applied Discount */}
                  {appliedDiscountCode && (
                    <div className="border-t pt-3 sm:pt-4">
                      <h4 className="font-semibold text-[#346754] mb-2 sm:mb-3 flex items-center gap-1.5 sm:gap-2 text-sm sm:text-base">
                        <Tag className="h-3 w-3 sm:h-4 sm:w-4 text-green-600" />
                        Diskon Diterapkan
                      </h4>
                      <div className="bg-green-50 border border-green-200 rounded-lg p-2 sm:p-3">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-2">
                            <CheckCircle className="h-4 w-4 text-green-600" />
                            <span className="font-medium text-green-800 text-sm">
                              {appliedDiscountCode}
                            </span>
                          </div>
                          <span className="font-semibold text-green-600 text-sm">
                            -{formatPrice(discountAmount)}
                          </span>
                        </div>
                        <p className="text-xs text-green-700 mt-1">
                          Diskon berhasil diterapkan pada booking Anda
                        </p>
                      </div>
                    </div>
                  )}

                  {/* Selected Add-ons */}
                  {selectedAddons.length > 0 && (
                    <div className="border-t pt-3 sm:pt-4">
                      <h4 className="font-semibold text-[#346754] mb-2 sm:mb-3 flex items-center gap-1.5 sm:gap-2 text-sm sm:text-base">
                        <Gift className="h-3 w-3 sm:h-4 sm:w-4" />
                        Add-ons
                      </h4>
                      <div className="space-y-1.5 sm:space-y-2">
                        {selectedAddons.map((addon) => (
                          <div key={addon.id} className="flex justify-between text-xs sm:text-sm">
                            <span className="text-slate-600">
                              {addon.name} {addon.quantity > 1 && `(${addon.quantity}x)`}
                            </span>
                            <span className="font-medium">
                              {formatPrice(addon.price * addon.quantity)}
                            </span>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Total */}
                  <div className="border-t pt-3 sm:pt-4 space-y-2 sm:space-y-3">
                    <div className="flex justify-between text-xs sm:text-sm">
                      <span className="text-slate-600">Subtotal</span>
                      <span className="font-medium">{formatPrice(getSubtotalPrice())}</span>
                    </div>

                    {discountAmount > 0 && (
                      <div className="flex justify-between text-xs sm:text-sm">
                        <span className="text-green-600 flex items-center gap-1">
                          <Tag className="h-3 w-3" />
                          Diskon
                        </span>
                        <span className="font-medium text-green-600">-{formatPrice(discountAmount)}</span>
                      </div>
                    )}
                    
                    {discountAmount > 0 && (
                      <div className="flex justify-between text-sm sm:text-base font-semibold border-t pt-2">
                        <span className="text-slate-800">Total Setelah Diskon</span>
                        <span className="text-[#346754]">{formatPrice(getTotalPrice())}</span>
                      </div>
                    )}

                    {selectedPaymentMethod && shouldDisplayFeesToCustomers() && calculateSelectedMethodFee() > 0 && (
                      <div className="flex justify-between text-xs sm:text-sm">
                        <span className="text-slate-600">Biaya Payment</span>
                        <span className="font-medium text-red-600">+{formatPrice(calculateSelectedMethodFee())}</span>
                      </div>
                    )}

                    <div className="flex justify-between text-base sm:text-lg font-bold border-t pt-2">
                      <span>DP ({packageData.dp_percentage}%)</span>
                      {shouldDisplayFeesToCustomers() && calculateSelectedMethodFee() > 0 ? (
                        <span className="text-[#b0834d]">{formatPrice(getDisplayTotal())}</span>
                      ) : (
                        <span className="text-[#b0834d]">{formatPrice(getDpAmount())}</span>
                      )}
                    </div>

                    <div className="text-xs text-slate-500 bg-slate-50 p-2 sm:p-3 rounded-lg">
                      <p className="font-medium mb-1">Catatan:</p>
                      <p>
                        Sisa pembayaran {formatPrice(getTotalPrice() - getDpAmount())} akan dibayar
                        pada hari sesi foto.
                      </p>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Submit Button for Desktop */}
              <div className="hidden lg:block">
                <Button
                  type="submit"
                  form="booking-form"
                  onClick={handleSubmit(onSubmit)}
                  disabled={isSubmitting}
                  className="w-full bg-gradient-to-r from-[#346754] to-[#b0834d] hover:from-[#346754]/90 hover:to-[#b0834d]/90 text-xs sm:text-base py-2 sm:py-3"
                  size="lg"
                >
                  {isSubmitting ? (
                    <>
                      <div className="animate-spin rounded-full h-3 w-3 sm:h-4 sm:w-4 border-b-2 border-white mr-1.5 sm:mr-2"></div>
                      Memproses...
                    </>
                  ) : (
                    <>
                      Lanjut ke Pembayaran
                      <ArrowRight className="h-3 w-3 sm:h-4 sm:w-4 ml-1.5 sm:ml-2" />
                    </>
                  )}
                </Button>
              </div>
            </motion.div>
          </div>
        </div>
      </div>
    </div>
  )
}