'use client'

import { useQuery } from '@tanstack/react-query'
import { useReservationStats } from './use-reservations'
import { usePaymentStats } from './use-payments'
import { usePaginatedCustomers } from './use-customers'
import { useReviews } from './use-reviews'

export interface DashboardStats {
  totalRevenue: number
  monthlyRevenue: number
  revenueGrowth: number
  activeBookings: number
  todayBookings: number
  bookingGrowth: number
  totalCustomers: number
  weeklyCustomers: number
  customerGrowth: number
  averageRating: number
  ratingGrowth: number
  totalReviews: number
  pendingPayments: number
  pendingPaymentAmount: number
  upcomingBookings: number
}

export interface RecentBooking {
  id: string
  bookingCode: string
  customerName: string
  packageName: string
  date: string
  time: string
  status: 'pending' | 'confirmed' | 'in_progress' | 'completed' | 'cancelled'
  amount: number
  isGuest: boolean
}

export interface PendingAction {
  type: 'payment' | 'review' | 'booking' | 'customer'
  title: string
  count: number
  description: string
  href: string
  urgent: boolean
}

// Query keys
export const dashboardKeys = {
  stats: (studioId: string) => ['dashboard', 'stats', studioId] as const,
  recentBookings: (studioId: string) => ['dashboard', 'recent-bookings', studioId] as const,
  pendingActions: (studioId: string) => ['dashboard', 'pending-actions', studioId] as const,
}

// Get comprehensive dashboard statistics
export function useDashboardStats(studioId?: string) {
  const { data: reservationStats } = useReservationStats(studioId)
  const { data: paymentStats } = usePaymentStats(studioId)
  const { data: customersData } = usePaginatedCustomers({ studioId: studioId || '' })
  const { data: reviews } = useReviews()

  return useQuery({
    queryKey: dashboardKeys.stats(studioId || ''),
    queryFn: async (): Promise<DashboardStats> => {
      // Calculate current month dates
      const now = new Date()
      const currentMonthStart = new Date(now.getFullYear(), now.getMonth(), 1)
      const lastMonthStart = new Date(now.getFullYear(), now.getMonth() - 1, 1)
      const lastMonthEnd = new Date(now.getFullYear(), now.getMonth(), 0)
      const weekStart = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000)

      // Get revenue data
      const totalRevenue = reservationStats?.totalRevenue || 0
      const monthlyRevenue = reservationStats?.totalRevenue || 0 // TODO: Filter by month
      const revenueGrowth = 0 // TODO: Calculate growth

      // Get booking data
      const activeBookings = reservationStats?.pending || 0
      const todayBookings = 0 // TODO: Calculate today's bookings
      const bookingGrowth = 0 // TODO: Calculate growth

      // Get customer data
      const customers = customersData?.data || []
      const totalCustomers = customers.length || 0
      const weeklyCustomers = customers.filter((c: any) => 
        new Date(c.created_at) >= weekStart
      ).length || 0
      const customerGrowth = weeklyCustomers > 0 ? ((weeklyCustomers / totalCustomers) * 100) : 0

      // Get review data
      const totalReviews = reviews?.length || 0
      const averageRating = totalReviews > 0 && reviews
        ? reviews.reduce((sum, review) => sum + (review.rating || 0), 0) / totalReviews
        : 0
      const ratingGrowth = 0 // TODO: Calculate rating growth

      // Get pending data
      const pendingPayments = paymentStats?.pending || 0
      const pendingPaymentAmount = paymentStats?.pendingAmount || 0
      const upcomingBookings = reservationStats?.pending || 0

      return {
        totalRevenue,
        monthlyRevenue,
        revenueGrowth,
        activeBookings,
        todayBookings,
        bookingGrowth,
        totalCustomers,
        weeklyCustomers,
        customerGrowth,
        averageRating: Math.round(averageRating * 10) / 10,
        ratingGrowth,
        totalReviews,
        pendingPayments,
        pendingPaymentAmount,
        upcomingBookings
      }
    },
    enabled: !!studioId && !!(reservationStats || paymentStats || customersData || reviews),
    staleTime: 2 * 60 * 1000, // 2 minutes
  })
}

