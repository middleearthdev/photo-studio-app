"use client"

import React, { useState, useEffect } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import {
  Bell,
  DollarSign,
  Calendar,
  CheckCircle,
  RefreshCw,
  Star,
  Phone,
  Send,
  Check,
  X,
  ExternalLink,
  Filter
} from "lucide-react"
import { usePaginatedReservations, useReservationStats } from "@/hooks/use-reservations"
import { format, parseISO, isToday, addDays } from "date-fns"
import { formatCurrency } from "@/lib/utils"
import {
  generateWhatsAppMessage,
  getWhatsAppURL,
  getDaysUntilReservation,
  getBookingPriority
} from "@/lib/utils/booking-rules"
import type { Reservation } from "@/actions/reservations"
import { useProfile } from "@/hooks/use-profile"

interface ReminderTask {
  id: string
  type: 'payment_followup' | 'schedule_today' | 'general_reminders' | 'feedback'
  priority: 'urgent' | 'high' | 'medium' | 'low'
  reservation: Reservation
  title: string
  description: string
  dueDate: string
  customerName: string
  customerPhone: string
  bookingCode: string
  status: 'pending' | 'sent' | 'completed' | 'skipped'
  lastAction?: string
  amount?: number
}

type TabType = 'payment_followup' | 'schedule_today' | 'general_reminders' | 'feedback'
type FilterType = 'all' | 'urgent'

const TAB_CONFIG = {
  payment_followup: {
    label: 'Follow Up Pembayaran',
    description: 'Customer yang perlu diingatkan untuk pelunasan',
    icon: DollarSign,
    color: 'text-yellow-600'
  },
  schedule_today: {
    label: 'Jadwal Hari Ini',
    description: 'Booking yang akan berlangsung hari ini',
    icon: Calendar,
    color: 'text-blue-600'
  },
  general_reminders: {
    label: 'Reminder Umum',
    description: 'Konfirmasi booking dan reminder lainnya',
    icon: Bell,
    color: 'text-orange-600'
  },
  feedback: {
    label: 'Request Feedback',
    description: 'Customer yang sudah selesai sesi untuk diminta feedback',
    icon: Star,
    color: 'text-green-600'
  }
}

const PRIORITY_COLORS = {
  urgent: 'bg-red-100 text-red-800 border-red-200',
  high: 'bg-orange-100 text-orange-800 border-orange-200',
  medium: 'bg-yellow-100 text-yellow-800 border-yellow-200',
  low: 'bg-green-100 text-green-800 border-green-200'
}

