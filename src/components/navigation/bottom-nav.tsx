'use client'

import { motion } from 'framer-motion'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { Home, Package, Image as ImageIcon, Phone, User } from 'lucide-react'
import { cn } from '@/lib/utils'

const navigationItems = [
  { href: '/', label: 'Beranda', icon: Home },
  { href: '/packages', label: 'Paket', icon: Package },
  { href: '/portfolio', label: 'Portfolio', icon: ImageIcon },
  // { href: '/login', label: 'Profil', icon: User },
]

export function BottomNav() {
  const pathname = usePathname()

  // Don't show bottom nav on auth pages or dashboard pages
  if (pathname?.includes('/login') || pathname?.includes('/register') || pathname?.includes('/dashboard') || pathname?.includes('/admin') || pathname?.includes('/cs')) {
    return null
  }

  return (
    <div className="md:hidden">
      {/* Safe area spacing */}
      <div className="h-20" />

      {/* Bottom Navigation */}
      <motion.nav
        initial={{ y: 100 }}
        animate={{ y: 0 }}
        className="fixed bottom-0 left-0 right-0 z-50 bg-white border-t border-slate-200/50 backdrop-blur-md"
      >
        <div className="flex items-center justify-around px-2 py-2 pb-safe">
          {navigationItems.map((item, index) => {
            const Icon = item.icon
            const isActive = pathname === item.href || (item.href !== '/' && pathname?.startsWith(item.href))

            return (
              <Link
                key={item.href}
                href={item.href}
                className={cn(
                  "relative flex flex-col items-center justify-center min-w-0 flex-1 px-1 py-2 text-xs font-medium transition-all duration-200",
                  isActive
                    ? "text-[#00052e]"
                    : "text-slate-500 active:text-[#00052e]"
                )}
              >
                <motion.div
                  className="relative flex flex-col items-center justify-center"
                  whileTap={{ scale: 0.95 }}
                >
                  {/* Active indicator background */}
                  {isActive && (
                    <motion.div
                      layoutId="activeTab"
                      className="absolute -inset-2 bg-[#00052e]/10 rounded-2xl"
                      initial={false}
                      transition={{ type: "spring", bounce: 0.2, duration: 0.6 }}
                    />
                  )}

                  {/* Icon container */}
                  <div className="relative mb-1">
                    <Icon className={cn(
                      "h-5 w-5 transition-all duration-200",
                      isActive ? "text-[#00052e] scale-110" : "text-slate-500"
                    )} />

                    {/* Active dot indicator */}
                    {isActive && (
                      <motion.div
                        className="absolute -top-1 -right-1 w-2 h-2 bg-[#b0834d] rounded-full"
                        initial={{ scale: 0 }}
                        animate={{ scale: 1 }}
                        transition={{ delay: 0.1 }}
                      />
                    )}
                  </div>

                  {/* Label */}
                  <span className={cn(
                    "text-xs font-medium transition-all duration-200 truncate max-w-full",
                    isActive ? "text-[#00052e] font-semibold" : "text-slate-500"
                  )}>
                    {item.label}
                  </span>
                </motion.div>
              </Link>
            )
          })}
        </div>
      </motion.nav>
    </div>
  )
}