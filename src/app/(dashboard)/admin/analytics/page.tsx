"use client"

import React, { useState } from "react"
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
} from "lucide-react"

// Mock data - replace with actual analytics data
const revenueData = [
  { month: "Jan", revenue: 45000000, bookings: 28 },
  { month: "Feb", revenue: 52000000, bookings: 32 },
  { month: "Mar", revenue: 48000000, bookings: 30 },
  { month: "Apr", revenue: 61000000, bookings: 38 },
  { month: "May", revenue: 55000000, bookings: 34 },
  { month: "Jun", revenue: 67000000, bookings: 42 },
  { month: "Jul", revenue: 71000000, bookings: 45 },
  { month: "Aug", revenue: 69000000, bookings: 43 },
  { month: "Sep", revenue: 58000000, bookings: 36 },
]

const packagePopularity = [
  { name: "Pre-Wedding Classic", bookings: 45, revenue: 112500000, color: "#8884d8" },
  { name: "Premium Portrait", bookings: 32, revenue: 38400000, color: "#82ca9d" },
  { name: "Family Package", bookings: 28, revenue: 42000000, color: "#ffc658" },
  { name: "Fashion Lookbook", bookings: 15, revenue: 52500000, color: "#ff7c7c" },
  { name: "Product Photography", bookings: 22, revenue: 17600000, color: "#8dd1e1" },
]

const facilityUsage = [
  { facility: "Studio Utama A", usage: 85, bookings: 78 },
  { facility: "Outdoor Garden", usage: 72, bookings: 65 },
  { facility: "Studio Mini B", usage: 68, bookings: 62 },
  { facility: "Makeup Room", usage: 90, bookings: 82 },
  { facility: "Green Screen Studio", usage: 45, bookings: 41 },
]

const customerMetrics = {
  newCustomers: 45,
  returningCustomers: 23,
  totalCustomers: 156,
  averageRating: 4.8,
  totalReviews: 89,
}

const timeSlotAnalysis = [
  { timeSlot: "09:00-11:00", bookings: 45 },
  { timeSlot: "11:00-13:00", bookings: 52 },
  { timeSlot: "13:00-15:00", bookings: 38 },
  { timeSlot: "15:00-17:00", bookings: 48 },
  { timeSlot: "17:00-19:00", bookings: 35 },
  { timeSlot: "19:00-21:00", bookings: 28 },
]

const COLORS = ['#8884d8', '#82ca9d', '#ffc658', '#ff7c7c', '#8dd1e1']

