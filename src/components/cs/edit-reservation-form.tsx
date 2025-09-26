"use client"

import React, { useState, useEffect } from "react"
import { User, Save, X } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { toast } from "sonner"
import { useUpdateReservation } from "@/hooks/use-reservations"
import { type Reservation } from "@/actions/reservations"

interface EditReservationFormProps {
  isOpen: boolean
  onClose: () => void
  onSuccess: () => void
  reservation: Reservation | null
}

export function EditReservationForm({ isOpen, onClose, onSuccess, reservation }: EditReservationFormProps) {
  const [formData, setFormData] = useState({
    customer_name: '',
    customer_email: '',
    customer_phone: '',
    special_requests: '',
    internal_notes: '',
  })
  
  const updateReservationMutation = useUpdateReservation()

  // Load reservation data when modal opens
  useEffect(() => {
    if (reservation && isOpen) {
      setFormData({
        customer_name: reservation.customer?.full_name || '',
        customer_email: reservation.customer?.email || reservation.guest_email || '',
        customer_phone: reservation.customer?.phone || reservation.guest_phone || '',
        special_requests: reservation.special_requests || '',
        internal_notes: reservation.internal_notes || '',
      })
    }
  }, [reservation, isOpen])

  const resetForm = () => {
    setFormData({
      customer_name: '',
      customer_email: '',
      customer_phone: '',
      special_requests: '',
      internal_notes: '',
    })
  }

  const formatPhoneNumber = (value: string) => {
    // Remove all non-numeric characters except + at the beginning
    const cleaned = value.replace(/[^\d+]/g, '')

    // If starts with 0, replace with +62
    if (cleaned.startsWith('0')) {
      return '+62' + cleaned.slice(1)
    }

    // If starts with 62, add +
    if (cleaned.startsWith('62') && !cleaned.startsWith('+62')) {
      return '+' + cleaned
    }

    return cleaned
  }

  const handlePhoneChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const formatted = formatPhoneNumber(e.target.value)
    setFormData(prev => ({ ...prev, customer_phone: formatted }))
  }

  const validateForm = () => {
    const required = ['customer_name', 'customer_email', 'customer_phone']

    for (const field of required) {
      if (!formData[field as keyof typeof formData]) {
        toast.error(`${field.replace('_', ' ')} is required`)
        return false
      }
    }

    // Validate email format
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.customer_email)) {
      toast.error("Invalid email format")
      return false
    }

    // Validate WhatsApp format
    if (!/^[0-9+\-\s()]+$/.test(formData.customer_phone)) {
      toast.error("Invalid phone number format")
      return false
    }

    return true
  }

  const handleSubmit = async () => {
    if (!validateForm() || !reservation) return

    // Prepare update data
    const updateData = {
      customer_name: formData.customer_name,
      guest_email: formData.customer_email,
      guest_phone: formData.customer_phone,
      special_requests: formData.special_requests,
      internal_notes: formData.internal_notes,
    }

    updateReservationMutation.mutate(
      { id: reservation.id, data: updateData },
      {
        onSuccess: () => {
          onSuccess()
          onClose()
          resetForm()
        }
      }
    )
  }

  const handleClose = () => {
    if (!updateReservationMutation.isPending) {
      resetForm()
      onClose()
    }
  }

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="w-[90vw] max-w-2xl max-h-[90vh] overflow-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <User className="h-5 w-5" />
            Edit Customer Information & Notes
          </DialogTitle>
          <DialogDescription>
            Update customer information and notes. Scheduling changes require separate reschedule function.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          {/* Customer Information */}
          <div className="space-y-4">
            <div className="border-b pb-2">
              <h3 className="font-medium text-sm text-gray-700">Customer Information</h3>
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="customer_name">Customer Name *</Label>
              <Input
                id="customer_name"
                value={formData.customer_name}
                onChange={(e) => setFormData(prev => ({ ...prev, customer_name: e.target.value }))}
                placeholder="Customer full name"
                disabled={updateReservationMutation.isPending}
              />
              <p className="text-xs text-amber-600">
                ⚠️ Note: Customer name updates only affect guest bookings. Registered user names cannot be changed here.
              </p>
            </div>

            <div className="space-y-2">
              <Label htmlFor="customer_email">Email Address *</Label>
              <Input
                id="customer_email"
                type="email"
                value={formData.customer_email}
                onChange={(e) => setFormData(prev => ({ ...prev, customer_email: e.target.value }))}
                placeholder="customer@email.com"
                disabled={updateReservationMutation.isPending}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="customer_phone">WhatsApp Number *</Label>
              <Input
                id="customer_phone"
                type="tel"
                value={formData.customer_phone}
                onChange={handlePhoneChange}
                placeholder="+62 xxx xxx xxxx"
                disabled={updateReservationMutation.isPending}
              />
              <p className="text-xs text-muted-foreground">
                Phone number for WhatsApp reminders and confirmations
              </p>
            </div>
          </div>

          {/* Notes Section */}
          <div className="space-y-4">
            <div className="border-b pb-2">
              <h3 className="font-medium text-sm text-gray-700">Notes</h3>
            </div>

            <div className="space-y-2">
              <Label htmlFor="special_requests">Special Requests</Label>
              <Textarea
                id="special_requests"
                value={formData.special_requests}
                onChange={(e) => setFormData(prev => ({ ...prev, special_requests: e.target.value }))}
                placeholder="Any special requests from customer..."
                rows={3}
                disabled={updateReservationMutation.isPending}
                className="resize-none"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="internal_notes">Internal Notes</Label>
              <Textarea
                id="internal_notes"
                value={formData.internal_notes}
                onChange={(e) => setFormData(prev => ({ ...prev, internal_notes: e.target.value }))}
                placeholder="Internal notes for staff (not visible to customer)..."
                rows={3}
                disabled={updateReservationMutation.isPending}
                className="resize-none"
              />
            </div>
          </div>

          {/* Booking Info Display (Read-only) */}
          <div className="space-y-4">
            <div className="border-b pb-2">
              <h3 className="font-medium text-sm text-gray-700">Booking Information (Read-only)</h3>
            </div>
            
            <div className="grid grid-cols-2 gap-4 p-3 bg-gray-50 rounded-lg">
              <div>
                <Label className="text-xs text-gray-500">Booking Code</Label>
                <p className="font-mono text-sm">{reservation?.booking_code}</p>
              </div>
              <div>
                <Label className="text-xs text-gray-500">Package</Label>
                <p className="text-sm">{reservation?.package?.name || 'Custom Package'}</p>
              </div>
              <div>
                <Label className="text-xs text-gray-500">Date</Label>
                <p className="text-sm">
                  {reservation?.reservation_date ? new Date(reservation.reservation_date).toLocaleDateString('id-ID', {
                    weekday: 'short',
                    year: 'numeric',
                    month: 'short',
                    day: 'numeric'
                  }) : '-'}
                </p>
              </div>
              <div>
                <Label className="text-xs text-gray-500">Time</Label>
                <p className="text-sm">
                  {reservation?.start_time?.slice(0, 5)} - {reservation?.end_time?.slice(0, 5)}
                </p>
              </div>
            </div>
            
            <p className="text-xs text-blue-600">
              ℹ️ To change date/time, use the separate Reschedule function from the main actions menu.
            </p>
          </div>
        </div>

        {/* Footer Actions */}
        <div className="flex justify-end gap-2 pt-4 border-t">
          <Button variant="outline" onClick={handleClose} disabled={updateReservationMutation.isPending}>
            <X className="h-4 w-4 mr-2" />
            Cancel
          </Button>
          <Button onClick={handleSubmit} disabled={updateReservationMutation.isPending}>
            <Save className="h-4 w-4 mr-2" />
            {updateReservationMutation.isPending ? 'Updating...' : 'Update Reservation'}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  )
}