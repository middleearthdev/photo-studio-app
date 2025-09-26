"use client"

import React, { useState, useEffect } from 'react'
import { Plus, Search, Edit, Trash2, Tag, Calendar, Users, TrendingUp } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Textarea } from '@/components/ui/textarea'
import { Checkbox } from '@/components/ui/checkbox'
import { toast } from 'sonner'
import { format } from 'date-fns'
import {
  getDiscountsAction,
  createDiscountAction,
  updateDiscountAction,
  deleteDiscountAction,
  type Discount,
  type CreateDiscountData,
  type UpdateDiscountData
} from '@/actions/discounts'
import { useStudios } from '@/hooks/use-studios'

interface DiscountFormData {
  studio_id: string
  code: string
  name: string
  description: string
  type: 'percentage' | 'fixed_amount'
  value: number
  minimum_amount: number
  maximum_discount: number
  is_active: boolean
  valid_from: string
  valid_until: string
  usage_limit: number | null
  applies_to: 'all' | 'packages' | 'addons'
}

export default function DiscountsPage() {
  const [discounts, setDiscounts] = useState<Discount[]>([])
  const [filteredDiscounts, setFilteredDiscounts] = useState<Discount[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState('')
  const [statusFilter, setStatusFilter] = useState<'all' | 'active' | 'inactive'>('all')
  const [typeFilter, setTypeFilter] = useState<'all' | 'percentage' | 'fixed_amount'>('all')
  const [selectedStudioId, setSelectedStudioId] = useState<string>('')
  
  // Dialog states
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false)
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false)
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false)
  const [selectedDiscount, setSelectedDiscount] = useState<Discount | null>(null)
  const [isSubmitting, setIsSubmitting] = useState(false)

  // Hooks
  const { data: studios = [], isLoading: studiosLoading } = useStudios()

  // Form data
  const [formData, setFormData] = useState<DiscountFormData>({
    studio_id: '',
    code: '',
    name: '',
    description: '',
    type: 'percentage',
    value: 0,
    minimum_amount: 0,
    maximum_discount: 0,
    is_active: true,
    valid_from: '',
    valid_until: '',
    usage_limit: null,
    applies_to: 'all'
  })

  // Set default studio
  useEffect(() => {
    if (studios.length > 0 && !selectedStudioId) {
      setSelectedStudioId(studios[0].id)
    }
  }, [studios, selectedStudioId])

  // Load discounts
  const loadDiscounts = async () => {
    if (!selectedStudioId) return
    
    try {
      setIsLoading(true)
      const result = await getDiscountsAction(selectedStudioId)
      if (result.success && result.data) {
        setDiscounts(result.data)
        setFilteredDiscounts(result.data)
      } else {
        toast.error(result.error || 'Failed to load discounts')
      }
    } catch (error) {
      console.error('Error loading discounts:', error)
      toast.error('Failed to load discounts')
    } finally {
      setIsLoading(false)
    }
  }

  useEffect(() => {
    loadDiscounts()
  }, [selectedStudioId])

  // Filter discounts
  useEffect(() => {
    let filtered = discounts

    if (searchTerm) {
      filtered = filtered.filter(discount => 
        discount.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        (discount.code && discount.code.toLowerCase().includes(searchTerm.toLowerCase())) ||
        (discount.description && discount.description.toLowerCase().includes(searchTerm.toLowerCase()))
      )
    }

    if (statusFilter !== 'all') {
      filtered = filtered.filter(discount => 
        statusFilter === 'active' ? discount.is_active : !discount.is_active
      )
    }

    if (typeFilter !== 'all') {
      filtered = filtered.filter(discount => discount.type === typeFilter)
    }

    setFilteredDiscounts(filtered)
  }, [discounts, searchTerm, statusFilter, typeFilter])

  // Reset form
  const resetForm = () => {
    setFormData({
      studio_id: selectedStudioId,
      code: '',
      name: '',
      description: '',
      type: 'percentage',
      value: 0,
      minimum_amount: 0,
      maximum_discount: 0,
      is_active: true,
      valid_from: '',
      valid_until: '',
      usage_limit: null,
      applies_to: 'all'
    })
  }

  // Handle create
  const handleCreate = async () => {
    if (!formData.name || formData.value <= 0) {
      toast.error('Please fill in all required fields')
      return
    }

    try {
      setIsSubmitting(true)
      
      const createData: CreateDiscountData = {
        studio_id: selectedStudioId,
        code: formData.code || undefined,
        name: formData.name,
        description: formData.description || undefined,
        type: formData.type,
        value: formData.value,
        minimum_amount: formData.minimum_amount,
        maximum_discount: formData.maximum_discount || undefined,
        is_active: formData.is_active,
        valid_from: formData.valid_from || undefined,
        valid_until: formData.valid_until || undefined,
        usage_limit: formData.usage_limit || undefined,
        applies_to: formData.applies_to
      }

      const result = await createDiscountAction(createData)
      if (result.success) {
        toast.success('Discount created successfully')
        setIsCreateDialogOpen(false)
        resetForm()
        loadDiscounts()
      } else {
        toast.error(result.error || 'Failed to create discount')
      }
    } catch (error) {
      console.error('Error creating discount:', error)
      toast.error('Failed to create discount')
    } finally {
      setIsSubmitting(false)
    }
  }

  // Handle edit
  const handleEdit = (discount: Discount) => {
    setSelectedDiscount(discount)
    setFormData({
      studio_id: discount.studio_id,
      code: discount.code || '',
      name: discount.name,
      description: discount.description || '',
      type: discount.type,
      value: discount.value,
      minimum_amount: discount.minimum_amount,
      maximum_discount: discount.maximum_discount || 0,
      is_active: discount.is_active,
      valid_from: discount.valid_from ? format(new Date(discount.valid_from), 'yyyy-MM-dd') : '',
      valid_until: discount.valid_until ? format(new Date(discount.valid_until), 'yyyy-MM-dd') : '',
      usage_limit: discount.usage_limit,
      applies_to: discount.applies_to
    })
    setIsEditDialogOpen(true)
  }

  // Handle update
  const handleUpdate = async () => {
    if (!selectedDiscount || !formData.name || formData.value <= 0) {
      toast.error('Please fill in all required fields')
      return
    }

    try {
      setIsSubmitting(true)

      const updateData: UpdateDiscountData = {
        code: formData.code || undefined,
        name: formData.name,
        description: formData.description || undefined,
        type: formData.type,
        value: formData.value,
        minimum_amount: formData.minimum_amount,
        maximum_discount: formData.maximum_discount || undefined,
        is_active: formData.is_active,
        valid_from: formData.valid_from || undefined,
        valid_until: formData.valid_until || undefined,
        usage_limit: formData.usage_limit || undefined,
        applies_to: formData.applies_to
      }

      const result = await updateDiscountAction(selectedDiscount.id, updateData)
      if (result.success) {
        toast.success('Discount updated successfully')
        setIsEditDialogOpen(false)
        setSelectedDiscount(null)
        resetForm()
        loadDiscounts()
      } else {
        toast.error(result.error || 'Failed to update discount')
      }
    } catch (error) {
      console.error('Error updating discount:', error)
      toast.error('Failed to update discount')
    } finally {
      setIsSubmitting(false)
    }
  }

  // Handle delete
  const handleDelete = async () => {
    if (!selectedDiscount) return

    try {
      setIsSubmitting(true)
      const result = await deleteDiscountAction(selectedDiscount.id)
      if (result.success) {
        toast.success('Discount deleted successfully')
        setIsDeleteDialogOpen(false)
        setSelectedDiscount(null)
        loadDiscounts()
      } else {
        toast.error(result.error || 'Failed to delete discount')
      }
    } catch (error) {
      console.error('Error deleting discount:', error)
      toast.error('Failed to delete discount')
    } finally {
      setIsSubmitting(false)
    }
  }

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('id-ID', {
      style: 'currency',
      currency: 'IDR',
      minimumFractionDigits: 0,
    }).format(amount)
  }

  const isDiscountExpired = (discount: Discount) => {
    if (!discount.valid_until) return false
    return new Date(discount.valid_until) < new Date()
  }

  const isDiscountUsageLimitReached = (discount: Discount) => {
    if (!discount.usage_limit) return false
    return discount.used_count >= discount.usage_limit
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold">Discount Management</h1>
          <p className="text-muted-foreground">
            Create and manage discount codes for your studio
          </p>
        </div>
        <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
          <DialogTrigger asChild>
            <Button onClick={() => resetForm()} disabled={!selectedStudioId}>
              <Plus className="h-4 w-4 mr-2" />
              Create Discount
            </Button>
          </DialogTrigger>
        </Dialog>
      </div>

      {/* Studio Selection */}
      <Card>
        <CardContent className="pt-6">
          <div className="flex flex-col md:flex-row gap-4 items-start md:items-center">
            <div className="space-y-2">
              <Label className="text-sm font-medium">Pilih Studio</Label>
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
                    {discounts.length}
                  </div>
                  <div className="text-sm text-muted-foreground">Total Discounts</div>
                </div>
                <div className="text-center">
                  <div className="text-2xl font-bold text-green-600">
                    {discounts.filter(d => d.is_active).length}
                  </div>
                  <div className="text-sm text-muted-foreground">Active</div>
                </div>
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Stats Cards */}
      {selectedStudioId && (
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Discounts</CardTitle>
            <Tag className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{discounts.length}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Active Discounts</CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {discounts.filter(d => d.is_active).length}
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Expired</CardTitle>
            <Calendar className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {discounts.filter(d => isDiscountExpired(d)).length}
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Usage</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {discounts.reduce((sum, d) => sum + d.used_count, 0)}
            </div>
          </CardContent>
        </Card>
        </div>
      )}

      {/* Filters */}
      {selectedStudioId && (
        <Card>
        <CardContent className="pt-6">
          <div className="flex flex-col sm:flex-row gap-4">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
              <Input
                placeholder="Search discounts..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>
            <Select value={statusFilter} onValueChange={(value: any) => setStatusFilter(value)}>
              <SelectTrigger className="w-[180px]">
                <SelectValue placeholder="Filter by status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Status</SelectItem>
                <SelectItem value="active">Active</SelectItem>
                <SelectItem value="inactive">Inactive</SelectItem>
              </SelectContent>
            </Select>
            <Select value={typeFilter} onValueChange={(value: any) => setTypeFilter(value)}>
              <SelectTrigger className="w-[180px]">
                <SelectValue placeholder="Filter by type" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Types</SelectItem>
                <SelectItem value="percentage">Percentage</SelectItem>
                <SelectItem value="fixed_amount">Fixed Amount</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardContent>
        </Card>
      )}

      {/* Discounts Table */}
      {!selectedStudioId ? (
        <Card>
          <CardContent className="pt-6">
            <div className="text-center text-muted-foreground">
              Pilih studio terlebih dahulu untuk melihat data discount
            </div>
          </CardContent>
        </Card>
      ) : (
        <Card>
        <CardContent>
          {isLoading ? (
            <div className="flex justify-center items-center py-8">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Name</TableHead>
                  <TableHead>Code</TableHead>
                  <TableHead>Type</TableHead>
                  <TableHead>Value</TableHead>
                  <TableHead>Usage</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Valid Until</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredDiscounts.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={8} className="text-center py-8">
                      No discounts found
                    </TableCell>
                  </TableRow>
                ) : (
                  filteredDiscounts.map((discount) => (
                    <TableRow key={discount.id}>
                      <TableCell>
                        <div>
                          <div className="font-medium">{discount.name}</div>
                          {discount.description && (
                            <div className="text-sm text-muted-foreground">
                              {discount.description}
                            </div>
                          )}
                        </div>
                      </TableCell>
                      <TableCell>
                        {discount.code ? (
                          <Badge variant="outline">{discount.code}</Badge>
                        ) : (
                          <span className="text-muted-foreground">-</span>
                        )}
                      </TableCell>
                      <TableCell>
                        <Badge variant={discount.type === 'percentage' ? 'default' : 'secondary'}>
                          {discount.type === 'percentage' ? 'Percentage' : 'Fixed Amount'}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        {discount.type === 'percentage' 
                          ? `${discount.value}%`
                          : formatCurrency(discount.value)
                        }
                      </TableCell>
                      <TableCell>
                        <div className="text-sm">
                          {discount.used_count}
                          {discount.usage_limit && ` / ${discount.usage_limit}`}
                        </div>
                        {isDiscountUsageLimitReached(discount) && (
                          <Badge variant="destructive" className="text-xs">Limit Reached</Badge>
                        )}
                      </TableCell>
                      <TableCell>
                        <div className="flex flex-col gap-1">
                          <Badge 
                            variant={discount.is_active ? 'default' : 'secondary'}
                            className="w-fit"
                          >
                            {discount.is_active ? 'Active' : 'Inactive'}
                          </Badge>
                          {isDiscountExpired(discount) && (
                            <Badge variant="destructive" className="text-xs">Expired</Badge>
                          )}
                        </div>
                      </TableCell>
                      <TableCell>
                        {discount.valid_until 
                          ? format(new Date(discount.valid_until), 'dd MMM yyyy')
                          : 'No expiry'
                        }
                      </TableCell>
                      <TableCell className="text-right">
                        <div className="flex justify-end gap-2">
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => handleEdit(discount)}
                          >
                            <Edit className="h-4 w-4" />
                          </Button>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => {
                              setSelectedDiscount(discount)
                              setIsDeleteDialogOpen(true)
                            }}
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          )}
        </CardContent>
        </Card>
      )}

      {/* Create/Edit Dialog */}
      <Dialog open={isCreateDialogOpen || isEditDialogOpen} onOpenChange={(open) => {
        if (!open) {
          setIsCreateDialogOpen(false)
          setIsEditDialogOpen(false)
          setSelectedDiscount(null)
          resetForm()
        }
      }}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>
              {isEditDialogOpen ? 'Edit Discount' : 'Create New Discount'}
            </DialogTitle>
            <DialogDescription>
              {isEditDialogOpen 
                ? 'Update discount details below.' 
                : 'Fill in the details to create a new discount.'
              }
            </DialogDescription>
          </DialogHeader>

          <div className="grid gap-4 py-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="name">Name *</Label>
                <Input
                  id="name"
                  value={formData.name}
                  onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
                  placeholder="e.g., Summer Sale"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="code">Code (Optional)</Label>
                <Input
                  id="code"
                  value={formData.code}
                  onChange={(e) => setFormData(prev => ({ ...prev, code: e.target.value.toUpperCase() }))}
                  placeholder="e.g., SUMMER2024"
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="description">Description</Label>
              <Textarea
                id="description"
                value={formData.description}
                onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
                placeholder="Brief description of this discount"
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="type">Discount Type *</Label>
                <Select value={formData.type} onValueChange={(value: any) => setFormData(prev => ({ ...prev, type: value }))}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select type" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="percentage">Percentage</SelectItem>
                    <SelectItem value="fixed_amount">Fixed Amount</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label htmlFor="value">
                  {formData.type === 'percentage' ? 'Percentage (%)' : 'Amount (Rp)'} *
                </Label>
                <Input
                  id="value"
                  type="number"
                  value={formData.value}
                  onChange={(e) => setFormData(prev => ({ ...prev, value: Number(e.target.value) }))}
                  placeholder={formData.type === 'percentage' ? '10' : '50000'}
                  min="0"
                  max={formData.type === 'percentage' ? '100' : undefined}
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="minimum_amount">Minimum Amount (Rp)</Label>
                <Input
                  id="minimum_amount"
                  type="number"
                  value={formData.minimum_amount}
                  onChange={(e) => setFormData(prev => ({ ...prev, minimum_amount: Number(e.target.value) }))}
                  placeholder="0"
                  min="0"
                />
              </div>
              {formData.type === 'percentage' && (
                <div className="space-y-2">
                  <Label htmlFor="maximum_discount">Maximum Discount (Rp)</Label>
                  <Input
                    id="maximum_discount"
                    type="number"
                    value={formData.maximum_discount}
                    onChange={(e) => setFormData(prev => ({ ...prev, maximum_discount: Number(e.target.value) }))}
                    placeholder="100000"
                    min="0"
                  />
                </div>
              )}
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="valid_from">Valid From</Label>
                <Input
                  id="valid_from"
                  type="date"
                  value={formData.valid_from}
                  onChange={(e) => setFormData(prev => ({ ...prev, valid_from: e.target.value }))}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="valid_until">Valid Until</Label>
                <Input
                  id="valid_until"
                  type="date"
                  value={formData.valid_until}
                  onChange={(e) => setFormData(prev => ({ ...prev, valid_until: e.target.value }))}
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="usage_limit">Usage Limit</Label>
                <Input
                  id="usage_limit"
                  type="number"
                  value={formData.usage_limit || ''}
                  onChange={(e) => setFormData(prev => ({ 
                    ...prev, 
                    usage_limit: e.target.value ? Number(e.target.value) : null 
                  }))}
                  placeholder="Unlimited"
                  min="1"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="applies_to">Applies To</Label>
                <Select value={formData.applies_to} onValueChange={(value: any) => setFormData(prev => ({ ...prev, applies_to: value }))}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select scope" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Items</SelectItem>
                    <SelectItem value="packages">Packages Only</SelectItem>
                    <SelectItem value="addons">Add-ons Only</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="flex items-center space-x-2">
              <Checkbox
                id="is_active"
                checked={formData.is_active}
                onCheckedChange={(checked) => setFormData(prev => ({ ...prev, is_active: !!checked }))}
              />
              <Label htmlFor="is_active">Active</Label>
            </div>
          </div>

          <div className="flex justify-end gap-2">
            <Button
              variant="outline"
              onClick={() => {
                setIsCreateDialogOpen(false)
                setIsEditDialogOpen(false)
                setSelectedDiscount(null)
                resetForm()
              }}
            >
              Cancel
            </Button>
            <Button
              onClick={isEditDialogOpen ? handleUpdate : handleCreate}
              disabled={isSubmitting}
            >
              {isSubmitting ? 'Saving...' : isEditDialogOpen ? 'Update' : 'Create'}
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Delete Dialog */}
      <Dialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Delete Discount</DialogTitle>
            <DialogDescription>
              Are you sure you want to delete "{selectedDiscount?.name}"? 
              This action cannot be undone.
            </DialogDescription>
          </DialogHeader>
          <div className="flex justify-end gap-2">
            <Button
              variant="outline"
              onClick={() => {
                setIsDeleteDialogOpen(false)
                setSelectedDiscount(null)
              }}
            >
              Cancel
            </Button>
            <Button
              variant="destructive"
              onClick={handleDelete}
              disabled={isSubmitting}
            >
              {isSubmitting ? 'Deleting...' : 'Delete'}
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  )
}