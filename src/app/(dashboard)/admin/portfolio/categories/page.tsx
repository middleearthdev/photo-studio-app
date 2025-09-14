"use client"

import React, { useState } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Badge } from "@/components/ui/badge"
import { Switch } from "@/components/ui/switch"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog"
import {
  Plus,
  MoreHorizontal,
  Edit,
  Trash2,
  ArrowUp,
  ArrowDown,
  Image,
  Eye,
  EyeOff,
} from "lucide-react"
import { toast } from "sonner"

interface PortfolioCategory {
  id: string
  studio_id: string
  name: string
  description?: string
  display_order: number
  is_active: boolean
  portfolio_count: number
  created_at: string
}

// Mock data - replace with actual data fetching
const mockCategories: PortfolioCategory[] = [
  {
    id: "550e8400-e29b-41d4-a716-446655440001",
    studio_id: "a1b2c3d4-e5f6-7890-abcd-ef1234567890",
    name: "Portrait",
    description: "Foto portrait profesional dan personal branding",
    display_order: 1,
    is_active: true,
    portfolio_count: 12,
    created_at: "2025-01-15T10:00:00Z"
  },
  {
    id: "550e8400-e29b-41d4-a716-446655440002",
    studio_id: "a1b2c3d4-e5f6-7890-abcd-ef1234567890", 
    name: "Wedding",
    description: "Foto pre-wedding, engagement, dan pernikahan",
    display_order: 2,
    is_active: true,
    portfolio_count: 8,
    created_at: "2025-01-15T10:00:00Z"
  },
  {
    id: "550e8400-e29b-41d4-a716-446655440003",
    studio_id: "a1b2c3d4-e5f6-7890-abcd-ef1234567890",
    name: "Product",
    description: "Fotografi produk untuk kebutuhan bisnis dan e-commerce",
    display_order: 3,
    is_active: true,
    portfolio_count: 15,
    created_at: "2025-01-15T10:00:00Z"
  },
  {
    id: "550e8400-e29b-41d4-a716-446655440004",
    studio_id: "a1b2c3d4-e5f6-7890-abcd-ef1234567890",
    name: "Fashion",
    description: "Fashion photography dan lookbook",
    display_order: 4,
    is_active: true,
    portfolio_count: 6,
    created_at: "2025-01-15T10:00:00Z"
  },
  {
    id: "550e8400-e29b-41d4-a716-446655440005",
    studio_id: "a1b2c3d4-e5f6-7890-abcd-ef1234567890",
    name: "Family",
    description: "Foto keluarga dan lifestyle photography",
    display_order: 5,
    is_active: false,
    portfolio_count: 3,
    created_at: "2025-01-15T10:00:00Z"
  }
]

