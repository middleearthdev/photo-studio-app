import { type Reservation } from '@/actions/reservations'
import { formatCurrency, formatDate } from '@/lib/utils'

export interface WhatsAppTemplate {
  id: string
  name: string
  description: string
  category: 'booking' | 'payment' | 'reminder' | 'cancellation' | 'confirmation' | 'general'
  conditions?: {
    status?: string[]
    paymentStatus?: string[]
    customCheck?: (reservation: Reservation) => boolean
  }
  generateMessage: (reservation: Reservation) => string
}


export const formatTime = (timeString: string): string => {
  return timeString.slice(0, 5) // HH:MM
}

export const getDaysUntilReservation = (reservationDate: string): number => {
  const today = new Date()
  today.setHours(0, 0, 0, 0)

  const eventDate = new Date(reservationDate)
  eventDate.setHours(0, 0, 0, 0)

  const diffTime = eventDate.getTime() - today.getTime()
  const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24))

  return diffDays
}

export const getWhatsAppURL = (phoneNumber: string, message: string): string => {
  // Clean phone number (remove spaces, dashes, etc)
  const cleanPhone = phoneNumber.replace(/\D/g, '')

  // Add country code if not present
  const formattedPhone = cleanPhone.startsWith('62')
    ? cleanPhone
    : cleanPhone.startsWith('0')
      ? '62' + cleanPhone.substring(1)
      : '62' + cleanPhone

  if (message.trim() === '') {
    return `https://api.whatsapp.com/send/?phone=${formattedPhone}`
  }

  const encodedMessage = encodeURIComponent(message)
  return `https://api.whatsapp.com/send/?phone=${formattedPhone}&text=${encodedMessage}`
}

/**
 * All WhatsApp templates in one centralized place
 */
