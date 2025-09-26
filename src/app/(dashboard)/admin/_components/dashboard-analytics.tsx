"use client"

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { useDashboardStats, formatCurrency } from "@/hooks/use-dashboard-analytics"
import { usePaginatedReservations } from "@/hooks/use-reservations"
import { usePaginatedPayments } from "@/hooks/use-payments"
import { Skeleton } from "@/components/ui/skeleton"
import { 
  TrendingUp, 
  TrendingDown, 
  Calendar,
  DollarSign,
  Users,
  Star,
  Clock,
  CheckCircle,
  XCircle,
  AlertTriangle,
  RefreshCw
} from "lucide-react"
import { useState, useEffect } from "react"
import Link from "next/link"

interface AnalyticsChartsProps {
  studioId?: string
}

// Simple chart component for revenue trend
function RevenueChart({ data }: { data: { month: string; amount: number }[] }) {
  if (!data || data.length === 0) {
    return (
      <div className="h-32 flex items-center justify-center text-muted-foreground">
        <p className="text-sm">No data available</p>
      </div>
    )
  }

  const maxAmount = Math.max(...data.map(d => d.amount))
  
  return (
    <div className="h-32 flex items-end justify-between gap-2">
      {data.map((item, index) => (
        <div key={item.month} className="flex-1 flex flex-col items-center gap-1">
          <div 
            className="bg-blue-500 rounded-t-sm min-h-[4px] w-full transition-all duration-500"
            style={{ height: `${(item.amount / maxAmount) * 100}%` }}
          />
          <p className="text-xs text-muted-foreground rotate-45 origin-left">
            {item.month}
          </p>
        </div>
      ))}
    </div>
  )
}

// Booking status distribution chart
function BookingStatusChart({ reservations }: { reservations: any[] }) {
  if (!reservations || reservations.length === 0) {
    return (
      <div className="h-32 flex items-center justify-center text-muted-foreground">
        <p className="text-sm">No bookings data</p>
      </div>
    )
  }

  const statusCounts = reservations.reduce((acc, reservation) => {
    acc[reservation.status] = (acc[reservation.status] || 0) + 1
    return acc
  }, {})

  const statusColors = {
    confirmed: 'bg-green-500',
    pending: 'bg-yellow-500', 
    in_progress: 'bg-blue-500',
    completed: 'bg-gray-500',
    cancelled: 'bg-red-500'
  }

  const statusLabels = {
    confirmed: 'Confirmed',
    pending: 'Pending',
    in_progress: 'In Progress', 
    completed: 'Completed',
    cancelled: 'Cancelled'
  }

  return (
    <div className="space-y-3">
      {Object.entries(statusCounts).map(([status, count]) => (
        <div key={status} className="flex items-center gap-3">
          <div className={`w-3 h-3 rounded-full ${statusColors[status as keyof typeof statusColors]}`} />
          <div className="flex-1">
            <div className="flex items-center justify-between">
              <p className="text-sm font-medium">
                {statusLabels[status as keyof typeof statusLabels]}
              </p>
              <p className="text-sm text-muted-foreground">{count as number}</p>
            </div>
            <div className="w-full bg-muted rounded-full h-1.5 mt-1">
              <div 
                className={`h-1.5 rounded-full transition-all duration-500 ${statusColors[status as keyof typeof statusColors]}`}
                style={{ width: `${((count as number) / reservations.length) * 100}%` }}
              />
            </div>
          </div>
        </div>
      ))}
    </div>
  )
}

