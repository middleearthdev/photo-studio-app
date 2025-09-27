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
    message = `Event sudah lewat ${Math.abs(daysRemaining)} hari`
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
 * Generate WhatsApp reminder messages
 */
export function generateWhatsAppMessage(reservation: Reservation, type: 'payment' | 'reschedule' | 'confirmation'): string {
  const customerName = reservation.customer?.full_name || 'Customer'
  const bookingCode = reservation.booking_code
  const eventDate = new Date(reservation.reservation_date).toLocaleDateString('id-ID', {
    weekday: 'long',
    year: 'numeric',
    month: 'long',
    day: 'numeric'
  })
  const eventTime = `${reservation.start_time} - ${reservation.end_time}`
  const daysRemaining = getDaysUntilReservation(reservation.reservation_date)

  const baseMessage = `Halo ${customerName}!\n\n` +
    `Booking Code: *${bookingCode}*\n` +
    `Tanggal: *${eventDate}*\n` +
    `Waktu: *${eventTime}*\n\n`

  switch (type) {
    case 'payment':
      let paymentDeadlineText = ''
      let urgencyMessage = ''
      
      if (daysRemaining < 0) {
        // Event sudah lewat
        paymentDeadlineText = `*⚠️ EVENT SUDAH LEWAT ${Math.abs(daysRemaining)} HARI*`
        urgencyMessage = `Booking Anda sudah melewati tanggal acara. Silakan hubungi kami untuk penyelesaian lebih lanjut.`
      } else if (daysRemaining === 0) {
        // Event hari ini
        paymentDeadlineText = '*⚠️ EVENT HARI INI - BATAS PELUNASAN SUDAH TERLEWAT*'
        urgencyMessage = `Booking Anda hari ini namun belum lunas. Silakan hubungi kami segera untuk konfirmasi.`
      } else if (daysRemaining === 1) {
        // H-1, sudah melewati batas H-3
        paymentDeadlineText = '*⚠️ BATAS PELUNASAN SUDAH TERLEWAT*'
        urgencyMessage = `Batas waktu pelunasan (H-3) sudah terlewat. Event besok namun belum lunas. Silakan hubungi kami segera.`
      } else if (daysRemaining === 2) {
        // H-2, sudah melewati batas H-3
        paymentDeadlineText = '*⚠️ BATAS PELUNASAN SUDAH TERLEWAT*'
        urgencyMessage = `Batas waktu pelunasan (H-3) sudah terlewat. Silakan hubungi kami segera untuk konfirmasi.`
      } else if (daysRemaining === 3) {
        // H-3, hari terakhir pelunasan
        paymentDeadlineText = '*BATAS WAKTU PELUNASAN HARI INI*'
        urgencyMessage = `Mohon segera lakukan pelunasan agar booking Anda terkonfirmasi.`
      } else if (daysRemaining === 4) {
        // H-4, besok deadline
        paymentDeadlineText = '*BATAS WAKTU PELUNASAN BESOK*'
        urgencyMessage = `Mohon segera lakukan pelunasan agar booking Anda terkonfirmasi.`
      } else if (daysRemaining === 5) {
        // H-5, 2 hari lagi deadline
        paymentDeadlineText = '*Batas waktu pelunasan: 2 hari lagi*'
        urgencyMessage = `Mohon segera lakukan pelunasan agar booking Anda terkonfirmasi.`
      } else {
        // Masih ada waktu
        const deadlineDays = daysRemaining - 3
        paymentDeadlineText = `*Batas waktu pelunasan: ${deadlineDays} hari lagi*`
        urgencyMessage = `Mohon segera lakukan pelunasan agar booking Anda terkonfirmasi.`
      }
      
      return baseMessage +
        `💰 *REMINDER PELUNASAN*\n\n` +
        `Sisa pembayaran: *${formatCurrency(reservation.remaining_amount)}*\n` +
        `${paymentDeadlineText}\n\n` +
        `${urgencyMessage}\n\n` +
        `Terima kasih! 🙏`

    case 'reschedule':
      let rescheduleDeadlineText = ''
      let rescheduleMessage = ''
      
      if (daysRemaining < 0) {
        // Event sudah lewat
        rescheduleDeadlineText = `*⚠️ EVENT SUDAH LEWAT ${Math.abs(daysRemaining)} HARI*`
        rescheduleMessage = `Booking Anda sudah melewati tanggal acara. Reschedule tidak dapat dilakukan.`
      } else if (daysRemaining === 0) {
        // Event hari ini
        rescheduleDeadlineText = '*⚠️ EVENT HARI INI - RESCHEDULE TIDAK DAPAT DILAKUKAN*'
        rescheduleMessage = `Event Anda hari ini. Reschedule sudah tidak memungkinkan. Silakan hubungi kami jika ada kendala.`
      } else if (daysRemaining === 1) {
        // H-1, sudah melewati batas H-3
        rescheduleDeadlineText = '*⚠️ BATAS RESCHEDULE SUDAH TERLEWAT*'
        rescheduleMessage = `Batas waktu reschedule (H-3) sudah terlewat. Event besok dan reschedule tidak dapat dilakukan.`
      } else if (daysRemaining === 2) {
        // H-2, sudah melewati batas H-3
        rescheduleDeadlineText = '*⚠️ BATAS RESCHEDULE SUDAH TERLEWAT*'
        rescheduleMessage = `Batas waktu reschedule (H-3) sudah terlewat. Reschedule tidak dapat dilakukan.`
      } else if (daysRemaining === 3) {
        // H-3, hari terakhir reschedule
        rescheduleDeadlineText = '*BATAS RESCHEDULE HARI INI*'
        rescheduleMessage = `Jika Anda perlu mengubah jadwal, mohon konfirmasi hari ini juga (batas H-3).`
      } else if (daysRemaining === 4) {
        // H-4, besok deadline reschedule
        rescheduleDeadlineText = '*BATAS RESCHEDULE BESOK*'
        rescheduleMessage = `Jika Anda perlu mengubah jadwal, mohon konfirmasi maksimal besok (batas H-3).`
      } else {
        // Masih ada waktu
        const deadlineDays = daysRemaining - 3
        rescheduleDeadlineText = `*Batas reschedule: ${deadlineDays} hari lagi*`
        rescheduleMessage = `Jika Anda perlu mengubah jadwal, mohon konfirmasi maksimal H-3 (${deadlineDays} hari lagi).`
      }
      
      return baseMessage +
        `📅 *INFO RESCHEDULE*\n\n` +
        `${rescheduleDeadlineText}\n\n` +
        `${rescheduleMessage}\n\n` +
        `Hubungi kami untuk reschedule. Terima kasih! 🙏`

    case 'confirmation':
      return baseMessage +
        `✅ *KONFIRMASI BOOKING*\n\n` +
        `Booking Anda telah dikonfirmasi!\n` +
        `Mohon datang tepat waktu pada jadwal yang telah ditentukan.\n\n` +
        `Jika ada pertanyaan, jangan ragu untuk menghubungi kami.\n\n` +
        `Terima kasih! 🙏`

    default:
      return baseMessage + `Terima kasih atas booking Anda! 🙏`
  }
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
  return `https://wa.me/${formattedPhone}?text=${encodedMessage}`
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