"use client"

import { useEffect, useState, useCallback } from "react"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { z } from "zod"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
  FormDescription,
} from "@/components/ui/form"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { Textarea } from "@/components/ui/textarea"
import { Switch } from "@/components/ui/switch"
import { Card } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Separator } from "@/components/ui/separator"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { useCreatePackage, useUpdatePackage, usePackageCategories } from "@/hooks/use-packages"
import { useFacilities } from "@/hooks/use-facilities"
import { type Package } from "@/actions/packages"
import { Plus, Minus, X, Star, Crown, Gem, Sparkles, Package as PackageIcon } from "lucide-react"

const packageSchema = z.object({
  name: z.string().min(2, "Nama paket minimal 2 karakter"),
  description: z.string().optional(),
  category_id: z.string().optional(),
  duration_minutes: z.number().min(15, "Durasi minimal 15 menit").max(1440, "Durasi maksimal 24 jam"),
  price: z.number().min(1000, "Harga minimal Rp 1,000"),
  dp_percentage: z.number().min(10, "DP minimal 10%").max(100, "DP maksimal 100%"),
  max_photos: z.number().min(1, "Minimal 1 foto").optional(),
  max_edited_photos: z.number().min(0, "Minimal 0 foto edited").optional(),
  is_popular: z.boolean().optional(),
  is_active: z.boolean().optional(),
  includes: z.array(z.string()).optional(),
  facility_ids: z.array(z.string()).optional(),
})

type PackageFormValues = z.infer<typeof packageSchema>

interface PackageDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  packageData: (Package & { facility_ids?: string[] }) | null
  onPackageSaved: () => void
  studioId: string
}

const packageTypes = [
  { value: 'basic', label: 'Basic', icon: PackageIcon, color: 'text-blue-600 bg-blue-50' },
  { value: 'premium', label: 'Premium', icon: Star, color: 'text-purple-600 bg-purple-50' },
  { value: 'luxury', label: 'Luxury', icon: Crown, color: 'text-amber-600 bg-amber-50' },
  { value: 'custom', label: 'Custom', icon: Gem, color: 'text-emerald-600 bg-emerald-50' },
]

const defaultFormValues = {
  name: "",
  description: "",
  category_id: undefined,
  duration_minutes: 60,
  price: 100000,
  dp_percentage: 30,
  max_photos: 50,
  max_edited_photos: 10,
  is_popular: false,
  is_active: true,
  includes: [] as string[],
  facility_ids: [] as string[],
}

