"use client"

import { useEffect } from "react"
import { useAuthStore, initializeAuthListener } from "@/stores/auth-store"

interface AuthProviderProps {
  children: React.ReactNode
}

export function AuthProvider({ children }: AuthProviderProps) {
  const { initialize } = useAuthStore()

  useEffect(() => {
    // Initialize auth state and listener
    initialize()
    initializeAuthListener()
  }, [initialize])

  return <>{children}</>
}