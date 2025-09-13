"use client"

import { useEffect, useState } from "react"
import { usePathname } from "next/navigation"

export function useNavigationProgress() {
  const pathname = usePathname()
  const [isLoading, setIsLoading] = useState(false)
  const [progress, setProgress] = useState(0)
  const [previousPathname, setPreviousPathname] = useState(pathname)

  useEffect(() => {
    // Check if pathname actually changed
    if (pathname !== previousPathname) {
      setIsLoading(true)
      setProgress(0)

      // Simulate realistic loading progress
      const progressSteps = [10, 25, 45, 70, 85, 95]
      let stepIndex = 0

      const progressInterval = setInterval(() => {
        if (stepIndex < progressSteps.length) {
          setProgress(progressSteps[stepIndex])
          stepIndex++
        }
      }, 80)

      // Complete the progress after a short delay
      const completeTimer = setTimeout(() => {
        setProgress(100)
        
        // Hide the progress bar after completion animation
        setTimeout(() => {
          setIsLoading(false)
          setProgress(0)
          setPreviousPathname(pathname)
        }, 300)
      }, 400)

      return () => {
        clearInterval(progressInterval)
        clearTimeout(completeTimer)
      }
    }
  }, [pathname, previousPathname])

  return { isLoading, progress }
}