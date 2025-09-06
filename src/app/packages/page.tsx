'use client'

import { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import { Camera, Clock, Star, Users, Image as ImageIcon, Sparkles } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card'
import { usePublicPackages, usePublicPackageCategories } from '@/hooks/use-customer-packages'
import type { Package } from '@/actions/customer-packages'
import Link from 'next/link'

export default function PackagesPage() {
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null)
  const { data: packages = [], isLoading: packagesLoading } = usePublicPackages()
  const { data: categories = [], isLoading: categoriesLoading } = usePublicPackageCategories()

  // packages are already filtered to active only in the API
  const activePackages = packages
  const filteredPackages = selectedCategory
    ? activePackages.filter((pkg: Package) => pkg.category?.id === selectedCategory)
    : activePackages

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

  if (packagesLoading || categoriesLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-slate-600">Memuat paket...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50/30 to-slate-100">
      {/* Hero Section */}
      <section className="relative pt-20 pb-16 px-4 sm:px-6 lg:px-8 overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-r from-blue-600/5 to-purple-600/5 backdrop-blur-sm"></div>
        <div className="relative max-w-7xl mx-auto text-center">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
          >
            <div className="flex justify-center mb-6">
              <Camera className="h-16 w-16 text-blue-600" />
            </div>
            <h1 className="text-4xl md:text-6xl font-bold text-slate-900 mb-6">
              Pilih Paket <span className="text-blue-600">Foto Perfect</span>
            </h1>
            <p className="text-xl text-slate-600 max-w-2xl mx-auto">
              Berbagai pilihan paket foto profesional dengan fasilitas lengkap dan harga terjangkau
            </p>
          </motion.div>
        </div>
      </section>

      {/* Category Filter */}
      {categories.length > 0 && (
        <section className="px-4 sm:px-6 lg:px-8 mb-12">
          <div className="max-w-7xl mx-auto">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.2 }}
              className="flex flex-wrap gap-3 justify-center"
            >
              <Button
                variant={selectedCategory === null ? "default" : "outline"}
                onClick={() => setSelectedCategory(null)}
                className="rounded-full"
              >
                Semua Paket
              </Button>
              {categories.map((category) => (
                <Button
                  key={category.id}
                  variant={selectedCategory === category.id ? "default" : "outline"}
                  onClick={() => setSelectedCategory(category.id)}
                  className="rounded-full"
                >
                  {category.name}
                </Button>
              ))}
            </motion.div>
          </div>
        </section>
      )}

      {/* Packages Grid */}
      <section className="px-4 sm:px-6 lg:px-8 pb-20">
        <div className="max-w-7xl mx-auto">
          {filteredPackages.length === 0 ? (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="text-center py-16"
            >
              <Camera className="h-20 w-20 text-slate-400 mx-auto mb-4" />
              <h3 className="text-2xl font-semibold text-slate-600 mb-2">
                Belum Ada Paket Tersedia
              </h3>
              <p className="text-slate-500">
                {selectedCategory ? 'Tidak ada paket di kategori ini' : 'Belum ada paket yang tersedia saat ini'}
              </p>
            </motion.div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
              {filteredPackages.map((pkg: Package, index: number) => (
                <motion.div
                  key={pkg.id}
                  initial={{ opacity: 0, y: 30 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.6, delay: index * 0.1 }}
                >
                  <Card className={`group relative h-full transition-all duration-300 hover:shadow-2xl border-0 bg-white/80 backdrop-blur-sm ${
                    pkg.is_popular ? 'ring-2 ring-blue-500 shadow-lg scale-105' : 'hover:shadow-xl'
                  }`}>
                    {pkg.is_popular && (
                      <div className="absolute -top-3 left-1/2 transform -translate-x-1/2 z-10">
                        <Badge className="bg-gradient-to-r from-blue-600 to-blue-700 text-white px-4 py-1 rounded-full shadow-lg">
                          <Star className="h-4 w-4 mr-1" />
                          TERPOPULER
                        </Badge>
                      </div>
                    )}
                    
                    <CardHeader className="text-center pb-4">
                      <div className="mb-4">
                        <div className="w-16 h-16 mx-auto bg-gradient-to-r from-blue-500 to-purple-600 rounded-full flex items-center justify-center mb-4">
                          <Camera className="h-8 w-8 text-white" />
                        </div>
                        <CardTitle className="text-2xl font-bold text-slate-900 mb-2">
                          {pkg.name}
                        </CardTitle>
                        {pkg.category && (
                          <Badge variant="secondary" className="mb-3">
                            {pkg.category.name}
                          </Badge>
                        )}
                      </div>
                      
                      <div className="text-center">
                        <div className="text-4xl font-bold text-blue-600 mb-2">
                          {formatPrice(pkg.price)}
                        </div>
                        <div className="text-sm text-slate-600">
                          DP mulai {formatPrice(pkg.price * pkg.dp_percentage / 100)}
                        </div>
                      </div>
                    </CardHeader>

                    <CardContent className="pt-4">
                      <div className="space-y-4">
                        <div className="flex items-center gap-3 text-slate-600">
                          <Clock className="h-5 w-5 text-blue-500" />
                          <span className="font-medium">{formatDuration(pkg.duration_minutes)}</span>
                        </div>
                        
                        {pkg.max_photos && (
                          <div className="flex items-center gap-3 text-slate-600">
                            <ImageIcon className="h-5 w-5 text-blue-500" />
                            <span>{pkg.max_photos} foto</span>
                            {pkg.max_edited_photos && (
                              <span className="text-sm text-slate-500">
                                ({pkg.max_edited_photos} diedit)
                              </span>
                            )}
                          </div>
                        )}

                        {pkg.description && (
                          <p className="text-sm text-slate-600 leading-relaxed">
                            {pkg.description}
                          </p>
                        )}

                        {pkg.includes && pkg.includes.length > 0 && (
                          <div className="space-y-2">
                            <h4 className="font-semibold text-slate-900 flex items-center gap-2">
                              <Sparkles className="h-4 w-4 text-yellow-500" />
                              Termasuk:
                            </h4>
                            <ul className="space-y-1">
                              {pkg.includes.slice(0, 4).map((item, idx) => (
                                <li key={idx} className="text-sm text-slate-600 flex items-start gap-2">
                                  <div className="w-1.5 h-1.5 bg-blue-500 rounded-full mt-2 flex-shrink-0"></div>
                                  {item}
                                </li>
                              ))}
                              {pkg.includes.length > 4 && (
                                <li className="text-sm text-blue-600 font-medium">
                                  +{pkg.includes.length - 4} fasilitas lainnya
                                </li>
                              )}
                            </ul>
                          </div>
                        )}
                      </div>
                    </CardContent>

                    <CardFooter className="pt-6">
                      <Link href={`/packages/${pkg.id}`} className="w-full">
                        <Button 
                          className={`w-full group-hover:shadow-lg transition-all duration-300 ${
                            pkg.is_popular 
                              ? 'bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800' 
                              : ''
                          }`}
                          size="lg"
                        >
                          <Camera className="h-5 w-5 mr-2" />
                          Pilih Paket
                        </Button>
                      </Link>
                    </CardFooter>
                  </Card>
                </motion.div>
              ))}
            </div>
          )}
        </div>
      </section>

      {/* CTA Section */}
      <section className="bg-gradient-to-r from-blue-600 to-purple-700 py-16 mx-4 sm:mx-6 lg:mx-8 mb-8 rounded-3xl">
        <div className="max-w-4xl mx-auto text-center px-6">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
          >
            <h2 className="text-3xl md:text-4xl font-bold text-white mb-6">
              Butuh Bantuan Memilih Paket?
            </h2>
            <p className="text-xl text-blue-100 mb-8 max-w-2xl mx-auto">
              Tim kami siap membantu Anda menemukan paket foto yang sesuai dengan kebutuhan dan budget
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Button size="lg" variant="secondary" className="bg-white text-blue-700 hover:bg-blue-50">
                <Users className="h-5 w-5 mr-2" />
                Hubungi Konsultan
              </Button>
            </div>
          </motion.div>
        </div>
      </section>
    </div>
  )
}