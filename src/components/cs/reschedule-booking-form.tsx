"use client"

import React, { useState, useEffect, useRef } from "react"
import { Calendar, Clock, AlertTriangle, Save, X, RefreshCw, MessageCircle, AlertCircle } from "lucide-react"
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
import { type Reservation, type ReservationAddon } from "@/actions/reservations"
import { useRescheduleReservation } from "@/hooks/use-reservations"
import { useAvailableTimeSlots } from "@/hooks/use-time-slots"
import { canRescheduleBooking } from "@/lib/utils/booking-rules"
import { AddonTimeSelectorDialog } from "@/components/booking/addon-time-selector-dialog"

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

  // Addon state - track addons with time adjustment needs
  interface AddonWithTimeAdjustment extends ReservationAddon {
    needsTimeAdjustment?: boolean
    original_start_time?: string | null
    original_end_time?: string | null
    original_duration_hours?: number | null
    original_total_price?: number
  }
  const [selectedAddons, setSelectedAddons] = useState<AddonWithTimeAdjustment[]>([])

  // Time selector dialog state
  const [timeDialog, setTimeDialog] = useState<{
    open: boolean
    addon: AddonWithTimeAdjustment | null
  }>({ open: false, addon: null })

  // Track previous date/time to detect changes
  const previousDateTimeRef = useRef<string>('')

  // Ref for auto-scrolling to addon section
  const addonSectionRef = useRef<HTMLDivElement>(null)

  // Use reschedule mutation hook
  const rescheduleReservation = useRescheduleReservation()

  // Use real time slots hook
  const {
    data: availableSlots = [],
    isLoading: isCheckingAvailability
  } = useAvailableTimeSlots(
    reservation?.studio_id,
    formData.new_date,
    reservation?.total_duration,
    reservation?.package_id || undefined,
    reservation?.id // Exclude current reservation from conflict check
  )

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

      // Load addons from reservation
      if (reservation.reservation_addons && reservation.reservation_addons.length > 0) {
        setSelectedAddons(reservation.reservation_addons.map(addon => ({
          ...addon,
          needsTimeAdjustment: false
        })))
      } else {
        setSelectedAddons([])
      }

      // Reset previous date/time ref
      previousDateTimeRef.current = ''
    }
  }, [reservation])

  // Reset addon times when date or time changes
  useEffect(() => {
    const currentDateTime = `${formData.new_date}-${formData.new_start_time}`
    const previousDateTime = previousDateTimeRef.current

    // If date or time changed (and it's not the initial empty state)
    if (previousDateTime && currentDateTime && previousDateTime !== currentDateTime) {
      console.log('📅 Reschedule date/time changed! Resetting addon times...')
      console.log('Previous:', previousDateTime)
      console.log('Current:', currentDateTime)

      // Reset time for facility-based addons, keep the addon selection
      setSelectedAddons(prev => prev.map(addon => {
        if (addon.addon?.facility_id) {
          // Save original values before resetting
          return {
            ...addon,
            // Save original values (if not already saved)
            original_start_time: addon.original_start_time || addon.start_time,
            original_end_time: addon.original_end_time || addon.end_time,
            original_duration_hours: addon.original_duration_hours || addon.duration_hours,
            original_total_price: addon.original_total_price || addon.total_price,
            // Reset current time fields
            start_time: null,
            end_time: null,
            duration_hours: null,
            needsTimeAdjustment: true
          }
        }
        return addon
      }))

      toast.info('Waktu reschedule berubah - addon dengan waktu perlu disesuaikan', {
        duration: 4000,
      })

      // Auto-scroll to addon section after a short delay
      setTimeout(() => {
        addonSectionRef.current?.scrollIntoView({
          behavior: 'smooth',
          block: 'center'
        })
      }, 600)
    }

    // Update the ref
    previousDateTimeRef.current = currentDateTime
  }, [formData.new_date, formData.new_start_time])

  const handleTimeSlotSelect = (slot: any) => {
    if (!slot.available || !reservation) return

    // Calculate end time based on reservation duration
    const startTime = new Date(`1970-01-01 ${slot.time}:00`)
    const endTime = new Date(startTime.getTime() + reservation.total_duration * 60000)
    const endTimeString = endTime.toTimeString().slice(0, 5)

    setFormData(prev => ({
      ...prev,
      new_start_time: slot.time,
      new_end_time: endTimeString
    }))
  }

  // Handle addon time selection
  const handleAddonTimeSelection = (
    addonId: string,
    timeSelection: {
      startTime: string
      endTime: string
      durationHours: number
      totalPrice: number
    }
  ) => {
    setSelectedAddons(prev => prev.map(addon => {
      if (addon.addon_id === addonId) {
        return {
          ...addon,
          start_time: timeSelection.startTime,
          end_time: timeSelection.endTime,
          duration_hours: timeSelection.durationHours,
          total_price: timeSelection.totalPrice,
          needsTimeAdjustment: false
        }
      }
      return addon
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

    // ✅ NEW: Check if any facility-based addons need time adjustment
    const addonsNeedingTime = selectedAddons.filter(addon =>
      addon.addon?.facility_id && !addon.start_time
    )
    if (addonsNeedingTime.length > 0) {
      toast.error(`Ada ${addonsNeedingTime.length} addon yang belum dipilih waktunya`)
      return false
    }

    return true
  }

  const handleSubmit = async () => {
    if (!validateForm() || !reservation) return

    // Prepare addon updates for facility-based addons with time
    const updatedAddons = selectedAddons
      .filter(addon => addon.addon?.facility_id) // Only facility-based addons
      .map(addon => ({
        addon_id: addon.addon_id,
        start_time: addon.start_time || null,
        end_time: addon.end_time || null,
        duration_hours: addon.duration_hours || null
      }))

    rescheduleReservation.mutate({
      id: reservation.id,
      rescheduleData: {
        new_date: formData.new_date,
        new_start_time: formData.new_start_time,
        new_end_time: formData.new_end_time,
        reschedule_reason: formData.reschedule_reason,
        internal_notes: formData.internal_notes,
        updated_addons: updatedAddons.length > 0 ? updatedAddons : undefined
      }
    }, {
      onSuccess: async () => {
        // Reset form first
        setFormData({
          new_date: '',
          new_start_time: '',
          new_end_time: '',
          reschedule_reason: '',
          internal_notes: '',
        })

        // Wait a bit for query invalidation to propagate
        await new Promise(resolve => setTimeout(resolve, 100))

        // Call onSuccess callback to refresh parent data
        onSuccess()

        // Close form after successful reschedule
        onClose()
      }
    })
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
                          {availableSlots.map((slot) => {
                            const endTime = new Date(`1970-01-01 ${slot.time}:00`)
                            endTime.setMinutes(endTime.getMinutes() + (reservation?.total_duration || 60))
                            const endTimeString = endTime.toTimeString().slice(0, 5)

                            return (
                              <Button
                                key={slot.id}
                                variant={
                                  formData.new_start_time === slot.time
                                    ? "default"
                                    : slot.available
                                      ? "outline"
                                      : "secondary"
                                }
                                size="sm"
                                disabled={!slot.available}
                                onClick={() => handleTimeSlotSelect(slot)}
                                className="text-xs"
                              >
                                {slot.time} - {endTimeString}
                                {!slot.available && (
                                  <span className="ml-1 text-red-500">⚠️</span>
                                )}
                              </Button>
                            )
                          })}
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

              {/* Addons Section - Show if booking has addons */}
              {selectedAddons.length > 0 && (
                <Card ref={addonSectionRef}>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <Clock className="h-5 w-5" />
                      Add-ons Yang Perlu Disesuaikan
                    </CardTitle>
                    <CardDescription>
                      Add-on dengan waktu perlu dipilih ulang sesuai jadwal baru
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-3">
                      {selectedAddons.map(addon => {
                        // Calculate price change
                        const priceChanged = addon.original_total_price && addon.total_price &&
                          addon.original_total_price !== addon.total_price
                        const priceDiff = priceChanged
                          ? addon.total_price! - addon.original_total_price!
                          : 0

                        return (
                          <div
                            key={addon.id}
                            className={`p-4 rounded-lg border transition-all ${addon.addon?.facility_id && addon.needsTimeAdjustment
                              ? 'border-red-400 bg-red-50 shadow-md'
                              : addon.addon?.facility_id && addon.start_time
                                ? 'border-green-400 bg-green-50'
                                : 'border-gray-200 bg-gray-50'
                              }`}
                          >
                            <div className="flex items-start justify-between gap-3">
                              <div className="flex-1">
                                <div className="flex items-center gap-2 mb-2">
                                  <span className="font-medium text-sm">{addon.addon?.name}</span>
                                  {addon.addon?.facility_id && addon.needsTimeAdjustment && (
                                    <Badge variant="destructive" className="text-xs animate-pulse">
                                      ⚠️ Pilih Waktu
                                    </Badge>
                                  )}
                                  {addon.addon?.facility_id && !addon.needsTimeAdjustment && addon.start_time && (
                                    <Badge variant="default" className="text-xs bg-green-600">
                                      ✓ Waktu Dipilih
                                    </Badge>
                                  )}
                                </div>

                                {/* Show time info for facility-based addons */}
                                {addon.addon?.facility_id && (
                                  <div className="space-y-2 mt-2">
                                    {/* Show comparison if original time exists (after reschedule date changed) */}
                                    {addon.needsTimeAdjustment ? (
                                      <>
                                        {/* Original Time (Jadwal Lama) */}
                                        {addon.original_start_time && addon.original_end_time && (
                                          <div className="text-xs bg-white/50 p-2 rounded border border-gray-300">
                                            <div className="flex items-center gap-2 text-gray-500">
                                              <span className="font-medium">Jadwal Lama:</span>
                                              <span className="line-through">
                                                {addon.original_start_time} - {addon.original_end_time}
                                                ({addon.original_duration_hours} jam)
                                              </span>
                                            </div>
                                            {addon.original_total_price && (
                                              <div className="text-gray-500 mt-1">
                                                Harga: Rp {addon.original_total_price.toLocaleString('id-ID')}
                                              </div>
                                            )}
                                          </div>
                                        )}

                                        {/* New Time (Jadwal Baru) - After date change */}
                                        {addon.start_time && addon.end_time ? (
                                          <div className="text-xs bg-green-100 p-2 rounded border border-green-300">
                                            <div className="flex items-center gap-2 text-green-800 font-medium">
                                              <span>✓ Jadwal Baru:</span>
                                              <span>
                                                {addon.start_time} - {addon.end_time}
                                                ({addon.duration_hours} jam)
                                              </span>
                                            </div>
                                            {addon.total_price && (
                                              <div className="text-green-800 mt-1">
                                                Harga: Rp {addon.total_price.toLocaleString('id-ID')}
                                                {priceChanged && (
                                                  <span className={`ml-2 font-semibold ${priceDiff > 0 ? 'text-red-600' : 'text-green-600'}`}>
                                                    ({priceDiff > 0 ? '+' : ''}{priceDiff.toLocaleString('id-ID')})
                                                  </span>
                                                )}
                                              </div>
                                            )}
                                          </div>
                                        ) : (
                                          <div className="text-xs bg-amber-100 p-2 rounded border border-amber-300">
                                            <div className="flex items-center gap-2 text-amber-800 font-medium">
                                              <AlertTriangle className="h-3 w-3" />
                                              <span>⚠️ Belum pilih waktu baru</span>
                                            </div>
                                            {!formData.new_date || !formData.new_start_time ? (
                                              <div className="text-amber-700 mt-1">
                                                Pilih tanggal dan waktu reschedule terlebih dahulu
                                              </div>
                                            ) : null}
                                          </div>
                                        )}
                                      </>
                                    ) : (
                                      /* Show current time when form first opened (no reschedule yet) */
                                      addon.start_time && addon.end_time ? (
                                        <div className="text-xs bg-blue-50 p-2 rounded border border-blue-300">
                                          <div className="flex items-center gap-2 text-blue-800">
                                            <Clock className="h-3 w-3" />
                                            <span className="font-medium">Jadwal Saat Ini:</span>
                                            <span>
                                              {addon.start_time} - {addon.end_time}
                                              ({addon.duration_hours} jam)
                                            </span>
                                          </div>
                                          {addon.total_price && (
                                            <div className="text-blue-800 mt-1">
                                              Harga: Rp {addon.total_price.toLocaleString('id-ID')}
                                            </div>
                                          )}
                                        </div>
                                      ) : (
                                        <div className="text-xs text-gray-600">
                                          Belum ada waktu dipilih
                                        </div>
                                      )
                                    )}
                                  </div>
                                )}

                                {/* Show quantity for non-facility addons */}
                                {!addon.addon?.facility_id && (
                                  <div className="text-xs text-gray-600 mt-1">
                                    Quantity: {addon.quantity} | Harga: Rp {addon.total_price.toLocaleString('id-ID')}
                                  </div>
                                )}
                              </div>

                              {/* Button to select time for facility-based addons */}
                              {addon.addon?.facility_id && formData.new_date && formData.new_start_time && (
                                <Button
                                  type="button"
                                  size="sm"
                                  variant={addon.needsTimeAdjustment ? "destructive" : "outline"}
                                  onClick={() => {
                                    if (addon.addon?.facility_id && addon.addon?.hourly_rate) {
                                      setTimeDialog({
                                        open: true,
                                        addon: addon
                                      })
                                    }
                                  }}
                                >
                                  <Clock className="h-3 w-3 mr-1" />
                                  {addon.start_time ? 'Ubah Waktu' : 'Pilih Waktu'}
                                </Button>
                              )}
                            </div>
                          </div>
                        )
                      })}
                    </div>

                    {selectedAddons.some(a => a.addon?.facility_id && !formData.new_date) && (
                      <div className="mt-4 p-4 bg-blue-50 border-2 border-blue-300 rounded-lg">
                        <div className="flex items-start gap-3">
                          <AlertCircle className="h-5 w-5 text-blue-600 mt-0.5 flex-shrink-0" />
                          <div>
                            <p className="font-semibold text-blue-900 text-sm mb-1">
                              📌 Langkah Selanjutnya
                            </p>
                            <p className="text-xs text-blue-800">
                              Pilih <strong>tanggal dan waktu reschedule</strong> di bagian atas terlebih dahulu.
                              Setelah itu, tombol "Pilih Waktu" akan muncul untuk setiap add-on yang perlu disesuaikan.
                            </p>
                          </div>
                        </div>
                      </div>
                    )}
                  </CardContent>
                </Card>
              )}

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
          <Button variant="outline" onClick={onClose} disabled={rescheduleReservation.isPending}>
            <X className="h-4 w-4 mr-2" />
            Cancel
          </Button>
          {rescheduleRule.allowed && (
            <Button
              onClick={handleSubmit}
              disabled={rescheduleReservation.isPending || !formData.new_date || !formData.new_start_time}
            >
              <Save className="h-4 w-4 mr-2" />
              {rescheduleReservation.isPending ? 'Rescheduling...' : 'Confirm Reschedule'}
            </Button>
          )}
        </div>
      </DialogContent>

      {/* Time Selector Dialog for Facility-based Hourly Addons */}
      {timeDialog.open && timeDialog.addon && formData.new_date && (
        <AddonTimeSelectorDialog
          isOpen={timeDialog.open}
          onClose={() => setTimeDialog({ open: false, addon: null })}
          addon={{
            id: timeDialog.addon.addon_id,
            name: timeDialog.addon.addon?.name || '',
            facility_id: timeDialog.addon.addon?.facility_id || '',
            hourly_rate: timeDialog.addon.addon?.hourly_rate || 0
          }}
          studioId={reservation?.studio_id || ''}
          bookingDate={formData.new_date}
          packageStartTime={formData.new_start_time}
          packageEndTime={formData.new_end_time}
          lockedDuration={timeDialog.addon.original_duration_hours || timeDialog.addon.duration_hours || undefined}
          excludeReservationId={reservation?.id}
          onConfirm={(timeSelection) => {
            handleAddonTimeSelection(timeDialog.addon!.addon_id, timeSelection)
            setTimeDialog({ open: false, addon: null })
          }}
        />
      )}
    </Dialog>
  )
}