"use client"

import Link, { LinkProps } from "next/link"
import { ReactNode, MouseEvent } from "react"
import { usePathname } from "next/navigation"

interface ProgressLinkProps extends LinkProps {
  children: ReactNode
  className?: string
  onClick?: (e: MouseEvent<HTMLAnchorElement>) => void
}

export function ProgressLink({ 
  children, 
  href, 
  className, 
  onClick, 
  ...props 
}: ProgressLinkProps) {
  const pathname = usePathname()

  const handleClick = (e: MouseEvent<HTMLAnchorElement>) => {
    // Only trigger progress if navigating to a different page
    const targetPath = typeof href === 'string' ? href : href.pathname || ''
    
    if (targetPath !== pathname) {
      // Add a small delay to show the progress bar
      document.body.style.cursor = 'progress'
      setTimeout(() => {
        document.body.style.cursor = ''
      }, 100)
    }

    // Call custom onClick if provided
    onClick?.(e)
  }

  return (
    <Link 
      href={href} 
      className={className} 
      onClick={handleClick}
      {...props}
    >
      {children}
    </Link>
  )
}