"use client"

import { useState, useEffect } from "react"
import {
  Plus,
  Search,
  MoreHorizontal,
  Edit,
  Trash,
  Building as BuildingIcon,
  Users,
  Clock,
  Eye,
  EyeOff,
  Filter,
  Grid3X3,
  List,
  AlertCircle,
  Star,
  Crown,
  Gem,
  Zap,
  Sparkles,
  Camera,
  RefreshCw,
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
import { FacilityDialog } from "@/app/(dashboard)/admin/_components/facility-dialog"
import { usePaginatedFacilities, useDeleteFacility, useToggleFacilityAvailability } from "@/hooks/use-facilities"
import { useStudios } from "@/hooks/use-studios"
import { type Facility } from "@/actions/facilities"
import { PaginationControls } from "@/components/pagination-controls"
import { DEFAULT_PAGE_SIZE } from "@/lib/constants/pagination"
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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"

// Icon components mapping
import {
  Video,
  Lightbulb,
  Palette,
  Music,
  Mic,
  MonitorSpeaker,
  Sofa,
  Car,
  Coffee,
  Wifi,
  AirVent,
  TreePine,
  Waves,
  Sun,
  Moon,
  Target,
  Award,
  Gift,
  Flame,
  Diamond,
  Building,
} from "lucide-react"



const facilityTypeColors = {
  basic: 'text-blue-600 bg-blue-50 border-blue-200',
  premium: 'text-purple-600 bg-purple-50 border-purple-200',
  luxury: 'text-amber-600 bg-amber-50 border-amber-200',
  custom: 'text-emerald-600 bg-emerald-50 border-emerald-200',
  equipment: 'text-orange-600 bg-orange-50 border-orange-200',
  space: 'text-teal-600 bg-teal-50 border-teal-200',
}

const iconMap = {
  camera: Camera,
  video: Video,
  lightbulb: Lightbulb,
  palette: Palette,
  music: Music,
  mic: Mic,
  'monitor-speaker': MonitorSpeaker,
  sofa: Sofa,
  car: Car,
  coffee: Coffee,
  wifi: Wifi,
  'air-vent': AirVent,
  sparkles: Sparkles,
  building: Building,
  'tree-pine': TreePine,
  waves: Waves,
  sun: Sun,
  moon: Moon,
  crown: Crown,
  zap: Zap,
  target: Target,
  award: Award,
  gift: Gift,
  gem: Gem,
  flame: Flame,
  diamond: Diamond,
}

const getFacilityIcon = (iconName?: string | null) => {
  if (!iconName) return Camera
  return iconMap[iconName as keyof typeof iconMap] || Camera
}

const getFacilityTypeInfo = (facility: Facility) => {
  // Determine facility type based on capacity and rate
  if (facility.capacity >= 20) return 'space'
  if (facility.hourly_rate && facility.hourly_rate >= 300000) return 'luxury'
  if (facility.hourly_rate && facility.hourly_rate >= 150000) return 'premium'
  if (facility.hourly_rate && facility.hourly_rate > 0) return 'basic'
  return 'equipment'
}

export default function FacilitiesPage() {
  const [searchTerm, setSearchTerm] = useState('')
  const [statusFilter, setStatusFilter] = useState<'available' | 'unavailable' | 'all'>('all')
  const [selectedFacility, setSelectedFacility] = useState<Facility | null>(null)
  const [isFacilityDialogOpen, setIsFacilityDialogOpen] = useState(false)
  const [currentPage, setCurrentPage] = useState(1)
  const [pageSize, setPageSize] = useState(DEFAULT_PAGE_SIZE)
  const [selectedStudioId, setSelectedStudioId] = useState<string>('')
  const [facilityToDelete, setFacilityToDelete] = useState<Facility | null>(null)
  const [isDeleteAlertOpen, setIsDeleteAlertOpen] = useState(false)
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid')

  // Studio selection for multi-studio admin
  const { data: studios = [], isLoading: studiosLoading } = useStudios()

  // Auto-select first studio
  useEffect(() => {
    if (studios.length > 0 && !selectedStudioId) {
      setSelectedStudioId(studios[0].id)
    }
  }, [studios, selectedStudioId])

  // Reset pagination when filters change
  useEffect(() => {
    setCurrentPage(1)
  }, [searchTerm, statusFilter, selectedStudioId])

  // TanStack Query hooks with pagination
  const {
    data: paginatedResult,
    isLoading: loading,
    error,
    refetch
  } = usePaginatedFacilities(selectedStudioId, {
    page: currentPage,
    pageSize,
    search: searchTerm,
    status: statusFilter,
  })

  const facilities = paginatedResult?.data || []
  const pagination = paginatedResult?.pagination
  const deleteFacilityMutation = useDeleteFacility()
  const toggleAvailabilityMutation = useToggleFacilityAvailability()

  // Show loading if studios not loaded yet
  if (studiosLoading || (studios.length > 0 && !selectedStudioId)) {
    return (
      <div className="p-8">
        <Card>
          <CardContent className="pt-6">
            <div className="text-center text-muted-foreground">
              <BuildingIcon className="h-8 w-8 mx-auto mb-2 animate-spin" />
              Loading studio data...
            </div>
          </CardContent>
        </Card>
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

  const handleCreateFacility = () => {
    setSelectedFacility(null)
    setIsFacilityDialogOpen(true)
  }

  const handleEditFacility = (facility: Facility) => {
    setSelectedFacility(facility)
    setIsFacilityDialogOpen(true)
  }

  const handleDeleteFacility = (facility: Facility) => {
    setFacilityToDelete(facility)
    setIsDeleteAlertOpen(true)
  }

  const confirmDeleteFacility = () => {
    if (facilityToDelete) {
      deleteFacilityMutation.mutate(facilityToDelete.id, {
        onSuccess: () => {
          setIsDeleteAlertOpen(false)
          setFacilityToDelete(null)
          refetch()
        }
      })
    }
  }

  const handleToggleAvailability = (facility: Facility) => {
    toggleAvailabilityMutation.mutate({
      facilityId: facility.id,
      isAvailable: !facility.is_available
    }, {
      onSuccess: () => {
        refetch()
      }
    })
  }

  const handleFacilitySaved = () => {
    refetch()
  }

  // Filter facilities based on search and status
  const filteredFacilities = facilities.filter(facility => {
    const matchesSearch = !searchTerm ||
      facility.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      facility.description?.toLowerCase().includes(searchTerm.toLowerCase())

    const matchesStatus = statusFilter === 'all' ||
      (statusFilter === 'available' && facility.is_available) ||
      (statusFilter === 'unavailable' && !facility.is_available)

    return matchesSearch && matchesStatus
  })

  const formatCurrency = (amount: number | null) => {
    if (!amount) return '-'
    return new Intl.NumberFormat('id-ID', {
      style: 'currency',
      currency: 'IDR',
      minimumFractionDigits: 0,
    }).format(amount)
  }

  if (error) {
    return (
      <div className="p-8">
        <Card>
          <CardContent className="pt-6">
            <div className="text-center text-muted-foreground">
              Terjadi kesalahan saat memuat data fasilitas
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
          <h1 className="text-2xl font-bold">Facilities Management</h1>
          <p className="text-muted-foreground">
            Kelola fasilitas dan peralatan studio Anda
          </p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" onClick={() => refetch()}>
            <RefreshCw className="h-4 w-4 mr-2" />
            Refresh
          </Button>
          <Button onClick={handleCreateFacility} disabled={!selectedStudioId}>
            <Plus className="h-4 w-4 mr-2" />
            Tambah Fasilitas
          </Button>
        </div>
      </div>

      <div className="space-y-4">
        {/* Studio Selection & Stats */}
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
                        {facilities.length}
                      </div>
                      <div className="text-sm text-muted-foreground">Total Fasilitas</div>
                    </div>
                    <div className="text-center">
                      <div className="text-2xl font-bold text-green-600">
                        {facilities.filter(f => f.is_available).length}
                      </div>
                      <div className="text-sm text-muted-foreground">Tersedia</div>
                    </div>
                    <div className="text-center">
                      <div className="text-2xl font-bold text-purple-600">
                        {facilities.reduce((acc, f) => acc + f.capacity, 0)}
                      </div>
                      <div className="text-sm text-muted-foreground">Total Kapasitas</div>
                    </div>
                    <div className="text-center">
                      <div className="text-2xl font-bold text-amber-600">
                        {facilities.filter(f => f.hourly_rate && f.hourly_rate > 0).length}
                      </div>
                      <div className="text-sm text-muted-foreground">Berbayar</div>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Filters and Controls */}
        {selectedStudioId && (
          <Card>
            <CardContent className="pt-6">
              <div className="flex flex-col md:flex-row gap-4 items-start md:items-center justify-between">
                <div className="flex flex-col md:flex-row gap-4 items-start md:items-center">
                  <div className="relative flex-1 min-w-[250px]">
                    <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
                    <Input
                      placeholder="Cari fasilitas..."
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                      className="pl-10"
                    />
                  </div>

                  <Select value={statusFilter} onValueChange={(value: any) => setStatusFilter(value)}>
                    <SelectTrigger className="w-auto">
                      <Filter className="h-4 w-4 mr-2" />
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">Semua Status</SelectItem>
                      <SelectItem value="available">Tersedia</SelectItem>
                      <SelectItem value="unavailable">Tidak Tersedia</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="flex items-center gap-2">
                  <Button
                    variant={viewMode === 'grid' ? 'default' : 'outline'}
                    size="sm"
                    onClick={() => setViewMode('grid')}
                  >
                    <Grid3X3 className="h-4 w-4" />
                  </Button>
                  <Button
                    variant={viewMode === 'list' ? 'default' : 'outline'}
                    size="sm"
                    onClick={() => setViewMode('list')}
                  >
                    <List className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Facilities Display */}
        {!selectedStudioId ? (
          <Card>
            <CardContent className="pt-6">
              <div className="text-center text-muted-foreground">
                <AlertCircle className="h-8 w-8 mx-auto mb-2" />
                Silakan pilih studio terlebih dahulu untuk melihat fasilitas
              </div>
            </CardContent>
          </Card>
        ) : loading ? (
          <div className="space-y-2">
            {[...Array(3)].map((_, i) => (
              <Skeleton key={i} className="h-40 w-full" />
            ))}
          </div>
        ) : viewMode === 'grid' ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {filteredFacilities.length === 0 ? (
              <div className="col-span-full">
                <Card>
                  <CardContent className="pt-6">
                    <div className="text-center text-muted-foreground">
                      {searchTerm ? "Tidak ada fasilitas yang cocok dengan pencarian" : "Belum ada fasilitas yang terdaftar"}
                    </div>
                  </CardContent>
                </Card>
              </div>
            ) : (
              filteredFacilities.map((facility) => {
                const facilityType = getFacilityTypeInfo(facility)
                const typeColorClass = facilityTypeColors[facilityType as keyof typeof facilityTypeColors]
                const IconComponent = getFacilityIcon(facility.icon)
                const equipmentCount = Object.entries(facility.equipment || {}).filter(([_, value]) => value).length

                return (
                  <Card key={facility.id} className="group hover:shadow-md transition-shadow">
                    <CardHeader className="pb-3">
                      <div className="flex items-start justify-between">
                        <div className="space-y-2">
                          <div className="flex items-center gap-2">
                            <div className={`p-2 rounded-lg ${typeColorClass}`}>
                              <IconComponent className="h-5 w-5" />
                            </div>
                            <div>
                              <CardTitle className="text-lg">{facility.name}</CardTitle>
                              <div className="flex items-center gap-2 mt-1">
                                <Badge variant={facility.is_available ? "default" : "secondary"}>
                                  {facility.is_available ? "Tersedia" : "Tidak Tersedia"}
                                </Badge>
                              </div>
                            </div>
                          </div>
                        </div>
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant="ghost" className="h-8 w-8 p-0 opacity-0 group-hover:opacity-100 transition-opacity">
                              <MoreHorizontal className="h-4 w-4" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
                            <DropdownMenuLabel>Aksi</DropdownMenuLabel>
                            <DropdownMenuSeparator />
                            <DropdownMenuItem onClick={() => handleEditFacility(facility)}>
                              <Edit className="mr-2 h-4 w-4" />
                              Edit
                            </DropdownMenuItem>
                            <DropdownMenuItem
                              onClick={() => handleToggleAvailability(facility)}
                              className="text-orange-600"
                            >
                              {facility.is_available ? <EyeOff className="mr-2 h-4 w-4" /> : <Eye className="mr-2 h-4 w-4" />}
                              {facility.is_available ? "Nonaktifkan" : "Aktifkan"}
                            </DropdownMenuItem>
                            <DropdownMenuItem
                              className="text-red-600"
                              onClick={() => handleDeleteFacility(facility)}
                            >
                              <Trash className="mr-2 h-4 w-4" />
                              Hapus
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </div>
                    </CardHeader>
                    <CardContent>
                      {facility.description && (
                        <p className="text-sm text-muted-foreground mb-3 line-clamp-2">
                          {facility.description}
                        </p>
                      )}

                      <div className="space-y-3">
                        <div className="flex items-center justify-between">
                          <div className="text-2xl font-bold text-green-600">
                            {formatCurrency(facility.hourly_rate)}
                          </div>
                          <div className="text-sm text-muted-foreground">
                            {facility.capacity} orang
                          </div>
                        </div>

                        <div className="grid grid-cols-2 gap-4 text-sm">
                          <div className="flex items-center space-x-1">
                            <IconComponent className="h-4 w-4 text-muted-foreground" />
                            <span>{facility.icon?.replace('-', ' ') || 'Facility'}</span>
                          </div>
                          {equipmentCount > 0 && (
                            <div className="flex items-center space-x-1">
                              <Zap className="h-4 w-4 text-muted-foreground" />
                              <span>{equipmentCount} peralatan</span>
                            </div>
                          )}
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                )
              })
            )}
          </div>
        ) : (
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <BuildingIcon className="h-5 w-5" />
                Daftar Fasilitas
              </CardTitle>
              <CardDescription>
                Kelola fasilitas studio yang terdaftar dalam sistem
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="rounded-md border">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Fasilitas</TableHead>
                      <TableHead>Icon</TableHead>
                      <TableHead>Kapasitas</TableHead>
                      <TableHead>Harga</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead className="w-[100px]">Aksi</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredFacilities.length === 0 ? (
                      <TableRow>
                        <TableCell colSpan={6} className="text-center h-24 text-muted-foreground">
                          {searchTerm ? "Tidak ada fasilitas yang cocok dengan pencarian" : "Belum ada fasilitas yang terdaftar"}
                        </TableCell>
                      </TableRow>
                    ) : (
                      filteredFacilities.map((facility) => {
                        const facilityType = getFacilityTypeInfo(facility)
                        const IconComponent = getFacilityIcon(facility.icon)

                        return (
                          <TableRow key={facility.id}>
                            <TableCell>
                              <div className="flex items-center space-x-3">
                                <div className={`p-2 rounded-lg ${facilityTypeColors[facilityType as keyof typeof facilityTypeColors]}`}>
                                  <IconComponent className="h-4 w-4" />
                                </div>
                                <div>
                                  <div className="font-medium">{facility.name}</div>
                                  {facility.description && (
                                    <div className="text-sm text-muted-foreground line-clamp-1">
                                      {facility.description}
                                    </div>
                                  )}
                                </div>
                              </div>
                            </TableCell>
                            <TableCell>
                              <IconComponent className="h-5 w-5 text-muted-foreground" />
                            </TableCell>
                            <TableCell>
                              <div className="flex items-center space-x-1">
                                <Users className="h-4 w-4 text-muted-foreground" />
                                <span>{facility.capacity} orang</span>
                              </div>
                            </TableCell>
                            <TableCell>
                              <div className="font-medium">{formatCurrency(facility.hourly_rate)}</div>
                            </TableCell>
                            <TableCell>
                              <Badge variant={facility.is_available ? "default" : "secondary"}>
                                {facility.is_available ? "Tersedia" : "Tidak Tersedia"}
                              </Badge>
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
                                  <DropdownMenuSeparator />
                                  <DropdownMenuItem onClick={() => handleEditFacility(facility)}>
                                    <Edit className="mr-2 h-4 w-4" />
                                    Edit
                                  </DropdownMenuItem>
                                  <DropdownMenuItem
                                    onClick={() => handleToggleAvailability(facility)}
                                    className="text-orange-600"
                                  >
                                    {facility.is_available ? <EyeOff className="mr-2 h-4 w-4" /> : <Eye className="mr-2 h-4 w-4" />}
                                    {facility.is_available ? "Nonaktifkan" : "Aktifkan"}
                                  </DropdownMenuItem>
                                  <DropdownMenuItem
                                    className="text-red-600"
                                    onClick={() => handleDeleteFacility(facility)}
                                  >
                                    <Trash className="mr-2 h-4 w-4" />
                                    Hapus
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
            </CardContent>
          </Card>
        )}

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
      </div>

      <FacilityDialog
        open={isFacilityDialogOpen}
        onOpenChange={setIsFacilityDialogOpen}
        facility={selectedFacility}
        onFacilitySaved={handleFacilitySaved}
        studioId={selectedStudioId}
      />

      {/* Delete Confirmation Alert */}
      <AlertDialog open={isDeleteAlertOpen} onOpenChange={setIsDeleteAlertOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Hapus Fasilitas</AlertDialogTitle>
            <AlertDialogDescription>
              <div className="space-y-2">
                <p className="font-semibold text-red-600">⚠️ PERINGATAN: Aksi ini tidak dapat dibatalkan!</p>
                <p>
                  Apakah Anda yakin ingin menghapus fasilitas "{facilityToDelete?.name}" secara permanen?
                </p>
                <p className="text-sm text-muted-foreground">
                  Fasilitas dan semua data terkaitnya akan dihapus dari database dan tidak dapat dipulihkan.
                </p>
              </div>
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Batal</AlertDialogCancel>
            <AlertDialogAction
              onClick={confirmDeleteFacility}
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