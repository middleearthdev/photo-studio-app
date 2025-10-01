"use client"

import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import { useAuthStore } from "@/stores/auth-store"
import { Skeleton } from "@/components/ui/skeleton"

type UserRole = 'customer' | 'admin' | 'cs'

interface ProtectedRouteProps {
  children: React.ReactNode
  allowedRoles?: UserRole[]
  fallback?: React.ReactNode
  redirectTo?: string
}

export function ProtectedRoute({ 
  children, 
  allowedRoles = [], 
  fallback = <LoadingSkeleton />,
  redirectTo = '/staff/login'
}: ProtectedRouteProps) {
  const [isChecking, setIsChecking] = useState(true)
  const { isAuthenticated, profile, isLoading } = useAuthStore()
  const router = useRouter()

  useEffect(() => {
    if (isLoading) return

    if (!isAuthenticated) {
      router.push(redirectTo)
      return
    }

    if (allowedRoles.length > 0 && profile && !allowedRoles.includes(profile.role)) {
      router.push('/unauthorized')
      return
    }

    setIsChecking(false)
  }, [isAuthenticated, profile, isLoading, router, allowedRoles, redirectTo])

  if (isLoading || isChecking) {
    return fallback
  }

  if (!isAuthenticated) {
    return null
  }

  if (allowedRoles.length > 0 && profile && !allowedRoles.includes(profile.role)) {
    return null
  }

  return <>{children}</>
}

function LoadingSkeleton() {
  return (
    <div className="p-6 space-y-4">
      <Skeleton className="h-8 w-1/3" />
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        {Array.from({ length: 4 }).map((_, i) => (
          <div key={i} className="space-y-3">
            <Skeleton className="h-32 w-full" />
            <Skeleton className="h-4 w-3/4" />
            <Skeleton className="h-4 w-1/2" />
          </div>
        ))}
      </div>
    </div>
  )
}