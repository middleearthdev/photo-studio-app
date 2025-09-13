"use client"

import { useNavigationProgress } from "@/hooks/use-navigation-progress"

interface NavigationProgressProps {
  className?: string
}

export function NavigationProgress({ className }: NavigationProgressProps) {
  const { isLoading, progress } = useNavigationProgress()

  if (!isLoading) return null

  return (
    <>
      {/* Top loading bar */}
      <div
        className={`fixed top-0 left-0 right-0 z-[100] h-1 bg-transparent ${className || ''}`}
      >
        <div
          className="h-full bg-gradient-to-r from-primary via-primary/90 to-primary transition-all duration-300 ease-out shadow-lg"
          style={{
            width: `${progress}%`,
            boxShadow: `0 0 10px ${progress > 50 ? 'rgba(var(--primary), 0.6)' : 'rgba(var(--primary), 0.3)'}`,
          }}
        />
      </div>
      
      {/* Optional: Subtle overlay effect */}
      <div 
        className="fixed inset-0 z-[99] pointer-events-none"
        style={{
          background: `linear-gradient(90deg, 
            transparent 0%, 
            rgba(var(--primary), ${progress > 80 ? '0.02' : '0.01'}) 50%, 
            transparent 100%
          )`,
          opacity: progress > 30 ? 1 : 0,
          transition: 'opacity 200ms ease-out',
        }}
      />
    </>
  )
}