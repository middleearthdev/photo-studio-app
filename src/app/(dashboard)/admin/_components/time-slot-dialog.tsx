"use client"

import { useEffect, useState } from "react"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { z } from "zod"
import {
  Dialog,
  DialogContent,
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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { useCreateTimeSlot, useUpdateTimeSlot } from "@/hooks/use-time-slots"
import { useFacilities } from "@/hooks/use-facilities"
import { useStudios } from "@/hooks/use-studios"
import { type TimeSlot } from "@/actions/time-slots"
import { Clock, CalendarDays, Loader2 } from "lucide-react"

const timeSlotSchema = z.object({
  studio_id: z.string().min(1, "Studio harus dipilih"),
  facility_id: z.string().min(1, "Fasilitas harus dipilih"),
  slot_date: z.string().min(1, "Tanggal harus diisi"),
  start_time: z.string().min(1, "Waktu mulai harus diisi"),
  end_time: z.string().min(1, "Waktu selesai harus diisi"),
  is_available: z.boolean().optional(),
  is_blocked: z.boolean().optional(),
  notes: z.string().optional(),
}).refine((data) => {
  const start = new Date(`1970-01-01T${data.start_time}`)
  const end = new Date(`1970-01-01T${data.end_time}`)
  return start < end
}, {
  message: "Waktu selesai harus lebih besar dari waktu mulai",
  path: ["end_time"],
})

type TimeSlotFormValues = z.infer<typeof timeSlotSchema>

interface TimeSlotDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  timeSlotData: TimeSlot | null
  onTimeSlotSaved: () => void
}

