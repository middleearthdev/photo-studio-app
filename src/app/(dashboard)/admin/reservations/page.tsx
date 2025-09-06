"use client"

import React, { useState, useEffect } from "react"
import { Calendar, Clock, Search, MoreHorizontal, Eye, Edit, Trash, CheckCircle, XCircle, PlayCircle, Filter, Download, RefreshCw } from "lucide-react"
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
import { usePaginatedReservations, useReservationStats, useUpdateReservationStatus, useDeleteReservation } from "@/hooks/use-reservations"
import { type Reservation, type ReservationStatus } from "@/actions/reservations"
import { PaginationControls } from "@/components/pagination-controls"
import { DEFAULT_PAGE_SIZE } from "@/lib/constants/pagination"
import { useStudios } from "@/hooks/use-studios"

const statusLabels: Record<ReservationStatus, string> = {
  pending: 'Pending',
  confirmed: 'Terkonfirmasi',
  in_progress: 'Berlangsung',
  completed: 'Selesai',
  cancelled: 'Dibatalkan'
}

const statusColors: Record<ReservationStatus, 'default' | 'secondary' | 'destructive' | 'outline'> = {
  pending: 'outline',
  confirmed: 'default',
  in_progress: 'secondary',
  completed: 'default',
  cancelled: 'destructive'
}

const paymentStatusLabels = {
  pending: 'Belum Bayar',
  partial: 'DP',
  completed: 'Lunas',
  failed: 'Gagal',
  refunded: 'Dikembalikan'
}

const paymentStatusColors: Record<string, 'default' | 'secondary' | 'destructive' | 'outline'> = {
  pending: 'outline',
  partial: 'secondary',
  completed: 'default',
  failed: 'destructive',
  refunded: 'destructive'
}

