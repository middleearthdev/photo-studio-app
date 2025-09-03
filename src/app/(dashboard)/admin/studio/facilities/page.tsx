"use client"

import { useState, useEffect } from "react"
import {
  Plus,
  Search,
  MoreHorizontal,
  Edit,
  Trash,
  Camera,
  Users,
  DollarSign,
  Settings,
  Eye,
  EyeOff,
  Filter,
  Grid3X3,
  List,
  AlertCircle,
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
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { FacilityDialog } from "@/app/(dashboard)/admin/_components/facility-dialog"
import { useFacilities, useDeleteFacility, useToggleFacilityAvailability } from "@/hooks/use-facilities"
import { useStudios } from "@/hooks/use-studios"
import { type Facility } from "@/actions/facilities"
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

// Import the available icons from the dialog
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
  Sparkles,
  Building,
  TreePine,
  Waves,
  Sun,
  Moon,
  Star,
  Heart,
  Crown,
  Zap,
  Target,
  Award,
  Gift,
  Gem,
  Flame,
  Diamond,
} from "lucide-react"

const iconMap: Record<string, any> = {
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
  star: Star,
  heart: Heart,
  crown: Crown,
  zap: Zap,
  target: Target,
  award: Award,
  gift: Gift,
  gem: Gem,
  flame: Flame,
  diamond: Diamond,
}