export default function RemindersPage() {
  const [activeTab, setActiveTab] = useState<TabType>('payment_followup')
  const [filter, setFilter] = useState<FilterType>('all')
  const [reminders, setReminders] = useState<ReminderTask[]>([])
  const [isLoading, setIsLoading] = useState(true)

  // Get user profile to get studio_id
  const { data: profile } = useProfile()
  const studioId = profile?.studio_id

  // Fetch reservations data
  const {
    data: reservationsData,
    isLoading: reservationsLoading,
    refetch: refreshReservations
  } = usePaginatedReservations(studioId || '', {
    page: 1,
    pageSize: 100,
    date_from: format(addDays(new Date(), -7), 'yyyy-MM-dd'),
    date_to: format(addDays(new Date(), 30), 'yyyy-MM-dd')
  })

  const reservations = reservationsData?.data || []

  // Generate reminder tasks from reservations
  useEffect(() => {
    if (!reservationsLoading && reservations.length > 0) {
      const tasks: ReminderTask[] = []

      reservations.forEach(reservation => {
        const daysUntil = getDaysUntilReservation(reservation.reservation_date)
        const customerName = reservation.customer?.full_name || reservation.guest_email || 'Guest Customer'
        const customerPhone = reservation.customer?.phone || reservation.guest_phone || ''
        const reservationDate = parseISO(reservation.reservation_date)

        // 1. Payment Follow-up Tasks
        if (reservation.payment_status !== 'completed' && reservation.remaining_amount > 0) {
          let taskPriority: 'urgent' | 'high' | 'medium' | 'low' = 'medium'
          let title = 'Reminder Pelunasan'

          if (daysUntil <= 0) {
            taskPriority = 'urgent'
            title = 'URGENT: Pelunasan Terlambat'
          } else if (daysUntil <= 3) {
            taskPriority = 'urgent'
            if (daysUntil === 3) {
              title = 'URGENT: Batas terakhir pelunasan hari ini'
            } else if (daysUntil === 2) {
              title = 'URGENT: Melewati batas H-3, pelunasan terlambat'
            } else {
              title = 'URGENT: Melewati batas H-3, pelunasan terlambat'
            }
          } else if (daysUntil <= 5) {
            taskPriority = 'high'
            title = 'Priority: Reminder Pelunasan'
          }

          tasks.push({
            id: `payment-${reservation.id}`,
            type: 'payment_followup',
            priority: taskPriority,
            reservation,
            title,
            description: `Sisa pembayaran ${formatCurrency(reservation.remaining_amount)} untuk booking ${reservation.package?.name || 'Custom'}. ${daysUntil === 3 ? 'Batas terakhir hari ini' : daysUntil === 2 ? 'Batas terakhir besok' : daysUntil <= 0 ? 'Sudah melewati deadline' : `Batas ${format(addDays(parseISO(reservation.reservation_date), -3), 'dd MMM yyyy')}`}`,
            dueDate: reservation.reservation_date,
            customerName,
            customerPhone,
            bookingCode: reservation.booking_code,
            status: 'pending',
            amount: reservation.remaining_amount
          })
        }

        // 2. Today's Schedule Tasks
        if (isToday(reservationDate) && ['confirmed', 'in_progress'].includes(reservation.status)) {
          tasks.push({
            id: `today-${reservation.id}`,
            type: 'schedule_today',
            priority: 'high',
            reservation,
            title: `Sesi Hari Ini - ${reservation.start_time}`,
            description: `${reservation.package?.name || 'Custom'} dengan ${customerName}`,
            dueDate: reservation.reservation_date,
            customerName,
            customerPhone,
            bookingCode: reservation.booking_code,
            status: 'pending'
          })
        }

        // 3. General Reminders
        // Booking confirmation reminders
        if (reservation.status === 'pending') {
          let taskPriority: 'urgent' | 'high' | 'medium' = 'medium'
          if (daysUntil <= 1) taskPriority = 'urgent'
          else if (daysUntil <= 3) taskPriority = 'high'

          tasks.push({
            id: `confirm-${reservation.id}`,
            type: 'general_reminders',
            priority: taskPriority,
            reservation,
            title: 'Konfirmasi Booking Diperlukan',
            description: `Booking ${reservation.package?.name || 'Custom'} belum dikonfirmasi`,
            dueDate: reservation.reservation_date,
            customerName,
            customerPhone,
            bookingCode: reservation.booking_code,
            status: 'pending'
          })
        }

        // Reschedule deadline reminder
        if (['confirmed', 'pending'].includes(reservation.status) && daysUntil === 3) {
          tasks.push({
            id: `reschedule-${reservation.id}`,
            type: 'general_reminders',
            priority: 'high',
            reservation,
            title: 'Batas Terakhir Reschedule',
            description: 'Batas terakhir reschedule hari ini',
            dueDate: reservation.reservation_date,
            customerName,
            customerPhone,
            bookingCode: reservation.booking_code,
            status: 'pending'
          })
        }

        // 4. Feedback Requests
        if (reservation.status === 'completed') {
          const daysSinceCompleted = Math.abs(daysUntil)
          if (daysSinceCompleted >= 1 && daysSinceCompleted <= 7) {
            tasks.push({
              id: `feedback-${reservation.id}`,
              type: 'feedback',
              priority: 'low',
              reservation,
              title: 'Request Customer Feedback',
              description: `Sesi selesai ${daysSinceCompleted} hari lalu - minta review/feedback`,
              dueDate: format(addDays(reservationDate, 7), 'yyyy-MM-dd'),
              customerName,
              customerPhone,
              bookingCode: reservation.booking_code,
              status: 'pending'
            })
          }
        }
      })

      // Sort tasks by priority and due date
      tasks.sort((a, b) => {
        const priorityOrder = { urgent: 0, high: 1, medium: 2, low: 3 }
        if (priorityOrder[a.priority] !== priorityOrder[b.priority]) {
          return priorityOrder[a.priority] - priorityOrder[b.priority]
        }
        return new Date(a.dueDate).getTime() - new Date(b.dueDate).getTime()
      })

      setReminders(tasks)
      setIsLoading(false)
    }
  }, [reservationsLoading, reservations])

  // Filter reminders by active tab and filter
  const filteredReminders = reminders.filter(reminder => {
    // Filter by tab
    if (reminder.type !== activeTab) return false

    // Filter by priority
    switch (filter) {
      case 'urgent':
        return reminder.priority === 'urgent'
      default:
        return true
    }
  })

  // Get stats for each tab
  const getTabStats = (tabType: TabType) => {
    const tabReminders = reminders.filter(r => r.type === tabType)
    return {
      total: tabReminders.length,
      urgent: tabReminders.filter(r => r.priority === 'urgent').length
    }
  }

  // Handle reminder actions
  const handleSendReminder = async (reminder: ReminderTask) => {
    try {
      let messageType: 'payment' | 'reschedule' | 'confirmation' = 'confirmation'

      if (reminder.type === 'payment_followup') {
        messageType = 'payment'
      } else if (reminder.title.includes('Reschedule')) {
        messageType = 'reschedule'
      }

      const message = generateWhatsAppMessage(reminder.reservation, messageType)
      const whatsappUrl = getWhatsAppURL(reminder.customerPhone, message)

      // Open WhatsApp
      window.open(whatsappUrl, '_blank')
    } catch (error) {
      console.error('Error sending reminder:', error)
    }
  }

  const ReminderCard = ({ reminder }: { reminder: ReminderTask }) => {
    const tabConfig = TAB_CONFIG[reminder.type]
    const IconComponent = tabConfig.icon

    return (
      <Card className="hover:shadow-md transition-shadow">
        <CardContent className="p-4">
          <div className="flex items-start justify-between gap-3">
            <div className="flex items-start gap-3 flex-1">
              <div className={`p-2 rounded-lg bg-gray-100 ${tabConfig.color}`}>
                <IconComponent className="h-4 w-4" />
              </div>

              <div className="space-y-2 flex-1">
                <div className="flex items-center gap-2 flex-wrap">
                  <h4 className="font-medium text-sm">{reminder.title}</h4>
                  <Badge className={PRIORITY_COLORS[reminder.priority]}>
                    {reminder.priority.toUpperCase()}
                  </Badge>
                </div>

                <div className="space-y-1">
                  <p className="text-sm font-medium text-gray-900">{reminder.customerName}</p>
                  <p className="text-xs text-gray-600">{reminder.description}</p>
                  {reminder.amount && (
                    <p className="text-sm font-semibold text-red-600">
                      {formatCurrency(reminder.amount)}
                    </p>
                  )}
                  <div className="flex items-center gap-4 text-xs text-gray-500">
                    <span>#{reminder.bookingCode}</span>
                    <span>Target: {format(parseISO(reminder.dueDate), 'dd MMM yyyy')}</span>
                    {reminder.customerPhone && (
                      <span className="flex items-center gap-1">
                        <Phone className="h-3 w-3" />
                        {reminder.customerPhone}
                      </span>
                    )}
                  </div>
                </div>
              </div>
            </div>

            <div className="flex flex-col gap-2">
              <Button
                size="sm"
                onClick={() => handleSendReminder(reminder)}
                className="h-8 text-xs"
                disabled={!reminder.customerPhone}
              >
                <Send className="h-3 w-3 mr-1" />
                Kirim
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>
    )
  }

  if (!studioId) {
    return (
      <div className="flex-1 space-y-4 p-4">
        <div className="flex items-center justify-center h-64">
          <div className="text-center">
            <p className="text-lg font-medium text-gray-900">Tidak ada akses studio</p>
            <p className="text-sm text-gray-500 mt-1">Anda perlu ditugaskan ke studio untuk mengakses halaman ini.</p>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6 p-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Reminder Management</h1>
          <p className="text-muted-foreground">
            Kelola reminder dan follow-up untuk customer secara efisien
          </p>
        </div>
        <Button
          variant="outline"
          onClick={() => refreshReservations()}
          className="gap-2"
        >
          <RefreshCw className="h-4 w-4" />
          Refresh Data
        </Button>
      </div>

      {/* Summary Stats */}
      <div className="grid gap-4 md:grid-cols-4">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-2">
              <DollarSign className="h-5 w-5 text-yellow-600" />
              <div>
                <div className="text-2xl font-bold">{getTabStats('payment_followup').total}</div>
                <div className="text-sm text-gray-600">Follow-up Pembayaran</div>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-2">
              <Calendar className="h-5 w-5 text-blue-600" />
              <div>
                <div className="text-2xl font-bold">{getTabStats('schedule_today').total}</div>
                <div className="text-sm text-gray-600">Jadwal Hari Ini</div>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-2">
              <Bell className="h-5 w-5 text-orange-600" />
              <div>
                <div className="text-2xl font-bold">{getTabStats('general_reminders').total}</div>
                <div className="text-sm text-gray-600">Reminder Umum</div>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-2">
              <Star className="h-5 w-5 text-green-600" />
              <div>
                <div className="text-2xl font-bold">{getTabStats('feedback').total}</div>
                <div className="text-sm text-gray-600">Request Feedback</div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Vertical Tabs Layout */}
      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
        {/* Vertical Tab Menu */}
        <div className="lg:col-span-1">
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Kategori Reminder</CardTitle>
            </CardHeader>
            <CardContent className="p-0">
              <div className="space-y-1">
                {Object.entries(TAB_CONFIG).map(([key, config]) => {
                  const tabKey = key as TabType
                  const stats = getTabStats(tabKey)
                  const IconComponent = config.icon

                  return (
                    <button
                      key={key}
                      onClick={() => setActiveTab(tabKey)}
                      className={`w-full text-left p-3 rounded-sm transition-colors hover:bg-gray-50 ${activeTab === key ? 'bg-blue-50 border-l-4 ' : ''
                        }`}
                    >
                      <div className="flex items-center gap-3">
                        <IconComponent className={`h-5 w-5 ${config.color}`} />
                        <div className="flex-1">
                          <div className="font-medium text-sm">{config.label}</div>
                          <div className="text-xs text-gray-500 mt-1">{config.description}</div>
                          <div className="flex items-center gap-2 mt-2">
                            <Badge variant="outline" className="text-xs">
                              {stats.total} total
                            </Badge>
                            {stats.urgent > 0 && (
                              <Badge variant="destructive" className="text-xs">
                                {stats.urgent} urgent
                              </Badge>
                            )}
                          </div>
                        </div>
                      </div>
                    </button>
                  )
                })}
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Content Area */}
        <div className="lg:col-span-3">
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle className="flex items-center gap-2">
                    {React.createElement(TAB_CONFIG[activeTab].icon, {
                      className: `h-5 w-5 ${TAB_CONFIG[activeTab].color}`
                    })}
                    {TAB_CONFIG[activeTab].label}
                  </CardTitle>
                  <CardDescription>
                    {TAB_CONFIG[activeTab].description}
                  </CardDescription>
                </div>

                <Select value={filter} onValueChange={(value) => setFilter(value as FilterType)}>
                  <SelectTrigger className="w-48">
                    <Filter className="h-4 w-4 mr-2" />
                    <SelectValue placeholder="Filter reminder" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Semua</SelectItem>
                    <SelectItem value="urgent">Urgent Saja</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </CardHeader>

            <CardContent>
              <div className="space-y-4">
                {isLoading ? (
                  <div className="flex justify-center py-8">
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
                  </div>
                ) : filteredReminders.length === 0 ? (
                  <div className="text-center py-8">
                    <CheckCircle className="h-12 w-12 mx-auto mb-4 text-green-500" />
                    <h3 className="text-lg font-medium mb-2">Tidak ada reminder</h3>
                    <p className="text-gray-600">
                      {filter === 'all'
                        ? 'Tidak ada reminder untuk kategori ini'
                        : 'Tidak ada reminder urgent untuk kategori ini'
                      }
                    </p>
                  </div>
                ) : (
                  filteredReminders.map(reminder => (
                    <ReminderCard key={reminder.id} reminder={reminder} />
                  ))
                )}
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}