"use client"

import { useEffect } from "react"
import { useRouter } from "next/navigation"

export default function CSPage() {
  const router = useRouter()

  useEffect(() => {
    router.replace("/cs/dashboard")
  }, [router])

  return null
}