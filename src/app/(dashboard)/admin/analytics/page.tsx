"use client"

import React, { useState, useEffect } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import {
  BarChart,
  Bar,
  LineChart,
  Line,
  PieChart,
  Pie,
  Cell,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from "recharts"
import {
  TrendingUp,
  TrendingDown,
  Calendar,
  DollarSign,
  Users,
  Camera,
  Star,
  Package,
  Clock,
  Target,
  BarChart3,
  PieChart as PieChartIcon,
  Activity,
  Loader2,
} from "lucide-react"
import {
  useDashboardAnalytics,
  useRevenueAnalytics,
  usePackagePerformance,
  useFacilityUsage,
  useCustomerAnalytics,
  useTimeSlotAnalytics,
} from "@/hooks/use-analytics"
import { AnalyticsTimeRange } from "@/actions/analytics"
import { useStudios } from "@/hooks/use-studios"

const COLORS = ['#8884d8', '#82ca9d', '#ffc658', '#ff7c7c', '#8dd1e1']

export default function AnalyticsPage() {
  const [timeRange, setTimeRange] = useState<AnalyticsTimeRange>("last-6-months")
  const [selectedStudioId, setSelectedStudioId] = useState<string>('')
  
  // Get list of studios for selection (consistent with other admin pages)
  const { data: studios = [], isLoading: studiosLoading } = useStudios()

  // Set default studio when studios load
  useEffect(() => {
    if (studios.length > 0 && !selectedStudioId) {
      setSelectedStudioId(studios[0].id)
    }
  }, [studios, selectedStudioId])
  
  const { data: dashboardData, isLoading: isDashboardLoading } = useDashboardAnalytics(selectedStudioId, timeRange)
  const { data: revenueData, isLoading: isRevenueLoading } = useRevenueAnalytics(selectedStudioId, timeRange)
  const { data: packageData, isLoading: isPackageLoading } = usePackagePerformance(selectedStudioId, timeRange)
  const { data: facilityData, isLoading: isFacilityLoading } = useFacilityUsage(selectedStudioId, timeRange)
  const { data: customerData, isLoading: isCustomerLoading } = useCustomerAnalytics(selectedStudioId, timeRange)
  const { data: timeSlotData, isLoading: isTimeSlotLoading } = useTimeSlotAnalytics(selectedStudioId, timeRange)
  
  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('id-ID', {
      style: 'currency',
      currency: 'IDR',
      minimumFractionDigits: 0,
    }).format(value)
  }

  const isLoading = studiosLoading || isDashboardLoading || isRevenueLoading || isPackageLoading || isFacilityLoading || isCustomerLoading || isTimeSlotLoading
  
  // Show loading if studios not loaded yet or analytics data is loading
  if (isLoading || (studios.length > 0 && !selectedStudioId)) {
    return (
      <div className="container mx-auto py-6 space-y-6">
        <div className="flex justify-center items-center h-64">
          <Loader2 className="h-8 w-8 animate-spin" />
          <span className="ml-2">Memuat data analytics...</span>
        </div>
      </div>
    )
  }

  // Show message if no data available
  const hasData = (revenueData && revenueData.length > 0) || 
                  (packageData && packageData.length > 0) || 
                  (facilityData && facilityData.length > 0) ||
                  (timeSlotData && timeSlotData.length > 0)

  if (!hasData) {
    return (
      <div className="container mx-auto py-6 space-y-6">
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-3xl font-bold tracking-tight">Analytics Dashboard</h1>
            <p className="text-muted-foreground">
              Comprehensive insights into your studio performance
            </p>
          </div>
        </div>
        <div className="flex flex-col items-center justify-center h-64 space-y-4">
          <div className="text-center">
            <h3 className="text-lg font-semibold">Belum Ada Data Analytics</h3>
            <p className="text-muted-foreground mt-2">
              Data analytics akan muncul setelah ada reservasi yang dikonfirmasi.
            </p>
            <p className="text-sm text-muted-foreground mt-1">
              Mulai dengan membuat reservasi atau menunggu customer booking.
            </p>
          </div>
        </div>
      </div>
    )
  }

  const totalRevenue = dashboardData?.totalRevenue || 0
  const totalBookings = dashboardData?.totalBookings || 0
  const avgRevenuePerBooking = totalBookings > 0 ? totalRevenue / totalBookings : 0
  const customerMetrics = customerData || { newCustomers: 0, returningCustomers: 0, totalCustomers: 0, averageRating: 0, totalReviews: 0 }

  // Debug logging to check data
  console.log('Analytics Data Debug:', {
    selectedStudioId,
    timeRange,
    dashboardData,
    revenueData: revenueData?.length,
    packageData: packageData?.length,
    facilityData: facilityData?.length,
    customerData,
    timeSlotData: timeSlotData?.length,
    totalRevenue,
    totalBookings,
    studios: studios.length
  })

  return (
    <div className="container mx-auto py-6 space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Dashboard Analytics</h1>
          <p className="text-muted-foreground">
            Analisis mendalam performa studio Anda
          </p>
          {selectedStudioId && studios.length > 0 && (
            <div className="mt-2">
              <Badge variant="outline" className="text-xs">
                Studio: {studios.find(s => s.id === selectedStudioId)?.name}
              </Badge>
            </div>
          )}
        </div>
        <div className="flex items-center gap-4">
          {/* Studio Selector */}
          {studios.length > 0 && (
            <Select value={selectedStudioId} onValueChange={setSelectedStudioId}>
              <SelectTrigger className="w-[250px]">
                <SelectValue placeholder="Pilih Studio" />
              </SelectTrigger>
              <SelectContent>
                {studios.map((studio) => (
                  <SelectItem key={studio.id} value={studio.id}>
                    {studio.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          )}
          
          <Select value={timeRange} onValueChange={(value: AnalyticsTimeRange) => setTimeRange(value)}>
            <SelectTrigger className="w-[200px]">
              <SelectValue placeholder="Pilih Periode" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="last-30-days">30 Hari Terakhir</SelectItem>
              <SelectItem value="last-3-months">3 Bulan Terakhir</SelectItem>
              <SelectItem value="last-6-months">6 Bulan Terakhir</SelectItem>
              <SelectItem value="last-year">1 Tahun Terakhir</SelectItem>
              <SelectItem value="all-time">Semua Waktu</SelectItem>
            </SelectContent>
          </Select>
          <Button variant="outline">
            Export Laporan
          </Button>
        </div>
      </div>

      {/* Key Metrics */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Pendapatan</CardTitle>
            <DollarSign className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{formatCurrency(totalRevenue)}</div>
            <p className="text-xs text-muted-foreground">
              <TrendingUp className="inline h-3 w-3 mr-1" />
              {dashboardData?.revenueGrowth || 0}% dari periode sebelumnya
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Booking</CardTitle>
            <Calendar className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{totalBookings}</div>
            <p className="text-xs text-muted-foreground">
              <TrendingUp className="inline h-3 w-3 mr-1" />
              {dashboardData?.bookingGrowth || 0}% dari periode sebelumnya
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Rata-rata/Booking</CardTitle>
            <Target className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{formatCurrency(avgRevenuePerBooking)}</div>
            <p className="text-xs text-muted-foreground">
              <TrendingUp className="inline h-3 w-3 mr-1" />
              {dashboardData?.avgRevenueGrowth || 0}% dari periode sebelumnya
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Rating Customer</CardTitle>
            <Star className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{customerMetrics.averageRating}</div>
            <p className="text-xs text-muted-foreground">
              Berdasarkan {customerMetrics.totalReviews} ulasan
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Revenue and Bookings Trend */}
      <div className="grid gap-4 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Tren Pendapatan</CardTitle>
            <CardDescription>Pendapatan bulanan dari waktu ke waktu</CardDescription>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <LineChart data={revenueData || []}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="period" />
                <YAxis tickFormatter={(value) => `${value / 1000000}M`} />
                <Tooltip formatter={(value) => [formatCurrency(value as number), "Pendapatan"]} />
                <Legend />
                <Line 
                  type="monotone" 
                  dataKey="revenue" 
                  stroke="#8884d8" 
                  strokeWidth={2}
                  name="Pendapatan"
                />
              </LineChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Tren Booking</CardTitle>
            <CardDescription>Jumlah booking per bulan</CardDescription>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={revenueData || []}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="period" />
                <YAxis />
                <Tooltip />
                <Legend />
                <Bar dataKey="bookings" fill="#82ca9d" name="Booking" />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </div>

      {/* Package Popularity and Facility Usage */}
      <div className="grid gap-4 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Popularitas Paket</CardTitle>
            <CardDescription>Paket terpopuler berdasarkan booking</CardDescription>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <PieChart>
                <Pie
                  data={packageData || []}
                  cx="50%"
                  cy="50%"
                  labelLine={false}
                  label={({ name, percent }) => `${name}: ${(percent * 100).toFixed(0)}%`}
                  outerRadius={80}
                  fill="#8884d8"
                  dataKey="bookings"
                >
                  {(packageData || []).map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip formatter={(value, name) => [`${value} booking`, "Booking"]} />
              </PieChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Penggunaan Fasilitas</CardTitle>
            <CardDescription>Tingkat utilisasi berdasarkan fasilitas</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {(facilityData || []).map((facility) => (
                <div key={facility.facility} className="space-y-2">
                  <div className="flex justify-between items-center">
                    <span className="text-sm font-medium">{facility.facility}</span>
                    <span className="text-sm text-muted-foreground">
                      {facility.usage_percentage}% ({facility.bookings} booking)
                    </span>
                  </div>
                  <div className="w-full bg-secondary rounded-full h-2">
                    <div
                      className="bg-primary h-2 rounded-full transition-all"
                      style={{ width: `${facility.usage_percentage}%` }}
                    />
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Time Slot Analysis and Package Revenue */}
      <div className="grid gap-4 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Analisis Jam Sibuk</CardTitle>
            <CardDescription>Distribusi booking berdasarkan slot waktu</CardDescription>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={timeSlotData || []}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="time_slot" />
                <YAxis />
                <Tooltip />
                <Bar dataKey="bookings" fill="#ffc658" name="Booking" />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Rincian Pendapatan Paket</CardTitle>
            <CardDescription>Kontribusi pendapatan berdasarkan paket</CardDescription>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Paket</TableHead>
                  <TableHead>Booking</TableHead>
                  <TableHead>Pendapatan</TableHead>
                  <TableHead>Rata-rata/Booking</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {(packageData || []).map((pkg) => (
                  <TableRow key={pkg.name}>
                    <TableCell className="font-medium">{pkg.name}</TableCell>
                    <TableCell>{pkg.bookings}</TableCell>
                    <TableCell>{formatCurrency(pkg.revenue)}</TableCell>
                    <TableCell>{formatCurrency(pkg.bookings > 0 ? pkg.revenue / pkg.bookings : 0)}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      </div>

      {/* Customer Insights */}
      <Card>
        <CardHeader>
          <CardTitle>Insight Customer</CardTitle>
          <CardDescription>Metrik dan perilaku customer utama</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4 md:grid-cols-4">
            <div className="text-center p-4 border rounded-lg">
              <Users className="h-8 w-8 mx-auto mb-2 text-blue-500" />
              <div className="text-2xl font-bold">{customerMetrics.totalCustomers}</div>
              <div className="text-sm text-muted-foreground">Total Customer</div>
            </div>
            <div className="text-center p-4 border rounded-lg">
              <TrendingUp className="h-8 w-8 mx-auto mb-2 text-green-500" />
              <div className="text-2xl font-bold">{customerMetrics.newCustomers}</div>
              <div className="text-sm text-muted-foreground">Customer Baru</div>
            </div>
            <div className="text-center p-4 border rounded-lg">
              <Activity className="h-8 w-8 mx-auto mb-2 text-orange-500" />
              <div className="text-2xl font-bold">{customerMetrics.returningCustomers}</div>
              <div className="text-sm text-muted-foreground">Customer Kembali</div>
            </div>
            <div className="text-center p-4 border rounded-lg">
              <Star className="h-8 w-8 mx-auto mb-2 text-yellow-500" />
              <div className="text-2xl font-bold">{customerMetrics.averageRating}</div>
              <div className="text-sm text-muted-foreground">Rata-rata Rating</div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}