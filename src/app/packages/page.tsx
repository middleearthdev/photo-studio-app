'use client'

import { useState } from 'react'
import { motion } from 'framer-motion'
import { Camera, Award, Filter, Star, Phone, Mail, Image as ImageIcon } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { usePublicPackages, usePublicPackageCategories } from '@/hooks/use-customer-packages'
import type { Package } from '@/actions/customer-packages'
import { PackageCard } from '@/components/package-card'
import { Navbar } from '@/components/navbar'
import { Footer } from '@/components/footer'

export default function PackagesPage() {
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null)
  const [searchQuery, setSearchQuery] = useState('')
  const [sortBy, setSortBy] = useState<'price-asc' | 'price-desc' | 'name' | 'popular'>('popular')
  const { data: packages = [], isLoading: packagesLoading } = usePublicPackages()
  const { data: categories = [], isLoading: categoriesLoading } = usePublicPackageCategories()

  // packages are already filtered to active only in the API
  const activePackages = packages

  // Advanced filtering
  const filteredPackages = activePackages
    .filter((pkg: Package) => {
      // Category filter
      if (selectedCategory && pkg.category?.id !== selectedCategory) return false

      // Search filter
      if (searchQuery) {
        const query = searchQuery.toLowerCase()
        return (
          pkg.name.toLowerCase().includes(query) ||
          pkg.description?.toLowerCase().includes(query) ||
          pkg.category?.name.toLowerCase().includes(query) ||
          pkg.includes?.some(item => item.toLowerCase().includes(query))
        )
      }

      return true
    })
    .sort((a, b) => {
      switch (sortBy) {
        case 'price-asc':
          return a.price - b.price
        case 'price-desc':
          return b.price - a.price
        case 'name':
          return a.name.localeCompare(b.name)
        case 'popular':
        default:
          if (a.is_popular && !b.is_popular) return -1
          if (!a.is_popular && b.is_popular) return 1
          return a.price - b.price
      }
    })

  const formatPrice = (price: number) => {
    return new Intl.NumberFormat('id-ID', {
      style: 'currency',
      currency: 'IDR',
      minimumFractionDigits: 0
    }).format(price)
  }

  // Statistics
  const totalPackages = activePackages.length
  const popularPackages = activePackages.filter(pkg => pkg.is_popular).length
  const priceRange = activePackages.length > 0 ? {
    min: Math.min(...activePackages.map(pkg => pkg.price)),
    max: Math.max(...activePackages.map(pkg => pkg.price))
  } : { min: 0, max: 0 }


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
      <Navbar currentPath="/packages" />

      {/* Hero Section */}
      <section className="relative pt-24 pb-16 px-4 sm:px-6 lg:px-8 overflow-hidden mb-10">
        <div className="absolute inset-0 bg-gradient-to-r from-[#00052e]/5 to-[#b0834d]/5 backdrop-blur-sm"></div>
        <div className="absolute top-20 left-10 w-64 h-64 bg-[#b0834d]/10 rounded-full blur-3xl"></div>
        <div className="absolute bottom-10 right-10 w-96 h-96 bg-[#00052e]/10 rounded-full blur-3xl"></div>
        <div className="relative max-w-7xl mx-auto text-center">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
          >
            <div className="flex justify-center mb-6">
              <div className="w-20 h-20 bg-gradient-to-r from-[#00052e] to-[#b0834d] rounded-full flex items-center justify-center shadow-xl">
                <Camera className="h-10 w-10 text-white" />
              </div>
            </div>
            <h1 className="text-4xl md:text-6xl lg:text-7xl font-bold text-[#00052e] mb-6">
              Pilih Paket <span className="text-[#b0834d]">Foto Terbaik</span>
            </h1>
            <p className="text-xl md:text-2xl text-slate-600 max-w-3xl mx-auto mb-10 leading-relaxed">
              Berbagai pilihan paket foto profesional dengan fasilitas lengkap dan harga terjangkau di Kalarasa Studio
            </p>

            {/* Statistics */}
            <div className="flex flex-wrap items-center justify-center gap-6 mt-12">
              <div className="flex items-center gap-3 bg-white/50 backdrop-blur-sm rounded-full px-6 py-3 shadow-sm">
                <div className="w-10 h-10 bg-[#00052e] rounded-full flex items-center justify-center">
                  <ImageIcon className="h-5 w-5 text-white" />
                </div>
                <div className="text-left">
                  <div className="font-bold text-[#00052e] text-lg">{totalPackages}</div>
                  <div className="text-xs text-slate-600">Paket Tersedia</div>
                </div>
              </div>

              {popularPackages > 0 && (
                <div className="flex items-center gap-3 bg-white/50 backdrop-blur-sm rounded-full px-6 py-3 shadow-sm">
                  <div className="w-10 h-10 bg-[#b0834d] rounded-full flex items-center justify-center">
                    <Star className="h-5 w-5 text-white fill-current" />
                  </div>
                  <div className="text-left">
                    <div className="font-bold text-[#00052e] text-lg">{popularPackages}</div>
                    <div className="text-xs text-slate-600">Paket Terpopuler</div>
                  </div>
                </div>
              )}

              {priceRange.min > 0 && (
                <div className="flex items-center gap-3 bg-white/50 backdrop-blur-sm rounded-full px-6 py-3 shadow-sm">
                  <div className="w-10 h-10 bg-[#00052e] rounded-full flex items-center justify-center">
                    <Award className="h-5 w-5 text-white" />
                  </div>
                  <div className="text-left">
                    <div className="font-bold text-[#00052e] text-lg">
                      {formatPrice(priceRange.min).replace('Rp', '')} - {formatPrice(priceRange.max).replace('Rp', '')}
                    </div>
                    <div className="text-xs text-slate-600">Harga Paket</div>
                  </div>
                </div>
              )}
            </div>
          </motion.div>
        </div>
      </section>

      {/* Search and Filters */}
      <section className="px-4 sm:px-6 lg:px-8 mb-12">
        <div className="max-w-7xl mx-auto">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.2 }}
          >
            {/* Search Bar */}
            <div className="flex flex-col lg:flex-row gap-4 mb-8">
              <div className="relative flex-1">
                <Input
                  placeholder="Cari paket, fasilitas, atau kategori..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-12 pr-6 py-5 rounded-2xl border-slate-300 focus:border-[#00052e] focus:ring-[#00052e] text-base shadow-sm"
                />
              </div>

              {/* Sort Control Only */}
              <div className="flex gap-3">
                <select
                  value={sortBy}
                  onChange={(e) => setSortBy(e.target.value as any)}
                  className="px-6  border rounded-2xl border-slate-300 focus:border-[#00052e] focus:ring-[#00052e] bg-white text-base shadow-sm min-w-[180px]"
                >
                  <option value="popular">Terpopuler</option>
                  <option value="price-asc">Harga Terendah</option>
                  <option value="price-desc">Harga Tertinggi</option>
                  <option value="name">Nama A-Z</option>
                </select>
              </div>
            </div>

            {/* Category Filter */}
            {categories.length > 0 && (
              <div className="flex flex-wrap gap-3 justify-center mb-8">
                <Button
                  variant={selectedCategory === null ? "default" : "outline"}
                  onClick={() => setSelectedCategory(null)}
                  className={`rounded-full px-6 py-3 text-base font-medium min-h-[48px] shadow-sm transition-all duration-300 ${selectedCategory === null
                    ? 'bg-[#00052e] hover:bg-[#00052e]/90 text-white border-[#00052e] shadow-md hover:shadow-lg'
                    : 'border-[#00052e]/30 text-[#00052e] hover:bg-[#00052e]/10 hover:shadow-md'
                    }`}
                >
                  <Filter className="h-4 w-4 mr-2" />
                  Semua Paket
                </Button>
                {categories.map((category) => (
                  <Button
                    key={category.id}
                    variant={selectedCategory === category.id ? "default" : "outline"}
                    onClick={() => setSelectedCategory(category.id)}
                    className={`rounded-full px-6 py-3 text-base font-medium min-h-[48px] shadow-sm transition-all duration-300 ${selectedCategory === category.id
                      ? 'bg-[#00052e] hover:bg-[#00052e]/90 text-white border-[#00052e] shadow-md hover:shadow-lg'
                      : 'border-[#00052e]/30 text-[#00052e] hover:bg-[#00052e]/10 hover:shadow-md'
                      }`}
                  >
                    {category.name}
                  </Button>
                ))}
              </div>
            )}

            {/* Results Info */}
            <div className="flex flex-wrap items-center justify-between py-6 border-t border-slate-200 gap-4">
              <div className="flex flex-wrap items-center gap-4">
                <p className="text-slate-600 text-lg">
                  Menampilkan <span className="font-bold text-[#00052e]">{filteredPackages.length}</span> dari {totalPackages} paket
                </p>
                {searchQuery && (
                  <Badge variant="outline" className="border-[#b0834d] text-[#b0834d] text-base py-1">
                    Pencarian: "{searchQuery}"
                  </Badge>
                )}
                {selectedCategory && (
                  <Badge variant="outline" className="border-[#00052e] text-[#00052e] text-base py-1">
                    {categories.find(cat => cat.id === selectedCategory)?.name}
                  </Badge>
                )}
              </div>

              {(searchQuery || selectedCategory) && (
                <Button
                  variant="ghost"
                  onClick={() => {
                    setSearchQuery('')
                    setSelectedCategory(null)
                  }}
                  className="text-slate-500 hover:text-[#00052e] text-base py-2 px-4 rounded-full"
                >
                  Reset Filter
                </Button>
              )}
            </div>
          </motion.div>
        </div>
      </section>

      {/* Packages Grid */}
      <section className="px-4 sm:px-6 lg:px-8 pb-16">
        <div className="max-w-7xl mx-auto">
          {filteredPackages.length === 0 ? (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="text-center py-20"
            >
              <div className="max-w-md mx-auto">
                <div className="w-32 h-32 bg-slate-100 rounded-full flex items-center justify-center mx-auto mb-8">
                  <Camera className="h-16 w-16 text-slate-400" />
                </div>
                <h3 className="text-3xl font-bold text-slate-600 mb-4">
                  {searchQuery ? 'Tidak Ada Hasil' : 'Belum Ada Paket Tersedia'}
                </h3>
                <p className="text-slate-500 mb-8 text-lg">
                  {searchQuery
                    ? `Tidak ada paket yang sesuai dengan pencarian "${searchQuery}"`
                    : selectedCategory
                      ? 'Tidak ada paket di kategori ini'
                      : 'Belum ada paket yang tersedia saat ini'
                  }
                </p>
                {(searchQuery || selectedCategory) && (
                  <Button
                    onClick={() => {
                      setSearchQuery('')
                      setSelectedCategory(null)
                    }}
                    className="bg-[#00052e] hover:bg-[#00052e]/90 text-white text-lg px-8 py-4 rounded-full shadow-lg hover:shadow-xl transition-all duration-300"
                  >
                    Lihat Semua Paket
                  </Button>
                )}
              </div>
            </motion.div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-10">
              {filteredPackages.map((pkg: Package, index: number) => (
                <PackageCard
                  key={pkg.id}
                  package={pkg}
                  index={index}
                  showAnimation={true}
                  variant="default"
                />
              ))}
            </div>
          )}
        </div>
      </section>

      {/* Quick Actions */}
      <section className="px-4 sm:px-6 lg:px-8 pb-20">
        <div className="max-w-7xl mx-auto">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            viewport={{ once: true }}
          >
            <Card className="bg-gradient-to-r from-[#00052e]/10 to-[#b0834d]/10 border-0 p-10 rounded-3xl shadow-xl">
              <div className="text-center">
                <h3 className="text-3xl font-bold text-[#00052e] mb-6">
                  Butuh Konsultasi?
                </h3>
                <p className="text-slate-600 mb-10 text-xl max-w-3xl mx-auto">
                  Tim ahli kami siap membantu Anda memilih paket foto yang tepat sesuai kebutuhan dan budget
                </p>
                <div className="flex flex-col sm:flex-row gap-6 justify-center">
                  <Button
                    size="lg"
                    className="bg-[#00052e] hover:bg-[#00052e]/90 text-white px-8 py-6 rounded-full text-lg shadow-lg hover:shadow-xl transition-all duration-300"
                  >
                    <Phone className="h-6 w-6 mr-3" />
                    Hubungi Konsultan
                  </Button>
                  <Button
                    size="lg"
                    variant="outline"
                    className="border-[#b0834d] text-[#b0834d] hover:bg-[#b0834d] hover:text-white px-8 py-6 rounded-full text-lg shadow-lg hover:shadow-xl transition-all duration-300"
                  >
                    <Mail className="h-6 w-6 mr-3" />
                    Kirim Pesan
                  </Button>
                </div>
              </div>
            </Card>
          </motion.div>
        </div>
      </section>
      <Footer />
    </div>
  )
}