export function TimeSlotDialog({ 
  open, 
  onOpenChange, 
  timeSlotData, 
  onTimeSlotSaved 
}: TimeSlotDialogProps) {
  const isEdit = !!timeSlotData
  const [selectedStudioId, setSelectedStudioId] = useState<string>("")

  const createTimeSlotMutation = useCreateTimeSlot()
  const updateTimeSlotMutation = useUpdateTimeSlot()
  const { data: studios = [], isLoading: studiosLoading } = useStudios()
  const { data: facilities = [], isLoading: facilitiesLoading } = useFacilities(selectedStudioId)

  const form = useForm<TimeSlotFormValues>({
    resolver: zodResolver(timeSlotSchema),
    defaultValues: {
      studio_id: "",
      facility_id: "",
      slot_date: "",
      start_time: "",
      end_time: "",
      is_available: true,
      is_blocked: false,
      notes: "",
    },
  })

  useEffect(() => {
    if (timeSlotData) {
      setSelectedStudioId(timeSlotData.studio_id)
      form.reset({
        studio_id: timeSlotData.studio_id,
        facility_id: timeSlotData.facility_id,
        slot_date: timeSlotData.slot_date,
        start_time: timeSlotData.start_time,
        end_time: timeSlotData.end_time,
        is_available: timeSlotData.is_available,
        is_blocked: timeSlotData.is_blocked,
        notes: timeSlotData.notes || "",
      })
    } else {
      setSelectedStudioId("")
      form.reset({
        studio_id: "",
        facility_id: "",
        slot_date: "",
        start_time: "",
        end_time: "",
        is_available: true,
        is_blocked: false,
        notes: "",
      })
    }
  }, [timeSlotData, form])

  const onSubmit = async (data: TimeSlotFormValues) => {
    if (isEdit) {
      updateTimeSlotMutation.mutate(
        {
          timeSlotId: timeSlotData!.id,
          timeSlotData: data
        },
        {
          onSuccess: () => {
            onTimeSlotSaved()
            onOpenChange(false)
          }
        }
      )
    } else {
      createTimeSlotMutation.mutate(
        data,
        {
          onSuccess: () => {
            onTimeSlotSaved()
            onOpenChange(false)
          }
        }
      )
    }
  }

  const handleStudioChange = (studioId: string) => {
    setSelectedStudioId(studioId)
    form.setValue("studio_id", studioId)
    form.setValue("facility_id", "") // Reset facility when studio changes
  }

  const isLoading = createTimeSlotMutation.isPending || updateTimeSlotMutation.isPending

  // Generate time options (every 30 minutes from 06:00 to 22:00)
  const timeOptions = []
  for (let hour = 6; hour <= 22; hour++) {
    for (let minute = 0; minute < 60; minute += 30) {
      const timeString = `${hour.toString().padStart(2, '0')}:${minute.toString().padStart(2, '0')}`
      timeOptions.push(timeString)
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[600px] max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <CalendarDays className="h-5 w-5" />
            {isEdit ? "Edit Time Slot" : "Tambah Time Slot Baru"}
          </DialogTitle>
        </DialogHeader>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
            {/* Studio Selection */}
            <FormField
              control={form.control}
              name="studio_id"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Studio</FormLabel>
                  <Select 
                    onValueChange={handleStudioChange} 
                    value={field.value} 
                    disabled={studiosLoading || isEdit}
                  >
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Pilih studio" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      {studios.map((studio) => (
                        <SelectItem key={studio.id} value={studio.id}>
                          {studio.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />

            {/* Facility Selection */}
            <FormField
              control={form.control}
              name="facility_id"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Fasilitas</FormLabel>
                  <Select 
                    onValueChange={field.onChange} 
                    value={field.value} 
                    disabled={facilitiesLoading || !selectedStudioId || isEdit}
                  >
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Pilih fasilitas" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      {facilities.filter(f => f.is_available).map((facility) => (
                        <SelectItem key={facility.id} value={facility.id}>
                          {facility.name} (Kapasitas: {facility.capacity})
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />

            {/* Date */}
            <FormField
              control={form.control}
              name="slot_date"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Tanggal</FormLabel>
                  <FormControl>
                    <Input type="date" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            {/* Time Range */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="start_time"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Waktu Mulai</FormLabel>
                    <Select onValueChange={field.onChange} value={field.value}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Pilih waktu mulai" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {timeOptions.map((time) => (
                          <SelectItem key={`start-${time}`} value={time}>
                            {time}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="end_time"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Waktu Selesai</FormLabel>
                    <Select onValueChange={field.onChange} value={field.value}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Pilih waktu selesai" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {timeOptions.map((time) => (
                          <SelectItem key={`end-${time}`} value={time}>
                            {time}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            {/* Status Settings */}
            <div className="space-y-4">
              <h3 className="text-lg font-medium">Pengaturan Status</h3>
              
              <FormField
                control={form.control}
                name="is_available"
                render={({ field }) => (
                  <FormItem className="flex flex-row items-center justify-between rounded-lg border p-4">
                    <div className="space-y-0.5">
                      <FormLabel className="text-base">Tersedia</FormLabel>
                      <FormDescription>
                        Time slot dapat dibooking oleh customer
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

              <FormField
                control={form.control}
                name="is_blocked"
                render={({ field }) => (
                  <FormItem className="flex flex-row items-center justify-between rounded-lg border p-4">
                    <div className="space-y-0.5">
                      <FormLabel className="text-base">Diblokir</FormLabel>
                      <FormDescription>
                        Time slot diblokir untuk keperluan internal
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
            </div>

            {/* Notes */}
            <FormField
              control={form.control}
              name="notes"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Catatan (Opsional)</FormLabel>
                  <FormControl>
                    <Textarea 
                      placeholder="Catatan untuk time slot ini..."
                      rows={3}
                      {...field} 
                    />
                  </FormControl>
                  <FormDescription>
                    Catatan internal untuk time slot
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />

            {/* Actions */}
            <div className="flex justify-end gap-3 pt-4">
              <Button
                type="button"
                variant="outline"
                onClick={() => onOpenChange(false)}
                disabled={isLoading}
              >
                Batal
              </Button>
              <Button type="submit" disabled={isLoading}>
                {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                {isEdit ? "Simpan Perubahan" : "Tambah Time Slot"}
              </Button>
            </div>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  )
}