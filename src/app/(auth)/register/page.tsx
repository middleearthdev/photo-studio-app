"use client"

import Link from "next/link"
import { UserPlus } from "lucide-react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { RegisterForm } from "@/app/(auth)/_components/register-form"
import { GoogleLoginButton } from "@/app/(auth)/_components/google-login-button"
import { Separator } from "@/components/ui/separator"
import { Alert, AlertDescription } from "@/components/ui/alert"

export default function RegisterPage() {
  return (
    <div className="flex items-center justify-center min-h-screen py-8">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center space-y-4">
          <div className="flex justify-center">
            <div className="p-3 bg-blue-100 rounded-full">
              <UserPlus className="h-8 w-8 text-blue-600" />
            </div>
          </div>
          <div>
            <CardTitle className="text-2xl font-bold">Daftar Customer</CardTitle>
            <CardDescription>
              Buat akun customer untuk booking studio foto
            </CardDescription>
          </div>
        </CardHeader>
        <CardContent className="space-y-6">
          <Alert>
            <AlertDescription className="text-sm">
              <strong>Hanya untuk Customer:</strong> Registrasi ini khusus untuk customer.
              Staff (admin, customer service) akan dibuat oleh admin.
            </AlertDescription>
          </Alert>

          <GoogleLoginButton text="Daftar dengan Google" />

          <div className="relative">
            <div className="absolute inset-0 flex items-center">
              <span className="w-full border-t" />
            </div>
            <div className="relative flex justify-center text-xs uppercase">
              <span className="bg-background px-2 text-muted-foreground">
                Atau daftar dengan email
              </span>
            </div>
          </div>

          <RegisterForm />

          <Separator />

          <div className="text-center space-y-2">
            <p className="text-sm text-muted-foreground">
              Sudah punya akun?{" "}
              <Link href="/staff/login" className="font-medium text-primary hover:underline">
                Masuk di sini
              </Link>
            </p>

            <p className="text-xs text-gray-500">
              Staff? Silakan hubungi admin untuk mendapatkan akses
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}