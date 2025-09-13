'use client'

import { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import Image from 'next/image'
import Link from 'next/link'
import { useSearchParams, useRouter } from 'next/navigation'
import { Camera, Filter, X, ArrowLeft, ArrowRight, Heart, Share2, Download, Eye, Grid3X3, List, Search, Calendar, MapPin, User, Sparkles, Award, Users } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Card, CardContent } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { MobileNav } from '@/components/navigation/mobile-nav'
import { usePublicPortfolios, usePublicPortfolioCategories } from '@/hooks/use-customer-portfolios'
import type { Portfolio } from '@/actions/customer-portfolios'

export default function PortfolioPage() {
  const searchParams = useSearchParams()
  const router = useRouter()
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null)
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid')
  const [selectedItem, setSelectedItem] = useState<Portfolio | null>(null)
  const [currentImageIndex, setCurrentImageIndex] = useState(0)
  const [searchQuery, setSearchQuery] = useState('')
  const [sortBy, setSortBy] = useState('date')

  const { data: portfolios = [], isLoading: portfoliosLoading } = usePublicPortfolios()
  const { data: categories = [], isLoading: categoriesLoading } = usePublicPortfolioCategories()

  // Perbaiki error pada inisialisasi kategori dari query param
  useEffect(() => {
    const categoryParam = searchParams.get('category')
    if (categoryParam && Array.isArray(categories) && categories.length > 0) {
      // Cari kategori berdasarkan nama (karena URL menggunakan nama)
      const category = categories.find((cat: any) =>
        cat.name.toLowerCase() === categoryParam.toLowerCase()
      )
      if (category && category.id) {
        setSelectedCategory(category.id)
      } else {
        setSelectedCategory(null)
      }
    } else if (!categoryParam) {
      setSelectedCategory(null)
    }
  }, [searchParams, categories])

  // Filter and sort portfolios
  const filteredPortfolios = portfolios
    .filter(portfolio =>
      (selectedCategory === null || portfolio.category?.id === selectedCategory) &&
      (searchQuery === '' ||
        portfolio.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
        (portfolio.category?.name && portfolio.category.name.toLowerCase().includes(searchQuery.toLowerCase()))
      )
    )
    .sort((a, b) => {
      switch (sortBy) {
        case 'date':
          return new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
        case 'title':
          return a.title.localeCompare(b.title)
        default:
          return 0
      }
    })

  const openLightbox = (item: Portfolio, imageIndex = 0) => {
    setSelectedItem(item)
    setCurrentImageIndex(imageIndex)
  }

  const closeLightbox = () => {
    setSelectedItem(null)
    setCurrentImageIndex(0)
  }

  const nextImage = () => {
    if (selectedItem && selectedItem.image_url) {
      setCurrentImageIndex(0) // Only one image per portfolio in this implementation
    }
  }

  const prevImage = () => {
    if (selectedItem && selectedItem.image_url) {
      setCurrentImageIndex(0) // Only one image per portfolio in this implementation
    }
  }

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (selectedItem) {
        switch (e.key) {
          case 'Escape':
            closeLightbox()
            break
          case 'ArrowLeft':
            prevImage()
            break
          case 'ArrowRight':
            nextImage()
            break
        }
      }
    }

    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [selectedItem])

  if (portfoliosLoading || categoriesLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#00052e] mx-auto mb-4"></div>
          <p className="text-slate-600">Memuat portfolio...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50/30 to-slate-100">
      {/* Navigation */}
      <nav className="fixed top-0 w-full z-40 bg-white/90 backdrop-blur-md border-b border-slate-200/20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center space-x-3">
              <Image
                src="/icons/logo_blue_white.svg"
                alt="Kalarasa Studio Logo"
                width={40}
                height={40}
                className="rounded-full"
              />
              <span className="text-xl font-bold text-[#00052e]">Kalarasa Studio</span>
            </div>

            <div className="hidden md:flex items-center space-x-8">
              <Link href="/" className="text-slate-600 hover:text-[#00052e] transition-colors">
                Beranda
              </Link>
              <Link href="/packages" className="text-slate-600 hover:text-[#00052e] transition-colors">
                Paket Foto
              </Link>
              <Link href="/portfolio" className="text-[#00052e] hover:text-[#b0834d] transition-colors font-medium">
                Portfolio
              </Link>
              <Link href="/#services" className="text-slate-600 hover:text-[#00052e] transition-colors">
                Layanan
              </Link>
              <Link href="/#contact" className="text-slate-600 hover:text-[#00052e] transition-colors">
                Kontak
              </Link>
              <Button className="bg-[#00052e] hover:bg-[#00052e]/90 text-white transition-all duration-300 shadow-md hover:shadow-lg">
                Booking Sekarang
              </Button>
            </div>

            <MobileNav currentPath="/portfolio" />
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <section className="relative pt-20 pb-16 md:pb-24 overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-r from-[#00052e]/5 to-[#b0834d]/5"></div>

        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8 }}
          >
            <Badge className="mb-6 bg-[#b0834d]/10 text-[#b0834d] border-[#b0834d]/20 px-4 py-2 rounded-full">
              <Camera className="h-4 w-4 mr-1" />
              Portfolio Kami
            </Badge>

            <h1 className="text-3xl md:text-5xl lg:text-6xl font-bold text-[#00052e] mb-6 leading-tight">
              Galeri Karya
              <span className="text-[#b0834d] block">Terbaik</span>
            </h1>

            <p className="text-lg md:text-xl text-slate-600 max-w-2xl mx-auto">
              Jelajahi koleksi foto profesional kami yang telah mengabadikan berbagai momen spesial dan berkesan di Karawang
            </p>
          </motion.div>
        </div>
      </section>

      {/* Filters & Controls */}
      <section className="py-8 bg-white border-b border-slate-200/50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex flex-col lg:flex-row gap-6 items-center justify-between">
            {/* Search & Sort */}
            <div className="flex flex-col sm:flex-row gap-4 w-full lg:w-auto">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-slate-400" />
                <Input
                  placeholder="Cari portfolio..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-10 w-full sm:w-64 border-[#00052e]/30 focus:ring-[#00052e]"
                />
              </div>
              <Select value={sortBy} onValueChange={setSortBy}>
                <SelectTrigger className="w-full sm:w-48 border-[#00052e]/30">
                  <SelectValue placeholder="Urutkan berdasarkan" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="date">Tanggal Terbaru</SelectItem>
                  <SelectItem value="title">Nama A-Z</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* View Mode Toggle */}
            <div className="flex items-center gap-2">
              <Button
                variant={viewMode === 'grid' ? 'default' : 'outline'}
                size="sm"
                onClick={() => setViewMode('grid')}
                className={viewMode === 'grid' ? 'bg-[#00052e] hover:bg-[#00052e]/90' : 'border-[#00052e]/30 text-[#00052e] hover:bg-[#00052e]/10'}
              >
                <Grid3X3 className="h-4 w-4" />
              </Button>
              <Button
                variant={viewMode === 'list' ? 'default' : 'outline'}
                size="sm"
                onClick={() => setViewMode('list')}
                className={viewMode === 'list' ? 'bg-[#00052e] hover:bg-[#00052e]/90' : 'border-[#00052e]/30 text-[#00052e] hover:bg-[#00052e]/10'}
              >
                <List className="h-4 w-4" />
              </Button>
            </div>
          </div>

          {/* Category Filters */}
          <div className="flex flex-wrap gap-3 justify-center mt-6">
            <Button
              variant={selectedCategory === null ? 'default' : 'outline'}
              onClick={() => router.push('/portfolio')}
              className={`rounded-full ${selectedCategory === null
                ? 'bg-[#00052e] hover:bg-[#00052e]/90 text-white'
                : 'border-[#00052e]/30 text-[#00052e] hover:bg-[#00052e]/10'
                }`}
            >
              Semua
            </Button>
            {(Array.isArray(categories) ? categories : []).map((category: any) => (
              <Button
                key={category.id}
                variant={selectedCategory === category.id ? 'default' : 'outline'}
                onClick={() => router.push(`/portfolio?category=${encodeURIComponent(category.name.toLowerCase())}`)}
                className={`rounded-full ${selectedCategory === category.id
                  ? 'bg-[#00052e] hover:bg-[#00052e]/90 text-white'
                  : 'border-[#00052e]/30 text-[#00052e] hover:bg-[#00052e]/10'
                  }`}
              >
                {category.name}
              </Button>
            ))}
          </div>
        </div>
      </section>

      {/* Portfolio Grid/List */}
      <section className="py-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          {filteredPortfolios.length === 0 ? (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="text-center py-16"
            >
              <Camera className="h-20 w-20 text-slate-400 mx-auto mb-4" />
              <h3 className="text-2xl font-semibold text-slate-600 mb-2">
                Tidak Ada Hasil
              </h3>
              <p className="text-slate-500">
                Coba ubah filter atau kata kunci pencarian
              </p>
            </motion.div>
          ) : (
            <>
              {viewMode === 'grid' ? (
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                  {filteredPortfolios.map((portfolio, index) => (
                    <motion.div
                      key={portfolio.id}
                      initial={{ opacity: 0, y: 30 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ duration: 0.6, delay: index * 0.1 }}
                      className="group cursor-pointer"
                    >
                      <Card className="overflow-hidden border-0 shadow-lg hover:shadow-2xl transition-all duration-300 group-hover:scale-[1.02] rounded-2xl">
                        <div className="relative aspect-[4/5] overflow-hidden">
                          <Image
                            src={portfolio.image_url || '/api/placeholder/400/500'}
                            alt={portfolio.title}
                            fill
                            className="object-cover group-hover:scale-110 transition-transform duration-300"
                            onClick={() => openLightbox(portfolio, 0)}
                          />

                          {portfolio.is_featured && (
                            <Badge className="absolute top-3 left-3 bg-[#b0834d] text-white">
                              Featured
                            </Badge>
                          )}

                          <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />

                          <div className="absolute bottom-0 left-0 right-0 p-4 text-white transform translate-y-full group-hover:translate-y-0 transition-transform duration-300">
                            <div className="flex items-center justify-between mb-2">
                              <Badge variant="secondary" className="text-xs bg-white/20 text-white">
                                {portfolio.category?.name || 'Uncategorized'}
                              </Badge>
                            </div>
                            <h3 className="font-bold text-sm mb-1">{portfolio.title}</h3>
                            <p className="text-xs text-white/80 line-clamp-2">
                              {portfolio.description || 'No description available'}
                            </p>
                          </div>
                        </div>
                      </Card>
                    </motion.div>
                  ))}
                </div>
              ) : (
                <div className="space-y-6">
                  {filteredPortfolios.map((portfolio, index) => (
                    <motion.div
                      key={portfolio.id}
                      initial={{ opacity: 0, y: 30 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ duration: 0.6, delay: index * 0.1 }}
                    >
                      <Card className="overflow-hidden border-0 shadow-lg hover:shadow-xl transition-shadow rounded-2xl">
                        <div className="grid md:grid-cols-3 gap-6 p-6">
                          <div className="relative aspect-[4/3] md:aspect-[4/5] overflow-hidden rounded-lg cursor-pointer"
                            onClick={() => openLightbox(portfolio, 0)}>
                            <Image
                              src={portfolio.image_url || '/api/placeholder/400/500'}
                              alt={portfolio.title}
                              fill
                              className="object-cover hover:scale-110 transition-transform duration-300"
                            />
                          </div>

                          <div className="md:col-span-2 flex flex-col justify-between">
                            <div>
                              <div className="flex items-center justify-between mb-3">
                                <Badge className="bg-[#00052e]/10 text-[#00052e]">
                                  {portfolio.category?.name || 'Uncategorized'}
                                </Badge>
                                {portfolio.is_featured && (
                                  <Badge className="bg-[#b0834d] text-white">
                                    Featured
                                  </Badge>
                                )}
                              </div>

                              <h3 className="text-2xl font-bold text-[#00052e] mb-3">
                                {portfolio.title}
                              </h3>

                              <p className="text-slate-600 mb-4">
                                {portfolio.description || 'No description available'}
                              </p>

                              <div className="flex flex-wrap gap-2 text-sm text-slate-500">
                                <div className="flex items-center">
                                  <Calendar className="h-4 w-4 mr-2 text-[#b0834d]" />
                                  {new Date(portfolio.created_at).toLocaleDateString('id-ID', {
                                    year: 'numeric',
                                    month: 'long',
                                    day: 'numeric'
                                  })}
                                </div>
                              </div>
                            </div>

                            <div className="flex items-center justify-between pt-4 border-t border-slate-200/50">
                              <Button
                                size="sm"
                                variant="outline"
                                className="border-[#00052e] text-[#00052e] hover:bg-[#00052e] hover:text-white rounded-full"
                                onClick={() => openLightbox(portfolio, 0)}
                              >
                                <Eye className="h-4 w-4 mr-2" />
                                Lihat Detail
                              </Button>
                            </div>
                          </div>
                        </div>
                      </Card>
                    </motion.div>
                  ))}
                </div>
              )}
            </>
          )}
        </div>
      </section>

      {/* Lightbox Modal */}
      <AnimatePresence>
        {selectedItem && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center bg-black/90 p-4"
            onClick={closeLightbox}
          >
            <div className="relative max-w-5xl w-full max-h-full flex flex-col">
              {/* Header */}
              <div className="flex items-center justify-between text-white mb-4 px-4">
                <div>
                  <h3 className="text-xl font-bold">{selectedItem.title}</h3>
                  <p className="text-sm text-white/80">
                    {selectedItem.category?.name || 'Uncategorized'}
                  </p>
                </div>
                <div className="flex items-center space-x-2">
                  <Button
                    size="sm"
                    variant="ghost"
                    onClick={closeLightbox}
                    className="text-white hover:bg-white/20 rounded-full"
                  >
                    <X className="h-4 w-4" />
                  </Button>
                </div>
              </div>

              {/* Image */}
              <div className="relative flex-1 flex items-center justify-center">
                <Image
                  src={selectedItem.image_url || '/api/placeholder/800/600'}
                  alt={selectedItem.title}
                  width={800}
                  height={600}
                  className="max-w-full max-h-full object-contain"
                  onClick={(e) => e.stopPropagation()}
                />

                {/* Navigation Arrows - Only shown if there are multiple images */}
                {false && (
                  <>
                    <Button
                      size="sm"
                      variant="ghost"
                      className="absolute left-4 top-1/2 transform -translate-y-1/2 text-white hover:bg-white/20 rounded-full"
                      onClick={(e) => {
                        e.stopPropagation()
                        prevImage()
                      }}
                    >
                      <ArrowLeft className="h-6 w-6" />
                    </Button>
                    <Button
                      size="sm"
                      variant="ghost"
                      className="absolute right-4 top-1/2 transform -translate-y-1/2 text-white hover:bg-white/20 rounded-full"
                      onClick={(e) => {
                        e.stopPropagation()
                        nextImage()
                      }}
                    >
                      <ArrowRight className="h-6 w-6" />
                    </Button>
                  </>
                )}
              </div>

              {/* Image Details */}
              <div className="p-4 text-white">
                <p className="text-white/80">
                  {selectedItem.description || 'No description available'}
                </p>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

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
              Mengapa Memilih Kalarasa Studio?
            </h2>
            <p className="text-xl text-white/90 max-w-2xl mx-auto">
              Kami berkomitmen memberikan pengalaman fotografi terbaik dengan kualitas premium
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
                icon: Camera,
                title: "Peralatan Terbaik",
                description: "Menggunakan kamera dan peralatan fotografi terdepan untuk hasil maksimal"
              },
              {
                icon: Users,
                title: "Tim Berpengalaman",
                description: "Fotografer profesional dengan pengalaman puluhan tahun di industri"
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
            <Sparkles className="h-16 w-16 text-[#b0834d] mx-auto mb-6" />
            <h2 className="text-3xl md:text-4xl lg:text-5xl font-bold text-[#00052e] mb-6">
              Tertarik Dengan Karya Kami?
            </h2>
            <p className="text-lg md:text-xl text-slate-600 mb-8 max-w-2xl mx-auto">
              Mari wujudkan visi kreatif Anda bersama tim profesional kami di Karawang
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Button size="lg" className="bg-[#00052e] hover:bg-[#00052e]/90 text-white px-8 py-6 rounded-full transition-all duration-300 shadow-lg hover:shadow-xl">
                <Camera className="h-5 w-5 mr-2" />
                Mulai Proyek Anda
              </Button>
              <Button size="lg" variant="outline" className="border-[#00052e] text-[#00052e] hover:bg-[#00052e] hover:text-white px-8 py-6 rounded-full transition-all duration-300">
                <Calendar className="h-5 w-5 mr-2" />
                Lihat Paket Harga
              </Button>
            </div>
          </motion.div>
        </div>
      </section>
    </div>
  )
}