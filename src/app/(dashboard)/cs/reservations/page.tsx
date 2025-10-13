"use client"

import React, { useState, useEffect, useCallback, useRef } from "react"
import { Calendar, Clock, Search, MoreHorizontal, Eye, Edit, CheckCircle, XCircle, PlayCircle, Filter, Download, RefreshCw, DollarSign, MessageCircle, AlertTriangle, Zap, Plus } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { Badge } from "@/components/ui/badge"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Skeleton } from "@/components/ui/skeleton"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog"
import { usePaginatedReservations, useReservationStats, useUpdateReservationStatus, useDeleteReservation, reservationKeys, type ReservationStatus } from "@/hooks/use-reservations"
import { timeSlotKeys } from "@/hooks/use-time-slots"
import { useQueryClient } from "@tanstack/react-query"
import { type Reservation } from "@/actions/reservations"
import { PaginationControls } from "@/components/pagination-controls"
import { DEFAULT_PAGE_SIZE } from "@/lib/constants/pagination"
import { useProfile } from "@/hooks/use-profile"
import {
  canCompletePayment,
  canRescheduleBooking,
  getCancellationInfo,
  getDeadlineInfo,
  getBookingPriority,
  getDaysUntilReservation
} from "@/lib/utils/booking-rules"
import { ManualBookingForm } from "@/components/cs/manual-booking-form"
import { RescheduleBookingForm } from "@/components/cs/reschedule-booking-form"
import { EditReservationForm } from "@/components/cs/edit-reservation-form"
import { CompletePaymentDialog } from "@/components/cs/complete-payment-dialog"
import { WhatsAppTemplateDialog } from "@/components/cs/whatsapp-template-dialog"
import { BookingConfirmationDialog } from "@/components/cs/booking-confirmation-dialog"
import { PaymentReminderNotification } from "@/components/cs/payment-reminder-notification"
import { useAuthStore } from "@/stores/auth-store"

const statusLabels: Record<ReservationStatus, string> = {
  pending: 'Pending',
  confirmed: 'Terkonfirmasi',
  in_progress: 'Berlangsung',
  completed: 'Selesai',
  cancelled: 'Dibatalkan',
  no_show: 'Tidak Hadir'
}

const statusColors: Record<ReservationStatus, 'default' | 'secondary' | 'destructive' | 'outline'> = {
  pending: 'outline',
  confirmed: 'default',
  in_progress: 'secondary',
  completed: 'default',
  cancelled: 'destructive',
  no_show: 'destructive'
}

const paymentStatusLabels = {
  pending: 'Belum Bayar',
  partial: 'DP',
  paid: 'Lunas',
  failed: 'Gagal',
  cancelled: 'Dibatalkan',
  refunded: 'Refund'
}

const paymentStatusColors: Record<string, 'default' | 'secondary' | 'destructive' | 'outline'> = {
  pending: 'outline',
  partial: 'secondary',
  paid: 'default',
  failed: 'destructive',
  cancelled: 'destructive',
  refunded: 'secondary'
}

