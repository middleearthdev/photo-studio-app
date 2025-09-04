"use client"

import { useState, useEffect } from "react"
import { 
  Plus, 
  Search, 
  MoreHorizontal, 
  Edit, 
  Trash,
  Eye,
  EyeOff,
  Filter,
  Grid3X3,
  List,
  AlertCircle,
  Tag,
  Building2,
  DollarSign,
  Hash,
  Settings,
  Camera,
  Palette,
  Clock,
  Package,
  Sparkles,
  Video,
  Wrench
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
import { usePaginatedAddons, useDeleteAddon, useToggleAddonStatus } from "@/hooks/use-addons"
import { useFacilities } from "@/hooks/use-facilities"
import { useStudios } from "@/hooks/use-studios"
import { type Addon } from "@/actions/addons"
import { ADDON_TYPES } from "@/lib/constants/addon-types"
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
import { AddonDialog } from "@/app/(dashboard)/admin/_components/addon-dialog"
import { PaginationControls } from "@/components/pagination-controls"
import { DEFAULT_PAGE_SIZE } from "@/lib/constants/pagination"

const addonTypeIcons = {
  photography: Camera,
  service: Settings,
  printing: Package,
  storage: Building2,
  makeup: Palette,
  styling: Sparkles,
  wardrobe: Tag,
  time: Clock,
  equipment: Wrench,
  decoration: Sparkles,
  video: Video,
}

const addonTypeColors = {
  photography: 'text-blue-600 bg-blue-50 border-blue-200',
  service: 'text-gray-600 bg-gray-50 border-gray-200',
  printing: 'text-purple-600 bg-purple-50 border-purple-200',
  storage: 'text-indigo-600 bg-indigo-50 border-indigo-200',
  makeup: 'text-pink-600 bg-pink-50 border-pink-200',
  styling: 'text-rose-600 bg-rose-50 border-rose-200',
  wardrobe: 'text-orange-600 bg-orange-50 border-orange-200',
  time: 'text-green-600 bg-green-50 border-green-200',
  equipment: 'text-slate-600 bg-slate-50 border-slate-200',
  decoration: 'text-emerald-600 bg-emerald-50 border-emerald-200',
  video: 'text-red-600 bg-red-50 border-red-200',
}

export default function AddonsPage() {
  const [searchTerm, setSearchTerm] = useState('')
  const [selectedAddon, setSelectedAddon] = useState<Addon | null>(null)
  const [isDialogOpen, setIsDialogOpen] = useState(false)
  const [addonToDelete, setAddonToDelete] = useState<Addon | null>(null)
  const [addonToToggle, setAddonToToggle] = useState<Addon | null>(null)
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid')
  const [statusFilter, setStatusFilter] = useState<'all' | 'active' | 'inactive'>('all')
  const [typeFilter, setTypeFilter] = useState<string>('all')
  const [facilityFilter, setFacilityFilter] = useState<string>('all')
  const [selectedStudioId, setSelectedStudioId] = useState<string>('')
  const [currentPage, setCurrentPage] = useState(1)
  const [pageSize, setPageSize] = useState(DEFAULT_PAGE_SIZE)

  const { data: studios = [], isLoading: studiosLoading } = useStudios()
  
  // Use paginated hook instead of regular hook
  const { 
    data: paginatedResult, 
    isLoading: loading, 
    error, 
    refetch 
  } = usePaginatedAddons(selectedStudioId, {
    page: currentPage,
    pageSize,
    search: searchTerm,
    status: statusFilter,
    type: typeFilter === 'all' ? undefined : typeFilter,
    facilityId: facilityFilter === 'all' ? undefined : facilityFilter,
  })

  const addons = paginatedResult?.data || []
  const pagination = paginatedResult?.pagination
  const { data: facilities = [] } = useFacilities(selectedStudioId)
  const deleteAddonMutation = useDeleteAddon()
  const toggleStatusMutation = useToggleAddonStatus()

  // Set default studio
  useEffect(() => {
    if (studios.length > 0 && !selectedStudioId) {
      setSelectedStudioId(studios[0].id)
    }
  }, [studios, selectedStudioId])

  // Reset pagination when filters change
  useEffect(() => {
    setCurrentPage(1)
  }, [searchTerm, statusFilter, typeFilter, facilityFilter, selectedStudioId])

  const handlePageChange = (page: number) => {
    setCurrentPage(page)
  }

  const handlePageSizeChange = (newPageSize: number) => {
    setPageSize(newPageSize)
    setCurrentPage(1)
  }

  const handleEdit = (addon: Addon) => {
    setSelectedAddon(addon)
    setIsDialogOpen(true)
  }

  const handleAdd = () => {
    setSelectedAddon(null)
    setIsDialogOpen(true)
  }

  const handleDelete = async (addon: Addon) => {
    deleteAddonMutation.mutate(addon.id, {
      onSuccess: () => {
        setAddonToDelete(null)
      }
    })
  }

  const handleToggleStatus = async (addon: Addon) => {
    toggleStatusMutation.mutate(addon.id, {
      onSuccess: () => {
        setAddonToToggle(null)
      }
    })
  }

  const handleAddonSaved = () => {
    refetch()
  }

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('id-ID', {
      style: 'currency',
      currency: 'IDR',
      minimumFractionDigits: 0,
    }).format(amount)
  }

  const getAddonTypeInfo = (type: Addon['type']) => {
    return ADDON_TYPES.find(t => t.value === type) || ADDON_TYPES[0]
  }

  if (error) {
    return (
      <div className="p-8">
        <Card>
          <CardContent className="pt-6">
            <div className="text-center text-muted-foreground">
              Terjadi kesalahan saat memuat data add-ons
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
          <h1 className="text-2xl font-bold">Add-ons Management</h1>
          <p className="text-muted-foreground">
            Kelola add-on dan layanan tambahan untuk paket foto
          </p>
        </div>
        <Button onClick={handleAdd} disabled={!selectedStudioId}>
          <Plus className="h-4 w-4 mr-2" />
          Tambah Add-on
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
                        {pagination?.total || addons.length}
                      </div>
                      <div className="text-sm text-muted-foreground">
                        {pagination ? 'Total Add-ons' : `Page ${currentPage} Results`}
                      </div>
                    </div>
                    <div className="text-center">
                      <div className="text-2xl font-bold text-green-600">
                        {addons.filter(a => a.is_active).length}
                      </div>
                      <div className="text-sm text-muted-foreground">Aktif</div>
                    </div>
                    <div className="text-center">
                      <div className="text-2xl font-bold text-purple-600">
                        {addons.filter(a => a.facility_id).length}
                      </div>
                      <div className="text-sm text-muted-foreground">Facility Specific</div>
                    </div>
                    <div className="text-center">
                      <div className="text-2xl font-bold text-amber-600">
                        {new Set(addons.map(a => a.type)).size}
                      </div>
                      <div className="text-sm text-muted-foreground">Tipe</div>
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
                      placeholder="Cari add-on..."
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                      className="pl-10"
                    />
                  </div>

                  <Select value={statusFilter} onValueChange={(value: any) => setStatusFilter(value)}>
                    <SelectTrigger className="w-[150px]">
                      <Filter className="h-4 w-4 mr-2" />
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">Semua Status</SelectItem>
                      <SelectItem value="active">Aktif</SelectItem>
                      <SelectItem value="inactive">Nonaktif</SelectItem>
                    </SelectContent>
                  </Select>

                  <Select value={typeFilter} onValueChange={setTypeFilter}>
                    <SelectTrigger className="w-[180px]">
                      <Tag className="h-4 w-4 mr-2" />
                      <SelectValue placeholder="Semua Tipe" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">Semua Tipe</SelectItem>
                      {ADDON_TYPES.map((type) => (
                        <SelectItem key={type.value} value={type.value}>
                          {type.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>

                  <Select value={facilityFilter} onValueChange={setFacilityFilter}>
                    <SelectTrigger className="w-[180px]">
                      <Building2 className="h-4 w-4 mr-2" />
                      <SelectValue placeholder="Semua Fasilitas" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">Semua Fasilitas</SelectItem>
                      <SelectItem value="general">General/Umum</SelectItem>
                      {facilities.map((facility) => (
                        <SelectItem key={facility.id} value={facility.id}>
                          {facility.name}
                        </SelectItem>
                      ))}
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

        {/* Add-ons Display */}
        {!selectedStudioId ? (
          <Card>
            <CardContent className="pt-6">
              <div className="text-center text-muted-foreground">
                <AlertCircle className="h-8 w-8 mx-auto mb-2" />
                Silakan pilih studio terlebih dahulu untuk melihat add-ons
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
            {addons.length === 0 ? (
              <div className="col-span-full">
                <Card>
                  <CardContent className="pt-6">
                    <div className="text-center text-muted-foreground">
                      {searchTerm ? "Tidak ada add-on yang cocok dengan pencarian" : "Belum ada add-on yang terdaftar"}
                    </div>
                  </CardContent>
                </Card>
              </div>
            ) : (
              addons.map((addon) => {
                const typeInfo = getAddonTypeInfo(addon.type)
                const TypeIcon = addonTypeIcons[addon.type]
                const typeColorClass = addonTypeColors[addon.type]
                
                return (
                  <Card key={addon.id} className="group hover:shadow-md transition-shadow">
                    <CardHeader className="pb-3">
                      <div className="flex items-start justify-between">
                        <div className="space-y-2">
                          <div className="flex items-center gap-2">
                            <div className={`p-2 rounded-lg ${typeColorClass}`}>
                              <TypeIcon className="h-5 w-5" />
                            </div>
                            <div>
                              <CardTitle className="text-lg">{addon.name}</CardTitle>
                              <div className="flex items-center gap-2 mt-1">
                                <Badge variant={addon.is_active ? "default" : "secondary"}>
                                  {addon.is_active ? "Aktif" : "Nonaktif"}
                                </Badge>
                                <Badge variant="outline" className={typeColorClass}>
                                  {typeInfo.label}
                                </Badge>
                              </div>
                            </div>
                          </div>
                          
                          {addon.facility && (
                            <Badge variant="outline" className="w-fit">
                              <Building2 className="h-3 w-3 mr-1" />
                              {addon.facility.name}
                            </Badge>
                          )}
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
                            <DropdownMenuItem onClick={() => handleEdit(addon)}>
                              <Edit className="mr-2 h-4 w-4" />
                              Edit
                            </DropdownMenuItem>
                            <DropdownMenuItem 
                              onClick={() => setAddonToToggle(addon)}
                              className="text-orange-600"
                            >
                              {addon.is_active ? <EyeOff className="mr-2 h-4 w-4" /> : <Eye className="mr-2 h-4 w-4" />}
                              {addon.is_active ? "Nonaktifkan" : "Aktifkan"}
                            </DropdownMenuItem>
                            <DropdownMenuItem 
                              className="text-red-600"
                              onClick={() => setAddonToDelete(addon)}
                            >
                              <Trash className="mr-2 h-4 w-4" />
                              Hapus
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </div>
                    </CardHeader>
                    
                    <CardContent>
                      {addon.description && (
                        <p className="text-sm text-muted-foreground mb-3 line-clamp-2">
                          {addon.description}
                        </p>
                      )}
                      
                      <div className="space-y-3">
                        <div className="flex items-center justify-between">
                          <div className="text-2xl font-bold text-green-600">
                            {formatCurrency(addon.price)}
                          </div>
                          <div className="flex items-center space-x-1 text-sm text-muted-foreground">
                            <Hash className="h-4 w-4" />
                            <span>Max: {addon.max_quantity}</span>
                          </div>
                        </div>
                        
                        {addon.is_conditional && (
                          <Badge variant="outline" className="border-amber-300 text-amber-600">
                            <AlertCircle className="h-3 w-3 mr-1" />
                            Conditional
                          </Badge>
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
                <Package className="h-5 w-5" />
                Daftar Add-ons
              </CardTitle>
              <CardDescription>
                Kelola add-on dan layanan tambahan yang terdaftar dalam sistem
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="rounded-md border">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Add-on</TableHead>
                      <TableHead>Tipe</TableHead>
                      <TableHead>Fasilitas</TableHead>
                      <TableHead>Harga</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead className="w-[100px]">Aksi</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {addons.length === 0 ? (
                      <TableRow>
                        <TableCell colSpan={6} className="text-center h-24 text-muted-foreground">
                          {searchTerm ? "Tidak ada add-on yang cocok dengan pencarian" : "Belum ada add-on yang terdaftar"}
                        </TableCell>
                      </TableRow>
                    ) : (
                      addons.map((addon) => {
                        const typeInfo = getAddonTypeInfo(addon.type)
                        const TypeIcon = addonTypeIcons[addon.type]
                        const typeColorClass = addonTypeColors[addon.type]
                        
                        return (
                          <TableRow key={addon.id}>
                            <TableCell>
                              <div className="flex items-center space-x-3">
                                <div className={`p-2 rounded-lg ${typeColorClass}`}>
                                  <TypeIcon className="h-4 w-4" />
                                </div>
                                <div>
                                  <div className="font-medium flex items-center gap-2">
                                    {addon.name}
                                    {addon.is_conditional && (
                                      <Badge variant="outline" className="border-amber-300 text-amber-600 text-xs">
                                        <AlertCircle className="h-3 w-3 mr-1" />
                                        Conditional
                                      </Badge>
                                    )}
                                  </div>
                                  {addon.description && (
                                    <div className="text-sm text-muted-foreground line-clamp-1">
                                      {addon.description}
                                    </div>
                                  )}
                                </div>
                              </div>
                            </TableCell>
                            <TableCell>
                              <Badge variant="outline" className={typeColorClass}>
                                {typeInfo.label}
                              </Badge>
                            </TableCell>
                            <TableCell>
                              {addon.facility ? (
                                <Badge variant="outline">
                                  <Building2 className="h-3 w-3 mr-1" />
                                  {addon.facility.name}
                                </Badge>
                              ) : (
                                <span className="text-muted-foreground text-sm">General</span>
                              )}
                            </TableCell>
                            <TableCell>
                              <div>
                                <div className="font-medium">{formatCurrency(addon.price)}</div>
                                <div className="text-xs text-muted-foreground">
                                  Max: {addon.max_quantity}
                                </div>
                              </div>
                            </TableCell>
                            <TableCell>
                              <Badge variant={addon.is_active ? "default" : "secondary"}>
                                {addon.is_active ? "Aktif" : "Nonaktif"}
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
                                  <DropdownMenuItem onClick={() => handleEdit(addon)}>
                                    <Edit className="mr-2 h-4 w-4" />
                                    Edit
                                  </DropdownMenuItem>
                                  <DropdownMenuItem 
                                    onClick={() => setAddonToToggle(addon)}
                                    className="text-orange-600"
                                  >
                                    {addon.is_active ? <EyeOff className="mr-2 h-4 w-4" /> : <Eye className="mr-2 h-4 w-4" />}
                                    {addon.is_active ? "Nonaktifkan" : "Aktifkan"}
                                  </DropdownMenuItem>
                                  <DropdownMenuItem 
                                    className="text-red-600"
                                    onClick={() => setAddonToDelete(addon)}
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

      {/* Dialog */}
      <AddonDialog
        open={isDialogOpen}
        onOpenChange={setIsDialogOpen}
        addonData={selectedAddon}
        onAddonSaved={handleAddonSaved}
        studioId={selectedStudioId}
      />

      {/* Toggle Status Dialog */}
      <AlertDialog open={!!addonToToggle} onOpenChange={() => setAddonToToggle(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>
              {addonToToggle?.is_active ? "Nonaktifkan Add-on" : "Aktifkan Add-on"}
            </AlertDialogTitle>
            <AlertDialogDescription>
              {addonToToggle?.is_active 
                ? `Apakah Anda yakin ingin menonaktifkan add-on "${addonToToggle?.name}"? Add-on tidak akan tersedia untuk customer.`
                : `Apakah Anda yakin ingin mengaktifkan add-on "${addonToToggle?.name}"? Add-on akan tersedia untuk customer.`
              }
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Batal</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => addonToToggle && handleToggleStatus(addonToToggle)}
              className={addonToToggle?.is_active ? "bg-orange-600 hover:bg-orange-700" : "bg-green-600 hover:bg-green-700"}
            >
              {addonToToggle?.is_active ? "Nonaktifkan" : "Aktifkan"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Delete Dialog */}
      <AlertDialog open={!!addonToDelete} onOpenChange={() => setAddonToDelete(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Hapus Add-on</AlertDialogTitle>
            <AlertDialogDescription>
              <div className="space-y-2">
                <p className="font-semibold text-red-600">⚠️ PERINGATAN: Aksi ini tidak dapat dibatalkan!</p>
                <p>
                  Apakah Anda yakin ingin menghapus add-on "{addonToDelete?.name}" secara permanen? 
                </p>
                <p className="text-sm text-muted-foreground">
                  Add-on dan semua data terkaitnya akan dihapus dari database dan tidak dapat dipulihkan. 
                  Pastikan tidak ada reservasi yang masih menggunakan add-on ini.
                </p>
              </div>
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Batal</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => addonToDelete && handleDelete(addonToDelete)}
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