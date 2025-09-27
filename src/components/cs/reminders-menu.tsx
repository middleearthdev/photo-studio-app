"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Separator } from "@/components/ui/separator"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import {
  Bell,
  Clock,
  DollarSign,
  Calendar,
  MessageSquare,
  CheckCircle,
  AlertTriangle,
  MoreVertical,
  Send,
  Filter,
  RefreshCw,
  Star,
  Phone,
  Mail,
  Check,
  X,
  ExternalLink
} from "lucide-react"
import Link from "next/link"
import { usePaginatedReservations } from "@/hooks/use-reservations"
import { format, parseISO, isToday, addDays } from "date-fns"
import { id as localeId } from "date-fns/locale"
import { formatCurrency } from "@/lib/utils"
import {
  generateWhatsAppMessage,
  getWhatsAppURL,
  getDaysUntilReservation,
  getBookingPriority
} from "@/lib/utils/booking-rules"
import type { Reservation } from "@/actions/reservations"

const STUDIO_ID = "studio-1"

interface ReminderTask {
  id: string
  type: 'payment' | 'confirmation' | 'reschedule' | 'feedback' | 'follow_up'
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
  scheduledFor?: string
}

type FilterType = 'all' | 'urgent' | 'today' | 'pending' | 'completed'
type SortType = 'priority' | 'dueDate' | 'created' | 'customer'

const REMINDER_TYPES = {
  payment: {
    icon: DollarSign,
    color: 'bg-yellow-100 text-yellow-800 border-yellow-200',
    label: 'Payment Reminder'
  },
  confirmation: {
    icon: CheckCircle,
    color: 'bg-blue-100 text-blue-800 border-blue-200',
    label: 'Booking Confirmation'
  },
  reschedule: {
    icon: Calendar,
    color: 'bg-purple-100 text-purple-800 border-purple-200',
    label: 'Reschedule Notice'
  },
  feedback: {
    icon: Star,
    color: 'bg-green-100 text-green-800 border-green-200',
    label: 'Feedback Request'
  },
  follow_up: {
    icon: Bell,
    color: 'bg-orange-100 text-orange-800 border-orange-200',
    label: 'Follow Up'
  }
}

const PRIORITY_COLORS = {
  urgent: 'bg-red-100 text-red-800 border-red-200',
  high: 'bg-orange-100 text-orange-800 border-orange-200',
  medium: 'bg-yellow-100 text-yellow-800 border-yellow-200',
  low: 'bg-green-100 text-green-800 border-green-200'
}

