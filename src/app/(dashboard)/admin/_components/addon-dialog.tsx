"use client"

import { useState, useEffect } from "react"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import * as z from "zod"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { Textarea } from "@/components/ui/textarea"
import { Switch } from "@/components/ui/switch"
import { useCreateAddon, useUpdateAddon } from "@/hooks/use-addons"
import { useFacilities } from "@/hooks/use-facilities"
import { type Addon } from "@/actions/addons"
import { ADDON_TYPES } from "@/lib/constants/addon-types"
import { Loader2, AlertCircle, Building2, Package, Settings } from "lucide-react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion"

const formSchema = z.object({
  name: z.string().min(1, "Nama add-on wajib diisi"),
  description: z.string().optional(),
  price: z.number().min(0, "Harga tidak boleh negatif"),
  pricing_type: z.enum(['per_item', 'per_hour']),
  hourly_rate: z.number().min(0, "Tarif per jam tidak boleh negatif").optional(),
  type: z.enum([
    'photography', 'service', 'printing', 'storage', 'makeup',
    'styling', 'wardrobe', 'time', 'equipment', 'decoration', 'video'
  ]),
  max_quantity: z.number().min(1, "Maksimal quantity minimal 1"),
  facility_id: z.string().optional(),
  is_conditional: z.boolean(),
  conditional_logic: z.string().optional(),
  is_active: z.boolean(),
})

type FormData = z.infer<typeof formSchema>

interface AddonDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  addonData?: Addon | null
  onAddonSaved: () => void
  studioId: string
}

