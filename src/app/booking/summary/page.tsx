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
  DollarSign,
  Gift,
  AlertCircle
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
import { createReservationAction } from '@/actions/reservations'
import type { CreateReservationData } from '@/actions/reservations'
import { toast } from 'sonner'
import Link from 'next/link'

const customerSchema = z.object({
  name: z.string().min(2, 'Nama minimal 2 karakter').max(100, 'Nama maksimal 100 karakter'),
  whatsapp: z.string()
    .min(10, 'Nomor WhatsApp tidak valid')
    .max(15, 'Nomor WhatsApp tidak valid')
    .regex(/^[\d+\-\s()]+$/, 'Format nomor WhatsApp tidak valid'),
  email: z.string().email('Format email tidak valid').optional().or(z.literal('')),
  notes: z.string().optional(),
  paymentMethod: z.enum(['midtrans', 'bank_transfer', 'gopay', 'ovo', 'dana']).refine((val) => val !== undefined, {
    message: 'Pilih metode pembayaran'
  })
})

type CustomerFormData = z.infer<typeof customerSchema>

interface BookingData {
  packageId: string
  date: string
  timeSlot: string
  addons?: {[key: string]: number}
  addonsTotal?: number
}

const paymentMethods = [
  {
    id: 'midtrans',
    name: 'Kartu Kredit/Debit',
    description: 'Visa, Mastercard, JCB',
    icon: CreditCard,
    popular: true
  },
  {
    id: 'gopay',
    name: 'GoPay',
    description: 'Pembayaran digital GoPay',
    icon: DollarSign,
    popular: true
  },
  {
    id: 'ovo',
    name: 'OVO',
    description: 'Pembayaran digital OVO',
    icon: DollarSign,
    popular: false
  },
  {
    id: 'dana',
    name: 'DANA',
    description: 'Pembayaran digital DANA',
    icon: DollarSign,
    popular: false
  },
  {
    id: 'bank_transfer',
    name: 'Transfer Bank',
    description: 'BCA, Mandiri, BRI, BNI',
    icon: CreditCard,
    popular: false
  }
]

