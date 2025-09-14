'use client'

import Image from 'next/image'
import Link from 'next/link'
import { Button } from '@/components/ui/button'

interface NavbarProps {
  currentPath?: string
}

export function Navbar({ currentPath = '/' }: NavbarProps) {
  const isActive = (path: string) => currentPath === path

  return (
    <nav className="fixed top-0 w-full z-50 bg-white/90 backdrop-blur-md border-b border-slate-200/20">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16">
          <Link href="/" className="flex items-center space-x-3">
            <Image
              src="/icons/logo_blue_white.svg"
              alt="Kalarasa Studio Logo"
              width={40}
              height={40}
              className="rounded-full"
            />
            <span className="text-xl font-bold text-[#00052e]">Kalarasa Studio</span>
          </Link>

          <div className="hidden md:flex items-center space-x-8">
            <Link
              href="/"
              className={`transition-colors font-medium ${isActive('/')
                ? 'text-[#00052e] hover:text-[#b0834d]'
                : 'text-slate-600 hover:text-[#00052e]'
                }`}
            >
              Beranda
            </Link>
            <Link
              href="/packages"
              className={`transition-colors ${isActive('/packages')
                ? 'text-[#00052e] hover:text-[#b0834d] font-medium'
                : 'text-slate-600 hover:text-[#00052e]'
                }`}
            >
              Paket Foto
            </Link>
            <Link
              href="/portfolio"
              className={`transition-colors ${isActive('/portfolio')
                ? 'text-[#00052e] hover:text-[#b0834d] font-medium'
                : 'text-slate-600 hover:text-[#00052e]'
                }`}
            >
              Portfolio
            </Link>
            <Link
              href="#services"
              className="text-slate-600 hover:text-[#00052e] transition-colors"
            >
              Layanan
            </Link>
            <Link
              href="#contact"
              className="text-slate-600 hover:text-[#00052e] transition-colors"
            >
              Kontak
            </Link>
            <Link href="/packages">
              <Button className="bg-[#00052e] hover:bg-[#00052e]/90 text-white transition-all duration-300 shadow-md hover:shadow-lg">
                Booking Sekarang
              </Button>
            </Link>
          </div>

          {/* <MobileNav currentPath={currentPath} /> */}
        </div>
      </div>
    </nav>
  )
}