export const WHATSAPP_TEMPLATES: WhatsAppTemplate[] = [
  // === GENERAL TEMPLATES ===
  {
    id: 'no_text',
    name: 'Tanpa Pesan',
    description: 'Buka WhatsApp tanpa pesan otomatis',
    category: 'general',
    generateMessage: () => ''
  },

  // === BOOKING TEMPLATES ===
  {
    id: 'booking_invoice',
    name: 'Send Booking Invoice',
    description: 'Kirim konfirmasi booking success dengan link booking',
    category: 'booking',
    generateMessage: (reservation: Reservation): string => {
      const customerName = reservation.customer?.full_name || 'Customer'
      const bookingCode = reservation.booking_code
      const date = formatDate(reservation.reservation_date)
      const time = `${formatTime(reservation.start_time)} - ${formatTime(reservation.end_time)}`
      const packageName = reservation.package?.name || 'Custom Package'
      const totalAmount = formatCurrency(reservation.total_amount)
      const dpAmount = formatCurrency(reservation.dp_amount)
      const remainingAmount = formatCurrency(reservation.remaining_amount)

      // Generate success link
      const baseUrl = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'
      const successLink = `${baseUrl}/booking/success?payment=completed&booking=${bookingCode}`

      let addonsText = ''
      if (reservation.reservation_addons && reservation.reservation_addons.length > 0) {
        addonsText = '\n\n*Add-ons yang dipilih:*\n' +
          reservation.reservation_addons.map(addon =>
            `• ${addon.addon?.name || 'Unknown'} (${addon.quantity}x) - ${formatCurrency(addon.total_price)}`
          ).join('\n')
      }

      return `Halo ${customerName}! 👋

Selamat! Booking Anda telah berhasil dikonfirmasi. Berikut detail booking Anda:

*📝 Detail Booking*
Booking ID: ${bookingCode}
Paket: ${packageName}
Tanggal: ${date}
Waktu: ${time}${addonsText}

*💰 Detail Pembayaran*
Total: ${totalAmount}
DP Dibayar: ${dpAmount}
${reservation.remaining_amount > 0 ? `Sisa: ${remainingAmount}` : 'Status: LUNAS [LUNAS]'}

*🔗 Link Booking Anda*
${successLink}

Simpan link di atas untuk melihat detail booking lengkap dan bukti pembayaran Anda.

Terima kasih telah mempercayai layanan kami! Kami tunggu kedatangan Anda di studio.

Salam,
Tim Studio 📸`
    }
  },

  // === PAYMENT TEMPLATES ===
  {
    id: 'follow_up_payment',
    name: 'Follow-Up Payment',
    description: 'Reminder untuk pembayaran dengan deadline cancellation',
    category: 'payment',
    conditions: {
      status: ['pending'],
      paymentStatus: ['pending']
    },
    generateMessage: (reservation: Reservation): string => {
      const customerName = reservation.customer?.full_name || 'Customer'
      const bookingCode = reservation.booking_code
      const packageName = reservation.package?.name || 'Package'

      // Calculate cancellation time (15 minutes after creation)
      const createdAt = new Date(reservation.created_at)
      const cancellationTime = new Date(createdAt.getTime() + 15 * 60 * 1000)
      const cancellationTimeFormatted = cancellationTime.toLocaleTimeString('id-ID', {
        hour: '2-digit',
        minute: '2-digit'
      })

      return `Halo ${customerName}! 👋

Kami ingin mengingatkan Anda tentang booking yang baru saja dibuat:

*📝 Detail Booking*
Booking ID: ${bookingCode}
Paket: ${packageName}
Tanggal: ${formatDate(reservation.reservation_date)}
Waktu: ${formatTime(reservation.start_time)} - ${formatTime(reservation.end_time)}
Total DP: ${formatCurrency(reservation.dp_amount)}

*[PENTING] PENTING - Segera Lakukan Pembayaran*
Booking Anda akan otomatis dibatalkan jika pembayaran DP belum diterima sampai jam *${cancellationTimeFormatted}* hari ini.

Untuk menjaga slot waktu Anda, silakan segera lakukan pembayaran DP dan kirim bukti transfer ke nomor ini.

Kami tunggu konfirmasi pembayaran Anda! 
Terima kasih,
Tim Studio 📸`
    }
  },

  {
    id: 'payment_reminder',
    name: 'Reminder Pelunasan',
    description: 'Reminder pelunasan dengan deadline H-3 untuk booking terkonfirmasi',
    category: 'payment',
    conditions: {
      status: ['confirmed'],
      paymentStatus: ['partial'],
      customCheck: (reservation) => reservation.remaining_amount > 0
    },
    generateMessage: (reservation: Reservation): string => {
      const customerName = reservation.customer?.full_name || 'Customer'
      const bookingCode = reservation.booking_code
      const packageName = reservation.package?.name || 'Custom Package'
      const date = formatDate(reservation.reservation_date)
      const time = `${formatTime(reservation.start_time)} - ${formatTime(reservation.end_time)}`
      const remainingAmount = formatCurrency(reservation.remaining_amount)

      // Calculate days until reservation
      const daysRemaining = getDaysUntilReservation(reservation.reservation_date)

      let deadlineText = ''
      let urgencyMessage = ''

      if (daysRemaining < 0) {
        deadlineText = `*[PENTING] EVENT SUDAH LEWAT ${Math.abs(daysRemaining)} HARI*`
        urgencyMessage = `Booking Anda sudah melewati tanggal acara. Silakan hubungi kami untuk penyelesaian lebih lanjut.`
      } else if (daysRemaining === 0) {
        deadlineText = '*[PENTING] EVENT HARI INI - BATAS PELUNASAN SUDAH TERLEWAT*'
        urgencyMessage = `Booking Anda hari ini namun belum lunas. Silakan hubungi kami segera untuk konfirmasi.`
      } else if (daysRemaining === 1) {
        deadlineText = '*[PENTING] BATAS PELUNASAN SUDAH TERLEWAT*'
        urgencyMessage = `Batas waktu pelunasan (H-3) sudah terlewat. Event besok namun belum lunas. Silakan hubungi kami segera.`
      } else if (daysRemaining === 2) {
        deadlineText = '*[PENTING] BATAS PELUNASAN SUDAH TERLEWAT*'
        urgencyMessage = `Batas waktu pelunasan (H-3) sudah terlewat. Silakan hubungi kami segera untuk konfirmasi.`
      } else if (daysRemaining === 3) {
        deadlineText = '*[URGENT] BATAS WAKTU PELUNASAN HARI INI*'
        urgencyMessage = `Mohon segera lakukan pelunasan agar booking Anda terkonfirmasi.`
      } else if (daysRemaining === 4) {
        deadlineText = '*⏰ BATAS WAKTU PELUNASAN BESOK*'
        urgencyMessage = `Mohon segera lakukan pelunasan agar booking Anda terkonfirmasi.`
      } else if (daysRemaining === 5) {
        deadlineText = '*⏰ Batas waktu pelunasan: 2 hari lagi*'
        urgencyMessage = `Mohon segera lakukan pelunasan agar booking Anda terkonfirmasi.`
      } else {
        const deadlineDays = daysRemaining - 3
        deadlineText = `*📅 Batas waktu pelunasan: ${deadlineDays} hari lagi*`
        urgencyMessage = `Mohon segera lakukan pelunasan agar booking Anda terkonfirmasi.`
      }

      return `Halo ${customerName}! 👋

*💰 REMINDER PELUNASAN*

Booking Anda telah dikonfirmasi namun masih ada sisa pembayaran yang perlu diselesaikan:

*📝 Detail Booking*
Booking ID: ${bookingCode}
Paket: ${packageName}
Tanggal: ${date}
Waktu: ${time}

*💰 Sisa Pembayaran*
Jumlah: ${remainingAmount}
${deadlineText}

${urgencyMessage}

*📍 Cara Pembayaran:*
Silakan transfer ke rekening yang telah diberikan dan kirim bukti transfer ke nomor ini.

Terima kasih atas perhatiannya! 
Salam,
Tim Studio 📸`
    }
  },

  {
    id: 'payment_completed',
    name: 'Payment Completed Invoice',
    description: 'Invoice untuk pembayaran yang sudah lunas',
    category: 'payment',
    conditions: {
      paymentStatus: ['completed']
    },
    generateMessage: (reservation: Reservation): string => {
      const customerName = reservation.customer?.full_name || 'Customer'
      const bookingCode = reservation.booking_code
      const packageName = reservation.package?.name || 'Custom Package'
      const date = formatDate(reservation.reservation_date)
      const time = `${formatTime(reservation.start_time)} - ${formatTime(reservation.end_time)}`
      const totalAmount = formatCurrency(reservation.total_amount)

      // Generate success link
      const baseUrl = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'
      const successLink = `${baseUrl}/booking/success?payment=completed&booking=${bookingCode}`

      let addonsText = ''
      if (reservation.reservation_addons && reservation.reservation_addons.length > 0) {
        addonsText = '\n\n*Add-ons yang dipilih:*\n' +
          reservation.reservation_addons.map(addon =>
            `• ${addon.addon?.name || 'Unknown'} (${addon.quantity}x) - ${formatCurrency(addon.total_price)}`
          ).join('\n')
      }

      return `Halo ${customerName}! 🎉

Terima kasih! Pembayaran Anda telah LUNAS dan booking telah dikonfirmasi.

*📝 Detail Booking*
Booking ID: ${bookingCode}
Paket: ${packageName}
Tanggal: ${date}
Waktu: ${time}${addonsText}

*💰 Pembayaran LUNAS ✅*
Total Dibayar: ${totalAmount}
Status: LUNAS

*🔗 Link Booking Anda*
${successLink}

*📍 Informasi Penting:*
• Simpan link di atas untuk referensi booking
• Datang 15 menit sebelum jadwal
• Bawa identitas diri (KTP/SIM)
• Jika ada pertanyaan, hubungi kami di nomor ini

Kami sangat menantikan sesi foto Anda! 📸
Salam hangat,
Tim Studio 📸`
    }
  },

  // === CANCELLATION TEMPLATES ===
  {
    id: 'cancellation_notice',
    name: 'Pemberitahuan Pembatalan',
    description: 'Notifikasi pembatalan booking dengan kebijakan refund',
    category: 'cancellation',
    conditions: {
      status: ['cancelled']
    },
    generateMessage: (reservation: Reservation): string => {
      const customerName = reservation.customer?.full_name || 'Customer'
      const bookingCode = reservation.booking_code
      const packageName = reservation.package?.name || 'Custom Package'
      const date = formatDate(reservation.reservation_date)
      const time = `${formatTime(reservation.start_time)} - ${formatTime(reservation.end_time)}`
      const dpAmount = formatCurrency(reservation.dp_amount)

      // Check if customer has paid DP
      const hasPaidDP = ['partial', 'completed'].includes(reservation.payment_status)
      const cancellationDate = reservation.cancelled_at
        ? new Date(reservation.cancelled_at).toLocaleDateString('id-ID', {
          weekday: 'long',
          year: 'numeric',
          month: 'long',
          day: 'numeric'
        })
        : 'Hari ini'

      let refundPolicyText = ''
      if (hasPaidDP) {
        refundPolicyText = `\n*[REFUND] Kebijakan Pembatalan:*
DP yang telah dibayar sebesar ${dpAmount} tidak dapat dikembalikan (HANGUS) sesuai dengan ketentuan yang berlaku.`
      } else {
        refundPolicyText = `\n*ℹ️ Tidak ada pembayaran yang perlu dikembalikan karena DP belum dibayarkan.*`
      }

      return `Halo ${customerName},

Kami ingin memberitahukan bahwa booking Anda telah dibatalkan.

*📝 Detail Booking yang Dibatalkan*
Booking ID: ${bookingCode}
Paket: ${packageName}
Tanggal: ${date}
Waktu: ${time}
Status: DIBATALKAN
Tanggal Pembatalan: ${cancellationDate}
${refundPolicyText}

*[KONTAK] Bantuan Lebih Lanjut:*
Jika Anda memiliki pertanyaan terkait pembatalan ini atau ingin melakukan booking ulang, silakan hubungi kami di nomor ini.

Terima kasih atas pengertiannya.

Salam,
Tim Studio 📸`
    }
  },

  // === CONFIRMATION TEMPLATES ===
  {
    id: 'booking_confirmation',
    name: 'Konfirmasi Booking',
    description: 'Konfirmasi booking untuk customer',
    category: 'confirmation',
    conditions: {
      status: ['confirmed']
    },
    generateMessage: (reservation: Reservation): string => {
      const customerName = reservation.customer?.full_name || 'Customer'
      const bookingCode = reservation.booking_code
      const eventDate = formatDate(reservation.reservation_date)
      const eventTime = `${formatTime(reservation.start_time)} - ${formatTime(reservation.end_time)}`

      return `Halo ${customerName}! 👋

*✅ KONFIRMASI BOOKING*

Booking Code: *${bookingCode}*
Tanggal: *${eventDate}*
Waktu: *${eventTime}*

Booking Anda telah dikonfirmasi!
Mohon datang tepat waktu pada jadwal yang telah ditentukan.

Jika ada pertanyaan, jangan ragu untuk menghubungi kami.

Terima kasih! 🙏`
    }
  },

  // === REMINDER TEMPLATES ===
  {
    id: 'reschedule_reminder',
    name: 'Reminder Reschedule',
    description: 'Reminder deadline reschedule (H-3)',
    category: 'reminder',
    conditions: {
      customCheck: (reservation) => {
        const daysRemaining = getDaysUntilReservation(reservation.reservation_date)
        return daysRemaining >= 3 // Only show if more than or equal H-3
      }
    },
    generateMessage: (reservation: Reservation): string => {
      const customerName = reservation.customer?.full_name || 'Customer'
      const bookingCode = reservation.booking_code
      const eventDate = formatDate(reservation.reservation_date)
      const eventTime = `${formatTime(reservation.start_time)} - ${formatTime(reservation.end_time)}`
      const daysRemaining = getDaysUntilReservation(reservation.reservation_date)

      let rescheduleDeadlineText = ''
      let rescheduleMessage = ''

      if (daysRemaining < 0) {
        rescheduleDeadlineText = `*[PENTING] EVENT SUDAH LEWAT ${Math.abs(daysRemaining)} HARI*`
        rescheduleMessage = `Booking Anda sudah melewati tanggal acara. Reschedule tidak dapat dilakukan.`
      } else if (daysRemaining === 0) {
        rescheduleDeadlineText = '*[PENTING] EVENT HARI INI - RESCHEDULE TIDAK DAPAT DILAKUKAN*'
        rescheduleMessage = `Event Anda hari ini. Reschedule sudah tidak memungkinkan. Silakan hubungi kami jika ada kendala.`
      } else if (daysRemaining === 1) {
        rescheduleDeadlineText = '*[PENTING] BATAS RESCHEDULE SUDAH TERLEWAT*'
        rescheduleMessage = `Batas waktu reschedule (H-3) sudah terlewat. Event besok dan reschedule tidak dapat dilakukan.`
      } else if (daysRemaining === 2) {
        rescheduleDeadlineText = '*[PENTING] BATAS RESCHEDULE SUDAH TERLEWAT*'
        rescheduleMessage = `Batas waktu reschedule (H-3) sudah terlewat. Reschedule tidak dapat dilakukan.`
      } else if (daysRemaining === 3) {
        rescheduleDeadlineText = '*BATAS RESCHEDULE HARI INI*'
        rescheduleMessage = `Jika Anda perlu mengubah jadwal, mohon konfirmasi hari ini juga (batas H-3).`
      } else if (daysRemaining === 4) {
        rescheduleDeadlineText = '*BATAS RESCHEDULE BESOK*'
        rescheduleMessage = `Jika Anda perlu mengubah jadwal, mohon konfirmasi maksimal besok (batas H-3).`
      } else {
        const deadlineDays = daysRemaining - 3
        rescheduleDeadlineText = `*Batas reschedule: ${deadlineDays} hari lagi*`
        rescheduleMessage = `Jika Anda perlu mengubah jadwal, mohon konfirmasi maksimal H-3 (${deadlineDays} hari lagi).`
      }

      return `Halo ${customerName}! 👋

*📅 INFO RESCHEDULE*

Booking Code: *${bookingCode}*
Tanggal: *${eventDate}*
Waktu: *${eventTime}*

${rescheduleDeadlineText}

${rescheduleMessage}

Hubungi kami untuk reschedule. Terima kasih! 🙏`
    }
  }
]

