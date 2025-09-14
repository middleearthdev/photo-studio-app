'use client'

import { motion } from 'framer-motion'
import Link from 'next/link'
import { Camera, Clock, Star, CheckCircle, Sparkles, Image as ImageIcon, Users } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from '@/components/ui/card'
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
    // Compact version for homepage
    return (
      <CardComponent>
        <Card className={`relative h-full overflow-visible border-0 shadow-lg transition-all duration-300 rounded-2xl group ${pkg.is_popular
          ? 'ring-2 ring-[#b0834d] bg-gradient-to-br from-[#00052e]/5 to-[#b0834d]/5 hover:scale-105'
          : 'hover:shadow-xl'
          }`}>
          {pkg.is_popular && (
            <div className="absolute -top-3 left-1/2 transform -translate-x-1/2 z-20">
              <Badge className="bg-gradient-to-r from-[#b0834d] to-[#00052e] text-white px-4 py-2 rounded-full shadow-lg border-2 border-white">
                <Star className="h-4 w-4 mr-1 fill-current" />
                TERPOPULER
              </Badge>
            </div>
          )}

          <div className="absolute top-4 right-4 z-10">
            <div className="bg-white/80 backdrop-blur-sm rounded-full p-2 shadow-md">
              <Clock className="h-4 w-4 text-[#00052e]" />
            </div>
          </div>

          <CardHeader className={`text-center pb-4 ${pkg.is_popular ? 'pt-10' : 'pt-8'}`}>
            <CardTitle className="text-2xl font-bold text-[#00052e] mb-2">
              {pkg.name}
            </CardTitle>
            <div className="text-center">
              <div className="text-3xl font-bold text-[#b0834d] mb-2">
                {formatPrice(pkg.price)}
              </div>
              <div className="text-sm text-slate-500">
                {formatDuration(pkg.duration_minutes)}
              </div>
            </div>
          </CardHeader>

          <CardContent className="pt-4 pb-8">
            {pkg.description && (
              <p className="text-slate-600 text-sm mb-4 text-center line-clamp-2">
                {pkg.description}
              </p>
            )}

            <ul className="space-y-3 mb-8">
              <li className="text-slate-600 flex items-start gap-3">
                <CheckCircle className="h-5 w-5 text-green-500 mt-0.5 flex-shrink-0" />
                <span>Durasi {formatDuration(pkg.duration_minutes)}</span>
              </li>
              {pkg.max_photos && (
                <li className="text-slate-600 flex items-start gap-3">
                  <ImageIcon className="h-5 w-5 text-green-500 mt-0.5 flex-shrink-0" />
                  <span>Maksimal {pkg.max_photos} foto</span>
                </li>
              )}
              {pkg.max_edited_photos && (
                <li className="text-slate-600 flex items-start gap-3">
                  <Sparkles className="h-5 w-5 text-green-500 mt-0.5 flex-shrink-0" />
                  <span>{pkg.max_edited_photos} foto diedit</span>
                </li>
              )}
              <li className="text-slate-600 flex items-start gap-3">
                <Users className="h-5 w-5 text-green-500 mt-0.5 flex-shrink-0" />
                <span>1-4 orang</span>
              </li>
            </ul>

            <Link href={`/packages/${pkg.id}`}>
              <Button
                className='w-full transition-all duration-300 rounded-full py-6 text-base group-hover:scale-[1.02] bg-gradient-to-r from-[#00052e] to-[#b0834d] hover:from-[#00052e]/90 hover:to-[#b0834d]/90 text-white shadow-lg hover:shadow-xl'
                size="lg"
              >
                <Camera className="h-5 w-5 mr-2" />
                Pilih Paket
              </Button>
            </Link>
          </CardContent>
        </Card>
      </CardComponent>
    )
  }

  // Default version for packages page
  return (
    <CardComponent>
      <Card className={`group relative h-full transition-all duration-300 hover:shadow-2xl border-0 bg-white/80 backdrop-blur-sm rounded-2xl overflow-visible ${pkg.is_popular ? 'ring-2 ring-[#b0834d] shadow-lg hover:scale-[1.02]' : 'hover:shadow-xl'
        }`}>
        {/* Popular badge */}
        {pkg.is_popular && (
          <div className="absolute -top-3 left-1/2 transform -translate-x-1/2 z-20">
            <Badge className="bg-gradient-to-r from-[#b0834d] to-[#00052e] text-white px-4 py-2 rounded-full shadow-lg border-2 border-white whitespace-nowrap">
              <Star className="h-4 w-4 mr-1 fill-current" />
              TERPOPULER
            </Badge>
          </div>
        )}

        {/* Category badge */}
        <div className="absolute top-4 right-4 z-10">
          {pkg.category && (
            <Badge className="bg-white/80 backdrop-blur-sm text-[#00052e] border border-[#00052e]/20 shadow-sm">
              {pkg.category.name}
            </Badge>
          )}
        </div>

        <CardHeader className={`text-center pb-4 relative ${pkg.is_popular ? 'pt-8' : 'pt-6'}`}>
          <div className="mb-4">
            <div className="w-20 h-20 mx-auto bg-gradient-to-r from-[#00052e] to-[#b0834d] rounded-full flex items-center justify-center mb-4 shadow-lg group-hover:shadow-xl transition-all duration-300 group-hover:scale-110">
              <Camera className="h-10 w-10 text-white" />
            </div>
            <CardTitle className="text-2xl font-bold text-[#00052e] mb-2 group-hover:text-[#b0834d] transition-colors duration-300">
              {pkg.name}
            </CardTitle>
          </div>

          <div className="text-center bg-slate-50 rounded-xl p-4 mb-4">
            <div className="text-3xl font-bold text-[#b0834d] mb-1">
              {formatPrice(pkg.price)}
            </div>
            <div className="text-sm text-slate-600">
              DP mulai {formatPrice(pkg.price * pkg.dp_percentage / 100)}
            </div>
          </div>
        </CardHeader>

        <CardContent className="pt-4 pb-6">
          <div className="space-y-4">
            <div className="grid grid-cols-3 gap-2">
              <div className="bg-slate-50 rounded-lg p-3 text-center">
                <Clock className="h-5 w-5 text-[#b0834d] mx-auto mb-1" />
                <div className="text-xs text-slate-500">Durasi</div>
                <div className="font-medium text-slate-900 text-sm">{formatDuration(pkg.duration_minutes)}</div>
              </div>

              {pkg.max_photos && (
                <div className="bg-slate-50 rounded-lg p-3 text-center">
                  <ImageIcon className="h-5 w-5 text-[#b0834d] mx-auto mb-1" />
                  <div className="text-xs text-slate-500">Foto</div>
                  <div className="font-medium text-slate-900 text-sm">{pkg.max_photos}</div>
                </div>
              )}

              <div className="bg-slate-50 rounded-lg p-3 text-center">
                <Users className="h-5 w-5 text-[#b0834d] mx-auto mb-1" />
                <div className="text-xs text-slate-500">Orang</div>
                <div className="font-medium text-slate-900 text-sm">1-4</div>
              </div>
            </div>

            {pkg.description && (
              <p className="text-sm text-slate-600 leading-relaxed line-clamp-2">
                {pkg.description}
              </p>
            )}

            {pkg.includes && pkg.includes.length > 0 && (
              <div className="space-y-3">
                <h4 className="font-semibold text-[#00052e] flex items-center gap-2">
                  <Sparkles className="h-4 w-4 text-[#b0834d]" />
                  Termasuk:
                </h4>
                <ul className="space-y-2">
                  {pkg.includes.slice(0, 4).map((item, idx) => (
                    <li key={idx} className="text-sm text-slate-600 flex items-start gap-2">
                      <CheckCircle className="h-4 w-4 text-green-500 mt-0.5 flex-shrink-0" />
                      <span className="line-clamp-1">{item}</span>
                    </li>
                  ))}
                  {pkg.includes.length > 4 && (
                    <li className="text-sm text-[#b0834d] font-medium flex items-center gap-1">
                      <span>+{pkg.includes.length - 4} fasilitas lainnya</span>
                    </li>
                  )}
                </ul>
              </div>
            )}
          </div>
        </CardContent>

        <CardFooter className="pt-0 border-t border-slate-100">
          <Link href={`/packages/${pkg.id}`} className="w-full">
            <Button
              className='w-full transition-all duration-300 rounded-full py-6 text-base group-hover:scale-[1.02] bg-gradient-to-r from-[#00052e] to-[#b0834d] hover:from-[#00052e]/90 hover:to-[#b0834d]/90 text-white shadow-lg hover:shadow-xl'
              size="lg"
            >
              <Camera className="h-5 w-5 mr-2" />
              Pilih Paket
            </Button>
          </Link>
        </CardFooter>
      </Card>
    </CardComponent>
  )
}