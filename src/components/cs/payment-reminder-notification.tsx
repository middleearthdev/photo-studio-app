'use client'

import { useState } from 'react'
import { Bell, Clock, MessageCircle, X, AlertTriangle } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { toast } from 'sonner'
import { usePaymentReminders, generateFollowUpMessage, type PaymentReminder } from '@/hooks/use-payment-reminders'

interface PaymentReminderNotificationProps {
  studioId: string
}

export function PaymentReminderNotification({ studioId }: PaymentReminderNotificationProps) {
  const { data: reminders = [], isLoading } = usePaymentReminders(studioId)
  const [dismissedReminders, setDismissedReminders] = useState<Set<string>>(new Set())

  const activeReminders = reminders.filter(reminder => 
    reminder.shouldShowReminder && !dismissedReminders.has(reminder.id)
  )

  const handleDismiss = (reminderId: string) => {
    setDismissedReminders(prev => new Set([...prev, reminderId]))
    toast.success('Reminder dismissed')
  }

  const handleSendFollowUp = (reminder: PaymentReminder) => {
    const phone = reminder.reservation.customer?.phone || reminder.reservation.guest_phone
    if (!phone) {
      toast.error('Nomor telefon customer tidak ditemukan')
      return
    }

    const message = generateFollowUpMessage(reminder.reservation, reminder.cancellationTime)
    const cleanPhone = phone.replace(/\D/g, '')
    const whatsappUrl = `https://wa.me/${cleanPhone}?text=${encodeURIComponent(message)}`
    
    window.open(whatsappUrl, '_blank')
    toast.success('WhatsApp follow-up dibuka')
    
    // Auto dismiss after sending
    handleDismiss(reminder.id)
  }

  const formatPrice = (amount: number) => {
    return new Intl.NumberFormat('id-ID', {
      style: 'currency',
      currency: 'IDR',
      minimumFractionDigits: 0,
    }).format(amount)
  }

  if (isLoading || activeReminders.length === 0) {
    return null
  }

  return (
    <div className="mb-6">
      <Card className="border-orange-200 bg-orange-50">
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div className="p-2 bg-orange-100 rounded-full">
                <Bell className="h-4 w-4 text-orange-600" />
              </div>
              <div>
                <CardTitle className="text-lg text-orange-900">
                  Payment Follow-Up Required
                </CardTitle>
                <CardDescription className="text-orange-700">
                  {activeReminders.length} booking(s) need payment follow-up
                </CardDescription>
              </div>
            </div>
            <Badge variant="outline" className="border-orange-300 text-orange-700">
              {activeReminders.length} pending
            </Badge>
          </div>
        </CardHeader>
        
        <CardContent>
          <div className="space-y-3">
            {activeReminders.map((reminder) => (
              <div
                key={reminder.id}
                className="flex items-center justify-between p-3 bg-white border border-orange-200 rounded-lg"
              >
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-red-100 rounded-full">
                    <AlertTriangle className="h-4 w-4 text-red-600" />
                  </div>
                  <div>
                    <div className="font-medium text-gray-900">
                      {reminder.reservation.customer?.full_name || 'Unknown Customer'}
                    </div>
                    <div className="text-sm text-gray-600 flex items-center gap-4">
                      <span>Booking: {reminder.reservation.booking_code}</span>
                      <span>DP: {formatPrice(reminder.reservation.dp_amount)}</span>
                      <div className="flex items-center gap-1 text-red-600">
                        <Clock className="h-3 w-3" />
                        <span className="font-medium">
                          Cancels in: {reminder.timeUntilCancellation}
                        </span>
                      </div>
                    </div>
                  </div>
                </div>
                
                <div className="flex items-center gap-2">
                  <Button
                    size="sm"
                    onClick={() => handleSendFollowUp(reminder)}
                    className="bg-green-600 hover:bg-green-700 text-white"
                  >
                    <MessageCircle className="h-4 w-4 mr-2" />
                    Send Follow-Up
                  </Button>
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => handleDismiss(reminder.id)}
                  >
                    <X className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            ))}
          </div>
          
          {activeReminders.length > 0 && (
            <div className="mt-4 p-3 bg-orange-100 rounded-lg">
              <p className="text-sm text-orange-800">
                <strong>💡 Tip:</strong> Bookings akan otomatis dibatalkan 15 menit setelah dibuat jika belum ada pembayaran. 
                Gunakan "Send Follow-Up" untuk mengingatkan customer tentang deadline pembayaran.
              </p>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}