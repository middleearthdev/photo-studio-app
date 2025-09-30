'use client'

import { useState, useEffect } from 'react'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { CheckCircle, DollarSign, Clock, Calendar, User, Package } from 'lucide-react'
import { Badge } from '@/components/ui/badge'
import { toast } from 'sonner'
import { type Reservation } from '@/actions/reservations'
import { confirmBookingWithPaymentAction, getExistingPaymentAction } from '@/actions/booking-confirmation'

interface BookingConfirmationDialogProps {
  isOpen: boolean
  onClose: () => void
  reservation: Reservation | null
}

export function BookingConfirmationDialog({
  isOpen,
  onClose,
  reservation
}: BookingConfirmationDialogProps) {
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [existingPayment, setExistingPayment] = useState<any>(null)

  // Fetch existing payment record for display using server action
  useEffect(() => {
    if (!reservation?.id || !isOpen) return

    const fetchExistingPayment = async () => {
      try {
        const result = await getExistingPaymentAction(reservation.id)
        
        if (result.success) {
          setExistingPayment(result.data)
        } else {
          console.error('Failed to fetch payment:', result.error)
          setExistingPayment(null)
        }
      } catch (error) {
        console.error('Error fetching payment:', error)
        setExistingPayment(null)
      }
    }

    fetchExistingPayment()
  }, [reservation?.id, isOpen])

  const formatPrice = (amount: number) => {
    return new Intl.NumberFormat('id-ID', {
      style: 'currency',
      currency: 'IDR',
      minimumFractionDigits: 0,
    }).format(amount)
  }

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('id-ID', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    })
  }

  const formatTime = (timeString: string) => {
    return timeString.slice(0, 5) // HH:MM
  }

  const handleConfirm = async () => {
    if (!reservation || !existingPayment) return

    setIsSubmitting(true)

    try {
      const result = await confirmBookingWithPaymentAction({
        reservationId: reservation.id,
        paymentAmount: reservation.dp_amount,
        paymentMethod: existingPayment.payment_method_id,
      })

      if (!result.success) {
        toast.error(result.error || 'Failed to confirm booking')
        return
      }

      toast.success('Booking confirmed successfully!')
      onClose()

    } catch (error) {
      console.error('Booking confirmation error:', error)
      toast.error('An error occurred while confirming booking')
    } finally {
      setIsSubmitting(false)
    }
  }

  if (!reservation) return null

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <CheckCircle className="h-5 w-5 text-green-600" />
            Konfirmasi Booking
          </DialogTitle>
          <DialogDescription>
            Konfirmasi penerimaan pembayaran untuk booking: {reservation.booking_code}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6">
          {/* Booking Information */}
          <Card className="bg-slate-50 border-slate-200">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-base">
                <Package className="h-4 w-4" />
                Detail Booking
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-3">
                  <div className="flex items-center gap-2">
                    <User className="h-4 w-4 text-slate-500" />
                    <div>
                      <p className="text-xs text-slate-500 uppercase tracking-wide">Customer</p>
                      <p className="font-medium">{reservation.customer?.full_name || 'Unknown Customer'}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <Package className="h-4 w-4 text-slate-500" />
                    <div>
                      <p className="text-xs text-slate-500 uppercase tracking-wide">Package</p>
                      <p className="font-medium">{reservation.package?.name || 'Custom Package'}</p>
                    </div>
                  </div>
                  <div className="flex items-start gap-2">
                    <Calendar className="h-4 w-4 text-slate-500 mt-0.5" />
                    <div>
                      <p className="text-xs text-slate-500 uppercase tracking-wide">Date & Time</p>
                      <p className="font-medium">{formatDate(reservation.reservation_date)}</p>
                      <p className="text-sm text-slate-600">{formatTime(reservation.start_time)} - {formatTime(reservation.end_time)}</p>
                    </div>
                  </div>
                </div>
                <div className="space-y-3">
                  <div className="flex items-center gap-2">
                    <DollarSign className="h-4 w-4 text-slate-500" />
                    <div>
                      <p className="text-xs text-slate-500 uppercase tracking-wide">Total Amount</p>
                      <p className="text-xl font-bold text-slate-900">{formatPrice(reservation.total_amount)}</p>
                    </div>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Payment Information */}
          {existingPayment ? (
            <Card className="border-green-200 bg-green-50">
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-base text-green-800">
                  <CheckCircle className="h-4 w-4" />
                  Payment Information
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  <div className="flex justify-between items-center">
                    <span className="text-sm font-medium text-green-700">Payment Amount:</span>
                    <span className="text-lg font-bold text-green-800">{formatPrice(reservation.dp_amount)}</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-sm font-medium text-green-700">Payment Type:</span>
                    <span className="text-sm text-green-800">DP (Down Payment)</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-sm font-medium text-green-700">Payment Method:</span>
                    <span className="text-sm text-green-800">Bank Transfer</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-sm font-medium text-green-700">Remaining Amount:</span>
                    <span className="text-sm text-green-800">{formatPrice(reservation.remaining_amount)}</span>
                  </div>
                </div>
                <div className="mt-4 p-3 bg-green-100 rounded-lg">
                  <p className="text-xs text-green-700">
                    <strong>✓ Payment record found:</strong> Customer telah melakukan booking dengan bank transfer.
                    Konfirmasi ini akan mengubah status booking menjadi "confirmed" dan payment status menjadi "partial".
                  </p>
                </div>
              </CardContent>
            </Card>
          ) : (
            <Card className="border-orange-200 bg-orange-50">
              <CardContent className="pt-4">
                <div className="flex items-center gap-2">
                  <div className="p-1 bg-orange-100 rounded-full">
                    <Clock className="h-4 w-4 text-orange-600" />
                  </div>
                  <div>
                    <p className="text-sm font-medium text-orange-800">No Payment Record</p>
                    <p className="text-xs text-orange-600">Belum ada record pembayaran untuk booking ini</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Actions */}
          <div className="flex justify-end gap-3 pt-6 border-t">
            <Button type="button" variant="outline" onClick={onClose}>
              Cancel
            </Button>
            <Button
              onClick={handleConfirm}
              disabled={isSubmitting || !existingPayment}
              className="bg-green-600 hover:bg-green-700"
            >
              {isSubmitting ? (
                <>
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2" />
                  Confirming...
                </>
              ) : (
                <>
                  <CheckCircle className="h-4 w-4 mr-2" />
                  Confirm Payment
                </>
              )}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}