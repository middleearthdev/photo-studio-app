'use client'

import { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import Image from 'next/image'
import Link from 'next/link'
import { Camera, Star, Users, Clock, MapPin, Phone, Mail, ArrowRight, CheckCircle, Award, Heart, Sparkles, Calendar, Image as ImageIcon, ChevronRight, RefreshCw } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Card, CardContent } from '@/components/ui/card'
import { BottomNav } from '@/components/navigation/bottom-nav'
import { usePublicPortfolioCategoriesWithCovers } from '@/hooks/use-customer-portfolios'
import { usePublicStudios } from '@/hooks/use-studios'
import { usePublicPackageCategories, usePublicPackages } from '@/hooks/use-customer-packages'
import type { PortfolioCategoryWithCover } from '@/hooks/use-customer-portfolios'
import type { Package } from '@/actions/customer-packages'
import { PackageCard } from '@/components/package-card'
import { Footer } from '@/components/footer'

export default function Home() {
  const [currentSlide, setCurrentSlide] = useState(0)

  // Quick Package Finder state
  const [finderStep, setFinderStep] = useState(0)
  const [selectedPurpose, setSelectedPurpose] = useState<string>('')
  const [selectedDuration, setSelectedDuration] = useState<string>('')
  const [selectedBudget, setSelectedBudget] = useState<string>('')
  const [showResults, setShowResults] = useState(false)

  // Fetch data from database
  const { data: portfolioCategoriesData = [] } = usePublicPortfolioCategoriesWithCovers()
  const { data: studiosData = [] } = usePublicStudios()
  const { data: packageCategoriesData = [] } = usePublicPackageCategories()
  const { data: packagesData = [], isLoading: packagesLoading } = usePublicPackages()

  // Updated hero images with Unsplash photos
  const heroImages = [
    'https://images.unsplash.com/photo-1606216794074-735e91aa2c92?w=800&h=600&fit=crop&crop=center',
    'https://images.unsplash.com/photo-1542038784456-1ea8e732a1d9?w=800&h=600&fit=crop&crop=center',
    'https://images.unsplash.com/photo-1519741497674-611481863552?w=800&h=600&fit=crop&crop=center'
  ]

  // Use portfolio categories from database
  const portfolioCategories = portfolioCategoriesData.map(category => ({
    name: category.name,
    count: category.portfolios_count || 0,
    image: category.cover_image || 'https://images.unsplash.com/photo-1519741497674-611481863552?w=400&h=400&fit=crop&crop=center',
    icon: getCategoryIcon(category.name)
  }))

  // Get first studio for contact info
  const firstStudio = studiosData.length > 0 ? studiosData[0] : null

  // Features with updated icons and descriptions
  const features = [
    {
      icon: Camera,
      title: "Peralatan Profesional",
      description: "Menggunakan kamera dan peralatan fotografi terdepan untuk hasil maksimal"
    },
    {
      icon: Users,
      title: "Tim Berpengalaman",
      description: "Fotografer profesional dengan pengalaman puluhan tahun di industri"
    },
    {
      icon: Heart,
      title: "Pelayanan Terbaik",
      description: "Komitmen memberikan pengalaman fotografi yang tak terlupakan untuk setiap klien"
    },
    {
      icon: Award,
      title: "Kualitas Premium",
      description: "Setiap foto diedit dengan detail tinggi untuk hasil akhir yang sempurna"
    }
  ]



  // Quick Package Finder data and logic
  const purposes = [
    { id: 'wedding', label: 'Pernikahan', icon: Heart, description: 'Foto pre-wedding & pernikahan' },
    { id: 'portrait', label: 'Portrait', icon: Users, description: 'Foto individual & keluarga' },
    { id: 'family', label: 'Keluarga', icon: Users, description: 'Foto keluarga & gathering' },
    { id: 'corporate', label: 'Corporate', icon: Award, description: 'Foto event & profil perusahaan' },
    { id: 'product', label: 'Product', icon: ImageIcon, description: 'Foto produk & komersial' }
  ]

  const durations = [
    { id: '60', label: '1 Jam', description: 'Sesi singkat & efisien' },
    { id: '120', label: '2 Jam', description: 'Sesi standar' },
    { id: '180', label: '3+ Jam', description: 'Sesi lengkap & detail' }
  ]

  const budgets = [
    { id: '0-500000', label: 'Di bawah Rp 500K', description: 'Paket hemat' },
    { id: '500000-1000000', label: 'Rp 500K - 1Jt', description: 'Paket standar' },
    { id: '1000000-2000000', label: 'Rp 1Jt - 2Jt', description: 'Paket premium' },
    { id: '2000000+', label: 'Di atas Rp 2Jt', description: 'Paket eksklusif' }
  ]

  // Filter packages based on finder selections
  const getRecommendedPackages = (): Package[] => {
    if (!packagesData.length || (!selectedPurpose && !selectedDuration && !selectedBudget)) {
      return packagesData.slice(0, 3)
    }

    let filtered = [...packagesData]

    // Filter by purpose (category)
    if (selectedPurpose) {
      filtered = filtered.filter(pkg =>
        pkg.category?.name.toLowerCase().includes(selectedPurpose.toLowerCase()) ||
        pkg.name.toLowerCase().includes(selectedPurpose.toLowerCase()) ||
        pkg.description?.toLowerCase().includes(selectedPurpose.toLowerCase())
      )
    }

    // Filter by duration
    if (selectedDuration) {
      const targetMinutes = parseInt(selectedDuration)
      if (selectedDuration === '180') { // 3+ hours
        filtered = filtered.filter(pkg => pkg.duration_minutes >= 180)
      } else {
        filtered = filtered.filter(pkg =>
          Math.abs(pkg.duration_minutes - targetMinutes) <= 30 // ±30 minutes tolerance
        )
      }
    }

    // Filter by budget
    if (selectedBudget) {
      const [min, max] = selectedBudget.includes('+')
        ? [2000000, Infinity]
        : selectedBudget.split('-').map(b => parseInt(b.replace(/[^\d]/g, '')))

      filtered = filtered.filter(pkg =>
        pkg.price >= min && (max === Infinity || pkg.price <= max)
      )
    }

    // Sort by popularity and price
    filtered.sort((a, b) => {
      if (a.is_popular && !b.is_popular) return -1
      if (!a.is_popular && b.is_popular) return 1
      return a.price - b.price
    })

    return filtered.slice(0, 3)
  }

  const recommendedPackages = getRecommendedPackages()

  // Reset finder
  const resetFinder = () => {
    setFinderStep(0)
    setSelectedPurpose('')
    setSelectedDuration('')
    setSelectedBudget('')
    setShowResults(false)
  }

  // Next step handler
  const nextStep = () => {
    if (finderStep < 2) {
      setFinderStep(finderStep + 1)
    } else {
      setShowResults(true)
    }
  }

  // Updated testimonials with Unsplash images
  const testimonials = [
    {
      name: 'Sarah & David',
      type: 'Wedding Photography',
      rating: 5,
      text: 'Hasil foto pernikahan kami sangat menakjubkan! Tim yang profesional dan sangat membantu. Setiap momen spesial berhasil diabadikan dengan sempurna.',
      image: 'https://images.unsplash.com/photo-1544005313-94ddf0286df2?w=80&h=80&fit=crop&crop=face'
    },
    {
      name: 'PT. Maju Jaya',
      type: 'Corporate Event',
      rating: 5,
      text: 'Dokumentasi event perusahaan kami sangat berkualitas dan sesuai ekspektasi. Layanan cepat dan hasilnya luar biasa!',
      image: 'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=80&h=80&fit=crop&crop=face'
    },
    {
      name: 'Keluarga Budi',
      type: 'Family Portrait',
      rating: 5,
      text: 'Anak-anak sangat senang dan hasilnya natural sekali. Terima kasih Kalarasa Studio untuk pengalaman yang tak terlupakan!',
      image: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=80&h=80&fit=crop&crop=face'
    }
  ]

  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentSlide((prev) => (prev + 1) % heroImages.length)
    }, 5000)
    return () => clearInterval(timer)
  }, [])

  // Function to get icon based on category name
  function getCategoryIcon(categoryName: string) {
    const categoryMap: { [key: string]: any } = {
      'Wedding': Heart,
      'Portrait': Users,
      'Family': Camera,
      'Product': ImageIcon,
      'Event': Calendar
    }
    return categoryMap[categoryName] || Camera
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50/30 to-slate-100">
      {/* Navigation */}
      <nav className="fixed top-0 w-full z-50 bg-white/90 backdrop-blur-md border-b border-slate-200/20">
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
              <Link href="/" className="text-[#00052e] hover:text-[#b0834d] transition-colors font-medium">
                Beranda
              </Link>
              <Link href="/packages" className="text-slate-600 hover:text-[#00052e] transition-colors">
                Paket Foto
              </Link>
              <Link href="/portfolio" className="text-slate-600 hover:text-[#00052e] transition-colors">
                Portfolio
              </Link>
              <Link href="#services" className="text-slate-600 hover:text-[#00052e] transition-colors">
                Layanan
              </Link>
              <Link href="#contact" className="text-slate-600 hover:text-[#00052e] transition-colors">
                Kontak
              </Link>
              <Link href="/packages">
                <Button className="bg-[#00052e] hover:bg-[#00052e]/90 text-white transition-all duration-300 shadow-md hover:shadow-lg">
                  Booking Sekarang
                </Button>
              </Link>
            </div>

            {/* <MobileNav currentPath="/" /> */}
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <section className="relative pt-20 pb-16 md:pb-24 overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-r from-[#00052e]/5 to-[#b0834d]/5"></div>

        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 grid lg:grid-cols-2 gap-12 items-center">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8 }}
            className="text-center lg:text-left"
          >
            <Badge className="mb-6 bg-[#b0834d]/10 text-[#b0834d] border-[#b0834d]/20 px-4 py-2 rounded-full">
              <Star className="h-4 w-4 mr-1 fill-current" />
              Studio Foto Terpercaya di Karawang
            </Badge>

            <h1 className="text-3xl sm:text-4xl md:text-5xl lg:text-6xl font-bold text-[#00052e] mb-4 sm:mb-6 leading-tight">
              Abadikan Setiap
              <span className="text-[#b0834d] block">Momen Berharga</span>
            </h1>

            <p className="text-base sm:text-lg md:text-xl text-slate-600 mb-6 sm:mb-8 max-w-2xl mx-auto lg:mx-0">
              Studio foto profesional di Karawang dengan teknologi terdepan dan tim berpengalaman.
              Wujudkan setiap momen spesial menjadi karya seni yang tak terlupakan.
            </p>

            <div className="flex flex-col sm:flex-row gap-4 mb-8 justify-center lg:justify-start">
              <Link href="/packages">
                <Button size="lg" className="bg-[#00052e] hover:bg-[#00052e]/90 text-white px-8 py-6 text-base rounded-full transition-all duration-300 shadow-lg hover:shadow-xl">
                  <Camera className="h-5 w-5 mr-2" />
                  Lihat Paket Foto
                </Button>
              </Link>
            </div>

            <div className="flex flex-col sm:flex-row items-center justify-center lg:justify-start space-y-4 sm:space-y-0 sm:space-x-8 text-sm text-slate-600">
              <div className="flex items-center">
                <CheckCircle className="h-5 w-5 text-green-500 mr-2" />
                <span>1000+ Klien Puas</span>
              </div>
              <div className="flex items-center">
                <Award className="h-5 w-5 text-[#b0834d] mr-2" />
                <span>5+ Tahun Pengalaman</span>
              </div>
            </div>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.8, delay: 0.2 }}
            className="relative"
          >
            <div className="relative h-[400px] md:h-[500px] rounded-3xl overflow-hidden bg-gradient-to-br from-[#00052e] to-[#b0834d] p-1 shadow-2xl">
              <div className="w-full h-full bg-white rounded-3xl overflow-hidden relative">
                <Image
                  src={heroImages[currentSlide]}
                  alt="Studio Photography"
                  fill
                  className="object-cover"
                  priority
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/40 to-transparent"></div>
              </div>

              <div className="absolute bottom-6 left-1/2 transform -translate-x-1/2 flex space-x-2">
                {heroImages.map((_, index) => (
                  <button
                    key={index}
                    className={`w-3 h-3 rounded-full transition-all duration-300 ${index === currentSlide ? 'bg-white' : 'bg-white/50'
                      }`}
                    onClick={() => setCurrentSlide(index)}
                    aria-label={`Lihat slide ${index + 1}`}
                  />
                ))}
              </div>
            </div>

            <div className="absolute -top-6 -right-6 bg-white rounded-2xl p-5 shadow-xl border border-slate-200">
              <div className="text-center">
                <div className="text-2xl font-bold text-[#b0834d]">4.9</div>
                <div className="flex text-yellow-400 mb-1 justify-center">
                  {[...Array(5)].map((_, i) => (
                    <Star key={i} className="h-4 w-4 fill-current" />
                  ))}
                </div>
                <div className="text-xs text-slate-600">Rating</div>
              </div>
            </div>
          </motion.div>
        </div>
      </section>

      {/* Portfolio Categories */}
      <section id="portfolio" className="py-20 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            className="text-center mb-16"
            viewport={{ once: true }}
          >
            <Badge className="mb-4 bg-[#00052e]/10 text-[#00052e] px-4 py-2 rounded-full">
              Portfolio
            </Badge>
            <h2 className="text-3xl md:text-4xl lg:text-5xl font-bold text-[#00052e] mb-6">
              Galeri Karya Terbaik
            </h2>
            <p className="text-lg md:text-xl text-slate-600 max-w-2xl mx-auto">
              Jelajahi berbagai kategori fotografi yang telah kami kerjakan dengan penuh dedikasi
            </p>
          </motion.div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {portfolioCategories.map((category, index) => {
              const Icon = category.icon
              return (
                <Link href={`/portfolio?category=${encodeURIComponent(category.name.toLowerCase())}`} key={category.name}>
                  <motion.div
                    initial={{ opacity: 0, y: 30 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.6, delay: index * 0.1 }}
                    viewport={{ once: true }}
                    className="group cursor-pointer"
                  >
                    <Card className="overflow-hidden border-0 shadow-lg hover:shadow-2xl transition-all duration-300 group-hover:scale-105 rounded-2xl">
                      <div className="relative h-64 overflow-hidden">
                        <Image
                          src={category.image}
                          alt={category.name}
                          fill
                          className="object-cover group-hover:scale-110 transition-transform duration-500"
                        />
                        <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/20 to-transparent" />
                        <div className="absolute bottom-4 left-4 text-white">
                          <div className="flex items-center mb-2">
                            <Icon className="h-5 w-5 mr-2 text-[#b0834d]" />
                            <h3 className="text-xl font-bold">{category.name}</h3>
                          </div>
                          <p className="text-sm opacity-90">{category.count} Foto</p>
                        </div>
                        <div className="absolute top-4 right-4 bg-white/20 backdrop-blur-sm text-white rounded-full p-2 opacity-0 group-hover:opacity-100 transition-opacity duration-300">
                          <ArrowRight className="h-4 w-4" />
                        </div>
                      </div>
                    </Card>
                  </motion.div>
                </Link>
              )
            })}
          </div>

          <div className="text-center mt-12">
            <Link href="/portfolio">
              <Button size="lg" variant="outline" className="border-[#00052e] text-[#00052e] hover:bg-[#00052e] hover:text-white px-8 py-6 text-base rounded-full transition-all duration-300">
                Lihat Semua Portfolio
                <ArrowRight className="h-5 w-5 ml-2" />
              </Button>
            </Link>
          </div>
        </div>
      </section>

      {/* Services Features */}
      <section id="services" className="py-20 bg-gradient-to-br from-slate-50 to-blue-50/30">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            className="text-center mb-16"
            viewport={{ once: true }}
          >
            <Badge className="mb-4 bg-[#b0834d]/10 text-[#b0834d] px-4 py-2 rounded-full">
              Layanan
            </Badge>
            <h2 className="text-3xl md:text-4xl lg:text-5xl font-bold text-[#00052e] mb-6">
              Mengapa Memilih Kami?
            </h2>
            <p className="text-lg md:text-xl text-slate-600 max-w-2xl mx-auto">
              Kami berkomitmen memberikan pengalaman fotografi terbaik dengan kualitas premium
            </p>
          </motion.div>

          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
            {features.map((feature, index) => {
              const Icon = feature.icon
              return (
                <motion.div
                  key={feature.title}
                  initial={{ opacity: 0, y: 30 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.6, delay: index * 0.1 }}
                  viewport={{ once: true }}
                >
                  <Card className="text-center p-8 border-0 shadow-lg hover:shadow-xl transition-all duration-300 rounded-2xl hover:-translate-y-2">
                    <div className="w-16 h-16 mx-auto mb-6 bg-gradient-to-br from-[#00052e] to-[#b0834d] rounded-full flex items-center justify-center">
                      <Icon className="h-8 w-8 text-white" />
                    </div>
                    <h3 className="text-xl font-bold text-[#00052e] mb-4">{feature.title}</h3>
                    <p className="text-slate-600">{feature.description}</p>
                  </Card>
                </motion.div>
              )
            })}
          </div>
        </div>
      </section>

      {/* Quick Package Finder Section */}
      <section className="py-12 sm:py-16 lg:py-20 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            className="text-center mb-8 sm:mb-12 lg:mb-16"
            viewport={{ once: true }}
          >
            <Badge className="mb-3 sm:mb-4 bg-[#00052e]/10 text-[#00052e] px-3 sm:px-4 py-1 sm:py-2 rounded-full text-xs sm:text-sm">
              Temukan Paket
            </Badge>
            <h2 className="text-2xl sm:text-3xl md:text-4xl lg:text-5xl font-bold text-[#00052e] mb-4 sm:mb-6">
              Paket Foto Yang Tepat Untuk Anda
            </h2>
            <p className="text-sm sm:text-base md:text-lg lg:text-xl text-slate-600 max-w-2xl mx-auto">
              Jawab beberapa pertanyaan singkat dan kami akan merekomendasikan paket foto terbaik sesuai kebutuhan Anda
            </p>
          </motion.div>

          {packagesLoading ? (
            <div className="flex justify-center items-center py-12 sm:py-16 lg:py-20">
              <div className="text-center">
                <div className="animate-spin rounded-full h-8 w-8 sm:h-10 sm:w-10 lg:h-12 lg:w-12 border-b-2 border-[#00052e] mx-auto mb-3 sm:mb-4"></div>
                <p className="text-slate-600 text-sm sm:text-base">Memuat paket...</p>
              </div>
            </div>
          ) : !showResults ? (
            <div className="max-w-4xl mx-auto">
              {/* Progress Indicator */}
              <div className="flex justify-center mb-8 sm:mb-10 lg:mb-12">
                <div className="flex items-center space-x-2 sm:space-x-4">
                  {[0, 1, 2].map((step) => (
                    <div key={step} className="flex items-center">
                      <div className={`w-6 h-6 sm:w-8 sm:h-8 rounded-full flex items-center justify-center text-xs sm:text-sm font-medium transition-all duration-300 ${step <= finderStep
                        ? 'bg-[#00052e] text-white'
                        : 'bg-slate-200 text-slate-500'
                        }`}>
                        {step + 1}
                      </div>
                      {step < 2 && (
                        <div className={`w-8 sm:w-12 h-1 mx-1 sm:mx-2 transition-all duration-300 ${step < finderStep ? 'bg-[#00052e]' : 'bg-slate-200'
                          }`} />
                      )}
                    </div>
                  ))}
                </div>
              </div>

              {/* Step 1: Purpose */}
              {finderStep === 0 && (
                <motion.div
                  key="step-0"
                  initial={{ opacity: 0, x: 50 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -50 }}
                  transition={{ duration: 0.5 }}
                  className="text-center"
                >
                  <h3 className="text-lg sm:text-xl lg:text-2xl font-bold text-[#00052e] mb-3 sm:mb-4">
                    Untuk keperluan apa?
                  </h3>
                  <p className="text-slate-600 mb-6 sm:mb-8 text-sm sm:text-base">
                    Pilih jenis foto yang Anda butuhkan
                  </p>

                  <div className="grid grid-cols-2 sm:grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-4 max-w-4xl mx-auto mb-6 sm:mb-8">
                    {purposes.map((purpose) => {
                      const Icon = purpose.icon
                      return (
                        <Card
                          key={purpose.id}
                          className={`cursor-pointer transition-all duration-300 hover:shadow-lg border-2 ${selectedPurpose === purpose.id
                            ? 'border-[#00052e] bg-[#00052e]/5 shadow-lg'
                            : 'border-slate-200 hover:border-[#00052e]/50'
                            }`}
                          onClick={() => setSelectedPurpose(purpose.id)}
                        >
                          <CardContent className="p-3 sm:p-4 lg:p-6 text-center">
                            <Icon className={`h-6 w-6 sm:h-8 sm:w-8 mx-auto mb-2 sm:mb-3 ${selectedPurpose === purpose.id ? 'text-[#00052e]' : 'text-slate-500'
                              }`} />
                            <h4 className="font-semibold text-[#00052e] mb-1 text-sm sm:text-base">
                              {purpose.label}
                            </h4>
                            <p className="text-xs sm:text-sm text-slate-500 hidden sm:block">
                              {purpose.description}
                            </p>
                          </CardContent>
                        </Card>
                      )
                    })}
                  </div>

                  <Button
                    onClick={nextStep}
                    disabled={!selectedPurpose}
                    className="bg-[#00052e] hover:bg-[#00052e]/90 text-white px-6 sm:px-8 py-2 sm:py-3 rounded-full text-sm sm:text-base"
                  >
                    Lanjut
                    <ChevronRight className="h-4 w-4 sm:h-5 sm:w-5 ml-1 sm:ml-2" />
                  </Button>
                </motion.div>
              )}

              {/* Step 2: Duration */}
              {finderStep === 1 && (
                <motion.div
                  key="step-1"
                  initial={{ opacity: 0, x: 50 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -50 }}
                  transition={{ duration: 0.5 }}
                  className="text-center"
                >
                  <h3 className="text-lg sm:text-xl lg:text-2xl font-bold text-[#00052e] mb-3 sm:mb-4">
                    Berapa lama sesi foto?
                  </h3>
                  <p className="text-slate-600 mb-6 sm:mb-8 text-sm sm:text-base">
                    Pilih durasi yang sesuai dengan kebutuhan Anda
                  </p>

                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 sm:gap-4 max-w-3xl mx-auto mb-6 sm:mb-8">
                    {durations.map((duration) => (
                      <Card
                        key={duration.id}
                        className={`cursor-pointer transition-all duration-300 hover:shadow-lg border-2 ${selectedDuration === duration.id
                          ? 'border-[#00052e] bg-[#00052e]/5 shadow-lg'
                          : 'border-slate-200 hover:border-[#00052e]/50'
                          }`}
                        onClick={() => setSelectedDuration(duration.id)}
                      >
                        <CardContent className="p-4 sm:p-6 text-center">
                          <Clock className={`h-6 w-6 sm:h-8 sm:w-8 mx-auto mb-2 sm:mb-3 ${selectedDuration === duration.id ? 'text-[#00052e]' : 'text-slate-500'
                            }`} />
                          <h4 className="font-semibold text-[#00052e] mb-1 text-sm sm:text-base">
                            {duration.label}
                          </h4>
                          <p className="text-xs sm:text-sm text-slate-500">
                            {duration.description}
                          </p>
                        </CardContent>
                      </Card>
                    ))}
                  </div>

                  <div className="flex justify-center gap-3 sm:gap-4">
                    <Button
                      onClick={() => setFinderStep(0)}
                      variant="outline"
                      className="border-[#00052e] text-[#00052e] px-4 sm:px-6 py-2 sm:py-3 rounded-full text-sm sm:text-base"
                    >
                      Kembali
                    </Button>
                    <Button
                      onClick={nextStep}
                      disabled={!selectedDuration}
                      className="bg-[#00052e] hover:bg-[#00052e]/90 text-white px-6 sm:px-8 py-2 sm:py-3 rounded-full text-sm sm:text-base"
                    >
                      Lanjut
                      <ChevronRight className="h-4 w-4 sm:h-5 sm:w-5 ml-1 sm:ml-2" />
                    </Button>
                  </div>
                </motion.div>
              )}

              {/* Step 3: Budget */}
              {finderStep === 2 && (
                <motion.div
                  key="step-2"
                  initial={{ opacity: 0, x: 50 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -50 }}
                  transition={{ duration: 0.5 }}
                  className="text-center"
                >
                  <h3 className="text-lg sm:text-xl lg:text-2xl font-bold text-[#00052e] mb-3 sm:mb-4">
                    Budget range?
                  </h3>
                  <p className="text-slate-600 mb-6 sm:mb-8 text-sm sm:text-base">
                    Pilih range budget yang sesuai untuk Anda
                  </p>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4 max-w-3xl mx-auto mb-6 sm:mb-8">
                    {budgets.map((budget) => (
                      <Card
                        key={budget.id}
                        className={`cursor-pointer transition-all duration-300 hover:shadow-lg border-2 ${selectedBudget === budget.id
                          ? 'border-[#00052e] bg-[#00052e]/5 shadow-lg'
                          : 'border-slate-200 hover:border-[#00052e]/50'
                          }`}
                        onClick={() => setSelectedBudget(budget.id)}
                      >
                        <CardContent className="p-4 sm:p-6 text-center">
                          <Sparkles className={`h-6 w-6 sm:h-8 sm:w-8 mx-auto mb-2 sm:mb-3 ${selectedBudget === budget.id ? 'text-[#00052e]' : 'text-slate-500'
                            }`} />
                          <h4 className="font-semibold text-[#00052e] mb-1 text-sm sm:text-base">
                            {budget.label}
                          </h4>
                          <p className="text-xs sm:text-sm text-slate-500">
                            {budget.description}
                          </p>
                        </CardContent>
                      </Card>
                    ))}
                  </div>

                  <div className="flex justify-center gap-3 sm:gap-4">
                    <Button
                      onClick={() => setFinderStep(1)}
                      variant="outline"
                      className="border-[#00052e] text-[#00052e] px-4 sm:px-6 py-2 sm:py-3 rounded-full text-sm sm:text-base"
                    >
                      Kembali
                    </Button>
                    <Button
                      onClick={nextStep}
                      disabled={!selectedBudget}
                      className="bg-[#00052e] hover:bg-[#00052e]/90 text-white px-6 sm:px-8 py-2 sm:py-3 rounded-full text-sm sm:text-base"
                    >
                      <span className="hidden sm:inline">Lihat Rekomendasi</span>
                      <span className="sm:hidden">Rekomendasi</span>
                      <Camera className="h-4 w-4 sm:h-5 sm:w-5 ml-1 sm:ml-2" />
                    </Button>
                  </div>
                </motion.div>
              )}
            </div>
          ) : (
            /* Results Section */
            <>
              <div className="text-center mb-6 sm:mb-8">
                <h3 className="text-lg sm:text-xl lg:text-2xl font-bold text-[#00052e] mb-3 sm:mb-4">
                  Rekomendasi Paket Untuk Anda
                </h3>
                <p className="text-slate-600 mb-4 sm:mb-6 text-sm sm:text-base">
                  Berdasarkan pilihan Anda, berikut adalah paket foto yang cocok
                </p>
                <Button
                  onClick={resetFinder}
                  variant="outline"
                  className="border-[#00052e] text-[#00052e] hover:bg-[#00052e] hover:text-white rounded-full px-4 sm:px-6 py-2 sm:py-3 text-sm sm:text-base"
                >
                  <RefreshCw className="h-3 w-3 sm:h-4 sm:w-4 mr-1 sm:mr-2" />
                  Cari Lagi
                </Button>
              </div>

              {recommendedPackages.length > 0 ? (
                <div className="grid grid-cols-2 md:grid-cols-3 gap-3 sm:gap-4 md:gap-6">
                  {recommendedPackages.map((pkg, index) => (
                    <PackageCard
                      key={pkg.id}
                      package={pkg}
                      index={index}
                      showAnimation={true}
                      variant="default"
                    />
                  ))}
                </div>
              ) : (
                <div className="text-center py-20">
                  <Camera className="h-16 w-16 text-slate-300 mx-auto mb-4" />
                  <p className="text-slate-500 text-lg mb-4">
                    Maaf, tidak ada paket yang sesuai dengan kriteria Anda
                  </p>
                  <div className="flex justify-center gap-4">
                    <Button
                      onClick={resetFinder}
                      className="bg-[#00052e] hover:bg-[#00052e]/90 text-white rounded-full"
                    >
                      <RefreshCw className="h-4 w-4 mr-2" />
                      Coba Lagi
                    </Button>
                    <Link href="/packages">
                      <Button variant="outline" className="border-[#00052e] text-[#00052e] hover:bg-[#00052e] hover:text-white rounded-full">
                        Lihat Semua Paket
                      </Button>
                    </Link>
                  </div>
                </div>
              )}

              <div className="text-center mt-12">
                <Link href="/packages">
                  <Button size="lg" variant="outline" className="border-[#00052e] text-[#00052e] hover:bg-[#00052e] hover:text-white px-8 py-6 text-base rounded-full transition-all duration-300">
                    Lihat Semua Paket
                    <ArrowRight className="h-5 w-5 ml-2" />
                  </Button>
                </Link>
              </div>
            </>
          )}
        </div>
      </section>

      {/* Testimonials */}
      <section className="py-20 bg-gradient-to-br from-slate-50 to-blue-50/30">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            className="text-center mb-16"
            viewport={{ once: true }}
          >
            <Badge className="mb-4 bg-[#00052e]/10 text-[#00052e] px-4 py-2 rounded-full">
              Testimoni
            </Badge>
            <h2 className="text-3xl md:text-4xl lg:text-5xl font-bold text-[#00052e] mb-6">
              Kata Mereka Tentang Kami
            </h2>
          </motion.div>

          <div className="grid md:grid-cols-3 gap-8">
            {testimonials.map((testimonial, index) => (
              <motion.div
                key={testimonial.name}
                initial={{ opacity: 0, y: 30 }}
                whileInView={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6, delay: index * 0.1 }}
                viewport={{ once: true }}
              >
                <Card className="p-6 border-0 shadow-lg rounded-2xl h-full">
                  <div className="flex items-center mb-4">
                    <Image
                      src={testimonial.image}
                      alt={testimonial.name}
                      width={56}
                      height={56}
                      className="rounded-full mr-4"
                    />
                    <div>
                      <h4 className="font-bold text-[#00052e]">{testimonial.name}</h4>
                      <p className="text-sm text-slate-600">{testimonial.type}</p>
                    </div>
                  </div>
                  <div className="flex mb-4">
                    {[...Array(testimonial.rating)].map((_, i) => (
                      <Star key={i} className="h-4 w-4 text-yellow-400 fill-current" />
                    ))}
                  </div>
                  <p className="text-slate-600 italic">"{testimonial.text}"</p>
                </Card>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20 bg-gradient-to-r from-[#00052e] to-[#b0834d]">
        <div className="max-w-4xl mx-auto text-center px-4 sm:px-6 lg:px-8">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            viewport={{ once: true }}
          >
            <Sparkles className="h-16 w-16 text-white mx-auto mb-6" />
            <h2 className="text-3xl md:text-4xl lg:text-5xl font-bold text-white mb-6">
              Siap Untuk Sesi Foto Anda?
            </h2>
            <p className="text-lg md:text-xl text-white/90 mb-8 max-w-2xl mx-auto">
              Hubungi kami sekarang untuk konsultasi gratis dan temukan paket yang sempurna untuk kebutuhan Anda
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Link href="tel:+6281234567890">
                <Button size="lg" className="bg-white text-[#00052e] hover:bg-white/90 px-8 py-6 text-base rounded-full transition-all duration-300 shadow-lg hover:shadow-xl">
                  <Phone className="h-5 w-5 mr-2" />
                  Hubungi Sekarang
                </Button>
              </Link>
              <Link href="/packages">
                <Button size="lg" variant="outline" className="border-[#b0834d] text-[#b0834d] hover:bg-[#b0834d] hover:text-white px-8 py-6 text-base rounded-full transition-all duration-300">
                  <Calendar className="h-5 w-5 mr-2" />
                  Booking Online
                </Button>
              </Link>
            </div>
          </motion.div>
        </div>
      </section>

      {/* Contact Section */}
      <section id="contact" className="py-12 sm:py-16 lg:py-20 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            className="text-center mb-8 sm:mb-12 lg:mb-16"
            viewport={{ once: true }}
          >
            <Badge className="mb-3 sm:mb-4 bg-[#b0834d]/10 text-[#b0834d] px-3 sm:px-4 py-1 sm:py-2 rounded-full text-xs sm:text-sm">
              Kontak
            </Badge>
            <h2 className="text-2xl sm:text-3xl md:text-4xl lg:text-5xl font-bold text-[#00052e] mb-4 sm:mb-6">
              Hubungi Kami
            </h2>
            <p className="text-sm sm:text-base md:text-lg lg:text-xl text-slate-600 max-w-2xl mx-auto">
              Punya pertanyaan? Tim kami siap membantu Anda kapan saja
            </p>
          </motion.div>

          <div className="grid md:grid-cols-2 gap-8 sm:gap-10 lg:gap-12 items-start md:items-center">
            <motion.div
              initial={{ opacity: 0, x: -30 }}
              whileInView={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.6 }}
              viewport={{ once: true }}
            >
              <div className="space-y-6 sm:space-y-8">
                <div className="flex items-start">
                  <div className="w-10 h-10 sm:w-12 sm:h-12 bg-[#00052e] rounded-full flex items-center justify-center flex-shrink-0">
                    <MapPin className="h-5 w-5 sm:h-6 sm:w-6 text-white" />
                  </div>
                  <div className="ml-3 sm:ml-4">
                    <h3 className="text-lg sm:text-xl font-bold text-[#00052e] mb-1">Alamat</h3>
                    <p className="text-slate-600 text-sm sm:text-base">
                      {firstStudio?.address || 'Jl. Fotografi No. 123, Karawang, Jawa Barat 41311'}
                    </p>
                  </div>
                </div>

                <div className="flex items-start">
                  <div className="w-10 h-10 sm:w-12 sm:h-12 bg-[#b0834d] rounded-full flex items-center justify-center flex-shrink-0">
                    <Phone className="h-5 w-5 sm:h-6 sm:w-6 text-white" />
                  </div>
                  <div className="ml-3 sm:ml-4">
                    <h3 className="text-lg sm:text-xl font-bold text-[#00052e] mb-1">Telepon</h3>
                    <p className="text-slate-600 text-sm sm:text-base">
                      {firstStudio?.phone || '+62 812-3456-7890'}
                    </p>
                  </div>
                </div>

                <div className="flex items-start">
                  <div className="w-10 h-10 sm:w-12 sm:h-12 bg-[#00052e] rounded-full flex items-center justify-center flex-shrink-0">
                    <Mail className="h-5 w-5 sm:h-6 sm:w-6 text-white" />
                  </div>
                  <div className="ml-3 sm:ml-4">
                    <h3 className="text-lg sm:text-xl font-bold text-[#00052e] mb-1">Email</h3>
                    <p className="text-slate-600 text-sm sm:text-base">
                      {firstStudio?.email || 'info@kalarasastudio.com'}
                    </p>
                  </div>
                </div>
              </div>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, x: 30 }}
              whileInView={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.6 }}
              viewport={{ once: true }}
            >
              <Card className="p-4 sm:p-6 lg:p-8 border-0 shadow-lg rounded-xl sm:rounded-2xl">
                <h3 className="text-lg sm:text-xl lg:text-2xl font-bold text-[#00052e] mb-4 sm:mb-6 text-center">
                  Kirim Pesan
                </h3>
                <form className="space-y-4 sm:space-y-6">
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
                    <div>
                      <label htmlFor="name" className="block text-xs sm:text-sm font-medium text-slate-700 mb-1">
                        Nama Lengkap
                      </label>
                      <input
                        type="text"
                        id="name"
                        className="w-full px-3 sm:px-4 py-2 sm:py-3 border border-slate-300 rounded-lg focus:ring-2 focus:ring-[#00052e] focus:border-transparent text-sm sm:text-base"
                        placeholder="Nama Anda"
                      />
                    </div>
                    <div>
                      <label htmlFor="email" className="block text-xs sm:text-sm font-medium text-slate-700 mb-1">
                        Email
                      </label>
                      <input
                        type="email"
                        id="email"
                        className="w-full px-3 sm:px-4 py-2 sm:py-3 border border-slate-300 rounded-lg focus:ring-2 focus:ring-[#00052e] focus:border-transparent text-sm sm:text-base"
                        placeholder="email@contoh.com"
                      />
                    </div>
                  </div>
                  <div>
                    <label htmlFor="subject" className="block text-xs sm:text-sm font-medium text-slate-700 mb-1">
                      Subjek
                    </label>
                    <input
                      type="text"
                      id="subject"
                      className="w-full px-3 sm:px-4 py-2 sm:py-3 border border-slate-300 rounded-lg focus:ring-2 focus:ring-[#00052e] focus:border-transparent text-sm sm:text-base"
                      placeholder="Subjek pesan"
                    />
                  </div>
                  <div>
                    <label htmlFor="message" className="block text-xs sm:text-sm font-medium text-slate-700 mb-1">
                      Pesan
                    </label>
                    <textarea
                      id="message"
                      rows={4}
                      className="w-full px-3 sm:px-4 py-2 sm:py-3 border border-slate-300 rounded-lg focus:ring-2 focus:ring-[#00052e] focus:border-transparent text-sm sm:text-base"
                      placeholder="Tulis pesan Anda di sini..."
                    ></textarea>
                  </div>
                  <Button
                    type="submit"
                    className="w-full bg-[#00052e] hover:bg-[#00052e]/90 text-white py-3 sm:py-4 lg:py-6 text-sm sm:text-base rounded-lg transition-all duration-300 shadow-md hover:shadow-lg"
                    onClick={(e) => {
                      e.preventDefault();
                      // Simple form submission handling
                      alert('Terima kasih! Pesan Anda telah dikirim. Kami akan segera menghubungi Anda.');
                      // In a real application, you would send the form data to your backend here
                    }}
                  >
                    Kirim Pesan
                  </Button>
                </form>
              </Card>
            </motion.div>
          </div>
        </div>
      </section>

      {/* Footer */}
      <Footer />

      {/* Bottom Navigation for Mobile */}
      <BottomNav />
    </div>
  )
}
