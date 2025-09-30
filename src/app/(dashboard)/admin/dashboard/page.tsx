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
  Users,
  Camera,
  TrendingUp,
  RefreshCw,
  BarChart3,
  Settings,
  FileText,
  Package,
  AlertTriangle
} from "lucide-react"
import Link from "next/link"
import { useStudios } from "@/hooks/use-studios"
import { DashboardStatsCards, HighlightStats } from "../_components/dashboard-stats"
import { RecentBookings } from "../_components/dashboard-recent-bookings"
import { PendingActions } from "../_components/dashboard-pending-actions"
import { DashboardAnalytics } from "../_components/dashboard-analytics"

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

      {/* Highlight Stats */}
      <HighlightStats studioId={selectedStudioId} />

      {/* Main Stats Cards */}
      <DashboardStatsCards studioId={selectedStudioId} />

      {/* Main Content Grid */}
      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-7">
        {/* Recent Bookings */}
        <RecentBookings studioId={selectedStudioId} />

        {/* Pending Actions */}
        <PendingActions studioId={selectedStudioId} />
      </div>

      {/* Quick Actions */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Settings className="h-5 w-5" />
            Aksi Cepat
          </CardTitle>
          <CardDescription>
            Tugas manajemen umum untuk studio Anda
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
            <Link href="/admin/reservations/calendar">
              <Card className="hover:shadow-md transition-shadow cursor-pointer group">
                <CardContent className="pt-6">
                  <div className="text-center">
                    <Calendar className="h-8 w-8 mx-auto text-blue-600 group-hover:scale-110 transition-transform" />
                    <CardTitle className="text-lg mt-3">Lihat Kalender</CardTitle>
                    <CardDescription className="mt-2">
                      Lihat semua reservasi dalam tampilan kalender
                    </CardDescription>
                  </div>
                </CardContent>
              </Card>
            </Link>
            
            <Link href="/admin/customers">
              <Card className="hover:shadow-md transition-shadow cursor-pointer group">
                <CardContent className="pt-6">
                  <div className="text-center">
                    <Users className="h-8 w-8 mx-auto text-green-600 group-hover:scale-110 transition-transform" />
                    <CardTitle className="text-lg mt-3">Kelola Customer</CardTitle>
                    <CardDescription className="mt-2">
                      Lihat dan kelola profil customer
                    </CardDescription>
                  </div>
                </CardContent>
              </Card>
            </Link>

            <Link href="/admin/packages">
              <Card className="hover:shadow-md transition-shadow cursor-pointer group">
                <CardContent className="pt-6">
                  <div className="text-center">
                    <Package className="h-8 w-8 mx-auto text-purple-600 group-hover:scale-110 transition-transform" />
                    <CardTitle className="text-lg mt-3">Paket Foto</CardTitle>
                    <CardDescription className="mt-2">
                      Kelola paket dan harga
                    </CardDescription>
                  </div>
                </CardContent>
              </Card>
            </Link>

            <Link href="/admin/analytics">
              <Card className="hover:shadow-md transition-shadow cursor-pointer group">
                <CardContent className="pt-6">
                  <div className="text-center">
                    <BarChart3 className="h-8 w-8 mx-auto text-orange-600 group-hover:scale-110 transition-transform" />
                    <CardTitle className="text-lg mt-3">Analitik Lanjutan</CardTitle>
                    <CardDescription className="mt-2">
                      Lihat wawasan kinerja detail
                    </CardDescription>
                  </div>
                </CardContent>
              </Card>
            </Link>
          </div>
        </CardContent>
      </Card>

      {/* Advanced Analytics */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <BarChart3 className="h-5 w-5" />
            Analitik Lanjutan & Data Real-time
          </CardTitle>
          <CardDescription>
            Metrik kinerja detail dan pembaruan dashboard langsung
          </CardDescription>
        </CardHeader>
        <CardContent>
          <DashboardAnalytics studioId={selectedStudioId} />
        </CardContent>
      </Card>

      {/* Studio Information */}
      {selectedStudio && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Camera className="h-5 w-5" />
              Informasi Studio
            </CardTitle>
            <CardDescription>
              Informasi dasar tentang {selectedStudio.name}
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
              <div className="space-y-2">
                <p className="text-sm font-medium text-muted-foreground">Nama Studio</p>
                <p className="text-lg font-semibold">{selectedStudio.name}</p>
              </div>
              
              {selectedStudio.address && (
                <div className="space-y-2">
                  <p className="text-sm font-medium text-muted-foreground">Alamat</p>
                  <p className="text-sm">{selectedStudio.address}</p>
                </div>
              )}
              
              {selectedStudio.phone && (
                <div className="space-y-2">
                  <p className="text-sm font-medium text-muted-foreground">Telepon</p>
                  <p className="text-sm font-mono">{selectedStudio.phone}</p>
                </div>
              )}
              
              <div className="space-y-2">
                <p className="text-sm font-medium text-muted-foreground">Status</p>
                <div className="flex items-center gap-2">
                  <div className={`w-2 h-2 rounded-full ${
                    selectedStudio.is_active ? 'bg-green-500' : 'bg-red-500'
                  }`} />
                  <p className="text-sm">{selectedStudio.is_active ? 'Aktif' : 'Tidak Aktif'}</p>
                </div>
              </div>
              
              <div className="space-y-2">
                <p className="text-sm font-medium text-muted-foreground">Dibuat</p>
                <p className="text-sm">{new Date(selectedStudio.created_at).toLocaleDateString('id-ID')}</p>
              </div>
            </div>
            
            <div className="flex gap-2 mt-6">
              <Button variant="outline" size="sm" asChild>
                <Link href="/admin/studio">
                  Edit Detail Studio
                </Link>
              </Button>
              <Button variant="outline" size="sm" asChild>
                <Link href="/admin/facilities">
                  Kelola Fasilitas
                </Link>
              </Button>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  )
}