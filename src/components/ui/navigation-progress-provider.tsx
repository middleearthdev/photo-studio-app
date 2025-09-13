"use client"

import { createContext, useContext, useCallback, ReactNode } from "react"
import { useRouter } from "next/navigation"

interface NavigationProgressContextType {
  startProgress: () => void
  navigate: (href: string) => void
}

const NavigationProgressContext = createContext<NavigationProgressContextType | null>(null)

interface NavigationProgressProviderProps {
  children: ReactNode
}

export function NavigationProgressProvider({ children }: NavigationProgressProviderProps) {
  const router = useRouter()

  const startProgress = useCallback(() => {
    // This will be handled by the useNavigationProgress hook
    // when the pathname changes
  }, [])

  const navigate = useCallback((href: string) => {
    // Start progress immediately on navigation
    startProgress()
    router.push(href)
  }, [router, startProgress])

  return (
    <NavigationProgressContext.Provider value={{ startProgress, navigate }}>
      {children}
    </NavigationProgressContext.Provider>
  )
}

export function useNavigationProgressContext() {
  const context = useContext(NavigationProgressContext)
  if (!context) {
    throw new Error('useNavigationProgressContext must be used within NavigationProgressProvider')
  }
  return context
}