// Get recent bookings for dashboard
export function useRecentBookings(studioId?: string) {
  return useQuery({
    queryKey: dashboardKeys.recentBookings(studioId || ''),
    queryFn: async (): Promise<RecentBooking[]> => {
      // This would typically fetch from reservations API
      // For now, return empty array - will be populated by actual hook
      const { getReservationsAction } = await import('@/actions/reservations')
      
      const result = await getReservationsAction()
      if (!result.success || !result.data) {
        return []
      }

      return result.data
        .filter(reservation => reservation.studio_id === studioId)
        .sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())
        .slice(0, 5)
        .map(reservation => ({
          id: reservation.id,
          bookingCode: reservation.booking_code,
          customerName: reservation.customer?.full_name || reservation.guest_email || 'Guest',
          packageName: reservation.package?.name || 'Custom Package',
          date: reservation.reservation_date,
          time: reservation.start_time,
          status: reservation.status as any,
          amount: reservation.total_amount,
          isGuest: reservation.is_guest_booking || false
        }))
    },
    enabled: !!studioId,
    staleTime: 1 * 60 * 1000, // 1 minute
  })
}

// Get pending actions that require attention
export function usePendingActions(studioId?: string) {
  const { data: paymentStats } = usePaymentStats(studioId)
  const { data: reviews } = useReviews()
  const { data: reservationStats } = useReservationStats(studioId)

  return useQuery({
    queryKey: dashboardKeys.pendingActions(studioId || ''),
    queryFn: async (): Promise<PendingAction[]> => {
      const actions: PendingAction[] = []

      // Pending payments
      const pendingPayments = paymentStats?.pending || 0
      if (pendingPayments > 0) {
        actions.push({
          type: 'payment',
          title: 'Payment Verification',
          count: pendingPayments,
          description: 'Payments waiting for verification',
          href: '/admin/payments?status=pending',
          urgent: pendingPayments > 5
        })
      }

      // Pending reviews
      const pendingReviews = reviews?.filter(r => !r.is_approved).length || 0
      if (pendingReviews > 0) {
        actions.push({
          type: 'review',
          title: 'Review Moderation',
          count: pendingReviews,
          description: 'Reviews awaiting moderation',
          href: '/admin/reviews?status=pending',
          urgent: false
        })
      }

      // Pending bookings
      const pendingBookings = reservationStats?.pending || 0
      if (pendingBookings > 0) {
        actions.push({
          type: 'booking',
          title: 'Booking Confirmation',
          count: pendingBookings,
          description: 'Bookings awaiting confirmation',
          href: '/admin/reservations?status=pending',
          urgent: pendingBookings > 10
        })
      }

      return actions
    },
    enabled: !!studioId && !!(paymentStats || reviews || reservationStats),
    staleTime: 1 * 60 * 1000, // 1 minute
  })
}

// Format currency for Indonesian Rupiah
export function formatCurrency(amount: number): string {
  return new Intl.NumberFormat('id-ID', {
    style: 'currency',
    currency: 'IDR',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(amount)
}

// Format percentage with + or - sign
export function formatPercentage(value: number): string {
  const sign = value > 0 ? '+' : ''
  return `${sign}${value.toFixed(1)}%`
}

// Get status color for reservations
export function getStatusColor(status: string): string {
  switch (status) {
    case 'confirmed':
      return 'bg-green-100 text-green-800 border-green-200'
    case 'pending':
      return 'bg-yellow-100 text-yellow-800 border-yellow-200'
    case 'in_progress':
      return 'bg-blue-100 text-blue-800 border-blue-200'
    case 'completed':
      return 'bg-gray-100 text-gray-800 border-gray-200'
    case 'cancelled':
      return 'bg-red-100 text-red-800 border-red-200'
    default:
      return 'bg-gray-100 text-gray-800 border-gray-200'
  }
}

// Get status label in Indonesian
export function getStatusLabel(status: string): string {
  switch (status) {
    case 'confirmed':
      return 'Terkonfirmasi'
    case 'pending':
      return 'Menunggu'
    case 'in_progress':
      return 'Berlangsung'
    case 'completed':
      return 'Selesai'
    case 'cancelled':
      return 'Dibatalkan'
    default:
      return status
  }
}