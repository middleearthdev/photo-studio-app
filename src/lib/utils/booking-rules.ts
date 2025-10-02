import { type Reservation } from '@/actions/reservations'

export interface BusinessRuleResult {
  allowed: boolean
  reason?: string
  daysRemaining?: number
}

export interface DeadlineInfo {
  daysRemaining: number
  isUrgent: boolean
  isPastDeadline: boolean
  message: string
}

/**
 * Calculate days difference between today and reservation date
 */
export function getDaysUntilReservation(reservationDate: string): number {
  const today = new Date()
  today.setHours(0, 0, 0, 0)

  const eventDate = new Date(reservationDate)
  eventDate.setHours(0, 0, 0, 0)

  const diffTime = eventDate.getTime() - today.getTime()
  const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24))

  return diffDays
}

/**
 * Check if payment can be completed (H-3 rule)
 */
export function canCompletePayment(reservation: Reservation): BusinessRuleResult {
  const daysRemaining = getDaysUntilReservation(reservation.reservation_date)

  if (reservation.payment_status === 'completed') {
    return { allowed: false, reason: 'Pembayaran sudah lunas' }
  }

  if (daysRemaining < 3) {
    return {
      allowed: false,
      reason: 'Batas waktu pelunasan maksimal H-3 sudah terlewat',
      daysRemaining
    }
  }

  if (reservation.remaining_amount <= 0) {
    return { allowed: false, reason: 'Tidak ada sisa pembayaran' }
  }

  return {
    allowed: true,
    reason: `Masih ${daysRemaining} hari untuk melunasi`,
    daysRemaining
  }
}

/**
 * Check if booking can be rescheduled (H-3 rule)
 */
export function canRescheduleBooking(reservation: Reservation): BusinessRuleResult {
  const daysRemaining = getDaysUntilReservation(reservation.reservation_date)

  if (['completed', 'cancelled'].includes(reservation.status)) {
    return {
      allowed: false,
      reason: `Tidak dapat reschedule booking yang sudah ${reservation.status}`
    }
  }

  if (daysRemaining < 3) {
    return {
      allowed: false,
      reason: 'Batas waktu reschedule maksimal H-3 sudah terlewat',
      daysRemaining
    }
  }

  return {
    allowed: true,
    reason: `Masih ${daysRemaining} hari untuk reschedule`,
    daysRemaining
  }
}

/**
 * Check cancellation rules and DP policy
 */
export function getCancellationInfo(reservation: Reservation): {
  canCancel: boolean
  dpPolicy: 'hangus'
  message: string
} {
  if (['completed', 'cancelled'].includes(reservation.status)) {
    return {
      canCancel: false,
      dpPolicy: 'hangus',
      message: `Booking sudah ${reservation.status}`
    }
  }

  const daysRemaining = getDaysUntilReservation(reservation.reservation_date)
  const hasPaid = ['partial', 'completed'].includes(reservation.payment_status)

  return {
    canCancel: true,
    dpPolicy: 'hangus',
    message: hasPaid
      ? `⚠️ Pembatalan: DP sebesar ${formatCurrency(reservation.dp_amount)} akan HANGUS dan tidak dikembalikan`
      : 'Booking dapat dibatalkan. Jika sudah bayar DP, dana tidak akan dikembalikan'
  }
}

/**
 * Get deadline information for UI indicators
 */
export function getDeadlineInfo(reservation: Reservation): DeadlineInfo {
  const daysRemaining = getDaysUntilReservation(reservation.reservation_date)

  let message = ''
  let isUrgent = false
  let isPastDeadline = false

  if (daysRemaining < 0) {
    message = `Event sudah lewat`
    isPastDeadline = true
    isUrgent = true
  } else if (daysRemaining === 0) {
    message = 'Event hari ini'
    isUrgent = true
  } else if (daysRemaining === 1) {
    message = 'Event besok'
    isUrgent = true
  } else if (daysRemaining === 2) {
    message = `${daysRemaining} hari lagi (H-2)`
    isUrgent = true
  } else if (daysRemaining === 3) {
    message = `${daysRemaining} hari lagi`
    isUrgent = true
  } else if (daysRemaining <= 7) {
    message = `${daysRemaining} hari lagi`
  } else {
    message = `${daysRemaining} hari lagi`
  }

  return {
    daysRemaining,
    isUrgent,
    isPastDeadline,
    message
  }
}

/**
 * Legacy function - now delegates to centralized templates
 * @deprecated Use centralized WhatsApp templates service instead
 */
export function generateWhatsAppMessage(reservation: Reservation, type: 'payment' | 'reschedule' | 'confirmation'): string {
  // Import here to avoid circular dependency
  const { generateWhatsAppMessage: centralizedGenerator } = require('@/lib/services/whatsapp-templates')
  return centralizedGenerator(reservation, type)
}

/**
 * Get WhatsApp URL for sending message
 */
export function getWhatsAppURL(phoneNumber: string, message: string): string {
  // Clean phone number (remove spaces, dashes, etc)
  const cleanPhone = phoneNumber.replace(/\D/g, '')

  // Add country code if not present
  const formattedPhone = cleanPhone.startsWith('62')
    ? cleanPhone
    : cleanPhone.startsWith('0')
      ? '62' + cleanPhone.substring(1)
      : '62' + cleanPhone

  const encodedMessage = encodeURIComponent(message)
  return `https://api.whatsapp.com/send/?phone=${formattedPhone}&text=${encodedMessage}`
}

/**
 * Format currency (reusable utility)
 */
function formatCurrency(amount: number): string {
  return new Intl.NumberFormat('id-ID', {
    style: 'currency',
    currency: 'IDR',
    minimumFractionDigits: 0,
  }).format(amount)
}

/**
 * Get priority level based on booking urgency
 */
export function getBookingPriority(reservation: Reservation): {
  priority: 'low' | 'medium' | 'high' | 'urgent'
  color: string
  label: string
} {
  const daysRemaining = getDaysUntilReservation(reservation.reservation_date)
  const needsPayment = reservation.payment_status !== 'completed' && reservation.remaining_amount > 0

  if (daysRemaining <= 0) {
    return { priority: 'urgent', color: 'red', label: 'URGENT' }
  }

  if (daysRemaining <= 2) {
    return { priority: 'urgent', color: 'red', label: 'URGENT' }
  }

  if (daysRemaining === 3 && needsPayment) {
    return { priority: 'high', color: 'orange', label: 'HIGH' }
  }

  if (daysRemaining <= 7) {
    return { priority: 'medium', color: 'yellow', label: 'MEDIUM' }
  }

  return { priority: 'low', color: 'green', label: 'LOW' }
}