export default function BookingSummaryPage() {
  const router = useRouter()
  const [bookingData, setBookingData] = useState<BookingData | null>(null)
  const [isSubmitting, setIsSubmitting] = useState(false)
  
  const { data: packageData } = usePublicPackage(bookingData?.packageId || '')
  const { data: addonsGrouped = {} } = usePublicAddonsGrouped(packageData?.studio_id)

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

  useEffect(() => {
    const storedData = localStorage.getItem('bookingData')
    if (storedData) {
      const data = JSON.parse(storedData)
      setBookingData(data)
    } else {
      router.push('/packages')
    }
  }, [router])

  if (!bookingData || !packageData) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
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
    return packagePrice + addonsPrice
  }

  const getDpAmount = () => {
    return getTotalPrice() * packageData.dp_percentage / 100
  }

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
        payment_method: data.paymentMethod
      }

      const result = await createReservationAction(reservationData)
      
      if (!result.success) {
        toast.error(result.error || 'Gagal membuat reservasi')
        return
      }

      const finalBookingData = {
        reservation: result.data?.reservation,
        customer: result.data?.customer,
        paymentMethod: data.paymentMethod,
        totalPrice: getTotalPrice(),
        dpAmount: getDpAmount()
      }
      
      localStorage.setItem('finalBookingData', JSON.stringify(finalBookingData))
      localStorage.removeItem('bookingData') // Clear temporary data
      
      toast.success('Reservasi berhasil dibuat!')
      
      // Redirect to payment gateway
      router.push(`/booking/payment?method=${data.paymentMethod}&booking=${result.data?.reservation.booking_code}`)
      
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
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50/30 to-slate-100">
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
                <Link href="/packages" className="hover:text-blue-600">Paket</Link> / 
                <Link href={`/packages/${packageData.id}`} className="hover:text-blue-600 mx-1">{packageData.name}</Link> / 
                <Link href="/booking/addons" className="hover:text-blue-600 mx-1">Add-ons</Link> / 
                Ringkasan
              </div>
            </div>
            
            {/* Progress Indicator */}
            <div className="flex items-center gap-2 text-sm text-slate-600">
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
                <div className="w-4 h-4 bg-blue-600 rounded-full flex items-center justify-center">
                  <div className="w-2 h-2 bg-white rounded-full"></div>
                </div>
                <span className="font-medium">Pembayaran</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Customer Information Form - Left Side */}
          <div className="lg:col-span-2 space-y-6">
            {/* Title */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6 }}
            >
              <h1 className="text-3xl font-bold text-slate-900 mb-2">Konfirmasi Booking</h1>
              <p className="text-slate-600">
                Lengkapi data diri dan pilih metode pembayaran untuk menyelesaikan booking
              </p>
            </motion.div>

            <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
              {/* Customer Data */}
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6, delay: 0.1 }}
              >
                <Card className="bg-white/80 backdrop-blur-sm border-0 shadow-lg">
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <User className="h-5 w-5 text-blue-600" />
                      Data Pelanggan
                    </CardTitle>
                    <CardDescription>
                      Masukkan data diri untuk keperluan booking dan komunikasi
                    </CardDescription>
                  </CardHeader>
                  
                  <CardContent className="space-y-4">
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label htmlFor="name">Nama Lengkap *</Label>
                        <Input
                          id="name"
                          {...register('name')}
                          placeholder="Masukkan nama lengkap"
                          className={errors.name ? 'border-red-500' : ''}
                        />
                        {errors.name && (
                          <p className="text-sm text-red-500 flex items-center gap-1">
                            <AlertCircle className="h-4 w-4" />
                            {errors.name.message}
                          </p>
                        )}
                      </div>
                      
                      <div className="space-y-2">
                        <Label htmlFor="whatsapp">Nomor WhatsApp *</Label>
                        <Input
                          id="whatsapp"
                          {...register('whatsapp')}
                          onChange={handleWhatsAppChange}
                          placeholder="+62812345678"
                          className={errors.whatsapp ? 'border-red-500' : ''}
                        />
                        {errors.whatsapp && (
                          <p className="text-sm text-red-500 flex items-center gap-1">
                            <AlertCircle className="h-4 w-4" />
                            {errors.whatsapp.message}
                          </p>
                        )}
                      </div>
                    </div>
                    
                    <div className="space-y-2">
                      <Label htmlFor="email">Email (Opsional)</Label>
                      <Input
                        id="email"
                        type="email"
                        {...register('email')}
                        placeholder="email@example.com"
                        className={errors.email ? 'border-red-500' : ''}
                      />
                      {errors.email && (
                        <p className="text-sm text-red-500 flex items-center gap-1">
                          <AlertCircle className="h-4 w-4" />
                          {errors.email.message}
                        </p>
                      )}
                    </div>
                    
                    <div className="space-y-2">
                      <Label htmlFor="notes">Catatan Tambahan (Opsional)</Label>
                      <Textarea
                        id="notes"
                        {...register('notes')}
                        placeholder="Permintaan khusus, tema foto, dll."
                        rows={3}
                      />
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
                    <CardTitle className="flex items-center gap-2">
                      <CreditCard className="h-5 w-5 text-blue-600" />
                      Metode Pembayaran
                    </CardTitle>
                    <CardDescription>
                      Pilih metode pembayaran untuk DP sebesar {formatPrice(getDpAmount())}
                    </CardDescription>
                  </CardHeader>
                  
                  <CardContent>
                    <RadioGroup 
                      value={selectedPaymentMethod} 
                      onValueChange={(value) => setValue('paymentMethod', value as any)}
                      className="space-y-3"
                    >
                      {paymentMethods.map((method) => {
                        const Icon = method.icon
                        return (
                          <div key={method.id} className="flex items-center space-x-3">
                            <RadioGroupItem value={method.id} id={method.id} />
                            <Label 
                              htmlFor={method.id} 
                              className="flex-1 flex items-center gap-3 p-3 rounded-lg border hover:bg-slate-50 cursor-pointer"
                            >
                              <Icon className="h-5 w-5 text-slate-600" />
                              <div className="flex-1">
                                <div className="flex items-center gap-2">
                                  <span className="font-medium">{method.name}</span>
                                  {method.popular && (
                                    <Badge variant="secondary" className="text-xs">
                                      Populer
                                    </Badge>
                                  )}
                                </div>
                                <p className="text-sm text-slate-600">{method.description}</p>
                              </div>
                            </Label>
                          </div>
                        )
                      })}
                    </RadioGroup>
                    
                    {errors.paymentMethod && (
                      <p className="text-sm text-red-500 flex items-center gap-1 mt-3">
                        <AlertCircle className="h-4 w-4" />
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
                  className="w-full bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800"
                  size="lg"
                >
                  {isSubmitting ? (
                    <>
                      <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white mr-2"></div>
                      Memproses...
                    </>
                  ) : (
                    <>
                      Lanjut ke Pembayaran
                      <ArrowRight className="h-5 w-5 ml-2" />
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
              className="sticky top-24 space-y-6"
            >
              {/* Booking Details */}
              <Card className="bg-white/90 backdrop-blur-sm border-0 shadow-xl">
                <CardHeader>
                  <CardTitle>Detail Booking</CardTitle>
                </CardHeader>
                
                <CardContent className="space-y-4">
                  {/* Package Info */}
                  <div className="space-y-3">
                    <div className="flex items-start gap-3">
                      <div className="w-12 h-12 bg-gradient-to-r from-blue-500 to-purple-600 rounded-lg flex items-center justify-center flex-shrink-0">
                        <Camera className="h-6 w-6 text-white" />
                      </div>
                      <div className="flex-1">
                        <h4 className="font-medium text-slate-900">{packageData.name}</h4>
                        {packageData.category && (
                          <p className="text-sm text-slate-600">{packageData.category.name}</p>
                        )}
                      </div>
                      <p className="font-semibold text-slate-900">{formatPrice(packageData.price)}</p>
                    </div>
                    
                    <div className="grid grid-cols-2 gap-4 text-sm">
                      <div className="flex items-center gap-2 text-slate-600">
                        <Clock className="h-4 w-4" />
                        {formatDuration(packageData.duration_minutes)}
                      </div>
                      <div className="flex items-center gap-2 text-slate-600">
                        <MapPin className="h-4 w-4" />
                        Studio
                      </div>
                    </div>
                  </div>

                  {/* Date and Time */}
                  <div className="border-t pt-4">
                    <div className="space-y-2">
                      {selectedDate && (
                        <div className="flex items-center gap-2 text-slate-600">
                          <Calendar className="h-4 w-4" />
                          <span>{format(selectedDate, 'EEEE, dd MMMM yyyy', { locale: idLocale })}</span>
                        </div>
                      )}
                      <div className="flex items-center gap-2 text-slate-600">
                        <Clock className="h-4 w-4" />
                        <span>{bookingData.timeSlot}</span>
                      </div>
                    </div>
                  </div>

                  {/* Selected Add-ons */}
                  {selectedAddons.length > 0 && (
                    <div className="border-t pt-4">
                      <h4 className="font-semibold text-slate-900 mb-3 flex items-center gap-2">
                        <Gift className="h-4 w-4" />
                        Add-ons
                      </h4>
                      <div className="space-y-2">
                        {selectedAddons.map((addon) => (
                          <div key={addon.id} className="flex justify-between text-sm">
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
                  <div className="border-t pt-4 space-y-3">
                    <div className="flex justify-between">
                      <span className="text-slate-600">Subtotal</span>
                      <span className="font-medium">{formatPrice(getTotalPrice())}</span>
                    </div>
                    
                    <div className="flex justify-between text-lg font-bold">
                      <span>DP ({packageData.dp_percentage}%)</span>
                      <span className="text-blue-600">{formatPrice(getDpAmount())}</span>
                    </div>
                    
                    <div className="text-xs text-slate-500 bg-slate-50 p-3 rounded-lg">
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
                  className="w-full bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800"
                  size="lg"
                >
                  {isSubmitting ? (
                    <>
                      <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white mr-2"></div>
                      Memproses...
                    </>
                  ) : (
                    <>
                      Lanjut ke Pembayaran
                      <ArrowRight className="h-5 w-5 ml-2" />
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