'use client'

import { motion } from 'framer-motion'
import Link from 'next/link'
import { Camera, Clock, Star, CheckCircle, Sparkles, Image as ImageIcon, Users } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import type { Package } from '@/actions/customer-packages'

interface PackageCardProps {
  package: Package
  index?: number
  showAnimation?: boolean
  variant?: 'default' | 'compact'
}

export function PackageCard({
  package: pkg,
  index = 0,
  showAnimation = true,
  variant = 'default'
}: PackageCardProps) {
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

  const CardComponent = ({ children }: { children: React.ReactNode }) => {
    if (showAnimation) {
      return (
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: index * 0.1 }}
          className={pkg.is_popular ? "pt-4" : ""} // Add top padding for popular cards
        >
          {children}
        </motion.div>
      )
    }
    return <div className={pkg.is_popular ? "pt-4" : ""}>{children}</div>
  }

  if (variant === 'compact') {
    // Compact version for homepage - mobile optimized with fixed height
    return (
      <CardComponent>
        <Card className={`relative h-full flex flex-col overflow-visible border-0 shadow-lg transition-all duration-300 rounded-xl sm:rounded-2xl group ${pkg.is_popular
          ? 'ring-1 sm:ring-2 ring-[#b0834d] bg-gradient-to-br from-[#00052e]/5 to-[#b0834d]/5 hover:scale-105'
          : 'hover:shadow-xl'
          }`}>
          {pkg.is_popular && (
            <div className="absolute -top-2 sm:-top-3 left-1/2 transform -translate-x-1/2 z-20">
              <Badge className="bg-gradient-to-r from-[#b0834d] to-[#00052e] text-white px-2 py-1 sm:px-4 sm:py-2 rounded-full shadow-lg border border-white text-xs sm:text-sm">
                <Star className="h-3 w-3 sm:h-4 sm:w-4 mr-1 fill-current" />
                TOP
              </Badge>
            </div>
          )}

          <CardHeader className={`text-center pb-1 sm:pb-4 ${pkg.is_popular ? 'pt-5 sm:pt-10' : 'pt-3 sm:pt-8'}`}>
            <CardTitle className="text-sm sm:text-xl lg:text-2xl font-bold text-[#00052e] mb-1 leading-tight line-clamp-2">
              {pkg.name}
            </CardTitle>
            <div className="text-center">
              <div className="text-base sm:text-2xl lg:text-3xl font-bold text-[#b0834d] mb-0.5 sm:mb-2">
                {formatPrice(pkg.price)}
              </div>
              <div className="text-xs text-slate-500">
                {formatDuration(pkg.duration_minutes)}
              </div>
            </div>
          </CardHeader>

          <CardContent className="pt-1 sm:pt-4 pb-3 sm:pb-6 lg:pb-8 px-2 sm:px-6 flex-grow flex flex-col">
            <div className="hidden sm:block mb-4">
              {pkg.description && (
                <p className="text-slate-600 text-sm text-center line-clamp-2">
                  {pkg.description}
                </p>
              )}
            </div>

            {/* Mobile: Simple grid layout */}
            <div className="grid grid-cols-2 gap-1 mb-3 sm:hidden">
              <div className="text-center">
                <div className="text-xs text-slate-500">Paket</div>
                <div className="text-xs font-medium text-[#00052e]">Lengkap</div>
              </div>
              <div className="text-center">
                <div className="text-xs text-slate-500">Bonus</div>
                <div className="text-xs font-medium text-[#00052e]">Included</div>
              </div>
            </div>

            {/* Desktop: Full list - flex-grow to fill space */}
            <div className="hidden sm:block flex-grow">
              <ul className="space-y-3 mb-6">
                <li className="text-slate-600 flex items-start gap-3">
                  <CheckCircle className="h-5 w-5 text-green-500 mt-0.5 flex-shrink-0" />
                  <span className="text-sm">Durasi {formatDuration(pkg.duration_minutes)}</span>
                </li>
                <li className="text-slate-600 flex items-start gap-3">
                  <Users className="h-5 w-5 text-green-500 mt-0.5 flex-shrink-0" />
                  <span className="text-sm">1-4 orang</span>
                </li>
              </ul>
            </div>

            {/* Button always at bottom */}
            <div className="mt-auto">
              <Link href={`/packages/${pkg.id}`}>
                <Button
                  className='w-full transition-all duration-300 rounded-full py-2 sm:py-4 lg:py-6 text-xs sm:text-sm lg:text-base group-hover:scale-[1.02] bg-gradient-to-r from-[#00052e] to-[#b0834d] hover:from-[#00052e]/90 hover:to-[#b0834d]/90 text-white shadow-lg hover:shadow-xl'
                  size="lg"
                >
                  <Camera className="h-3 w-3 sm:h-5 sm:w-5 mr-1 sm:mr-2" />
                  Pilih
                </Button>
              </Link>
            </div>
          </CardContent>
        </Card>
      </CardComponent>
    )
  }

  // Default version for packages page - mobile optimized with uniform height
  return (
    <CardComponent>
      <Card className={`group relative h-full flex flex-col transition-all duration-300 hover:shadow-2xl border-0 bg-white/80 backdrop-blur-sm rounded-xl sm:rounded-2xl overflow-visible ${pkg.is_popular ? 'ring-1 sm:ring-2 ring-[#b0834d] shadow-lg hover:scale-[1.02]' : 'hover:shadow-xl'
        }`}>
        {/* Popular badge */}
        {pkg.is_popular && (
          <div className="absolute -top-2 sm:-top-3 left-1/2 transform -translate-x-1/2 z-20">
            <Badge className="bg-gradient-to-r from-[#b0834d] to-[#00052e] text-white px-2 py-1 sm:px-4 sm:py-2 rounded-full shadow-lg border border-white whitespace-nowrap text-xs sm:text-sm">
              <Star className="h-3 w-3 sm:h-4 sm:w-4 mr-1 fill-current" />
              TOP
            </Badge>
          </div>
        )}

        {/* Category badge - hidden on mobile */}
        <div className="absolute top-2 sm:top-4 right-2 sm:right-4 z-10 hidden sm:block">
          {pkg.category && (
            <Badge className="bg-white/80 backdrop-blur-sm text-[#00052e] border border-[#00052e]/20 shadow-sm text-xs">
              {pkg.category.name}
            </Badge>
          )}
        </div>

        <CardHeader className={`text-center pb-1 sm:pb-4 relative ${pkg.is_popular ? 'pt-4 sm:pt-8' : 'pt-3 sm:pt-6'}`}>
          <div className="mb-1 sm:mb-4">
            {/* Hide icon on mobile, show on desktop */}
            <div className="hidden sm:flex w-16 h-16 sm:w-20 sm:h-20 mx-auto bg-gradient-to-r from-[#00052e] to-[#b0834d] rounded-full items-center justify-center mb-2 sm:mb-4 shadow-lg group-hover:shadow-xl transition-all duration-300 group-hover:scale-110">
              <Camera className="h-8 w-8 sm:h-10 sm:w-10 text-white" />
            </div>
            <CardTitle className="text-sm sm:text-xl lg:text-2xl font-bold text-[#00052e] mb-1 sm:mb-2 group-hover:text-[#b0834d] transition-colors duration-300 leading-tight line-clamp-2">
              {pkg.name}
            </CardTitle>
          </div>

          <div className="text-center bg-slate-50 rounded-lg sm:rounded-xl p-2 sm:p-4 mb-1 sm:mb-4">
            <div className="text-base sm:text-2xl lg:text-3xl font-bold text-[#b0834d] mb-0.5 sm:mb-1">
              {formatPrice(pkg.price)}
            </div>
            <div className="text-xs text-slate-600 hidden sm:block">
              DP mulai {formatPrice(pkg.price * pkg.dp_percentage / 100)}
            </div>
          </div>
        </CardHeader>

        <CardContent className="pt-1 sm:pt-4 pb-3 sm:pb-6 px-2 sm:px-6 flex-grow flex flex-col">
          {/* Mobile: Compact grid */}
          <div className="sm:hidden flex-grow flex flex-col">
            <div className="grid grid-cols-3 gap-1 mb-2">
              <div className="bg-slate-50 rounded p-1 text-center">
                <div className="text-xs text-slate-500">Durasi</div>
                <div className="font-medium text-slate-900 text-xs">{formatDuration(pkg.duration_minutes)}</div>
              </div>
              <div className="bg-slate-50 rounded p-1 text-center">
                <div className="text-xs text-slate-500">Paket</div>
                <div className="font-medium text-slate-900 text-xs">Lengkap</div>
              </div>
              <div className="bg-slate-50 rounded p-1 text-center">
                <div className="text-xs text-slate-500">Bonus</div>
                <div className="font-medium text-slate-900 text-xs">Included</div>
              </div>
            </div>
            
            {/* Mobile: Show only top 2 includes */}
            <div className="flex-grow">
              {pkg.includes && pkg.includes.length > 0 && (
                <div className="space-y-1">
                  <div className="flex items-center justify-between">
                    <h4 className="font-semibold text-[#00052e] text-xs flex items-center gap-1">
                      <Sparkles className="h-3 w-3 text-[#b0834d]" />
                      Fasilitas:
                    </h4>
                    {pkg.category && (
                      <Badge className="text-xs px-2 py-0.5 bg-[#00052e]/10 text-[#00052e] border-none">
                        {pkg.category.name}
                      </Badge>
                    )}
                  </div>
                  <ul className="space-y-0.5">
                    {pkg.includes.slice(0, 2).map((item, idx) => (
                      <li key={idx} className="text-xs text-slate-600 flex items-start gap-1">
                        <CheckCircle className="h-3 w-3 text-green-500 mt-0.5 flex-shrink-0" />
                        <span className="line-clamp-1">{item}</span>
                      </li>
                    ))}
                    {pkg.includes.length > 2 && (
                      <li className="text-xs text-[#b0834d] font-medium">
                        +{pkg.includes.length - 2} lainnya
                      </li>
                    )}
                  </ul>
                </div>
              )}
            </div>
          </div>

          {/* Desktop: Full layout */}
          <div className="hidden sm:flex flex-col flex-grow">
            <div className="grid grid-cols-3 gap-2 mb-4">
              <div className="bg-slate-50 rounded-lg p-3 text-center">
                <Clock className="h-5 w-5 text-[#b0834d] mx-auto mb-1" />
                <div className="text-xs text-slate-500">Durasi</div>
                <div className="font-medium text-slate-900 text-sm">{formatDuration(pkg.duration_minutes)}</div>
              </div>

              <div className="bg-slate-50 rounded-lg p-3 text-center">
                <ImageIcon className="h-5 w-5 text-[#b0834d] mx-auto mb-1" />
                <div className="text-xs text-slate-500">Paket</div>
                <div className="font-medium text-slate-900 text-sm">Lengkap</div>
              </div>

              <div className="bg-slate-50 rounded-lg p-3 text-center">
                <Users className="h-5 w-5 text-[#b0834d] mx-auto mb-1" />
                <div className="text-xs text-slate-500">Orang</div>
                <div className="font-medium text-slate-900 text-sm">1-4</div>
              </div>
            </div>

            {pkg.description && (
              <p className="text-sm text-slate-600 leading-relaxed line-clamp-2 mb-4">
                {pkg.description}
              </p>
            )}

            <div className="flex-grow">
              {pkg.includes && pkg.includes.length > 0 && (
                <div className="space-y-3">
                  <h4 className="font-semibold text-[#00052e] flex items-center gap-2 text-base">
                    <Sparkles className="h-4 w-4 text-[#b0834d]" />
                    Termasuk:
                  </h4>
                  <ul className="space-y-2">
                    {pkg.includes.slice(0, 3).map((item, idx) => (
                      <li key={idx} className="text-sm text-slate-600 flex items-start gap-2">
                        <CheckCircle className="h-4 w-4 text-green-500 mt-0.5 flex-shrink-0" />
                        <span className="line-clamp-1">{item}</span>
                      </li>
                    ))}
                    {pkg.includes.length > 3 && (
                      <li className="text-sm text-[#b0834d] font-medium flex items-center gap-1">
                        <span>+{pkg.includes.length - 3} fasilitas lainnya</span>
                      </li>
                    )}
                  </ul>
                </div>
              )}
            </div>
          </div>

          {/* Button always at bottom */}
          <div className="mt-auto pt-3">
            <Link href={`/packages/${pkg.id}`} className="w-full">
              <Button
                className='w-full transition-all duration-300 rounded-full py-2 sm:py-4 lg:py-6 text-xs sm:text-sm lg:text-base group-hover:scale-[1.02] bg-gradient-to-r from-[#00052e] to-[#b0834d] hover:from-[#00052e]/90 hover:to-[#b0834d]/90 text-white shadow-lg hover:shadow-xl'
                size="lg"
              >
                <Camera className="h-3 w-3 sm:h-5 sm:w-5 mr-1 sm:mr-2" />
                Pilih
              </Button>
            </Link>
          </div>
        </CardContent>
      </Card>
    </CardComponent>
  )
}