export function PackageDialog({ open, onOpenChange, packageData, onPackageSaved, studioId }: PackageDialogProps) {
  const isEdit = !!packageData
  const [includeItems, setIncludeItems] = useState<string[]>([])
  const [newIncludeItem, setNewIncludeItem] = useState('')

  const createPackageMutation = useCreatePackage()
  const updatePackageMutation = useUpdatePackage()
  const { data: categories = [], isLoading: categoriesLoading } = usePackageCategories(studioId)
  const { data: facilities = [], isLoading: facilitiesLoading } = useFacilities(studioId)

  const form = useForm<PackageFormValues>({
    resolver: zodResolver(packageSchema),
    defaultValues: defaultFormValues,
  })

  useEffect(() => {
    if (packageData) {
      const includes = Array.isArray(packageData.includes) ? packageData.includes : []
      setIncludeItems(includes)
      
      const facilityIds = packageData.facility_ids || []
      
      form.reset({
        name: packageData.name || "",
        description: packageData.description || "",
        category_id: packageData.category_id || "uncategorized",
        duration_minutes: packageData.duration_minutes || 60,
        price: packageData.price || 100000,
        dp_percentage: packageData.dp_percentage || 30,
        max_photos: packageData.max_photos || undefined,
        max_edited_photos: packageData.max_edited_photos || undefined,
        is_popular: packageData.is_popular,
        is_active: packageData.is_active,
        includes: includes,
        facility_ids: facilityIds,
      })
    } else {
      setIncludeItems([])
      form.reset({
        ...defaultFormValues,
        category_id: "uncategorized",
      })
    }
  }, [packageData])

  // Stable facility toggle handler
  const toggleFacility = useCallback((facilityId: string, currentValue: string[], onChange: (value: string[]) => void) => {
    const isCurrentlySelected = currentValue.includes(facilityId)
    const updated = isCurrentlySelected
      ? currentValue.filter(id => id !== facilityId)
      : [...currentValue, facilityId]
    onChange(updated)
  }, [])

  const addIncludeItem = () => {
    if (newIncludeItem.trim() && !includeItems.includes(newIncludeItem.trim())) {
      const updatedItems = [...includeItems, newIncludeItem.trim()]
      setIncludeItems(updatedItems)
      form.setValue('includes', updatedItems)
      setNewIncludeItem('')
    }
  }

  const removeIncludeItem = (index: number) => {
    const updatedItems = includeItems.filter((_, i) => i !== index)
    setIncludeItems(updatedItems)
    form.setValue('includes', updatedItems)
  }

  const onSubmit = async (data: PackageFormValues) => {
    const submitData = {
      ...data,
      studio_id: studioId,
      includes: includeItems,
      category_id: data.category_id === "uncategorized" ? undefined : data.category_id,
    }

    if (isEdit) {
      updatePackageMutation.mutate(
        {
          packageId: packageData!.id,
          packageData: submitData
        },
        {
          onSuccess: () => {
            onPackageSaved()
            onOpenChange(false)
          }
        }
      )
    } else {
      createPackageMutation.mutate(
        submitData,
        {
          onSuccess: () => {
            onPackageSaved()
            onOpenChange(false)
          }
        }
      )
    }
  }

  const isLoading = createPackageMutation.isPending || updatePackageMutation.isPending

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('id-ID', {
      style: 'currency',
      currency: 'IDR',
      minimumFractionDigits: 0,
    }).format(value)
  }

  const formatDuration = (minutes: number) => {
    const hours = Math.floor(minutes / 60)
    const mins = minutes % 60
    if (hours > 0 && mins > 0) {
      return `${hours} jam ${mins} menit`
    } else if (hours > 0) {
      return `${hours} jam`
    } else {
      return `${mins} menit`
    }
  }

  const price = form.watch('price') || 0
  const dpPercentage = form.watch('dp_percentage') || 0
  const duration = form.watch('duration_minutes') || 0
  const selectedFacilityIds = form.watch('facility_ids') || []

  const dpAmount = (price * dpPercentage) / 100

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[900px] max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <PackageIcon className="h-5 w-5" />
            {isEdit ? "Edit Paket" : "Tambah Paket Baru"}
          </DialogTitle>
          <DialogDescription>
            {isEdit 
              ? "Update informasi paket di bawah ini." 
              : "Buat paket foto baru untuk studio."
            }
          </DialogDescription>
        </DialogHeader>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
            {/* Basic Information */}
            <div className="space-y-4">
              <h3 className="text-lg font-medium flex items-center gap-2">
                <Sparkles className="h-5 w-5" />
                Informasi Dasar
              </h3>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <FormField
                  control={form.control}
                  name="name"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Nama Paket</FormLabel>
                      <FormControl>
                        <Input placeholder="Masukkan nama paket" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="category_id"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Kategori</FormLabel>
                      <Select onValueChange={field.onChange} value={field.value} disabled={categoriesLoading}>
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="Pilih kategori" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          <SelectItem value="uncategorized">Tanpa kategori</SelectItem>
                          {categories.map((category) => (
                            <SelectItem key={category.id} value={category.id}>
                              {category.name}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              <FormField
                control={form.control}
                name="description"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Deskripsi</FormLabel>
                    <FormControl>
                      <Textarea 
                        placeholder="Masukkan deskripsi paket" 
                        className="resize-none"
                        rows={3}
                        {...field} 
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <Separator />

            {/* Pricing & Duration */}
            <div className="space-y-4">
              <h3 className="text-lg font-medium">Harga & Durasi</h3>
              
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <FormField
                  control={form.control}
                  name="duration_minutes"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Durasi (menit)</FormLabel>
                      <FormControl>
                        <Input 
                          type="number" 
                          placeholder="60"
                          {...field}
                          onChange={(e) => field.onChange(parseInt(e.target.value) || 0)}
                        />
                      </FormControl>
                      <FormDescription className="text-xs">
                        {duration > 0 && `≈ ${formatDuration(duration)}`}
                      </FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="price"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Harga</FormLabel>
                      <FormControl>
                        <Input 
                          type="number" 
                          placeholder="100000"
                          {...field}
                          onChange={(e) => field.onChange(parseFloat(e.target.value) || 0)}
                        />
                      </FormControl>
                      <FormDescription className="text-xs">
                        {price > 0 && formatCurrency(price)}
                      </FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="dp_percentage"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>DP (%)</FormLabel>
                      <FormControl>
                        <Input 
                          type="number" 
                          placeholder="30"
                          {...field}
                          onChange={(e) => field.onChange(parseFloat(e.target.value) || 0)}
                        />
                      </FormControl>
                      <FormDescription className="text-xs">
                        {dpAmount > 0 && `≈ ${formatCurrency(dpAmount)}`}
                      </FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>
            </div>

            <Separator />

            {/* Photo Specifications */}
            <div className="space-y-4">
              <h3 className="text-lg font-medium">Spesifikasi Foto</h3>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <FormField
                  control={form.control}
                  name="max_photos"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Maksimal Foto Raw</FormLabel>
                      <FormControl>
                        <Input 
                          type="number" 
                          placeholder="50"
                          {...field}
                          onChange={(e) => field.onChange(parseInt(e.target.value) || undefined)}
                        />
                      </FormControl>
                      <FormDescription className="text-xs">
                        Total foto yang akan diambil
                      </FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="max_edited_photos"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Maksimal Foto Edited</FormLabel>
                      <FormControl>
                        <Input 
                          type="number" 
                          placeholder="10"
                          {...field}
                          onChange={(e) => field.onChange(parseInt(e.target.value) || undefined)}
                        />
                      </FormControl>
                      <FormDescription className="text-xs">
                        Foto yang akan diedit profesional
                      </FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>
            </div>

            <Separator />

            {/* Facilities Selection */}
            <div className="space-y-4">
              <h3 className="text-lg font-medium">Fasilitas Termasuk</h3>
              
              <FormField
                control={form.control}
                name="facility_ids"
                render={({ field }) => (
                  <FormItem>
                    <FormControl>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                        {facilitiesLoading ? (
                          <div className="col-span-full text-center text-muted-foreground">Loading facilities...</div>
                        ) : facilities.length === 0 ? (
                          <div className="col-span-full text-center text-muted-foreground">Belum ada fasilitas tersedia</div>
                        ) : (
                          facilities.filter(f => f.is_available).map((facility) => {
                            const isSelected = field.value?.includes(facility.id) || false

                            return (
                              <Card
                                key={facility.id}
                                className={`p-3 cursor-pointer transition-all hover:shadow-sm ${
                                  isSelected 
                                    ? 'ring-1 ring-primary border-primary bg-primary/5' 
                                    : 'hover:border-primary/30'
                                }`}
                                onClick={(e) => {
                                  e.preventDefault()
                                  e.stopPropagation()
                                  toggleFacility(facility.id, field.value || [], field.onChange)
                                }}
                              >
                                <div className="flex items-center space-x-2">
                                  <Switch
                                    checked={isSelected}
                                    onCheckedChange={() => toggleFacility(facility.id, field.value || [], field.onChange)}
                                    onClick={(e) => e.stopPropagation()}
                                  />
                                  <div className="flex-1">
                                    <span className={`text-sm font-medium ${isSelected ? 'text-primary' : ''}`}>
                                      {facility.name}
                                    </span>
                                    {facility.hourly_rate && (
                                      <div className="text-xs text-muted-foreground">
                                        {formatCurrency(facility.hourly_rate)}/jam
                                      </div>
                                    )}
                                  </div>
                                </div>
                              </Card>
                            )
                          })
                        )}
                      </div>
                    </FormControl>
                    <FormDescription>
                      Pilih fasilitas yang termasuk dalam paket ini. ({selectedFacilityIds.length} dipilih)
                    </FormDescription>
                  </FormItem>
                )}
              />
            </div>

            <Separator />

            {/* Package Includes */}
            <div className="space-y-4">
              <h3 className="text-lg font-medium">Fitur Yang Termasuk</h3>
              
              <div className="space-y-3">
                <div className="flex gap-2">
                  <Input
                    placeholder="Tambah fitur yang termasuk (contoh: 1 jam sesi foto)"
                    value={newIncludeItem}
                    onChange={(e) => setNewIncludeItem(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') {
                        e.preventDefault()
                        addIncludeItem()
                      }
                    }}
                  />
                  <Button 
                    type="button" 
                    onClick={addIncludeItem}
                    variant="outline"
                    size="icon"
                  >
                    <Plus className="h-4 w-4" />
                  </Button>
                </div>
                
                {includeItems.length > 0 && (
                  <div className="space-y-2">
                    {includeItems.map((item, index) => (
                      <div key={index} className="flex items-center justify-between bg-muted rounded-lg p-3">
                        <span className="text-sm">{item}</span>
                        <Button
                          type="button"
                          variant="ghost"
                          size="sm"
                          onClick={() => removeIncludeItem(index)}
                          className="h-auto p-1 text-red-600 hover:text-red-700 hover:bg-red-50"
                        >
                          <X className="h-4 w-4" />
                        </Button>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>

            <Separator />

            {/* Status Settings */}
            <div className="space-y-4">
              <h3 className="text-lg font-medium">Pengaturan Status</h3>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <FormField
                  control={form.control}
                  name="is_popular"
                  render={({ field }) => (
                    <FormItem className="flex flex-row items-center justify-between rounded-lg border p-4">
                      <div className="space-y-0.5">
                        <FormLabel className="text-base flex items-center gap-2">
                          <Star className="h-4 w-4" />
                          Paket Popular
                        </FormLabel>
                        <div className="text-sm text-muted-foreground">
                          Tampilkan sebagai paket unggulan
                        </div>
                      </div>
                      <FormControl>
                        <Switch
                          checked={field.value}
                          onCheckedChange={field.onChange}
                        />
                      </FormControl>
                    </FormItem>
                  )}
                />

                {isEdit && (
                  <FormField
                    control={form.control}
                    name="is_active"
                    render={({ field }) => (
                      <FormItem className="flex flex-row items-center justify-between rounded-lg border p-4">
                        <div className="space-y-0.5">
                          <FormLabel className="text-base">Status Aktif</FormLabel>
                          <div className="text-sm text-muted-foreground">
                            Paket dapat dibeli oleh customer
                          </div>
                        </div>
                        <FormControl>
                          <Switch
                            checked={field.value}
                            onCheckedChange={field.onChange}
                          />
                        </FormControl>
                      </FormItem>
                    )}
                  />
                )}
              </div>
            </div>

            <div className="flex justify-end space-x-2 pt-4">
              <Button
                type="button"
                variant="outline"
                onClick={() => onOpenChange(false)}
                disabled={isLoading}
              >
                Batal
              </Button>
              <Button type="submit" disabled={isLoading}>
                {isLoading ? (isEdit ? "Updating..." : "Creating...") : (isEdit ? "Update" : "Buat Paket")}
              </Button>
            </div>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  )
}