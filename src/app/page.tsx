'use client'

import { useState, useEffect, useMemo, useCallback } from 'react'
import { motion } from 'framer-motion'
import Image from 'next/image'
import Link from 'next/link'
import { Camera, Star, Phone, CheckCircle, Award, Sparkles, Calendar, Image as ImageIcon, Lightbulb, Ruler, Sofa, Square, Package as PackageIcon, FileText, Eye, Palette, TreePine } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Card } from '@/components/ui/card'
import { BottomNav } from '@/components/navigation/bottom-nav'
import { Navbar } from '@/components/navbar'
import WhatsAppFloatButton from '@/components/whatsapp-float-button'

import { usePublicStudios } from '@/hooks/use-studios'
import { Footer } from '@/components/footer'
import { useActiveHeroImages } from '@/hooks/use-hero-images'

export default function Home() {
  const [currentSlide, setCurrentSlide] = useState(0)
  const [imagesLoaded, setImagesLoaded] = useState<boolean[]>([])
  const [allImagesLoaded, setAllImagesLoaded] = useState(false)
  const [isPreloading, setIsPreloading] = useState(true)
  const [lastLoadedImages, setLastLoadedImages] = useState<string[]>([])


  // Fetch data from database
  const { data: studiosData = [] } = usePublicStudios()


  // Dynamic hero images from database
  const { data: heroImagesData = [], isLoading: heroImagesLoading } = useActiveHeroImages()
  
  // Memoize hero images to prevent infinite re-renders
  const heroImages = useMemo(() => {
    return heroImagesData.length > 0 
      ? heroImagesData.map(img => img.image_url)
      : [
          'https://qmrilcawunfvjsmckyoj.supabase.co/storage/v1/object/public/homepage-images/KA.RA-11.jpg',
          'https://qmrilcawunfvjsmckyoj.supabase.co/storage/v1/object/public/homepage-images/KA.RA-2.jpg'
        ]
  }, [heroImagesData])

  // Preload all hero images for smooth experience with progressive loading
  const preloadImages = useCallback(async () => {
    if (heroImages.length === 0) return
    
    // Check if these are the same images we already loaded
    const imagesString = heroImages.join(',')
    if (lastLoadedImages.join(',') === imagesString && allImagesLoaded) {
      return // Don't reload the same images
    }

    // Reset state only when needed
    setImagesLoaded(new Array(heroImages.length).fill(false))
    setIsPreloading(true)
    setAllImagesLoaded(false)
    setLastLoadedImages(heroImages)

    // Load first image immediately for faster initial display
    const firstImagePromise = new Promise<void>((resolve) => {
      const img = new window.Image()
      img.onload = () => {
        setImagesLoaded(prev => {
          const newLoaded = [...prev]
          newLoaded[0] = true
          return newLoaded
        })
        // Show first image quickly
        setTimeout(() => {
          setAllImagesLoaded(true)
          setIsPreloading(false)
        }, 150)
        resolve()
      }
      img.onerror = () => {
        setImagesLoaded(prev => {
          const newLoaded = [...prev]
          newLoaded[0] = true
          return newLoaded
        })
        setAllImagesLoaded(true)
        setIsPreloading(false)
        resolve()
      }
      img.src = heroImages[0]
    })

    await firstImagePromise

    // Then load remaining images in background
    if (heroImages.length > 1) {
      const remainingPromises = heroImages.slice(1).map((src, index) => {
        return new Promise<void>((resolve) => {
          const img = new window.Image()
          img.onload = () => {
            setImagesLoaded(prev => {
              const newLoaded = [...prev]
              newLoaded[index + 1] = true
              return newLoaded
            })
            resolve()
          }
          img.onerror = () => {
            setImagesLoaded(prev => {
              const newLoaded = [...prev]
              newLoaded[index + 1] = true
              return newLoaded
            })
            resolve()
          }
          img.src = src
        })
      })

      Promise.all(remainingPromises)
    }
  }, [heroImages, lastLoadedImages, allImagesLoaded])

  useEffect(() => {
    preloadImages()
  }, [preloadImages])

  // Get first studio for contact info
  const firstStudio = studiosData.length > 0 ? studiosData[0] : null







  // Facilities section data
  const facilities = [
    {
      title: "Background Limbo Putih",
      description: "Lebar total 6 meter, curving tanpa sambungan, mampu menampung foto grup hingga lebih dari 20 orang.",
      icon: Ruler,
      image: "https://images.unsplash.com/photo-1537308133365-19a3b1d9a1a5?w=400&h=300&fit=crop&crop=center"
    },
    {
      title: "Background Polos & Berwarna",
      description: "Berbagai pilihan warna untuk kebutuhan fotografi yang berbeda.",
      icon: Palette,
      image: "https://media.istockphoto.com/id/2185177891/id/foto/interior-skandinavia-modern-yang-terinspirasi-boho-dengan-furnitur-anyaman-dan-tanaman-hijau.webp?a=1&b=1&s=612x612&w=0&k=20&c=mMulhj0z07xoAa_PRYCBMJZliDeJpxDmQJw3xTNvXXE="
    },
    {
      title: "Background Motif Molding Decorative Wall",
      description: "Dekorasi dinding dengan motif unik untuk efek artistik.",
      icon: Square,
      image: "https://images.unsplash.com/photo-1560448204-e02f11c3d0e2?w=400&h=300&fit=crop&crop=center"
    },
    {
      title: "Background Kaca Putih dengan Frame Kotak-kotak",
      description: "Efek reflektif yang menarik untuk konsep modern.",
      icon: Eye,
      image: "https://images.unsplash.com/photo-1505842381624-c58c36e74f1c?w=400&h=300&fit=crop&crop=center"
    },
    {
      title: "Properti Tambahan",
      description: "Furnitur, tanaman hias, dan elemen dekoratif lainnya untuk memperkaya konsep visual.",
      icon: PackageIcon,
      image: "https://images.unsplash.com/photo-1519741497674-611481863552?w=400&h=300&fit=crop&crop=center"
    },
    {
      title: "Studio Homey",
      description: "Beragam furnitur (kursi, sofa, meja), tanaman hias, serta elemen dekoratif lainnya.",
      icon: Sofa,
      image: "https://images.unsplash.com/photo-1524758631624-e684b2bdb378?w=400&h=300&fit=crop&crop=center"
    }
  ]

  // Photography services
  const photographyServices = [
    "Portrait Photography (personal maupun profesional)",
    "Family & Couples Photography",
    "Corporate & Company Profile Photography",
    "Product & Advertising Photography",
    "Newborn Photography",
    "Maternity Photography"
  ]

  // Terms and conditions
  const termsConditions = [
    "Booking: DP 50% saat reservasi.",
    "Pelunasan: Maksimal H-3 sebelum acara.",
    "Pembatalan: DP hangus.",
    "Reschedule: Maksimal dilakukan H-3 sebelum acara.",
    "Overtime Rp. 250.000 per Jam",
    "Properti: Bila ada kerusakan, wajib mengganti sesuai nilai properti.",
    "Kerapihan: Semua properti yang digunakan wajib dikembalikan & dirapikan ke gudang setelah pemakaian.",
    "Kedatangan 1 jam Sebelum pemotretan",
    "Harap menjaga kebersihan seluruh ruangan"
  ]

  // Background specifications
  const backgroundSpecs = [
    "White Limbo Wall: Lebar 6m × Tinggi 3m (curving tanpa sambungan)",
    "Grey Beton (Semen) Exposs: Lebar 5m × Tinggi 3m",
    "Window Light Frame Putih: Lebar 4m × Tinggi 3m",
    "Window Light Frame Hitam: Lebar 3m × Tinggi 3m",
    "White Decorative Molding Wall: Lebar 4m × Tinggi 3m",
    "Beige Cream Decorative Circle Wall: Lebar 4m × Tinggi 3m",
    "Black Decorative Motif Wall: Lebar 3m × Tinggi 3m",
    "Portable Paper Background: Berbagai pilihan warna"
  ]

  // Floor specifications
  const floorSpecs = [
    "White Clear Epoxy: 6m × 6m → 36 m²",
    "Grey Beton Exposs: 5m × 5m → 25 m²",
    "Vinyl Natural Wood: 4m × 4m → 16 m²",
    "Grey Rooftop Outdoor: 3,5m × 4m → 14 m²",
    "Portable Carpet Roll: 2m × 4m berbagai motif (fleksibel dipasang & dipindah)"
  ]

  // Studio properties
  const studioProperties = [
    "Furnitur (kursi, sofa, meja)",
    "Tanaman hias",
    "Elemen dekoratif lainnya",
    "Aksesori pendukung konsep visual",
    "Properti studio lengkap"
  ]

  // Start carousel only after images are loaded
  useEffect(() => {
    if (!allImagesLoaded || heroImages.length <= 1) return

    const timer = setInterval(() => {
      setCurrentSlide((prev) => (prev + 1) % heroImages.length)
    }, 5000)
    return () => clearInterval(timer)
  }, [allImagesLoaded, heroImages.length])

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50/30 to-slate-100">
      <Navbar currentPath="/" />

      {/* Hero Section */}
      <section className="relative pt-26 pb-16 md:pb-24 overflow-hidden"> {/* Adjusted top padding for larger banner */}
        <div className="absolute inset-0 bg-gradient-to-r from-[#00052e]/5 to-[#b0834d]/5"></div>

        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 grid lg:grid-cols-2 gap-12 items-center">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8 }}
            className="text-center lg:text-left z-20 relative"
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
              {firstStudio?.description || 'Studio foto profesional di Karawang dengan teknologi terdepan dan tim berpengalaman. Wujudkan setiap momen spesial menjadi karya seni yang tak terlampilkan.'}
            </p>

            <div className="flex flex-col sm:flex-row gap-4 mb-8 justify-center lg:justify-start">
              <Link href="/packages" className="z-30 relative">
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
                {isPreloading || heroImagesLoading ? (
                  // Enhanced skeleton loading with smooth shimmer
                  <div className="w-full h-full skeleton-shimmer relative overflow-hidden">
                    {/* Multiple shimmer layers for depth */}
                    <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/50 to-transparent animate-shimmer" />
                    <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/30 to-transparent animate-shimmer" style={{ animationDelay: '0.5s' }} />
                    
                    {/* Content overlay */}
                    <div className="absolute inset-0 flex items-center justify-center bg-white/10 backdrop-blur-sm">
                      <div className="text-center">
                        {/* Elegant loading spinner */}
                        <div className="relative w-16 h-16 mx-auto mb-4">
                          <div className="absolute inset-0 border-4 border-gray-200 rounded-full"></div>
                          <div className="absolute inset-0 border-4 border-[#b0834d] border-t-transparent rounded-full animate-spin"></div>
                          <div className="absolute inset-2 border-2 border-gray-100 border-t-transparent rounded-full animate-spin" style={{ animationDirection: 'reverse', animationDuration: '1.5s' }}></div>
                        </div>
                        
                        {/* Loading text with glow effect */}
                        <div className="text-gray-600 text-sm font-medium mb-3 animate-pulse-glow">
                          Loading Beautiful Images...
                        </div>
                        
                        {/* Enhanced progress bar */}
                        {imagesLoaded.length > 0 && (
                          <div className="w-40 h-2 bg-gray-200 rounded-full mx-auto overflow-hidden shadow-inner">
                            <div 
                              className="h-full bg-gradient-to-r from-[#b0834d] to-[#d4a574] rounded-full transition-all duration-500 ease-out relative overflow-hidden"
                              style={{ 
                                width: `${(imagesLoaded.filter(Boolean).length / heroImages.length) * 100}%` 
                              }}
                            >
                              {/* Progress bar shimmer */}
                              <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/30 to-transparent animate-shimmer"></div>
                            </div>
                          </div>
                        )}
                      </div>
                    </div>
                    
                    {/* Additional floating elements for visual interest */}
                    <div className="absolute top-1/4 left-1/4 w-2 h-2 bg-white/20 rounded-full animate-pulse-glow" style={{ animationDelay: '0.5s' }}></div>
                    <div className="absolute top-3/4 right-1/3 w-3 h-3 bg-white/15 rounded-full animate-pulse-glow" style={{ animationDelay: '1s' }}></div>
                    <div className="absolute bottom-1/4 left-1/2 w-1 h-1 bg-white/25 rounded-full animate-pulse-glow" style={{ animationDelay: '1.5s' }}></div>
                  </div>
                ) : (
                  <>
                    {/* Current image with smooth fade transition */}
                    <motion.div 
                      className="relative w-full h-full"
                      initial={{ opacity: 0, scale: 1.05 }}
                      animate={{ opacity: 1, scale: 1 }}
                      transition={{ duration: 0.8, ease: "easeOut" }}
                    >
                      <Image
                        src={heroImages[currentSlide]}
                        alt={heroImagesData[currentSlide]?.alt_text || "Studio Photography"}
                        fill
                        className={`object-cover hero-image-fade transition-all duration-700 ease-out ${
                          allImagesLoaded ? 'loaded opacity-100' : 'loading opacity-0'
                        }`}
                        priority
                        sizes="(max-width: 768px) 100vw, 50vw"
                        quality={90}
                        onLoad={() => {
                          // Ensure smooth fade-in even for cached images
                          setAllImagesLoaded(true)
                        }}
                      />
                      <div className="absolute inset-0 bg-gradient-to-t from-black/40 to-transparent"></div>
                    </motion.div>
                    
                    {/* Preload next image for seamless transition */}
                    {heroImages.length > 1 && allImagesLoaded && (
                      <div className="absolute inset-0 opacity-0 pointer-events-none">
                        <Image
                          src={heroImages[(currentSlide + 1) % heroImages.length]}
                          alt="Preload next"
                          fill
                          className="object-cover"
                          sizes="(max-width: 768px) 100vw, 50vw"
                          quality={75}
                        />
                      </div>
                    )}
                  </>
                )}
              </div>

              {/* Dots indicator - only show when not loading */}
              {!isPreloading && !heroImagesLoading && heroImages.length > 1 && (
                <div className="absolute bottom-6 left-1/2 transform -translate-x-1/2 flex space-x-2">
                  {heroImages.map((_, index) => (
                    <button
                      key={index}
                      className={`w-3 h-3 rounded-full transition-all duration-300 ${
                        index === currentSlide 
                          ? 'bg-white scale-110 shadow-lg' 
                          : 'bg-white/50 hover:bg-white/70 hover:scale-105'
                      }`}
                      onClick={() => setCurrentSlide(index)}
                      aria-label={`Lihat slide ${index + 1}`}
                    />
                  ))}
                </div>
              )}
            </div>
          </motion.div>
        </div>
      </section>



      {/* Studio Facilities Section - Similar to Photography Services with Visual Elements */}
      <section id="facilities" className="py-20 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            className="text-center mb-16"
            viewport={{ once: true }}
          >
            <Badge className="mb-4 bg-[#b0834d]/10 text-[#b0834d] px-4 py-2 rounded-full">
              <PackageIcon className="h-4 w-4 mr-1 inline" />
              Fasilitas Studio
            </Badge>
            <h2 className="text-3xl md:text-4xl lg:text-5xl font-bold text-[#00052e] mb-6">
              Berbagai Pilihan Area dan Fasilitas
            </h2>
            <p className="text-lg md:text-xl text-slate-600 max-w-2xl mx-auto">
              Studio kami dilengkapi dengan berbagai pilihan area dan fasilitas yang dapat disesuaikan dengan kebutuhan Anda
            </p>
          </motion.div>

          <div className="flex flex-col md:flex-row gap-12 items-center">
            {/* Visual Elements Section */}
            <div className="md:w-1/2">
              <motion.div
                initial={{ opacity: 0, x: -30, rotateY: -15 }}
                whileInView={{ opacity: 1, x: 0, rotateY: 0 }}
                transition={{ duration: 0.8 }}
                viewport={{ once: true }}
                className="relative"
              >
                <div className="relative rounded-2xl overflow-hidden shadow-2xl bg-gradient-to-br from-[#00052e] to-[#b0834d] p-1">
                  <div className="bg-white rounded-2xl p-8">
                    <div className="grid grid-cols-2 gap-6">
                      {facilities.map((facility, index) => {
                        const Icon = facility.icon;
                        // Define gradient based on the facility index for visual variety
                        const gradients = [
                          'bg-gradient-to-br from-[#00052e] to-[#b0834d]',
                          'bg-gradient-to-br from-[#b0834d] to-[#00052e]',
                          'bg-gradient-to-br from-amber-500 to-orange-500',
                          'bg-gradient-to-br from-emerald-500 to-teal-500',
                          'bg-gradient-to-br from-rose-500 to-pink-500',
                          'bg-gradient-to-br from-indigo-500 to-purple-500'
                        ];
                        const gradient = gradients[index % gradients.length];

                        return (
                          <div
                            key={index}
                            className={`p-4 rounded-xl ${gradient} text-white flex flex-col items-center justify-center text-center group hover:scale-105 transition-transform duration-300`}
                          >
                            <div className="w-12 h-12 rounded-full bg-white/20 backdrop-blur-sm flex items-center justify-center mb-2 group-hover:scale-110 transition-transform duration-300">
                              <Icon className="h-6 w-6" />
                            </div>
                            <h4 className="font-medium text-sm">{facility.title}</h4>
                          </div>
                        )
                      })}
                    </div>
                  </div>
                </div>

                {/* Decorative elements */}
                <div className="absolute -top-6 -left-6 w-24 h-24 border-4 border-[#b0834d] rounded-2xl opacity-30 rotate-12"></div>
                <div className="absolute -bottom-6 -right-6 w-16 h-16 border-4 border-[#00052e] rounded-2xl opacity-30 -rotate-12"></div>
              </motion.div>
            </div>

            {/* Facilities List */}
            <div className="md:w-1/2">
              <div className="space-y-4">
                {facilities.map((facility, index) => {
                  const Icon = facility.icon;
                  return (
                    <motion.div
                      key={index}
                      initial={{ opacity: 0, x: 30 }}
                      whileInView={{ opacity: 1, x: 0 }}
                      transition={{ duration: 0.5, delay: index * 0.1 }}
                      viewport={{ once: true }}
                      className="cursor-pointer"
                    >
                      <Card className="p-5 border-0 shadow-lg hover:shadow-2xl transition-all duration-300 rounded-2xl bg-gradient-to-r from-white to-slate-50 hover:from-[#b0834d]/5 group">
                        <div className="flex items-start">
                          <div className="w-12 h-12 flex-shrink-0 bg-gradient-to-br from-[#00052e] to-[#b0834d] rounded-xl flex items-center justify-center mr-4 group-hover:scale-110 transition-transform duration-300">
                            <Icon className="h-6 w-6 text-white" />
                          </div>
                          <div className="flex-grow">
                            <h3 className="font-bold text-[#00052e] mb-1">{facility.title}</h3>
                            <p className="text-slate-600 text-sm">{facility.description}</p>
                          </div>
                          <div className="w-3 h-3 rounded-full bg-[#b0834d] self-center animate-pulse"></div>
                        </div>
                      </Card>
                    </motion.div>
                  )
                })}
              </div>
            </div>
          </div>

          {/* Visual separator */}
          <div className="mt-16 flex items-center justify-center">
            <div className="h-px bg-gradient-to-r from-transparent via-[#00052e] to-transparent w-full max-w-md"></div>
          </div>
        </div>
      </section>

      {/* Lighting Section - Text Only Design */}
      <section id="lighting" className="py-20 bg-gradient-to-br from-slate-50 to-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            className="text-center mb-16"
            viewport={{ once: true }}
          >
            <Badge className="mb-4 bg-gradient-to-r from-amber-100 to-orange-100 text-amber-800 px-6 py-2 rounded-full text-sm font-medium">
              <Lightbulb className="h-4 w-4 mr-2 inline" />
              Pencahayaan Premium
            </Badge>
            <h2 className="text-3xl md:text-4xl lg:text-5xl font-bold text-[#00052e] mb-6">
              Solusi Pencahayaan <span className="bg-gradient-to-r from-amber-500 to-orange-500 bg-clip-text text-transparent">Professional</span>
            </h2>
            <p className="text-lg md:text-xl text-slate-600 max-w-3xl mx-auto leading-relaxed">
              Kombinasi sempurna antara cahaya alami dan pencahayaan studio profesional untuk menghasilkan foto berkualitas tinggi dengan mood yang tepat
            </p>
          </motion.div>


          {/* Additional Benefits Section */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.4 }}
            viewport={{ once: true }}
            className="mt-16 text-center"
          >
            <div className="grid md:grid-cols-2 gap-4 max-w-4xl mx-auto">
              <div className="space-y-3">
                <div className="w-12 h-12 bg-gradient-to-br from-green-400 to-emerald-500 rounded-full flex items-center justify-center mx-auto">
                  <Star className="h-6 w-6 text-white" />
                </div>
                <h4 className="font-semibold text-[#00052e]">Natural Light</h4>
                <p className="text-sm text-slate-600">Didukung cahaya alami dari jendela besar & skylight atap</p>
              </div>

              <div className="space-y-3">
                <div className="w-12 h-12 bg-gradient-to-br from-rose-400 to-pink-500 rounded-full flex items-center justify-center mx-auto">
                  <Award className="h-6 w-6 text-white" />
                </div>
                <h4 className="font-semibold text-[#00052e]">Studio Lighting</h4>
                <p className="text-sm text-slate-600">Tersedia 1 set standar lighting dengan beberapa pilihan modifier, siap menunjang kebutuhan foto profesional</p>
              </div>
            </div>
          </motion.div>

          {/* Elegant Visual Separator */}
          <div className="mt-16 flex items-center justify-center">
            <div className="flex items-center space-x-4">
              <div className="h-px bg-gradient-to-r from-transparent to-amber-300 w-16"></div>
              <Sparkles className="h-6 w-6 text-amber-400" />
              <div className="h-px bg-gradient-to-r from-amber-300 via-orange-300 to-amber-300 w-32"></div>
              <Sparkles className="h-6 w-6 text-orange-400" />
              <div className="h-px bg-gradient-to-l from-transparent to-orange-300 w-16"></div>
            </div>
          </div>
        </div>
      </section>

      {/* Photography Services Section */}
      <section id="services" className="py-20 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            className="text-center mb-16"
            viewport={{ once: true }}
          >
            <Badge className="mb-4 bg-[#b0834d]/10 text-[#b0834d] px-4 py-2 rounded-full">
              <Camera className="h-4 w-4 mr-1 inline" />
              Layanan & Kebutuhan Fotografi
            </Badge>
            <h2 className="text-3xl md:text-4xl lg:text-5xl font-bold text-[#00052e] mb-6">
              Cocok untuk Berbagai Jenis Pemotretan
            </h2>
            <p className="text-lg md:text-xl text-slate-600 max-w-2xl mx-auto">
              Studio kami siap mendukung berbagai kebutuhan fotografi Anda
            </p>
          </motion.div>

          <div className="flex flex-col md:flex-row gap-12 items-center">
            {/* Image Section */}
            <div className="md:w-1/2">
              <motion.div
                initial={{ opacity: 0, x: -30, rotateY: -15 }}
                whileInView={{ opacity: 1, x: 0, rotateY: 0 }}
                transition={{ duration: 0.8 }}
                viewport={{ once: true }}
                className="relative"
              >
                <div className="relative rounded-2xl overflow-hidden shadow-2xl">
                  <Image
                    src="https://images.unsplash.com/photo-1516035069371-29a1b244cc32?w=600&h=600&fit=crop&crop=center"
                    alt="Photography Services"
                    width={600}
                    height={600}
                    className="w-full h-auto object-cover"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-[#00052e]/20 to-transparent"></div>
                </div>

                {/* Decorative elements */}
                <div className="absolute -top-6 -left-6 w-24 h-24 border-4 border-[#b0834d] rounded-2xl opacity-30 rotate-12"></div>
                <div className="absolute -bottom-6 -right-6 w-16 h-16 border-4 border-[#00052e] rounded-2xl opacity-30 -rotate-12"></div>
              </motion.div>
            </div>

            {/* Services List */}
            <div className="md:w-1/2">
              <div className="space-y-4">
                {photographyServices.map((service, index) => (
                  <motion.div
                    key={index}
                    initial={{ opacity: 0, x: 30 }}
                    whileInView={{ opacity: 1, x: 0 }}
                    transition={{ duration: 0.5, delay: index * 0.1 }}
                    viewport={{ once: true }}
                    className="cursor-pointer"
                  >
                    <Card className="p-5 border-0 shadow-lg hover:shadow-2xl transition-all duration-300 rounded-2xl bg-gradient-to-r from-white to-slate-50 hover:from-[#b0834d]/5 group">
                      <div className="flex items-start">
                        <div className="w-10 h-10 flex-shrink-0 bg-gradient-to-br from-[#00052e] to-[#b0834d] rounded-full flex items-center justify-center mr-4 group-hover:scale-110 transition-transform duration-300">
                          <Camera className="h-5 w-5 text-white" />
                        </div>
                        <h3 className="font-medium text-[#00052e] pt-1.5 flex-grow">{service}</h3>
                        <div className="w-2 h-2 rounded-full bg-[#b0834d] self-center animate-pulse"></div>
                      </div>
                    </Card>
                  </motion.div>
                ))}
              </div>
            </div>
          </div>

          {/* Visual separator */}
          <div className="mt-16 flex items-center justify-center">
            <div className="h-px bg-gradient-to-r from-transparent via-[#00052e] to-transparent w-full max-w-md"></div>
          </div>
        </div>
      </section>

      {/* Specifications Section - Text-focused & Modern */}
      <section id="specifications" className="py-16 bg-gradient-to-br from-slate-50 to-blue-50/30">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            className="text-center mb-12"
            viewport={{ once: true }}
          >
            <Badge className="mb-3 bg-gradient-to-r from-amber-100 to-orange-100 text-amber-800 px-4 py-1.5 rounded-full text-sm font-medium">
              <Ruler className="h-3 w-3 mr-1.5 inline" />
              Spesifikasi
            </Badge>
            <h2 className="text-2xl md:text-3xl lg:text-4xl font-bold text-[#00052e] mb-4">
              Spesifikasi <span className="bg-gradient-to-r from-amber-500 to-orange-500 bg-clip-text text-transparent">Studio</span>
            </h2>
            <p className="text-base md:text-lg text-slate-600 max-w-2xl mx-auto">
              Detail background dan lantai studio
            </p>
          </motion.div>

          <div className="grid lg:grid-cols-2 gap-8">
            {/* Background Specifications */}
            <div className="bg-white p-6 rounded-2xl border border-slate-200/50 shadow-sm">
              <div className="flex items-center mb-6">
                <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-[#00052e] to-[#b0834d] flex items-center justify-center mr-3">
                  <Palette className="h-6 w-6 text-white" />
                </div>
                <h3 className="text-xl font-bold text-[#00052e]">Background</h3>
              </div>

              <div className="space-y-3">
                {backgroundSpecs.map((spec, index) => (
                  <motion.div
                    key={index}
                    initial={{ opacity: 0, x: -15 }}
                    whileInView={{ opacity: 1, x: 0 }}
                    transition={{ duration: 0.4, delay: index * 0.05 }}
                    viewport={{ once: true }}
                    className="cursor-pointer"
                  >
                    <Card className="p-3 border-0 hover:shadow-md transition-all duration-300 rounded-xl bg-gradient-to-r from-white to-slate-50 group">
                      <p className="text-slate-700 text-sm leading-relaxed pl-2 border-l-2 border-[#b0834d] group-hover:border-[#00052e] transition-colors duration-300">{spec}</p>
                    </Card>
                  </motion.div>
                ))}
              </div>
            </div>

            {/* Floor Specifications */}
            <div className="bg-white p-6 rounded-2xl border border-slate-200/50 shadow-sm">
              <div className="flex items-center mb-6">
                <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-[#b0834d] to-[#00052e] flex items-center justify-center mr-3">
                  <Square className="h-6 w-6 text-white" />
                </div>
                <h3 className="text-xl font-bold text-[#00052e]">Lantai</h3>
              </div>

              <div className="space-y-3">
                {floorSpecs.map((spec, index) => (
                  <motion.div
                    key={index}
                    initial={{ opacity: 0, x: 15 }}
                    whileInView={{ opacity: 1, x: 0 }}
                    transition={{ duration: 0.4, delay: index * 0.05 }}
                    viewport={{ once: true }}
                    className="cursor-pointer"
                  >
                    <Card className="p-3 border-0 hover:shadow-md transition-all duration-300 rounded-xl bg-gradient-to-r from-white to-slate-50 group">
                      <p className="text-slate-700 text-sm leading-relaxed pl-2 border-l-2 border-[#00052e] group-hover:border-[#b0834d] transition-colors duration-300">{spec}</p>
                    </Card>
                  </motion.div>
                ))}
              </div>
            </div>
          </div>

          {/* Compact Visual separator */}
          <div className="mt-12 flex items-center justify-center">
            <div className="h-px bg-gradient-to-r from-transparent via-[#00052e] to-transparent w-full max-w-sm"></div>
          </div>
        </div>
      </section>

      {/* Studio Properties Section */}
      <section id="properties" className="py-12 bg-gradient-to-br from-slate-50 to-blue-50/30">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            className="text-center mb-10"
            viewport={{ once: true }}
          >
            <Badge className="mb-3 bg-[#b0834d]/10 text-[#b0834d] px-4 py-1.5 rounded-full mx-auto">
              <Sofa className="h-4 w-4 mr-1 inline" />
              Properti Studio
            </Badge>
            <h2 className="text-2xl md:text-3xl lg:text-4xl font-bold text-[#00052e] mb-3">
              Properti Lengkap untuk Sesi Foto Anda
            </h2>
            <p className="text-base md:text-lg text-slate-600 max-w-xl mx-auto">
              Berbagai furnitur dan dekorasi untuk memperkaya konsep visual
            </p>
          </motion.div>

          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-4 mb-8">
            {studioProperties.map((property, index) => {
              // Define different icons based on property type
              let Icon;
              if (property.includes('Furnitur') || property.includes('sofa') || property.includes('kursi') || property.includes('meja')) {
                Icon = Sofa;
              } else if (property.includes('Tanaman')) {
                Icon = TreePine;
              } else if (property.includes('dekoratif')) {
                Icon = Palette;
              } else if (property.includes('Aksesori')) {
                Icon = ImageIcon;
              } else {
                Icon = PackageIcon;
              }

              return (
                <motion.div
                  key={index}
                  initial={{ opacity: 0, scale: 0.9 }}
                  whileInView={{ opacity: 1, scale: 1 }}
                  transition={{ duration: 0.4, delay: index * 0.1 }}
                  viewport={{ once: true }}
                  className="flex flex-col items-center text-center p-3 cursor-pointer group"
                >
                  <div className="w-14 h-14 rounded-xl bg-gradient-to-br from-[#00052e] to-[#b0834d] flex items-center justify-center mb-2 group-hover:scale-110 transition-transform duration-300">
                    <Icon className="h-6 w-6 text-white" />
                  </div>
                  <span className="text-xs md:text-sm font-medium text-[#00052e] text-center group-hover:text-[#b0834d] transition-colors duration-300">
                    {property}
                  </span>
                </motion.div>
              )
            })}
          </div>

          <div className="text-center">
            <p className="text-slate-500 text-sm md:text-base italic bg-slate-100/30 rounded-xl p-3 inline-block max-w-lg">
              Semua properti bebas dipindahkan sesuai kebutuhan, namun wajib dikembalikan dalam kondisi rapi.
            </p>
          </div>

          {/* Visual separator */}
          <div className="mt-6 flex items-center justify-center">
            <div className="h-px bg-gradient-to-r from-transparent via-[#00052e] to-transparent w-full max-w-md"></div>
          </div>
        </div>
      </section>

      {/* Terms and Conditions Section - Enhanced with Visual Elements */}
      <section id="terms" className="py-20 bg-gradient-to-br from-slate-50 to-blue-50/30">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            className="text-center mb-16"
            viewport={{ once: true }}
          >
            <Badge className="mb-4 bg-gradient-to-r from-amber-100 to-orange-100 text-amber-800 px-6 py-2 rounded-full text-sm font-medium">
              <FileText className="h-4 w-4 mr-2 inline" />
              Ketentuan & Kebijakan
            </Badge>
            <h2 className="text-3xl md:text-4xl lg:text-5xl font-bold text-[#00052e] mb-6">
              Panduan <span className="bg-gradient-to-r from-amber-500 to-orange-500 bg-clip-text text-transparent">Pemesanan</span> & Penggunaan Studio
            </h2>
            <p className="text-lg md:text-xl text-slate-600 max-w-3xl mx-auto leading-relaxed">
              Pahami ketentuan dan kebijakan kami untuk pengalaman pemesanan studio yang menyenangkan dan tanpa keraguan
            </p>
          </motion.div>

          <div className="flex flex-col md:flex-row gap-12 items-center">
            {/* Visual Elements Section */}
            <div className="md:w-1/2">
              <motion.div
                initial={{ opacity: 0, x: -30, rotateY: -15 }}
                whileInView={{ opacity: 1, x: 0, rotateY: 0 }}
                transition={{ duration: 0.8 }}
                viewport={{ once: true }}
                className="relative"
              >
                <div className="relative rounded-3xl overflow-hidden shadow-2xl bg-gradient-to-br from-[#00052e] to-[#b0834d] p-1">
                  <div className="bg-white rounded-3xl p-8">
                    <div className="text-center mb-6">
                      <div className="w-20 h-20 bg-gradient-to-br from-[#00052e] to-[#b0834d] rounded-full flex items-center justify-center mx-auto mb-4">
                        <FileText className="h-10 w-10 text-white" />
                      </div>
                      <h3 className="text-xl font-bold text-[#00052e]">Ketentuan Penting</h3>
                    </div>

                    <div className="space-y-4">
                      <div className="flex items-center p-3 bg-slate-50 rounded-lg">
                        <div className="w-8 h-8 bg-[#b0834d] rounded-full flex items-center justify-center mr-3 flex-shrink-0">
                          <span className="text-white text-xs font-bold">1</span>
                        </div>
                        <span className="text-slate-700 text-sm">Booking: DP 50% saat reservasi</span>
                      </div>
                      <div className="flex items-center p-3 bg-slate-50 rounded-lg">
                        <div className="w-8 h-8 bg-[#b0834d] rounded-full flex items-center justify-center mr-3 flex-shrink-0">
                          <span className="text-white text-xs font-bold">2</span>
                        </div>
                        <span className="text-slate-700 text-sm">Pelunasan: Maksimal H-3 sebelum acara</span>
                      </div>
                      <div className="flex items-center p-3 bg-slate-50 rounded-lg">
                        <div className="w-8 h-8 bg-[#b0834d] rounded-full flex items-center justify-center mr-3 flex-shrink-0">
                          <span className="text-white text-xs font-bold">3</span>
                        </div>
                        <span className="text-slate-700 text-sm">Pembatalan: DP hangus</span>
                      </div>
                      <div className="flex items-center p-3 bg-slate-50 rounded-lg">
                        <div className="w-8 h-8 bg-[#b0834d] rounded-full flex items-center justify-center mr-3 flex-shrink-0">
                          <span className="text-white text-xs font-bold">4</span>
                        </div>
                        <span className="text-slate-700 text-sm">Overtime: Rp. 250.000 per Jam</span>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Decorative elements */}
                <div className="absolute -top-6 -left-6 w-24 h-24 border-4 border-[#b0834d] rounded-2xl opacity-30 rotate-12"></div>
                <div className="absolute -bottom-6 -right-6 w-16 h-16 border-4 border-[#00052e] rounded-2xl opacity-30 -rotate-12"></div>
              </motion.div>
            </div>

            {/* Terms List */}
            <div className="md:w-1/2">
              <div className="space-y-4">
                {termsConditions.map((term, index) => {
                  // Define different icons based on the type of term
                  let icon;
                  if (term.includes('DP') || term.includes('Booking') || term.includes('Pelunasan')) {
                    icon = '💰'; // Money related
                  } else if (term.includes('Pembatalan') || term.includes('Reschedule')) {
                    icon = '🔄'; // Changes related
                  } else if (term.includes('kerusakan') || term.includes('mengganti')) {
                    icon = '🔧'; // Repairs/replacements
                  } else if (term.includes('kebersihan') || term.includes('kerapihan')) {
                    icon = '🧹'; // Cleanliness related
                  } else if (term.includes('Kedatangan')) {
                    icon = '⏰'; // Time related
                  } else {
                    icon = '📋'; // General terms
                  }

                  return (
                    <motion.div
                      key={index}
                      initial={{ opacity: 0, x: 30 }}
                      whileInView={{ opacity: 1, x: 0 }}
                      transition={{ duration: 0.5, delay: index * 0.1 }}
                      viewport={{ once: true }}
                      className="cursor-pointer"
                    >
                      <Card className="p-5 shadow-lg hover:shadow-2xl transition-all duration-300 rounded-2xl bg-white border border-slate-200/50 hover:border-[#b0834d]/30 h-full">
                        <div className="flex items-start">
                          <div className="w-12 h-12 flex-shrink-0 bg-gradient-to-br from-amber-400 to-orange-500 rounded-xl flex items-center justify-center mr-4 group-hover:scale-110 transition-transform duration-300">
                            <span className="text-white font-bold text-lg">{icon}</span>
                          </div>
                          <div className="flex-grow">
                            <p className="text-slate-700 font-medium">{term}</p>
                          </div>
                          <div className="w-3 h-3 rounded-full bg-gradient-to-r from-amber-400 to-orange-500 self-center animate-pulse"></div>
                        </div>
                      </Card>
                    </motion.div>
                  )
                })}
              </div>
            </div>
          </div>

          {/* Elegant Visual separator */}
          <div className="mt-16 flex items-center justify-center">
            <div className="flex items-center space-x-4">
              <div className="h-px bg-gradient-to-r from-transparent to-[#00052e] w-16"></div>
              <div className="w-3 h-3 bg-[#b0834d] rotate-45 transform"></div>
              <div className="h-px bg-gradient-to-l from-transparent to-[#00052e] w-16"></div>
            </div>
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

      {/* WhatsApp Floating Action Button */}
      <WhatsAppFloatButton studioId={studiosData.length > 0 ? studiosData[0].id : undefined} />

      {/* Footer */}
      <Footer />

      {/* Bottom Navigation for Mobile */}
      <BottomNav />
    </div>
  )
}