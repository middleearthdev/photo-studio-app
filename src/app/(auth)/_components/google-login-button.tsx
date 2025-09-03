"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { useAuthStore } from "@/stores/auth-store"
import { toast } from "sonner"

interface GoogleLoginButtonProps {
  text?: string
  variant?: "default" | "outline" | "secondary" | "ghost" | "link" | "destructive"
  size?: "default" | "sm" | "lg" | "icon"
  className?: string
}

export function GoogleLoginButton({ 
  text = "Lanjutkan dengan Google",
  variant = "outline",
  size = "default",
  className = "w-full"
}: GoogleLoginButtonProps) {
  const [isLoading, setIsLoading] = useState(false)
  const { signInWithGoogle } = useAuthStore()

  const handleGoogleLogin = async () => {
    try {
      setIsLoading(true)
      const { error } = await signInWithGoogle()

      if (error) {
        toast.error(error.message || "Gagal login dengan Google")
        return
      }

      // OAuth redirect will handle the rest
      // No need to show success message as user will be redirected
    } catch (error) {
      console.error("Google login error:", error)
      toast.error("Terjadi kesalahan saat login dengan Google")
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <Button
      type="button"
      variant={variant}
      size={size}
      className={className}
      onClick={handleGoogleLogin}
      disabled={isLoading}
    >
      <svg
        className="mr-2 h-4 w-4"
        aria-hidden="true"
        focusable="false"
        data-prefix="fab"
        data-icon="google"
        role="img"
        xmlns="http://www.w3.org/2000/svg"
        viewBox="0 0 488 512"
      >
        <path
          fill="currentColor"
          d="M488 261.8C488 403.3 391.1 504 248 504 110.8 504 0 393.2 0 256S110.8 8 248 8c66.8 0 123 24.5 166.3 64.9l-67.5 64.9C258.5 52.6 94.3 116.6 94.3 256c0 86.5 69.1 156.6 153.7 156.6 98.2 0 135-70.4 140.8-106.9H248v-85.3h240z"
        />
      </svg>
      {isLoading ? "Memproses..." : text}
    </Button>
  )
}