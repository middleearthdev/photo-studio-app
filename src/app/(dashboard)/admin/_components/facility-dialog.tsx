"use client"

import { useEffect, useState } from "react"
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
} from "@/components/ui/form"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { Textarea } from "@/components/ui/textarea"
import { Switch } from "@/components/ui/switch"
import { Card } from "@/components/ui/card"
import { useCreateFacility, useUpdateFacility } from "@/hooks/use-facilities"
import { type Facility } from "@/actions/facilities"
import {
  Camera,
  Video,
  Lightbulb,
  Palette,
  Music,
  Mic,
  MonitorSpeaker,
  Sofa,
  Car,
  Coffee,
  Wifi,
  AirVent,
  Sparkles,
  Building,
  TreePine,
  Waves,
  Sun,
  Moon,
  Star,
  Heart,
  Crown,
  Zap,
  Target,
  Award,
  Gift,
  Gem,
  Flame,
  Diamond,
} from "lucide-react"

const facilitySchema = z.object({
  name: z.string().min(2, "Nama fasilitas minimal 2 karakter"),
  description: z.string().optional(),
  capacity: z.number().min(1, "Kapasitas minimal 1 orang").max(100, "Kapasitas maksimal 100 orang"),
  hourly_rate: z.number().min(0, "Tarif per jam tidak boleh negatif").optional(),
  is_available: z.boolean().optional(),
  icon: z.string().optional(),
  equipment: z.record(z.string(), z.boolean()).optional(),
})

type FacilityFormValues = z.infer<typeof facilitySchema>

interface FacilityDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  facility: Facility | null
  onFacilitySaved: () => void
  studioId: string
}

const availableIcons = [
  { name: 'camera', icon: Camera, label: 'Kamera', category: 'photography' },
  { name: 'video', icon: Video, label: 'Video', category: 'photography' },
  { name: 'lightbulb', icon: Lightbulb, label: 'Pencahayaan', category: 'photography' },
  { name: 'palette', icon: Palette, label: 'Backdrop', category: 'photography' },
  { name: 'music', icon: Music, label: 'Audio System', category: 'audio' },
  { name: 'mic', icon: Mic, label: 'Microphone', category: 'audio' },
  { name: 'monitor-speaker', icon: MonitorSpeaker, label: 'Speaker', category: 'audio' },
  { name: 'sofa', icon: Sofa, label: 'Ruang Tunggu', category: 'comfort' },
  { name: 'car', icon: Car, label: 'Parkir', category: 'comfort' },
  { name: 'coffee', icon: Coffee, label: 'Refreshment', category: 'comfort' },
  { name: 'wifi', icon: Wifi, label: 'WiFi', category: 'technology' },
  { name: 'air-vent', icon: AirVent, label: 'AC', category: 'comfort' },
  { name: 'sparkles', icon: Sparkles, label: 'Premium', category: 'special' },
  { name: 'building', icon: Building, label: 'Indoor Studio', category: 'space' },
  { name: 'tree-pine', icon: TreePine, label: 'Outdoor', category: 'space' },
  { name: 'waves', icon: Waves, label: 'Natural', category: 'space' },
  { name: 'sun', icon: Sun, label: 'Natural Light', category: 'photography' },
  { name: 'moon', icon: Moon, label: 'Night Setup', category: 'photography' },
  { name: 'star', icon: Star, label: 'Popular', category: 'special' },
  { name: 'heart', icon: Heart, label: 'Wedding', category: 'special' },
  { name: 'crown', icon: Crown, label: 'VIP', category: 'special' },
  { name: 'zap', icon: Zap, label: 'Flash', category: 'photography' },
  { name: 'target', icon: Target, label: 'Professional', category: 'special' },
  { name: 'award', icon: Award, label: 'Award Winner', category: 'special' },
  { name: 'gift', icon: Gift, label: 'Package Deal', category: 'special' },
  { name: 'gem', icon: Gem, label: 'Luxury', category: 'special' },
  { name: 'flame', icon: Flame, label: 'Hot Deal', category: 'special' },
  { name: 'diamond', icon: Diamond, label: 'Diamond', category: 'special' },
]

