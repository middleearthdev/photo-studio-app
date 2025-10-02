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

        {/* Google Maps Section */}
        <div className="border-t border-white/10 pt-12 pb-8">
          <div className="text-center mb-8">
            <h3 className="text-xl font-bold mb-4">Lokasi Studio</h3>
            <p className="text-white/80 max-w-2xl mx-auto">
              Kunjungi studio kami yang berlokasi strategis di Karawang untuk konsultasi langsung dan melihat fasilitas yang tersedia.
            </p>
          </div>
          
          <div className="rounded-2xl overflow-hidden shadow-2xl bg-white/5 p-2">
            <iframe
              src="https://www.google.com/maps/embed?pb=!1m18!1m12!1m3!1d3965.234!2d107.3055!3d-6.3235!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s0x2e6977b30b703715%3A0xa6f3d630980eb381!2sKalarasa%20Studio!5e0!3m2!1sen!2sid!4v1699999999999!5m2!1sen!2sid"
              width="100%"
              height="300"
              style={{ border: 0 }}
              allowFullScreen
              loading="lazy"
              referrerPolicy="no-referrer-when-downgrade"
              className="rounded-xl"
              title="Lokasi Kalarasa Studio"
            ></iframe>
          </div>
          
          <div className="text-center mt-6">
            <Link 
              href="https://www.google.com/maps?q=kalarasastudio,+Pinayungan,+telukjambe,+Karawang,+Jawa+Barat+41361&ftid=0x2e6977b30b703715:0xa6f3d630980eb381&entry=gps"
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center px-6 py-3 bg-white/10 hover:bg-white/20 text-white rounded-full transition-all duration-300 hover:scale-105"
            >
              <MapPin className="h-5 w-5 mr-2" />
              Buka di Google Maps
            </Link>
          </div>
        </div>

        <div className="border-t border-white/10 pt-8 text-center text-white/60">
          <p>&copy; {new Date().getFullYear()} Kalarasa Studio. Semua hak dilindungi.</p>
        </div>
      </div>
    </footer>
  )
}