/**
 * Get available templates based on reservation conditions
 */
export const getAvailableTemplates = (reservation: Reservation): WhatsAppTemplate[] => {
  // Special case: If reservation is cancelled, only show cancellation notice and no_text
  if (reservation.status === 'cancelled') {
    return WHATSAPP_TEMPLATES.filter(template =>
      template.id === 'no_text' || template.id === 'cancellation_notice'
    )
  }

  return WHATSAPP_TEMPLATES.filter(template => {
    if (!template.conditions) return true

    const { status, paymentStatus, customCheck } = template.conditions

    // Check status condition
    if (status && !status.includes(reservation.status)) {
      return false
    }

    // Check payment status condition
    if (paymentStatus && !paymentStatus.includes(reservation.payment_status)) {
      return false
    }

    // Check custom condition
    if (customCheck && !customCheck(reservation)) {
      return false
    }

    return true
  })
}

/**
 * Get template by ID
 */
export const getTemplateById = (id: string): WhatsAppTemplate | undefined => {
  return WHATSAPP_TEMPLATES.find(template => template.id === id)
}

/**
 * Get templates by category
 */
export const getTemplatesByCategory = (category: string): WhatsAppTemplate[] => {
  return WHATSAPP_TEMPLATES.filter(template => template.category === category)
}

/**
 * Send WhatsApp message with template
 */
export const sendWhatsAppWithTemplate = (
  reservation: Reservation,
  templateId: string,
  phoneNumber?: string
): string => {
  const template = getTemplateById(templateId)
  if (!template) {
    throw new Error(`Template with ID "${templateId}" not found`)
  }

  const phone = phoneNumber || reservation.customer?.phone || reservation.guest_phone
  if (!phone) {
    throw new Error('No phone number available')
  }

  const message = template.generateMessage(reservation)
  return getWhatsAppURL(phone, message)
}

/**
 * Legacy function for backward compatibility
 * Maps old message types to new template system
 */
export const generateWhatsAppMessage = (
  reservation: Reservation,
  type: 'payment' | 'reschedule' | 'confirmation'
): string => {
  const templateMap = {
    payment: 'payment_reminder',
    reschedule: 'reschedule_reminder',
    confirmation: 'booking_confirmation'
  }

  const templateId = templateMap[type]
  const template = getTemplateById(templateId)

  if (!template) {
    throw new Error(`No template found for type "${type}"`)
  }

  return template.generateMessage(reservation)
}