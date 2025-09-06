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
  DollarSign,
  Users,
  Camera,
  TrendingUp,
  AlertCircle,
  Clock,
  Star,
  RefreshCw
} from "lucide-react"
import Link from "next/link"
import { useStudios } from "@/hooks/use-studios"

const dashboardStats = [
  {
    title: "Total Revenue",
    value: "Rp 125,450,000",
    change: "+12.5%",
    changeType: "positive",
    icon: DollarSign,
    description: "This month"
  },
  {
    title: "Active Bookings",
    value: "48",
    change: "+8 new today",
    changeType: "positive", 
    icon: Calendar,
    description: "Upcoming sessions"
  },
  {
    title: "Total Customers",
    value: "2,847",
    change: "+23 this week",
    changeType: "positive",
    icon: Users,
    description: "Registered users"
  },
  {
    title: "Average Rating",
    value: "4.8",
    change: "+0.2 from last month",
    changeType: "positive",
    icon: Star,
    description: "Customer satisfaction"
  }
]

const recentBookings = [
  {
    id: "STD20241201001",
    customer: "Sarah Johnson",
    package: "Wedding Package",
    date: "2024-12-15",
    time: "10:00",
    status: "confirmed",
    amount: "Rp 2,500,000"
  },
  {
    id: "STD20241201002", 
    customer: "Michael Chen",
    package: "Prewedding Session",
    date: "2024-12-12",
    time: "14:00",
    status: "pending",
    amount: "Rp 1,800,000"
  },
  {
    id: "STD20241201003",
    customer: "Emma Davis", 
    package: "Portrait Session",
    date: "2024-12-10",
    time: "09:00",
    status: "confirmed",
    amount: "Rp 800,000"
  }
]

const pendingActions = [
  {
    title: "Payment Verification",
    count: 5,
    description: "Payments waiting for verification",
    href: "/admin/payments/pending",
    icon: AlertCircle,
    urgent: true
  },
  {
    title: "Review Moderation",
    count: 3,
    description: "Reviews awaiting moderation",
    href: "/admin/reviews/pending",
    icon: Star,
    urgent: false
  },
  {
    title: "Time Slot Updates",
    count: 2,
    description: "Schedule conflicts to resolve",
    href: "/admin/time-slots",
    icon: Clock,
    urgent: false
  }
]

