"use client"

import { useState } from "react"
import {
  Plus,
  Search,
  MoreHorizontal,
  Edit,
  Trash,
  Building2,
  MapPin,
  Phone,
  Mail,
  Clock,
  Settings
} from "lucide-react"
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
import { Badge } from "@/components/ui/badge"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Skeleton } from "@/components/ui/skeleton"
import { StudioDialog } from "@/app/(dashboard)/admin/_components/studio-dialog"
import { useStudios, useDeleteStudio, useHardDeleteStudio } from "@/hooks/use-studios"
import { type Studio } from "@/actions/studios"
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

export default function StudioPage() {
  const [searchTerm, setSearchTerm] = useState('')
  const [selectedStudio, setSelectedStudio] = useState<Studio | null>(null)
  const [isDialogOpen, setIsDialogOpen] = useState(false)
  const [studioToDelete, setStudioToDelete] = useState<Studio | null>(null)
  const [studioToHardDelete, setStudioToHardDelete] = useState<Studio | null>(null)

  const { data: studios = [], isLoading: loading, error, refetch } = useStudios()
  const deleteStudioMutation = useDeleteStudio()
  const hardDeleteStudioMutation = useHardDeleteStudio()

  const filteredStudios = studios.filter(studio =>
    studio.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    studio.address.toLowerCase().includes(searchTerm.toLowerCase())
  )

  const handleEdit = (studio: Studio) => {
    setSelectedStudio(studio)
    setIsDialogOpen(true)
  }

  const handleAdd = () => {
    setSelectedStudio(null)
    setIsDialogOpen(true)
  }

  const handleDelete = async (studio: Studio) => {
    deleteStudioMutation.mutate(studio.id, {
      onSuccess: () => {
        setStudioToDelete(null)
      }
    })
  }

  const handleHardDelete = async (studio: Studio) => {
    hardDeleteStudioMutation.mutate(studio.id, {
      onSuccess: () => {
        setStudioToHardDelete(null)
      }
    })
  }

  const handleStudioSaved = () => {
    refetch()
  }

  const formatOperatingHours = (hours: Record<string, { open: string; close: string }> | null) => {
    if (!hours) return "Tidak diatur"

    const days = Object.keys(hours)
    if (days.length === 0) return "Tidak diatur"

    // Check if all days have same hours
    const firstDay = hours[days[0]]
    const allSame = days.every(day =>
      hours[day].open === firstDay.open && hours[day].close === firstDay.close
    )

    if (allSame) {
      return `${firstDay.open} - ${firstDay.close}`
    }

    return "Bervariasi"
  }

  if (error) {
    return (
      <div className="p-8">
        <Card>
          <CardContent className="pt-6">
            <div className="text-center text-muted-foreground">
              Terjadi kesalahan saat memuat data studio
            </div>
          </CardContent>
        </Card>
      </div>
    )
  }

  return (
    <div className="p-6">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold">Studio Management</h1>
          <p className="text-muted-foreground">
            Kelola informasi studio foto Anda
          </p>
        </div>
        <Button onClick={handleAdd}>
          <Plus className="h-4 w-4 mr-2" />
          Tambah Studio
        </Button>
      </div>

      <div className="space-y-4">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Building2 className="h-5 w-5" />
              Daftar Studio
            </CardTitle>
            <CardDescription>
              Kelola studio foto yang terdaftar dalam sistem
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex items-center gap-4 mb-6">
              <div className="relative flex-1 max-w-sm">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
                <Input
                  placeholder="Cari studio..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10"
                />
              </div>
            </div>

            {loading ? (
              <div className="space-y-2">
                {[...Array(3)].map((_, i) => (
                  <Skeleton key={i} className="h-16 w-full" />
                ))}
              </div>
            ) : (
              <div className="rounded-md border">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Studio</TableHead>
                      <TableHead>Kontak</TableHead>
                      <TableHead>Jam Operasional</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead className="w-[100px]">Aksi</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredStudios.length === 0 ? (
                      <TableRow>
                        <TableCell colSpan={5} className="text-center h-24 text-muted-foreground">
                          {searchTerm ? "Tidak ada studio yang cocok dengan pencarian" : "Belum ada studio yang terdaftar"}
                        </TableCell>
                      </TableRow>
                    ) : (
                      filteredStudios.map((studio) => (
                        <TableRow key={studio.id}>
                          <TableCell>
                            <div className="space-y-1">
                              <div className="font-medium">{studio.name}</div>
                              <div className="flex items-center gap-1 text-sm text-muted-foreground">
                                <MapPin className="h-3 w-3" />
                                <span className="line-clamp-1">{studio.address}</span>
                              </div>
                              {studio.description && (
                                <div className="text-sm text-muted-foreground line-clamp-2">
                                  {studio.description}
                                </div>
                              )}
                            </div>
                          </TableCell>
                          <TableCell>
                            <div className="space-y-1">
                              {studio.phone && (
                                <div className="flex items-center gap-1 text-sm">
                                  <Phone className="h-3 w-3" />
                                  <span>{studio.phone}</span>
                                </div>
                              )}
                              {studio.email && (
                                <div className="flex items-center gap-1 text-sm">
                                  <Mail className="h-3 w-3" />
                                  <span>{studio.email}</span>
                                </div>
                              )}
                              {!studio.phone && !studio.email && (
                                <span className="text-muted-foreground text-sm">-</span>
                              )}
                            </div>
                          </TableCell>
                          <TableCell>
                            <div className="flex items-center gap-1 text-sm">
                              <Clock className="h-3 w-3" />
                              <span>{formatOperatingHours(studio.operating_hours)}</span>
                            </div>
                          </TableCell>
                          <TableCell>
                            <Badge variant={studio.is_active ? "default" : "secondary"}>
                              {studio.is_active ? "Aktif" : "Nonaktif"}
                            </Badge>
                          </TableCell>
                          <TableCell>
                            <DropdownMenu>
                              <DropdownMenuTrigger asChild>
                                <Button variant="ghost" className="h-8 w-8 p-0">
                                  <MoreHorizontal className="h-4 w-4" />
                                  <span className="sr-only">Buka menu</span>
                                </Button>
                              </DropdownMenuTrigger>
                              <DropdownMenuContent align="end">
                                <DropdownMenuLabel>Aksi</DropdownMenuLabel>
                                <DropdownMenuSeparator />
                                <DropdownMenuItem onClick={() => handleEdit(studio)}>
                                  <Edit className="mr-2 h-4 w-4" />
                                  Edit
                                </DropdownMenuItem>
                                <DropdownMenuItem
                                  className="text-orange-600"
                                  onClick={() => setStudioToDelete(studio)}
                                >
                                  <Settings className="mr-2 h-4 w-4" />
                                  {studio.is_active ? "Nonaktifkan" : "Aktifkan"}
                                </DropdownMenuItem>
                                {!studio.is_active && (
                                  <DropdownMenuItem
                                    className="text-red-600"
                                    onClick={() => setStudioToHardDelete(studio)}
                                  >
                                    <Trash className="mr-2 h-4 w-4" />
                                    Hapus Permanen
                                  </DropdownMenuItem>
                                )}
                              </DropdownMenuContent>
                            </DropdownMenu>
                          </TableCell>
                        </TableRow>
                      ))
                    )}
                  </TableBody>
                </Table>
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      <StudioDialog
        open={isDialogOpen}
        onOpenChange={setIsDialogOpen}
        studio={selectedStudio}
        onStudioSaved={handleStudioSaved}
      />

      <AlertDialog open={!!studioToDelete} onOpenChange={() => setStudioToDelete(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>
              {studioToDelete?.is_active ? "Nonaktifkan Studio" : "Aktifkan Studio"}
            </AlertDialogTitle>
            <AlertDialogDescription>
              {studioToDelete?.is_active
                ? `Apakah Anda yakin ingin menonaktifkan studio "${studioToDelete?.name}"? Studio akan dinonaktifkan dan tidak bisa menerima booking baru.`
                : `Apakah Anda yakin ingin mengaktifkan studio "${studioToDelete?.name}"? Studio akan dapat menerima booking baru.`
              }
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Batal</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => studioToDelete && handleDelete(studioToDelete)}
              className={studioToDelete?.is_active ? "bg-orange-600 hover:bg-orange-700" : "bg-green-600 hover:bg-green-700"}
            >
              {studioToDelete?.is_active ? "Nonaktifkan" : "Aktifkan"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <AlertDialog open={!!studioToHardDelete} onOpenChange={() => setStudioToHardDelete(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Hapus Studio Permanen</AlertDialogTitle>
            <AlertDialogDescription asChild>
              <div className="space-y-2">
                <p className="font-semibold text-red-600">⚠️ PERINGATAN: Aksi ini tidak dapat dibatalkan!</p>
                <p>
                  Apakah Anda yakin ingin menghapus studio "{studioToHardDelete?.name}" secara permanen?
                </p>
                <p className="text-sm text-muted-foreground">
                  Studio dan semua data terkaitnya akan dihapus dari database dan tidak dapat dipulihkan.
                  Pastikan tidak ada fasilitas atau reservasi yang masih terkait dengan studio ini.
                </p>
              </div>
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Batal</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => studioToHardDelete && handleHardDelete(studioToHardDelete)}
              className="bg-red-600 hover:bg-red-700"
            >
              Hapus Permanen
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  )
}