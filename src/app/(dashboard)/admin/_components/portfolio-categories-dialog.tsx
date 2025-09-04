"use client"

import { useState } from "react"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import {
  usePortfolioCategories,
  useCreatePortfolioCategory,
  useUpdatePortfolioCategory,
  useDeletePortfolioCategory
} from "@/hooks/use-portfolios"
import { type PortfolioCategory } from "@/actions/portfolios"
import { Plus, Edit, Trash, Settings, Tag } from "lucide-react"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"

interface PortfolioCategoriesDialogProps {
  studioId: string
}

export function PortfolioCategoriesDialog({ studioId }: PortfolioCategoriesDialogProps) {
  const [open, setOpen] = useState(false)
  const [editingCategory, setEditingCategory] = useState<PortfolioCategory | null>(null)
  const [isFormOpen, setIsFormOpen] = useState(false)
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    display_order: 0,
  })

  const { data: categories = [], isLoading } = usePortfolioCategories(studioId)
  const createCategoryMutation = useCreatePortfolioCategory()
  const updateCategoryMutation = useUpdatePortfolioCategory()
  const deleteCategoryMutation = useDeletePortfolioCategory()

  const resetForm = () => {
    setFormData({ name: '', description: '', display_order: 0 })
    setEditingCategory(null)
    setIsFormOpen(false)
  }

  const handleEdit = (category: PortfolioCategory) => {
    setEditingCategory(category)
    setFormData({
      name: category.name,
      description: category.description || '',
      display_order: category.display_order,
    })
    setIsFormOpen(true)
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!formData.name.trim()) return

    try {
      if (editingCategory) {
        await updateCategoryMutation.mutateAsync({
          id: editingCategory.id,
          data: {
            name: formData.name.trim(),
            description: formData.description.trim() || undefined,
            display_order: formData.display_order,
          }
        })
      } else {
        await createCategoryMutation.mutateAsync({
          studio_id: studioId,
          name: formData.name.trim(),
          description: formData.description.trim() || undefined,
          display_order: formData.display_order,
        })
      }
      resetForm()
    } catch (error) {
      console.error('Error saving category:', error)
    }
  }

  const handleDelete = async (category: PortfolioCategory) => {
    if (confirm(`Apakah Anda yakin ingin menghapus kategori "${category.name}"?`)) {
      try {
        await deleteCategoryMutation.mutateAsync(category.id)
      } catch (error) {
        console.error('Error deleting category:', error)
      }
    }
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="outline">
          <Settings className="h-4 w-4 mr-2" />
          Kelola Kategori
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[700px] max-h-[90vh] overflow-hidden flex flex-col">
        <DialogHeader className="flex-shrink-0">
          <DialogTitle className="flex items-center gap-2">
            <Tag className="h-5 w-5" />
            Kelola Kategori Portfolio
          </DialogTitle>
          <DialogDescription>
            Atur kategori untuk mengelompokkan portfolio studio
          </DialogDescription>
        </DialogHeader>

        <div className="flex-1 overflow-y-auto space-y-4 pr-2">
          {/* Form Section */}
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-base">
                {editingCategory ? 'Edit Kategori' : 'Tambah Kategori Baru'}
              </CardTitle>
              <CardDescription>
                {editingCategory ? 'Perbarui informasi kategori' : 'Buat kategori baru untuk portfolio'}
              </CardDescription>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleSubmit} className="space-y-4">
                <div className="grid grid-cols-3 gap-4">
                  <div className="col-span-2">
                    <label className="text-sm font-medium mb-2 block">Nama Kategori *</label>
                    <Input
                      value={formData.name}
                      onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
                      placeholder="Contoh: Wedding Photography"
                      required
                    />
                  </div>
                  <div>
                    <label className="text-sm font-medium mb-2 block">Urutan</label>
                    <Input
                      type="number"
                      min="0"
                      value={formData.display_order}
                      onChange={(e) => setFormData(prev => ({ ...prev, display_order: Number(e.target.value) }))}
                      placeholder="0"
                    />
                  </div>
                </div>
                <div>
                  <label className="text-sm font-medium mb-2 block">Deskripsi</label>
                  <Textarea
                    value={formData.description}
                    onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
                    placeholder="Deskripsi kategori..."
                    className="min-h-[60px]"
                  />
                </div>
                <div className="flex gap-2">
                  <Button
                    type="submit"
                    disabled={!formData.name.trim() || createCategoryMutation.isPending || updateCategoryMutation.isPending}
                  >
                    {editingCategory ? 'Perbarui' : 'Tambah'} Kategori
                  </Button>
                  {editingCategory && (
                    <Button
                      type="button"
                      variant="outline"
                      onClick={resetForm}
                    >
                      Batal
                    </Button>
                  )}
                </div>
              </form>
            </CardContent>
          </Card>

          {/* Categories List */}
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-base">Daftar Kategori</CardTitle>
              <CardDescription>
                {categories.length} kategori tersedia
              </CardDescription>
            </CardHeader>
            <CardContent className="max-h-[300px] overflow-y-auto">
              {isLoading ? (
                <div className="text-center py-4 text-muted-foreground">
                  Memuat kategori...
                </div>
              ) : categories.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground">
                  <Tag className="h-8 w-8 mx-auto mb-2" />
                  <p>Belum ada kategori</p>
                  <p className="text-sm">Tambah kategori pertama untuk mengelompokkan portfolio</p>
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Nama</TableHead>
                        <TableHead>Deskripsi</TableHead>
                        <TableHead className="text-center">Urutan</TableHead>
                        <TableHead className="text-center">Status</TableHead>
                        <TableHead className="text-right">Aksi</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {categories
                        .sort((a, b) => a.display_order - b.display_order)
                        .map((category) => (
                        <TableRow key={category.id}>
                          <TableCell className="font-medium">{category.name}</TableCell>
                          <TableCell className="text-sm text-muted-foreground max-w-[150px] truncate">
                            {category.description || '-'}
                          </TableCell>
                          <TableCell className="text-center">{category.display_order}</TableCell>
                          <TableCell className="text-center">
                            <Badge variant={category.is_active ? "default" : "secondary"}>
                              {category.is_active ? "Aktif" : "Tidak Aktif"}
                            </Badge>
                          </TableCell>
                          <TableCell className="text-right">
                            <div className="flex items-center justify-end gap-1">
                              <Button
                                variant="ghost"
                                size="icon"
                                onClick={() => handleEdit(category)}
                                className="h-8 w-8"
                              >
                                <Edit className="h-4 w-4" />
                              </Button>
                              <Button
                                variant="ghost"
                                size="icon"
                                onClick={() => handleDelete(category)}
                                className="h-8 w-8 text-red-600 hover:text-red-700 hover:bg-red-50"
                                disabled={deleteCategoryMutation.isPending}
                              >
                                <Trash className="h-4 w-4" />
                              </Button>
                            </div>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </DialogContent>
    </Dialog>
  )
}