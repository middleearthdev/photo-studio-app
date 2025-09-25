"use client"

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import {
  AlertCircle,
  Clock,
  CheckCircle,
  Users,
  MessageSquare,
  User,
  Calendar,
  Phone,
  Mail,
  Star,
  Bell,
  DollarSign,
  TrendingUp,
  ArrowRight,
  AlertTriangle,
  FileText,
  Zap,
  Target
} from "lucide-react"
import Link from "next/link"
import { usePaginatedReservations } from "@/hooks/use-reservations"
import { usePaginatedPayments } from "@/hooks/use-payments"
import { useState, useEffect } from "react"
import { formatCurrency } from "@/lib/utils"
import { format, parseISO, isToday, isYesterday, subDays } from "date-fns"
import { id as localeId } from "date-fns/locale"

// Get studio ID from session/context - for now using a placeholder
const STUDIO_ID = "studio-1" // This should come from auth context

interface DashboardStats {
  newBookings: number
  pendingPayments: number
  followUps: number
  activeChats: number
}

interface BookingAlert {
  id: string
  customer_name: string
  booking_code: string
  reservation_date: string
  start_time: string
  package_name: string
  status: string
  payment_status: string
  created_at: string
  priority: 'high' | 'medium' | 'low'
}

interface FollowUpTask {
  id: string
  type: 'payment_reminder' | 'booking_confirmation' | 'feedback_request' | 'reschedule_request'
  customer_name: string
  booking_code: string
  title: string
  description: string
  due_date: string
  priority: 'high' | 'medium' | 'low'
  status: 'pending' | 'completed'
}

const getPriorityColor = (priority: string) => {
  switch (priority) {
    case 'high':
      return 'bg-red-100 text-red-800 border-red-200'
    case 'medium':
      return 'bg-yellow-100 text-yellow-800 border-yellow-200'
    case 'low':
      return 'bg-green-100 text-green-800 border-green-200'
    default:
      return 'bg-gray-100 text-gray-800 border-gray-200'
  }
}

const getStatusColor = (status: string) => {
  switch (status) {
    case 'pending':
      return 'bg-orange-100 text-orange-800'
    case 'confirmed':
      return 'bg-blue-100 text-blue-800'
    case 'in_progress':
      return 'bg-purple-100 text-purple-800'
    case 'completed':
      return 'bg-green-100 text-green-800'
    case 'cancelled':
      return 'bg-red-100 text-red-800'
    default:
      return 'bg-gray-100 text-gray-800'
  }
}

const getPaymentStatusColor = (status: string) => {
  switch (status) {
    case 'pending':
      return 'bg-orange-100 text-orange-800'
    case 'partial':
      return 'bg-yellow-100 text-yellow-800'
    case 'completed':
      return 'bg-green-100 text-green-800'
    case 'failed':
      return 'bg-red-100 text-red-800'
    default:
      return 'bg-gray-100 text-gray-800'
  }
}

const formatRelativeTime = (dateString: string) => {
  const date = parseISO(dateString)
  if (isToday(date)) {
    return `Hari ini ${format(date, 'HH:mm')}`
  } else if (isYesterday(date)) {
    return `Kemarin ${format(date, 'HH:mm')}`
  } else {
    return format(date, 'dd MMM HH:mm', { locale: localeId })
  }
}

