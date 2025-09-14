'use client'

import Image from 'next/image'
import Link from 'next/link'
import { MapPin, Phone, Mail, Instagram, Facebook, Twitter } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { usePublicStudios } from '@/hooks/use-studios'
import { usePublicPackageCategories } from '@/hooks/use-customer-packages'

export function Footer() {
  const { data: studiosData = [] } = usePublicStudios()
  const { data: packageCategoriesData = [] } = usePublicPackageCategories()
  
  // Get first studio for contact info
  const firstStudio = studiosData.length > 0 ? studiosData[0] : null

  return (
    <footer className="bg-[#00052e] text-white py-16">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8 mb-12">
          <div>
            <div className="flex items-center space-x-3 mb-6">
              <Image
                src="/icons/logo_white.svg"
                alt="Kalarasa Studio"
                width={40}
                height={40}
              />
              <span className="text-xl font-bold">Kalarasa Studio</span>
            </div>
            <p className="text-white/80 mb-6">
              {firstStudio?.description || 'Studio foto profesional di Karawang yang mengabadikan setiap momen spesial dengan kualitas terbaik.'}
            </p>
            <div className="flex space-x-4">
              <Button size="sm" variant="outline" className="border-pink-500 text-pink-500 hover:bg-white/10 hover:border-white/20 hover:text-white rounded-full transition-all duration-300">
                <Instagram className="h-4 w-4" />
              </Button>
              <Button size="sm" variant="outline" className="border-blue-600 text-blue-600 hover:bg-white/10 hover:border-white/20 hover:text-white rounded-full transition-all duration-300">
                <Facebook className="h-4 w-4" />
              </Button>
              <Button size="sm" variant="outline" className="border-sky-500 text-sky-500 hover:bg-white/10 hover:border-white/20 hover:text-white rounded-full transition-all duration-300">
                <Twitter className="h-4 w-4" />
              </Button>
            </div>
          </div>

          <div>
            <h3 className="text-lg font-bold mb-6">Layanan</h3>
            <div className="space-y-3 text-white/80">
              {packageCategoriesData.map((category) => (
                <Link
                  key={category.id}
                  href={`/packages?category=${encodeURIComponent(category.name.toLowerCase())}`}
                  className="block hover:text-white transition-colors"
                >
                  {category.name}
                </Link>
              ))}
              {packageCategoriesData.length === 0 && (
                <>
                  <Link href="/packages" className="block hover:text-white transition-colors">Wedding Photography</Link>
                  <Link href="/packages" className="block hover:text-white transition-colors">Portrait Session</Link>
                  <Link href="/packages" className="block hover:text-white transition-colors">Family Photo</Link>
                  <Link href="/packages" className="block hover:text-white transition-colors">Corporate Event</Link>
                  <Link href="/packages" className="block hover:text-white transition-colors">Product Photography</Link>
                </>
              )}
            </div>
          </div>

          <div>
            <h3 className="text-lg font-bold mb-6">Informasi</h3>
            <div className="space-y-3 text-white/80">
              <Link href="/portfolio" className="block hover:text-white transition-colors">Portfolio</Link>
              <Link href="/packages" className="block hover:text-white transition-colors">Paket Harga</Link>
              <Link href="/faq" className="block hover:text-white transition-colors">FAQ</Link>
              <Link href="/terms" className="block hover:text-white transition-colors">Syarat & Ketentuan</Link>
              <Link href="/privacy" className="block hover:text-white transition-colors">Kebijakan Privasi</Link>
            </div>
          </div>

          <div>
            <h3 className="text-lg font-bold mb-6">Kontak</h3>
            <div className="space-y-4 text-white/80">
              <div className="flex items-start">
                <MapPin className="h-5 w-5 mr-3 flex-shrink-0 mt-0.5" />
                <span>{firstStudio?.address || 'Jl. Fotografi No. 123, Karawang, Jawa Barat 41311'}</span>
              </div>
              <div className="flex items-center">
                <Phone className="h-5 w-5 mr-3 flex-shrink-0" />
                <span>{firstStudio?.phone || '+62 812-3456-7890'}</span>
              </div>
              <div className="flex items-center">
                <Mail className="h-5 w-5 mr-3 flex-shrink-0" />
                <span>{firstStudio?.email || 'info@kalarasastudio.com'}</span>
              </div>
            </div>
          </div>
        </div>

        <div className="border-t border-white/10 pt-8 text-center text-white/60">
          <p>&copy; {new Date().getFullYear()} Kalarasa Studio. Semua hak dilindungi.</p>
        </div>
      </div>
    </footer>
  )
}