export default function FacilitiesPage() {
  const [searchTerm, setSearchTerm] = useState('')
  const [selectedFacility, setSelectedFacility] = useState<Facility | null>(null)
  const [isDialogOpen, setIsDialogOpen] = useState(false)
  const [facilityToDelete, setFacilityToDelete] = useState<Facility | null>(null)
  const [facilityToToggle, setFacilityToToggle] = useState<Facility | null>(null)
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid')
  const [availabilityFilter, setAvailabilityFilter] = useState<'all' | 'available' | 'unavailable'>('all')
  const [selectedStudioId, setSelectedStudioId] = useState<string>('')

  const { data: studios = [], isLoading: studiosLoading } = useStudios()
  const { data: facilities = [], isLoading: loading, error, refetch } = useFacilities(selectedStudioId)
  const deleteFacilityMutation = useDeleteFacility()
  const toggleAvailabilityMutation = useToggleFacilityAvailability()

  // Set default studio
  useEffect(() => {
    if (studios.length > 0 && !selectedStudioId) {
      setSelectedStudioId(studios[0].id)
    }
  }, [studios, selectedStudioId])

  const filteredFacilities = facilities.filter(facility => {
    const matchesSearch = facility.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (facility.description || '').toLowerCase().includes(searchTerm.toLowerCase())

    const matchesAvailability = availabilityFilter === 'all' ||
      (availabilityFilter === 'available' && facility.is_available) ||
      (availabilityFilter === 'unavailable' && !facility.is_available)

    return matchesSearch && matchesAvailability
  })

  const handleEdit = (facility: Facility) => {
    setSelectedFacility(facility)
    setIsDialogOpen(true)
  }

  const handleAdd = () => {
    setSelectedFacility(null)
    setIsDialogOpen(true)
  }

  const handleDelete = async (facility: Facility) => {
    deleteFacilityMutation.mutate(facility.id, {
      onSuccess: () => {
        setFacilityToDelete(null)
      }
    })
  }

  const handleToggleAvailability = async (facility: Facility) => {
    toggleAvailabilityMutation.mutate(facility.id, {
      onSuccess: () => {
        setFacilityToToggle(null)
      }
    })
  }

  const handleFacilitySaved = () => {
    refetch()
  }

  const getIconComponent = (iconName: string | null) => {
    if (!iconName) return Camera
    return iconMap[iconName] || Camera
  }

  const formatCurrency = (amount: number | null) => {
    if (!amount) return 'Gratis'
    return new Intl.NumberFormat('id-ID', {
      style: 'currency',
      currency: 'IDR',
      minimumFractionDigits: 0,
    }).format(amount)
  }

  const getEquipmentBadges = (equipment: Record<string, any> | null) => {
    if (!equipment) return []
    return Object.entries(equipment)
      .filter(([_, value]) => value === true)
      .slice(0, 3)
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
            Kelola fasilitas studio foto Anda
          </p>
        </div>
        <Button onClick={handleAdd} disabled={!selectedStudioId}>
          <Plus className="h-4 w-4 mr-2" />
          Tambah Fasilitas
        </Button>
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
                      <div className="text-2xl font-bold text-orange-600">
                        {facilities.filter(f => !f.is_available).length}
                      </div>
                      <div className="text-sm text-muted-foreground">Tidak Tersedia</div>
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

                  <Select value={availabilityFilter} onValueChange={(value: any) => setAvailabilityFilter(value)}>
                    <SelectTrigger className="w-[180px]">
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
              <Skeleton key={i} className="h-32 w-full" />
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
                const IconComponent = getIconComponent(facility.icon)
                const equipmentBadges = getEquipmentBadges(facility.equipment)

                return (
                  <Card key={facility.id} className="group hover:shadow-md transition-shadow">
                    <CardHeader className="pb-3">
                      <div className="flex items-start justify-between">
                        <div className="flex items-center space-x-2">
                          <div className="p-2 bg-primary/10 rounded-lg">
                            <IconComponent className="h-5 w-5 text-primary" />
                          </div>
                          <div>
                            <CardTitle className="text-lg">{facility.name}</CardTitle>
                            <div className="flex items-center space-x-2 mt-1">
                              <Badge variant={facility.is_available ? "default" : "secondary"}>
                                {facility.is_available ? "Tersedia" : "Tidak Tersedia"}
                              </Badge>
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
                            <DropdownMenuItem onClick={() => handleEdit(facility)}>
                              <Edit className="mr-2 h-4 w-4" />
                              Edit
                            </DropdownMenuItem>
                            <DropdownMenuItem
                              onClick={() => setFacilityToToggle(facility)}
                              className="text-orange-600"
                            >
                              {facility.is_available ? <EyeOff className="mr-2 h-4 w-4" /> : <Eye className="mr-2 h-4 w-4" />}
                              {facility.is_available ? "Nonaktifkan" : "Aktifkan"}
                            </DropdownMenuItem>
                            <DropdownMenuItem
                              className="text-red-600"
                              onClick={() => setFacilityToDelete(facility)}
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

                      <div className="space-y-2">
                        <div className="flex items-center justify-between text-sm">
                          <div className="flex items-center space-x-1">
                            <Users className="h-4 w-4 text-muted-foreground" />
                            <span>Kapasitas: {facility.capacity} orang</span>
                          </div>
                          {facility.hourly_rate && (
                            <div className="flex items-center space-x-1">
                              <DollarSign className="h-4 w-4 text-muted-foreground" />
                              <span className="font-medium">{formatCurrency(facility.hourly_rate)}/jam</span>
                            </div>
                          )}
                        </div>

                        {equipmentBadges.length > 0 && (
                          <div className="flex flex-wrap gap-1">
                            {equipmentBadges.map(([key, _]) => (
                              <Badge key={key} variant="outline" className="text-xs">
                                {key.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase())}
                              </Badge>
                            ))}
                            {Object.entries(facility.equipment || {}).filter(([_, value]) => value === true).length > 3 && (
                              <Badge variant="outline" className="text-xs">
                                +{Object.entries(facility.equipment || {}).filter(([_, value]) => value === true).length - 3} lainnya
                              </Badge>
                            )}
                          </div>
                        )}
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
                <Camera className="h-5 w-5" />
                Daftar Fasilitas
              </CardTitle>
              <CardDescription>
                Kelola fasilitas studio foto yang terdaftar dalam sistem
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="rounded-md border">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Fasilitas</TableHead>
                      <TableHead>Kapasitas</TableHead>
                      <TableHead>Tarif/Jam</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead className="w-[100px]">Aksi</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredFacilities.length === 0 ? (
                      <TableRow>
                        <TableCell colSpan={5} className="text-center h-24 text-muted-foreground">
                          {searchTerm ? "Tidak ada fasilitas yang cocok dengan pencarian" : "Belum ada fasilitas yang terdaftar"}
                        </TableCell>
                      </TableRow>
                    ) : (
                      filteredFacilities.map((facility) => {
                        const IconComponent = getIconComponent(facility.icon)

                        return (
                          <TableRow key={facility.id}>
                            <TableCell>
                              <div className="flex items-center space-x-3">
                                <div className="p-2 bg-primary/10 rounded-lg">
                                  <IconComponent className="h-4 w-4 text-primary" />
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
                              <div className="flex items-center space-x-1">
                                <Users className="h-4 w-4 text-muted-foreground" />
                                <span>{facility.capacity} orang</span>
                              </div>
                            </TableCell>
                            <TableCell>
                              {facility.hourly_rate ? formatCurrency(facility.hourly_rate) : 'Gratis'}
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
                                  <DropdownMenuItem onClick={() => handleEdit(facility)}>
                                    <Edit className="mr-2 h-4 w-4" />
                                    Edit
                                  </DropdownMenuItem>
                                  <DropdownMenuItem
                                    onClick={() => setFacilityToToggle(facility)}
                                    className="text-orange-600"
                                  >
                                    {facility.is_available ? <EyeOff className="mr-2 h-4 w-4" /> : <Eye className="mr-2 h-4 w-4" />}
                                    {facility.is_available ? "Nonaktifkan" : "Aktifkan"}
                                  </DropdownMenuItem>
                                  <DropdownMenuItem
                                    className="text-red-600"
                                    onClick={() => setFacilityToDelete(facility)}
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
      </div>

      {/* Dialogs */}
      <FacilityDialog
        open={isDialogOpen}
        onOpenChange={setIsDialogOpen}
        facility={selectedFacility}
        onFacilitySaved={handleFacilitySaved}
        studioId={selectedStudioId}
      />

      {/* Toggle Availability Dialog */}
      <AlertDialog open={!!facilityToToggle} onOpenChange={() => setFacilityToToggle(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>
              {facilityToToggle?.is_available ? "Nonaktifkan Fasilitas" : "Aktifkan Fasilitas"}
            </AlertDialogTitle>
            <AlertDialogDescription>
              {facilityToToggle?.is_available
                ? `Apakah Anda yakin ingin menonaktifkan fasilitas "${facilityToToggle?.name}"? Fasilitas tidak akan tersedia untuk booking baru.`
                : `Apakah Anda yakin ingin mengaktifkan fasilitas "${facilityToToggle?.name}"? Fasilitas akan tersedia untuk booking baru.`
              }
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Batal</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => facilityToToggle && handleToggleAvailability(facilityToToggle)}
              className={facilityToToggle?.is_available ? "bg-orange-600 hover:bg-orange-700" : "bg-green-600 hover:bg-green-700"}
            >
              {facilityToToggle?.is_available ? "Nonaktifkan" : "Aktifkan"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Delete Dialog */}
      <AlertDialog open={!!facilityToDelete} onOpenChange={() => setFacilityToDelete(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Hapus Fasilitas</AlertDialogTitle>
            <AlertDialogDescription asChild>
              <div className="space-y-2">
                <p className="font-semibold text-red-600">⚠️ PERINGATAN: Aksi ini tidak dapat dibatalkan!</p>
                <p>
                  Apakah Anda yakin ingin menghapus fasilitas "{facilityToDelete?.name}" secara permanen?
                </p>
                <p className="text-sm text-muted-foreground">
                  Fasilitas dan semua data terkaitnya akan dihapus dari database dan tidak dapat dipulihkan.
                  Pastikan tidak ada time slot yang masih terkait dengan fasilitas ini.
                </p>
              </div>
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Batal</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => facilityToDelete && handleDelete(facilityToDelete)}
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