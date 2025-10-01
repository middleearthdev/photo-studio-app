import Link from "next/link"
import { Shield, ArrowLeft } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"

export default function UnauthorizedPage() {
  return (
    <div className="container flex items-center justify-center min-h-screen py-8">
      <Card className="w-full max-w-md text-center">
        <CardHeader>
          <div className="flex justify-center mb-4">
            <Shield className="h-16 w-16 text-destructive" />
          </div>
          <CardTitle className="text-2xl font-bold">Akses Ditolak</CardTitle>
          <CardDescription>
            Anda tidak memiliki izin untuk mengakses halaman ini
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <p className="text-sm text-muted-foreground">
            Halaman ini memerlukan level akses yang lebih tinggi atau role yang berbeda.
          </p>
          
          <div className="flex flex-col gap-2">
            <Link href="/">
              <Button variant="default" className="w-full">
                <ArrowLeft className="mr-2 h-4 w-4" />
                Kembali ke Beranda
              </Button>
            </Link>
            
            <Link href="/staff/login">
              <Button variant="outline" className="w-full">
                Login dengan Akun Lain
              </Button>
            </Link>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}