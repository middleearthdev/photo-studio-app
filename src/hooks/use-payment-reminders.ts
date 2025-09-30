import { useQuery } from '@tanstack/react-query'
import { createClient } from '@/lib/supabase/client'
import { type Reservation } from '@/actions/reservations'

export interface PaymentReminder {
  id: string
  reservation: Reservation
  reminderTime: Date
  cancellationTime: Date
  timeUntilCancellation: string
  shouldShowReminder: boolean
}

async function getPaymentReminders(studioId: string): Promise<PaymentReminder[]> {
  const supabase = createClient()
  
  // Get pending reservations with pending payment that need reminders
  const { data: reservations, error } = await supabase
    .from('reservations')
    .select(`
      *,
      customer:customers(*),
      package:packages(*)
    `)
    .eq('studio_id', studioId)
    .eq('status', 'pending')
    .eq('payment_status', 'pending')
    .gte('created_at', new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString()) // Last 24 hours
    .order('created_at', { ascending: false })

  if (error) {
    throw new Error(`Failed to fetch payment reminders: ${error.message}`)
  }

  const now = new Date()
  
  return reservations.map((reservation) => {
    const createdAt = new Date(reservation.created_at)
    const reminderTime = new Date(createdAt.getTime() + 10 * 60 * 1000) // 10 minutes after creation
    const cancellationTime = new Date(createdAt.getTime() + 15 * 60 * 1000) // 15 minutes after creation
    
    // Check if reminder should be shown (between 10-15 minutes after creation)
    const shouldShowReminder = now >= reminderTime && now < cancellationTime
    
    // Calculate time until cancellation
    const timeUntilCancellation = cancellationTime > now 
      ? formatTimeUntil(cancellationTime)
      : 'Expired'
    
    return {
      id: reservation.id,
      reservation,
      reminderTime,
      cancellationTime,
      timeUntilCancellation,
      shouldShowReminder
    }
  }).filter(reminder => reminder.shouldShowReminder || reminder.timeUntilCancellation !== 'Expired')
}

function formatTimeUntil(targetTime: Date): string {
  const now = new Date()
  const diffMs = targetTime.getTime() - now.getTime()
  
  if (diffMs <= 0) return 'Expired'
  
  const minutes = Math.floor(diffMs / (1000 * 60))
  const seconds = Math.floor((diffMs % (1000 * 60)) / 1000)
  
  if (minutes > 0) {
    return `${minutes} menit ${seconds} detik`
  } else {
    return `${seconds} detik`
  }
}

export function usePaymentReminders(studioId: string) {
  return useQuery({
    queryKey: ['payment-reminders', studioId],
    queryFn: () => getPaymentReminders(studioId),
    enabled: !!studioId,
    refetchInterval: 30000, // Refresh every 30 seconds
    staleTime: 15000, // Consider data stale after 15 seconds
  })
}

export function generateFollowUpMessage(reservation: Reservation, cancellationTime: Date): string {
  const customerName = reservation.customer?.full_name || 'Customer'
  const bookingCode = reservation.booking_code
  const packageName = reservation.package?.name || 'Package'
  
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
Total DP: ${formatPrice(reservation.dp_amount)}

*⚠️ PENTING - Segera Lakukan Pembayaran*
Booking Anda akan otomatis dibatalkan jika pembayaran DP belum diterima sampai jam *${cancellationTimeFormatted}* hari ini.

Untuk menjaga slot waktu Anda, silakan segera lakukan pembayaran DP dan kirim bukti transfer ke nomor ini.

Kami tunggu konfirmasi pembayaran Anda! 🙏

Terima kasih,
Tim Studio 📸`
}