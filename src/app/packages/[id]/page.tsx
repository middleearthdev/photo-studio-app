'use client'

import { useState } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { motion } from 'framer-motion'
import { format, addDays, startOfDay, isBefore, isSameDay } from 'date-fns'
import { id as idLocale } from 'date-fns/locale'
import {
  ArrowLeft,
  Camera,
  Clock,
  Users,
  Image as ImageIcon,
  Sparkles,
  Calendar,
  ChevronLeft,
  ChevronRight,
  CheckCircle
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card'
import { usePublicPackage } from '@/hooks/use-customer-packages'
import { useAvailableTimeSlots } from '@/hooks/use-time-slots'
import type { AvailableSlot } from '@/actions/time-slots'
import Link from 'next/link'
import { BottomNav } from '@/components/navigation/bottom-nav'

export default function PackageDetailPage() {
  const params = useParams()
  const router = useRouter()
  const packageId = params.id as string

  const [selectedDate, setSelectedDate] = useState<Date | null>(null)
  const [selectedTimeSlot, setSelectedTimeSlot] = useState<string | null>(null)
  const [currentWeekStart, setCurrentWeekStart] = useState<Date>(startOfDay(new Date()))

  const { data: packageData, isLoading } = usePublicPackage(packageId)
  const { data: availableTimeSlots = [], isLoading: timeSlotsLoading } = useAvailableTimeSlots(
    packageData?.studio_id,
    selectedDate ? format(selectedDate, 'yyyy-MM-dd') : undefined,
    packageData?.duration_minutes,
    packageData?.id
  )

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#00052e] mx-auto mb-4"></div>
          <p className="text-slate-600">Memuat detail paket...</p>
        </div>
      </div>
    )
  }

  if (!packageData) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 flex items-center justify-center">
        <div className="text-center">
          <Camera className="h-20 w-20 text-slate-400 mx-auto mb-4" />
          <h2 className="text-2xl font-semibold text-slate-600">Paket tidak ditemukan</h2>
          <p className="text-slate-500 mt-2">Paket yang Anda cari tidak tersedia</p>
          <Link href="/packages">
            <Button className="mt-4">Kembali ke Daftar Paket</Button>
          </Link>
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

  const getDaysInWeek = (startDate: Date) => {
    const days = []
    for (let i = 0; i < 7; i++) {
      days.push(addDays(startDate, i))
    }
    return days
  }

  const handlePrevWeek = () => {
    setCurrentWeekStart(addDays(currentWeekStart, -7))
  }

  const handleNextWeek = () => {
    setCurrentWeekStart(addDays(currentWeekStart, 7))
  }

  const handleDateSelect = (date: Date) => {
    if (isBefore(date, startOfDay(new Date()))) return
    setSelectedDate(date)
    setSelectedTimeSlot(null)
  }

  const handleTimeSlotSelect = (timeSlotId: string) => {
    setSelectedTimeSlot(timeSlotId)
  }

  const handleContinueBooking = () => {
    if (selectedDate && selectedTimeSlot) {
      const selectedSlot = availableTimeSlots.find(slot => slot.id === selectedTimeSlot)
      const bookingData = {
        packageId,
        date: selectedDate.toISOString(),
        timeSlot: selectedSlot?.time || selectedTimeSlot
      }

      // Store booking data and redirect to add-ons
      localStorage.setItem('bookingData', JSON.stringify(bookingData))
      router.push(`/booking/addons?package=${packageId}`)
    }
  }

  const weekDays = getDaysInWeek(currentWeekStart)
  const today = new Date()
  const selectedTimeSlotData = availableTimeSlots.find(slot => slot.id === selectedTimeSlot)

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50/30 to-slate-100">
      {/* Header */}
      <div className="bg-white/80 backdrop-blur-sm border-b border-slate-200 sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
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
              <Link href="/packages" className="hover:text-[#00052e]">Paket</Link> / {packageData.name}
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 sm:py-8">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 sm:gap-8">
          {/* Package Detail - Left Side */}
          <div className="lg:col-span-2 space-y-4 sm:space-y-6">
            {/* Package Info Card */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6 }}
            >
              <Card className="bg-white/80 backdrop-blur-sm border-0 shadow-lg">
                <CardHeader>
                  <div className="flex items-start justify-between">
                    <div>
                      {packageData.category && (
                        <Badge className="mb-2 bg-[#b0834d]/10 text-[#b0834d] border-[#b0834d]/20">
                          {packageData.category.name}
                        </Badge>
                      )}
                      <CardTitle className="text-xl sm:text-3xl font-bold text-[#00052e] mb-2">
                        {packageData.name}
                      </CardTitle>
                      {packageData.is_popular && (
                        <Badge className="bg-gradient-to-r from-[#b0834d] to-[#00052e] text-white">
                          <CheckCircle className="h-4 w-4 mr-1" />
                          TERPOPULER
                        </Badge>
                      )}
                    </div>
                    <div className="w-12 h-12 sm:w-16 sm:h-16 bg-gradient-to-r from-[#00052e] to-[#b0834d] rounded-full flex items-center justify-center">
                      <Camera className="h-6 w-6 sm:h-8 sm:w-8 text-white" />
                    </div>
                  </div>
                </CardHeader>

                <CardContent className="space-y-6">
                  {packageData.description && (
                    <p className="text-slate-600 text-sm sm:text-lg leading-relaxed">
                      {packageData.description}
                    </p>
                  )}

                  {/* Package Details */}
                  <div className="grid grid-cols-3 gap-2 sm:gap-4">
                    <div className="bg-[#00052e]/5 rounded-lg p-2 sm:p-4 text-center">
                      <Clock className="h-4 w-4 sm:h-6 sm:w-6 text-[#00052e] mx-auto mb-1 sm:mb-2" />
                      <p className="font-semibold text-[#00052e] text-xs sm:text-base">{formatDuration(packageData.duration_minutes)}</p>
                      <p className="text-xs text-slate-600">Durasi</p>
                    </div>

                    {packageData.max_photos && (
                      <div className="bg-[#b0834d]/5 rounded-lg p-2 sm:p-4 text-center">
                        <ImageIcon className="h-4 w-4 sm:h-6 sm:w-6 text-[#b0834d] mx-auto mb-1 sm:mb-2" />
                        <p className="font-semibold text-[#b0834d] text-xs sm:text-base">{packageData.max_photos}</p>
                        <p className="text-xs text-slate-600">Foto</p>
                      </div>
                    )}

                    <div className="bg-slate-50 rounded-lg p-2 sm:p-4 text-center">
                      <Users className="h-4 w-4 sm:h-6 sm:w-6 text-slate-600 mx-auto mb-1 sm:mb-2" />
                      <p className="font-semibold text-slate-900 text-xs sm:text-base">1-4</p>
                      <p className="text-xs text-slate-600">Orang</p>
                    </div>
                  </div>

                  {/* Includes */}
                  {packageData.includes && packageData.includes.length > 0 && (
                    <div>
                      <h3 className="font-semibold text-[#00052e] text-lg sm:text-xl mb-3 sm:mb-4 flex items-center gap-2">
                        <Sparkles className="h-4 w-4 sm:h-5 sm:w-5 text-[#b0834d]" />
                        Yang Anda Dapatkan
                      </h3>
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 sm:gap-3">
                        {packageData.includes.map((item: string, idx: number) => (
                          <div key={idx} className="flex items-start gap-2 sm:gap-3 p-2 sm:p-3 bg-slate-50 rounded-lg">
                            <CheckCircle className="h-4 w-4 sm:h-5 sm:w-5 text-green-500 mt-0.5 flex-shrink-0" />
                            <span className="text-xs sm:text-base text-slate-700">{item}</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </CardContent>
              </Card>
            </motion.div>

            {/* Date Selection */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.2 }}
            >
              <Card className="bg-white/80 backdrop-blur-sm border-0 shadow-lg">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2 text-lg sm:text-xl text-[#00052e]">
                    <Calendar className="h-4 w-4 sm:h-5 sm:w-5 text-[#00052e]" />
                    Pilih Tanggal
                  </CardTitle>
                  <CardDescription className="text-sm">
                    Pilih tanggal yang tersedia untuk sesi foto Anda
                  </CardDescription>
                </CardHeader>

                <CardContent>
                  {/* Week Navigation */}
                  <div className="flex items-center justify-between mb-6">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={handlePrevWeek}
                      disabled={isBefore(addDays(currentWeekStart, -7), startOfDay(today))}
                    >
                      <ChevronLeft className="h-4 w-4" />
                    </Button>

                    <h3 className="font-semibold text-[#00052e] text-sm sm:text-base">
                      {format(currentWeekStart, 'MMMM yyyy', { locale: idLocale })}
                    </h3>

                    <Button variant="outline" size="sm" onClick={handleNextWeek}>
                      <ChevronRight className="h-4 w-4" />
                    </Button>
                  </div>

                  {/* Days Grid */}
                  <div className="grid grid-cols-7 gap-1 sm:gap-2">
                    {weekDays.map((day, index) => {
                      const isToday = isSameDay(day, today)
                      const isPast = isBefore(day, startOfDay(today))
                      const isSelected = selectedDate && isSameDay(day, selectedDate)

                      return (
                        <button
                          key={index}
                          onClick={() => handleDateSelect(day)}
                          disabled={isPast}
                          className={`p-2 sm:p-3 rounded-lg text-center transition-all duration-200 ${isPast
                              ? 'bg-slate-100 text-slate-400 cursor-not-allowed'
                              : isSelected
                                ? 'bg-[#00052e] text-white shadow-lg'
                                : isToday
                                  ? 'bg-[#b0834d]/10 text-[#b0834d] hover:bg-[#b0834d]/20'
                                  : 'bg-slate-50 text-slate-700 hover:bg-slate-100'
                            }`}
                        >
                          <div className="text-xs font-medium mb-0.5 sm:mb-1">
                            {format(day, 'EEE', { locale: idLocale }).toUpperCase()}
                          </div>
                          <div className="text-sm sm:text-lg font-bold">
                            {format(day, 'd')}
                          </div>
                        </button>
                      )
                    })}
                  </div>
                </CardContent>
              </Card>
            </motion.div>

            {/* Time Slot Selection */}
            {selectedDate && (
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.4 }}
              >
                <Card className="bg-white/80 backdrop-blur-sm border-0 shadow-lg">
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2 text-lg sm:text-xl text-[#00052e]">
                      <Clock className="h-4 w-4 sm:h-5 sm:w-5 text-[#00052e]" />
                      Pilih Jam
                    </CardTitle>
                    <CardDescription className="text-sm">
                      Tersedia untuk {format(selectedDate, 'EEEE, dd MMMM yyyy', { locale: idLocale })}
                    </CardDescription>
                  </CardHeader>

                  <CardContent>
                    {timeSlotsLoading ? (
                      <div className="flex justify-center py-8">
                        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[#00052e]"></div>
                      </div>
                    ) : availableTimeSlots.length === 0 ? (
                      <div className="text-center py-8">
                        <Clock className="h-16 w-16 text-slate-400 mx-auto mb-4" />
                        <p className="text-slate-500">Tidak ada slot waktu tersedia untuk tanggal ini</p>
                      </div>
                    ) : (
                      <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 sm:gap-3">
                        {availableTimeSlots.map((slot) => (
                          <button
                            key={slot.id}
                            onClick={() => handleTimeSlotSelect(slot.id)}
                            disabled={!slot.available}
                            className={`p-3 sm:p-4 rounded-lg font-medium transition-all duration-200 ${!slot.available
                                ? 'bg-red-50 text-red-400 cursor-not-allowed border border-red-200'
                                : selectedTimeSlot === slot.id
                                  ? 'bg-[#00052e] text-white shadow-lg'
                                  : 'bg-slate-50 text-slate-700 hover:bg-slate-100 border border-slate-200'
                              }`}
                          >
                            <div className="text-sm sm:text-lg font-bold mb-0.5 sm:mb-1">{slot.time}</div>
                            <div className="text-xs">
                              {slot.available ? 'Tersedia' : 'Terbooking'}
                            </div>
                          </button>
                        ))}
                      </div>
                    )}
                  </CardContent>
                </Card>
              </motion.div>
            )}
          </div>

          {/* Booking Summary - Right Side */}
          <div className="lg:col-span-1">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.4 }}
              className="sticky top-24"
            >
              <Card className="bg-white/90 backdrop-blur-sm border-0 shadow-xl">
                <CardHeader>
                  <CardTitle className="text-lg sm:text-xl text-[#00052e]">Ringkasan Booking</CardTitle>
                </CardHeader>

                <CardContent className="space-y-4">
                  <div className="space-y-3">
                    <div className="flex justify-between">
                      <span className="text-slate-600">Paket</span>
                      <span className="font-medium">{packageData.name}</span>
                    </div>

                    <div className="flex justify-between">
                      <span className="text-slate-600">Durasi</span>
                      <span className="font-medium">{formatDuration(packageData.duration_minutes)}</span>
                    </div>

                    {selectedDate && (
                      <div className="flex justify-between">
                        <span className="text-slate-600">Tanggal</span>
                        <span className="font-medium">
                          {format(selectedDate, 'dd MMM yyyy', { locale: idLocale })}
                        </span>
                      </div>
                    )}

                    {selectedTimeSlotData && (
                      <div className="flex justify-between">
                        <span className="text-slate-600">Jam</span>
                        <span className="font-medium">{selectedTimeSlotData.time}</span>
                      </div>
                    )}
                  </div>

                  <div className="border-t pt-4 space-y-2">
                    <div className="flex justify-between text-base sm:text-lg font-bold">
                      <span>Total</span>
                      <span className="text-[#b0834d]">{formatPrice(packageData.price)}</span>
                    </div>
                    <div className="text-sm text-slate-600">
                      DP: {formatPrice(packageData.price * packageData.dp_percentage / 100)} ({packageData.dp_percentage}%)
                    </div>
                  </div>
                </CardContent>

                <CardFooter>
                  <Button
                    onClick={handleContinueBooking}
                    disabled={!selectedDate || !selectedTimeSlot}
                    className="w-full bg-gradient-to-r from-[#00052e] to-[#b0834d] hover:from-[#00052e]/90 hover:to-[#b0834d]/90 text-sm sm:text-base"
                    size="lg"
                  >
                    Lanjut ke Add-ons
                  </Button>
                </CardFooter>
              </Card>
            </motion.div>
          </div>
        </div>
      </div>
      
      {/* Bottom Navigation */}
      <BottomNav />
    </div>
  )
}