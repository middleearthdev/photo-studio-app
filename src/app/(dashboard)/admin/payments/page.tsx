"use client"

import React, { useState, useEffect } from "react"
import Link from "next/link"
import { CreditCard, DollarSign, TrendingDown, Search, MoreHorizontal, Eye, CheckCircle, XCircle, RefreshCw, Download, Filter, AlertCircle } from "lucide-react"
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
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { usePaginatedPayments, usePaymentStats, usePaymentMethods, useUpdatePaymentStatus, useDeletePayment } from "@/hooks/use-payments"
import { type Payment, type PaymentStatus } from "@/actions/payments"
import { PaginationControls } from "@/components/pagination-controls"
import { DEFAULT_PAGE_SIZE } from "@/lib/constants/pagination"
import { useStudios } from "@/hooks/use-studios"

const statusLabels: Record<PaymentStatus, string> = {
  pending: 'Pending',
  completed: 'Completed',
  failed: 'Failed',
  partial: 'Partial',
  refunded: 'Refunded'
}

const statusColors: Record<PaymentStatus, 'default' | 'secondary' | 'destructive' | 'outline'> = {
  pending: 'outline',
  completed: 'default',
  failed: 'destructive',
  partial: 'secondary',
  refunded: 'destructive'
}

const paymentTypeLabels = {
  dp: 'Down Payment',
  remaining: 'Remaining Payment',
  full: 'Full Payment'
}

