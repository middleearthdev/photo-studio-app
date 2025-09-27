"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover"
import { Separator } from "@/components/ui/separator"
import {
  Bell,
  DollarSign,
  Calendar,
  Clock,
  AlertTriangle,
  CheckCircle,
  ArrowRight,
  Send
} from "lucide-react"
import Link from "next/link"
import { usePaginatedReservations } from "@/hooks/use-reservations"
import { format, parseISO, addDays } from "date-fns"
import { formatCurrency } from "@/lib/utils"
import {
  getDaysUntilReservation,
  getBookingPriority,
  generateWhatsAppMessage,
  getWhatsAppURL
} from "@/lib/utils/booking-rules"

import { useProfile } from "@/hooks/use-profile"

interface QuickReminder {
  id: string
  type: 'payment' | 'confirmation' | 'urgent'
  priority: 'urgent' | 'high' | 'medium'
  customerName: string
  customerPhone: string
  bookingCode: string
  message: string
  action: string
  reservation: any
}

export function RemindersNotification() {
  const [quickReminders, setQuickReminders] = useState<QuickReminder[]>([])
  const [open, setOpen] = useState(false)

  // Get user profile to get studio_id
  const { data: profile } = useProfile()
  const studioId = profile?.studio_id

  // Fetch reservations for urgent reminders
  const {
    data: reservationsData,
    isLoading: reservationsLoading
  } = usePaginatedReservations(studioId || '', {
    page: 1,
    pageSize: 20,
    date_from: format(new Date(), 'yyyy-MM-dd'),
    date_to: format(addDays(new Date(), 7), 'yyyy-MM-dd')
  })

  const reservations = reservationsData?.data || []

  // Generate quick reminder notifications
  useEffect(() => {
    if (!reservationsLoading && reservations.length > 0 && studioId) {
      const urgent: QuickReminder[] = []

      reservations.forEach(reservation => {
        const daysUntil = getDaysUntilReservation(reservation.reservation_date)
        const customerName = reservation.customer?.full_name || 'Guest Customer'
        const customerPhone = reservation.customer?.phone || ''

        // Urgent payment reminders (H-1, H-2)
        if (reservation.payment_status !== 'completed' &&
          reservation.remaining_amount > 0 &&
          daysUntil <= 2 && daysUntil >= 0) {
          urgent.push({
            id: `payment-${reservation.id}`,
            type: 'payment',
            priority: daysUntil <= 1 ? 'urgent' : 'high',
            customerName,
            customerPhone,
            bookingCode: reservation.booking_code,
            message: `Payment ${formatCurrency(reservation.remaining_amount)} - H${daysUntil === 0 ? '' : `-${daysUntil}`}`,
            action: 'Send Payment Reminder',
            reservation
          })
        }

        // Urgent booking confirmations
        if (reservation.status === 'pending' && daysUntil <= 3 && daysUntil >= 0) {
          urgent.push({
            id: `confirm-${reservation.id}`,
            type: 'confirmation',
            priority: daysUntil <= 1 ? 'urgent' : 'high',
            customerName,
            customerPhone,
            bookingCode: reservation.booking_code,
            message: `Booking needs confirmation - ${daysUntil} days left`,
            action: 'Send Confirmation',
            reservation
          })
        }

        // Today's sessions
        if (daysUntil === 0 && ['confirmed', 'partial'].includes(reservation.status)) {
          urgent.push({
            id: `today-${reservation.id}`,
            type: 'urgent',
            priority: 'urgent',
            customerName,
            customerPhone,
            bookingCode: reservation.booking_code,
            message: `Session today at ${reservation.start_time}`,
            action: 'Send Reminder',
            reservation
          })
        }
      })

      // Sort by priority and limit to 5 most urgent
      urgent.sort((a, b) => {
        const priorityOrder = { urgent: 0, high: 1, medium: 2 }
        return priorityOrder[a.priority] - priorityOrder[b.priority]
      })

      setQuickReminders(urgent.slice(0, 5))
    }
  }, [reservationsLoading, reservations, studioId])

  const handleQuickSend = async (reminder: QuickReminder) => {
    try {
      let messageType: 'payment' | 'confirmation' | 'reschedule' = 'confirmation'

      if (reminder.type === 'payment') {
        messageType = 'payment'
      } else if (reminder.type === 'urgent') {
        messageType = 'confirmation'
      }

      const message = generateWhatsAppMessage(reminder.reservation, messageType)
      const whatsappUrl = getWhatsAppURL(reminder.customerPhone, message)

      // Open WhatsApp
      window.open(whatsappUrl, '_blank')
      setOpen(false)
    } catch (error) {
      console.error('Error sending quick reminder:', error)
    }
  }

  const getIcon = (type: string) => {
    switch (type) {
      case 'payment':
        return <DollarSign className="h-4 w-4 text-yellow-600" />
      case 'confirmation':
        return <Calendar className="h-4 w-4 text-blue-600" />
      case 'urgent':
        return <AlertTriangle className="h-4 w-4 text-red-600" />
      default:
        return <Bell className="h-4 w-4" />
    }
  }

  const getBadgeColor = (priority: string) => {
    switch (priority) {
      case 'urgent':
        return 'bg-red-100 text-red-800 border-red-200'
      case 'high':
        return 'bg-orange-100 text-orange-800 border-orange-200'
      default:
        return 'bg-yellow-100 text-yellow-800 border-yellow-200'
    }
  }

  const urgentCount = quickReminders.filter(r => r.priority === 'urgent').length
  const totalCount = quickReminders.length

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button variant="outline" size="icon" className="relative">
          <Bell className="h-4 w-4" />
          {totalCount > 0 && (
            <Badge
              variant={urgentCount > 0 ? "destructive" : "secondary"}
              className="absolute -top-1 -right-1 h-5 w-5 rounded-full p-0 text-xs"
            >
              {totalCount}
            </Badge>
          )}
        </Button>
      </PopoverTrigger>

      <PopoverContent className="w-80 p-0" align="end">
        <div className="flex items-center justify-between p-4 border-b">
          <div className="flex items-center gap-2">
            <Bell className="h-5 w-5 text-orange-600" />
            <h3 className="font-semibold">Urgent Reminders</h3>
          </div>
          {totalCount > 0 && (
            <Badge variant="outline">{totalCount}</Badge>
          )}
        </div>

        <div className="max-h-96 overflow-y-auto">
          {reservationsLoading ? (
            <div className="flex justify-center py-8">
              <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-orange-600"></div>
            </div>
          ) : quickReminders.length === 0 ? (
            <div className="text-center py-8 px-4">
              <CheckCircle className="h-8 w-8 mx-auto mb-3 text-green-500" />
              <p className="text-sm font-medium">All caught up!</p>
              <p className="text-xs text-gray-600">No urgent reminders right now.</p>
            </div>
          ) : (
            <div className="space-y-1">
              {quickReminders.map((reminder, index) => (
                <div key={reminder.id}>
                  <div className="p-3 hover:bg-gray-50 transition-colors">
                    <div className="flex items-start gap-3">
                      <div className="mt-0.5">
                        {getIcon(reminder.type)}
                      </div>

                      <div className="flex-1 space-y-1">
                        <div className="flex items-center justify-between">
                          <p className="text-sm font-medium text-gray-900">
                            {reminder.customerName}
                          </p>
                          <Badge className={getBadgeColor(reminder.priority)}>
                            {reminder.priority}
                          </Badge>
                        </div>

                        <p className="text-xs text-gray-600">
                          #{reminder.bookingCode}
                        </p>

                        <p className="text-sm text-gray-700">
                          {reminder.message}
                        </p>

                        <div className="flex items-center gap-2 pt-1">
                          <Button
                            size="sm"
                            variant="outline"
                            className="h-7 text-xs"
                            onClick={() => handleQuickSend(reminder)}
                          >
                            <Send className="h-3 w-3 mr-1" />
                            {reminder.action}
                          </Button>
                        </div>
                      </div>
                    </div>
                  </div>
                  {index < quickReminders.length - 1 && <Separator />}
                </div>
              ))}
            </div>
          )}
        </div>

        {quickReminders.length > 0 && (
          <>
            <Separator />
            <div className="p-3">
              <Button
                variant="ghost"
                className="w-full justify-between text-sm"
                asChild
              >
                <Link href="/cs/reminders">
                  View All Reminders
                  <ArrowRight className="h-4 w-4" />
                </Link>
              </Button>
            </div>
          </>
        )}
      </PopoverContent>
    </Popover>
  )
}