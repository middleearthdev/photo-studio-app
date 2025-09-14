'use client'

export const dynamic = 'force-dynamic'

import { useState, useEffect, Suspense } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { motion } from 'framer-motion'
import { format } from 'date-fns'
import { id as idLocale } from 'date-fns/locale'
import {
  ArrowLeft,
  ArrowRight,
  Camera,
  Image as ImageIcon,
  Sparkles,
  Plus,
  Minus,
  CheckCircle,
  Gift,
  Lightbulb
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Card, CardContent, CardHeader, CardTitle, CardFooter } from '@/components/ui/card'
import { usePublicPackage } from '@/hooks/use-customer-packages'
import { usePackageAddonsGrouped } from '@/hooks/use-addons'
import Link from 'next/link'
import { BottomNav } from '@/components/navigation/bottom-nav'

interface BookingData {
  packageId: string
  date: string
  timeSlot: string
}

function AddonsPageContent() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const packageId = searchParams.get('package')

  const [bookingData, setBookingData] = useState<BookingData | null>(null)
  const [selectedAddons, setSelectedAddons] = useState<{ [key: string]: number }>({})
  const [activeCategory, setActiveCategory] = useState<string>('photo')

  const { data: packageData } = usePublicPackage(packageId || '')
  const { data: addonsGrouped = {}, isLoading: addonsLoading } = usePackageAddonsGrouped(packageId || '')

  const categories = [
    { id: 'photo', name: 'Foto', icon: ImageIcon, color: 'blue' },
    { id: 'styling', name: 'Styling', icon: Sparkles, color: 'purple' },
    { id: 'props', name: 'Props', icon: Gift, color: 'green' },
    { id: 'lighting', name: 'Lighting', icon: Lightbulb, color: 'yellow' },
    { id: 'other', name: 'Lainnya', icon: Plus, color: 'gray' }
  ]

  useEffect(() => {
    const storedData = localStorage.getItem('bookingData')
    if (storedData) {
      setBookingData(JSON.parse(storedData))
    } else {
      router.push('/packages')
    }
  }, [router])

  // Get available categories based on actual data
  const availableCategories = categories.filter(cat =>
    addonsGrouped[cat.id] && addonsGrouped[cat.id].length > 0
  )

  // Add dynamic categories that might not be in our predefined list
  Object.keys(addonsGrouped).forEach(categoryKey => {
    if (addonsGrouped[categoryKey].length > 0) {
      // Check if this category is not already in availableCategories
      if (!availableCategories.find(cat => cat.id === categoryKey)) {
        availableCategories.push({
          id: categoryKey,
          name: categoryKey.charAt(0).toUpperCase() + categoryKey.slice(1),
          icon: Plus, // Default icon for unknown categories
          color: 'gray'
        })
      }
    }
  })

  // Set initial active category to the first available one
  useEffect(() => {
    if (availableCategories.length > 0 && !availableCategories.find(cat => cat.id === activeCategory)) {
      setActiveCategory(availableCategories[0].id)
    }
  }, [availableCategories, activeCategory])

  const addonsInCategory = addonsGrouped[activeCategory] || []

  // Debug logs to understand the data
  console.log('=== ADDONS DEBUG ===')
  console.log('packageData?.studio_id:', packageData?.studio_id)
  console.log('addonsGrouped keys:', Object.keys(addonsGrouped))
  console.log('addonsGrouped data:', addonsGrouped)
  console.log('availableCategories:', availableCategories.map(c => c.id))
  console.log('activeCategory:', activeCategory)
  console.log('addonsInCategory:', addonsInCategory)
  console.log('==================')

  if (!bookingData || !packageData || addonsLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#00052e] mx-auto mb-4"></div>
          <p className="text-slate-600">Memuat add-ons...</p>
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

  const handleQuantityChange = (addonId: string, change: number) => {
    const addon = addonsInCategory.find(a => a.id === addonId)
    if (!addon) return

    const currentQuantity = selectedAddons[addonId] || 0
    const newQuantity = Math.max(0, Math.min(addon.max_quantity || 99, currentQuantity + change))

    setSelectedAddons(prev => ({
      ...prev,
      [addonId]: newQuantity
    }))
  }

  const getTotalAddonsPrice = () => {
    return Object.entries(selectedAddons).reduce((total, [addonId, quantity]) => {
      // Find addon across all categories
      const addon = Object.values(addonsGrouped).flat().find(a => a.id === addonId)
      if (!addon) return total

      // If addon is included in package, it's free
      if (addon.package_addon?.is_included) return total

      // Use final price (with discount applied) or fallback to regular price
      const price = addon.package_addon?.final_price || addon.price
      return total + (price * quantity)
    }, 0)
  }

  const getSelectedAddonsCount = () => {
    return Object.values(selectedAddons).reduce((sum, quantity) => sum + quantity, 0)
  }

  const handleContinueBooking = () => {
    const updatedBookingData = {
      ...bookingData,
      addons: selectedAddons,
      addonsTotal: getTotalAddonsPrice()
    }

    localStorage.setItem('bookingData', JSON.stringify(updatedBookingData))
    router.push('/booking/summary')
  }

  const selectedDate = bookingData.date ? new Date(bookingData.date) : null
  const selectedTimeSlotData = bookingData.timeSlot

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
                <Link href="/packages" className="hover:text-[#00052e]">Paket</Link> /
                <Link href={`/packages/${packageId}`} className="hover:text-[#00052e] mx-1">{packageData.name}</Link> /
                Add-ons
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
                <div className="w-4 h-4 bg-[#00052e] rounded-full flex items-center justify-center">
                  <div className="w-2 h-2 bg-white rounded-full"></div>
                </div>
                <span className="font-medium">Add-ons</span>
              </div>
              <div className="w-8 h-px bg-slate-300"></div>
              <div className="flex items-center gap-2">
                <div className="w-4 h-4 bg-slate-300 rounded-full"></div>
                <span>Pembayaran</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 sm:py-8">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 sm:gap-8">
          {/* Add-ons Selection - Left Side */}
          <div className="lg:col-span-2 space-y-4 sm:space-y-6">
            {/* Title */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6 }}
            >
              <h1 className="text-lg sm:text-3xl font-bold text-[#00052e] mb-1 sm:mb-2">Pilih Add-ons</h1>
              <p className="text-xs sm:text-base text-slate-600">
                Tingkatkan pengalaman foto Anda dengan add-ons premium kami (opsional)
              </p>
            </motion.div>

            {/* Category Tabs */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.1 }}
            >
              <div className="flex flex-wrap gap-1 sm:gap-2 mb-4 sm:mb-6">
                {availableCategories.map((category) => {
                  const Icon = category.icon
                  const isActive = activeCategory === category.id
                  const addonsInCat = addonsGrouped[category.id] || []

                  return (
                    <button
                      key={category.id}
                      onClick={() => setActiveCategory(category.id)}
                      className={`flex items-center gap-1 sm:gap-2 px-2 sm:px-4 py-1.5 sm:py-2 rounded-lg font-medium transition-all duration-200 text-xs sm:text-sm ${isActive
                        ? 'bg-[#00052e] text-white shadow-lg'
                        : 'bg-white text-slate-700 hover:bg-slate-50 border border-slate-200'
                        }`}
                    >
                      <Icon className="h-3 w-3 sm:h-4 sm:w-4" />
                      {category.name} ({addonsInCat.length})
                      {addonsInCat.length > 0 && Object.entries(selectedAddons).some(([id, qty]) => {
                        const addon = addonsInCat.find(a => a.id === id)
                        return addon && qty > 0
                      }) && (
                          <Badge className="bg-red-500 text-white text-xs h-5 w-5 rounded-full p-0 flex items-center justify-center">
                            {Object.entries(selectedAddons).reduce((count, [id, qty]) => {
                              const addon = addonsInCat.find(a => a.id === id)
                              return addon ? count + qty : count
                            }, 0)}
                          </Badge>
                        )}
                    </button>
                  )
                })}
              </div>
            </motion.div>

            {/* Add-ons Grid */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.2 }}
              className="grid grid-cols-2 lg:grid-cols-2 gap-2 sm:gap-4"
            >
              {addonsInCategory.map((addon) => {
                // Map addon names to icons for display
                const getAddonIcon = (name: string) => {
                  const lowerName = name.toLowerCase()
                  if (lowerName.includes('makeup') || lowerName.includes('hair')) return Sparkles
                  if (lowerName.includes('prop') || lowerName.includes('dekor')) return Gift
                  if (lowerName.includes('light')) return Lightbulb
                  if (lowerName.includes('foto') || lowerName.includes('photo')) return ImageIcon
                  return Camera
                }
                const Icon = getAddonIcon(addon.name)
                const quantity = selectedAddons[addon.id] || 0
                const isSelected = quantity > 0

                return (
                  <Card key={addon.id} className={`h-full flex flex-col transition-all duration-200 ${isSelected ? 'ring-2 ring-[#00052e] bg-[#00052e]/5' : 'hover:shadow-lg bg-white'
                    }`}>
                    <CardHeader className="pb-2 sm:pb-3 flex-grow">
                      <div className="flex flex-col space-y-2">
                        {/* Header with icon and status */}
                        <div className="flex items-start justify-between">
                          <div className={`w-8 h-8 sm:w-10 sm:h-10 rounded-lg flex items-center justify-center flex-shrink-0 ${isSelected ? 'bg-[#00052e] text-white' : 'bg-slate-100 text-slate-600'
                            }`}>
                            <Icon className="h-4 w-4 sm:h-5 sm:w-5" />
                          </div>
                          {isSelected && (
                            <CheckCircle className="h-4 w-4 sm:h-5 sm:w-5 text-green-500 flex-shrink-0" />
                          )}
                        </div>
                        
                        {/* Title and badges */}
                        <div className="space-y-1">
                          <CardTitle className="text-xs sm:text-sm text-[#00052e] leading-tight line-clamp-2">
                            {addon.name}
                          </CardTitle>
                          <div className="flex flex-wrap gap-1">
                            {addon.package_addon?.is_recommended && (
                              <Badge className="bg-[#b0834d]/10 text-[#b0834d] text-xs px-1 py-0.5">
                                Top
                              </Badge>
                            )}
                            {addon.package_addon?.is_included && (
                              <Badge className="bg-green-100 text-green-800 text-xs px-1 py-0.5">
                                Gratis
                              </Badge>
                            )}
                          </div>
                        </div>
                        
                        {/* Description - hidden on mobile for space */}
                        <p className="text-slate-600 text-xs leading-tight line-clamp-1 hidden sm:block">
                          {addon.description}
                        </p>
                        
                        {/* Price */}
                        <div className="flex flex-col space-y-1">
                          {addon.package_addon?.discount_percentage && addon.package_addon.discount_percentage > 0 ? (
                            <div className="flex items-center gap-1 flex-wrap">
                              <p className="text-slate-400 line-through text-xs">{formatPrice(addon.price)}</p>
                              <p className="text-[#b0834d] font-bold text-xs sm:text-sm">{formatPrice(addon.package_addon.final_price || addon.price)}</p>
                              <Badge className="bg-red-100 text-red-800 text-xs px-1 py-0.5">
                                -{addon.package_addon.discount_percentage}%
                              </Badge>
                            </div>
                          ) : (
                            <p className="text-[#b0834d] font-bold text-xs sm:text-sm">
                              {addon.package_addon?.is_included ? 'GRATIS' : formatPrice(addon.package_addon?.final_price || addon.price)}
                            </p>
                          )}
                        </div>
                      </div>
                    </CardHeader>

                    <CardContent className="pt-0 px-3 sm:px-6 pb-3 sm:pb-4 mt-auto">
                      {/* Quantity Controls */}
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-1 sm:gap-2">
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => handleQuantityChange(addon.id, -1)}
                            disabled={quantity === 0}
                            className="h-6 w-6 sm:h-8 sm:w-8 p-0 rounded-full"
                          >
                            <Minus className="h-3 w-3 sm:h-4 sm:w-4" />
                          </Button>

                          <span className="w-6 sm:w-8 text-center font-bold text-xs sm:text-sm text-[#00052e]">{quantity}</span>

                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => handleQuantityChange(addon.id, 1)}
                            disabled={quantity >= (addon.max_quantity || 99)}
                            className="h-6 w-6 sm:h-8 sm:w-8 p-0 rounded-full"
                          >
                            <Plus className="h-3 w-3 sm:h-4 sm:w-4" />
                          </Button>
                        </div>

                        {addon.max_quantity && (
                          <span className="text-xs text-slate-500 hidden lg:inline">
                            Max: {addon.max_quantity}
                          </span>
                        )}
                      </div>
                    </CardContent>
                  </Card>
                )
              })}
            </motion.div>

            {addonsInCategory.length === 0 && (
              <div className="text-center py-8 sm:py-12">
                <Gift className="h-12 w-12 sm:h-16 sm:w-16 text-slate-400 mx-auto mb-3 sm:mb-4" />
                <p className="text-sm sm:text-base text-slate-500">Tidak ada add-ons di kategori ini</p>
              </div>
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
                  <CardTitle className="text-sm sm:text-xl text-[#00052e]">Ringkasan Booking</CardTitle>
                </CardHeader>

                <CardContent className="space-y-4">
                  {/* Package Details */}
                  <div className="space-y-2 sm:space-y-3">
                    <div className="flex justify-between">
                      <span className="text-slate-600 text-xs sm:text-sm">Paket</span>
                      <span className="font-medium text-xs sm:text-sm">{packageData.name}</span>
                    </div>

                    <div className="flex justify-between">
                      <span className="text-slate-600 text-xs sm:text-sm">Durasi</span>
                      <span className="font-medium text-xs sm:text-sm">{formatDuration(packageData.duration_minutes)}</span>
                    </div>

                    {selectedDate && (
                      <div className="flex justify-between">
                        <span className="text-slate-600 text-xs sm:text-sm">Tanggal</span>
                        <span className="font-medium text-xs sm:text-sm">
                          {format(selectedDate, 'dd MMM yyyy', { locale: idLocale })}
                        </span>
                      </div>
                    )}

                    {selectedTimeSlotData && (
                      <div className="flex justify-between">
                        <span className="text-slate-600 text-xs sm:text-sm">Jam</span>
                        <span className="font-medium text-xs sm:text-sm">{selectedTimeSlotData}</span>
                      </div>
                    )}

                    <div className="flex justify-between">
                      <span className="text-slate-600 text-xs sm:text-sm">Harga Paket</span>
                      <span className="font-medium text-xs sm:text-sm">{formatPrice(packageData.price)}</span>
                    </div>
                  </div>

                  {/* Selected Add-ons */}
                  {getSelectedAddonsCount() > 0 && (
                    <div className="border-t pt-4 space-y-2">
                      <h4 className="font-semibold text-[#00052e] mb-2 sm:mb-3 text-xs sm:text-base">Add-ons Terpilih</h4>
                      {Object.entries(selectedAddons).map(([addonId, quantity]) => {
                        const addon = Object.values(addonsGrouped).flat().find(a => a.id === addonId)
                        if (!addon || quantity === 0) return null

                        const price = addon.package_addon?.final_price || addon.price
                        const isIncluded = addon.package_addon?.is_included

                        return (
                          <div key={addonId} className="flex justify-between text-xs sm:text-sm">
                            <span className="text-slate-600 flex items-center gap-1 sm:gap-2">
                              <span className="line-clamp-1">{addon.name} {quantity > 1 && `(${quantity}x)`}</span>
                              {isIncluded && (
                                <Badge className="bg-green-100 text-green-800 text-xs">
                                  Gratis
                                </Badge>
                              )}
                            </span>
                            <span className="font-medium text-xs sm:text-sm">
                              {isIncluded ? 'Rp 0' : formatPrice(price * quantity)}
                            </span>
                          </div>
                        )
                      })}
                    </div>
                  )}

                  {/* Total */}
                  <div className="border-t pt-4 space-y-2">
                    <div className="flex justify-between text-sm sm:text-lg font-bold">
                      <span>Total</span>
                      <span className="text-[#b0834d]">
                        {formatPrice(packageData.price + getTotalAddonsPrice())}
                      </span>
                    </div>
                    <div className="text-xs sm:text-sm text-slate-600">
                      DP: {formatPrice((packageData.price + getTotalAddonsPrice()) * packageData.dp_percentage / 100)} ({packageData.dp_percentage}%)
                    </div>
                  </div>
                </CardContent>

                <CardFooter className="flex flex-col sm:flex-row gap-2 sm:gap-3">
                  <Button
                    variant="outline"
                    onClick={() => router.push('/booking/summary')}
                    className="flex-1 text-xs sm:text-base py-2 sm:py-3"
                  >
                    Lewati Add-ons
                  </Button>
                  <Button
                    onClick={handleContinueBooking}
                    className="flex-1 bg-gradient-to-r from-[#00052e] to-[#b0834d] hover:from-[#00052e]/90 hover:to-[#b0834d]/90 text-xs sm:text-base py-2 sm:py-3"
                  >
                    Lanjutkan
                    <ArrowRight className="h-3 w-3 sm:h-4 sm:w-4 ml-1 sm:ml-2" />
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

export default function AddonsPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#00052e] mx-auto mb-4"></div>
          <p className="text-slate-600">Memuat halaman add-ons...</p>
        </div>
      </div>
    }>
      <AddonsPageContent />
    </Suspense>
  )
}