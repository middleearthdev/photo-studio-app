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
  Star,
  StarOff,
  Image as ImageIcon,
  Palette,
  Camera,
  Settings,
  Tag,
  TrendingUp
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
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
import { Skeleton } from "@/components/ui/skeleton"
import { 
  usePaginatedPortfolios, 
  useDeletePortfolio, 
  useTogglePortfolioStatus,
  useTogglePortfolioFeatured,
  usePortfolioCategories
} from "@/hooks/use-portfolios"
import { useStudios } from "@/hooks/use-studios"
import { type Portfolio } from "@/actions/portfolios"
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
import { PaginationControls } from "@/components/pagination-controls"
import { DEFAULT_PAGE_SIZE } from "@/lib/constants/pagination"
import { PortfolioDialog } from "@/app/(dashboard)/admin/_components/portfolio-dialog"
import { PortfolioCategoriesDialog } from "@/app/(dashboard)/admin/_components/portfolio-categories-dialog"
import Image from "next/image"

export default function PortfolioPage() {
  const [searchTerm, setSearchTerm] = useState('')
  const [selectedPortfolio, setSelectedPortfolio] = useState<Portfolio | null>(null)
  const [isDialogOpen, setIsDialogOpen] = useState(false)
  const [portfolioToDelete, setPortfolioToDelete] = useState<Portfolio | null>(null)
  const [portfolioToToggle, setPortfolioToToggle] = useState<Portfolio | null>(null)
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid')
  const [statusFilter, setStatusFilter] = useState<'all' | 'active' | 'inactive'>('all')
  const [categoryFilter, setCategoryFilter] = useState<string>('all')
  const [featuredFilter, setFeaturedFilter] = useState<'all' | 'featured' | 'not_featured'>('all')
  const [selectedStudioId, setSelectedStudioId] = useState<string>('')
  const [currentPage, setCurrentPage] = useState(1)
  const [pageSize, setPageSize] = useState(DEFAULT_PAGE_SIZE)

  const { data: studios = [], isLoading: studiosLoading } = useStudios()
  
  // Use paginated hook
  const { 
    data: paginatedResult, 
    isLoading: loading, 
    error, 
    refetch 
  } = usePaginatedPortfolios(selectedStudioId, {
    page: currentPage,
    pageSize,
    search: searchTerm,
    status: statusFilter,
    category: categoryFilter === 'all' ? undefined : categoryFilter,
    featured: featuredFilter,
  })

  const portfolios = paginatedResult?.data || []
  const pagination = paginatedResult?.pagination
  
  const { data: categories = [] } = usePortfolioCategories(selectedStudioId)
  const deletePortfolioMutation = useDeletePortfolio()
  const toggleStatusMutation = useTogglePortfolioStatus()
  const toggleFeaturedMutation = useTogglePortfolioFeatured()

  // Set default studio
  useEffect(() => {
    if (studios.length > 0 && !selectedStudioId) {
      setSelectedStudioId(studios[0].id)
    }
  }, [studios, selectedStudioId])

  // Reset pagination when filters change
  useEffect(() => {
    setCurrentPage(1)
  }, [searchTerm, statusFilter, categoryFilter, featuredFilter, selectedStudioId])

  const handlePageChange = (page: number) => {
    setCurrentPage(page)
  }

  const handlePageSizeChange = (newPageSize: number) => {
    setPageSize(newPageSize)
    setCurrentPage(1)
  }

  const handleEdit = (portfolio: Portfolio) => {
    setSelectedPortfolio(portfolio)
    setIsDialogOpen(true)
  }

  const handleAdd = () => {
    setSelectedPortfolio(null)
    setIsDialogOpen(true)
  }

  const handleDelete = async (portfolio: Portfolio) => {
    deletePortfolioMutation.mutate(portfolio.id, {
      onSuccess: () => {
        setPortfolioToDelete(null)
      }
    })
  }

  const handleToggleStatus = async (portfolio: Portfolio) => {
    toggleStatusMutation.mutate(portfolio.id, {
      onSuccess: () => {
        setPortfolioToToggle(null)
      }
    })
  }

  const handleToggleFeatured = async (portfolio: Portfolio) => {
    toggleFeaturedMutation.mutate(portfolio.id)
  }

  const handlePortfolioSaved = () => {
    refetch()
  }

  const getCategoryById = (id: string | null) => {
    if (!id) return null
    return categories.find(cat => cat.id === id)
  }

  // Statistics
  const stats = {
    total: pagination?.total || portfolios.length,
    active: portfolios.filter(p => p.is_active).length,
    featured: portfolios.filter(p => p.is_featured).length,
    categories: categories.filter(c => c.is_active).length,
  }

  if (error) {
    return (
      <div className="p-8">
        <Card>
          <CardContent className="pt-6">
            <div className="text-center text-muted-foreground">
              <ImageIcon className="h-8 w-8 mx-auto mb-2" />
              Terjadi kesalahan saat memuat data portfolio
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
          <h1 className="text-3xl font-bold tracking-tight">Portfolio Management</h1>
          <p className="text-muted-foreground">
            Kelola portfolio dan galeri karya studio fotografi
          </p>
        </div>
        <div className="flex items-center gap-2">
          <PortfolioCategoriesDialog studioId={selectedStudioId} />
          <Button onClick={handleAdd}>
            <Plus className="h-4 w-4 mr-2" />
            Tambah Portfolio
          </Button>
        </div>
      </div>

      {/* Studio Selection */}
      <Card className="mb-6">
        <CardContent className="pt-6">
          <div className="flex flex-col md:flex-row gap-4">
            <div className="flex-1">
              <label className="text-sm font-medium mb-2 block">Pilih Studio</label>
              <Select value={selectedStudioId} onValueChange={setSelectedStudioId}>
                <SelectTrigger>
                  <SelectValue placeholder="Pilih studio untuk mengelola portfolio" />
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
                    {pagination?.total || portfolios.length}
                  </div>
                  <div className="text-sm text-muted-foreground">
                    {pagination ? 'Total Portfolio' : `Page ${currentPage} Results`}
                  </div>
                </div>
                <div className="text-center">
                  <div className="text-2xl font-bold text-green-600">
                    {portfolios.filter(p => p.is_active).length}
                  </div>
                  <div className="text-sm text-muted-foreground">Aktif</div>
                </div>
                <div className="text-center">
                  <div className="text-2xl font-bold text-yellow-600">
                    {portfolios.filter(p => p.is_featured).length}
                  </div>
                  <div className="text-sm text-muted-foreground">Unggulan</div>
                </div>
                <div className="text-center">
                  <div className="text-2xl font-bold text-purple-600">
                    {categories.filter(c => c.is_active).length}
                  </div>
                  <div className="text-sm text-muted-foreground">Kategori</div>
                </div>
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      {selectedStudioId && (
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle className="flex items-center gap-2">
                  <Camera className="h-5 w-5" />
                  Portfolio Items
                </CardTitle>
                <CardDescription>
                  Kelola gambar dan karya portfolio studio
                </CardDescription>
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
          </CardHeader>
          <CardContent className="pt-6">
            {/* Filters */}
            <div className="flex flex-wrap items-center gap-4 mb-6">
              <div className="relative flex-1 min-w-[300px]">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
                <Input
                  placeholder="Cari portfolio berdasarkan judul, deskripsi..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10"
                />
              </div>

              <Select value={statusFilter} onValueChange={(value) => setStatusFilter(value as 'all' | 'active' | 'inactive')}>
                <SelectTrigger className="w-[140px]">
                  <SelectValue placeholder="Status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Semua Status</SelectItem>
                  <SelectItem value="active">Aktif</SelectItem>
                  <SelectItem value="inactive">Tidak Aktif</SelectItem>
                </SelectContent>
              </Select>

              <Select value={categoryFilter} onValueChange={setCategoryFilter}>
                <SelectTrigger className="w-[160px]">
                  <SelectValue placeholder="Kategori" />
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

              <Select value={featuredFilter} onValueChange={(value) => setFeaturedFilter(value as 'all' | 'featured' | 'not_featured')}>
                <SelectTrigger className="w-[140px]">
                  <SelectValue placeholder="Unggulan" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Semua</SelectItem>
                  <SelectItem value="featured">Unggulan</SelectItem>
                  <SelectItem value="not_featured">Biasa</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* Loading State */}
            {loading && (
              <div className="space-y-4">
                {viewMode === 'grid' ? (
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
                    {Array.from({ length: 8 }).map((_, i) => (
                      <div key={i} className="space-y-3">
                        <Skeleton className="h-48 w-full rounded-lg" />
                        <Skeleton className="h-4 w-3/4" />
                        <Skeleton className="h-3 w-1/2" />
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="space-y-2">
                    {Array.from({ length: 5 }).map((_, i) => (
                      <Skeleton key={i} className="h-16 w-full" />
                    ))}
                  </div>
                )}
              </div>
            )}

            {/* Content */}
            {!loading && (
              <>
                {portfolios.length === 0 ? (
                  <div className="text-center py-12">
                    <ImageIcon className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                    <h3 className="text-lg font-semibold mb-2">Belum ada portfolio</h3>
                    <p className="text-muted-foreground mb-4">
                      Mulai dengan menambahkan gambar portfolio pertama
                    </p>
                    <Button onClick={handleAdd}>
                      <Plus className="h-4 w-4 mr-2" />
                      Tambah Portfolio
                    </Button>
                  </div>
                ) : (
                  <>
                    {viewMode === 'grid' ? (
                      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                        {portfolios.map((portfolio) => {
                          const category = getCategoryById(portfolio.category_id)
                          return (
                            <Card key={portfolio.id} className="group overflow-hidden hover:shadow-lg transition-shadow">
                              <div className="relative aspect-square">
                                <Image
                                  src={portfolio.image_url}
                                  alt={portfolio.alt_text || portfolio.title}
                                  fill
                                  className="object-cover transition-transform group-hover:scale-105"
                                />
                                <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
                                <div className="absolute top-2 left-2 flex gap-1">
                                  {portfolio.is_featured && (
                                    <Badge variant="secondary" className="bg-yellow-500/90 text-white">
                                      <Star className="h-3 w-3 mr-1" />
                                      Unggulan
                                    </Badge>
                                  )}
                                  <Badge variant={portfolio.is_active ? "default" : "secondary"}>
                                    {portfolio.is_active ? "Aktif" : "Tidak Aktif"}
                                  </Badge>
                                </div>
                                <div className="absolute top-2 right-2">
                                  <DropdownMenu>
                                    <DropdownMenuTrigger asChild>
                                      <Button
                                        variant="secondary"
                                        size="icon"
                                        className="h-8 w-8 opacity-0 group-hover:opacity-100 transition-opacity"
                                      >
                                        <MoreHorizontal className="h-4 w-4" />
                                      </Button>
                                    </DropdownMenuTrigger>
                                    <DropdownMenuContent align="end">
                                      <DropdownMenuLabel>Actions</DropdownMenuLabel>
                                      <DropdownMenuItem onClick={() => handleEdit(portfolio)}>
                                        <Edit className="mr-2 h-4 w-4" />
                                        Edit
                                      </DropdownMenuItem>
                                      <DropdownMenuItem 
                                        onClick={() => handleToggleFeatured(portfolio)}
                                      >
                                        {portfolio.is_featured ? (
                                          <>
                                            <StarOff className="mr-2 h-4 w-4" />
                                            Hapus Unggulan
                                          </>
                                        ) : (
                                          <>
                                            <Star className="mr-2 h-4 w-4" />
                                            Jadikan Unggulan
                                          </>
                                        )}
                                      </DropdownMenuItem>
                                      <DropdownMenuSeparator />
                                      <DropdownMenuItem 
                                        onClick={() => setPortfolioToToggle(portfolio)}
                                        className="text-orange-600"
                                      >
                                        {portfolio.is_active ? <EyeOff className="mr-2 h-4 w-4" /> : <Eye className="mr-2 h-4 w-4" />}
                                        {portfolio.is_active ? "Nonaktifkan" : "Aktifkan"}
                                      </DropdownMenuItem>
                                      <DropdownMenuItem 
                                        className="text-red-600"
                                        onClick={() => setPortfolioToDelete(portfolio)}
                                      >
                                        <Trash className="mr-2 h-4 w-4" />
                                        Hapus
                                      </DropdownMenuItem>
                                    </DropdownMenuContent>
                                  </DropdownMenu>
                                </div>
                              </div>
                              <CardContent className="p-4">
                                <h3 className="font-semibold text-sm mb-1 line-clamp-1">
                                  {portfolio.title}
                                </h3>
                                {category && (
                                  <Badge variant="outline" className="text-xs mb-2">
                                    <Tag className="h-3 w-3 mr-1" />
                                    {category.name}
                                  </Badge>
                                )}
                                {portfolio.description && (
                                  <p className="text-xs text-muted-foreground line-clamp-2">
                                    {portfolio.description}
                                  </p>
                                )}
                              </CardContent>
                            </Card>
                          )
                        })}
                      </div>
                    ) : (
                      <div className="space-y-4">
                        {portfolios.map((portfolio) => {
                          const category = getCategoryById(portfolio.category_id)
                          return (
                            <Card key={portfolio.id} className="hover:shadow-md transition-shadow">
                              <CardContent className="p-4">
                                <div className="flex items-center gap-4">
                                  <div className="relative w-16 h-16 rounded-lg overflow-hidden flex-shrink-0">
                                    <Image
                                      src={portfolio.image_url}
                                      alt={portfolio.alt_text || portfolio.title}
                                      fill
                                      className="object-cover"
                                    />
                                  </div>
                                  <div className="flex-1 min-w-0">
                                    <div className="flex items-start justify-between">
                                      <div className="flex-1 min-w-0">
                                        <h3 className="font-semibold truncate">{portfolio.title}</h3>
                                        {portfolio.description && (
                                          <p className="text-sm text-muted-foreground mt-1 line-clamp-2">
                                            {portfolio.description}
                                          </p>
                                        )}
                                        <div className="flex items-center gap-2 mt-2">
                                          {category && (
                                            <Badge variant="outline" className="text-xs">
                                              <Tag className="h-3 w-3 mr-1" />
                                              {category.name}
                                            </Badge>
                                          )}
                                          {portfolio.is_featured && (
                                            <Badge variant="secondary" className="bg-yellow-100 text-yellow-800 text-xs">
                                              <Star className="h-3 w-3 mr-1" />
                                              Unggulan
                                            </Badge>
                                          )}
                                          <Badge variant={portfolio.is_active ? "default" : "secondary"} className="text-xs">
                                            {portfolio.is_active ? "Aktif" : "Tidak Aktif"}
                                          </Badge>
                                        </div>
                                      </div>
                                      <DropdownMenu>
                                        <DropdownMenuTrigger asChild>
                                          <Button variant="ghost" size="icon">
                                            <MoreHorizontal className="h-4 w-4" />
                                          </Button>
                                        </DropdownMenuTrigger>
                                        <DropdownMenuContent align="end">
                                          <DropdownMenuLabel>Actions</DropdownMenuLabel>
                                          <DropdownMenuItem onClick={() => handleEdit(portfolio)}>
                                            <Edit className="mr-2 h-4 w-4" />
                                            Edit
                                          </DropdownMenuItem>
                                          <DropdownMenuItem onClick={() => handleToggleFeatured(portfolio)}>
                                            {portfolio.is_featured ? (
                                              <>
                                                <StarOff className="mr-2 h-4 w-4" />
                                                Hapus Unggulan
                                              </>
                                            ) : (
                                              <>
                                                <Star className="mr-2 h-4 w-4" />
                                                Jadikan Unggulan
                                              </>
                                            )}
                                          </DropdownMenuItem>
                                          <DropdownMenuSeparator />
                                          <DropdownMenuItem 
                                            onClick={() => setPortfolioToToggle(portfolio)}
                                            className="text-orange-600"
                                          >
                                            {portfolio.is_active ? <EyeOff className="mr-2 h-4 w-4" /> : <Eye className="mr-2 h-4 w-4" />}
                                            {portfolio.is_active ? "Nonaktifkan" : "Aktifkan"}
                                          </DropdownMenuItem>
                                          <DropdownMenuItem 
                                            className="text-red-600"
                                            onClick={() => setPortfolioToDelete(portfolio)}
                                          >
                                            <Trash className="mr-2 h-4 w-4" />
                                            Hapus
                                          </DropdownMenuItem>
                                        </DropdownMenuContent>
                                      </DropdownMenu>
                                    </div>
                                  </div>
                                </div>
                              </CardContent>
                            </Card>
                          )
                        })}
                      </div>
                    )}
                  </>
                )}
              </>
            )}
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

      {/* Portfolio Dialog */}
      <PortfolioDialog
        open={isDialogOpen}
        onOpenChange={setIsDialogOpen}
        portfolioData={selectedPortfolio}
        onPortfolioSaved={handlePortfolioSaved}
        studioId={selectedStudioId}
      />

      {/* Toggle Status Dialog */}
      <AlertDialog open={!!portfolioToToggle} onOpenChange={() => setPortfolioToToggle(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>
              {portfolioToToggle?.is_active ? 'Nonaktifkan' : 'Aktifkan'} Portfolio
            </AlertDialogTitle>
            <AlertDialogDescription>
              Apakah Anda yakin ingin {portfolioToToggle?.is_active ? 'menonaktifkan' : 'mengaktifkan'} 
              portfolio "{portfolioToToggle?.title}"?
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Batal</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => portfolioToToggle && handleToggleStatus(portfolioToToggle)}
            >
              {portfolioToToggle?.is_active ? 'Nonaktifkan' : 'Aktifkan'}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={!!portfolioToDelete} onOpenChange={() => setPortfolioToDelete(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Hapus Portfolio</AlertDialogTitle>
            <AlertDialogDescription>
              <div className="space-y-2">
                <p className="font-semibold text-red-600">⚠️ PERINGATAN: Aksi ini tidak dapat dibatalkan!</p>
                <p>
                  Apakah Anda yakin ingin menghapus portfolio "{portfolioToDelete?.title}" secara permanen?
                </p>
                <p className="text-sm text-muted-foreground">
                  Portfolio dan semua data terkaitnya akan dihapus dari sistem dan tidak dapat dipulihkan.
                </p>
              </div>
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Batal</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => portfolioToDelete && handleDelete(portfolioToDelete)}
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