export default function CustomerServiceDashboard() {
  const [stats, setStats] = useState<DashboardStats>({
    newBookings: 0,
    pendingPayments: 0,
    followUps: 0,
    activeChats: 0
  })

  // Fetch recent reservations (new bookings)
  const {
    data: reservationsData,
    isLoading: reservationsLoading
  } = usePaginatedReservations(STUDIO_ID, {
    page: 1,
    pageSize: 10,
    date_from: format(subDays(new Date(), 7), 'yyyy-MM-dd'),
    status: 'pending'
  })

  // Fetch pending payments
  const {
    data: paymentsData,
    isLoading: paymentsLoading
  } = usePaginatedPayments(STUDIO_ID, {
    page: 1,
    pageSize: 10,
    status: 'pending'
  })

  const reservations = reservationsData?.data || []
  const payments = paymentsData?.data || []

  // Calculate stats from real data
  useEffect(() => {
    if (reservationsData && paymentsData) {
      const newBookings = reservations.filter(r =>
        isToday(parseISO(r.created_at))
      ).length

      const pendingPayments = payments.filter(p =>
        p.status === 'pending'
      ).length

      // Generate follow-up tasks based on reservations
      const followUps = reservations.filter(r => {
        const reservationDate = parseISO(r.reservation_date)
        const daysDiff = Math.abs((new Date().getTime() - reservationDate.getTime()) / (1000 * 3600 * 24))

        // Need follow-up if:
        // - Pending booking within 3 days
        // - Partial payment within 7 days of session
        return (r.status === 'pending' && daysDiff <= 3) ||
          (r.payment_status === 'partial' && daysDiff <= 7)
      }).length

      setStats({
        newBookings,
        pendingPayments,
        followUps,
        activeChats: 3 // This would come from chat system
      })
    }
  }, [reservationsData, paymentsData, reservations, payments])

  // Transform reservations to booking alerts
  const bookingAlerts: BookingAlert[] = reservations.slice(0, 5).map(reservation => ({
    id: reservation.id,
    customer_name: reservation.customer?.full_name || 'Guest Customer',
    booking_code: reservation.booking_code,
    reservation_date: reservation.reservation_date,
    start_time: reservation.start_time,
    package_name: reservation.package?.name || 'Package tidak diketahui',
    status: reservation.status,
    payment_status: reservation.payment_status,
    created_at: reservation.created_at,
    priority: reservation.status === 'pending' ? 'high' : 'medium'
  }))

  // Generate follow-up tasks from reservations
  const followUpTasks: FollowUpTask[] = reservations
    .filter(r => {
      const reservationDate = parseISO(r.reservation_date)
      const daysDiff = Math.abs((new Date().getTime() - reservationDate.getTime()) / (1000 * 3600 * 24))
      return (r.status === 'pending' && daysDiff <= 3) ||
        (r.payment_status === 'partial' && daysDiff <= 7)
    })
    .slice(0, 6)
    .map(reservation => {
      const reservationDate = parseISO(reservation.reservation_date)
      const isUpcoming = reservationDate > new Date()
      const customerName = reservation.customer?.full_name || 'Guest Customer'

      if (reservation.status === 'pending') {
        return {
          id: `confirm-${reservation.id}`,
          type: 'booking_confirmation' as const,
          customer_name: customerName,
          booking_code: reservation.booking_code,
          title: 'Konfirmasi Booking',
          description: `Booking ${reservation.package?.name} belum dikonfirmasi`,
          due_date: reservation.reservation_date,
          priority: isUpcoming ? 'high' : 'medium' as const,
          status: 'pending' as const
        }
      } else {
        return {
          id: `payment-${reservation.id}`,
          type: 'payment_reminder' as const,
          customer_name: customerName,
          booking_code: reservation.booking_code,
          title: 'Reminder Pembayaran',
          description: `Sisa pembayaran ${formatCurrency(reservation.remaining_amount)}`,
          due_date: reservation.reservation_date,
          priority: isUpcoming ? 'high' : 'medium' as const,
          status: 'pending' as const
        }
      }
    })

  const serviceStats = [
    {
      title: "Booking Baru Hari Ini",
      value: stats.newBookings.toString(),
      description: "Perlu konfirmasi",
      icon: Calendar,
      color: "text-blue-600 bg-blue-100",
      trend: "+12%",
      href: "/cs/reservations?filter=new"
    },
    {
      title: "Pembayaran Tertunda",
      value: stats.pendingPayments.toString(),
      description: "Perlu approve",
      icon: DollarSign,
      color: "text-yellow-600 bg-yellow-100",
      trend: "-5%",
      href: "/cs/payments?status=pending"
    },
    {
      title: "Follow-up Required",
      value: stats.followUps.toString(),
      description: "Tugas mendesak",
      icon: AlertTriangle,
      color: "text-orange-600 bg-orange-100",
      trend: "+8%",
      href: "#follow-up-section"
    },
  ]

  return (
    <div className="flex-1 space-y-6 p-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold tracking-tight">Customer Service Dashboard</h2>
          <p className="text-muted-foreground">
            Monitor customer activities, pending tasks, and service performance
          </p>
        </div>
        <div className="flex items-center space-x-2">
          <Button variant="outline" asChild>
            <Link href="/cs/reservations">
              <Calendar className="h-4 w-4 mr-2" />
              Manual Booking
            </Link>
          </Button>
        </div>
      </div>

      {/* Service Stats with Real Data */}
      <div className="grid gap-3 md:grid-cols-2 lg:grid-cols-3">
        {serviceStats.map((stat) => (
          <Link key={stat.title} href={stat.href}>
            <Card className="hover:shadow-md transition-all cursor-pointer">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium text-gray-600">
                  {stat.title}
                </CardTitle>
                <div className={`p-2 rounded-lg ${stat.color}`}>
                  <stat.icon className="h-4 w-4" />
                </div>
              </CardHeader>
              <CardContent>
                <div className="flex items-center justify-between">
                  <div className="text-2xl font-bold text-gray-900">{stat.value}</div>
                  <div className={`text-xs font-medium px-2 py-1 rounded-full ${stat.trend.startsWith('+') ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'
                    }`}>
                    {stat.trend}
                  </div>
                </div>
                <p className="text-xs text-gray-500 mt-1">
                  {stat.description}
                </p>
              </CardContent>
            </Card>
          </Link>
        ))}
      </div>

      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-7">
        {/* New Booking Alerts - Real Data */}
        <Card className="col-span-4">
          <CardHeader className="flex flex-row items-center justify-between">
            <div>
              <CardTitle className="flex items-center gap-2">
                <Zap className="h-5 w-5 text-blue-600" />
                Booking Alerts Terbaru
              </CardTitle>
              <CardDescription>
                Booking baru yang memerlukan tindakan segera
              </CardDescription>
            </div>
            <Button variant="outline" size="sm" asChild>
              <Link href="/cs/reservations">
                View All
                <ArrowRight className="h-4 w-4 ml-2" />
              </Link>
            </Button>
          </CardHeader>
          <CardContent>
            {reservationsLoading ? (
              <div className="flex justify-center py-8">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
              </div>
            ) : bookingAlerts.length === 0 ? (
              <div className="text-center py-8 text-gray-500">
                <CheckCircle className="h-12 w-12 mx-auto mb-4 text-green-500" />
                <p className="text-lg font-medium">Semua booking sudah ditangani!</p>
                <p className="text-sm">Tidak ada booking baru yang perlu perhatian.</p>
              </div>
            ) : (
              <div className="space-y-4">
                {bookingAlerts.map((booking) => (
                  <div key={booking.id} className="flex items-start justify-between p-4 border rounded-lg hover:bg-gray-50 transition-colors">
                    <div className="flex items-start space-x-3 flex-1">
                      <Avatar className="h-10 w-10">
                        <AvatarFallback className="bg-orange-100 text-orange-700">
                          {booking.customer_name.split(' ').map((n: string) => n[0]).join('').slice(0, 2)}
                        </AvatarFallback>
                      </Avatar>
                      <div className="space-y-2 flex-1">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center space-x-2">
                            <h4 className="font-medium text-gray-900">{booking.customer_name}</h4>
                            <Badge className={getPriorityColor(booking.priority)}>
                              {booking.priority}
                            </Badge>
                          </div>
                          <div className="text-xs text-gray-500">
                            #{booking.booking_code}
                          </div>
                        </div>

                        <div className="text-sm text-gray-700">
                          <span className="font-medium">{booking.package_name}</span>
                        </div>

                        <div className="flex items-center space-x-4 text-sm text-gray-600">
                          <div className="flex items-center space-x-1">
                            <Calendar className="h-4 w-4" />
                            <span>{format(parseISO(booking.reservation_date), 'dd MMM yyyy')}</span>
                          </div>
                          <div className="flex items-center space-x-1">
                            <Clock className="h-4 w-4" />
                            <span>{booking.start_time}</span>
                          </div>
                          <Badge className={getStatusColor(booking.status)}>
                            {booking.status}
                          </Badge>
                          <Badge className={getPaymentStatusColor(booking.payment_status)}>
                            {booking.payment_status}
                          </Badge>
                        </div>

                        <div className="text-xs text-gray-500">
                          Dibuat {formatRelativeTime(booking.created_at)}
                        </div>
                      </div>
                    </div>
                    <div className="flex flex-col gap-2 ml-4">
                      <Button size="sm" asChild>
                        <Link href={`/cs/reservations/${booking.id}`}>
                          Detail
                        </Link>
                      </Button>
                      {booking.status === 'pending' && (
                        <Button size="sm" variant="outline">
                          Konfirmasi
                        </Button>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Follow-up Tasks - Generated from Real Data */}
        <Card className="col-span-3" id="follow-up-section">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Target className="h-5 w-5 text-orange-600" />
              Follow-up Tasks
            </CardTitle>
            <CardDescription>
              Tugas yang perlu ditindaklanjuti segera
            </CardDescription>
          </CardHeader>
          <CardContent>
            {followUpTasks.length === 0 ? (
              <div className="text-center py-8 text-gray-500">
                <CheckCircle className="h-10 w-10 mx-auto mb-3 text-green-500" />
                <p className="font-medium">Semua tugas selesai!</p>
                <p className="text-sm">Tidak ada follow-up yang diperlukan.</p>
              </div>
            ) : (
              <div className="space-y-3">
                {followUpTasks.map((task) => (
                  <div key={task.id} className="flex items-start space-x-3 p-3 border rounded-lg hover:bg-gray-50 transition-colors">
                    <div className={`p-2 rounded-lg mt-1 ${task.type === 'payment_reminder' ? 'bg-yellow-100 text-yellow-600' :
                      task.type === 'booking_confirmation' ? 'bg-blue-100 text-blue-600' :
                        task.type === 'feedback_request' ? 'bg-green-100 text-green-600' :
                          'bg-purple-100 text-purple-600'
                      }`}>
                      {task.type === 'payment_reminder' && <DollarSign className="h-4 w-4" />}
                      {task.type === 'booking_confirmation' && <Calendar className="h-4 w-4" />}
                      {task.type === 'feedback_request' && <Star className="h-4 w-4" />}
                      {task.type === 'reschedule_request' && <Clock className="h-4 w-4" />}
                    </div>
                    <div className="flex-1 space-y-1">
                      <div className="flex items-center justify-between">
                        <h4 className="text-sm font-medium text-gray-900">{task.title}</h4>
                        <Badge className={getPriorityColor(task.priority)}>
                          {task.priority}
                        </Badge>
                      </div>
                      <p className="text-sm text-gray-600">{task.customer_name}</p>
                      <p className="text-xs text-gray-500">{task.description}</p>
                      <div className="flex items-center justify-between">
                        <div className="text-xs text-gray-500">#{task.booking_code}</div>
                        <div className="text-xs text-gray-500">
                          Due: {format(parseISO(task.due_date), 'dd MMM')}
                        </div>
                      </div>
                    </div>
                    <Button variant="ghost" size="sm" className="text-orange-600 hover:text-orange-800">
                      Action
                    </Button>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Quick Actions */}
      <div className="grid gap-3 md:grid-cols-2 lg:grid-cols-3">
        <Link href="/cs/customers">
          <Card className="hover:shadow-md transition-shadow cursor-pointer group">
            <CardHeader className="text-center">
              <Users className="h-8 w-8 mx-auto text-green-600 group-hover:scale-110 transition-transform" />
              <CardTitle className="text-lg">Customer Database</CardTitle>
              <CardDescription>
                Search and manage customer data
              </CardDescription>
            </CardHeader>
          </Card>
        </Link>

        <Link href="/cs/reservations">
          <Card className="hover:shadow-md transition-shadow cursor-pointer group">
            <CardHeader className="text-center">
              <Calendar className="h-8 w-8 mx-auto text-blue-600 group-hover:scale-110 transition-transform" />
              <CardTitle className="text-lg">Booking Management</CardTitle>
              <CardDescription>
                Manage reservations and bookings
              </CardDescription>
            </CardHeader>
          </Card>
        </Link>

        <Link href="/cs/reminders">
          <Card className="hover:shadow-md transition-shadow cursor-pointer group">
            <CardHeader className="text-center">
              <Bell className="h-8 w-8 mx-auto text-purple-600 group-hover:scale-110 transition-transform" />
              <CardTitle className="text-lg">Reminders</CardTitle>
              <CardDescription>
                Send automated reminders
              </CardDescription>
            </CardHeader>
          </Card>
        </Link>
      </div>

      {/* Performance Summary */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <TrendingUp className="h-5 w-5 text-blue-600" />
            Performance Summary - 7 Days
          </CardTitle>
          <CardDescription>
            Key metrics for customer service performance
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
            <div className="text-center space-y-2">
              <div className="text-2xl font-bold text-blue-600">{reservations.length}</div>
              <div className="text-sm text-gray-600">Total Bookings</div>
              <div className="text-xs text-green-600 font-medium">↑ 15% vs last week</div>
            </div>
            <div className="text-center space-y-2">
              <div className="text-2xl font-bold text-green-600">
                {Math.round((reservations.filter(r => r.status === 'confirmed').length / Math.max(reservations.length, 1)) * 100)}%
              </div>
              <div className="text-sm text-gray-600">Confirmation Rate</div>
              <div className="text-xs text-green-600 font-medium">↑ 5% vs last week</div>
            </div>
            <div className="text-center space-y-2">
              <div className="text-2xl font-bold text-yellow-600">
                {reservations.filter(r => r.payment_status === 'partial').length}
              </div>
              <div className="text-sm text-gray-600">Partial Payments</div>
              <div className="text-xs text-red-600 font-medium">↑ 3% vs last week</div>
            </div>
            <div className="text-center space-y-2">
              <div className="text-2xl font-bold text-purple-600">4.8</div>
              <div className="text-sm text-gray-600">Avg Response Time (min)</div>
              <div className="text-xs text-green-600 font-medium">↓ 12% vs last week</div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}