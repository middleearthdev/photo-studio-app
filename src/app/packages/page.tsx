'use client'

import { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import { Camera, Clock, Star, Users, Image as ImageIcon, Sparkles, CheckCircle, Award, Heart } from 'lucide-react'
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
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#00052e] mx-auto mb-4"></div>
          <p className="text-slate-600">Memuat paket...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50/30 to-slate-100">
      {/* Hero Section */}
      <section className="relative pt-20 pb-16 px-4 sm:px-6 lg:px-8 overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-r from-[#00052e]/5 to-[#b0834d]/5 backdrop-blur-sm"></div>
        <div className="relative max-w-7xl mx-auto text-center">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
          >
            <div className="flex justify-center mb-6">
              <div className="w-16 h-16 bg-gradient-to-r from-[#00052e] to-[#b0834d] rounded-full flex items-center justify-center">
                <Camera className="h-8 w-8 text-white" />
              </div>
            </div>
            <h1 className="text-3xl md:text-5xl lg:text-6xl font-bold text-[#00052e] mb-6">
              Pilih Paket <span className="text-[#b0834d]">Foto Terbaik</span>
            </h1>
            <p className="text-lg md:text-xl text-slate-600 max-w-2xl mx-auto">
              Berbagai pilihan paket foto profesional dengan fasilitas lengkap dan harga terjangkau di Kalarasa Studio
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
                className="rounded-full bg-[#00052e] hover:bg-[#00052e]/90 text-white border-[#00052e]"
              >
                Semua Paket
              </Button>
              {categories.map((category) => (
                <Button
                  key={category.id}
                  variant={selectedCategory === category.id ? "default" : "outline"}
                  onClick={() => setSelectedCategory(category.id)}
                  className={`rounded-full ${
                    selectedCategory === category.id
                      ? 'bg-[#00052e] hover:bg-[#00052e]/90 text-white border-[#00052e]'
                      : 'border-[#00052e]/30 text-[#00052e] hover:bg-[#00052e]/10'
                  }`}
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
                  <Card className={`group relative h-full transition-all duration-300 hover:shadow-2xl border-0 bg-white/80 backdrop-blur-sm rounded-2xl ${
                    pkg.is_popular ? 'ring-2 ring-[#b0834d] shadow-lg hover:scale-105' : 'hover:shadow-xl'
                  }`}>
                    {pkg.is_popular && (
                      <div className="absolute -top-3 left-1/2 transform -translate-x-1/2 z-10">
                        <Badge className="bg-gradient-to-r from-[#b0834d] to-[#00052e] text-white px-4 py-1 rounded-full shadow-lg">
                          <Star className="h-4 w-4 mr-1 fill-current" />
                          TERPOPULER
                        </Badge>
                      </div>
                    )}
                    
                    <CardHeader className="text-center pb-4">
                      <div className="mb-4">
                        <div className="w-16 h-16 mx-auto bg-gradient-to-r from-[#00052e] to-[#b0834d] rounded-full flex items-center justify-center mb-4">
                          <Camera className="h-8 w-8 text-white" />
                        </div>
                        <CardTitle className="text-2xl font-bold text-[#00052e] mb-2">
                          {pkg.name}
                        </CardTitle>
                        {pkg.category && (
                          <Badge variant="secondary" className="mb-3 bg-[#00052e]/10 text-[#00052e]">
                            {pkg.category.name}
                          </Badge>
                        )}
                      </div>
                      
                      <div className="text-center">
                        <div className="text-3xl font-bold text-[#b0834d] mb-2">
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
                          <Clock className="h-5 w-5 text-[#b0834d]" />
                          <span className="font-medium">{formatDuration(pkg.duration_minutes)}</span>
                        </div>
                        
                        {pkg.max_photos && (
                          <div className="flex items-center gap-3 text-slate-600">
                            <ImageIcon className="h-5 w-5 text-[#b0834d]" />
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
                            <h4 className="font-semibold text-[#00052e] flex items-center gap-2">
                              <Sparkles className="h-4 w-4 text-[#b0834d]" />
                              Termasuk:
                            </h4>
                            <ul className="space-y-1">
                              {pkg.includes.slice(0, 5).map((item, idx) => (
                                <li key={idx} className="text-sm text-slate-600 flex items-start gap-2">
                                  <CheckCircle className="h-4 w-4 text-green-500 mt-0.5 flex-shrink-0" />
                                  <span>{item}</span>
                                </li>
                              ))}
                              {pkg.includes.length > 5 && (
                                <li className="text-sm text-[#b0834d] font-medium">
                                  +{pkg.includes.length - 5} fasilitas lainnya
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
                          className={`w-full transition-all duration-300 rounded-full py-6 text-base ${
                            pkg.is_popular 
                              ? 'bg-gradient-to-r from-[#00052e] to-[#b0834d] hover:from-[#00052e]/90 hover:to-[#b0834d]/90 text-white shadow-lg hover:shadow-xl' 
                              : 'border-2 border-[#00052e] text-[#00052e] hover:bg-[#00052e] hover:text-white'
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

      {/* Features Section */}
      <section className="py-20 bg-gradient-to-br from-[#00052e] to-[#b0834d]">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            className="text-center mb-16"
            viewport={{ once: true }}
          >
            <h2 className="text-3xl md:text-4xl lg:text-5xl font-bold text-white mb-6">
              Mengapa Memilih Paket Kami?
            </h2>
            <p className="text-xl text-white/90 max-w-2xl mx-auto">
              Setiap paket dirancang untuk memberikan pengalaman fotografi terbaik
            </p>
          </motion.div>

          <div className="grid md:grid-cols-3 gap-8">
            {[
              {
                icon: Award,
                title: "Kualitas Premium",
                description: "Setiap foto diedit dengan detail tinggi menggunakan software profesional"
              },
              {
                icon: Clock,
                title: "Durasi Fleksibel",
                description: "Sesi foto disesuaikan dengan kebutuhan dan kenyamanan Anda"
              },
              {
                icon: Heart,
                title: "Hasil Memukau",
                description: "Garansi kepuasan dengan hasil akhir yang memukau setiap klien"
              }
            ].map((feature, index) => {
              const Icon = feature.icon
              return (
                <motion.div
                  key={feature.title}
                  initial={{ opacity: 0, y: 30 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.6, delay: index * 0.1 }}
                  viewport={{ once: true }}
                >
                  <Card className="text-center p-8 border-0 shadow-lg bg-white/10 backdrop-blur-sm rounded-2xl">
                    <div className="w-16 h-16 mx-auto mb-6 bg-white/20 rounded-full flex items-center justify-center">
                      <Icon className="h-8 w-8 text-white" />
                    </div>
                    <h3 className="text-xl font-bold text-white mb-4">{feature.title}</h3>
                    <p className="text-white/80">{feature.description}</p>
                  </Card>
                </motion.div>
              )
            })}
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20 bg-white">
        <div className="max-w-4xl mx-auto text-center px-4 sm:px-6 lg:px-8">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            viewport={{ once: true }}
          >
            <h2 className="text-3xl md:text-4xl lg:text-5xl font-bold text-[#00052e] mb-6">
              Butuh Bantuan Memilih Paket?
            </h2>
            <p className="text-lg md:text-xl text-slate-600 mb-8 max-w-2xl mx-auto">
              Tim kami siap membantu Anda menemukan paket foto yang sesuai dengan kebutuhan dan budget
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Button size="lg" className="bg-[#00052e] hover:bg-[#00052e]/90 text-white px-8 py-6 rounded-full transition-all duration-300 shadow-lg hover:shadow-xl">
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