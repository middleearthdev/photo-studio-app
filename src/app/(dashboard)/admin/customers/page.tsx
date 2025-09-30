"use client"

import React, { useState, useEffect } from "react"
import { Users, UserCheck, Search, MoreHorizontal, Eye, Edit, Trash, Plus, RefreshCw, Calendar, DollarSign, TrendingUp } from "lucide-react"
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
import { usePaginatedCustomers, useCustomerStats, useDeleteCustomer } from "@/hooks/use-customers"
import { type Customer } from "@/actions/customers"
import { PaginationControls } from "@/components/pagination-controls"
import { DEFAULT_PAGE_SIZE } from "@/lib/constants/pagination"

export default function CustomersPage() {
  const [searchTerm, setSearchTerm] = useState('')
  const [typeFilter, setTypeFilter] = useState<'all' | 'registered' | 'guest'>('all')
  const [currentPage, setCurrentPage] = useState(1)
  const [pageSize, setPageSize] = useState(DEFAULT_PAGE_SIZE)

  // TanStack Query hooks with pagination
  const {
    data: paginatedResult,
    isLoading: loading,
    error,
    refetch
  } = usePaginatedCustomers({
    page: currentPage,
    pageSize,
    search: searchTerm,
    type: typeFilter,
  })

  const { data: stats } = useCustomerStats()
  const customers = paginatedResult?.data || []
  const pagination = paginatedResult?.pagination

  const deleteCustomerMutation = useDeleteCustomer()

  // Reset pagination when filters change
  useEffect(() => {
    setCurrentPage(1)
  }, [searchTerm, typeFilter])

  const handlePageChange = (page: number) => {
    setCurrentPage(page)
  }

  const handlePageSizeChange = (newPageSize: number) => {
    setPageSize(newPageSize)
    setCurrentPage(1)
  }

  const handleDelete = async (customer: Customer) => {
    if (!confirm(`Apakah Anda yakin ingin menghapus customer "${customer.full_name}"?`)) {
      return
    }

    deleteCustomerMutation.mutate(customer.id)
  }

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('id-ID', {
      style: 'currency',
      currency: 'IDR',
      minimumFractionDigits: 0,
    }).format(amount)
  }

  const formatDate = (dateString: string | null) => {
    if (!dateString) return 'Belum pernah'
    return new Date(dateString).toLocaleDateString('id-ID', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    })
  }

  const getCustomerTypeColor = (customer: Customer) => {
    if (customer.user_profile) {
      return customer.user_profile.is_active ? 'default' : 'secondary'
    }
    return 'outline' // guest
  }

  const getCustomerTypeLabel = (customer: Customer) => {
    if (customer.user_profile) {
      return customer.user_profile.is_active ? 'Registered' : 'Inactive User'
    }
    return 'Guest'
  }

  if (error) {
    return (
      <div className="flex-1 space-y-4 p-4">
        <div className="flex items-center justify-center h-64">
          <div className="text-center">
            <p className="text-lg font-medium text-gray-900">Error loading customers</p>
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
          <h2 className="text-3xl font-bold tracking-tight">Customer Management</h2>
          <p className="text-muted-foreground">
            Kelola data customer dan riwayat transaksi mereka
          </p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" onClick={() => refetch()}>
            <RefreshCw className="h-4 w-4 mr-2" />
            Refresh
          </Button>
          <Button>
            <Plus className="h-4 w-4 mr-2" />
            Tambah Customer
          </Button>
        </div>
      </div>

      {/* Statistics Cards */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Customers</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats?.total || 0}</div>
            <p className="text-xs text-muted-foreground">
              {stats?.newThisMonth || 0} baru bulan ini
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Registered Users</CardTitle>
            <UserCheck className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats?.registered || 0}</div>
            <p className="text-xs text-muted-foreground">
              {stats?.guest || 0} guest customers
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Avg Customer Value</CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{formatCurrency(stats?.avgCustomerValue || 0)}</div>
            <p className="text-xs text-muted-foreground">
              Lifetime value
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Revenue</CardTitle>
            <DollarSign className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{formatCurrency(stats?.totalRevenue || 0)}</div>
            <p className="text-xs text-muted-foreground">
              Dari semua customer
            </p>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Customers</CardTitle>
          <CardDescription>
            Daftar semua customer dari seluruh studio foto
          </CardDescription>
        </CardHeader>
        <CardContent>
          {/* Filters */}
          <div className="flex items-center gap-4 mb-6">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
              <Input
                placeholder="Cari berdasarkan nama, email, atau telepon..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>
            <Select value={typeFilter} onValueChange={(value) => setTypeFilter(value as any)}>
              <SelectTrigger className="w-[180px]">
                <SelectValue placeholder="Filter by type" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Semua Customer</SelectItem>
                <SelectItem value="registered">Registered</SelectItem>
                <SelectItem value="guest">Guest</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Table */}
          <div className="rounded-md border">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Customer</TableHead>
                  <TableHead>Contact</TableHead>
                  <TableHead>Type</TableHead>
                  <TableHead>Reservations</TableHead>
                  <TableHead>Total Spent</TableHead>
                  <TableHead>Last Visit</TableHead>
                  <TableHead className="w-[70px]">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {loading ? (
                  Array.from({ length: 5 }).map((_, i) => (
                    <TableRow key={i}>
                      <TableCell colSpan={7}>
                        <div className="flex items-center space-x-4">
                          <div className="h-10 w-10 rounded-full bg-gray-200 animate-pulse" />
                          <div className="space-y-2 flex-1">
                            <div className="h-4 w-32 bg-gray-200 rounded animate-pulse" />
                            <div className="h-3 w-24 bg-gray-200 rounded animate-pulse" />
                          </div>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))
                ) : customers.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={7} className="text-center py-8">
                      <Users className="h-8 w-8 mx-auto mb-2 text-muted-foreground" />
                      <p className="text-muted-foreground">Tidak ada customer ditemukan</p>
                    </TableCell>
                  </TableRow>
                ) : (
                  customers.map((customer) => (
                    <TableRow key={customer.id}>
                      <TableCell>
                        <div className="flex items-center space-x-4">
                          <Avatar className="h-10 w-10">
                            <AvatarImage src={customer.user_profile?.avatar_url || ''} />
                            <AvatarFallback>
                              {customer.full_name.split(' ').map(n => n[0]).join('').toUpperCase() || 'C'}
                            </AvatarFallback>
                          </Avatar>
                          <div>
                            <div className="font-medium">{customer.full_name}</div>
                            <div className="text-sm text-muted-foreground">
                              Bergabung: {formatDate(customer.created_at)}
                            </div>
                          </div>
                        </div>
                      </TableCell>
                      <TableCell>
                        <div>
                          <div className="font-medium">{customer.email}</div>
                          <div className="text-sm text-muted-foreground">{customer.phone}</div>
                          {customer.address && (
                            <div className="text-xs text-muted-foreground truncate max-w-[150px]">
                              {customer.address}
                            </div>
                          )}
                        </div>
                      </TableCell>
                      <TableCell>
                        <Badge variant={getCustomerTypeColor(customer)}>
                          {getCustomerTypeLabel(customer)}
                        </Badge>
                        {customer.user_profile?.role && customer.user_profile.role !== 'customer' && (
                          <Badge variant="outline" className="ml-1 text-xs">
                            {customer.user_profile.role}
                          </Badge>
                        )}
                      </TableCell>
                      <TableCell>
                        <div className="text-center">
                          <div className="font-medium">{customer.total_reservations || 0}</div>
                          <div className="text-xs text-muted-foreground">reservasi</div>
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="font-medium">
                          {formatCurrency(customer.total_spent || 0)}
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="text-sm">
                          {formatDate(customer.last_reservation_date || null)}
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
                              View Profile
                            </DropdownMenuItem>
                            <DropdownMenuItem>
                              <Calendar className="mr-2 h-4 w-4" />
                              Reservation History
                            </DropdownMenuItem>
                            <DropdownMenuItem>
                              <Edit className="mr-2 h-4 w-4" />
                              Edit Info
                            </DropdownMenuItem>
                            <DropdownMenuSeparator />
                            <DropdownMenuItem
                              onClick={() => handleDelete(customer)}
                              className="text-red-600"
                              disabled={!!customer.total_reservations && customer.total_reservations > 0}
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
    </div>
  )
}