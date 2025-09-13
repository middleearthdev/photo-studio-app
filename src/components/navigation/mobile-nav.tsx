'use client'

import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import Image from 'next/image'
import Link from 'next/link'
import { Camera, Menu, X, Home, Package, Image as ImageIcon, Info, Phone, Sparkles } from 'lucide-react'
import { Button } from '@/components/ui/button'

interface MobileNavProps {
  currentPath?: string
}

export function MobileNav({ currentPath = '/' }: MobileNavProps) {
  const [isOpen, setIsOpen] = useState(false)

  const menuItems = [
    { href: '/', label: 'Beranda', icon: Home },
    { href: '/packages', label: 'Paket Foto', icon: Package },
    { href: '/portfolio', label: 'Portfolio', icon: ImageIcon },
    { href: '#services', label: 'Layanan', icon: Sparkles },
    { href: '#contact', label: 'Kontak', icon: Phone },
  ]

  const toggleMenu = () => setIsOpen(!isOpen)
  const closeMenu = () => setIsOpen(false)

  return (
    <>
      {/* Mobile Menu Button */}
      <div className="md:hidden">
        <Button
          variant="outline"
          size="sm"
          onClick={toggleMenu}
          className="relative z-50 border-[#00052e]/20 hover:bg-[#00052e]/10 rounded-full"
        >
          <AnimatePresence mode="wait" initial={false}>
            {isOpen ? (
              <motion.div
                key="close"
                initial={{ rotate: -90, opacity: 0 }}
                animate={{ rotate: 0, opacity: 1 }}
                exit={{ rotate: 90, opacity: 0 }}
                transition={{ duration: 0.2 }}
              >
                <X className="h-4 w-4 text-[#00052e]" />
              </motion.div>
            ) : (
              <motion.div
                key="menu"
                initial={{ rotate: 90, opacity: 0 }}
                animate={{ rotate: 0, opacity: 1 }}
                exit={{ rotate: -90, opacity: 0 }}
                transition={{ duration: 0.2 }}
              >
                <Menu className="h-4 w-4 text-[#00052e]" />
              </motion.div>
            )}
          </AnimatePresence>
        </Button>
      </div>

      {/* Mobile Menu Overlay */}
      <AnimatePresence>
        {isOpen && (
          <>
            {/* Backdrop */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.2 }}
              className="fixed inset-0 bg-black/20 backdrop-blur-sm z-40 md:hidden"
              onClick={closeMenu}
            />

            {/* Menu Panel */}
            <motion.div
              initial={{ x: '100%' }}
              animate={{ x: 0 }}
              exit={{ x: '100%' }}
              transition={{ type: 'spring', damping: 25, stiffness: 200 }}
              className="fixed top-0 right-0 h-full w-80 bg-white shadow-2xl z-50 md:hidden"
            >
              {/* Header */}
              <div className="flex items-center justify-between p-6 border-b border-slate-200">
                <div className="flex items-center space-x-3">
                  <Image 
                    src="/icons/logo_blue_white.svg" 
                    alt="Kalarasa Studio Logo" 
                    width={32} 
                    height={32}
                    className="rounded-full"
                  />
                  <span className="text-lg font-bold text-[#00052e]">Kalarasa Studio</span>
                </div>
                <Button variant="ghost" size="sm" onClick={closeMenu} className="hover:bg-slate-100 rounded-full">
                  <X className="h-5 w-5 text-[#00052e]" />
                </Button>
              </div>

              {/* Menu Items */}
              <div className="flex flex-col p-6 space-y-2">
                {menuItems.map((item, index) => {
                  const Icon = item.icon
                  const isActive = currentPath === item.href
                  
                  return (
                    <motion.div
                      key={item.href}
                      initial={{ opacity: 0, x: 20 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: index * 0.1 }}
                    >
                      <Link
                        href={item.href}
                        onClick={closeMenu}
                        className={`flex items-center space-x-3 p-3 rounded-lg transition-all duration-300 ${
                          isActive
                            ? 'bg-[#00052e] text-white shadow-md'
                            : 'text-slate-700 hover:bg-[#00052e]/10'
                        }`}
                      >
                        <Icon className="h-5 w-5" />
                        <span className="font-medium">{item.label}</span>
                      </Link>
                    </motion.div>
                  )
                })}
              </div>

              {/* CTA Section */}
              <div className="absolute bottom-0 left-0 right-0 p-6 border-t border-slate-200 bg-gradient-to-r from-[#00052e] to-[#b0834d]">
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.5 }}
                >
                  <h3 className="text-white font-bold mb-2">Siap untuk sesi foto?</h3>
                  <p className="text-white/80 text-sm mb-4">
                    Hubungi kami untuk konsultasi gratis
                  </p>
                  <Button 
                    className="w-full bg-white text-[#00052e] hover:bg-white/90 rounded-full shadow-lg"
                    onClick={closeMenu}
                  >
                    <Camera className="h-4 w-4 mr-2" />
                    Booking Sekarang
                  </Button>
                </motion.div>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </>
  )
}