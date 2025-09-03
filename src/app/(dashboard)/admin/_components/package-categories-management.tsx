"use client"

import { useState } from "react"
import { 
  Plus, 
  Search, 
  MoreHorizontal, 
  Edit, 
  Trash, 
  Tag,
  Package,
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
import {
  Dialog,
  DialogContent,
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
import { PackageCategoryDialog } from "./package-category-dialog"
import { usePackageCategories, useDeletePackageCategory, usePackages } from "@/hooks/use-packages"

interface PackageCategoriesManagementProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  studioId: string
}

export function PackageCategoriesManagement({
  open,
  onOpenChange,
  studioId,
}: PackageCategoriesManagementProps) {
  const [searchTerm, setSearchTerm] = useState('')
  const [selectedCategory, setSelectedCategory] = useState<any | null>(null)
  const [isCategoryDialogOpen, setIsCategoryDialogOpen] = useState(false)
  const [categoryToDelete, setCategoryToDelete] = useState<any | null>(null)

  const { data: categories = [], isLoading: loading, refetch } = usePackageCategories(studioId)
  const { data: packages = [] } = usePackages(studioId)
  const deleteCategory = useDeletePackageCategory()

  const filteredCategories = categories.filter(category =>
    category.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    (category.description || '').toLowerCase().includes(searchTerm.toLowerCase())
  )

  const handleEdit = (category: any) => {
    setSelectedCategory(category)
    setIsCategoryDialogOpen(true)
  }

  const handleAdd = () => {
    setSelectedCategory(null)
    setIsCategoryDialogOpen(true)
  }

  const handleDelete = async (category: any) => {
    const packagesInCategory = packages.filter(pkg => pkg.category_id === category.id)
    
    if (packagesInCategory.length > 0) {
      alert(`Tidak dapat menghapus kategori karena masih ada ${packagesInCategory.length} paket yang menggunakan kategori ini. Hapus atau pindahkan paket terlebih dahulu.`)
      setCategoryToDelete(null)
      return
    }

    deleteCategory.mutate(category.id, {
      onSuccess: () => {
        setCategoryToDelete(null)
        refetch()
      }
    })
  }

  const handleCategorySaved = () => {
    refetch()
  }

  const getPackageCount = (categoryId: string) => {
    return packages.filter(pkg => pkg.category_id === categoryId).length
  }

  return (
    <>
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent className="sm:max-w-4xl max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Tag className="h-5 w-5" />
              Kelola Kategori Paket
            </DialogTitle>
          </DialogHeader>

          <div className="space-y-4">
            {/* Stats */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Total Kategori</CardTitle>
                  <Tag className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{categories.length}</div>
                </CardContent>
              </Card>
              
              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Total Paket</CardTitle>
                  <Package className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{packages.length}</div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Tanpa Kategori</CardTitle>
                  <AlertCircle className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">
                    {packages.filter(pkg => !pkg.category_id).length}
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Controls */}
            <div className="flex flex-col md:flex-row gap-4 items-start md:items-center justify-between">
              <div className="relative flex-1 min-w-[250px]">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
                <Input
                  placeholder="Cari kategori..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10"
                />
              </div>
              <Button onClick={handleAdd} disabled={!studioId}>
                <Plus className="h-4 w-4 mr-2" />
                Tambah Kategori
              </Button>
            </div>

            {/* Categories List */}
            {loading ? (
              <div className="space-y-2">
                {[...Array(3)].map((_, i) => (
                  <Skeleton key={i} className="h-16 w-full" />
                ))}
              </div>
            ) : (
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Tag className="h-5 w-5" />
                    Daftar Kategori
                  </CardTitle>
                  <CardDescription>
                    Kelola kategori paket foto yang terdaftar dalam sistem
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="rounded-md border">
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>Kategori</TableHead>
                          <TableHead>Deskripsi</TableHead>
                          <TableHead>Jumlah Paket</TableHead>
                          <TableHead className="w-[100px]">Aksi</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {filteredCategories.length === 0 ? (
                          <TableRow>
                            <TableCell colSpan={4} className="text-center h-24 text-muted-foreground">
                              {searchTerm ? "Tidak ada kategori yang cocok dengan pencarian" : "Belum ada kategori yang terdaftar"}
                            </TableCell>
                          </TableRow>
                        ) : (
                          filteredCategories.map((category) => {
                            const packageCount = getPackageCount(category.id)
                            
                            return (
                              <TableRow key={category.id}>
                                <TableCell>
                                  <div className="flex items-center space-x-3">
                                    <div className="p-2 bg-primary/10 rounded-lg">
                                      <Tag className="h-4 w-4 text-primary" />
                                    </div>
                                    <div>
                                      <div className="font-medium">{category.name}</div>
                                      <div className="text-sm text-muted-foreground">
                                        ID: {category.id.substring(0, 8)}...
                                      </div>
                                    </div>
                                  </div>
                                </TableCell>
                                <TableCell>
                                  {category.description ? (
                                    <div className="text-sm line-clamp-2 max-w-xs">
                                      {category.description}
                                    </div>
                                  ) : (
                                    <span className="text-muted-foreground text-sm">-</span>
                                  )}
                                </TableCell>
                                <TableCell>
                                  <Badge variant="outline" className="bg-blue-50">
                                    <Package className="h-3 w-3 mr-1" />
                                    {packageCount} paket
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
                                      <DropdownMenuItem onClick={() => handleEdit(category)}>
                                        <Edit className="mr-2 h-4 w-4" />
                                        Edit
                                      </DropdownMenuItem>
                                      <DropdownMenuItem 
                                        className="text-red-600"
                                        onClick={() => setCategoryToDelete(category)}
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
        </DialogContent>
      </Dialog>

      {/* Category Dialog */}
      <PackageCategoryDialog
        open={isCategoryDialogOpen}
        onOpenChange={setIsCategoryDialogOpen}
        categoryData={selectedCategory}
        onCategorySaved={handleCategorySaved}
        studioId={studioId}
      />

      {/* Delete Dialog */}
      <AlertDialog open={!!categoryToDelete} onOpenChange={() => setCategoryToDelete(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Hapus Kategori</AlertDialogTitle>
            <AlertDialogDescription>
              <div className="space-y-2">
                <p className="font-semibold text-red-600">⚠️ PERINGATAN: Aksi ini tidak dapat dibatalkan!</p>
                <p>
                  Apakah Anda yakin ingin menghapus kategori "{categoryToDelete?.name}" secara permanen? 
                </p>
                <p className="text-sm text-muted-foreground">
                  Kategori dan semua data terkaitnya akan dihapus dari database dan tidak dapat dipulihkan. 
                  Pastikan tidak ada paket yang masih menggunakan kategori ini.
                </p>
              </div>
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Batal</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => categoryToDelete && handleDelete(categoryToDelete)}
              className="bg-red-600 hover:bg-red-700"
            >
              Hapus Permanen
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  )
}