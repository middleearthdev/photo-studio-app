"use client"

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { 
  DollarSign,
  Calendar,
  Users,
  Star,
  TrendingUp,
  TrendingDown,
  Minus
} from "lucide-react"
import { useDashboardStats, formatCurrency, formatPercentage } from "@/hooks/use-dashboard-analytics"
import { Skeleton } from "@/components/ui/skeleton"

interface DashboardStatsProps {
  studioId?: string
}

export function DashboardStatsCards({ studioId }: DashboardStatsProps) {
  const { data: stats, isLoading, error } = useDashboardStats(studioId)

  if (isLoading) {
    return (
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        {[...Array(4)].map((_, i) => (
          <Card key={i}>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <Skeleton className="h-4 w-24" />
              <Skeleton className="h-4 w-4" />
            </CardHeader>
            <CardContent>
              <Skeleton className="h-8 w-32 mb-2" />
              <Skeleton className="h-4 w-20" />
            </CardContent>
          </Card>
        ))}
      </div>
    )
  }

  if (error || !stats) {
    return (
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card className="border-red-200">
          <CardContent className="pt-6">
            <div className="text-center text-red-600">
              <p className="text-sm">Error loading stats</p>
            </div>
          </CardContent>
        </Card>
      </div>
    )
  }

  const statsCards = [
    {
      title: "Total Revenue",
      value: formatCurrency(stats.totalRevenue),
      change: stats.revenueGrowth,
      changeLabel: "from last month",
      icon: DollarSign,
      description: "Total earnings"
    },
    {
      title: "Active Bookings", 
      value: stats.activeBookings.toString(),
      change: stats.bookingGrowth,
      changeLabel: stats.todayBookings > 0 ? `+${stats.todayBookings} today` : "no new today",
      icon: Calendar,
      description: "Pending & confirmed"
    },
    {
      title: "Total Customers",
      value: stats.totalCustomers.toString(),
      change: stats.customerGrowth,
      changeLabel: `+${stats.weeklyCustomers} this week`,
      icon: Users,
      description: "Registered customers"
    },
    {
      title: "Average Rating",
      value: stats.averageRating > 0 ? stats.averageRating.toFixed(1) : "N/A",
      change: stats.ratingGrowth,
      changeLabel: `${stats.totalReviews} reviews`,
      icon: Star,
      description: "Customer satisfaction"
    }
  ]

  const getTrendIcon = (change: number) => {
    if (change > 0) return TrendingUp
    if (change < 0) return TrendingDown
    return Minus
  }

  const getTrendColor = (change: number) => {
    if (change > 0) return "text-green-600"
    if (change < 0) return "text-red-600"
    return "text-gray-600"
  }

  return (
    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
      {statsCards.map((stat) => {
        const TrendIcon = getTrendIcon(stat.change)
        const trendColor = getTrendColor(stat.change)
        
        return (
          <Card key={stat.title} className="hover:shadow-md transition-shadow">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">
                {stat.title}
              </CardTitle>
              <stat.icon className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stat.value}</div>
              <div className={`flex items-center gap-1 text-xs ${trendColor} mt-1`}>
                <TrendIcon className="h-3 w-3" />
                <span>
                  {stat.change !== 0 ? formatPercentage(stat.change) : ''} {stat.changeLabel}
                </span>
              </div>
              <p className="text-xs text-muted-foreground mt-1">
                {stat.description}
              </p>
            </CardContent>
          </Card>
        )
      })}
    </div>
  )
}

interface HighlightStatsProps {
  studioId?: string
}

export function HighlightStats({ studioId }: HighlightStatsProps) {
  const { data: stats, isLoading } = useDashboardStats(studioId)

  if (isLoading || !stats) {
    return null
  }

  return (
    <div className="grid gap-4 md:grid-cols-3 mb-6">
      {stats.pendingPayments > 0 && (
        <Card className="border-yellow-200 bg-yellow-50">
          <CardContent className="pt-6">
            <div className="flex items-center gap-4">
              <div className="p-3 bg-yellow-100 rounded-full">
                <DollarSign className="h-6 w-6 text-yellow-600" />
              </div>
              <div>
                <p className="text-sm font-medium text-yellow-800">
                  {stats.pendingPayments} Pending Payments
                </p>
                <p className="text-xs text-yellow-600">
                  {formatCurrency(stats.pendingPaymentAmount)} waiting verification
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {stats.upcomingBookings > 0 && (
        <Card className="border-blue-200 bg-blue-50">
          <CardContent className="pt-6">
            <div className="flex items-center gap-4">
              <div className="p-3 bg-blue-100 rounded-full">
                <Calendar className="h-6 w-6 text-blue-600" />
              </div>
              <div>
                <p className="text-sm font-medium text-blue-800">
                  {stats.upcomingBookings} Upcoming Sessions
                </p>
                <p className="text-xs text-blue-600">
                  Scheduled for this week
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {stats.totalReviews > 0 && stats.averageRating >= 4.5 && (
        <Card className="border-green-200 bg-green-50">
          <CardContent className="pt-6">
            <div className="flex items-center gap-4">
              <div className="p-3 bg-green-100 rounded-full">
                <Star className="h-6 w-6 text-green-600" />
              </div>
              <div>
                <p className="text-sm font-medium text-green-800">
                  Excellent Reviews
                </p>
                <p className="text-xs text-green-600">
                  {stats.averageRating.toFixed(1)}/5.0 from {stats.totalReviews} reviews
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  )
}