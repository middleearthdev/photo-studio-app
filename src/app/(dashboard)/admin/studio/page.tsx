"use client"

import React, { useState } from "react"
import { Building2, MapPin, Phone, Mail, Clock, Plus, Edit, Trash, MoreHorizontal, Settings, Loader2, AlertTriangle, RefreshCw } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
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
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
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
import { useStudios, useDeleteStudio, useHardDeleteStudio } from "@/hooks/use-studios"
import { StudioDialog } from "@/app/(dashboard)/admin/_components/studio-dialog"
import { type Studio } from "@/actions/studios"


export default function StudioManagementPage() {
  const [selectedStudio, setSelectedStudio] = useState<Studio | null>(null)
  const [isDialogOpen, setIsDialogOpen] = useState(false)
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false)
  const [hardDeleteDialogOpen, setHardDeleteDialogOpen] = useState(false)
  const [studioToDelete, setStudioToDelete] = useState<Studio | null>(null)

  const { data: studios = [], isLoading, error, refetch } = useStudios()
  const deleteStudioMutation = useDeleteStudio()
  const hardDeleteStudioMutation = useHardDeleteStudio()

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('id-ID', {
      style: 'currency',
      currency: 'IDR',
      minimumFractionDigits: 0,
    }).format(amount)
  }

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('id-ID', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    })
  }

  const getStatusColor = (isActive: boolean | null) => {
    return (isActive ?? true) ? 'default' : 'secondary'
  }

  const getStatusLabel = (isActive: boolean | null) => {
    return (isActive ?? true) ? 'Aktif' : 'Tidak Aktif'
  }

  const formatOperatingHours = (operatingHours: any) => {
    if (!operatingHours) return 'Tidak ada jam operasional'

    const daysOrder = ['monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday', 'sunday']
    const dayLabels = {
      monday: 'Sen', tuesday: 'Sel', wednesday: 'Rab', thursday: 'Kam',
      friday: 'Jum', saturday: 'Sab', sunday: 'Min'
    }

    const openDays = daysOrder
      .filter(day => operatingHours[day]?.isOpen)
      .map(day => dayLabels[day as keyof typeof dayLabels])

    if (openDays.length === 0) return 'Tutup semua hari'
    if (openDays.length === 7) return 'Buka setiap hari'
    if (openDays.length === 6 && !operatingHours.sunday?.isOpen) return 'Sen-Sab'
    if (openDays.length === 5 && !operatingHours.saturday?.isOpen && !operatingHours.sunday?.isOpen) return 'Hari kerja'

    // Show first day's hours as sample
    const firstOpenDay = daysOrder.find(day => operatingHours[day]?.isOpen)
    const firstDayHours = firstOpenDay ? operatingHours[firstOpenDay] : null

    if (firstDayHours && firstDayHours.open && firstDayHours.close) {
      return `${openDays.join(', ')} • ${firstDayHours.open}-${firstDayHours.close}`
    }

    return openDays.join(', ')
  }

  const handleEditStudio = (studio: Studio) => {
    setSelectedStudio(studio)
    setIsDialogOpen(true)
  }

  const handleCreateStudio = () => {
    setSelectedStudio(null)
    setIsDialogOpen(true)
  }

  const handleDeleteConfirm = (studio: Studio) => {
    setStudioToDelete(studio)
    setDeleteDialogOpen(true)
  }

  const handleHardDeleteConfirm = (studio: Studio) => {
    setStudioToDelete(studio)
    setHardDeleteDialogOpen(true)
  }

  const executeDelete = async () => {
    if (studioToDelete) {
      await deleteStudioMutation.mutateAsync(studioToDelete.id)
      setDeleteDialogOpen(false)
      setStudioToDelete(null)
    }
  }

  const executeHardDelete = async () => {
    if (studioToDelete) {
      await hardDeleteStudioMutation.mutateAsync(studioToDelete.id)
      setHardDeleteDialogOpen(false)
      setStudioToDelete(null)
    }
  }

  const handleDialogSuccess = () => {
    refetch()
  }

  if (isLoading) {
    return (
      <div className="flex-1 space-y-4 p-4">
        <div className="flex items-center justify-center h-96">
          <Loader2 className="h-8 w-8 animate-spin" />
          <span className="ml-2">Memuat data studio...</span>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="flex-1 space-y-4 p-4">
        <div className="flex items-center justify-center h-96">
          <div className="text-center">
            <AlertTriangle className="h-12 w-12 text-destructive mx-auto mb-4" />
            <h3 className="text-lg font-semibold mb-2">Gagal Memuat Data Studio</h3>
            <p className="text-muted-foreground mb-4">{error.message}</p>
            <Button onClick={() => refetch()}>Coba Lagi</Button>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="flex-1 space-y-4 p-4">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-3xl font-bold tracking-tight">Studio Management</h2>
          <p className="text-muted-foreground">
            Kelola semua studio foto yang terdaftar dalam sistem
          </p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" onClick={() => refetch()}>
            <RefreshCw className="h-4 w-4 mr-2" />
            Perbarui
          </Button>
          {/* <Button onClick={handleCreateStudio}>
            <Plus className="h-4 w-4 mr-2" />
            Tambah Studio
          </Button> */}
        </div>
      </div>

      {/* Statistics Cards */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Studio</CardTitle>
            <Building2 className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{studios.length}</div>
            <p className="text-xs text-muted-foreground">
              {studios.filter(s => s.is_active).length} aktif
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Studios Table */}
      <Card>
        <CardHeader>
          <CardTitle>Studios</CardTitle>
          <CardDescription>
            Daftar semua studio foto yang terdaftar
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="rounded-md border">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Studio</TableHead>
                  <TableHead>Kontak</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Dibuat</TableHead>
                  <TableHead className="w-[70px]">Aksi</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {studios.map((studio) => (
                  <TableRow key={studio.id}>
                    <TableCell>
                      <div className="flex items-center space-x-4">
                        <Avatar className="h-12 w-12">
                          <AvatarFallback>
                            {studio.name.split(' ').map(n => n[0]).join('').toUpperCase()}
                          </AvatarFallback>
                        </Avatar>
                        <div>
                          <div className="font-medium">{studio.name}</div>
                          {studio.description && (
                            <div className="text-sm text-muted-foreground">
                              {studio.description.substring(0, 50)}{studio.description.length > 50 ? '...' : ''}
                            </div>
                          )}
                        </div>
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="space-y-1">
                        <div className="flex items-center text-sm">
                          <MapPin className="h-3 w-3 mr-1" />
                          <span className="truncate max-w-[200px]">{studio.address}</span>
                        </div>
                        {studio.phone && (
                          <div className="flex items-center text-sm">
                            <Phone className="h-3 w-3 mr-1" />
                            {studio.phone}
                          </div>
                        )}
                        {studio.email && (
                          <div className="flex items-center text-sm">
                            <Mail className="h-3 w-3 mr-1" />
                            {studio.email}
                          </div>
                        )}
                        <div className="flex items-center text-sm">
                          <Clock className="h-3 w-3 mr-1" />
                          {formatOperatingHours(studio.operating_hours)}
                        </div>
                      </div>
                    </TableCell>
                    <TableCell>
                      <Badge variant={getStatusColor(studio.is_active)}>
                        {getStatusLabel(studio.is_active)}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <div className="text-sm text-muted-foreground">
                        {formatDate(studio.created_at)}
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
                          <DropdownMenuLabel>Aksi</DropdownMenuLabel>
                          <DropdownMenuItem onClick={() => handleEditStudio(studio)}>
                            <Edit className="mr-2 h-4 w-4" />
                            Edit Studio
                          </DropdownMenuItem>
                          <DropdownMenuItem onClick={() => handleDeleteConfirm(studio)}>
                            <Settings className="mr-2 h-4 w-4" />
                            {studio.is_active ? 'Nonaktifkan' : 'Aktifkan'}
                          </DropdownMenuItem>
                          <DropdownMenuSeparator />
                          {!studio.is_active && (
                            <DropdownMenuItem
                              className="text-red-600"
                              onClick={() => handleHardDeleteConfirm(studio)}
                            >
                              <Trash className="mr-2 h-4 w-4" />
                              Hapus Permanen
                            </DropdownMenuItem>
                          )}
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>

      {/* Studio Dialog */}
      <StudioDialog
        open={isDialogOpen}
        onOpenChange={setIsDialogOpen}
        studio={selectedStudio}
        onStudioSaved={handleDialogSuccess}
      />

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Ubah Status Studio</AlertDialogTitle>
            <AlertDialogDescription>
              Apakah Anda yakin ingin {studioToDelete?.is_active ? 'menonaktifkan' : 'mengaktifkan'} studio "{studioToDelete?.name}"?
              {studioToDelete?.is_active && ' Studio akan menjadi tidak tersedia untuk reservasi baru.'}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Batal</AlertDialogCancel>
            <AlertDialogAction
              onClick={executeDelete}
              disabled={deleteStudioMutation.isPending}
            >
              {deleteStudioMutation.isPending ? (
                <><Loader2 className="mr-2 h-4 w-4 animate-spin" /> Memproses...</>
              ) : (
                studioToDelete?.is_active ? 'Nonaktifkan' : 'Aktifkan'
              )}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Hard Delete Confirmation Dialog */}
      <AlertDialog open={hardDeleteDialogOpen} onOpenChange={setHardDeleteDialogOpen}>
        <AlertDialogContent >
          <AlertDialogHeader>
            <AlertDialogTitle>Hapus Studio Secara Permanen</AlertDialogTitle>
            <AlertDialogDescription className="space-y-2">
              <div>
                Apakah Anda yakin ingin menghapus permanen studio "{studioToDelete?.name}"?
              </div>
              <div className="text-red-600 font-medium">
                Tindakan ini tidak dapat dibatalkan. Semua data terkait akan dihapus permanen.
              </div>
              <div className="text-sm text-muted-foreground">
                Studio harus dalam status tidak aktif dan tidak memiliki fasilitas atau reservasi untuk dapat dihapus.
              </div>
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Batal</AlertDialogCancel>
            <AlertDialogAction
              onClick={executeHardDelete}
              disabled={hardDeleteStudioMutation.isPending}
              className="bg-red-600 hover:bg-red-700"
            >
              {hardDeleteStudioMutation.isPending ? (
                <><Loader2 className="mr-2 h-4 w-4 animate-spin" /> Menghapus...</>
              ) : (
                'Hapus Permanen'
              )}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  )
}