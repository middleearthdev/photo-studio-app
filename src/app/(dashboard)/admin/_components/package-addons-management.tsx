"use client"

import { useState, useEffect } from "react"
import { 
  Search, 
  Plus, 
  X, 
  Package as PackageIcon,
  Puzzle,
  Tag,
  AlertCircle
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
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Label } from "@/components/ui/label"
import { Switch } from "@/components/ui/switch"
import { usePackages } from "@/hooks/use-packages"
import { useAddons, usePackageAddons, useAssignAddonToPackage, useRemoveAddonFromPackage } from "@/hooks/use-addons"
import { useStudios } from "@/hooks/use-studios"
import { type Addon } from "@/actions/addons"
import { type Package } from "@/actions/packages"

interface PackageAddon extends Addon {
  package_addon?: {
    is_included: boolean
    discount_percentage: number
    is_recommended: boolean
    display_order: number
    final_price?: number
  }
}

export function PackageAddonsManagement() {
  const [selectedStudioId, setSelectedStudioId] = useState<string>('')
  const [selectedPackageId, setSelectedPackageId] = useState<string>('')
  const [searchTerm, setSearchTerm] = useState('')
  const [categoryFilter, setCategoryFilter] = useState<string>('all')
  const [isAssignDialogOpen, setIsAssignDialogOpen] = useState(false)
  const [selectedAddon, setSelectedAddon] = useState<Addon | null>(null)
  const [assignOptions, setAssignOptions] = useState({
    is_included: false,
    discount_percentage: 0,
    is_recommended: false,
    display_order: 0
  })

  const { data: studios = [], isLoading: studiosLoading } = useStudios()
  const { data: packages = [], isLoading: packagesLoading } = usePackages(selectedStudioId)
  const { data: addons = [] } = useAddons(selectedStudioId)
  const { data: packageAddonsData = [], isLoading: packageAddonsLoading } = usePackageAddons(selectedPackageId)
  const assignAddonMutation = useAssignAddonToPackage()
  const removeAddonMutation = useRemoveAddonFromPackage()

  // Filter package addons based on search
  const packageAddons = packageAddonsData.filter(addon => 
    addon.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    (addon.description || '').toLowerCase().includes(searchTerm.toLowerCase())
  ) as PackageAddon[]

  // Set default studio
  useEffect(() => {
    if (studios.length > 0 && !selectedStudioId) {
      setSelectedStudioId(studios[0].id)
    }
  }, [studios, selectedStudioId])

  // Get available addons for assignment (not yet assigned to package)
  const availableAddons = addons.filter(addon => {
    const isAssigned = packageAddonsData.some(pa => pa.id === addon.id)
    const matchesSearch = addon.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         (addon.description || '').toLowerCase().includes(searchTerm.toLowerCase())
    const matchesCategory = categoryFilter === 'all' || 
                          (categoryFilter === 'uncategorized' && !addon.type) ||
                          addon.type === categoryFilter
    
    return !isAssigned && matchesSearch && matchesCategory
  })

  // Get grouped addons by type for categories
  const getAddonCategories = () => {
    const categories = new Set<string>()
    addons.forEach(addon => {
      if (addon.type) {
        categories.add(addon.type)
      }
    })
    return Array.from(categories)
  }


  const handleConfirmAssign = async () => {
    if (!selectedPackageId || !selectedAddon) return
    
    try {
      await assignAddonMutation.mutateAsync({
        packageId: selectedPackageId,
        addonId: selectedAddon.id,
        options: assignOptions
      })
      setIsAssignDialogOpen(false)
      // Reset form
      setSelectedAddon(null)
      setAssignOptions({
        is_included: false,
        discount_percentage: 0,
        is_recommended: false,
        display_order: 0
      })
    } catch (error) {
      console.error('Error assigning addon:', error)
    }
  }

  const handleRemoveAddon = async (addonId: string) => {
    if (!selectedPackageId) return
    
    try {
      await removeAddonMutation.mutateAsync({
        packageId: selectedPackageId,
        addonId: addonId
      })
    } catch (error) {
      console.error('Error removing addon:', error)
    }
  }

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('id-ID', {
      style: 'currency',
      currency: 'IDR',
      minimumFractionDigits: 0,
    }).format(amount)
  }

  const getAddonTypeInfo = (type?: string | null) => {
    if (!type) return { label: 'Uncategorized', color: 'bg-gray-100 text-gray-800' }
    
    const typeMap: Record<string, { label: string; color: string }> = {
      photography: { label: 'Photography', color: 'bg-blue-100 text-blue-800' },
      service: { label: 'Service', color: 'bg-gray-100 text-gray-800' },
      printing: { label: 'Printing', color: 'bg-purple-100 text-purple-800' },
      storage: { label: 'Storage', color: 'bg-indigo-100 text-indigo-800' },
      makeup: { label: 'Makeup', color: 'bg-pink-100 text-pink-800' },
      styling: { label: 'Styling', color: 'bg-rose-100 text-rose-800' },
      wardrobe: { label: 'Wardrobe', color: 'bg-orange-100 text-orange-800' },
      time: { label: 'Time', color: 'bg-green-100 text-green-800' },
      equipment: { label: 'Equipment', color: 'bg-slate-100 text-slate-800' },
      decoration: { label: 'Decoration', color: 'bg-emerald-100 text-emerald-800' },
      video: { label: 'Video', color: 'bg-red-100 text-red-800' },
    }
    
    return typeMap[type] || { label: type, color: 'bg-gray-100 text-gray-800' }
  }

  return (
    <div className="space-y-6">
      {/* Studio and Package Selection */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <PackageIcon className="h-5 w-5" />
            Manajemen Package-Addons
          </CardTitle>
          <CardDescription>
            Kelola hubungan antara paket dan add-ons
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Pilih Studio</Label>
              <Select value={selectedStudioId} onValueChange={setSelectedStudioId} disabled={studiosLoading}>
                <SelectTrigger>
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
            
            <div className="space-y-2">
              <Label>Pilih Paket</Label>
              <Select 
                value={selectedPackageId} 
                onValueChange={setSelectedPackageId} 
                disabled={packagesLoading || !selectedStudioId}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Pilih paket..." />
                </SelectTrigger>
                <SelectContent>
                  {packages.map((pkg) => (
                    <SelectItem key={pkg.id} value={pkg.id}>
                      {pkg.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Package Addons List */}
      {selectedPackageId && (
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle className="flex items-center gap-2">
                  <Puzzle className="h-5 w-5" />
                  Add-ons untuk Paket
                </CardTitle>
                <CardDescription>
                  Add-ons yang telah ditetapkan untuk paket ini
                </CardDescription>
              </div>
              <Button onClick={() => setIsAssignDialogOpen(true)}>
                <Plus className="h-4 w-4 mr-2" />
                Tambah Add-on
              </Button>
            </div>
          </CardHeader>
          <CardContent>
            {packageAddonsLoading ? (
              <div className="text-center py-8 text-muted-foreground">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900 mx-auto mb-2"></div>
                <p>Memuat data add-ons...</p>
              </div>
            ) : packageAddons.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground">
                <Puzzle className="h-12 w-12 mx-auto mb-2" />
                <p>Belum ada add-ons yang ditetapkan untuk paket ini</p>
              </div>
            ) : (
              <div className="rounded-md border">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Add-on</TableHead>
                      <TableHead>Tipe</TableHead>
                      <TableHead>Harga</TableHead>
                      <TableHead>Pengaturan</TableHead>
                      <TableHead className="w-[100px]">Aksi</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {packageAddons.map((addon) => {
                      const typeInfo = getAddonTypeInfo(addon.type)
                      const packageAddonData = addon.package_addon
                      const finalPrice = packageAddonData?.is_included ? 0 : 
                        packageAddonData?.discount_percentage ? 
                          addon.price * (1 - packageAddonData.discount_percentage / 100) :
                          addon.price
                      
                      return (
                        <TableRow key={addon.id}>
                          <TableCell>
                            <div>
                              <div className="font-medium flex items-center gap-2">
                                {addon.name}
                                {packageAddonData?.is_recommended && (
                                  <Badge variant="outline" className="text-xs border-amber-300 text-amber-600">
                                    ⭐ Recommended
                                  </Badge>
                                )}
                              </div>
                              {addon.description && (
                                <div className="text-sm text-muted-foreground line-clamp-1">
                                  {addon.description}
                                </div>
                              )}
                            </div>
                          </TableCell>
                          <TableCell>
                            <Badge className={typeInfo.color}>
                              {typeInfo.label}
                            </Badge>
                          </TableCell>
                          <TableCell>
                            <div>
                              {packageAddonData?.is_included ? (
                                <div>
                                  <div className="font-medium text-green-600">Included</div>
                                  <div className="text-xs text-muted-foreground line-through">
                                    {formatCurrency(addon.price)}
                                  </div>
                                </div>
                              ) : (
                                <div>
                                  <div className="font-medium">{formatCurrency(finalPrice)}</div>
                                  {(packageAddonData?.discount_percentage || 0) > 0 && (
                                    <div className="text-xs text-muted-foreground">
                                      <span className="line-through">{formatCurrency(addon.price)}</span>
                                      <span className="text-green-600 ml-1">(-{packageAddonData?.discount_percentage || 0}%)</span>
                                    </div>
                                  )}
                                </div>
                              )}
                            </div>
                          </TableCell>
                          <TableCell>
                            <div className="space-y-1">
                              {packageAddonData?.is_included && (
                                <Badge variant="secondary" className="text-xs bg-green-50 text-green-700">
                                  ✓ Included
                                </Badge>
                              )}
                              <div className="text-xs text-muted-foreground">
                                Order: {packageAddonData?.display_order || 0}
                              </div>
                            </div>
                          </TableCell>
                          <TableCell>
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => handleRemoveAddon(addon.id)}
                              className="text-red-600 hover:text-red-700"
                              disabled={removeAddonMutation.isPending}
                            >
                              {removeAddonMutation.isPending ? (
                                <div className="h-4 w-4 animate-spin rounded-full border-2 border-current border-t-transparent"></div>
                              ) : (
                                <X className="h-4 w-4" />
                              )}
                            </Button>
                          </TableCell>
                        </TableRow>
                      )
                    })}
                  </TableBody>
                </Table>
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {/* Assign Addon Dialog */}
      <Dialog open={isAssignDialogOpen} onOpenChange={setIsAssignDialogOpen}>
        <DialogContent className="max-w-4xl max-h-[90vh] w-[95vw] flex flex-col p-0 overflow-hidden">
          <DialogHeader className="px-6 py-4 border-b flex-shrink-0">
            <DialogTitle className="flex items-center gap-2">
              <Puzzle className="h-5 w-5" />
              Tambah Add-on ke Paket
            </DialogTitle>
            <DialogDescription>
              Pilih add-on dan atur pengaturannya untuk paket ini
            </DialogDescription>
          </DialogHeader>
          
          <div className="flex-1 overflow-y-auto scroll-smooth px-6 py-4 space-y-4">
            {/* Addon Selection */}
            <div className="space-y-2 flex-shrink-0">
              <Label>Cari Add-on</Label>
              <div className="flex flex-col sm:flex-row gap-2">
                <div className="relative flex-1">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
                  <Input
                    placeholder="Cari add-on..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="pl-10"
                  />
                </div>
                
                <Select value={categoryFilter} onValueChange={setCategoryFilter}>
                  <SelectTrigger className="w-full sm:w-[180px]">
                    <Tag className="h-4 w-4 mr-2" />
                    <SelectValue placeholder="Semua Kategori" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Semua Kategori</SelectItem>
                    <SelectItem value="uncategorized">Tanpa Kategori</SelectItem>
                    {getAddonCategories().map((category) => (
                      <SelectItem key={category} value={category}>
                        {category}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
            
            {/* Available Addons List */}
            <div className="border rounded-md">
              <div className="max-h-80 overflow-y-auto scroll-smooth">
              {availableAddons.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground">
                  <AlertCircle className="h-8 w-8 mx-auto mb-2" />
                  <p>Tidak ada add-ons yang tersedia</p>
                </div>
              ) : (
                <div className="min-w-full">
                  <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Add-on</TableHead>
                      <TableHead>Harga</TableHead>
                      <TableHead className="w-[100px]">Aksi</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {availableAddons.map((addon) => {
                      const typeInfo = getAddonTypeInfo(addon.type)
                      return (
                        <TableRow key={addon.id}>
                          <TableCell>
                            <div>
                              <div className="font-medium flex items-center gap-2">
                                {addon.name}
                                <Badge className={`text-xs ${typeInfo.color}`}>
                                  {typeInfo.label}
                                </Badge>
                              </div>
                              {addon.description && (
                                <div className="text-sm text-muted-foreground line-clamp-1">
                                  {addon.description}
                                </div>
                              )}
                            </div>
                          </TableCell>
                          <TableCell>
                            <div className="font-medium">{formatCurrency(addon.price)}</div>
                          </TableCell>
                          <TableCell>
                            <Button
                              size="sm"
                              onClick={() => {
                                setSelectedAddon(addon)
                                setAssignOptions({
                                  is_included: false,
                                  discount_percentage: 0,
                                  is_recommended: false,
                                  display_order: 0
                                })
                              }}
                            >
                              <Plus className="h-4 w-4 mr-2" />
                              Pilih
                            </Button>
                          </TableCell>
                        </TableRow>
                      )
                    })}
                  </TableBody>
                  </Table>
                </div>
              )}
              </div>
            </div>
            
            {/* Assignment Options (when addon is selected) */}
            {selectedAddon && (
              <div className="space-y-4 border-t pt-4">
                <h3 className="font-medium text-sm">Pengaturan Add-on: {selectedAddon.name}</h3>
                
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-3">
                  <div className="space-y-1">
                    <Label htmlFor="discount_percentage" className="text-xs">Diskon (%)</Label>
                    <Input
                      id="discount_percentage"
                      type="number"
                      min="0"
                      max="100"
                      value={assignOptions.discount_percentage}
                      onChange={(e) => setAssignOptions({
                        ...assignOptions,
                        discount_percentage: Number(e.target.value)
                      })}
                      className="h-8"
                    />
                  </div>
                  
                  <div className="space-y-1">
                    <Label htmlFor="display_order" className="text-xs">Urutan Tampil</Label>
                    <Input
                      id="display_order"
                      type="number"
                      min="0"
                      value={assignOptions.display_order}
                      onChange={(e) => setAssignOptions({
                        ...assignOptions,
                        display_order: Number(e.target.value)
                      })}
                      className="h-8"
                    />
                  </div>
                </div>
                
                <div className="flex flex-col sm:flex-row gap-3">
                  <div className="flex items-center space-x-2">
                    <Switch
                      id="is_included"
                      checked={assignOptions.is_included}
                      onCheckedChange={(checked) => setAssignOptions({
                        ...assignOptions,
                        is_included: checked
                      })}
                    />
                    <Label htmlFor="is_included" className="text-xs">Included in Package Price</Label>
                  </div>
                  
                  <div className="flex items-center space-x-2">
                    <Switch
                      id="is_recommended"
                      checked={assignOptions.is_recommended}
                      onCheckedChange={(checked) => setAssignOptions({
                        ...assignOptions,
                        is_recommended: checked
                      })}
                    />
                    <Label htmlFor="is_recommended" className="text-xs">Recommended</Label>
                  </div>
                </div>
              </div>
            )}
          </div>
          
          <DialogFooter className="flex-shrink-0 border-t px-6 py-4">
            <Button
              variant="outline"
              onClick={() => setIsAssignDialogOpen(false)}
              className="sm:w-auto w-full"
            >
              Batal
            </Button>
            <Button
              onClick={handleConfirmAssign}
              disabled={!selectedAddon || assignAddonMutation.isPending}
              className="sm:w-auto w-full"
            >
              {assignAddonMutation.isPending && (
                <div className="mr-2 h-4 w-4 animate-spin rounded-full border-2 border-current border-t-transparent"></div>
              )}
              Tambah ke Paket
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}