export default function ReservationsPage() {
  const queryClient = useQueryClient()
  const [searchTerm, setSearchTerm] = useState('')
  const [statusFilter, setStatusFilter] = useState<string>('all')
  const [paymentStatusFilter, setPaymentStatusFilter] = useState<string>('all')
  const [bookingTypeFilter, setBookingTypeFilter] = useState<'guest' | 'user' | 'all'>('all')
  const [dateFromFilter, setDateFromFilter] = useState('')
  const [dateToFilter, setDateToFilter] = useState('')
  const [currentPage, setCurrentPage] = useState(1)
  const [pageSize, setPageSize] = useState(DEFAULT_PAGE_SIZE)
  const [selectedReservation, setSelectedReservation] = useState<Reservation | null>(null)
  const [isDetailModalOpen, setIsDetailModalOpen] = useState(false)
  const [isRefreshing, setIsRefreshing] = useState(false)
  const [isManualBookingOpen, setIsManualBookingOpen] = useState(false)
  const [isRescheduleOpen, setIsRescheduleOpen] = useState(false)
  const [reservationToReschedule, setReservationToReschedule] = useState<Reservation | null>(null)
  const [isEditOpen, setIsEditOpen] = useState(false)
  const [reservationToEdit, setReservationToEdit] = useState<Reservation | null>(null)
  const [isCompletePaymentOpen, setIsCompletePaymentOpen] = useState(false)
  const [reservationToComplete, setReservationToComplete] = useState<Reservation | null>(null)
  const [isWhatsAppTemplateOpen, setIsWhatsAppTemplateOpen] = useState(false)
  const [reservationForWhatsApp, setReservationForWhatsApp] = useState<Reservation | null>(null)
  const [isBookingConfirmationOpen, setIsBookingConfirmationOpen] = useState(false)
  const [reservationToConfirmBooking, setReservationToConfirmBooking] = useState<Reservation | null>(null)

  // AlertDialog states
  const [reservationToDelete, setReservationToDelete] = useState<Reservation | null>(null)
  const [statusChangeData, setStatusChangeData] = useState<{
    reservation: Reservation
    newStatus: ReservationStatus
  } | null>(null)

  // Get user profile to get studio_id
  const { profile } = useAuthStore()

  const studioId = profile?.studio_id

  // TanStack Query hooks with pagination
  const {
    data: paginatedResult,
    isLoading: loading,
    error,
    refetch
  } = usePaginatedReservations(studioId || '', {
    page: currentPage,
    pageSize,
    search: searchTerm,
    status: statusFilter,
    payment_status: paymentStatusFilter,
    booking_type: bookingTypeFilter,
    date_from: dateFromFilter || undefined,
    date_to: dateToFilter || undefined,
  })

  const { data: stats } = useReservationStats(studioId || '')
  const reservations = paginatedResult?.data || []
  const pagination = paginatedResult?.pagination

  const updateStatusMutation = useUpdateReservationStatus()
  const deleteReservationMutation = useDeleteReservation()

  // Last refresh timestamp to prevent spam clicking
  const lastRefreshRef = useRef<number>(0)
  const refreshCooldown = 2000 // 2 seconds cooldown

  // Optimized refresh function with debouncing and parallel execution
  const handleRefresh = useCallback(async () => {
    const now = Date.now()

    // Prevent spam clicking - enforce cooldown
    if (now - lastRefreshRef.current < refreshCooldown) {
      return
    }

    lastRefreshRef.current = now
    setIsRefreshing(true)

    try {
      // Execute all invalidations in parallel instead of sequential await
      const refreshPromises = [
        queryClient.invalidateQueries({
          queryKey: reservationKeys.all
        })
      ]

      // Wait for all to complete in parallel
      await Promise.allSettled(refreshPromises)

    } catch (error) {
      console.error('Refresh failed:', error)
      // Don't throw - let component handle gracefully
    } finally {
      setIsRefreshing(false)
    }
  }, [refetch, queryClient, studioId])

  // Reset pagination when filters change
  useEffect(() => {
    setCurrentPage(1)
  }, [searchTerm, statusFilter, paymentStatusFilter, bookingTypeFilter, dateFromFilter, dateToFilter])

  // Skeleton component for stats cards
  const StatsCardSkeleton = () => (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <Skeleton className="h-4 w-32" />
        <Skeleton className="h-4 w-4" />
      </CardHeader>
      <CardContent>
        <Skeleton className="h-8 w-16 mb-2" />
        <Skeleton className="h-3 w-24" />
      </CardContent>
    </Card>
  )

  if (!studioId) {
    return (
      <div className="flex-1 space-y-4 p-4">
        <div className="flex items-center justify-center h-64">
          <div className="text-center">
            <p className="text-lg font-medium text-gray-900">No studio access</p>
            <p className="text-sm text-gray-500 mt-1">You need to be assigned to a studio to access this page.</p>
          </div>
        </div>
      </div>
    )
  }

  const handlePageChange = (page: number) => {
    setCurrentPage(page)
  }

  const handlePageSizeChange = (newPageSize: number) => {
    setPageSize(newPageSize)
    setCurrentPage(1)
  }

  const handleStatusUpdate = async (reservation: Reservation, newStatus: ReservationStatus) => {
    setStatusChangeData({ reservation, newStatus })
  }

  const confirmStatusUpdate = () => {
    if (statusChangeData) {
      updateStatusMutation.mutate({ id: statusChangeData.reservation.id, status: statusChangeData.newStatus }, {
        onSuccess: () => {
          setStatusChangeData(null)
        }
      })
    }
  }

  const handleDelete = async (reservation: Reservation) => {
    setReservationToDelete(reservation)
  }

  const confirmDelete = () => {
    if (reservationToDelete) {
      deleteReservationMutation.mutate(reservationToDelete.id, {
        onSuccess: () => {
          setReservationToDelete(null)
        }
      })
    }
  }

  const handleViewDetails = (reservation: Reservation) => {
    setSelectedReservation(reservation)
    setIsDetailModalOpen(true)
  }

  const handleEdit = (reservation: Reservation) => {
    setReservationToEdit(reservation)
    setIsEditOpen(true)
  }

  const handleWhatsAppReminder = (reservation: Reservation, type: 'payment' | 'reschedule' | 'confirmation') => {
    const phone = reservation.customer?.phone || reservation.guest_phone
    if (!phone) {
      alert('No phone number found for this customer')
      return
    }

    // Use centralized templates
    const { sendWhatsAppWithTemplate } = require('@/lib/services/whatsapp-templates')
    const templateMap = {
      payment: 'payment_reminder',
      reschedule: 'reschedule_reminder',
      confirmation: 'booking_confirmation'
    }

    try {
      const whatsappURL = sendWhatsAppWithTemplate(reservation, templateMap[type], phone)
      window.open(whatsappURL, '_blank')
    } catch (error) {
      console.error('Error opening WhatsApp:', error)
      alert('Error opening WhatsApp: ' + (error instanceof Error ? error.message : 'Unknown error'))
    }
  }

  const handleReschedule = (reservation: Reservation) => {
    setReservationToReschedule(reservation)
    setIsRescheduleOpen(true)
  }

  const handleCompletePayment = (reservation: Reservation) => {
    setReservationToComplete(reservation)
    setIsCompletePaymentOpen(true)
  }

  const handleWhatsAppTemplate = (reservation: Reservation) => {
    setReservationForWhatsApp(reservation)
    setIsWhatsAppTemplateOpen(true)
  }

  const handleBookingConfirmation = (reservation: Reservation) => {
    setReservationToConfirmBooking(reservation)
    setIsBookingConfirmationOpen(true)
  }

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('id-ID', {
      style: 'currency',
      currency: 'IDR',
      minimumFractionDigits: 0,
    }).format(amount)
  }

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('id-ID', {
      weekday: 'short',
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    })
  }

  const formatTime2 = (dateString: string) => {
    return new Date(dateString).toLocaleTimeString('id-ID', {
      hour: '2-digit',
      minute: '2-digit'
    })
  }

  const formatTime = (timeString: string) => {
    return timeString.slice(0, 5) // HH:MM
  }

  if (error) {
    return (
      <div className="flex-1 space-y-4 p-4">
        <div className="flex items-center justify-center h-64">
          <div className="text-center">
            <p className="text-lg font-medium text-gray-900">Error loading reservations</p>
            <p className="text-sm text-gray-500 mt-1">{error.message}</p>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="flex-1 space-y-4 p-4">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-3xl font-bold tracking-tight">Booking Management</h2>
          <p className="text-muted-foreground">
            Kelola dan verifikasi semua booking customer
          </p>
        </div>
        <div className="flex gap-2">
          <Button
            variant="outline"
            onClick={handleRefresh}
            disabled={isRefreshing}
            className="relative"
          >
            <RefreshCw className={`h-4 w-4 mr-2 ${isRefreshing ? 'animate-spin' : ''}`} />
            {isRefreshing ? 'Refreshing...' : 'Refresh'}
            {/* Cooldown indicator */}
            {isRefreshing && (
              <div className="absolute inset-0 bg-primary/10 rounded-md animate-pulse" />
            )}
          </Button>
          <Button onClick={() => setIsManualBookingOpen(true)}>
            <Plus className="h-4 w-4 mr-2" />
            Manual Booking
          </Button>
        </div>
      </div>

      {/* Payment Reminder Notifications */}
      <div className={`relative ${isRefreshing ? 'opacity-50 pointer-events-none' : ''}`}>
        <PaymentReminderNotification studioId={studioId} />
        {isRefreshing && (
          <div className="absolute inset-0 bg-white/50 flex items-center justify-center">
            <RefreshCw className="h-6 w-6 animate-spin text-gray-400" />
          </div>
        )}
      </div>

      {/* Statistics Cards */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        {isRefreshing ? (
          <>
            <StatsCardSkeleton />
            <StatsCardSkeleton />
            <StatsCardSkeleton />
            <StatsCardSkeleton />
          </>
        ) : (
          <>
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Menunggu Konfirmasi</CardTitle>
                <Clock className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{stats?.pending || 0}</div>
                <p className="text-xs text-muted-foreground">
                  Perlu approval
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Total Booking</CardTitle>
                <Calendar className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{stats?.total || 0}</div>
                <p className="text-xs text-muted-foreground">
                  {stats?.thisMonth || 0} bulan ini
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Selesai</CardTitle>
                <CheckCircle className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{stats?.completed || 0}</div>
                <p className="text-xs text-muted-foreground">
                  Revenue: {formatCurrency(stats?.totalRevenue || 0)}
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Pending Payment</CardTitle>
                <XCircle className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{formatCurrency(stats?.pendingPayments || 0)}</div>
                <p className="text-xs text-muted-foreground">
                  Belum terbayar
                </p>
              </CardContent>
            </Card>
          </>
        )}
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Booking Management</CardTitle>
          <CardDescription>
            Kelola dan verifikasi semua booking customer - approval, status tracking, dan management
          </CardDescription>
        </CardHeader>
        <CardContent>
          {/* Filters */}
          <div className="flex flex-col gap-4 mb-6">
            <div className="flex items-center gap-4">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
                <Input
                  placeholder="Cari berdasarkan kode booking, email, atau telepon..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10"
                />
              </div>
              <Button variant="outline" size="icon">
                <Filter className="h-4 w-4" />
              </Button>
            </div>

            <div className="flex flex-wrap items-center gap-4">
              <Select value={statusFilter} onValueChange={setStatusFilter}>
                <SelectTrigger className="w-[140px]">
                  <SelectValue placeholder="Status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Semua Status</SelectItem>
                  {Object.entries(statusLabels).map(([status, label]) => (
                    <SelectItem key={status} value={status}>
                      {label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>

              <Select value={paymentStatusFilter} onValueChange={setPaymentStatusFilter}>
                <SelectTrigger className="w-[140px]">
                  <SelectValue placeholder="Payment" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Semua Payment</SelectItem>
                  {Object.entries(paymentStatusLabels).map(([status, label]) => (
                    <SelectItem key={status} value={status}>
                      {label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>

              <Select value={bookingTypeFilter} onValueChange={(value) => setBookingTypeFilter(value as any)}>
                <SelectTrigger className="w-[140px]">
                  <SelectValue placeholder="Tipe Booking" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Semua Tipe</SelectItem>
                  <SelectItem value="user">User Login</SelectItem>
                  <SelectItem value="guest">Guest</SelectItem>
                </SelectContent>
              </Select>

              <div className="flex gap-2">
                <Input
                  type="date"
                  value={dateFromFilter}
                  onChange={(e) => setDateFromFilter(e.target.value)}
                  className="w-[140px]"
                  placeholder="Dari tanggal"
                />
                <Input
                  type="date"
                  value={dateToFilter}
                  onChange={(e) => setDateToFilter(e.target.value)}
                  className="w-[140px]"
                  placeholder="Sampai tanggal"
                />
              </div>
            </div>
          </div>

          {/* Table */}
          <div className="rounded-md border">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Priority</TableHead>
                  <TableHead>Booking Code</TableHead>
                  <TableHead>Customer</TableHead>
                  <TableHead>Package</TableHead>
                  <TableHead>Tanggal & Waktu</TableHead>
                  <TableHead>Dibuat</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Payment</TableHead>
                  <TableHead>Total</TableHead>
                  <TableHead className="w-[70px]">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {loading || isRefreshing ? (
                  Array.from({ length: 5 }).map((_, i) => (
                    <TableRow key={i}>
                      <TableCell colSpan={10}>
                        <div className="flex items-center space-x-4">
                          <div className="space-y-2 flex-1">
                            <div className="h-4 w-32 bg-gray-200 rounded animate-pulse" />
                            <div className="h-3 w-24 bg-gray-200 rounded animate-pulse" />
                          </div>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))
                ) : reservations.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={10} className="text-center py-8">
                      <Calendar className="h-8 w-8 mx-auto mb-2 text-muted-foreground" />
                      <p className="text-muted-foreground">Tidak ada booking ditemukan</p>
                    </TableCell>
                  </TableRow>
                ) : (
                  reservations.map((reservation: Reservation) => {
                    const deadline = getDeadlineInfo(reservation)
                    const paymentRule = canCompletePayment(reservation)
                    const rescheduleRule = canRescheduleBooking(reservation)
                    const cancellationInfo = getCancellationInfo(reservation)

                    return (
                      <TableRow key={reservation.id}>
                        <TableCell>
                          <div className="text-sm text-gray-900">
                            {deadline.message || 'No deadline info'}
                          </div>
                        </TableCell>
                        <TableCell>
                          <div>
                            <div className="font-medium">{reservation.booking_code}</div>
                            {reservation.is_guest_booking && (
                              <Badge variant="outline" className="text-xs mt-1">
                                Guest
                              </Badge>
                            )}
                          </div>
                        </TableCell>
                        <TableCell>
                          <div>
                            <div className="font-medium">
                              {reservation.customer?.full_name || 'Unknown Customer'}
                            </div>
                            <div className="text-sm text-muted-foreground">
                              {reservation.customer?.email || reservation.guest_email}
                            </div>
                            <div className="text-sm text-muted-foreground">
                              {reservation.customer?.phone || reservation.guest_phone}
                            </div>
                          </div>
                        </TableCell>
                        <TableCell>
                          <div>
                            <div className="font-medium">
                              {reservation.package?.name || 'Custom Package'}
                            </div>
                            <div className="text-sm text-muted-foreground">
                              {reservation.total_duration} menit
                            </div>
                          </div>
                        </TableCell>
                        <TableCell>
                          <div>
                            <div className="font-medium">
                              {formatDate(reservation.reservation_date)}
                            </div>
                            <div className="text-sm text-muted-foreground">
                              {formatTime(reservation.start_time)} - {formatTime(reservation.end_time)}
                            </div>
                          </div>
                        </TableCell>
                        <TableCell>
                          <div>
                            <div className="text-sm font-medium">
                              {formatDate(reservation.created_at)}
                            </div>
                            <div className="text-xs text-muted-foreground">
                              {formatTime2(reservation.created_at)}
                            </div>
                          </div>
                        </TableCell>
                        <TableCell>
                          <Badge variant={statusColors[reservation.status] || 'outline'}>
                            {statusLabels[reservation.status] || reservation.status}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          <Badge variant={paymentStatusColors[reservation.payment_status] || 'outline'}>
                            {paymentStatusLabels[reservation.payment_status as keyof typeof paymentStatusLabels] || reservation.payment_status}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          <div>
                            <div className="font-medium">
                              {formatCurrency(reservation.total_amount)}
                            </div>
                            {reservation.payment_status !== 'paid' && (
                              <div className="text-sm text-muted-foreground">
                                DP: {formatCurrency(reservation.dp_amount)}
                              </div>
                            )}
                          </div>
                        </TableCell>
                        <TableCell>
                          <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                              <Button variant="ghost" className="h-8 w-8 p-0">
                                <MoreHorizontal className="h-4 w-4" />
                              </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end">
                              <DropdownMenuLabel>Actions</DropdownMenuLabel>
                              <DropdownMenuItem onClick={() => handleViewDetails(reservation)}>
                                <Eye className="mr-2 h-4 w-4" />
                                View Details
                              </DropdownMenuItem>
                              <DropdownMenuItem onClick={() => handleEdit(reservation)}>
                                <Edit className="mr-2 h-4 w-4" />
                                Edit
                              </DropdownMenuItem>
                              {/* Payment Actions - conditional based on payment status */}
                              {reservation.payment_status === 'pending' && (
                                <DropdownMenuItem onClick={() => handleBookingConfirmation(reservation)}>
                                  <CheckCircle className="mr-2 h-4 w-4" />
                                  Konfirmasi Booking
                                </DropdownMenuItem>
                              )}
                              {reservation.payment_status === 'partial' && reservation.status != 'cancelled' && reservation.remaining_amount > 0 && (
                                <DropdownMenuItem onClick={() => handleCompletePayment(reservation)}>
                                  <DollarSign className="mr-2 h-4 w-4" />
                                  Konfirmasi Pelunasan
                                </DropdownMenuItem>
                              )}
                              {canRescheduleBooking(reservation).allowed && (
                                <DropdownMenuItem onClick={() => handleReschedule(reservation)}>
                                  <Calendar className="mr-2 h-4 w-4" />
                                  Reschedule
                                </DropdownMenuItem>
                              )}
                              <DropdownMenuSeparator />

                              {reservation.status === 'pending' && (
                                <>
                                  {(reservation.payment_status === 'partial' || reservation.payment_status === 'paid') && (
                                    <DropdownMenuItem
                                      onClick={() => handleStatusUpdate(reservation, 'confirmed')}
                                    >
                                      <CheckCircle className="mr-2 h-4 w-4" />
                                      Confirm
                                    </DropdownMenuItem>
                                  )}
                                  <DropdownMenuItem
                                    onClick={() => handleStatusUpdate(reservation, 'cancelled')}
                                    className="text-red-600"
                                  >
                                    <XCircle className="mr-2 h-4 w-4" />
                                    Cancel
                                  </DropdownMenuItem>
                                </>
                              )}

                              {reservation.status === 'confirmed' && (
                                <>
                                  {reservation.payment_status === 'paid' ? (
                                    <DropdownMenuItem
                                      onClick={() => handleStatusUpdate(reservation, 'in_progress')}
                                    >
                                      <PlayCircle className="mr-2 h-4 w-4" />
                                      Start Session
                                    </DropdownMenuItem>
                                  ) : (
                                    <DropdownMenuItem disabled>
                                      <PlayCircle className="mr-2 h-4 w-4 opacity-50" />
                                      Start Session (Payment Required)
                                    </DropdownMenuItem>
                                  )}
                                  <DropdownMenuItem
                                    onClick={() => handleStatusUpdate(reservation, 'cancelled')}
                                    className="text-red-600"
                                  >
                                    <XCircle className="mr-2 h-4 w-4" />
                                    Cancel
                                  </DropdownMenuItem>
                                </>
                              )}

                              {reservation.status === 'in_progress' && (
                                <DropdownMenuItem
                                  onClick={() => handleStatusUpdate(reservation, 'completed')}
                                >
                                  <CheckCircle className="mr-2 h-4 w-4" />
                                  Complete
                                </DropdownMenuItem>
                              )}

                              <DropdownMenuSeparator />
                              {(reservation.customer?.phone || reservation.guest_phone) && (
                                <DropdownMenuItem
                                  onClick={() => handleWhatsAppTemplate(reservation)}
                                  className="text-green-600"
                                >
                                  <MessageCircle className="mr-2 h-4 w-4" />
                                  WA Direct
                                </DropdownMenuItem>
                              )}
                              <DropdownMenuSeparator />
                              <DropdownMenuItem
                                onClick={() => handleDelete(reservation)}
                                className="text-red-600"
                              >
                                <XCircle className="mr-2 h-4 w-4" />
                                Delete
                              </DropdownMenuItem>
                            </DropdownMenuContent>
                          </DropdownMenu>
                        </TableCell>
                      </TableRow>
                    )
                  })
                )}
              </TableBody>
            </Table>
          </div>
          {/* Pagination */}
          {pagination && pagination.totalPages > 1 && (
            <div className="mt-8">
              <PaginationControls
                currentPage={pagination.page}
                totalPages={pagination.totalPages}
                pageSize={pagination.pageSize}
                total={pagination.total}
                onPageChange={handlePageChange}
                onPageSizeChange={handlePageSizeChange}
              />
            </div>
          )}
        </CardContent>
      </Card>

      {/* Reservation Detail Modal */}
      <Dialog open={isDetailModalOpen} onOpenChange={setIsDetailModalOpen}>
        <DialogContent className="w-[50vw] max-w-none sm:max-w-7xl max-h-[95vh] overflow-auto">
          <DialogHeader>
            <DialogTitle>Booking Details</DialogTitle>
            <DialogDescription>
              Detailed information about the booking
            </DialogDescription>
          </DialogHeader>

          {selectedReservation && (
            <div className="space-y-6">
              {/* Business Rules Status */}
              {(() => {
                const deadline = getDeadlineInfo(selectedReservation)
                const paymentRule = canCompletePayment(selectedReservation)
                const rescheduleRule = canRescheduleBooking(selectedReservation)
                const cancellationInfo = getCancellationInfo(selectedReservation)

                return (
                  <Card>
                    <CardHeader>
                      <CardTitle className="flex items-center gap-2">
                        <AlertTriangle className="h-5 w-5" />
                        Business Rules & Deadlines
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-4">
                        <div className="flex items-center gap-4">
                          <span className="text-sm font-medium">{deadline.message}</span>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                          <div className={`p-3 rounded-lg ${paymentRule.allowed ? 'bg-green-50 border border-green-200' : 'bg-red-50 border border-red-200'}`}>
                            <div className="font-medium text-sm">💰 Payment Rule</div>
                            <div className="text-xs mt-1">
                              {paymentRule.reason}
                            </div>
                          </div>

                          <div className={`p-3 rounded-lg ${rescheduleRule.allowed ? 'bg-green-50 border border-green-200' : 'bg-red-50 border border-red-200'}`}>
                            <div className="font-medium text-sm">📅 Reschedule Rule</div>
                            <div className="text-xs mt-1">
                              {rescheduleRule.reason}
                            </div>
                          </div>

                          <div className={`p-3 rounded-lg ${cancellationInfo.dpPolicy === 'hangus' ? 'bg-yellow-50 border border-yellow-200' : 'bg-green-50 border border-green-200'}`}>
                            <div className="font-medium text-sm">❌ Cancellation Policy</div>
                            <div className="text-xs mt-1">
                              {cancellationInfo.message}
                            </div>
                          </div>
                        </div>

                        {/* WhatsApp Reminders */}
                        {(selectedReservation.customer?.phone || selectedReservation.guest_phone) && (
                          <div className="pt-4 border-t">
                            <div className="font-medium text-sm mb-2">📱 WhatsApp Reminders</div>
                            <div className="flex gap-2">
                              {paymentRule.allowed && selectedReservation.payment_status !== 'paid' && (
                                <Button
                                  size="sm"
                                  variant="outline"
                                  onClick={() => handleWhatsAppReminder(selectedReservation, 'payment')}
                                >
                                  <DollarSign className="h-4 w-4 mr-2" />
                                  Payment Reminder
                                </Button>
                              )}

                              {rescheduleRule.allowed && (
                                <>
                                  <Button
                                    size="sm"
                                    variant="outline"
                                    onClick={() => {
                                      handleReschedule(selectedReservation)
                                      setIsDetailModalOpen(false)
                                    }}
                                  >
                                    <Calendar className="h-4 w-4 mr-2" />
                                    Reschedule Booking
                                  </Button>
                                  <Button
                                    size="sm"
                                    variant="outline"
                                    onClick={() => handleWhatsAppReminder(selectedReservation, 'reschedule')}
                                  >
                                    <MessageCircle className="h-4 w-4 mr-2" />
                                    Reschedule Info
                                  </Button>
                                </>
                              )}

                              {selectedReservation.status === 'confirmed' && (
                                <Button
                                  size="sm"
                                  variant="outline"
                                  onClick={() => handleWhatsAppReminder(selectedReservation, 'confirmation')}
                                >
                                  <MessageCircle className="h-4 w-4 mr-2" />
                                  Confirmation
                                </Button>
                              )}

                              {/* Direct WhatsApp Button */}
                              {(selectedReservation.customer?.phone || selectedReservation.guest_phone) && (
                                <Button
                                  size="sm"
                                  variant="outline"
                                  onClick={() => {
                                    handleWhatsAppTemplate(selectedReservation)
                                    setIsDetailModalOpen(false)
                                  }}
                                  className="bg-green-50 hover:bg-green-100 border-green-200"
                                >
                                  <MessageCircle className="h-4 w-4 mr-2" />
                                  WA Direct
                                </Button>
                              )}
                            </div>
                          </div>
                        )}
                      </div>
                    </CardContent>
                  </Card>
                )
              })()}

              {/* Basic Information */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Calendar className="h-5 w-5" />
                    Basic Information
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-3">
                      <div>
                        <label className="text-sm font-medium text-gray-500">Booking Code</label>
                        <p className="font-mono text-sm">{selectedReservation.booking_code}</p>
                      </div>
                      <div>
                        <label className="text-sm font-medium text-gray-500">Status</label>
                        <div className="flex items-center gap-2">
                          <Badge variant={statusColors[selectedReservation.status]}>
                            {statusLabels[selectedReservation.status]}
                          </Badge>
                        </div>
                      </div>
                      <div>
                        <label className="text-sm font-medium text-gray-500">Payment Status</label>
                        <Badge variant={paymentStatusColors[selectedReservation.payment_status]}>
                          {paymentStatusLabels[selectedReservation.payment_status as keyof typeof paymentStatusLabels]}
                        </Badge>
                      </div>
                      <div>
                        <label className="text-sm font-medium text-gray-500">Booking Type</label>
                        <Badge variant="outline">
                          {selectedReservation.is_guest_booking ? 'Guest Booking' : 'User Booking'}
                        </Badge>
                      </div>
                    </div>

                    <div className="space-y-3">
                      <div>
                        <label className="text-sm font-medium text-gray-500">Package</label>
                        <p className="text-sm">{selectedReservation.package?.name || 'Custom Package'}</p>
                      </div>
                      <div>
                        <label className="text-sm font-medium text-gray-500">Duration</label>
                        <p className="text-sm">{selectedReservation.total_duration} minutes</p>
                      </div>
                      <div>
                        <label className="text-sm font-medium text-gray-500">Date & Time</label>
                        <p className="text-sm">
                          {formatDate(selectedReservation.reservation_date)} <br />
                          {formatTime(selectedReservation.start_time)} - {formatTime(selectedReservation.end_time)}
                        </p>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Customer Information */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Eye className="h-5 w-5" />
                    Customer Information
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-3">
                      <div>
                        <label className="text-sm font-medium text-gray-500">Customer Name</label>
                        <p className="text-sm">{selectedReservation.customer?.full_name || 'Unknown Customer'}</p>
                      </div>
                      <div>
                        <label className="text-sm font-medium text-gray-500">Email</label>
                        <p className="text-sm">{selectedReservation.customer?.email || selectedReservation.guest_email || '-'}</p>
                      </div>
                      <div>
                        <label className="text-sm font-medium text-gray-500">Phone</label>
                        <p className="text-sm">{selectedReservation.customer?.phone || selectedReservation.guest_phone || '-'}</p>
                      </div>
                    </div>
                    <div className="space-y-3">
                      <div>
                        <label className="text-sm font-medium text-gray-500">Special Requests</label>
                        <p className="text-sm">{selectedReservation.special_requests || 'No special requests'}</p>
                      </div>
                      <div>
                        <label className="text-sm font-medium text-gray-500">Internal Notes</label>
                        <p className="text-sm">{selectedReservation.internal_notes || 'No internal notes'}</p>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Add-ons Details */}
              {selectedReservation.reservation_addons && selectedReservation.reservation_addons.length > 0 && (
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <DollarSign className="h-5 w-5" />
                      Add-ons Details
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-4">
                      {selectedReservation.reservation_addons.map((addon, index) => (
                        <div key={addon.id || index} className="flex justify-between items-center p-3 bg-gray-50 rounded-lg">
                          <div className="flex-1">
                            <div className="font-medium text-sm">
                              {addon.addon?.name || 'Unknown Add-on'}
                            </div>
                            {addon.addon?.description && (
                              <div className="text-xs text-gray-500 mt-1">
                                {addon.addon.description}
                              </div>
                            )}
                          </div>
                          <div className="text-right">
                            <div className="text-sm font-medium">
                              {addon.quantity}x {formatCurrency(addon.unit_price)}
                            </div>
                            <div className="text-xs text-gray-500">
                              Total: {formatCurrency(addon.total_price)}
                            </div>
                          </div>
                        </div>
                      ))}

                      <div className="pt-3 border-t">
                        <div className="flex justify-between items-center">
                          <span className="font-medium text-sm">Total Add-ons:</span>
                          <span className="font-bold text-sm">
                            {formatCurrency(
                              selectedReservation.reservation_addons.reduce((sum, addon) => sum + addon.total_price, 0)
                            )}
                          </span>
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              )}

              {/* Selected Facilities */}
              {selectedReservation.selected_facilities && selectedReservation.selected_facilities.length > 0 && (
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <Calendar className="h-5 w-5" />
                      Selected Facilities
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                      {selectedReservation.selected_facilities.map((facility: any, index: number) => (
                        <div key={facility.id || index} className="p-3 bg-blue-50 rounded-lg">
                          <div className="font-medium text-sm text-blue-900">
                            {facility.name || 'Unknown Facility'}
                          </div>
                          {facility.description && (
                            <div className="text-xs text-blue-700 mt-1">
                              {facility.description}
                            </div>
                          )}
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              )}

              {/* Financial Information */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <DollarSign className="h-5 w-5" />
                    Financial Details
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div className="space-y-3">
                      <div>
                        <label className="text-sm font-medium text-gray-500">Package Price</label>
                        <p className="text-sm font-semibold">{formatCurrency(selectedReservation.package_price)}</p>
                      </div>
                      <div>
                        <label className="text-sm font-medium text-gray-500">Facility Addons</label>
                        <p className="text-sm">{formatCurrency(selectedReservation.facility_addon_total)}</p>
                      </div>
                    </div>
                    <div className="space-y-3">
                      <div>
                        <label className="text-sm font-medium text-gray-500">Other Addons</label>
                        <p className="text-sm">{formatCurrency(selectedReservation.other_addon_total)}</p>
                      </div>
                      <div>
                        <label className="text-sm font-medium text-gray-500">Tax Amount</label>
                        <p className="text-sm">{formatCurrency(selectedReservation.tax_amount)}</p>
                      </div>
                    </div>
                    <div className="space-y-3">
                      <div>
                        <label className="text-sm font-medium text-gray-500">Discount</label>
                        <p className="text-sm">{formatCurrency(selectedReservation.discount_amount)}</p>
                      </div>
                      <div>
                        <label className="text-sm font-medium text-gray-500">Total Amount</label>
                        <p className="text-lg font-bold">{formatCurrency(selectedReservation.total_amount)}</p>
                      </div>
                    </div>
                  </div>

                  <div className="mt-4 pt-4 border-t">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <label className="text-sm font-medium text-gray-500">Down Payment (DP)</label>
                        <p className="text-sm font-semibold">{formatCurrency(selectedReservation.dp_amount)}</p>
                      </div>
                      <div>
                        <label className="text-sm font-medium text-gray-500">Remaining Amount</label>
                        <p className="text-sm font-semibold">{formatCurrency(selectedReservation.remaining_amount)}</p>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Timestamps */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Clock className="h-5 w-5" />
                    Timeline
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-3">
                      <div>
                        <label className="text-sm font-medium text-gray-500">Created At</label>
                        <p className="text-sm">{formatDate(selectedReservation.created_at)}</p>
                      </div>
                      <div>
                        <label className="text-sm font-medium text-gray-500">Confirmed At</label>
                        <p className="text-sm">
                          {selectedReservation.confirmed_at ? formatDate(selectedReservation.confirmed_at) : 'Not confirmed yet'}
                        </p>
                      </div>
                    </div>
                    <div className="space-y-3">
                      <div>
                        <label className="text-sm font-medium text-gray-500">Completed At</label>
                        <p className="text-sm">
                          {selectedReservation.completed_at ? formatDate(selectedReservation.completed_at) : 'Not completed yet'}
                        </p>
                      </div>
                      <div>
                        <label className="text-sm font-medium text-gray-500">Cancelled At</label>
                        <p className="text-sm">
                          {selectedReservation.cancelled_at ? formatDate(selectedReservation.cancelled_at) : 'Not cancelled'}
                        </p>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Actions */}
              <Card>
                <CardHeader>
                  <CardTitle>Quick Actions</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="flex flex-wrap gap-2">
                    {selectedReservation.status === 'pending' && (
                      <>
                        {selectedReservation.payment_status === 'pending' ? (
                          <Button
                            variant="default"
                            size="sm"
                            onClick={() => {
                              handleBookingConfirmation(selectedReservation)
                              setIsDetailModalOpen(false)
                            }}
                          >
                            <CheckCircle className="mr-2 h-4 w-4" />
                            Konfirmasi Booking
                          </Button>
                        ) : (selectedReservation.payment_status === 'partial' || selectedReservation.payment_status === 'paid') ? (
                          <Button
                            variant="default"
                            size="sm"
                            onClick={() => {
                              handleStatusUpdate(selectedReservation, 'confirmed')
                              setIsDetailModalOpen(false)
                            }}
                          >
                            <CheckCircle className="mr-2 h-4 w-4" />
                            Confirm Status Only
                          </Button>
                        ) : null}
                        <Button
                          variant="destructive"
                          size="sm"
                          onClick={() => {
                            handleStatusUpdate(selectedReservation, 'cancelled')
                            setIsDetailModalOpen(false)
                          }}
                        >
                          <XCircle className="mr-2 h-4 w-4" />
                          Cancel Booking
                        </Button>
                      </>
                    )}

                    {selectedReservation.status === 'confirmed' && (
                      <>
                        {selectedReservation.payment_status === 'paid' ? (
                          <Button
                            variant="default"
                            size="sm"
                            onClick={() => {
                              handleStatusUpdate(selectedReservation, 'in_progress')
                              setIsDetailModalOpen(false)
                            }}
                          >
                            <PlayCircle className="mr-2 h-4 w-4" />
                            Start Session
                          </Button>
                        ) : (
                          <div className="p-3 bg-yellow-50 border border-yellow-200 rounded-lg">
                            <p className="text-yellow-800 text-sm font-medium">
                              ⚠️ Start Session hanya tersedia setelah customer melakukan pelunasan (payment status: paid).
                            </p>
                          </div>
                        )}
                        <Button
                          variant="destructive"
                          size="sm"
                          onClick={() => {
                            handleStatusUpdate(selectedReservation, 'cancelled')
                            setIsDetailModalOpen(false)
                          }}
                        >
                          <XCircle className="mr-2 h-4 w-4" />
                          Cancel Booking
                        </Button>
                      </>
                    )}

                    {selectedReservation.status === 'in_progress' && (
                      <Button
                        variant="default"
                        size="sm"
                        onClick={() => {
                          handleStatusUpdate(selectedReservation, 'completed')
                          setIsDetailModalOpen(false)
                        }}
                      >
                        <CheckCircle className="mr-2 h-4 w-4" />
                        Complete Session
                      </Button>
                    )}
                  </div>
                </CardContent>
              </Card>
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={!!reservationToDelete} onOpenChange={() => setReservationToDelete(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Hapus Booking</AlertDialogTitle>
            <AlertDialogDescription>
              <div className="space-y-2">
                <p className="font-semibold text-red-600">⚠️ PERINGATAN: Aksi ini tidak dapat dibatalkan!</p>
                <p>
                  Apakah Anda yakin ingin menghapus booking "{reservationToDelete?.booking_code}" secara permanen?
                </p>
                <p className="text-sm text-muted-foreground">
                  Booking dan semua data terkaitnya (addon, pembayaran pending) akan dihapus dari database dan tidak dapat dipulihkan.
                </p>
                {reservationToDelete && (
                  <div className="mt-3 p-3 bg-gray-50 rounded-lg">
                    <div className="text-sm">
                      <p><span className="font-medium">Customer:</span> {reservationToDelete.customer?.full_name || 'Unknown'}</p>
                      <p><span className="font-medium">Tanggal:</span> {formatDate(reservationToDelete.reservation_date)}</p>
                      <p><span className="font-medium">Total:</span> {formatCurrency(reservationToDelete.total_amount)}</p>
                      <p><span className="font-medium">Status:</span> {statusLabels[reservationToDelete.status]}</p>
                    </div>
                  </div>
                )}
              </div>
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Batal</AlertDialogCancel>
            <AlertDialogAction
              onClick={confirmDelete}
              className="bg-red-600 hover:bg-red-700"
            >
              Hapus Permanen
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Status Change Confirmation Dialog */}
      <AlertDialog open={!!statusChangeData} onOpenChange={() => setStatusChangeData(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>
              Ubah Status Booking
            </AlertDialogTitle>
            <AlertDialogDescription>
              {statusChangeData && (
                <div className="space-y-2">
                  <p>
                    Apakah Anda yakin ingin mengubah status booking "{statusChangeData.reservation.booking_code}"
                    dari <span className="font-medium">{statusLabels[statusChangeData.reservation.status]}</span>
                    menjadi <span className="font-medium">{statusLabels[statusChangeData.newStatus]}</span>?
                  </p>

                  {statusChangeData.newStatus === 'cancelled' && (
                    <div className="p-3 bg-yellow-50 border border-yellow-200 rounded-lg">
                      <p className="text-yellow-800 text-sm font-medium">
                        ⚠️ Perhatian: Pembatalan booking mungkin memerlukan pengembalian dana.
                      </p>
                    </div>
                  )}

                  {statusChangeData.newStatus === 'completed' && (
                    <div className="p-3 bg-green-50 border border-green-200 rounded-lg">
                      <p className="text-green-800 text-sm font-medium">
                        ✅ Session akan ditandai selesai dan tidak dapat diubah kembali.
                      </p>
                    </div>
                  )}

                  <div className="mt-3 p-3 bg-gray-50 rounded-lg">
                    <div className="text-sm">
                      <p><span className="font-medium">Customer:</span> {statusChangeData.reservation.customer?.full_name || 'Unknown'}</p>
                      <p><span className="font-medium">Tanggal:</span> {formatDate(statusChangeData.reservation.reservation_date)}</p>
                      <p><span className="font-medium">Waktu:</span> {formatTime(statusChangeData.reservation.start_time)} - {formatTime(statusChangeData.reservation.end_time)}</p>
                    </div>
                  </div>
                </div>
              )}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Batal</AlertDialogCancel>
            <AlertDialogAction
              onClick={confirmStatusUpdate}
              className={
                statusChangeData?.newStatus === 'cancelled'
                  ? "bg-red-600 hover:bg-red-700"
                  : statusChangeData?.newStatus === 'completed'
                    ? "bg-green-600 hover:bg-green-700"
                    : statusChangeData?.newStatus === 'confirmed'
                      ? "bg-blue-600 hover:bg-blue-700"
                      : "bg-orange-600 hover:bg-orange-700"
              }
            >
              {statusChangeData?.newStatus === 'cancelled' && 'Batalkan Booking'}
              {statusChangeData?.newStatus === 'confirmed' && 'Konfirmasi'}
              {statusChangeData?.newStatus === 'in_progress' && 'Mulai Session'}
              {statusChangeData?.newStatus === 'completed' && 'Selesaikan'}
              {statusChangeData?.newStatus === 'pending' && 'Kembalikan ke Pending'}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Manual Booking Form */}
      <ManualBookingForm
        isOpen={isManualBookingOpen}
        onClose={() => setIsManualBookingOpen(false)}
        onSuccess={() => {
          // Invalidate queries when booking is successfully created
          queryClient.invalidateQueries({ queryKey: reservationKeys.all })
          queryClient.invalidateQueries({ queryKey: ['reservation-stats', studioId] })
          queryClient.invalidateQueries({ queryKey: ['payment-reminders', studioId] })
          // Invalidate time slot cache to refresh availability
          queryClient.invalidateQueries({ queryKey: timeSlotKeys.all })
        }}
        studioId={studioId || ''}
      />

      {/* Reschedule Booking Form */}
      <RescheduleBookingForm
        isOpen={isRescheduleOpen}
        onClose={() => {
          setIsRescheduleOpen(false)
          setReservationToReschedule(null)
        }}
        onSuccess={() => {
          // Invalidate queries instead of handleRefresh
          queryClient.invalidateQueries({ queryKey: reservationKeys.all })
          queryClient.invalidateQueries({ queryKey: ['reservation-stats', studioId] })
          // Invalidate time slot cache when rescheduling
          queryClient.invalidateQueries({ queryKey: timeSlotKeys.all })
        }}
        reservation={reservationToReschedule}
      />

      {/* Edit Reservation Form */}
      <EditReservationForm
        isOpen={isEditOpen}
        onClose={() => {
          setIsEditOpen(false)
          setReservationToEdit(null)
        }}
        onSuccess={() => {
          // Invalidate queries instead of handleRefresh
          queryClient.invalidateQueries({ queryKey: reservationKeys.all })
          queryClient.invalidateQueries({ queryKey: ['reservation-stats', studioId] })
          // Invalidate time slot cache when editing reservation
          queryClient.invalidateQueries({ queryKey: timeSlotKeys.all })
        }}
        reservation={reservationToEdit}
      />

      {/* Complete Payment Dialog */}
      <CompletePaymentDialog
        isOpen={isCompletePaymentOpen}
        onClose={() => {
          setIsCompletePaymentOpen(false)
          setReservationToComplete(null)
          // Invalidate queries after closing (assuming success)
          queryClient.invalidateQueries({ queryKey: reservationKeys.all })
          queryClient.invalidateQueries({ queryKey: ['reservation-stats', studioId] })
          queryClient.invalidateQueries({ queryKey: ['payment-reminders', studioId] })
        }}
        reservation={reservationToComplete}
      />

      {/* WhatsApp Template Dialog */}
      <WhatsAppTemplateDialog
        isOpen={isWhatsAppTemplateOpen}
        onClose={() => {
          setIsWhatsAppTemplateOpen(false)
          setReservationForWhatsApp(null)
        }}
        reservation={reservationForWhatsApp}
      />

      {/* Booking Confirmation Dialog */}
      <BookingConfirmationDialog
        isOpen={isBookingConfirmationOpen}
        onClose={() => {
          setIsBookingConfirmationOpen(false)
          setReservationToConfirmBooking(null)
          // Invalidate queries after closing (assuming success)
          queryClient.invalidateQueries({ queryKey: reservationKeys.all })
          queryClient.invalidateQueries({ queryKey: ['reservation-stats', studioId] })
          queryClient.invalidateQueries({ queryKey: ['payment-reminders', studioId] })
        }}
        reservation={reservationToConfirmBooking}
      />
    </div>
  )
}