// @ts-nocheck
"use client"

import { useEffect } from "react"
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
import { useCreateStudio, useUpdateStudio } from "@/hooks/use-studios"
import { type Studio } from "@/actions/studios"

const dayHoursSchema = z.object({
  open: z.string(),
  close: z.string(),
})

const operatingHoursSchema = z.record(z.string(), dayHoursSchema)

const studioSchema = z.object({
  name: z.string().min(2, "Nama studio minimal 2 karakter"),
  description: z.string().optional(),
  address: z.string().min(5, "Alamat minimal 5 karakter"),
  phone: z.string().optional(),
  email: z.string().email("Email tidak valid").optional().or(z.literal("")),
  is_active: z.boolean().optional(),
  operating_hours: operatingHoursSchema.optional(),
})

type StudioFormValues = z.infer<typeof studioSchema>

interface StudioDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  studio: Studio | null
  onStudioSaved: () => void
}

const days = [
  { key: 'monday', label: 'Senin' },
  { key: 'tuesday', label: 'Selasa' },
  { key: 'wednesday', label: 'Rabu' },
  { key: 'thursday', label: 'Kamis' },
  { key: 'friday', label: 'Jumat' },
  { key: 'saturday', label: 'Sabtu' },
  { key: 'sunday', label: 'Minggu' },
]