export default function PortfolioCategoriesPage() {
  const [categories, setCategories] = useState<PortfolioCategory[]>(mockCategories)
  const [isDialogOpen, setIsDialogOpen] = useState(false)
  const [editingCategory, setEditingCategory] = useState<PortfolioCategory | null>(null)
  const [formData, setFormData] = useState({
    name: "",
    description: "",
    is_active: true
  })

  const handleInputChange = (field: string, value: any) => {
    setFormData(prev => ({ ...prev, [field]: value }))
  }

  const handleSubmit = () => {
    if (!formData.name.trim()) {
      toast.error("Category name is required")
      return
    }

    if (editingCategory) {
      // Update existing category
      setCategories(categories.map(cat => 
        cat.id === editingCategory.id 
          ? { ...cat, ...formData }
          : cat
      ))
      toast.success("Category updated successfully!")
    } else {
      // Create new category
      const newCategory: PortfolioCategory = {
        id: `cat-${Date.now()}`,
        studio_id: "a1b2c3d4-e5f6-7890-abcd-ef1234567890",
        ...formData,
        display_order: categories.length + 1,
        portfolio_count: 0,
        created_at: new Date().toISOString()
      }
      setCategories([...categories, newCategory])
      toast.success("Category created successfully!")
    }

    // Reset form
    setFormData({ name: "", description: "", is_active: true })
    setEditingCategory(null)
    setIsDialogOpen(false)
  }

  const handleEdit = (category: PortfolioCategory) => {
    setEditingCategory(category)
    setFormData({
      name: category.name,
      description: category.description || "",
      is_active: category.is_active
    })
    setIsDialogOpen(true)
  }

  const handleDelete = (categoryId: string) => {
    setCategories(categories.filter(cat => cat.id !== categoryId))
    toast.success("Category deleted successfully!")
  }

  const handleToggleActive = (categoryId: string) => {
    setCategories(categories.map(cat => 
      cat.id === categoryId 
        ? { ...cat, is_active: !cat.is_active }
        : cat
    ))
  }

  const handleMoveOrder = (categoryId: string, direction: 'up' | 'down') => {
    const categoryIndex = categories.findIndex(cat => cat.id === categoryId)
    if (categoryIndex === -1) return

    const newCategories = [...categories]
    const targetIndex = direction === 'up' ? categoryIndex - 1 : categoryIndex + 1

    if (targetIndex >= 0 && targetIndex < categories.length) {
      // Swap positions
      const temp = newCategories[categoryIndex]
      newCategories[categoryIndex] = newCategories[targetIndex]
      newCategories[targetIndex] = temp

      // Update display_order
      newCategories[categoryIndex].display_order = categoryIndex + 1
      newCategories[targetIndex].display_order = targetIndex + 1

      setCategories(newCategories)
      toast.success("Order updated successfully!")
    }
  }

  const openCreateDialog = () => {
    setEditingCategory(null)
    setFormData({ name: "", description: "", is_active: true })
    setIsDialogOpen(true)
  }

  // Sort categories by display_order
  const sortedCategories = [...categories].sort((a, b) => a.display_order - b.display_order)

  return (
    <div className="container mx-auto py-6 space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Portfolio Categories</h1>
          <p className="text-muted-foreground">
            Manage categories for organizing your portfolio items
          </p>
        </div>
        <Button onClick={openCreateDialog}>
          <Plus className="mr-2 h-4 w-4" />
          Add Category
        </Button>
      </div>

      {/* Stats Cards */}
      <div className="grid gap-4 md:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Categories</CardTitle>
            <Image className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{categories.length}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Active Categories</CardTitle>
            <Eye className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {categories.filter(cat => cat.is_active).length}
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Portfolio Items</CardTitle>
            <Image className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {categories.reduce((acc, cat) => acc + cat.portfolio_count, 0)}
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Inactive Categories</CardTitle>
            <EyeOff className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {categories.filter(cat => !cat.is_active).length}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Categories Table */}
      <Card>
        <CardHeader>
          <CardTitle>Portfolio Categories</CardTitle>
          <CardDescription>
            Manage and organize your portfolio categories
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Order</TableHead>
                <TableHead>Category Name</TableHead>
                <TableHead>Description</TableHead>
                <TableHead>Portfolio Count</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Created</TableHead>
                <TableHead>Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {sortedCategories.map((category, index) => (
                <TableRow key={category.id}>
                  <TableCell>
                    <div className="flex items-center gap-1">
                      <span className="font-mono text-sm">{category.display_order}</span>
                      <div className="flex flex-col">
                        <Button
                          variant="ghost"
                          size="sm"
                          className="h-6 w-6 p-0"
                          onClick={() => handleMoveOrder(category.id, 'up')}
                          disabled={index === 0}
                        >
                          <ArrowUp className="h-3 w-3" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          className="h-6 w-6 p-0"
                          onClick={() => handleMoveOrder(category.id, 'down')}
                          disabled={index === sortedCategories.length - 1}
                        >
                          <ArrowDown className="h-3 w-3" />
                        </Button>
                      </div>
                    </div>
                  </TableCell>
                  <TableCell>
                    <div className="font-medium">{category.name}</div>
                  </TableCell>
                  <TableCell>
                    <div className="max-w-xs truncate text-sm text-muted-foreground">
                      {category.description || "-"}
                    </div>
                  </TableCell>
                  <TableCell>
                    <Badge variant="outline">
                      {category.portfolio_count} items
                    </Badge>
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center gap-2">
                      <Badge variant={category.is_active ? "default" : "secondary"}>
                        {category.is_active ? "Active" : "Inactive"}
                      </Badge>
                      <Switch
                        checked={category.is_active}
                        onCheckedChange={() => handleToggleActive(category.id)}
                      />
                    </div>
                  </TableCell>
                  <TableCell>
                    <div className="text-sm text-muted-foreground">
                      {new Date(category.created_at).toLocaleDateString()}
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
                        <DropdownMenuLabel>Actions</DropdownMenuLabel>
                        <DropdownMenuItem onClick={() => handleEdit(category)}>
                          <Edit className="mr-2 h-4 w-4" />
                          Edit
                        </DropdownMenuItem>
                        <DropdownMenuSeparator />
                        <AlertDialog>
                          <AlertDialogTrigger asChild>
                            <DropdownMenuItem onSelect={(e) => e.preventDefault()}>
                              <Trash2 className="mr-2 h-4 w-4" />
                              Delete
                            </DropdownMenuItem>
                          </AlertDialogTrigger>
                          <AlertDialogContent>
                            <AlertDialogHeader>
                              <AlertDialogTitle>Delete Category</AlertDialogTitle>
                              <AlertDialogDescription>
                                Are you sure you want to delete "{category.name}"? 
                                This action cannot be undone and will affect {category.portfolio_count} portfolio items.
                              </AlertDialogDescription>
                            </AlertDialogHeader>
                            <AlertDialogFooter>
                              <AlertDialogCancel>Cancel</AlertDialogCancel>
                              <AlertDialogAction
                                onClick={() => handleDelete(category.id)}
                                className="bg-red-600 hover:bg-red-700"
                              >
                                Delete
                              </AlertDialogAction>
                            </AlertDialogFooter>
                          </AlertDialogContent>
                        </AlertDialog>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      {/* Add/Edit Dialog */}
      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle>
              {editingCategory ? "Edit Category" : "Add New Category"}
            </DialogTitle>
            <DialogDescription>
              {editingCategory 
                ? "Update the category information below." 
                : "Create a new portfolio category to organize your work."
              }
            </DialogDescription>
          </DialogHeader>

          <div className="grid gap-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="name">Category Name *</Label>
              <Input
                id="name"
                value={formData.name}
                onChange={(e) => handleInputChange("name", e.target.value)}
                placeholder="e.g., Portrait, Wedding, Product"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="description">Description</Label>
              <Textarea
                id="description"
                value={formData.description}
                onChange={(e) => handleInputChange("description", e.target.value)}
                placeholder="Brief description of this category"
                rows={3}
              />
            </div>

            <div className="flex items-center space-x-2">
              <Switch
                id="is_active"
                checked={formData.is_active}
                onCheckedChange={(checked) => handleInputChange("is_active", checked)}
              />
              <Label htmlFor="is_active">Active (visible on website)</Label>
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setIsDialogOpen(false)}>
              Cancel
            </Button>
            <Button onClick={handleSubmit}>
              {editingCategory ? "Update" : "Create"} Category
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}