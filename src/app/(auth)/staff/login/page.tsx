"use client"

import Link from "next/link"
import { Shield } from "lucide-react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { StaffLoginForm } from "@/app/(auth)/_components/staff-login-form"
import { Button } from "@/components/ui/button"

export default function StaffLoginPage() {
  return (
    <div className="flex items-center justify-center min-h-screen py-8 bg-slate-50">
      <Card className="w-full max-w-md border-2">
        <CardHeader className="text-center space-y-4">
          <div className="flex justify-center">
            <div className="p-3 bg-blue-100 rounded-full">
              <Shield className="h-8 w-8 text-blue-600" />
            </div>
          </div>
          <div>
            <CardTitle className="text-2xl font-bold text-gray-900">
              Staff Portal
            </CardTitle>
            <CardDescription className="text-gray-600">
              Masuk ke dashboard admin studio foto
            </CardDescription>
          </div>
        </CardHeader>
        <CardContent className="space-y-6">
          <StaffLoginForm />

          <div className="text-center space-y-3">
            <div className="relative">
              <div className="absolute inset-0 flex items-center">
                <span className="w-full border-t border-gray-200" />
              </div>
              <div className="relative flex justify-center text-xs uppercase">
                <span className="bg-white px-2 text-gray-500">
                  Bukan staff?
                </span>
              </div>
            </div>

            <Link href="/login">
              <Button variant="outline" className="w-full">
                Masuk sebagai Customer
              </Button>
            </Link>

            <Link href="/forgot-password">
              <Button variant="link" className="p-0 h-auto font-normal text-sm text-gray-500">
                Lupa password?
              </Button>
            </Link>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}