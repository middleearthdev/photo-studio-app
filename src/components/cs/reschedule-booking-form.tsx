"use client"

import React, { useState, useEffect } from "react"
import { Calendar, Clock, AlertTriangle, Save, X, RefreshCw } from "lucide-react"
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
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { toast } from "sonner"
import { type Reservation } from "@/actions/reservations"
import { canRescheduleBooking, getDeadlineInfo } from "@/lib/utils/booking-rules"

interface TimeSlot {
  start_time: string
  end_time: string
  is_available: boolean
}

interface RescheduleBookingFormProps {
  isOpen: boolean
  onClose: () => void
  onSuccess: () => void
  reservation: Reservation | null
}

export function RescheduleBookingForm({ isOpen, onClose, onSuccess, reservation }: RescheduleBookingFormProps) {
  
  // Form state
  const [formData, setFormData] = useState({
    new_date: '',
    new_start_time: '',
    new_end_time: '',
    reschedule_reason: '',
    internal_notes: '',
  })

  const [availableSlots, setAvailableSlots] = useState<TimeSlot[]>([])
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [isCheckingAvailability, setIsCheckingAvailability] = useState(false)

  // Reset form when reservation changes
  useEffect(() => {
    if (reservation) {
      setFormData({
        new_date: '',
        new_start_time: '',
        new_end_time: '',
        reschedule_reason: '',
        internal_notes: '',
      })
      setAvailableSlots([])
    }
  }, [reservation])

  // Generate time slots when date changes
  useEffect(() => {
    if (formData.new_date && reservation) {
      checkAvailability()
    }
  }, [formData.new_date, reservation])

  const checkAvailability = async () => {
    setIsCheckingAvailability(true)
    
    try {
      // Mock API call to check availability
      await new Promise(resolve => setTimeout(resolve, 1000))
      
      const slots: TimeSlot[] = []
      const startHour = 8
      const endHour = 18
      const duration = reservation?.total_duration || 60
      const slotDuration = Math.max(duration, 60) / 60 // Convert to hours
      
      for (let hour = startHour; hour < endHour; hour += slotDuration) {
        const endHour = hour + slotDuration
        if (endHour <= 18) {
          const start = `${Math.floor(hour).toString().padStart(2, '0')}:${((hour % 1) * 60).toString().padStart(2, '0')}`
          const end = `${Math.floor(endHour).toString().padStart(2, '0')}:${((endHour % 1) * 60).toString().padStart(2, '0')}`
          
          slots.push({
            start_time: start,
            end_time: end,
            is_available: Math.random() > 0.4 // Mock availability
          })
        }
      }
      
      setAvailableSlots(slots)
    } catch (error) {
      toast.error("Failed to check availability")
    } finally {
      setIsCheckingAvailability(false)
    }
  }

  const handleTimeSlotSelect = (slot: TimeSlot) => {
    if (!slot.is_available) return
    
    setFormData(prev => ({
      ...prev,
      new_start_time: slot.start_time,
      new_end_time: slot.end_time
    }))
  }

  const validateForm = () => {
    if (!reservation) return false
    
    const rescheduleRule = canRescheduleBooking(reservation)
    if (!rescheduleRule.allowed) {
      toast.error(rescheduleRule.reason)
      return false
    }
    
    if (!formData.new_date) {
      toast.error("Please select a new date")
      return false
    }
    
    if (!formData.new_start_time) {
      toast.error("Please select a new time slot")
      return false
    }
    
    if (!formData.reschedule_reason.trim()) {
      toast.error("Please provide a reason for rescheduling")
      return false
    }
    
    // Check if new date is same as current
    if (formData.new_date === reservation.reservation_date && 
        formData.new_start_time === reservation.start_time) {
      toast.error("New date and time must be different from current booking")
      return false
    }
    
    return true
  }

  const handleSubmit = async () => {
    if (!validateForm()) return
    
    setIsSubmitting(true)
    
    try {
      // Mock API call - replace with actual API
      await new Promise(resolve => setTimeout(resolve, 2000))
      
      toast.success("Booking has been rescheduled successfully")
      
      onSuccess()
      onClose()
      
      // Reset form
      setFormData({
        new_date: '',
        new_start_time: '',
        new_end_time: '',
        reschedule_reason: '',
        internal_notes: '',
      })
      
    } catch (error) {
      toast.error("Failed to reschedule booking")
    } finally {
      setIsSubmitting(false)
    }
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

  if (!reservation) return null

  const rescheduleRule = canRescheduleBooking(reservation)
  const deadline = getDeadlineInfo(reservation)

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="w-[90vw] max-w-2xl max-h-[90vh] overflow-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Calendar className="h-5 w-5" />
            Reschedule Booking
          </DialogTitle>
          <DialogDescription>
            Change the date and time for booking {reservation.booking_code}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6">
          {/* Current Booking Info */}
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Current Booking Details</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label className="text-sm font-medium text-gray-500">Customer</Label>
                  <p className="text-sm">{reservation.customer?.full_name || 'Unknown Customer'}</p>
                </div>
                <div>
                  <Label className="text-sm font-medium text-gray-500">Package</Label>
                  <p className="text-sm">{reservation.package?.name || 'Custom Package'}</p>
                </div>
                <div>
                  <Label className="text-sm font-medium text-gray-500">Current Date</Label>
                  <p className="text-sm font-medium">{formatDate(reservation.reservation_date)}</p>
                </div>
                <div>
                  <Label className="text-sm font-medium text-gray-500">Current Time</Label>
                  <p className="text-sm font-medium">
                    {formatTime(reservation.start_time)} - {formatTime(reservation.end_time)}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Reschedule Rules Status */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <AlertTriangle className="h-4 w-4" />
                Reschedule Rules
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                <div className="flex items-center gap-2">
                  <Badge 
                    variant={rescheduleRule.allowed ? 'default' : 'destructive'}
                  >
                    {rescheduleRule.allowed ? '✅ Allowed' : '❌ Not Allowed'}
                  </Badge>
                  <span className="text-sm">{rescheduleRule.reason}</span>
                </div>
                
                <div className="text-sm text-gray-600 p-3 bg-gray-50 rounded-lg">
                  <div className="font-medium mb-1">Important Notes:</div>
                  <ul className="list-disc list-inside space-y-1 text-xs">
                    <li>Reschedule is only allowed until H-3 (3 days before event)</li>
                    <li>Customer will be notified about the schedule change</li>
                    <li>No additional charges for the first reschedule</li>
                  </ul>
                </div>
              </div>
            </CardContent>
          </Card>

          {rescheduleRule.allowed && (
            <>
              {/* New Date Selection */}
              <Card>
                <CardHeader>
                  <CardTitle>Select New Date & Time</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="new_date">New Date *</Label>
                    <Input
                      id="new_date"
                      type="date"
                      value={formData.new_date}
                      onChange={(e) => setFormData(prev => ({ ...prev, new_date: e.target.value }))}
                      min={new Date().toISOString().split('T')[0]}
                    />
                  </div>

                  {/* Available Time Slots */}
                  {formData.new_date && (
                    <div className="space-y-2">
                      <div className="flex items-center gap-2">
                        <Label>Available Time Slots</Label>
                        {isCheckingAvailability && (
                          <RefreshCw className="h-4 w-4 animate-spin text-gray-400" />
                        )}
                      </div>
                      
                      {isCheckingAvailability ? (
                        <div className="flex items-center justify-center py-8 text-gray-500">
                          <RefreshCw className="h-6 w-6 animate-spin mr-2" />
                          Checking availability...
                        </div>
                      ) : availableSlots.length > 0 ? (
                        <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
                          {availableSlots.map((slot, index) => (
                            <Button
                              key={index}
                              variant={
                                formData.new_start_time === slot.start_time 
                                  ? "default" 
                                  : slot.is_available 
                                    ? "outline" 
                                    : "secondary"
                              }
                              size="sm"
                              disabled={!slot.is_available}
                              onClick={() => handleTimeSlotSelect(slot)}
                              className="text-xs"
                            >
                              {slot.start_time} - {slot.end_time}
                              {!slot.is_available && (
                                <span className="ml-1 text-red-500">⚠️</span>
                              )}
                            </Button>
                          ))}
                        </div>
                      ) : (
                        <div className="text-center py-4 text-gray-500">
                          No available slots for selected date
                        </div>
                      )}
                    </div>
                  )}
                </CardContent>
              </Card>

              {/* Reschedule Reason */}
              <Card>
                <CardHeader>
                  <CardTitle>Reschedule Information</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="reschedule_reason">Reason for Reschedule *</Label>
                    <Textarea
                      id="reschedule_reason"
                      value={formData.reschedule_reason}
                      onChange={(e) => setFormData(prev => ({ ...prev, reschedule_reason: e.target.value }))}
                      placeholder="Please provide reason for rescheduling (will be shared with customer)..."
                      rows={3}
                    />
                  </div>
                  
                  <div className="space-y-2">
                    <Label htmlFor="internal_notes">Internal Notes</Label>
                    <Textarea
                      id="internal_notes"
                      value={formData.internal_notes}
                      onChange={(e) => setFormData(prev => ({ ...prev, internal_notes: e.target.value }))}
                      placeholder="Internal notes for staff (optional)..."
                      rows={2}
                    />
                  </div>
                </CardContent>
              </Card>
            </>
          )}
        </div>

        {/* Footer Actions */}
        <div className="flex justify-end gap-2 pt-4 border-t">
          <Button variant="outline" onClick={onClose} disabled={isSubmitting}>
            <X className="h-4 w-4 mr-2" />
            Cancel
          </Button>
          {rescheduleRule.allowed && (
            <Button 
              onClick={handleSubmit} 
              disabled={isSubmitting || !formData.new_date || !formData.new_start_time}
            >
              <Save className="h-4 w-4 mr-2" />
              {isSubmitting ? 'Rescheduling...' : 'Confirm Reschedule'}
            </Button>
          )}
        </div>
      </DialogContent>
    </Dialog>
  )
}