export default function PaymentsPage() {
  const [searchTerm, setSearchTerm] = useState('')
  const [statusFilter, setStatusFilter] = useState<string>('all')
  const [paymentTypeFilter, setPaymentTypeFilter] = useState<string>('all')
  const [paymentMethodFilter, setPaymentMethodFilter] = useState<string>('all')
  const [dateFromFilter, setDateFromFilter] = useState('')
  const [dateToFilter, setDateToFilter] = useState('')
  const [currentPage, setCurrentPage] = useState(1)
  const [pageSize, setPageSize] = useState(DEFAULT_PAGE_SIZE)
  const [selectedStudioId, setSelectedStudioId] = useState<string>('')
  const [selectedPayment, setSelectedPayment] = useState<Payment | null>(null)
  const [isDetailModalOpen, setIsDetailModalOpen] = useState(false)

  // Studio selection for multi-studio admin
  const { data: studios = [], isLoading: studiosLoading } = useStudios()

  // Auto-select first studio
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
  } = usePaginatedPayments(selectedStudioId, {
    page: currentPage,
    pageSize,
    search: searchTerm,
    status: statusFilter,
    payment_type: paymentTypeFilter,
    payment_method: paymentMethodFilter,
    date_from: dateFromFilter || undefined,
    date_to: dateToFilter || undefined,
  })

  const { data: stats } = usePaymentStats(selectedStudioId)
  const { data: paymentMethods = [] } = usePaymentMethods(selectedStudioId)
  const payments = paginatedResult?.data || []
  const pagination = paginatedResult?.pagination

  const updateStatusMutation = useUpdatePaymentStatus()
  const deletePaymentMutation = useDeletePayment()

  // Reset pagination when filters change
  useEffect(() => {
    setCurrentPage(1)
  }, [searchTerm, statusFilter, paymentTypeFilter, paymentMethodFilter, dateFromFilter, dateToFilter, selectedStudioId])

  // Reset pagination when filters change
  useEffect(() => {
    setCurrentPage(1)
  }, [searchTerm, statusFilter, paymentTypeFilter, paymentMethodFilter, dateFromFilter, dateToFilter, selectedStudioId])

  const handlePageChange = (page: number) => {
    setCurrentPage(page)
  }

  const handlePageSizeChange = (newPageSize: number) => {
    setPageSize(newPageSize)
    setCurrentPage(1)
  }

  const handleStatusUpdate = async (payment: Payment, newStatus: PaymentStatus) => {
    if (!confirm(`Apakah Anda yakin ingin mengubah status payment menjadi "${statusLabels[newStatus]}"?`)) {
      return
    }

    updateStatusMutation.mutate({ id: payment.id, status: newStatus })
  }

  const handleDelete = async (payment: Payment) => {
    if (!confirm('Apakah Anda yakin ingin menghapus payment ini?')) {
      return
    }

    deletePaymentMutation.mutate(payment.id)
  }

  const handleViewDetails = (payment: Payment) => {
    setSelectedPayment(payment)
    setIsDetailModalOpen(true)
  }

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('id-ID', {
      style: 'currency',
      currency: 'IDR',
      minimumFractionDigits: 0,
    }).format(amount)
  }

  const formatDate = (dateString: string | null) => {
    if (!dateString) return '-'
    return new Date(dateString).toLocaleDateString('id-ID', {
      weekday: 'short',
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    })
  }

  const formatDateTime = (dateString: string) => {
    return new Date(dateString).toLocaleString('id-ID', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    })
  }

  // Show loading if studios not loaded yet
  if (studiosLoading || (studios.length > 0 && !selectedStudioId)) {
    return (
      <div className="flex-1 space-y-4 p-4">
        <div className="flex items-center justify-center h-64">
          <div className="text-center">
            <RefreshCw className="h-8 w-8 animate-spin mx-auto mb-4 text-muted-foreground" />
            <p className="text-lg font-medium text-gray-900">Loading...</p>
            <p className="text-sm text-gray-500 mt-1">Fetching studio data</p>
          </div>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="flex-1 space-y-4 p-4">
        <div className="flex items-center justify-center h-64">
          <div className="text-center">
            <p className="text-lg font-medium text-gray-900">Error loading payments</p>
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
          <h2 className="text-3xl font-bold tracking-tight">Payments & Finance</h2>
          <p className="text-muted-foreground">
            Kelola pembayaran dan keuangan studio
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
          <Button asChild>
            <Link href="/admin/payments/methods">
              <CreditCard className="h-4 w-4 mr-2" />
              Payment Methods
            </Link>
          </Button>
        </div>
      </div>

      {/* Statistics Cards */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Revenue</CardTitle>
            <DollarSign className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{formatCurrency(stats?.totalAmount || 0)}</div>
            <p className="text-xs text-muted-foreground">
              {formatCurrency(stats?.thisMonthAmount || 0)} bulan ini
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Completed Payments</CardTitle>
            <CheckCircle className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats?.completed || 0}</div>
            <p className="text-xs text-muted-foreground">
              {stats?.total || 0} total transactions
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Pending Payments</CardTitle>
            <AlertCircle className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats?.pending || 0}</div>
            <p className="text-xs text-muted-foreground">
              {formatCurrency(stats?.pendingAmount || 0)} amount
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Gateway Fees</CardTitle>
            <TrendingDown className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{formatCurrency(stats?.totalFees || 0)}</div>
            <p className="text-xs text-muted-foreground">
              Total fees paid
            </p>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <div className="flex flex-col space-y-4">
            <div>
              <CardTitle>Payments</CardTitle>
              <CardDescription>
                Daftar semua transaksi pembayaran
              </CardDescription>
            </div>

            {/* Studio Selector */}
            <div className="flex items-center space-x-4">
              <div className="flex-1 max-w-sm">
                <label className="text-sm font-medium mb-2 block">Select Studio:</label>
                <Select value={selectedStudioId} onValueChange={setSelectedStudioId}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select studio..." />
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
            </div>
          </div>
        </CardHeader>
        <CardContent>
          {/* Filters */}
          <div className="flex flex-col gap-4 mb-6">
            <div className="flex items-center gap-4">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
                <Input
                  placeholder="Cari berdasarkan booking code atau payment ID..."
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

              <Select value={paymentTypeFilter} onValueChange={setPaymentTypeFilter}>
                <SelectTrigger className="w-[140px]">
                  <SelectValue placeholder="Type" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Semua Type</SelectItem>
                  {Object.entries(paymentTypeLabels).map(([type, label]) => (
                    <SelectItem key={type} value={type}>
                      {label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>

              <Select value={paymentMethodFilter} onValueChange={setPaymentMethodFilter}>
                <SelectTrigger className="w-[140px]">
                  <SelectValue placeholder="Method" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Semua Method</SelectItem>
                  {paymentMethods.map((method) => (
                    <SelectItem key={method.id} value={method.id}>
                      {method.name}
                    </SelectItem>
                  ))}
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
                  <TableHead>Payment ID</TableHead>
                  <TableHead>Booking</TableHead>
                  <TableHead>Customer</TableHead>
                  <TableHead>Amount</TableHead>
                  <TableHead>Type</TableHead>
                  <TableHead>Method</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Date</TableHead>
                  <TableHead className="w-[70px]">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {loading ? (
                  Array.from({ length: 5 }).map((_, i) => (
                    <TableRow key={i}>
                      <TableCell colSpan={9}>
                        <div className="flex items-center space-x-4">
                          <div className="space-y-2 flex-1">
                            <div className="h-4 w-32 bg-gray-200 rounded animate-pulse" />
                            <div className="h-3 w-24 bg-gray-200 rounded animate-pulse" />
                          </div>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))
                ) : payments.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={9} className="text-center py-8">
                      <CreditCard className="h-8 w-8 mx-auto mb-2 text-muted-foreground" />
                      <p className="text-muted-foreground">Tidak ada payment ditemukan</p>
                    </TableCell>
                  </TableRow>
                ) : (
                  payments.map((payment) => (
                    <TableRow key={payment.id}>
                      <TableCell>
                        <div>
                          <div className="font-mono text-sm">
                            {payment.external_payment_id || payment.id.slice(0, 8)}
                          </div>
                          {payment.payment_url && (
                            <Badge variant="outline" className="text-xs mt-1">
                              Online
                            </Badge>
                          )}
                        </div>
                      </TableCell>
                      <TableCell>
                        <div>
                          <div className="font-medium">
                            {payment.reservation?.booking_code || 'N/A'}
                          </div>
                          <div className="text-sm text-muted-foreground">
                            {payment.reservation?.reservation_date ?
                              formatDate(payment.reservation.reservation_date) : 'N/A'
                            }
                          </div>
                        </div>
                      </TableCell>
                      <TableCell>
                        <div>
                          <div className="font-medium">
                            {payment.reservation?.customer?.full_name || 'Unknown Customer'}
                          </div>
                          <div className="text-sm text-muted-foreground">
                            {payment.reservation?.customer?.email || 'N/A'}
                          </div>
                        </div>
                      </TableCell>
                      <TableCell>
                        <div>
                          <div className="font-medium">
                            {formatCurrency(payment.amount)}
                          </div>
                          {payment.gateway_fee > 0 && (
                            <div className="text-sm text-muted-foreground">
                              Fee: {formatCurrency(payment.gateway_fee)}
                            </div>
                          )}
                        </div>
                      </TableCell>
                      <TableCell>
                        <Badge variant="outline">
                          {paymentTypeLabels[payment.payment_type as keyof typeof paymentTypeLabels] || payment.payment_type}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <div className="text-sm">
                          {payment.payment_method?.name || 'Manual'}
                        </div>
                        {payment.payment_method?.type && (
                          <div className="text-xs text-muted-foreground capitalize">
                            {payment.payment_method.type.replace('_', ' ')}
                          </div>
                        )}
                      </TableCell>
                      <TableCell>
                        <Badge variant={statusColors[payment.status]}>
                          {statusLabels[payment.status]}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <div>
                          <div className="text-sm">
                            {formatDateTime(payment.created_at)}
                          </div>
                          {payment.paid_at && (
                            <div className="text-xs text-muted-foreground">
                              Paid: {formatDate(payment.paid_at)}
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
                            <DropdownMenuItem onClick={() => handleViewDetails(payment)}>
                              <Eye className="mr-2 h-4 w-4" />
                              View Details
                            </DropdownMenuItem>

                            {payment.payment_url && (
                              <DropdownMenuItem
                                onClick={() => window.open(payment.payment_url!, '_blank')}
                              >
                                <CreditCard className="mr-2 h-4 w-4" />
                                Open Payment Link
                              </DropdownMenuItem>
                            )}

                            <DropdownMenuSeparator />

                            {payment.status === 'pending' && (
                              <>
                                <DropdownMenuItem
                                  onClick={() => handleStatusUpdate(payment, 'completed')}
                                >
                                  <CheckCircle className="mr-2 h-4 w-4" />
                                  Mark as Paid
                                </DropdownMenuItem>
                                <DropdownMenuItem
                                  onClick={() => handleStatusUpdate(payment, 'failed')}
                                  className="text-red-600"
                                >
                                  <XCircle className="mr-2 h-4 w-4" />
                                  Mark as Failed
                                </DropdownMenuItem>
                              </>
                            )}

                            {payment.status === 'completed' && (
                              <DropdownMenuItem
                                onClick={() => handleStatusUpdate(payment, 'refunded')}
                                className="text-red-600"
                              >
                                <TrendingDown className="mr-2 h-4 w-4" />
                                Refund
                              </DropdownMenuItem>
                            )}

                            <DropdownMenuSeparator />
                            <DropdownMenuItem
                              onClick={() => handleDelete(payment)}
                              className="text-red-600"
                            >
                              <XCircle className="mr-2 h-4 w-4" />
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
        </CardContent>
      </Card>

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

      {/* Payment Detail Modal */}
      <Dialog open={isDetailModalOpen} onOpenChange={setIsDetailModalOpen}>
        <DialogContent className="w-[50vw] max-w-none sm:max-w-7xl max-h-[95vh] overflow-auto">
          <DialogHeader>
            <DialogTitle>Payment Details</DialogTitle>
            <DialogDescription>
              Detailed information about the payment transaction
            </DialogDescription>
          </DialogHeader>


          {selectedPayment && (
            <div className="space-y-6">
              {/* Payment Overview */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <CreditCard className="h-5 w-5" />
                    Payment Information
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-3">
                      <div>
                        <label className="text-sm font-medium text-gray-500">Payment ID</label>
                        <p className="font-mono text-sm">
                          {selectedPayment.external_payment_id || selectedPayment.id}
                        </p>
                      </div>
                      <div>
                        <label className="text-sm font-medium text-gray-500">Amount</label>
                        <p className="text-lg font-semibold">{formatCurrency(selectedPayment.amount)}</p>
                      </div>
                      <div>
                        <label className="text-sm font-medium text-gray-500">Status</label>
                        <div className="flex items-center gap-2">
                          <Badge variant={statusColors[selectedPayment.status]}>
                            {statusLabels[selectedPayment.status]}
                          </Badge>
                        </div>
                      </div>
                      <div>
                        <label className="text-sm font-medium text-gray-500">Payment Type</label>
                        <Badge variant="outline">
                          {paymentTypeLabels[selectedPayment.payment_type as keyof typeof paymentTypeLabels] || selectedPayment.payment_type}
                        </Badge>
                      </div>
                    </div>

                    <div className="space-y-3">
                      <div>
                        <label className="text-sm font-medium text-gray-500">Gateway Fee</label>
                        <p className="text-sm">{formatCurrency(selectedPayment.gateway_fee)}</p>
                      </div>
                      <div>
                        <label className="text-sm font-medium text-gray-500">Net Amount</label>
                        <p className="text-sm">
                          {selectedPayment.net_amount ? formatCurrency(selectedPayment.net_amount) : '-'}
                        </p>
                      </div>
                      <div>
                        <label className="text-sm font-medium text-gray-500">Payment Method</label>
                        <p className="text-sm">
                          {selectedPayment.payment_method?.name || 'Manual'}
                          {selectedPayment.payment_method?.type && (
                            <span className="text-gray-500 ml-2 capitalize">
                              ({selectedPayment.payment_method.type.replace('_', ' ')})
                            </span>
                          )}
                        </p>
                      </div>
                      <div>
                        <label className="text-sm font-medium text-gray-500">Provider</label>
                        <p className="text-sm">{selectedPayment.payment_method?.provider || '-'}</p>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Booking Information */}
              {selectedPayment.reservation && (
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <Badge className="h-5 w-5" />
                      Booking Information
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div className="space-y-3">
                        <div>
                          <label className="text-sm font-medium text-gray-500">Booking Code</label>
                          <p className="font-mono text-sm">{selectedPayment.reservation.booking_code}</p>
                        </div>
                        <div>
                          <label className="text-sm font-medium text-gray-500">Customer Name</label>
                          <p className="text-sm">{selectedPayment.reservation.customer?.full_name || 'N/A'}</p>
                        </div>
                        <div>
                          <label className="text-sm font-medium text-gray-500">Customer Email</label>
                          <p className="text-sm">{selectedPayment.reservation.customer?.email || 'N/A'}</p>
                        </div>
                      </div>
                      <div className="space-y-3">
                        <div>
                          <label className="text-sm font-medium text-gray-500">Customer Phone</label>
                          <p className="text-sm">{selectedPayment.reservation.customer?.phone || 'N/A'}</p>
                        </div>
                        <div>
                          <label className="text-sm font-medium text-gray-500">Reservation Date</label>
                          <p className="text-sm">
                            {selectedPayment.reservation.reservation_date ?
                              formatDate(selectedPayment.reservation.reservation_date) : 'N/A'
                            }
                          </p>
                        </div>
                        <div>
                          <label className="text-sm font-medium text-gray-500">Total Amount</label>
                          <p className="text-sm font-semibold">
                            {formatCurrency(selectedPayment.reservation.total_amount)}
                          </p>
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              )}

              {/* Timestamps */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <AlertCircle className="h-5 w-5" />
                    Transaction Timeline
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div>
                      <label className="text-sm font-medium text-gray-500">Created At</label>
                      <p className="text-sm">{formatDateTime(selectedPayment.created_at)}</p>
                    </div>
                    <div>
                      <label className="text-sm font-medium text-gray-500">Paid At</label>
                      <p className="text-sm">
                        {selectedPayment.paid_at ? formatDateTime(selectedPayment.paid_at) : 'Not paid yet'}
                      </p>
                    </div>
                    <div>
                      <label className="text-sm font-medium text-gray-500">Expires At</label>
                      <p className="text-sm">
                        {selectedPayment.expires_at ? formatDateTime(selectedPayment.expires_at) : 'No expiry'}
                      </p>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* External Payment Details */}
              {(selectedPayment.external_payment_id || selectedPayment.payment_url || selectedPayment.callback_data) && (
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <CreditCard className="h-5 w-5" />
                      External Payment Details
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-3">
                      {selectedPayment.external_payment_id && (
                        <div>
                          <label className="text-sm font-medium text-gray-500">External Payment ID</label>
                          <p className="font-mono text-sm">{selectedPayment.external_payment_id}</p>
                        </div>
                      )}
                      {selectedPayment.external_status && (
                        <div>
                          <label className="text-sm font-medium text-gray-500">External Status</label>
                          <p className="text-sm">{selectedPayment.external_status}</p>
                        </div>
                      )}
                      {selectedPayment.payment_url && (
                        <div>
                          <label className="text-sm font-medium text-gray-500">Payment URL</label>
                          <div className="flex items-center gap-2">
                            <p className="text-sm truncate max-w-md">{selectedPayment.payment_url}</p>
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => window.open(selectedPayment.payment_url!, '_blank')}
                            >
                              Open
                            </Button>
                          </div>
                        </div>
                      )}
                      {selectedPayment.callback_data && (
                        <div>
                          <label className="text-sm font-medium text-gray-500">Callback Data</label>
                          <pre className="text-xs bg-gray-50 p-3 rounded-md overflow-x-auto">
                            {JSON.stringify(selectedPayment.callback_data, null, 2)}
                          </pre>
                        </div>
                      )}
                    </div>
                  </CardContent>
                </Card>
              )}

              {/* Actions */}
              <Card>
                <CardHeader>
                  <CardTitle>Actions</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="flex flex-wrap gap-2">
                    {selectedPayment.payment_url && (
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => window.open(selectedPayment.payment_url!, '_blank')}
                      >
                        <CreditCard className="mr-2 h-4 w-4" />
                        Open Payment Link
                      </Button>
                    )}

                    {selectedPayment.status === 'pending' && (
                      <>
                        <Button
                          variant="default"
                          size="sm"
                          onClick={() => {
                            handleStatusUpdate(selectedPayment, 'completed')
                            setIsDetailModalOpen(false)
                          }}
                        >
                          <CheckCircle className="mr-2 h-4 w-4" />
                          Mark as Paid
                        </Button>
                        <Button
                          variant="destructive"
                          size="sm"
                          onClick={() => {
                            handleStatusUpdate(selectedPayment, 'failed')
                            setIsDetailModalOpen(false)
                          }}
                        >
                          <XCircle className="mr-2 h-4 w-4" />
                          Mark as Failed
                        </Button>
                      </>
                    )}

                    {selectedPayment.status === 'completed' && (
                      <Button
                        variant="destructive"
                        size="sm"
                        onClick={() => {
                          handleStatusUpdate(selectedPayment, 'refunded')
                          setIsDetailModalOpen(false)
                        }}
                      >
                        <TrendingDown className="mr-2 h-4 w-4" />
                        Refund
                      </Button>
                    )}

                    <Button
                      variant="outline"
                      size="sm"
                      className="text-red-600 hover:text-red-700"
                      onClick={() => {
                        if (confirm('Are you sure you want to delete this payment?')) {
                          handleDelete(selectedPayment)
                          setIsDetailModalOpen(false)
                        }
                      }}
                    >
                      <XCircle className="mr-2 h-4 w-4" />
                      Delete Payment
                    </Button>
                  </div>
                </CardContent>
              </Card>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  )
}