export function AddonDialog({
  open,
  onOpenChange,
  addonData,
  onAddonSaved,
  studioId
}: AddonDialogProps) {
  const [isSubmitting, setIsSubmitting] = useState(false)
  const { data: facilities = [] } = useFacilities(studioId)
  const createAddonMutation = useCreateAddon()
  const updateAddonMutation = useUpdateAddon()

  const form = useForm<FormData>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      name: "",
      description: "",
      price: 0,
      pricing_type: "per_item",
      hourly_rate: 0,
      type: "photography",
      max_quantity: 1,
      facility_id: "general",
      is_conditional: false,
      conditional_logic: "",
      is_active: true,
    },
  })

  // Reset form when dialog opens/closes or addon data changes
  useEffect(() => {
    if (open) {
      if (addonData) {
        // Edit mode
        form.reset({
          name: addonData.name,
          description: addonData.description || "",
          price: addonData.price,
          pricing_type: (addonData.pricing_type as 'per_item' | 'per_hour') || "per_item",
          hourly_rate: addonData.hourly_rate || 0,
          type: (addonData.type as FormData['type']) || "photography",
          max_quantity: addonData.max_quantity || 1,
          facility_id: addonData.facility_id || "general",
          is_conditional: addonData.is_conditional || false,
          conditional_logic: JSON.stringify(addonData.conditional_logic, null, 2),
          is_active: addonData.is_active || true,
        })
      } else {
        // Create mode
        form.reset({
          name: "",
          description: "",
          price: 0,
          pricing_type: "per_item",
          hourly_rate: 0,
          type: "photography",
          max_quantity: 1,
          facility_id: "general",
          is_conditional: false,
          conditional_logic: "",
          is_active: true,
        })
      }
    }
  }, [open, addonData, form])

  const onSubmit = async (values: FormData) => {
    setIsSubmitting(true)
    try {
      let conditionalLogic = {}

      if (values.is_conditional && values.conditional_logic) {
        try {
          conditionalLogic = JSON.parse(values.conditional_logic)
        } catch (error) {
          console.warn("Invalid JSON for conditional logic, using empty object")
        }
      }

      if (addonData) {
        // Update existing addon
        await updateAddonMutation.mutateAsync({
          id: addonData.id,
          data: {
            name: values.name,
            description: values.description || undefined,
            price: values.price,
            pricing_type: values.pricing_type,
            hourly_rate: values.pricing_type === 'per_hour' ? values.hourly_rate : undefined,
            type: values.type,
            max_quantity: values.max_quantity,
            facility_id: values.facility_id === "general" ? undefined : values.facility_id,
            is_conditional: values.is_conditional,
            conditional_logic: conditionalLogic,
            is_active: values.is_active,
          }
        })
      } else {
        // Create new addon
        await createAddonMutation.mutateAsync({
          studio_id: studioId,
          name: values.name,
          description: values.description || undefined,
          price: values.price,
          pricing_type: values.pricing_type,
          hourly_rate: values.pricing_type === 'per_hour' ? values.hourly_rate : undefined,
          type: values.type,
          max_quantity: values.max_quantity,
          facility_id: values.facility_id === "general" ? undefined : values.facility_id,
          is_conditional: values.is_conditional,
          conditional_logic: conditionalLogic,
          is_active: values.is_active,
        })
      }

      onAddonSaved()
      onOpenChange(false)
    } catch (error) {
      console.error("Error saving addon:", error)
    } finally {
      setIsSubmitting(false)
    }
  }

  const selectedType = form.watch("type")
  const isConditional = form.watch("is_conditional")
  const pricingType = form.watch("pricing_type")
  const selectedTypeInfo = ADDON_TYPES.find(t => t.value === selectedType) || ADDON_TYPES[0]

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[600px] max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Package className="h-5 w-5" />
            {addonData ? "Edit Add-on" : "Tambah Add-on Baru"}
          </DialogTitle>
          <DialogDescription>
            {addonData
              ? "Perbarui informasi add-on yang ada"
              : "Buat add-on baru untuk layanan tambahan studio"
            }
          </DialogDescription>
        </DialogHeader>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
            {/* Basic Information */}
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-base flex items-center gap-2">
                  <Settings className="h-4 w-4" />
                  Informasi Dasar
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <FormField
                  control={form.control}
                  name="name"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Nama Add-on *</FormLabel>
                      <FormControl>
                        <Input placeholder="Contoh: Extra Edited Photos" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="description"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Deskripsi</FormLabel>
                      <FormControl>
                        <Textarea
                          placeholder="Deskripsi detail tentang add-on ini..."
                          className="min-h-[80px]"
                          {...field}
                        />
                      </FormControl>
                      <FormDescription>
                        Jelaskan detail add-on untuk membantu customer memahami layanan
                      </FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="pricing_type"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Tipe Harga *</FormLabel>
                      <Select onValueChange={field.onChange} value={field.value}>
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="Pilih tipe harga" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          <SelectItem value="per_item">Per Item</SelectItem>
                          <SelectItem value="per_hour">Per Jam</SelectItem>
                        </SelectContent>
                      </Select>
                      <FormDescription>
                        Pilih "Per Jam" untuk add-on yang disewa per jam (seperti Make Up)
                      </FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <div className="grid grid-cols-2 gap-4">
                  <FormField
                    control={form.control}
                    name="price"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>{pricingType === 'per_hour' ? 'Harga Default (IDR)' : 'Harga (IDR) *'}</FormLabel>
                        <FormControl>
                          <Input
                            type="number"
                            min="0"
                            placeholder="50000"
                            {...field}
                            onChange={(e) => field.onChange(Number(e.target.value))}
                          />
                        </FormControl>
                        <FormDescription className="text-xs">
                          {pricingType === 'per_hour' ? 'Harga default untuk tampilan katalog' : ''}
                        </FormDescription>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  {pricingType === 'per_hour' ? (
                    <FormField
                      control={form.control}
                      name="hourly_rate"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Tarif Per Jam (IDR) *</FormLabel>
                          <FormControl>
                            <Input
                              type="number"
                              min="0"
                              placeholder="100000"
                              {...field}
                              onChange={(e) => field.onChange(Number(e.target.value))}
                            />
                          </FormControl>
                          <FormDescription className="text-xs">
                            Tarif yang dikenakan per jam
                          </FormDescription>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  ) : (
                    <FormField
                      control={form.control}
                      name="max_quantity"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Maksimal Quantity *</FormLabel>
                          <FormControl>
                            <Input
                              type="number"
                              min="1"
                              placeholder="10"
                              {...field}
                              onChange={(e) => field.onChange(Number(e.target.value))}
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  )}
                </div>
              </CardContent>
            </Card>

            {/* Category & Facility */}
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-base flex items-center gap-2">
                  <Building2 className="h-4 w-4" />
                  Kategori & Fasilitas
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <FormField
                  control={form.control}
                  name="type"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Tipe Add-on *</FormLabel>
                      <Select onValueChange={field.onChange} defaultValue={field.value}>
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="Pilih tipe add-on" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          {ADDON_TYPES.map((type) => (
                            <SelectItem key={type.value} value={type.value}>
                              <div className="flex items-center space-x-2">
                                <span className="font-medium">{type.label}</span>
                                <span className="text-xs text-muted-foreground">
                                  {type.description}
                                </span>
                              </div>
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      {selectedTypeInfo && (
                        <FormDescription>
                          {selectedTypeInfo.description}
                        </FormDescription>
                      )}
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="facility_id"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Fasilitas Terkait {pricingType === 'per_hour' && '*'}</FormLabel>
                      <Select onValueChange={field.onChange} defaultValue={field.value}>
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="Pilih fasilitas (opsional)" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          <SelectItem value="general">
                            <span className="text-muted-foreground">General/Umum</span>
                          </SelectItem>
                          {facilities.map((facility) => (
                            <SelectItem key={facility.id} value={facility.id}>
                              {facility.name}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      <FormDescription>
                        {pricingType === 'per_hour' ? (
                          <span className="text-orange-600 font-medium">
                            <AlertCircle className="h-3 w-3 inline mr-1" />
                            Wajib pilih fasilitas untuk add-on per jam agar bisa dicek ketersediaannya
                          </span>
                        ) : (
                          'Pilih fasilitas jika add-on ini hanya tersedia untuk fasilitas tertentu'
                        )}
                      </FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </CardContent>
            </Card>

            {/* Advanced Settings */}
            <Accordion type="single" collapsible className="w-full">
              <AccordionItem value="advanced">
                <AccordionTrigger className="text-base font-medium">
                  Pengaturan Lanjutan
                </AccordionTrigger>
                <AccordionContent>
                  <Card>
                    <CardContent className="pt-6 space-y-4">
                      <FormField
                        control={form.control}
                        name="is_conditional"
                        render={({ field }) => (
                          <FormItem className="flex items-center justify-between rounded-lg border p-4">
                            <div className="space-y-0.5">
                              <FormLabel className="text-base flex items-center gap-2">
                                <AlertCircle className="h-4 w-4" />
                                Conditional Logic
                              </FormLabel>
                              <FormDescription>
                                Add-on ini memerlukan kondisi khusus untuk ditampilkan
                              </FormDescription>
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

                      {isConditional && (
                        <FormField
                          control={form.control}
                          name="conditional_logic"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Conditional Logic (JSON)</FormLabel>
                              <FormControl>
                                <Textarea
                                  placeholder='{"required_facility": "facility-id", "min_duration": 120}'
                                  className="min-h-[100px] font-mono text-sm"
                                  {...field}
                                />
                              </FormControl>
                              <FormDescription>
                                Format JSON untuk kondisi tampil add-on. Contoh: minimal durasi, fasilitas tertentu, dll.
                              </FormDescription>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                      )}

                      <FormField
                        control={form.control}
                        name="is_active"
                        render={({ field }) => (
                          <FormItem className="flex items-center justify-between rounded-lg border p-4">
                            <div className="space-y-0.5">
                              <FormLabel className="text-base">Status Aktif</FormLabel>
                              <FormDescription>
                                Add-on akan tersedia untuk customer jika diaktifkan
                              </FormDescription>
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
                    </CardContent>
                  </Card>
                </AccordionContent>
              </AccordionItem>
            </Accordion>

            <DialogFooter>
              <Button
                type="button"
                variant="outline"
                onClick={() => onOpenChange(false)}
                disabled={isSubmitting}
              >
                Batal
              </Button>
              <Button
                type="submit"
                disabled={isSubmitting}
              >
                {isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                {addonData ? "Perbarui Add-on" : "Buat Add-on"}
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  )
}