const equipmentOptions = [
  { key: 'professional_camera', label: 'Kamera Profesional' },
  { key: 'lighting_kit', label: 'Lighting Kit' },
  { key: 'tripod', label: 'Tripod' },
  { key: 'backdrop_stand', label: 'Backdrop Stand' },
  { key: 'reflector', label: 'Reflector' },
  { key: 'softbox', label: 'Softbox' },
  { key: 'ring_light', label: 'Ring Light' },
  { key: 'wireless_mic', label: 'Wireless Microphone' },
  { key: 'speaker_system', label: 'Speaker System' },
  { key: 'makeup_station', label: 'Makeup Station' },
  { key: 'wardrobe_rack', label: 'Wardrobe Rack' },
  { key: 'props_collection', label: 'Props Collection' },
]

const iconCategories = [
  { key: 'photography', label: 'Photography', color: 'bg-blue-500' },
  { key: 'audio', label: 'Audio', color: 'bg-purple-500' },
  { key: 'comfort', label: 'Comfort', color: 'bg-green-500' },
  { key: 'technology', label: 'Technology', color: 'bg-orange-500' },
  { key: 'space', label: 'Space', color: 'bg-teal-500' },
  { key: 'special', label: 'Special', color: 'bg-pink-500' },
]

export function FacilityDialog({ open, onOpenChange, facility, onFacilitySaved, studioId }: FacilityDialogProps) {
  const isEdit = !!facility
  const [selectedCategory, setSelectedCategory] = useState<string>('photography')

  const createFacilityMutation = useCreateFacility()
  const updateFacilityMutation = useUpdateFacility()

  const form = useForm<FacilityFormValues>({
    resolver: zodResolver(facilitySchema),
    defaultValues: {
      name: "",
      description: "",
      capacity: 1,
      hourly_rate: 0,
      is_available: true,
      icon: "camera",
      equipment: {},
    },
  })

  useEffect(() => {
    if (facility) {
      form.reset({
        name: facility.name || "",
        description: facility.description || "",
        capacity: facility.capacity || 1,
        hourly_rate: facility.hourly_rate || 0,
        is_available: facility.is_available,
        icon: facility.icon || "camera",
        equipment: facility.equipment || {},
      })
    } else {
      form.reset({
        name: "",
        description: "",
        capacity: 1,
        hourly_rate: 0,
        is_available: true,
        icon: "camera",
        equipment: {},
      })
    }
  }, [facility, form])

  const onSubmit = async (data: FacilityFormValues) => {
    if (isEdit) {
      updateFacilityMutation.mutate(
        {
          facilityId: facility!.id,
          facilityData: {
            name: data.name,
            description: data.description,
            capacity: data.capacity,
            hourly_rate: data.hourly_rate,
            is_available: data.is_available,
            icon: data.icon,
            equipment: data.equipment,
          }
        },
        {
          onSuccess: () => {
            onFacilitySaved()
            onOpenChange(false)
          }
        }
      )
    } else {
      createFacilityMutation.mutate(
        {
          studio_id: studioId,
          name: data.name,
          description: data.description,
          capacity: data.capacity,
          hourly_rate: data.hourly_rate,
          icon: data.icon,
          equipment: data.equipment,
        },
        {
          onSuccess: () => {
            onFacilitySaved()
            onOpenChange(false)
          }
        }
      )
    }
  }

  const isLoading = createFacilityMutation.isPending || updateFacilityMutation.isPending
  const selectedIcon = form.watch('icon')

  const filteredIcons = availableIcons.filter(icon => icon.category === selectedCategory)

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[700px] max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            {selectedIcon && (() => {
              const IconComponent = availableIcons.find(i => i.name === selectedIcon)?.icon || Camera
              return <IconComponent className="h-5 w-5" />
            })()}
            {isEdit ? "Edit Fasilitas" : "Tambah Fasilitas Baru"}
          </DialogTitle>
          <DialogDescription>
            {isEdit
              ? "Update informasi fasilitas di bawah ini."
              : "Buat fasilitas baru untuk studio."
            }
          </DialogDescription>
        </DialogHeader>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="name"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Nama Fasilitas</FormLabel>
                    <FormControl>
                      <Input placeholder="Masukkan nama fasilitas" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="capacity"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Kapasitas (orang)</FormLabel>
                    <FormControl>
                      <Input
                        type="number"
                        placeholder="1"
                        {...field}
                        onChange={(e) => field.onChange(parseInt(e.target.value) || 0)}
                      />
                    </FormControl>
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
                      placeholder="Masukkan deskripsi fasilitas"
                      className="resize-none"
                      rows={3}
                      {...field}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="hourly_rate"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Tarif per Jam (Opsional)</FormLabel>
                  <FormControl>
                    <Input
                      type="number"
                      placeholder="0"
                      {...field}
                      onChange={(e) => field.onChange(parseFloat(e.target.value) || undefined)}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            {isEdit && (
              <FormField
                control={form.control}
                name="is_available"
                render={({ field }) => (
                  <FormItem className="flex flex-row items-center justify-between rounded-lg border p-4">
                    <div className="space-y-0.5">
                      <FormLabel className="text-base">Status Tersedia</FormLabel>
                      <div className="text-sm text-muted-foreground">
                        Fasilitas dapat digunakan untuk booking
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

            {/* Icon Selection */}
            <div className="space-y-4">
              <FormLabel className="text-base font-medium">Pilih Icon Fasilitas</FormLabel>

              {/* Category Filter */}
              <div className="flex flex-wrap gap-2">
                {iconCategories.map((category) => (
                  <Button
                    key={category.key}
                    type="button"
                    variant={selectedCategory === category.key ? "default" : "outline"}
                    size="sm"
                    onClick={() => setSelectedCategory(category.key)}
                    className="relative"
                  >
                    <div className={`w-2 h-2 rounded-full ${category.color} mr-2`} />
                    {category.label}
                  </Button>
                ))}
              </div>

              {/* Icon Grid */}
              <FormField
                control={form.control}
                name="icon"
                render={({ field }) => (
                  <FormItem>
                    <FormControl>
                      <div className="grid grid-cols-6 md:grid-cols-8 gap-3">
                        {filteredIcons.map((iconItem) => {
                          const IconComponent = iconItem.icon
                          const isSelected = field.value === iconItem.name

                          return (
                            <Card
                              key={iconItem.name}
                              className={`p-3 cursor-pointer transition-all hover:shadow-md ${isSelected
                                ? 'ring-2 ring-primary border-primary bg-primary/5'
                                : 'hover:border-primary/50'
                                }`}
                              onClick={() => field.onChange(iconItem.name)}
                            >
                              <div className="flex flex-col items-center space-y-1">
                                <IconComponent className={`h-6 w-6 ${isSelected ? 'text-primary' : 'text-muted-foreground'}`} />
                                <span className={`text-xs text-center leading-tight ${isSelected ? 'text-primary font-medium' : 'text-muted-foreground'
                                  }`}>
                                  {iconItem.label}
                                </span>
                              </div>
                            </Card>
                          )
                        })}
                      </div>
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            {/* Equipment Selection */}
            <div className="space-y-4">
              <FormLabel className="text-base font-medium">Peralatan Tersedia</FormLabel>
              <FormField
                control={form.control}
                name="equipment"
                render={({ field }) => (
                  <FormItem>
                    <FormControl>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                        {equipmentOptions.map((equipment) => {
                          const isChecked = field.value?.[equipment.key] || false

                          const handleToggle = () => {
                            const newEquipment = { ...field.value }
                            newEquipment[equipment.key] = !isChecked
                            field.onChange(newEquipment)
                          }

                          return (
                            <Card
                              key={equipment.key}
                              className={`p-3 cursor-pointer transition-all hover:shadow-sm ${isChecked
                                ? 'ring-1 ring-primary border-primary bg-primary/5'
                                : 'hover:border-primary/30'
                                }`}
                              onClick={handleToggle}
                            >
                              <div className="flex items-center space-x-2">
                                <Switch
                                  checked={isChecked}
                                  onCheckedChange={handleToggle}
                                  onClick={(e) => e.stopPropagation()}
                                />
                                <span className={`text-sm ${isChecked ? 'text-primary font-medium' : ''}`}>
                                  {equipment.label}
                                </span>
                              </div>
                            </Card>
                          )
                        })}
                      </div>
                    </FormControl>
                  </FormItem>
                )}
              />
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
                {isLoading ? (isEdit ? "Updating..." : "Creating...") : (isEdit ? "Update" : "Buat Fasilitas")}
              </Button>
            </div>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  )
}