"use client"

import Link from "next/link"
import { Users } from "lucide-react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { CustomerLoginForm } from "@/app/(auth)/_components/customer-login-form"
import { GoogleLoginButton } from "@/app/(auth)/_components/google-login-button"
import { Button } from "@/components/ui/button"
import { Separator } from "@/components/ui/separator"

export default function CustomerLoginPage() {
  return (
    <div className="flex items-center justify-center min-h-screen py-8">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center space-y-4">
          <div className="flex justify-center">
            <div className="p-3 bg-green-100 rounded-full">
              <Users className="h-8 w-8 text-green-600" />
            </div>
          </div>
          <div>
            <CardTitle className="text-2xl font-bold">Customer Login</CardTitle>
            <CardDescription>
              Masuk untuk booking studio foto
            </CardDescription>
          </div>
        </CardHeader>
        <CardContent className="space-y-6">
          <GoogleLoginButton />

          <div className="relative">
            <div className="absolute inset-0 flex items-center">
              <span className="w-full border-t" />
            </div>
            <div className="relative flex justify-center text-xs uppercase">
              <span className="bg-background px-2 text-muted-foreground">
                Atau lanjutkan dengan email
              </span>
            </div>
          </div>

          <CustomerLoginForm />

          <Separator />

          <div className="text-center space-y-3">
            <p className="text-sm text-muted-foreground">
              Belum punya akun?{" "}
              <Link href="/register" className="font-medium text-primary hover:underline">
                Daftar di sini
              </Link>
            </p>

            <div className="relative">
              <div className="absolute inset-0 flex items-center">
                <span className="w-full border-t border-gray-200" />
              </div>
              <div className="relative flex justify-center text-xs uppercase">
                <span className="bg-white px-2 text-gray-500">
                  Staff?
                </span>
              </div>
            </div>

            <Link href="/staff/login">
              <Button variant="outline" className="w-full">
                Masuk ke Staff Portal
              </Button>
            </Link>

            <Link href="/forgot-password">
              <Button variant="link" className="p-0 h-auto font-normal text-sm">
                Lupa password?
              </Button>
            </Link>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}