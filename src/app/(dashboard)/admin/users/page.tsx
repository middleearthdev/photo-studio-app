"use client"

import React, { useState, useEffect } from "react"
import { Plus, Search, MoreHorizontal, Edit, Trash, Shield, UserCheck, UserX, AlertTriangle } from "lucide-react"
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
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog"
import { UserDialog } from "@/app/(dashboard)/admin/_components/user-dialog"
import { usePaginatedUsers, useDeactivateUser, useActivateUser, useDeleteUserPermanently } from "@/hooks/use-users"
import { type UserRole, type UserProfile } from "@/actions/users"
import { PaginationControls } from "@/components/pagination-controls"
import { DEFAULT_PAGE_SIZE } from "@/lib/constants/pagination"

const roleLabels: Record<UserRole, string> = {
  customer: 'Customer',
  admin: 'Admin',
  cs: 'Customer Service'
}

const roleColors: Record<UserRole, 'default' | 'secondary' | 'destructive' | 'outline'> = {
  customer: 'default',
  admin: 'destructive',
  cs: 'outline'
}

export default function UsersPage() {
  const [searchTerm, setSearchTerm] = useState('')
  const [roleFilter, setRoleFilter] = useState<string>('all')
  const [statusFilter, setStatusFilter] = useState<'active' | 'inactive' | 'all'>('all')
  const [selectedUser, setSelectedUser] = useState<UserProfile | null>(null)
  const [isDialogOpen, setIsDialogOpen] = useState(false)
  const [currentPage, setCurrentPage] = useState(1)
  const [pageSize, setPageSize] = useState(DEFAULT_PAGE_SIZE)
  const [userToDelete, setUserToDelete] = useState<UserProfile | null>(null)
  const [isDeleteAlertOpen, setIsDeleteAlertOpen] = useState(false)

  // TanStack Query hooks with pagination
  const { 
    data: paginatedResult, 
    isLoading: loading, 
    error 
  } = usePaginatedUsers({
    page: currentPage,
    pageSize,
    search: searchTerm,
    role: roleFilter === 'all' ? 'all' : roleFilter as UserRole,
    status: statusFilter,
  })

  const users = paginatedResult?.data || []
  const pagination = paginatedResult?.pagination
  const deactivateUserMutation = useDeactivateUser()
  const activateUserMutation = useActivateUser()
  const deleteUserPermanentlyMutation = useDeleteUserPermanently()

  // Reset pagination when filters change
  useEffect(() => {
    setCurrentPage(1)
  }, [searchTerm, roleFilter, statusFilter])

  const handlePageChange = (page: number) => {
    setCurrentPage(page)
  }

  const handlePageSizeChange = (newPageSize: number) => {
    setPageSize(newPageSize)
    setCurrentPage(1)
  }

  const handleCreateUser = () => {
    setSelectedUser(null)
    setIsDialogOpen(true)
  }

  const handleEditUser = (user: UserProfile) => {
    setSelectedUser(user)
    setIsDialogOpen(true)
  }

  const handleDeactivateUser = async (user: UserProfile) => {
    if (!confirm(`Apakah Anda yakin ingin menonaktifkan pengguna "${user.full_name}"?`)) {
      return
    }

    deactivateUserMutation.mutate(user.id)
  }

  const handleActivateUser = async (user: UserProfile) => {
    if (!confirm(`Apakah Anda yakin ingin mengaktifkan pengguna "${user.full_name}"?`)) {
      return
    }

    activateUserMutation.mutate(user.id)
  }

  const handleDeleteUserPermanently = (user: UserProfile) => {
    setUserToDelete(user)
    setIsDeleteAlertOpen(true)
  }

  const confirmDeleteUser = () => {
    if (userToDelete) {
      deleteUserPermanentlyMutation.mutate(userToDelete.id)
      setIsDeleteAlertOpen(false)
      setUserToDelete(null)
    }
  }

  const handleUserSaved = () => {
    setIsDialogOpen(false)
  }

  if (error) {
    return (
      <div className="flex-1 space-y-4 p-4">
        <div className="flex items-center justify-center h-64">
          <div className="text-center">
            <p className="text-lg font-medium text-gray-900">Error loading users</p>
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
            <h2 className="text-3xl font-bold tracking-tight">User Management</h2>
            <p className="text-muted-foreground">
              Kelola pengguna studio dan hak akses mereka
            </p>
          </div>
          <Button onClick={handleCreateUser}>
            <Plus className="mr-2 h-4 w-4" />
            Tambah User
          </Button>
        </div>

        <div className="grid gap-4 md:grid-cols-4">
          {Object.entries(roleLabels).map(([role, label]) => {
            // Show current page counts for role breakdown
            const count = users.filter(u => u.role === role && u.is_active).length
            return (
              <Card key={role}>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">{label}</CardTitle>
                  <Shield className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{count}</div>
                  <p className="text-xs text-muted-foreground">
                    {pagination ? `Page ${currentPage} results` : 'Active users'}
                  </p>
                </CardContent>
              </Card>
            )
          })}
        </div>

        <Card>
          <CardHeader>
            <CardTitle>Users</CardTitle>
            <CardDescription>
              Daftar semua pengguna yang terdaftar di studio
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex items-center gap-4 mb-4">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
                <Input
                  placeholder="Cari berdasarkan nama, email, atau telepon..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10"
                />
              </div>
              <Select value={roleFilter} onValueChange={setRoleFilter}>
                <SelectTrigger className="w-[180px]">
                  <SelectValue placeholder="Filter by role" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Semua Role</SelectItem>
                  {Object.entries(roleLabels).map(([role, label]) => (
                    <SelectItem key={role} value={role}>
                      {label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <Select value={statusFilter} onValueChange={(value) => setStatusFilter(value as 'active' | 'inactive' | 'all')}>
                <SelectTrigger className="w-[180px]">
                  <SelectValue placeholder="Filter by status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Semua Status</SelectItem>
                  <SelectItem value="active">Active</SelectItem>
                  <SelectItem value="inactive">Inactive</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="rounded-md border">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>User</TableHead>
                    <TableHead>Role</TableHead>
                    <TableHead>Contact</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Last Login</TableHead>
                    <TableHead className="w-[70px]">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {loading ? (
                    Array.from({ length: 5 }).map((_, i) => (
                      <TableRow key={i}>
                        <TableCell colSpan={6}>
                          <div className="flex items-center space-x-4">
                            <div className="h-10 w-10 rounded-full bg-gray-200 animate-pulse" />
                            <div className="space-y-2">
                              <div className="h-4 w-32 bg-gray-200 rounded animate-pulse" />
                              <div className="h-3 w-24 bg-gray-200 rounded animate-pulse" />
                            </div>
                          </div>
                        </TableCell>
                      </TableRow>
                    ))
                  ) : users.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={6} className="text-center py-4">
                        Tidak ada pengguna ditemukan
                      </TableCell>
                    </TableRow>
                  ) : (
                    users.map((user) => (
                      <TableRow key={user.id}>
                        <TableCell>
                          <div className="flex items-center space-x-4">
                            <Avatar className="h-10 w-10">
                              <AvatarImage src={user.avatar_url || ''} />
                              <AvatarFallback>
                                {user.full_name?.split(' ').map(n => n[0]).join('') || 'U'}
                              </AvatarFallback>
                            </Avatar>
                            <div>
                              <div className="font-medium">
                                {user.full_name || 'No name'}
                              </div>
                              <div className="text-sm text-muted-foreground">
                                {user.email}
                              </div>
                            </div>
                          </div>
                        </TableCell>
                        <TableCell>
                          <Badge variant={roleColors[user.role]}>
                            {roleLabels[user.role]}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          <div className="text-sm">
                            {user.phone || 'No phone'}
                          </div>
                        </TableCell>
                        <TableCell>
                          <Badge variant={user.is_active ? 'default' : 'secondary'}>
                            {user.is_active ? 'Active' : 'Inactive'}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          <div className="text-sm text-muted-foreground">
                            {user.last_login
                              ? new Date(user.last_login).toLocaleDateString('id-ID')
                              : 'Never'
                            }
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
                              <DropdownMenuItem onClick={() => handleEditUser(user)}>
                                <Edit className="mr-2 h-4 w-4" />
                                Edit
                              </DropdownMenuItem>
                              
                              <DropdownMenuSeparator />
                              
                              {user.is_active ? (
                                <DropdownMenuItem
                                  onClick={() => handleDeactivateUser(user)}
                                  className="text-orange-600"
                                >
                                  <UserX className="mr-2 h-4 w-4" />
                                  Deactivate
                                </DropdownMenuItem>
                              ) : (
                                <DropdownMenuItem
                                  onClick={() => handleActivateUser(user)}
                                  className="text-green-600"
                                >
                                  <UserCheck className="mr-2 h-4 w-4" />
                                  Activate
                                </DropdownMenuItem>
                              )}
                              
                              <DropdownMenuSeparator />
                              
                              <DropdownMenuItem
                                onClick={() => handleDeleteUserPermanently(user)}
                                className="text-red-600"
                              >
                                <AlertTriangle className="mr-2 h-4 w-4" />
                                Delete Permanently
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

        <UserDialog
          open={isDialogOpen}
          onOpenChange={setIsDialogOpen}
          user={selectedUser}
          onUserSaved={handleUserSaved}
        />

        {/* Delete Confirmation Alert */}
        <AlertDialog open={isDeleteAlertOpen} onOpenChange={setIsDeleteAlertOpen}>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle className="flex items-center gap-2 text-red-600">
                <AlertTriangle className="h-5 w-5" />
                Hapus User Secara Permanen
              </AlertDialogTitle>
              <AlertDialogDescription className="space-y-2">
                <p>
                  <strong>⚠️ PERINGATAN:</strong> Tindakan ini akan menghapus pengguna{" "}
                  <strong>"{userToDelete?.full_name}"</strong> secara PERMANEN dan tidak dapat dibatalkan.
                </p>
                <p>
                  Semua data terkait pengguna ini akan hilang selamanya. Jika pengguna memiliki reservasi aktif, 
                  operasi ini akan gagal dan Anda harus menonaktifkan pengguna terlebih dahulu.
                </p>
                <p className="text-red-600 font-medium">
                  Apakah Anda yakin ingin melanjutkan?
                </p>
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel>Cancel</AlertDialogCancel>
              <AlertDialogAction
                onClick={confirmDeleteUser}
                className="bg-red-600 hover:bg-red-700"
              >
                Ya, Hapus Permanen
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      </div>
  )
}