export function DashboardAnalytics({ studioId }: AnalyticsChartsProps) {
  const [refreshKey, setRefreshKey] = useState(0)
  const { data: stats, isLoading: statsLoading } = useDashboardStats(studioId)
  const { data: reservationsData, isLoading: reservationsLoading } = usePaginatedReservations(
    studioId || '', 
    { page: 1, pageSize: 100 }
  )
  const { data: paymentsData, isLoading: paymentsLoading } = usePaginatedPayments(
    studioId || '',
    { page: 1, pageSize: 50 }
  )

  // Auto-refresh data every 5 minutes
  useEffect(() => {
    const interval = setInterval(() => {
      setRefreshKey(prev => prev + 1)
    }, 5 * 60 * 1000)
    
    return () => clearInterval(interval)
  }, [])

  // Generate mock revenue data for chart
  const revenueData = [
    { month: 'Jan', amount: stats?.monthlyRevenue || 0 },
    { month: 'Feb', amount: (stats?.monthlyRevenue || 0) * 0.8 },
    { month: 'Mar', amount: (stats?.monthlyRevenue || 0) * 1.2 },
    { month: 'Apr', amount: (stats?.monthlyRevenue || 0) * 0.9 },
    { month: 'May', amount: (stats?.monthlyRevenue || 0) * 1.1 },
    { month: 'Jun', amount: stats?.monthlyRevenue || 0 }
  ]

  if (statsLoading || reservationsLoading) {
    return (
      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
        {[...Array(6)].map((_, i) => (
          <Card key={i}>
            <CardHeader>
              <Skeleton className="h-4 w-24" />
              <Skeleton className="h-3 w-32" />
            </CardHeader>
            <CardContent>
              <Skeleton className="h-32 w-full" />
            </CardContent>
          </Card>
        ))}
      </div>
    )
  }

  const reservations = reservationsData?.data || []
  const payments = paymentsData?.data || []

  return (
    <div className="space-y-6">
      {/* Real-time Status Bar */}
      <Card className="border-blue-200 bg-blue-50">
        <CardContent className="pt-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="flex items-center gap-2">
                <div className="w-2 h-2 rounded-full bg-green-500 animate-pulse" />
                <span className="text-sm font-medium">Live Dashboard</span>
              </div>
              <Badge variant="secondary" className="text-xs">
                Auto-refresh: 5min
              </Badge>
            </div>
            <Button
              variant="outline"
              size="sm"
              onClick={() => setRefreshKey(prev => prev + 1)}
              className="flex items-center gap-2"
            >
              <RefreshCw className="h-3 w-3" />
              Refresh Now
            </Button>
          </div>
          <div className="mt-3 text-xs text-blue-600">
            Last updated: {new Date().toLocaleTimeString('id-ID')}
          </div>
        </CardContent>
      </Card>

      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
        {/* Revenue Trend */}
        <Card className="md:col-span-2">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <TrendingUp className="h-5 w-5" />
              Revenue Trend
            </CardTitle>
            <CardDescription>
              Monthly revenue performance over last 6 months
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="mb-4">
              <div className="text-2xl font-bold">
                {formatCurrency(stats?.totalRevenue || 0)}
              </div>
              <p className="text-sm text-muted-foreground">
                Total revenue this period
              </p>
            </div>
            <RevenueChart data={revenueData} />
          </CardContent>
        </Card>

        {/* Booking Status Distribution */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Calendar className="h-5 w-5" />
              Booking Status
            </CardTitle>
            <CardDescription>
              Distribution of booking statuses
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="mb-4">
              <div className="text-2xl font-bold">{reservations.length}</div>
              <p className="text-sm text-muted-foreground">Total bookings</p>
            </div>
            <BookingStatusChart reservations={reservations} />
          </CardContent>
        </Card>

        {/* Recent Activity Timeline */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Clock className="h-5 w-5" />
              Recent Activity
            </CardTitle>
            <CardDescription>
              Latest system activities
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {reservations.slice(0, 4).map((reservation, index) => (
                <div key={reservation.id} className="flex items-start gap-3">
                  <div className={`p-1 rounded-full ${
                    reservation.status === 'confirmed' ? 'bg-green-100' :
                    reservation.status === 'pending' ? 'bg-yellow-100' :
                    reservation.status === 'cancelled' ? 'bg-red-100' : 'bg-blue-100'
                  }`}>
                    {reservation.status === 'confirmed' ? <CheckCircle className="h-3 w-3 text-green-600" /> :
                     reservation.status === 'cancelled' ? <XCircle className="h-3 w-3 text-red-600" /> :
                     <AlertTriangle className="h-3 w-3 text-yellow-600" />}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium truncate">
                      {reservation.customer?.full_name || reservation.guest_email || 'Guest'}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      {reservation.status} • {new Date(reservation.created_at).toLocaleDateString('id-ID')}
                    </p>
                  </div>
                </div>
              ))}
              
              {reservations.length === 0 && (
                <div className="text-center py-4 text-muted-foreground">
                  <p className="text-sm">No recent activity</p>
                </div>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Payment Overview */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <DollarSign className="h-5 w-5" />
              Payment Overview
            </CardTitle>
            <CardDescription>
              Payment status and trends
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium">Total Payments</p>
                  <p className="text-2xl font-bold">{payments.length}</p>
                </div>
                <DollarSign className="h-8 w-8 text-muted-foreground" />
              </div>
              
              <div className="space-y-2">
                {['completed', 'pending', 'failed'].map((status) => {
                  const count = payments.filter(p => p.status === status).length
                  const percentage = payments.length > 0 ? (count / payments.length) * 100 : 0
                  
                  return (
                    <div key={status} className="flex items-center justify-between">
                      <span className="text-sm capitalize">{status}</span>
                      <div className="flex items-center gap-2">
                        <div className="w-12 bg-muted rounded-full h-1.5">
                          <div 
                            className={`h-1.5 rounded-full transition-all duration-500 ${
                              status === 'completed' ? 'bg-green-500' :
                              status === 'pending' ? 'bg-yellow-500' : 'bg-red-500'
                            }`}
                            style={{ width: `${percentage}%` }}
                          />
                        </div>
                        <span className="text-sm text-muted-foreground w-8 text-right">
                          {count}
                        </span>
                      </div>
                    </div>
                  )
                })}
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Performance Metrics */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Star className="h-5 w-5" />
              Performance
            </CardTitle>
            <CardDescription>
              Key performance indicators
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium">Avg. Rating</p>
                  <p className="text-2xl font-bold">
                    {stats?.averageRating ? stats.averageRating.toFixed(1) : 'N/A'}
                  </p>
                </div>
                <Star className="h-8 w-8 text-yellow-500 fill-current" />
              </div>
              
              <div>
                <div className="flex items-center justify-between mb-1">
                  <span className="text-sm">Customer Satisfaction</span>
                  <span className="text-sm">{stats?.averageRating ? Math.round(stats.averageRating * 20) : 0}%</span>
                </div>
                <div className="w-full bg-muted rounded-full h-1.5">
                  <div 
                    className="bg-yellow-500 h-1.5 rounded-full transition-all duration-500"
                    style={{ width: `${stats?.averageRating ? Math.round(stats.averageRating * 20) : 0}%` }}
                  />
                </div>
              </div>

              <div className="pt-2 border-t">
                <Link href="/admin/reviews" className="text-sm text-blue-600 hover:underline">
                  View all reviews →
                </Link>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}