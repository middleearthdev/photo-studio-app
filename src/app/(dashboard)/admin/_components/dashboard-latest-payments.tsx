"use client"

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Skeleton } from "@/components/ui/skeleton"
import { DollarSign, Clock, CreditCard, ExternalLink } from "lucide-react"
import Link from "next/link"
import { useQuery } from "@tanstack/react-query"
import { getPaginatedPayments } from "@/actions/payments"

interface LatestPaymentsProps {
  studioId?: string
}

export function LatestPayments({ studioId }: LatestPaymentsProps) {
  const { data: paymentsData, isLoading, error } = useQuery({
    queryKey: ['latest-payments', studioId],
    queryFn: () => getPaginatedPayments(studioId!, { page: 1, pageSize: 5 }),
    enabled: !!studioId,
    staleTime: 1 * 60 * 1000, // 1 minute
  })

  const payments = paymentsData?.data || []

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('id-ID', {
      style: 'currency',
      currency: 'IDR',
      minimumFractionDigits: 0,
    }).format(value)
  }

  const getPaymentStatusColor = (status: string) => {
    switch (status) {
      case 'paid': return 'bg-green-100 text-green-800'
      case 'pending': return 'bg-yellow-100 text-yellow-800'
      case 'failed': return 'bg-red-100 text-red-800'
      case 'partial': return 'bg-blue-100 text-blue-800'
      case 'cancelled': return 'bg-gray-100 text-gray-800'
      case 'refunded': return 'bg-purple-100 text-purple-800'
      default: return 'bg-gray-100 text-gray-800'
    }
  }

  const getPaymentStatusLabel = (status: string) => {
    switch (status) {
      case 'paid': return 'Lunas'
      case 'pending': return 'Pending'
      case 'failed': return 'Gagal'
      case 'partial': return 'Sebagian'
      case 'cancelled': return 'Dibatalkan'
      case 'refunded': return 'Refund'
      default: return status
    }
  }

  const getPaymentTypeLabel = (type: string) => {
    switch (type) {
      case 'dp': return 'DP'
      case 'remaining': return 'Pelunasan'
      case 'full': return 'Lunas'
      default: return type
    }
  }

  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <DollarSign className="h-5 w-5" />
            5 Pembayaran Terbaru
          </CardTitle>
          <CardDescription>Pembayaran terbaru dari semua reservasi</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {[...Array(5)].map((_, i) => (
              <div key={i} className="flex items-center justify-between p-3 border rounded-lg">
                <div className="space-y-2">
                  <Skeleton className="h-4 w-32" />
                  <Skeleton className="h-3 w-24" />
                </div>
                <div className="text-right space-y-2">
                  <Skeleton className="h-4 w-20" />
                  <Skeleton className="h-6 w-16" />
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    )
  }

  if (error) {
    return (
      <Card className="border-red-200">
        <CardHeader>
          <CardTitle className="text-red-600 flex items-center gap-2">
            <DollarSign className="h-5 w-5" />
            5 Pembayaran Terbaru
          </CardTitle>
          <CardDescription>Terjadi kesalahan saat memuat data pembayaran</CardDescription>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground">
            Gagal memuat data pembayaran terbaru
          </p>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <DollarSign className="h-5 w-5" />
          5 Pembayaran Terbaru
        </CardTitle>
        <CardDescription>Pembayaran terbaru dari semua reservasi</CardDescription>
      </CardHeader>
      <CardContent>
        {payments.length === 0 ? (
          <div className="text-center py-8 text-muted-foreground">
            <DollarSign className="h-12 w-12 mx-auto mb-4 opacity-50" />
            <p>Belum ada data pembayaran</p>
          </div>
        ) : (
          <div className="space-y-4">
            {payments.map((payment) => (
              <div key={payment.id} className="flex items-center justify-between p-3 border rounded-lg hover:bg-muted/50 transition-colors">
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <CreditCard className="h-4 w-4 text-muted-foreground" />
                    <span className="font-medium text-sm">
                      {payment.reservation?.booking_code || 'N/A'}
                    </span>
                    <Badge variant="outline" className="text-xs">
                      {getPaymentTypeLabel(payment.payment_type)}
                    </Badge>
                  </div>
                  <div className="flex items-center gap-4 text-xs text-muted-foreground">
                    <span className="flex items-center gap-1">
                      <Clock className="h-3 w-3" />
                      {new Date(payment.created_at).toLocaleDateString('id-ID', {
                        day: '2-digit',
                        month: 'short',
                        hour: '2-digit',
                        minute: '2-digit'
                      })}
                    </span>
                    {payment.payment_method?.name && (
                      <span>{payment.payment_method.name}</span>
                    )}
                  </div>
                  <div className="text-xs text-muted-foreground">
                    Customer: {payment.reservation?.customer?.full_name || 
                              payment.reservation?.guest_email || 
                              payment.reservation?.guest_phone || 'Guest'}
                  </div>
                </div>
                <div className="text-right space-y-1">
                  <div className="font-semibold text-sm">
                    {formatCurrency(payment.amount)}
                  </div>
                  <Badge className={getPaymentStatusColor(payment.status)}>
                    {getPaymentStatusLabel(payment.status)}
                  </Badge>
                </div>
              </div>
            ))}
          </div>
        )}
        <div className="mt-4 pt-4 border-t">
          <Button asChild variant="outline" className="w-full">
            <Link href="/admin/payments" className="flex items-center gap-2">
              <ExternalLink className="h-4 w-4" />
              Lihat Semua Pembayaran
            </Link>
          </Button>
        </div>
      </CardContent>
    </Card>
  )
}