export default function ReservationsPage() {
  const [searchTerm, setSearchTerm] = useState('')
  const [statusFilter, setStatusFilter] = useState<string>('all')
  const [paymentStatusFilter, setPaymentStatusFilter] = useState<string>('all')
  const [bookingTypeFilter, setBookingTypeFilter] = useState<'guest' | 'user' | 'all'>('all')
  const [dateFromFilter, setDateFromFilter] = useState('')
  const [dateToFilter, setDateToFilter] = useState('')
  const [currentPage, setCurrentPage] = useState(1)
  const [pageSize, setPageSize] = useState(DEFAULT_PAGE_SIZE)
  const [selectedStudioId, setSelectedStudioId] = useState<string>('')

  // Get list of studios for selection (consistent with packages page)
  const { data: studios = [], isLoading: studiosLoading } = useStudios()

  // Set default studio when studios load
  useEffect(() => {
    if (studios.length > 0 && !selectedStudioId) {
      setSelectedStudioId(studios[0].id)
    }
  }, [studios, selectedStudioId])

  // TanStack Query hooks with pagination
  const { 
    data: paginatedResult, 
    isLoading: loading, 
    error,
    refetch
  } = usePaginatedReservations(selectedStudioId, {
    page: currentPage,
    pageSize,
    search: searchTerm,
    status: statusFilter,
    payment_status: paymentStatusFilter,
    booking_type: bookingTypeFilter,
    date_from: dateFromFilter || undefined,
    date_to: dateToFilter || undefined,
  })

  const { data: stats } = useReservationStats(selectedStudioId)
  const reservations = paginatedResult?.data || []
  const pagination = paginatedResult?.pagination

  const updateStatusMutation = useUpdateReservationStatus()
  const deleteReservationMutation = useDeleteReservation()

  // Reset pagination when filters change
  useEffect(() => {
    setCurrentPage(1)
  }, [searchTerm, statusFilter, paymentStatusFilter, bookingTypeFilter, dateFromFilter, dateToFilter, selectedStudioId])

  const handlePageChange = (page: number) => {
    setCurrentPage(page)
  }

  const handlePageSizeChange = (newPageSize: number) => {
    setPageSize(newPageSize)
    setCurrentPage(1)
  }

  const handleStatusUpdate = async (reservation: Reservation, newStatus: ReservationStatus) => {
    if (!confirm(`Apakah Anda yakin ingin mengubah status reservasi menjadi "${statusLabels[newStatus]}"?`)) {
      return
    }

    updateStatusMutation.mutate({ id: reservation.id, status: newStatus })
  }

  const handleDelete = async (reservation: Reservation) => {
    if (!confirm(`Apakah Anda yakin ingin menghapus reservasi ${reservation.booking_code}?`)) {
      return
    }

    deleteReservationMutation.mutate(reservation.id)
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
          <h2 className="text-3xl font-bold tracking-tight">Reservations Management</h2>
          <p className="text-muted-foreground">
            Kelola semua reservasi studio foto
          </p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" onClick={() => refetch()}>
            <RefreshCw className="h-4 w-4 mr-2" />
            Refresh
          </Button>
          <Button variant="outline">
            <Download className="h-4 w-4 mr-2" />
            Export
          </Button>
        </div>
      </div>

      {/* Studio Selection & Statistics */}
      <div className="space-y-4">
        <Card>
          <CardContent className="pt-6">
            <div className="flex flex-col md:flex-row gap-4 items-start md:items-center justify-between">
              <div className="flex flex-col md:flex-row gap-4 items-start md:items-center">
                <div className="space-y-2">
                  <label className="text-sm font-medium">Pilih Studio</label>
                  <Select value={selectedStudioId} onValueChange={setSelectedStudioId} disabled={studiosLoading}>
                    <SelectTrigger className="w-[250px]">
                      <SelectValue placeholder="Pilih studio..." />
                    </SelectTrigger>
                    <SelectContent>
                      {studios.map((studio) => (
                        <SelectItem key={studio.id} value={studio.id}>
                          {studio.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                {selectedStudioId && (
                  <div className="flex gap-4 pt-6 md:pt-0">
                    <div className="text-center">
                      <div className="text-2xl font-bold text-blue-600">
                        {stats?.total || 0}
                      </div>
                      <div className="text-sm text-muted-foreground">Total Reservasi</div>
                    </div>
                    <div className="text-center">
                      <div className="text-2xl font-bold text-orange-600">
                        {stats?.pending || 0}
                      </div>
                      <div className="text-sm text-muted-foreground">Pending</div>
                    </div>
                    <div className="text-center">
                      <div className="text-2xl font-bold text-green-600">
                        {stats?.completed || 0}
                      </div>
                      <div className="text-sm text-muted-foreground">Selesai</div>
                    </div>
                    <div className="text-center">
                      <div className="text-2xl font-bold text-purple-600">
                        {formatCurrency(stats?.totalRevenue || 0)}
                      </div>
                      <div className="text-sm text-muted-foreground">Revenue</div>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Statistics Cards */}
      {selectedStudioId && (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Reservasi</CardTitle>
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
            <CardTitle className="text-sm font-medium">Menunggu Konfirmasi</CardTitle>
            <Clock className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats?.pending || 0}</div>
            <p className="text-xs text-muted-foreground">
              Perlu tindakan
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
        </div>
      )}

      {selectedStudioId && (
        <Card>
        <CardHeader>
          <CardTitle>Reservations</CardTitle>
          <CardDescription>
            Daftar semua reservasi studio foto
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
                  <TableHead>Booking Code</TableHead>
                  <TableHead>Customer</TableHead>
                  <TableHead>Package</TableHead>
                  <TableHead>Tanggal & Waktu</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Payment</TableHead>
                  <TableHead>Total</TableHead>
                  <TableHead className="w-[70px]">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {loading ? (
                  Array.from({ length: 5 }).map((_, i) => (
                    <TableRow key={i}>
                      <TableCell colSpan={8}>
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
                    <TableCell colSpan={8} className="text-center py-8">
                      <Calendar className="h-8 w-8 mx-auto mb-2 text-muted-foreground" />
                      <p className="text-muted-foreground">Tidak ada reservasi ditemukan</p>
                    </TableCell>
                  </TableRow>
                ) : (
                  reservations.map((reservation) => (
                    <TableRow key={reservation.id}>
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
                        <Badge variant={statusColors[reservation.status]}>
                          {statusLabels[reservation.status]}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <Badge variant={paymentStatusColors[reservation.payment_status]}>
                          {paymentStatusLabels[reservation.payment_status]}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <div>
                          <div className="font-medium">
                            {formatCurrency(reservation.total_amount)}
                          </div>
                          {reservation.payment_status !== 'completed' && (
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
                            <DropdownMenuItem>
                              <Eye className="mr-2 h-4 w-4" />
                              View Details
                            </DropdownMenuItem>
                            <DropdownMenuItem>
                              <Edit className="mr-2 h-4 w-4" />
                              Edit
                            </DropdownMenuItem>
                            <DropdownMenuSeparator />
                            
                            {reservation.status === 'pending' && (
                              <>
                                <DropdownMenuItem
                                  onClick={() => handleStatusUpdate(reservation, 'confirmed')}
                                >
                                  <CheckCircle className="mr-2 h-4 w-4" />
                                  Confirm
                                </DropdownMenuItem>
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
                                <DropdownMenuItem
                                  onClick={() => handleStatusUpdate(reservation, 'in_progress')}
                                >
                                  <PlayCircle className="mr-2 h-4 w-4" />
                                  Start Session
                                </DropdownMenuItem>
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
                            <DropdownMenuItem
                              onClick={() => handleDelete(reservation)}
                              className="text-red-600"
                            >
                              <Trash className="mr-2 h-4 w-4" />
                              Delete
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </TableCell>
                    </TableRow>
                  ))
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
      )}
    </div>
  )
}