const getStatusColor = (status: string) => {
  switch (status) {
    case 'confirmed':
      return 'bg-green-100 text-green-800'
    case 'pending':
      return 'bg-yellow-100 text-yellow-800'
    case 'cancelled':
      return 'bg-red-100 text-red-800'
    default:
      return 'bg-gray-100 text-gray-800'
  }
}

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
            <p className="text-lg font-medium text-gray-900">Loading...</p>
            <p className="text-sm text-gray-500 mt-1">Fetching studio data</p>
          </div>
        </div>
      </div>
    )
  }

  const selectedStudio = studios.find(s => s.id === selectedStudioId)

  return (
    <div className="flex-1 space-y-6 p-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-3xl font-bold tracking-tight">Studio Dashboard</h2>
          <p className="text-muted-foreground">
            Overview statistik dan aktivitas studio {selectedStudio?.name || 'Anda'}
          </p>
        </div>
        <div className="flex items-center space-x-2">
          <Button variant="outline" asChild>
            <Link href="/admin/reports">View Reports</Link>
          </Button>
          <Button asChild>
            <Link href="/admin/reservations">Manage Bookings</Link>
          </Button>
        </div>
      </div>

      {/* Studio Selector */}
      <div className="flex items-center space-x-4">
        <div className="flex-1 max-w-sm">
          <label className="text-sm font-medium mb-2 block">Select Studio:</label>
          <Select value={selectedStudioId} onValueChange={setSelectedStudioId}>
            <SelectTrigger>
              <SelectValue placeholder="Select studio..." />
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

      {/* Stats Cards */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        {dashboardStats.map((stat) => (
          <Card key={stat.title}>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">
                {stat.title}
              </CardTitle>
              <stat.icon className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stat.value}</div>
              <p className={`text-xs ${
                stat.changeType === 'positive' ? 'text-green-600' : 'text-red-600'
              }`}>
                {stat.change}
              </p>
              <p className="text-xs text-muted-foreground mt-1">
                {stat.description}
              </p>
            </CardContent>
          </Card>
        ))}
      </div>

      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-7">
        {/* Recent Bookings */}
        <Card className="col-span-4">
          <CardHeader className="flex flex-row items-center justify-between">
            <div>
              <CardTitle>Recent Bookings</CardTitle>
              <CardDescription>
                Latest booking requests and confirmations
              </CardDescription>
            </div>
            <Button variant="outline" size="sm" asChild>
              <Link href="/admin/reservations">View All</Link>
            </Button>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {recentBookings.map((booking) => (
                <div key={booking.id} className="flex items-center justify-between p-4 border rounded-lg">
                  <div className="space-y-1">
                    <div className="flex items-center space-x-2">
                      <p className="font-medium">{booking.customer}</p>
                      <span className={`inline-flex px-2 py-1 text-xs rounded-full ${getStatusColor(booking.status)}`}>
                        {booking.status}
                      </span>
                    </div>
                    <p className="text-sm text-muted-foreground">{booking.package}</p>
                    <div className="flex items-center space-x-4 text-xs text-muted-foreground">
                      <span>{booking.date}</span>
                      <span>{booking.time}</span>
                      <span>#{booking.id}</span>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="font-medium">{booking.amount}</p>
                    <Button variant="ghost" size="sm" className="text-blue-600 hover:text-blue-800">
                      View Details
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Pending Actions */}
        <Card className="col-span-3">
          <CardHeader>
            <CardTitle>Pending Actions</CardTitle>
            <CardDescription>
              Items that require your attention
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {pendingActions.map((action) => (
                <Link 
                  key={action.title} 
                  href={action.href}
                  className="block"
                >
                  <div className={`flex items-center justify-between p-3 border rounded-lg hover:bg-gray-50 transition-colors ${
                    action.urgent ? 'border-red-200 bg-red-50' : ''
                  }`}>
                    <div className="flex items-center space-x-3">
                      <div className={`p-2 rounded-lg ${
                        action.urgent ? 'bg-red-100 text-red-600' : 'bg-blue-100 text-blue-600'
                      }`}>
                        <action.icon className="h-4 w-4" />
                      </div>
                      <div>
                        <p className="font-medium text-sm">{action.title}</p>
                        <p className="text-xs text-muted-foreground">{action.description}</p>
                      </div>
                    </div>
                    <div className={`px-2 py-1 text-xs font-medium rounded-full ${
                      action.urgent 
                        ? 'bg-red-100 text-red-800' 
                        : 'bg-blue-100 text-blue-800'
                    }`}>
                      {action.count}
                    </div>
                  </div>
                </Link>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Quick Actions */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Link href="/admin/reservations/calendar">
          <Card className="hover:shadow-md transition-shadow cursor-pointer">
            <CardHeader className="text-center">
              <Calendar className="h-8 w-8 mx-auto text-blue-600" />
              <CardTitle className="text-lg">View Calendar</CardTitle>
              <CardDescription>
                See all bookings in calendar view
              </CardDescription>
            </CardHeader>
          </Card>
        </Link>
        
        <Link href="/admin/customers">
          <Card className="hover:shadow-md transition-shadow cursor-pointer">
            <CardHeader className="text-center">
              <Users className="h-8 w-8 mx-auto text-green-600" />
              <CardTitle className="text-lg">Manage Customers</CardTitle>
              <CardDescription>
                View and manage customer profiles
              </CardDescription>
            </CardHeader>
          </Card>
        </Link>

        <Link href="/admin/packages">
          <Card className="hover:shadow-md transition-shadow cursor-pointer">
            <CardHeader className="text-center">
              <Camera className="h-8 w-8 mx-auto text-purple-600" />
              <CardTitle className="text-lg">Photo Packages</CardTitle>
              <CardDescription>
                Manage packages and pricing
              </CardDescription>
            </CardHeader>
          </Card>
        </Link>

        <Link href="/admin/analytics">
          <Card className="hover:shadow-md transition-shadow cursor-pointer">
            <CardHeader className="text-center">
              <TrendingUp className="h-8 w-8 mx-auto text-orange-600" />
              <CardTitle className="text-lg">Analytics</CardTitle>
              <CardDescription>
                View performance insights
              </CardDescription>
            </CardHeader>
          </Card>
        </Link>
      </div>
    </div>
  )
}