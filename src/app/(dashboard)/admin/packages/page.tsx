"use client"

import { useState, useEffect } from "react"
import { 
  Plus, 
  Search, 
  MoreHorizontal, 
  Edit, 
  Trash, 
  Package as PackageIcon,
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
  Tag,
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
import { PackageDialog } from "@/app/(dashboard)/admin/_components/package-dialog"
import { PackageCategoriesManagement } from "@/app/(dashboard)/admin/_components/package-categories-management"
import { usePackages, useDeletePackage, useTogglePackageStatus, usePackageCategories } from "@/hooks/use-packages"
import { useStudios } from "@/hooks/use-studios"
import { type Package } from "@/actions/packages"
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

const packageTypeIcons = {
  basic: PackageIcon,
  premium: Star,
  luxury: Crown,
  custom: Gem,
}

const packageTypeColors = {
  basic: 'text-blue-600 bg-blue-50 border-blue-200',
  premium: 'text-purple-600 bg-purple-50 border-purple-200',
  luxury: 'text-amber-600 bg-amber-50 border-amber-200',
  custom: 'text-emerald-600 bg-emerald-50 border-emerald-200',
}

export default function PackagesPage() {
  const [searchTerm, setSearchTerm] = useState('')
  const [selectedPackage, setSelectedPackage] = useState<Package | null>(null)
  const [isDialogOpen, setIsDialogOpen] = useState(false)
  const [packageToDelete, setPackageToDelete] = useState<Package | null>(null)
  const [packageToToggle, setPackageToToggle] = useState<Package | null>(null)
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid')
  const [statusFilter, setStatusFilter] = useState<'all' | 'active' | 'inactive'>('all')
  const [categoryFilter, setCategoryFilter] = useState<string>('all')
  const [selectedStudioId, setSelectedStudioId] = useState<string>('')
  const [isCategoriesManagementOpen, setIsCategoriesManagementOpen] = useState(false)

  const { data: studios = [], isLoading: studiosLoading } = useStudios()
  const { data: packages = [], isLoading: loading, error, refetch } = usePackages(selectedStudioId)
  const { data: categories = [] } = usePackageCategories(selectedStudioId)
  const deletePackageMutation = useDeletePackage()
  const toggleStatusMutation = useTogglePackageStatus()

  // Set default studio
  useEffect(() => {
    if (studios.length > 0 && !selectedStudioId) {
      setSelectedStudioId(studios[0].id)
    }
  }, [studios, selectedStudioId])

  const filteredPackages = packages.filter(pkg => {
    const matchesSearch = pkg.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         (pkg.description || '').toLowerCase().includes(searchTerm.toLowerCase())
    
    const matchesStatus = statusFilter === 'all' ||
                         (statusFilter === 'active' && pkg.is_active) ||
                         (statusFilter === 'inactive' && !pkg.is_active)
    
    const matchesCategory = categoryFilter === 'all' || 
                           categoryFilter === 'uncategorized' && !pkg.category_id ||
                           pkg.category_id === categoryFilter
    
    return matchesSearch && matchesStatus && matchesCategory
  })

  const handleEdit = (pkg: Package) => {
    setSelectedPackage(pkg)
    setIsDialogOpen(true)
  }

  const handleAdd = () => {
    setSelectedPackage(null)
    setIsDialogOpen(true)
  }

  const handleDelete = async (pkg: Package) => {
    deletePackageMutation.mutate(pkg.id, {
      onSuccess: () => {
        setPackageToDelete(null)
      }
    })
  }

  const handleToggleStatus = async (pkg: Package) => {
    toggleStatusMutation.mutate(pkg.id, {
      onSuccess: () => {
        setPackageToToggle(null)
      }
    })
  }

  const handlePackageSaved = () => {
    refetch()
  }

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('id-ID', {
      style: 'currency',
      currency: 'IDR',
      minimumFractionDigits: 0,
    }).format(amount)
  }

  const formatDuration = (minutes: number) => {
    const hours = Math.floor(minutes / 60)
    const mins = minutes % 60
    if (hours > 0 && mins > 0) {
      return `${hours}j ${mins}m`
    } else if (hours > 0) {
      return `${hours} jam`
    } else {
      return `${mins} menit`
    }
  }

  const getPackageTypeInfo = (pkg: Package) => {
    // Determine package type based on price ranges
    if (pkg.price >= 1000000) return 'luxury'
    if (pkg.price >= 500000) return 'premium'
    if (pkg.price >= 100000) return 'basic'
    return 'custom'
  }

  const getIncludesBadges = (includes: string[] | null) => {
    if (!includes || includes.length === 0) return []
    return includes.slice(0, 3)
  }

  if (error) {
    return (
      <div className="p-8">
        <Card>
          <CardContent className="pt-6">
            <div className="text-center text-muted-foreground">
              Terjadi kesalahan saat memuat data paket
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
          <h1 className="text-2xl font-bold">Packages Management</h1>
          <p className="text-muted-foreground">
            Kelola paket foto dan layanan studio Anda
          </p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" onClick={() => setIsCategoriesManagementOpen(true)}>
            <Tag className="h-4 w-4 mr-2" />
            Kelola Kategori
          </Button>
          <Button onClick={handleAdd} disabled={!selectedStudioId}>
            <Plus className="h-4 w-4 mr-2" />
            Tambah Paket
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
                        {packages.length}
                      </div>
                      <div className="text-sm text-muted-foreground">Total Paket</div>
                    </div>
                    <div className="text-center">
                      <div className="text-2xl font-bold text-green-600">
                        {packages.filter(p => p.is_active).length}
                      </div>
                      <div className="text-sm text-muted-foreground">Aktif</div>
                    </div>
                    <div className="text-center">
                      <div className="text-2xl font-bold text-amber-600">
                        {packages.filter(p => p.is_popular).length}
                      </div>
                      <div className="text-sm text-muted-foreground">Popular</div>
                    </div>
                    <div className="text-center">
                      <div className="text-2xl font-bold text-purple-600">
                        {categories.length}
                      </div>
                      <div className="text-sm text-muted-foreground">Kategori</div>
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
                      placeholder="Cari paket..."
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

                  <Select value={categoryFilter} onValueChange={setCategoryFilter}>
                    <SelectTrigger className="w-[180px]">
                      <Tag className="h-4 w-4 mr-2" />
                      <SelectValue placeholder="Semua Kategori" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">Semua Kategori</SelectItem>
                      <SelectItem value="uncategorized">Tanpa Kategori</SelectItem>
                      {categories.map((category) => (
                        <SelectItem key={category.id} value={category.id}>
                          {category.name}
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

        {/* Packages Display */}
        {!selectedStudioId ? (
          <Card>
            <CardContent className="pt-6">
              <div className="text-center text-muted-foreground">
                <AlertCircle className="h-8 w-8 mx-auto mb-2" />
                Silakan pilih studio terlebih dahulu untuk melihat paket
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
            {filteredPackages.length === 0 ? (
              <div className="col-span-full">
                <Card>
                  <CardContent className="pt-6">
                    <div className="text-center text-muted-foreground">
                      {searchTerm ? "Tidak ada paket yang cocok dengan pencarian" : "Belum ada paket yang terdaftar"}
                    </div>
                  </CardContent>
                </Card>
              </div>
            ) : (
              filteredPackages.map((pkg) => {
                const packageType = getPackageTypeInfo(pkg)
                const TypeIcon = packageTypeIcons[packageType as keyof typeof packageTypeIcons]
                const typeColorClass = packageTypeColors[packageType as keyof typeof packageTypeColors]
                const includesBadges = getIncludesBadges(pkg.includes)
                
                return (
                  <Card key={pkg.id} className="group hover:shadow-md transition-shadow">
                    <CardHeader className="pb-3">
                      <div className="flex items-start justify-between">
                        <div className="space-y-2">
                          <div className="flex items-center gap-2">
                            <div className={`p-2 rounded-lg ${typeColorClass}`}>
                              <TypeIcon className="h-5 w-5" />
                            </div>
                            <div>
                              <CardTitle className="text-lg">{pkg.name}</CardTitle>
                              <div className="flex items-center gap-2 mt-1">
                                <Badge variant={pkg.is_active ? "default" : "secondary"}>
                                  {pkg.is_active ? "Aktif" : "Nonaktif"}
                                </Badge>
                                {pkg.is_popular && (
                                  <Badge variant="outline" className="border-amber-300 text-amber-600">
                                    <Star className="h-3 w-3 mr-1" />
                                    Popular
                                  </Badge>
                                )}
                              </div>
                            </div>
                          </div>
                          {pkg.category && (
                            <Badge variant="outline" className="w-fit">
                              <Tag className="h-3 w-3 mr-1" />
                              {pkg.category.name}
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
                            <DropdownMenuItem onClick={() => handleEdit(pkg)}>
                              <Edit className="mr-2 h-4 w-4" />
                              Edit
                            </DropdownMenuItem>
                            <DropdownMenuItem 
                              onClick={() => setPackageToToggle(pkg)}
                              className="text-orange-600"
                            >
                              {pkg.is_active ? <EyeOff className="mr-2 h-4 w-4" /> : <Eye className="mr-2 h-4 w-4" />}
                              {pkg.is_active ? "Nonaktifkan" : "Aktifkan"}
                            </DropdownMenuItem>
                            <DropdownMenuItem 
                              className="text-red-600"
                              onClick={() => setPackageToDelete(pkg)}
                            >
                              <Trash className="mr-2 h-4 w-4" />
                              Hapus
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </div>
                    </CardHeader>
                    <CardContent>
                      {pkg.description && (
                        <p className="text-sm text-muted-foreground mb-3 line-clamp-2">
                          {pkg.description}
                        </p>
                      )}
                      
                      <div className="space-y-3">
                        <div className="flex items-center justify-between">
                          <div className="text-2xl font-bold text-green-600">
                            {formatCurrency(pkg.price)}
                          </div>
                          <div className="text-sm text-muted-foreground">
                            DP {pkg.dp_percentage}% = {formatCurrency((pkg.price * pkg.dp_percentage) / 100)}
                          </div>
                        </div>
                        
                        <div className="grid grid-cols-2 gap-4 text-sm">
                          <div className="flex items-center space-x-1">
                            <Clock className="h-4 w-4 text-muted-foreground" />
                            <span>{formatDuration(pkg.duration_minutes)}</span>
                          </div>
                          {pkg.max_photos && (
                            <div className="flex items-center space-x-1">
                              <Users className="h-4 w-4 text-muted-foreground" />
                              <span>{pkg.max_photos} foto</span>
                            </div>
                          )}
                        </div>
                        
                        {includesBadges.length > 0 && (
                          <div className="flex flex-wrap gap-1">
                            {includesBadges.map((include, index) => (
                              <Badge key={index} variant="outline" className="text-xs">
                                {include.substring(0, 20)}...
                              </Badge>
                            ))}
                            {pkg.includes && pkg.includes.length > 3 && (
                              <Badge variant="outline" className="text-xs">
                                +{pkg.includes.length - 3} lainnya
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
                <PackageIcon className="h-5 w-5" />
                Daftar Paket
              </CardTitle>
              <CardDescription>
                Kelola paket foto yang terdaftar dalam sistem
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="rounded-md border">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Paket</TableHead>
                      <TableHead>Kategori</TableHead>
                      <TableHead>Harga</TableHead>
                      <TableHead>Durasi</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead className="w-[100px]">Aksi</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredPackages.length === 0 ? (
                      <TableRow>
                        <TableCell colSpan={6} className="text-center h-24 text-muted-foreground">
                          {searchTerm ? "Tidak ada paket yang cocok dengan pencarian" : "Belum ada paket yang terdaftar"}
                        </TableCell>
                      </TableRow>
                    ) : (
                      filteredPackages.map((pkg) => {
                        const packageType = getPackageTypeInfo(pkg)
                        const TypeIcon = packageTypeIcons[packageType as keyof typeof packageTypeIcons]
                        
                        return (
                          <TableRow key={pkg.id}>
                            <TableCell>
                              <div className="flex items-center space-x-3">
                                <div className="p-2 bg-primary/10 rounded-lg">
                                  <TypeIcon className="h-4 w-4 text-primary" />
                                </div>
                                <div>
                                  <div className="font-medium flex items-center gap-2">
                                    {pkg.name}
                                    {pkg.is_popular && (
                                      <Badge variant="outline" className="border-amber-300 text-amber-600">
                                        <Star className="h-3 w-3 mr-1" />
                                        Popular
                                      </Badge>
                                    )}
                                  </div>
                                  {pkg.description && (
                                    <div className="text-sm text-muted-foreground line-clamp-1">
                                      {pkg.description}
                                    </div>
                                  )}
                                </div>
                              </div>
                            </TableCell>
                            <TableCell>
                              {pkg.category ? (
                                <Badge variant="outline">
                                  <Tag className="h-3 w-3 mr-1" />
                                  {pkg.category.name}
                                </Badge>
                              ) : (
                                <span className="text-muted-foreground text-sm">-</span>
                              )}
                            </TableCell>
                            <TableCell>
                              <div>
                                <div className="font-medium">{formatCurrency(pkg.price)}</div>
                                <div className="text-xs text-muted-foreground">
                                  DP {pkg.dp_percentage}%
                                </div>
                              </div>
                            </TableCell>
                            <TableCell>
                              <div className="flex items-center space-x-1">
                                <Clock className="h-4 w-4 text-muted-foreground" />
                                <span>{formatDuration(pkg.duration_minutes)}</span>
                              </div>
                            </TableCell>
                            <TableCell>
                              <Badge variant={pkg.is_active ? "default" : "secondary"}>
                                {pkg.is_active ? "Aktif" : "Nonaktif"}
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
                                  <DropdownMenuItem onClick={() => handleEdit(pkg)}>
                                    <Edit className="mr-2 h-4 w-4" />
                                    Edit
                                  </DropdownMenuItem>
                                  <DropdownMenuItem 
                                    onClick={() => setPackageToToggle(pkg)}
                                    className="text-orange-600"
                                  >
                                    {pkg.is_active ? <EyeOff className="mr-2 h-4 w-4" /> : <Eye className="mr-2 h-4 w-4" />}
                                    {pkg.is_active ? "Nonaktifkan" : "Aktifkan"}
                                  </DropdownMenuItem>
                                  <DropdownMenuItem 
                                    className="text-red-600"
                                    onClick={() => setPackageToDelete(pkg)}
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
      <PackageDialog
        open={isDialogOpen}
        onOpenChange={setIsDialogOpen}
        packageData={selectedPackage}
        onPackageSaved={handlePackageSaved}
        studioId={selectedStudioId}
      />

      {/* Categories Management */}
      <PackageCategoriesManagement
        open={isCategoriesManagementOpen}
        onOpenChange={setIsCategoriesManagementOpen}
        studioId={selectedStudioId}
      />

      {/* Toggle Status Dialog */}
      <AlertDialog open={!!packageToToggle} onOpenChange={() => setPackageToToggle(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>
              {packageToToggle?.is_active ? "Nonaktifkan Paket" : "Aktifkan Paket"}
            </AlertDialogTitle>
            <AlertDialogDescription>
              {packageToToggle?.is_active 
                ? `Apakah Anda yakin ingin menonaktifkan paket "${packageToToggle?.name}"? Paket tidak akan tersedia untuk customer.`
                : `Apakah Anda yakin ingin mengaktifkan paket "${packageToToggle?.name}"? Paket akan tersedia untuk customer.`
              }
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Batal</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => packageToToggle && handleToggleStatus(packageToToggle)}
              className={packageToToggle?.is_active ? "bg-orange-600 hover:bg-orange-700" : "bg-green-600 hover:bg-green-700"}
            >
              {packageToToggle?.is_active ? "Nonaktifkan" : "Aktifkan"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Delete Dialog */}
      <AlertDialog open={!!packageToDelete} onOpenChange={() => setPackageToDelete(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Hapus Paket</AlertDialogTitle>
            <AlertDialogDescription>
              <div className="space-y-2">
                <p className="font-semibold text-red-600">⚠️ PERINGATAN: Aksi ini tidak dapat dibatalkan!</p>
                <p>
                  Apakah Anda yakin ingin menghapus paket "{packageToDelete?.name}" secara permanen? 
                </p>
                <p className="text-sm text-muted-foreground">
                  Paket dan semua data terkaitnya akan dihapus dari database dan tidak dapat dipulihkan. 
                  Pastikan tidak ada reservasi yang masih menggunakan paket ini.
                </p>
              </div>
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Batal</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => packageToDelete && handleDelete(packageToDelete)}
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