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

const operatingHoursSchema = z.object({
  monday: z.object({ open: z.string(), close: z.string() }).optional(),
  tuesday: z.object({ open: z.string(), close: z.string() }).optional(),
  wednesday: z.object({ open: z.string(), close: z.string() }).optional(),
  thursday: z.object({ open: z.string(), close: z.string() }).optional(),
  friday: z.object({ open: z.string(), close: z.string() }).optional(),
  saturday: z.object({ open: z.string(), close: z.string() }).optional(),
  sunday: z.object({ open: z.string(), close: z.string() }).optional(),
})

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
        monday: { open: "09:00", close: "18:00" },
        tuesday: { open: "09:00", close: "18:00" },
        wednesday: { open: "09:00", close: "18:00" },
        thursday: { open: "09:00", close: "18:00" },
        friday: { open: "09:00", close: "18:00" },
        saturday: { open: "09:00", close: "18:00" },
        sunday: { open: "09:00", close: "18:00" },
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
        operating_hours: studio.operating_hours || {
          monday: { open: "09:00", close: "18:00" },
          tuesday: { open: "09:00", close: "18:00" },
          wednesday: { open: "09:00", close: "18:00" },
          thursday: { open: "09:00", close: "18:00" },
          friday: { open: "09:00", close: "18:00" },
          saturday: { open: "09:00", close: "18:00" },
          sunday: { open: "09:00", close: "18:00" },
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
          monday: { open: "09:00", close: "18:00" },
          tuesday: { open: "09:00", close: "18:00" },
          wednesday: { open: "09:00", close: "18:00" },
          thursday: { open: "09:00", close: "18:00" },
          friday: { open: "09:00", close: "18:00" },
          saturday: { open: "09:00", close: "18:00" },
          sunday: { open: "09:00", close: "18:00" },
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
              <div className="grid grid-cols-1 gap-3">
                {days.map((day) => (
                  <div key={day.key} className="flex items-center gap-4 p-3 border rounded-lg">
                    <div className="w-20 text-sm font-medium">{day.label}</div>
                    <div className="flex items-center gap-2 flex-1">
                      <FormField
                        control={form.control}
                        name={`operating_hours.${day.key}.open` as any}
                        render={({ field }) => (
                          <FormItem className="flex-1">
                            <FormControl>
                              <Input 
                                type="time" 
                                {...field}
                              />
                            </FormControl>
                          </FormItem>
                        )}
                      />
                      <span className="text-muted-foreground">-</span>
                      <FormField
                        control={form.control}
                        name={`operating_hours.${day.key}.close` as any}
                        render={({ field }) => (
                          <FormItem className="flex-1">
                            <FormControl>
                              <Input 
                                type="time" 
                                {...field}
                              />
                            </FormControl>
                          </FormItem>
                        )}
                      />
                    </div>
                  </div>
                ))}
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