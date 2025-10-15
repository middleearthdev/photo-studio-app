"use client"

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { useRecentBookings, formatCurrency, getStatusColor, getStatusLabel } from "@/hooks/use-dashboard-analytics"
import { Skeleton } from "@/components/ui/skeleton"
import { Calendar, ExternalLink } from "lucide-react"
import Link from "next/link"

interface RecentBookingsProps {
  studioId?: string
}

export function RecentBookings({ studioId }: RecentBookingsProps) {
  const { data: bookings, isLoading, error } = useRecentBookings(studioId)

  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>5 Reservasi Terbaru</CardTitle>
          <CardDescription>Permintaan booking dan konfirmasi terbaru</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-2">
            {[...Array(5)].map((_, i) => (
              <div key={i} className="flex items-center justify-between p-3 border rounded-lg">
                <div className="space-y-1">
                  <Skeleton className="h-4 w-32" />
                  <Skeleton className="h-3 w-24" />
                </div>
                <div className="text-right">
                  <Skeleton className="h-4 w-20" />
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
      <Card className="col-span-4 border-red-200">
        <CardHeader>
          <CardTitle className="text-red-600">5 Reservasi Terbaru</CardTitle>
          <CardDescription>Tidak dapat memuat data reservasi terbaru</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="text-center py-8 text-red-600">
            <p className="text-sm">Gagal memuat data reservasi terbaru</p>
            <Button variant="outline" size="sm" className="mt-2">
              Coba Lagi
            </Button>
          </div>
        </CardContent>
      </Card>
    )
  }

  if (!bookings || bookings.length === 0) {
    return (
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <div>
            <CardTitle>5 Reservasi Terbaru</CardTitle>
            <CardDescription>Permintaan booking dan konfirmasi terbaru</CardDescription>
          </div>
          <Button variant="outline" size="sm" asChild>
            <Link href="/admin/reservations">Buat Baru</Link>
          </Button>
        </CardHeader>
        <CardContent>
          <div className="text-center py-12 text-muted-foreground">
            <Calendar className="h-12 w-12 mx-auto mb-4 opacity-50" />
            <p className="text-lg font-medium mb-1">Belum Ada Reservasi</p>
            <p className="text-sm mb-4">Mulai dengan membuat reservasi pertama atau tunggu customer untuk booking.</p>
            <Button asChild>
              <Link href="/admin/reservations">Kelola Reservasi</Link>
            </Button>
          </div>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card className="col-span-4">
      <CardHeader className="flex flex-row items-center justify-between">
        <div>
          <CardTitle>5 Reservasi Terbaru</CardTitle>
          <CardDescription>
            Permintaan booking dan konfirmasi terbaru ({bookings.length} terbaru)
          </CardDescription>
        </div>
        <Button variant="outline" size="sm" asChild>
          <Link href="/admin/reservations" className="flex items-center gap-2">
            Lihat Semua <ExternalLink className="h-3 w-3" />
          </Link>
        </Button>
      </CardHeader>
      <CardContent>
        <div className="space-y-2">
          {bookings.map((booking) => (
            <div 
              key={booking.id} 
              className="flex items-center justify-between p-3 border rounded-lg hover:bg-muted/50 transition-colors"
            >
              <div className="space-y-1">
                <div className="flex items-center gap-2">
                  <span className="font-medium text-sm">{booking.customerName}</span>
                  <Badge className={getStatusColor(booking.status)}>
                    {getStatusLabel(booking.status)}
                  </Badge>
                </div>
                <div className="text-xs text-muted-foreground">
                  {new Date(booking.date).toLocaleDateString('id-ID', { 
                    day: '2-digit', 
                    month: 'short',
                    hour: '2-digit',
                    minute: '2-digit'
                  })} • {booking.bookingCode}
                </div>
              </div>
              
              <div className="text-right">
                <div className="font-semibold text-sm">
                  {formatCurrency(booking.amount)}
                </div>
              </div>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  )
}