export function RemindersMenu() {
  const [filter, setFilter] = useState<FilterType>('all')
  const [sortBy, setSortBy] = useState<SortType>('priority')
  const [reminders, setReminders] = useState<ReminderTask[]>([])
  const [isLoading, setIsLoading] = useState(true)

  // Fetch reservations data
  const {
    data: reservationsData,
    isLoading: reservationsLoading,
    refetch: refreshReservations
  } = usePaginatedReservations(STUDIO_ID, {
    page: 1,
    pageSize: 50,
    date_from: format(new Date(), 'yyyy-MM-dd'),
    date_to: format(addDays(new Date(), 30), 'yyyy-MM-dd')
  })

  const reservations = reservationsData?.data || []

  // Generate reminder tasks from reservations
  useEffect(() => {
    if (!reservationsLoading && reservations.length > 0) {
      const tasks: ReminderTask[] = []

      reservations.forEach(reservation => {
        const daysUntil = getDaysUntilReservation(reservation.reservation_date)
        const priority = getBookingPriority(reservation)
        const customerName = reservation.customer?.full_name || 'Guest Customer'
        const customerPhone = reservation.customer?.phone || ''

        // Payment reminders
        if (reservation.payment_status !== 'completed' && reservation.remaining_amount > 0 && daysUntil >= 0) {
          if (daysUntil <= 3) {
            tasks.push({
              id: `payment-${reservation.id}`,
              type: 'payment',
              priority: daysUntil <= 1 ? 'urgent' : 'high',
              reservation,
              title: 'Payment Reminder Urgent',
              description: `Sisa pembayaran ${formatCurrency(reservation.remaining_amount)} - H${daysUntil === 0 ? '' : `-${daysUntil}`}`,
              dueDate: reservation.reservation_date,
              customerName,
              customerPhone,
              bookingCode: reservation.booking_code,
              status: 'pending'
            })
          } else if (daysUntil <= 7) {
            tasks.push({
              id: `payment-${reservation.id}`,
              type: 'payment',
              priority: 'medium',
              reservation,
              title: 'Payment Reminder',
              description: `Sisa pembayaran ${formatCurrency(reservation.remaining_amount)} - ${daysUntil} hari lagi`,
              dueDate: reservation.reservation_date,
              customerName,
              customerPhone,
              bookingCode: reservation.booking_code,
              status: 'pending'
            })
          }
        }

        // Booking confirmation reminders
        if (reservation.status === 'pending') {
          tasks.push({
            id: `confirmation-${reservation.id}`,
            type: 'confirmation',
            priority: daysUntil <= 2 ? 'urgent' : daysUntil <= 5 ? 'high' : 'medium',
            reservation,
            title: 'Booking Confirmation Required',
            description: `Booking ${reservation.package?.name} belum dikonfirmasi`,
            dueDate: reservation.reservation_date,
            customerName,
            customerPhone,
            bookingCode: reservation.booking_code,
            status: 'pending'
          })
        }

        // Reschedule notice (H-3 rule)
        if (['confirmed', 'partial'].includes(reservation.status) && daysUntil <= 3 && daysUntil > 0) {
          tasks.push({
            id: `reschedule-${reservation.id}`,
            type: 'reschedule',
            priority: 'high',
            reservation,
            title: 'Reschedule Deadline Notice',
            description: `Batas reschedule H-3 dalam ${daysUntil} hari`,
            dueDate: reservation.reservation_date,
            customerName,
            customerPhone,
            bookingCode: reservation.booking_code,
            status: 'pending'
          })
        }

        // Post-session feedback (completed bookings)
        if (reservation.status === 'completed' && daysUntil < 0 && Math.abs(daysUntil) <= 7) {
          tasks.push({
            id: `feedback-${reservation.id}`,
            type: 'feedback',
            priority: 'low',
            reservation,
            title: 'Request Customer Feedback',
            description: `Session selesai ${Math.abs(daysUntil)} hari lalu`,
            dueDate: format(addDays(parseISO(reservation.reservation_date), 7), 'yyyy-MM-dd'),
            customerName,
            customerPhone,
            bookingCode: reservation.booking_code,
            status: 'pending'
          })
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

  // Filter reminders based on selected filter
  const filteredReminders = reminders.filter(reminder => {
    switch (filter) {
      case 'urgent':
        return reminder.priority === 'urgent'
      case 'today':
        return isToday(parseISO(reminder.dueDate))
      case 'pending':
        return reminder.status === 'pending'
      case 'completed':
        return reminder.status === 'completed'
      default:
        return true
    }
  })

  // Get summary stats
  const stats = {
    total: reminders.length,
    urgent: reminders.filter(r => r.priority === 'urgent').length,
    pending: reminders.filter(r => r.status === 'pending').length,
    dueToday: reminders.filter(r => isToday(parseISO(r.dueDate))).length
  }

  // Handle reminder actions
  const handleSendReminder = async (reminder: ReminderTask) => {
    try {
      const message = generateWhatsAppMessage(reminder.reservation, reminder.type as any)
      const whatsappUrl = getWhatsAppURL(reminder.customerPhone, message)
      
      // Update reminder status
      setReminders(prev => prev.map(r => 
        r.id === reminder.id 
          ? { ...r, status: 'sent', lastAction: `Sent via WhatsApp at ${format(new Date(), 'HH:mm')}` }
          : r
      ))

      // Open WhatsApp
      window.open(whatsappUrl, '_blank')
    } catch (error) {
      console.error('Error sending reminder:', error)
    }
  }

  const handleMarkCompleted = (reminder: ReminderTask) => {
    setReminders(prev => prev.map(r => 
      r.id === reminder.id 
        ? { ...r, status: 'completed', lastAction: `Marked completed at ${format(new Date(), 'HH:mm')}` }
        : r
    ))
  }

  const handleSkipReminder = (reminder: ReminderTask) => {
    setReminders(prev => prev.map(r => 
      r.id === reminder.id 
        ? { ...r, status: 'skipped', lastAction: `Skipped at ${format(new Date(), 'HH:mm')}` }
        : r
    ))
  }

  const ReminderCard = ({ reminder }: { reminder: ReminderTask }) => {
    const typeConfig = REMINDER_TYPES[reminder.type]
    const TypeIcon = typeConfig.icon

    return (
      <Card className="hover:shadow-md transition-shadow">
        <CardContent className="p-4">
          <div className="flex items-start justify-between gap-3">
            <div className="flex items-start gap-3 flex-1">
              <div className={`p-2 rounded-lg ${typeConfig.color}`}>
                <TypeIcon className="h-4 w-4" />
              </div>
              
              <div className="space-y-2 flex-1">
                <div className="flex items-center gap-2">
                  <h4 className="font-medium text-sm">{reminder.title}</h4>
                  <Badge className={PRIORITY_COLORS[reminder.priority]}>
                    {reminder.priority}
                  </Badge>
                  {reminder.status !== 'pending' && (
                    <Badge variant="outline">
                      {reminder.status}
                    </Badge>
                  )}
                </div>
                
                <div className="space-y-1">
                  <p className="text-sm text-gray-600">{reminder.customerName}</p>
                  <p className="text-xs text-gray-500">{reminder.description}</p>
                  <div className="flex items-center gap-4 text-xs text-gray-500">
                    <span>#{reminder.bookingCode}</span>
                    <span>Due: {format(parseISO(reminder.dueDate), 'dd MMM yyyy')}</span>
                  </div>
                  {reminder.lastAction && (
                    <p className="text-xs text-green-600">{reminder.lastAction}</p>
                  )}
                </div>
              </div>
            </div>

            <div className="flex flex-col gap-2">
              {reminder.status === 'pending' && (
                <>
                  <Button
                    size="sm"
                    onClick={() => handleSendReminder(reminder)}
                    className="h-8"
                  >
                    <Send className="h-3 w-3 mr-1" />
                    Send
                  </Button>
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button variant="outline" size="sm" className="h-8 w-8 p-0">
                        <MoreVertical className="h-3 w-3" />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent>
                      <DropdownMenuItem onClick={() => handleMarkCompleted(reminder)}>
                        <Check className="h-4 w-4 mr-2" />
                        Mark Completed
                      </DropdownMenuItem>
                      <DropdownMenuItem onClick={() => handleSkipReminder(reminder)}>
                        <X className="h-4 w-4 mr-2" />
                        Skip
                      </DropdownMenuItem>
                      <DropdownMenuSeparator />
                      <DropdownMenuItem asChild>
                        <Link href={`/cs/reservations/${reminder.reservation.id}`}>
                          <ExternalLink className="h-4 w-4 mr-2" />
                          View Booking
                        </Link>
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </>
              )}
              
              {reminder.status === 'sent' && (
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => handleMarkCompleted(reminder)}
                  className="h-8"
                >
                  <Check className="h-3 w-3 mr-1" />
                  Complete
                </Button>
              )}
            </div>
          </div>
        </CardContent>
      </Card>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Reminders</h1>
          <p className="text-muted-foreground">
            Manage customer reminders and follow-up tasks
          </p>
        </div>
        <Button
          variant="outline"
          onClick={() => refreshReservations()}
          className="gap-2"
        >
          <RefreshCw className="h-4 w-4" />
          Refresh
        </Button>
      </div>

      {/* Stats Cards */}
      <div className="grid gap-4 md:grid-cols-4">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-2">
              <Bell className="h-5 w-5 text-blue-600" />
              <div>
                <div className="text-2xl font-bold">{stats.total}</div>
                <div className="text-sm text-gray-600">Total Reminders</div>
              </div>
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-2">
              <AlertTriangle className="h-5 w-5 text-red-600" />
              <div>
                <div className="text-2xl font-bold text-red-600">{stats.urgent}</div>
                <div className="text-sm text-gray-600">Urgent</div>
              </div>
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-2">
              <Clock className="h-5 w-5 text-orange-600" />
              <div>
                <div className="text-2xl font-bold text-orange-600">{stats.pending}</div>
                <div className="text-sm text-gray-600">Pending</div>
              </div>
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-2">
              <Calendar className="h-5 w-5 text-green-600" />
              <div>
                <div className="text-2xl font-bold text-green-600">{stats.dueToday}</div>
                <div className="text-sm text-gray-600">Due Today</div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Filters and Controls */}
      <div className="flex items-center gap-4">
        <Select value={filter} onValueChange={(value) => setFilter(value as FilterType)}>
          <SelectTrigger className="w-48">
            <Filter className="h-4 w-4 mr-2" />
            <SelectValue placeholder="Filter reminders" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Reminders</SelectItem>
            <SelectItem value="urgent">Urgent Only</SelectItem>
            <SelectItem value="today">Due Today</SelectItem>
            <SelectItem value="pending">Pending</SelectItem>
            <SelectItem value="completed">Completed</SelectItem>
          </SelectContent>
        </Select>

        <Select value={sortBy} onValueChange={(value) => setSortBy(value as SortType)}>
          <SelectTrigger className="w-48">
            <SelectValue placeholder="Sort by" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="priority">Priority</SelectItem>
            <SelectItem value="dueDate">Due Date</SelectItem>
            <SelectItem value="created">Created</SelectItem>
            <SelectItem value="customer">Customer</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Reminders List */}
      <div className="space-y-4">
        {isLoading ? (
          <div className="flex justify-center py-8">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
          </div>
        ) : filteredReminders.length === 0 ? (
          <Card>
            <CardContent className="text-center py-8">
              <CheckCircle className="h-12 w-12 mx-auto mb-4 text-green-500" />
              <h3 className="text-lg font-medium mb-2">No reminders found</h3>
              <p className="text-gray-600">
                {filter === 'all' 
                  ? 'All caught up! No reminders to send right now.'
                  : `No reminders match the selected filter: ${filter}`
                }
              </p>
            </CardContent>
          </Card>
        ) : (
          filteredReminders.map(reminder => (
            <ReminderCard key={reminder.id} reminder={reminder} />
          ))
        )}
      </div>
    </div>
  )
}