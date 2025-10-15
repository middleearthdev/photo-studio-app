"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { 
  Calendar,
  FileText,
  RefreshCw,
  AlertTriangle
} from "lucide-react"
import Link from "next/link"
import { useStudios } from "@/hooks/use-studios"
import { RecentBookings } from "../_components/dashboard-recent-bookings"
import { PendingActions } from "../_components/dashboard-pending-actions"
import { LatestPayments } from "../_components/dashboard-latest-payments"

export default function AdminDashboard() {
  const [selectedStudioId, setSelectedStudioId] = useState<string>('')
  const { data: studios = [], isLoading: studiosLoading } = useStudios()

  // Auto-select first studio
  useEffect(() => {
    if (studios.length > 0 && !selectedStudioId) {
      setSelectedStudioId(studios[0].id)
    }
  }, [studios, selectedStudioId])

  // Show loading if studios not loaded yet
  if (studiosLoading || (studios.length > 0 && !selectedStudioId)) {
    return (
      <div className="flex-1 space-y-4 p-4">
        <div className="flex items-center justify-center h-64">
          <div className="text-center">
            <RefreshCw className="h-8 w-8 animate-spin mx-auto mb-4 text-muted-foreground" />
            <p className="text-lg font-medium text-gray-900">Memuat Dashboard...</p>
            <p className="text-sm text-gray-500 mt-1">Mengambil data studio dan analitik</p>
          </div>
        </div>
      </div>
    )
  }

  if (studios.length === 0) {
    return (
      <div className="flex-1 space-y-6 p-6">
        <div className="text-center py-12">
          <AlertTriangle className="h-16 w-16 mx-auto mb-4 text-yellow-500" />
          <h2 className="text-2xl font-bold mb-2">Tidak Ada Studio Ditemukan</h2>
          <p className="text-muted-foreground mb-6">
            Anda perlu membuat setidaknya satu studio untuk melihat dashboard.
          </p>
          <Button asChild>
            <Link href="/admin/studio">Buat Studio</Link>
          </Button>
        </div>
      </div>
    )
  }

  const selectedStudio = studios.find(s => s.id === selectedStudioId)

  return (
    <div className="flex-1 space-y-6 p-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-3xl font-bold tracking-tight">Dashboard Studio</h2>
          <p className="text-muted-foreground">
            Overview dan analisis kinerja studio {selectedStudio?.name || 'Anda'}
          </p>
        </div>
        <div className="flex items-center space-x-2">
          <Button variant="outline" asChild>
            <Link href="/admin/reports" className="flex items-center gap-2">
              <FileText className="h-4 w-4" />
              Lihat Laporan
            </Link>
          </Button>
          <Button asChild>
            <Link href="/admin/reservations" className="flex items-center gap-2">
              <Calendar className="h-4 w-4" />
              Kelola Reservasi
            </Link>
          </Button>
        </div>
      </div>

      {/* Studio Selector */}
      {studios.length > 1 && (
        <div className="flex items-center space-x-4">
          <div className="flex-1 max-w-sm">
            <label className="text-sm font-medium mb-2 block">Pilih Studio:</label>
            <Select value={selectedStudioId} onValueChange={setSelectedStudioId}>
              <SelectTrigger>
                <SelectValue placeholder="Pilih studio..." />
              </SelectTrigger>
              <SelectContent>
                {studios.map((studio) => (
                  <SelectItem key={studio.id} value={studio.id}>
                    {studio.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>
      )}

      {/* Main Content Grid - 3 sections only */}
      <div className="grid gap-6 lg:grid-cols-3">
        {/* Recent Bookings */}
        <RecentBookings studioId={selectedStudioId} />

        {/* Pending Actions */}
        <PendingActions studioId={selectedStudioId} />

        {/* Latest Payments */}
        <LatestPayments studioId={selectedStudioId} />
      </div>

    </div>
  )
}