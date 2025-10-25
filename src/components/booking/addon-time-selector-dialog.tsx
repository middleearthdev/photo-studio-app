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
import { Label } from '@/components/ui/label'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Clock, AlertCircle, CheckCircle2 } from 'lucide-react'
import { toast } from 'sonner'
import { getAvailableTimeSlots } from '@/actions/addon-availability'

interface AddonTimeSelectorDialogProps {
  isOpen: boolean
  onClose: () => void
  addon: {
    id: string
    name: string
    facility_id: string
    hourly_rate: number
  }
  studioId: string
  bookingDate: string
  packageStartTime?: string
  packageEndTime?: string
  lockedDuration?: number // For reschedule - lock duration to original
  excludeReservationId?: string // For reschedule - exclude current reservation from availability check
  onConfirm: (timeSelection: {
    startTime: string
    endTime: string
    durationHours: number
    totalPrice: number
  }) => void
}

export function AddonTimeSelectorDialog({
  isOpen,
  onClose,
  addon,
  studioId,
  bookingDate,
  packageStartTime,
  packageEndTime,
  lockedDuration,
  excludeReservationId,
  onConfirm
}: AddonTimeSelectorDialogProps) {
  const [selectedStartTime, setSelectedStartTime] = useState('')
  const [selectedDuration, setSelectedDuration] = useState(lockedDuration || 1)
  const [availableSlots, setAvailableSlots] = useState<{ time: string; available: boolean }[]>([])
  const [isLoading, setIsLoading] = useState(false)

  // Check if package time is selected
  const hasPackageTime = Boolean(packageStartTime && packageEndTime)

  // If duration is locked (reschedule mode), use locked duration
  const isRescheduleMode = Boolean(lockedDuration)
  const effectiveDuration = lockedDuration || selectedDuration

  // Reset selected start time when duration changes (but not in reschedule mode)
  useEffect(() => {
    if (!isRescheduleMode) {
      // Clear selected start time when duration changes
      // because availability may be different for different durations
      setSelectedStartTime('')
    }
  }, [selectedDuration, isRescheduleMode])

  // Load available time slots - ONLY if package time is selected
  useEffect(() => {
    if (!isOpen || !addon.facility_id || !studioId || !hasPackageTime) {
      // Clear slots if package time is not selected
      setAvailableSlots([])
      return
    }

    const loadAvailableSlots = async () => {
      setIsLoading(true)
      try {
        const result = await getAvailableTimeSlots(
          addon.facility_id,
          studioId,
          bookingDate,
          effectiveDuration,
          excludeReservationId // Exclude current reservation when reschedule
        )

        if (result.success && result.data) {
          setAvailableSlots(result.data)
        } else {
          toast.error(result.error || 'Gagal memuat jam tersedia')
        }
      } catch (error) {
        console.error('Error loading time slots:', error)
        toast.error('Terjadi kesalahan saat memuat jam tersedia')
      } finally {
        setIsLoading(false)
      }
    }

    loadAvailableSlots()
  }, [isOpen, addon.facility_id, studioId, bookingDate, effectiveDuration, hasPackageTime, excludeReservationId])

  const calculateEndTime = (startTime: string, duration: number): string => {
    const [hours, minutes] = startTime.split(':').map(Number)
    const endHours = hours + duration
    return `${String(endHours).padStart(2, '0')}:${String(minutes || 0).padStart(2, '0')}`
  }

  const formatPrice = (price: number) => {
    return new Intl.NumberFormat('id-ID', {
      style: 'currency',
      currency: 'IDR',
      minimumFractionDigits: 0
    }).format(price)
  }

  const totalPrice = addon.hourly_rate * effectiveDuration

  const handleConfirm = () => {
    if (!selectedStartTime) {
      toast.error('Pilih jam mulai terlebih dahulu')
      return
    }

    const endTime = calculateEndTime(selectedStartTime, effectiveDuration)

    onConfirm({
      startTime: selectedStartTime,
      endTime,
      durationHours: effectiveDuration,
      totalPrice
    })

    // Reset
    setSelectedStartTime('')
    if (!isRescheduleMode) {
      setSelectedDuration(1)
    }
    onClose()
  }

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Clock className="h-5 w-5 text-[#346754]" />
            Pilih Waktu {addon.name}
          </DialogTitle>
          <DialogDescription>
            {isRescheduleMode
              ? `Pilih jam mulai untuk ${addon.name} (durasi tetap ${lockedDuration} jam)`
              : `Pilih jam mulai (interval 30 menit) dan durasi untuk ${addon.name}`
            }
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6">
          {/* Warning if package time not selected */}
          {!hasPackageTime && (
            <Alert className="bg-amber-50 border-amber-300">
              <AlertCircle className="h-4 w-4 text-amber-600" />
              <AlertDescription className="text-amber-800">
                <strong className="block mb-1">Waktu reservasi belum dipilih</strong>
                <span className="text-sm">
                  Silakan pilih tanggal dan waktu reservasi paket terlebih dahulu sebelum memilih waktu add-on.
                </span>
              </AlertDescription>
            </Alert>
          )}

          {/* Info Paket (if provided) */}
          {hasPackageTime && (
            <Alert className="bg-blue-50 border-blue-200">
              <Clock className="h-4 w-4 text-blue-600" />
              <AlertDescription className="text-blue-800">
                <strong>Waktu Paket Anda:</strong> {packageStartTime} - {packageEndTime}
                <br />
                <span className="text-sm">
                  Add-on {addon.name} dapat dipilih untuk jam yang berbeda
                </span>
              </AlertDescription>
            </Alert>
          )}

          {/* Duration Selector - Hide in reschedule mode */}
          {isRescheduleMode ? (
            <Alert className="bg-blue-50 border-blue-200">
              <Clock className="h-4 w-4 text-blue-600" />
              <AlertDescription className="text-blue-800">
                <strong>Durasi Terkunci:</strong> {lockedDuration} jam
                <br />
                <span className="text-sm">
                  Saat reschedule, durasi addon tetap sama dengan booking sebelumnya. Anda hanya perlu memilih jam mulai yang baru.
                </span>
                <div className="mt-2 font-semibold">
                  Total: {formatPrice(totalPrice)}
                </div>
              </AlertDescription>
            </Alert>
          ) : (
            <div className="space-y-3">
              <Label htmlFor="duration">Durasi (Jam)</Label>
              <div className="grid grid-cols-4 gap-2">
                {[1, 2, 3, 4].map(duration => (
                  <button
                    key={duration}
                    type="button"
                    onClick={() => hasPackageTime && setSelectedDuration(duration)}
                    disabled={!hasPackageTime}
                    className={`px-4 py-3 rounded-lg border-2 font-medium transition-all ${
                      !hasPackageTime
                        ? 'bg-slate-100 border-slate-200 text-slate-400 cursor-not-allowed'
                        : selectedDuration === duration
                        ? 'bg-[#346754] text-white border-[#346754]'
                        : 'bg-white border-slate-200 hover:border-[#346754] text-slate-700'
                    }`}
                  >
                    {duration} Jam
                    <span className="block text-xs mt-1 opacity-80">
                      {formatPrice(addon.hourly_rate * duration)}
                    </span>
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Time Slot Selector */}
          {hasPackageTime && (
            <div className="space-y-3">
              <Label>Pilih Jam Mulai (Interval 30 menit)</Label>
              {isLoading ? (
                <div className="text-center py-8">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[#346754] mx-auto mb-2"></div>
                  <p className="text-sm text-slate-600">Memuat jam tersedia...</p>
                </div>
              ) : availableSlots.length === 0 ? (
                <div className="text-center py-8">
                  <AlertCircle className="h-12 w-12 text-slate-400 mx-auto mb-2" />
                  <p className="text-sm text-slate-600 font-medium">Studio tutup pada tanggal ini</p>
                  <p className="text-xs text-slate-500 mt-1">Pilih tanggal lain untuk booking</p>
                </div>
              ) : (
                <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-5 lg:grid-cols-6 gap-2 max-h-80 overflow-y-auto p-1">
                  {availableSlots.map(slot => (
                    <button
                      key={slot.time}
                      type="button"
                      onClick={() => slot.available && setSelectedStartTime(slot.time)}
                      disabled={!slot.available}
                      className={`px-2 py-2 rounded-lg border text-xs font-medium transition-all ${
                        selectedStartTime === slot.time
                          ? 'bg-[#346754] text-white border-[#346754]'
                          : slot.available
                          ? 'bg-white border-slate-200 hover:border-[#346754] text-slate-700'
                          : 'bg-slate-100 border-slate-200 text-slate-400 cursor-not-allowed'
                      }`}
                    >
                      {slot.time}
                      {!slot.available && (
                        <span className="block text-[10px] mt-0.5">Penuh</span>
                      )}
                    </button>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* Summary */}
          {selectedStartTime && (
            <Alert className="bg-green-50 border-green-200">
              <CheckCircle2 className="h-4 w-4 text-green-600" />
              <AlertDescription className="text-green-800">
                <div className="space-y-1">
                  <p><strong>{addon.name}:</strong> {selectedStartTime} - {calculateEndTime(selectedStartTime, selectedDuration)}</p>
                  <p><strong>Durasi:</strong> {selectedDuration} jam</p>
                  <p className="text-lg font-bold">Total: {formatPrice(totalPrice)}</p>
                </div>
              </AlertDescription>
            </Alert>
          )}

          {/* Actions */}
          <div className="flex justify-end gap-3 pt-4 border-t">
            <Button type="button" variant="outline" onClick={onClose}>
              Batal
            </Button>
            <Button
              onClick={handleConfirm}
              disabled={!hasPackageTime || !selectedStartTime}
              className="bg-[#346754] hover:bg-[#346754]/90"
            >
              {hasPackageTime ? `Tambahkan ${formatPrice(totalPrice)}` : 'Pilih Waktu Paket Dulu'}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}
