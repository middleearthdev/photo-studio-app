"use client"

import { useEffect } from "react"
import { useAuthStore } from "@/stores/auth-store"
import { usePathname, useRouter } from "next/navigation"

interface AuthProviderProps {
  children: React.ReactNode
}

export function AuthProvider({ children }: AuthProviderProps) {
  const { initialize, refreshProfile } = useAuthStore()
  const pathname = usePathname()
  const router = useRouter()

  useEffect(() => {
    // Initialize auth state
    initialize()
  }, [initialize])

  // Check for OAuth refresh cookie and refresh profile if needed
  useEffect(() => {
    const checkAuthRefresh = async () => {
      if (typeof window !== 'undefined') {
        // Check if we need to refresh auth data
        const needsRefresh = document.cookie.includes('auth-refresh-needed=true')
        if (needsRefresh) {
          // Remove the cookie
          document.cookie = 'auth-refresh-needed=; Max-Age=0; path=/'
          // Refresh the profile
          await refreshProfile()
        }
      }
    }

    checkAuthRefresh()
  }, [pathname, refreshProfile])

  return <>{children}</>
}