export function StudioDialog({ open, onOpenChange, studio, onStudioSaved }: StudioDialogProps) {
  const isEdit = !!studio

  const createStudioMutation = useCreateStudio()
  const updateStudioMutation = useUpdateStudio()

  // @ts-ignore - Temporary fix for complex type issues
  const form = useForm<StudioFormValues>({
    resolver: zodResolver(studioSchema),
    defaultValues: {
      name: "",
      description: "",
      address: "",
      phone: "",
      email: "",
      is_active: true,
      operating_hours: {
        monday: { isOpen: true, open: "09:00", close: "18:00" },
        tuesday: { isOpen: true, open: "09:00", close: "18:00" },
        wednesday: { isOpen: true, open: "09:00", close: "18:00" },
        thursday: { isOpen: true, open: "09:00", close: "18:00" },
        friday: { isOpen: true, open: "09:00", close: "18:00" },
        saturday: { isOpen: true, open: "09:00", close: "18:00" },
        sunday: { isOpen: false, open: "09:00", close: "18:00" },
      },
    },
  })

  useEffect(() => {
    if (studio) {
      form.reset({
        name: studio.name || "",
        description: studio.description || "",
        address: studio.address || "",
        phone: studio.phone || "",
        email: studio.email || "",
        is_active: studio.is_active,
        operating_hours: studio.operating_hours ? {
          monday: { 
            isOpen: studio.operating_hours.monday?.isOpen ?? true, 
            open: studio.operating_hours.monday?.open ?? "09:00", 
            close: studio.operating_hours.monday?.close ?? "18:00" 
          },
          tuesday: { 
            isOpen: studio.operating_hours.tuesday?.isOpen ?? true, 
            open: studio.operating_hours.tuesday?.open ?? "09:00", 
            close: studio.operating_hours.tuesday?.close ?? "18:00" 
          },
          wednesday: { 
            isOpen: studio.operating_hours.wednesday?.isOpen ?? true, 
            open: studio.operating_hours.wednesday?.open ?? "09:00", 
            close: studio.operating_hours.wednesday?.close ?? "18:00" 
          },
          thursday: { 
            isOpen: studio.operating_hours.thursday?.isOpen ?? true, 
            open: studio.operating_hours.thursday?.open ?? "09:00", 
            close: studio.operating_hours.thursday?.close ?? "18:00" 
          },
          friday: { 
            isOpen: studio.operating_hours.friday?.isOpen ?? true, 
            open: studio.operating_hours.friday?.open ?? "09:00", 
            close: studio.operating_hours.friday?.close ?? "18:00" 
          },
          saturday: { 
            isOpen: studio.operating_hours.saturday?.isOpen ?? true, 
            open: studio.operating_hours.saturday?.open ?? "09:00", 
            close: studio.operating_hours.saturday?.close ?? "18:00" 
          },
          sunday: { 
            isOpen: studio.operating_hours.sunday?.isOpen ?? false, 
            open: studio.operating_hours.sunday?.open ?? "09:00", 
            close: studio.operating_hours.sunday?.close ?? "18:00" 
          },
        } : {
          monday: { isOpen: true, open: "09:00", close: "18:00" },
          tuesday: { isOpen: true, open: "09:00", close: "18:00" },
          wednesday: { isOpen: true, open: "09:00", close: "18:00" },
          thursday: { isOpen: true, open: "09:00", close: "18:00" },
          friday: { isOpen: true, open: "09:00", close: "18:00" },
          saturday: { isOpen: true, open: "09:00", close: "18:00" },
          sunday: { isOpen: false, open: "09:00", close: "18:00" },
        },
      })
    } else {
      form.reset({
        name: "",
        description: "",
        address: "",
        phone: "",
        email: "",
        is_active: true,
        operating_hours: {
          monday: { isOpen: true, open: "09:00", close: "18:00" },
          tuesday: { isOpen: true, open: "09:00", close: "18:00" },
          wednesday: { isOpen: true, open: "09:00", close: "18:00" },
          thursday: { isOpen: true, open: "09:00", close: "18:00" },
          friday: { isOpen: true, open: "09:00", close: "18:00" },
          saturday: { isOpen: true, open: "09:00", close: "18:00" },
          sunday: { isOpen: false, open: "09:00", close: "18:00" },
        },
      })
    }
  }, [studio, form])

  const onSubmit = async (data: StudioFormValues) => {
    if (isEdit) {
      updateStudioMutation.mutate(
        {
          studioId: studio!.id,
          studioData: {
            name: data.name,
            description: data.description,
            address: data.address,
            phone: data.phone,
            email: data.email || undefined,
            is_active: data.is_active,
            operating_hours: data.operating_hours,
          }
        },
        {
          onSuccess: () => {
            onStudioSaved()
            onOpenChange(false)
          }
        }
      )
    } else {
      createStudioMutation.mutate(
        {
          name: data.name,
          description: data.description,
          address: data.address,
          phone: data.phone,
          email: data.email || undefined,
          operating_hours: data.operating_hours,
        },
        {
          onSuccess: () => {
            onStudioSaved()
            onOpenChange(false)
          }
        }
      )
    }
  }

  const isLoading = createStudioMutation.isPending || updateStudioMutation.isPending

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[600px] max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>
            {isEdit ? "Edit Studio" : "Tambah Studio Baru"}
          </DialogTitle>
          <DialogDescription>
            {isEdit 
              ? "Update informasi studio di bawah ini." 
              : "Buat studio baru untuk sistem manajemen."
            }
          </DialogDescription>
        </DialogHeader>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="name"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Nama Studio</FormLabel>
                    <FormControl>
                      <Input placeholder="Masukkan nama studio" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="email"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Email</FormLabel>
                    <FormControl>
                      <Input 
                        type="email" 
                        placeholder="Masukkan email studio" 
                        {...field} 
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
                      placeholder="Masukkan deskripsi studio" 
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
              name="address"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Alamat</FormLabel>
                  <FormControl>
                    <Textarea 
                      placeholder="Masukkan alamat lengkap studio" 
                      className="resize-none"
                      rows={2}
                      {...field} 
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="phone"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Nomor Telepon</FormLabel>
                  <FormControl>
                    <Input placeholder="Masukkan nomor telepon" {...field} />
                  </FormControl>
                  <FormMessage />
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
                        Studio dapat menerima booking dan tampil di website
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

            <div className="space-y-4">
              <h3 className="text-lg font-medium">Jam Operasional</h3>
              <div className="text-sm text-muted-foreground mb-4">
                Atur jam operasional studio untuk setiap hari dalam seminggu
              </div>
              <div className="grid grid-cols-1 gap-4">
                {days.map((day) => (
                  <div key={day.key} className="border rounded-lg p-4 space-y-3">
                    {/* Day Header with Toggle */}
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <h4 className="font-medium text-sm">{day.label}</h4>
                        <FormField
                          control={form.control}
                          name={`operating_hours.${day.key}.isOpen` as any}
                          render={({ field }) => (
                            <FormItem className="flex items-center space-x-2">
                              <FormControl>
                                <Switch
                                  checked={field.value}
                                  onCheckedChange={field.onChange}
                                />
                              </FormControl>
                              <span className="text-xs text-muted-foreground">
                                {field.value ? 'Buka' : 'Tutup'}
                              </span>
                            </FormItem>
                          )}
                        />
                      </div>
                    </div>
                    
                    {/* Time Fields - Only show when day is open */}
                    <FormField
                      control={form.control}
                      name={`operating_hours.${day.key}.isOpen` as any}
                      render={({ field: isOpenField }) => (
                        isOpenField.value && (
                          <div className="flex items-center gap-3 ml-2">
                            <FormField
                              control={form.control}
                              name={`operating_hours.${day.key}.open` as any}
                              render={({ field }) => (
                                <FormItem className="flex-1">
                                  <FormLabel className="text-xs text-muted-foreground">Buka</FormLabel>
                                  <FormControl>
                                    <Input 
                                      type="time" 
                                      className="text-sm"
                                      {...field}
                                    />
                                  </FormControl>
                                </FormItem>
                              )}
                            />
                            <div className="flex items-center pt-6">
                              <span className="text-muted-foreground text-sm">sampai</span>
                            </div>
                            <FormField
                              control={form.control}
                              name={`operating_hours.${day.key}.close` as any}
                              render={({ field }) => (
                                <FormItem className="flex-1">
                                  <FormLabel className="text-xs text-muted-foreground">Tutup</FormLabel>
                                  <FormControl>
                                    <Input 
                                      type="time" 
                                      className="text-sm"
                                      {...field}
                                    />
                                  </FormControl>
                                </FormItem>
                              )}
                            />
                          </div>
                        )
                      )}
                    />
                    
                    {/* Closed message when day is closed */}
                    <FormField
                      control={form.control}
                      name={`operating_hours.${day.key}.isOpen` as any}
                      render={({ field: isOpenField }) => (
                        !isOpenField.value && (
                          <div className="ml-2 text-sm text-muted-foreground italic">
                            Studio tutup pada hari {day.label.toLowerCase()}
                          </div>
                        )
                      )}
                    />
                  </div>
                ))}
              </div>
              
              {/* Quick Actions */}
              <div className="flex gap-2 pt-2 border-t">
                <Button 
                  type="button" 
                  variant="outline" 
                  size="sm"
                  onClick={() => {
                    days.forEach(day => {
                      form.setValue(`operating_hours.${day.key}.isOpen`, true)
                    })
                  }}
                >
                  Buka Semua
                </Button>
                <Button 
                  type="button" 
                  variant="outline" 
                  size="sm"
                  onClick={() => {
                    days.forEach(day => {
                      if (day.key === 'sunday') {
                        form.setValue(`operating_hours.${day.key}.isOpen`, false)
                      } else {
                        form.setValue(`operating_hours.${day.key}.isOpen`, true)
                      }
                    })
                  }}
                >
                  Senin-Sabtu
                </Button>
                <Button 
                  type="button" 
                  variant="outline" 
                  size="sm"
                  onClick={() => {
                    days.forEach(day => {
                      if (['saturday', 'sunday'].includes(day.key)) {
                        form.setValue(`operating_hours.${day.key}.isOpen`, false)
                      } else {
                        form.setValue(`operating_hours.${day.key}.isOpen`, true)
                      }
                    })
                  }}
                >
                  Hari Kerja
                </Button>
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
                {isLoading ? (isEdit ? "Updating..." : "Creating...") : (isEdit ? "Update" : "Buat Studio")}
              </Button>
            </div>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  )
}