export default function AnalyticsPage() {
  const [timeRange, setTimeRange] = useState("last-6-months")
  
  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('id-ID', {
      style: 'currency',
      currency: 'IDR',
      minimumFractionDigits: 0,
    }).format(value)
  }

  const totalRevenue = revenueData.reduce((acc, curr) => acc + curr.revenue, 0)
  const totalBookings = revenueData.reduce((acc, curr) => acc + curr.bookings, 0)
  const avgRevenuePerBooking = totalRevenue / totalBookings

  return (
    <div className="container mx-auto py-6 space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Analytics Dashboard</h1>
          <p className="text-muted-foreground">
            Comprehensive insights into your studio performance
          </p>
        </div>
        <div className="flex items-center gap-4">
          <Select value={timeRange} onValueChange={setTimeRange}>
            <SelectTrigger className="w-[200px]">
              <SelectValue placeholder="Select time range" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="last-30-days">Last 30 Days</SelectItem>
              <SelectItem value="last-3-months">Last 3 Months</SelectItem>
              <SelectItem value="last-6-months">Last 6 Months</SelectItem>
              <SelectItem value="last-year">Last Year</SelectItem>
              <SelectItem value="all-time">All Time</SelectItem>
            </SelectContent>
          </Select>
          <Button variant="outline">
            Export Report
          </Button>
        </div>
      </div>

      {/* Key Metrics */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Revenue</CardTitle>
            <DollarSign className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{formatCurrency(totalRevenue)}</div>
            <p className="text-xs text-muted-foreground">
              <TrendingUp className="inline h-3 w-3 mr-1" />
              +12% from last period
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Bookings</CardTitle>
            <Calendar className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{totalBookings}</div>
            <p className="text-xs text-muted-foreground">
              <TrendingUp className="inline h-3 w-3 mr-1" />
              +8% from last period
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Avg Revenue/Booking</CardTitle>
            <Target className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{formatCurrency(avgRevenuePerBooking)}</div>
            <p className="text-xs text-muted-foreground">
              <TrendingUp className="inline h-3 w-3 mr-1" />
              +3% from last period
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Customer Rating</CardTitle>
            <Star className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{customerMetrics.averageRating}</div>
            <p className="text-xs text-muted-foreground">
              Based on {customerMetrics.totalReviews} reviews
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Revenue and Bookings Trend */}
      <div className="grid gap-4 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Revenue Trend</CardTitle>
            <CardDescription>Monthly revenue over time</CardDescription>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <LineChart data={revenueData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="month" />
                <YAxis tickFormatter={(value) => `${value / 1000000}M`} />
                <Tooltip formatter={(value) => [formatCurrency(value as number), "Revenue"]} />
                <Legend />
                <Line 
                  type="monotone" 
                  dataKey="revenue" 
                  stroke="#8884d8" 
                  strokeWidth={2}
                  name="Revenue"
                />
              </LineChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Bookings Trend</CardTitle>
            <CardDescription>Number of bookings per month</CardDescription>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={revenueData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="month" />
                <YAxis />
                <Tooltip />
                <Legend />
                <Bar dataKey="bookings" fill="#82ca9d" name="Bookings" />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </div>

      {/* Package Popularity and Facility Usage */}
      <div className="grid gap-4 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Package Popularity</CardTitle>
            <CardDescription>Most popular packages by bookings</CardDescription>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <PieChart>
                <Pie
                  data={packagePopularity}
                  cx="50%"
                  cy="50%"
                  labelLine={false}
                  label={({ name, percent }) => `${name}: ${(percent * 100).toFixed(0)}%`}
                  outerRadius={80}
                  fill="#8884d8"
                  dataKey="bookings"
                >
                  {packagePopularity.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip formatter={(value, name) => [`${value} bookings`, "Bookings"]} />
              </PieChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Facility Usage</CardTitle>
            <CardDescription>Utilization rate by facility</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {facilityUsage.map((facility) => (
                <div key={facility.facility} className="space-y-2">
                  <div className="flex justify-between items-center">
                    <span className="text-sm font-medium">{facility.facility}</span>
                    <span className="text-sm text-muted-foreground">
                      {facility.usage}% ({facility.bookings} bookings)
                    </span>
                  </div>
                  <div className="w-full bg-secondary rounded-full h-2">
                    <div
                      className="bg-primary h-2 rounded-full transition-all"
                      style={{ width: `${facility.usage}%` }}
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
            <CardTitle>Peak Time Analysis</CardTitle>
            <CardDescription>Booking distribution by time slots</CardDescription>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={timeSlotAnalysis}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="timeSlot" />
                <YAxis />
                <Tooltip />
                <Bar dataKey="bookings" fill="#ffc658" name="Bookings" />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Package Revenue Breakdown</CardTitle>
            <CardDescription>Revenue contribution by package</CardDescription>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Package</TableHead>
                  <TableHead>Bookings</TableHead>
                  <TableHead>Revenue</TableHead>
                  <TableHead>Avg/Booking</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {packagePopularity.map((pkg) => (
                  <TableRow key={pkg.name}>
                    <TableCell className="font-medium">{pkg.name}</TableCell>
                    <TableCell>{pkg.bookings}</TableCell>
                    <TableCell>{formatCurrency(pkg.revenue)}</TableCell>
                    <TableCell>{formatCurrency(pkg.revenue / pkg.bookings)}</TableCell>
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
          <CardTitle>Customer Insights</CardTitle>
          <CardDescription>Key customer metrics and behavior</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4 md:grid-cols-4">
            <div className="text-center p-4 border rounded-lg">
              <Users className="h-8 w-8 mx-auto mb-2 text-blue-500" />
              <div className="text-2xl font-bold">{customerMetrics.totalCustomers}</div>
              <div className="text-sm text-muted-foreground">Total Customers</div>
            </div>
            <div className="text-center p-4 border rounded-lg">
              <TrendingUp className="h-8 w-8 mx-auto mb-2 text-green-500" />
              <div className="text-2xl font-bold">{customerMetrics.newCustomers}</div>
              <div className="text-sm text-muted-foreground">New Customers</div>
            </div>
            <div className="text-center p-4 border rounded-lg">
              <Activity className="h-8 w-8 mx-auto mb-2 text-orange-500" />
              <div className="text-2xl font-bold">{customerMetrics.returningCustomers}</div>
              <div className="text-sm text-muted-foreground">Returning Customers</div>
            </div>
            <div className="text-center p-4 border rounded-lg">
              <Star className="h-8 w-8 mx-auto mb-2 text-yellow-500" />
              <div className="text-2xl font-bold">{customerMetrics.averageRating}</div>
              <div className="text-sm text-muted-foreground">Avg Rating</div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}