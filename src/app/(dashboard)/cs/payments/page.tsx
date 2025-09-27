"use client"

import React, { useState, useEffect } from "react"
import { DollarSign, CheckCircle, XCircle, Clock, Search, MoreHorizontal, Eye, Edit, RefreshCw, Download, Filter, AlertTriangle } from "lucide-react"
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
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
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
import { usePaginatedPayments, usePaymentStats, useUpdatePaymentStatus, useDeletePayment } from "@/hooks/use-payments"
import { type PaymentStatus, type Payment } from "@/actions/payments"
import { PaginationControls } from "@/components/pagination-controls"
import { DEFAULT_PAGE_SIZE } from "@/lib/constants/pagination"
import { useProfile } from "@/hooks/use-profile"

const statusLabels = {
  pending: 'Menunggu Verifikasi',
  completed: 'Berhasil',
  failed: 'Gagal',
  partial: 'Sebagian'
}

const statusColors: Record<string, 'default' | 'secondary' | 'destructive' | 'outline'> = {
  pending: 'outline',
  completed: 'default',
  failed: 'destructive',
  partial: 'secondary'
}

const paymentTypeLabels = {
  dp: 'Down Payment',
  remaining: 'Pelunasan',
  full: 'Pembayaran Penuh'
}

export default function PaymentsPage() {
  const [searchTerm, setSearchTerm] = useState('')
  const [statusFilter, setStatusFilter] = useState<string>('all')
  const [paymentTypeFilter, setPaymentTypeFilter] = useState<string>('all')
  const [dateFromFilter, setDateFromFilter] = useState('')
  const [dateToFilter, setDateToFilter] = useState('')
  const [currentPage, setCurrentPage] = useState(1)
  const [pageSize, setPageSize] = useState(DEFAULT_PAGE_SIZE)
  const [selectedPayment, setSelectedPayment] = useState<Payment | null>(null)
  const [isDetailModalOpen, setIsDetailModalOpen] = useState(false)

  // AlertDialog states
  const [paymentToDelete, setPaymentToDelete] = useState<Payment | null>(null)
  const [statusChangeData, setStatusChangeData] = useState<{
    payment: Payment
    newStatus: PaymentStatus
  } | null>(null)

  // Get user profile to get studio_id
  const { data: profile } = useProfile()
  const studioId = profile?.studio_id

  // TanStack Query hooks with pagination
  const {
    data: paginatedResult,
    isLoading: loading,
    error,
    refetch
  } = usePaginatedPayments(studioId || '', {
    page: currentPage,
    pageSize,
    search: searchTerm,
    status: statusFilter,
    payment_type: paymentTypeFilter,
    date_from: dateFromFilter || undefined,
    date_to: dateToFilter || undefined,
  })

  const { data: stats } = usePaymentStats(studioId || '')
  const payments = paginatedResult?.data || []
  const pagination = paginatedResult?.pagination

  const updateStatusMutation = useUpdatePaymentStatus()
  const deletePaymentMutation = useDeletePayment()

  // Reset pagination when filters change
  useEffect(() => {
    setCurrentPage(1)
  }, [searchTerm, statusFilter, paymentTypeFilter, dateFromFilter, dateToFilter])


  // Don't render if no studio_id
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

  const handleStatusUpdate = async (payment: Payment, newStatus: PaymentStatus) => {
    setStatusChangeData({ payment, newStatus })
  }

  const confirmStatusUpdate = () => {
    if (statusChangeData) {
      updateStatusMutation.mutate({ id: statusChangeData.payment.id, status: statusChangeData.newStatus }, {
        onSuccess: () => {
          setStatusChangeData(null)
        }
      })
    }
  }

  const handleDelete = async (payment: Payment) => {
    setPaymentToDelete(payment)
  }

  const confirmDelete = () => {
    if (paymentToDelete) {
      deletePaymentMutation.mutate(paymentToDelete.id, {
        onSuccess: () => {
          setPaymentToDelete(null)
        }
      })
    }
  }

  const handleViewDetails = (payment: Payment) => {
    setSelectedPayment(payment)
    setIsDetailModalOpen(true)
  }

  const handleEdit = (payment: Payment) => {
    // TODO: Implement payment edit modal or navigate to edit page
    alert(`Edit payment: ${payment.id}`)
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

  const formatDateTime = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('id-ID', {
      weekday: 'short',
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    })
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
          <h2 className="text-3xl font-bold tracking-tight">Payment Approval</h2>
          <p className="text-muted-foreground">
            Kelola dan verifikasi pembayaran customer
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


      {/* Statistics Cards */}
      <div className="grid gap-3 md:grid-cols-2 lg:grid-cols-3">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Menunggu Verifikasi</CardTitle>
            <Clock className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats?.pending || 0}</div>
            <p className="text-xs text-muted-foreground">
              {formatCurrency(stats?.pendingAmount || 0)}
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Berhasil Diverifikasi</CardTitle>
            <CheckCircle className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats?.completed || 0}</div>
            <p className="text-xs text-muted-foreground">
              {formatCurrency(stats?.totalAmount || 0)}
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Gagal / Ditolak</CardTitle>
            <XCircle className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats?.failed || 0}</div>
            <p className="text-xs text-muted-foreground">
              Perlu penanganan
            </p>
          </CardContent>
        </Card>

        {/* <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Revenue</CardTitle>
              <DollarSign className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{formatCurrency(stats?.thisMonthAmount || 0)}</div>
              <p className="text-xs text-muted-foreground">
                Bulan ini
              </p>
            </CardContent>
          </Card> */}
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Payments</CardTitle>
          <CardDescription>
            Daftar semua pembayaran yang perlu diverifikasi
          </CardDescription>
        </CardHeader>
        <CardContent>
          {/* Filters */}
          <div className="flex flex-col gap-4 mb-6">
            <div className="flex items-center gap-4">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
                <Input
                  placeholder="Cari berdasarkan booking code, customer, atau payment ID..."
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
                  <SelectValue placeholder="Tipe" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Semua Tipe</SelectItem>
                  {Object.entries(paymentTypeLabels).map(([type, label]) => (
                    <SelectItem key={type} value={type}>
                      {label}
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
                  <TableHead>Customer</TableHead>
                  <TableHead>Booking Code</TableHead>
                  <TableHead>Amount</TableHead>
                  <TableHead>Payment Type</TableHead>
                  <TableHead>Payment Method</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Created At</TableHead>
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
                ) : payments.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={8} className="text-center py-8">
                      <DollarSign className="h-8 w-8 mx-auto mb-2 text-muted-foreground" />
                      <p className="text-muted-foreground">Tidak ada pembayaran ditemukan</p>
                    </TableCell>
                  </TableRow>
                ) : (
                  payments.map((payment: Payment) => (
                    <TableRow key={payment.id}>
                      <TableCell>
                        <div className="flex items-center space-x-4">
                          <Avatar className="h-10 w-10">
                            <AvatarImage src="" />
                            <AvatarFallback>
                              {payment.reservation?.customer?.full_name?.split(' ').map((n: string) => n[0]).join('').toUpperCase() || 'C'}
                            </AvatarFallback>
                          </Avatar>
                          <div>
                            <div className="font-medium">{payment.reservation?.customer?.full_name || 'Unknown Customer'}</div>
                            <div className="text-sm text-muted-foreground">
                              {payment.reservation?.customer?.email || payment.reservation?.guest_email}
                            </div>
                          </div>
                        </div>
                      </TableCell>
                      <TableCell>
                        <div>
                          <div className="font-medium">{payment.reservation?.booking_code}</div>
                          <div className="text-sm text-muted-foreground">
                            {payment.reservation?.reservation_date ? formatDate(payment.reservation.reservation_date) : ''}
                          </div>
                        </div>
                      </TableCell>
                      <TableCell>
                        <div>
                          <div className="font-medium">{formatCurrency(payment.amount)}</div>
                          {(payment.gateway_fee || 0) > 0 && (
                            <div className="text-sm text-muted-foreground">
                              Fee: {formatCurrency(payment.gateway_fee || 0)}
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
                      </TableCell>
                      <TableCell>
                        <Badge variant={statusColors[payment.status] || 'outline'}>
                          {statusLabels[payment.status as keyof typeof statusLabels] || payment.status}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <div className="text-sm">
                          {payment.created_at ? formatDateTime(payment.created_at) : ''}
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
                            <DropdownMenuItem onClick={() => handleEdit(payment)}>
                              <Edit className="mr-2 h-4 w-4" />
                              Edit
                            </DropdownMenuItem>
                            <DropdownMenuSeparator />

                            {payment.status === 'pending' && (
                              <>
                                <DropdownMenuItem
                                  onClick={() => handleStatusUpdate(payment, 'completed')}
                                  className="text-green-600"
                                >
                                  <CheckCircle className="mr-2 h-4 w-4" />
                                  Approve
                                </DropdownMenuItem>
                                <DropdownMenuItem
                                  onClick={() => handleStatusUpdate(payment, 'failed')}
                                  className="text-red-600"
                                >
                                  <XCircle className="mr-2 h-4 w-4" />
                                  Reject
                                </DropdownMenuItem>
                              </>
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

      {/* Payment Detail Modal */}
      <Dialog open={isDetailModalOpen} onOpenChange={setIsDetailModalOpen}>
        <DialogContent className="w-[50vw] max-w-none sm:max-w-4xl max-h-[95vh] overflow-auto">
          <DialogHeader>
            <DialogTitle>Payment Details</DialogTitle>
            <DialogDescription>
              Detailed information about the payment
            </DialogDescription>
          </DialogHeader>

          {selectedPayment && (
            <div className="space-y-6">
              {/* Basic Information */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <DollarSign className="h-5 w-5" />
                    Payment Information
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-3">
                      <div>
                        <label className="text-sm font-medium text-gray-500">Payment ID</label>
                        <p className="font-mono text-sm">{selectedPayment.id}</p>
                      </div>
                      <div>
                        <label className="text-sm font-medium text-gray-500">Amount</label>
                        <p className="text-lg font-bold">{formatCurrency(selectedPayment.amount)}</p>
                      </div>
                      <div>
                        <label className="text-sm font-medium text-gray-500">Status</label>
                        <Badge variant={statusColors[selectedPayment.status]}>
                          {statusLabels[selectedPayment.status as keyof typeof statusLabels]}
                        </Badge>
                      </div>
                    </div>

                    <div className="space-y-3">
                      <div>
                        <label className="text-sm font-medium text-gray-500">Payment Type</label>
                        <p className="text-sm">{paymentTypeLabels[selectedPayment.payment_type as keyof typeof paymentTypeLabels] || selectedPayment.payment_type}</p>
                      </div>
                      <div>
                        <label className="text-sm font-medium text-gray-500">Payment Method</label>
                        <p className="text-sm">{selectedPayment.payment_method?.name || 'Manual'}</p>
                      </div>
                      <div>
                        <label className="text-sm font-medium text-gray-500">Gateway Fee</label>
                        <p className="text-sm">{formatCurrency(selectedPayment.gateway_fee || 0)}</p>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Customer & Reservation Information */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Eye className="h-5 w-5" />
                    Customer & Reservation Information
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-3">
                      <div>
                        <label className="text-sm font-medium text-gray-500">Customer Name</label>
                        <p className="text-sm">{selectedPayment.reservation?.customer?.full_name || 'Unknown Customer'}</p>
                      </div>
                      <div>
                        <label className="text-sm font-medium text-gray-500">Email</label>
                        <p className="text-sm">{selectedPayment.reservation?.customer?.email || selectedPayment.reservation?.guest_email || '-'}</p>
                      </div>
                      <div>
                        <label className="text-sm font-medium text-gray-500">Phone</label>
                        <p className="text-sm">{selectedPayment.reservation?.customer?.phone || selectedPayment.reservation?.guest_phone || '-'}</p>
                      </div>
                    </div>
                    <div className="space-y-3">
                      <div>
                        <label className="text-sm font-medium text-gray-500">Booking Code</label>
                        <p className="text-sm font-mono">{selectedPayment.reservation?.booking_code}</p>
                      </div>
                      <div>
                        <label className="text-sm font-medium text-gray-500">Reservation Date</label>
                        <p className="text-sm">
                          {selectedPayment.reservation?.reservation_date ? formatDate(selectedPayment.reservation.reservation_date) : '-'}
                        </p>
                      </div>
                      <div>
                        <label className="text-sm font-medium text-gray-500">Total Amount</label>
                        <p className="text-sm font-semibold">{formatCurrency(selectedPayment.reservation?.total_amount || 0)}</p>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* External Payment Info */}
              {selectedPayment.external_payment_id && (
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <AlertTriangle className="h-5 w-5" />
                      External Payment Information
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div className="space-y-3">
                        <div>
                          <label className="text-sm font-medium text-gray-500">External Payment ID</label>
                          <p className="text-sm font-mono">{selectedPayment.external_payment_id}</p>
                        </div>
                        <div>
                          <label className="text-sm font-medium text-gray-500">Payment URL</label>
                          <p className="text-sm break-all">{selectedPayment.payment_url || '-'}</p>
                        </div>
                      </div>
                      <div className="space-y-3">
                        <div>
                          <label className="text-sm font-medium text-gray-500">Net Amount</label>
                          <p className="text-sm font-semibold">{formatCurrency(selectedPayment.net_amount || selectedPayment.amount)}</p>
                        </div>
                        <div>
                          <label className="text-sm font-medium text-gray-500">Gateway Response</label>
                          <p className="text-sm">{selectedPayment.gateway_response || 'N/A'}</p>
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
                    <Clock className="h-5 w-5" />
                    Timeline
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-3">
                      <div>
                        <label className="text-sm font-medium text-gray-500">Created At</label>
                        <p className="text-sm">{selectedPayment.created_at ? formatDateTime(selectedPayment.created_at) : '-'}</p>
                      </div>
                      <div>
                        <label className="text-sm font-medium text-gray-500">Updated At</label>
                        <p className="text-sm">{selectedPayment.updated_at ? formatDateTime(selectedPayment.updated_at) : '-'}</p>
                      </div>
                    </div>
                    <div className="space-y-3">
                      <div>
                        <label className="text-sm font-medium text-gray-500">Processed At</label>
                        <p className="text-sm">{selectedPayment.processed_at ? formatDateTime(selectedPayment.processed_at) : 'Not processed yet'}</p>
                      </div>
                      <div>
                        <label className="text-sm font-medium text-gray-500">Verification Notes</label>
                        <p className="text-sm">{selectedPayment.verification_notes || 'No notes'}</p>
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
                    {selectedPayment.status === 'pending' && (
                      <>
                        <Button
                          variant="default"
                          size="sm"
                          onClick={() => {
                            handleStatusUpdate(selectedPayment, 'completed')
                            setIsDetailModalOpen(false)
                          }}
                          className="bg-green-600 hover:bg-green-700"
                        >
                          <CheckCircle className="mr-2 h-4 w-4" />
                          Approve Payment
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
                          Reject Payment
                        </Button>
                      </>
                    )}


                    {selectedPayment.payment_url && (
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => selectedPayment.payment_url && window.open(selectedPayment.payment_url, '_blank')}
                      >
                        <Download className="mr-2 h-4 w-4" />
                        View Payment URL
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
      <AlertDialog open={!!paymentToDelete} onOpenChange={() => setPaymentToDelete(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Hapus Payment</AlertDialogTitle>
            <AlertDialogDescription>
              <div className="space-y-2">
                <p className="font-semibold text-red-600">⚠️ PERINGATAN: Aksi ini tidak dapat dibatalkan!</p>
                <p>
                  Apakah Anda yakin ingin menghapus payment secara permanen?
                </p>
                <p className="text-sm text-muted-foreground">
                  Payment dan semua data terkaitnya akan dihapus dari database dan tidak dapat dipulihkan.
                </p>
                {paymentToDelete && (
                  <div className="mt-3 p-3 bg-gray-50 rounded-lg">
                    <div className="text-sm">
                      <p><span className="font-medium">Payment ID:</span> {paymentToDelete.id}</p>
                      <p><span className="font-medium">Amount:</span> {formatCurrency(paymentToDelete.amount)}</p>
                      <p><span className="font-medium">Status:</span> {statusLabels[paymentToDelete.status as keyof typeof statusLabels]}</p>
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
              Ubah Status Payment
            </AlertDialogTitle>
            <AlertDialogDescription>
              {statusChangeData && (
                <div className="space-y-2">
                  <p>
                    Apakah Anda yakin ingin mengubah status payment
                    dari <span className="font-medium">{statusLabels[statusChangeData.payment.status as keyof typeof statusLabels]}</span>
                    menjadi <span className="font-medium">{statusLabels[statusChangeData.newStatus as keyof typeof statusLabels]}</span>?
                  </p>

                  {statusChangeData.newStatus === 'completed' && (
                    <div className="p-3 bg-green-50 border border-green-200 rounded-lg">
                      <p className="text-green-800 text-sm font-medium">
                        ✅ Payment akan diverifikasi dan reservasi akan diupdate.
                      </p>
                    </div>
                  )}

                  {statusChangeData.newStatus === 'failed' && (
                    <div className="p-3 bg-red-50 border border-red-200 rounded-lg">
                      <p className="text-red-800 text-sm font-medium">
                        ❌ Payment akan ditolak dan customer akan diberitahu.
                      </p>
                    </div>
                  )}


                  <div className="mt-3 p-3 bg-gray-50 rounded-lg">
                    <div className="text-sm">
                      <p><span className="font-medium">Payment ID:</span> {statusChangeData.payment.id}</p>
                      <p><span className="font-medium">Amount:</span> {formatCurrency(statusChangeData.payment.amount)}</p>
                      <p><span className="font-medium">Booking:</span> {statusChangeData.payment.reservation?.booking_code}</p>
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
                statusChangeData?.newStatus === 'completed'
                  ? "bg-green-600 hover:bg-green-700"
                  : statusChangeData?.newStatus === 'failed'
                    ? "bg-red-600 hover:bg-red-700"
                    : "bg-blue-600 hover:bg-blue-700"
              }
            >
              {statusChangeData?.newStatus === 'completed' && 'Approve Payment'}
              {statusChangeData?.newStatus === 'failed' && 'Reject Payment'}
              {!['completed', 'failed'].includes(statusChangeData?.newStatus || '') && 'Update Status'}
              {statusChangeData?.newStatus === 'partial' && 'Mark as Partial'}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  )
}