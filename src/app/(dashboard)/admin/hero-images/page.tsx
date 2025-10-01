"use client"

import React, { useState } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
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
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import {
  Image as ImageIcon,
  Plus,
  MoreHorizontal,
  Edit,
  Trash2,
  Eye,
  EyeOff,
  RefreshCw,
} from "lucide-react"
import { useHeroImages, useDeleteHeroImage, useUpdateHeroImage } from "@/hooks/use-hero-images"
import { HeroImagesDialog } from "@/components/admin/hero-images-dialog"
import { type HeroImage } from "@/actions/hero-images"
import { format } from "date-fns"
import { id as localeId } from "date-fns/locale"

export default function HeroImagesPage() {
  const [editingHeroImage, setEditingHeroImage] = useState<HeroImage | null>(null)
  const [showDialog, setShowDialog] = useState(false)
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false)
  const [heroImageToDelete, setHeroImageToDelete] = useState<HeroImage | null>(null)

  const { data: heroImages = [], isLoading, refetch } = useHeroImages()
  const deleteHeroImageMutation = useDeleteHeroImage()
  const updateHeroImageMutation = useUpdateHeroImage()

  const handleAddNew = () => {
    setEditingHeroImage(null)
    setShowDialog(true)
  }

  const handleEdit = (heroImage: HeroImage) => {
    setEditingHeroImage(heroImage)
    setShowDialog(true)
  }

  const handleDelete = (heroImage: HeroImage) => {
    setHeroImageToDelete(heroImage)
    setDeleteDialogOpen(true)
  }

  const confirmDelete = async () => {
    if (heroImageToDelete) {
      await deleteHeroImageMutation.mutateAsync(heroImageToDelete.id)
      setDeleteDialogOpen(false)
      setHeroImageToDelete(null)
    }
  }

  const handleToggleActive = async (heroImage: HeroImage) => {
    await updateHeroImageMutation.mutateAsync({
      id: heroImage.id,
      data: { is_active: !heroImage.is_active }
    })
  }


  const canAddMore = heroImages.length < 5
  const existingOrders = heroImages.map(h => h.display_order)

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Hero Images</h1>
          <p className="text-muted-foreground">
            Kelola gambar hero untuk homepage (maksimal 5 gambar)
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            onClick={() => refetch()}
            className="gap-2"
          >
            <RefreshCw className="h-4 w-4" />
            Refresh
          </Button>
          <Button
            onClick={handleAddNew}
            className="gap-2"
            disabled={!canAddMore}
          >
            <Plus className="h-4 w-4" />
            Tambah Hero Image
          </Button>
        </div>
      </div>

      {/* Statistics */}
      <div className="grid gap-4 md:grid-cols-3">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-2">
              <ImageIcon className="h-5 w-5 text-blue-600" />
              <div>
                <div className="text-2xl font-bold">{heroImages.length}</div>
                <div className="text-sm text-gray-600">Total Hero Images</div>
              </div>
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-2">
              <Eye className="h-5 w-5 text-green-600" />
              <div>
                <div className="text-2xl font-bold text-green-600">
                  {heroImages.filter(h => h.is_active).length}
                </div>
                <div className="text-sm text-gray-600">Active</div>
              </div>
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-2">
              <Plus className="h-5 w-5 text-orange-600" />
              <div>
                <div className="text-2xl font-bold text-orange-600">
                  {5 - heroImages.length}
                </div>
                <div className="text-sm text-gray-600">Slots Available</div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Hero Images Table */}
      <Card>
        <CardHeader>
          <CardTitle>Daftar Hero Images</CardTitle>
          <CardDescription>
            Manage your homepage hero images. Maximum 5 images allowed.
          </CardDescription>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="flex justify-center py-8">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
            </div>
          ) : heroImages.length === 0 ? (
            <div className="text-center py-8">
              <ImageIcon className="h-12 w-12 mx-auto mb-4 text-gray-400" />
              <h3 className="text-lg font-medium mb-2">No Hero Images</h3>
              <p className="text-gray-600 mb-4">
                Add your first hero image to get started
              </p>
              <Button onClick={handleAddNew} className="gap-2">
                <Plus className="h-4 w-4" />
                Add Hero Image
              </Button>
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="w-16">Order</TableHead>
                  <TableHead className="w-24">Preview</TableHead>
                  <TableHead>Title</TableHead>
                  <TableHead>Description</TableHead>
                  <TableHead className="w-20">Status</TableHead>
                  <TableHead className="w-32">Created</TableHead>
                  <TableHead className="w-20">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {heroImages
                  .sort((a, b) => a.display_order - b.display_order)
                  .map((heroImage) => (
                    <TableRow key={heroImage.id}>
                      <TableCell>
                        <span className="font-medium">{heroImage.display_order}</span>
                      </TableCell>
                      <TableCell>
                        <img
                          src={heroImage.image_url}
                          alt={heroImage.alt_text || heroImage.title}
                          className="w-16 h-12 object-cover rounded border"
                        />
                      </TableCell>
                      <TableCell>
                        <div className="font-medium">{heroImage.title}</div>
                        {heroImage.alt_text && (
                          <div className="text-sm text-gray-500">{heroImage.alt_text}</div>
                        )}
                      </TableCell>
                      <TableCell>
                        <div className="text-sm">
                          {heroImage.description ? (
                            heroImage.description.length > 60 
                              ? `${heroImage.description.substring(0, 60)}...`
                              : heroImage.description
                          ) : (
                            <span className="text-gray-400">No description</span>
                          )}
                        </div>
                      </TableCell>
                      <TableCell>
                        <Badge
                          variant={heroImage.is_active ? "default" : "secondary"}
                          className="cursor-pointer"
                          onClick={() => handleToggleActive(heroImage)}
                        >
                          {heroImage.is_active ? (
                            <>
                              <Eye className="h-3 w-3 mr-1" />
                              Active
                            </>
                          ) : (
                            <>
                              <EyeOff className="h-3 w-3 mr-1" />
                              Inactive
                            </>
                          )}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <div className="text-sm">
                          {format(new Date(heroImage.created_at), 'dd MMM yyyy', { locale: localeId })}
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
                            <DropdownMenuItem onClick={() => handleEdit(heroImage)}>
                              <Edit className="h-4 w-4 mr-2" />
                              Edit
                            </DropdownMenuItem>
                            <DropdownMenuItem onClick={() => handleToggleActive(heroImage)}>
                              {heroImage.is_active ? (
                                <>
                                  <EyeOff className="h-4 w-4 mr-2" />
                                  Deactivate
                                </>
                              ) : (
                                <>
                                  <Eye className="h-4 w-4 mr-2" />
                                  Activate
                                </>
                              )}
                            </DropdownMenuItem>
                            <DropdownMenuSeparator />
                            <DropdownMenuItem 
                              onClick={() => handleDelete(heroImage)}
                              className="text-red-600"
                            >
                              <Trash2 className="h-4 w-4 mr-2" />
                              Delete
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </TableCell>
                    </TableRow>
                  ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      {/* Hero Images Dialog */}
      <HeroImagesDialog
        open={showDialog}
        onOpenChange={setShowDialog}
        heroImageData={editingHeroImage}
        onHeroImageSaved={() => {
          refetch()
          setShowDialog(false)
          setEditingHeroImage(null)
        }}
        existingOrders={existingOrders}
      />

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Hero Image</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete "{heroImageToDelete?.title}"?
              This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={confirmDelete}
              className="bg-red-600 hover:bg-red-700"
            >
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  )
}