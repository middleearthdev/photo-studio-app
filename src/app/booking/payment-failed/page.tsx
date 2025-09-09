'use client'

import { useRouter } from 'next/navigation'
import { useEffect } from 'react'
import { motion } from 'framer-motion'
import { XCircle, ArrowLeft, Home } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'

export default function PaymentFailedPage() {
  const router = useRouter()

  useEffect(() => {
    // Clear temporary booking data
    localStorage.removeItem('finalBookingData')
    localStorage.removeItem('transactionData')
  }, [])

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100">
      <div className="max-w-2xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          className="space-y-8"
        >
          {/* Header */}
          <div className="text-center">
            <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <XCircle className="h-8 w-8 text-red-600" />
            </div>
            <h1 className="text-3xl font-bold text-slate-900 mb-2">Pembayaran Gagal</h1>
            <p className="text-slate-600">
              Pembayaran Anda tidak berhasil diproses
            </p>
          </div>

          {/* Error Card */}
          <Card className="bg-white/90 backdrop-blur-sm border-0 shadow-xl">
            <CardHeader className="text-center pb-4">
              <CardTitle className="text-xl text-red-600">Transaksi Tidak Berhasil</CardTitle>
              <CardDescription>
                Mohon maaf, pembayaran Anda tidak dapat diproses. Silakan coba beberapa saat lagi atau hubungi customer service kami.
              </CardDescription>
            </CardHeader>
            <CardContent className="pt-6 text-center">
              <div className="space-y-4">
                <div className="bg-red-50 p-4 rounded-lg">
                  <p className="text-sm text-red-700">
                    <strong>Penting:</strong> Jika Anda sudah melakukan transfer dana, mohon abaikan pesan ini dan tunggu konfirmasi dari tim kami dalam 1x24 jam.
                  </p>
                </div>
                
                <div className="space-y-3">
                  <Button
                    onClick={() => router.push('/packages')}
                    className="w-full bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800"
                  >
                    <Home className="h-5 w-5 mr-2" />
                    Kembali ke Beranda
                  </Button>
                  
                  <Button
                    variant="outline"
                    onClick={() => router.back()}
                    className="w-full"
                  >
                    <ArrowLeft className="h-5 w-5 mr-2" />
                    Coba Pembayaran Lagi
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Support Information */}
          <Card className="bg-amber-50 border-amber-200">
            <CardContent className="pt-6">
              <div className="flex items-start gap-3">
                <div className="bg-amber-100 p-2 rounded-full">
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-amber-600" viewBox="0 0 20 20" fill="currentColor">
                    <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
                  </svg>
                </div>
                <div className="space-y-2 text-sm text-amber-800">
                  <p className="font-medium">Butuh Bantuan?</p>
                  <p>Hubungi customer service kami:</p>
                  <ul className="space-y-1 list-disc list-inside">
                    <li>WhatsApp: +62 812-3456-7890</li>
                    <li>Email: support@studiofoto.com</li>
                    <li>Senin - Jumat, 09:00 - 17:00 WIB</li>
                  </ul>
                </div>
              </div>
            </CardContent>
          </Card>
        </motion.div>
      </div>
    </div>
  )
}