"use client"

import { useState } from "react"
import { useForm, useFieldArray } from "react-hook-form"
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
import { Switch } from "@/components/ui/switch"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { Card, CardContent } from "@/components/ui/card"
import { useBulkCreateTimeSlots } from "@/hooks/use-time-slots"
import { useFacilities } from "@/hooks/use-facilities"
import { useStudios } from "@/hooks/use-studios"
import { Plus, Trash2, CalendarDays, Loader2, Clock } from "lucide-react"

const bulkTimeSlotSchema = z.object({
  studio_id: z.string().min(1, "Studio harus dipilih"),
  facility_id: z.string().min(1, "Fasilitas harus dipilih"),
  start_date: z.string().min(1, "Tanggal mulai harus diisi"),
  end_date: z.string().min(1, "Tanggal selesai harus diisi"),
  time_ranges: z.array(z.object({
    start_time: z.string().min(1, "Waktu mulai harus diisi"),
    end_time: z.string().min(1, "Waktu selesai harus diisi"),
  })).min(1, "Minimal satu range waktu harus ditambahkan"),
  skip_weekends: z.boolean().optional(),
}).refine((data) => {
  const startDate = new Date(data.start_date)
  const endDate = new Date(data.end_date)
  return startDate <= endDate
}, {
  message: "Tanggal selesai harus lebih besar atau sama dengan tanggal mulai",
  path: ["end_date"],
}).refine((data) => {
  return data.time_ranges.every(range => {
    const start = new Date(`1970-01-01T${range.start_time}`)
    const end = new Date(`1970-01-01T${range.end_time}`)
    return start < end
  })
}, {
  message: "Semua waktu selesai harus lebih besar dari waktu mulai",
  path: ["time_ranges"],
})

type BulkTimeSlotFormValues = z.infer<typeof bulkTimeSlotSchema>

interface BulkTimeSlotsDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  onTimeSlotsSaved: () => void
}

export function BulkTimeSlotsDialog({ 
  open, 
  onOpenChange, 
  onTimeSlotsSaved 
}: BulkTimeSlotsDialogProps) {
  const [selectedStudioId, setSelectedStudioId] = useState<string>("")

  const bulkCreateMutation = useBulkCreateTimeSlots()
  const { data: studios = [], isLoading: studiosLoading } = useStudios()
  const { data: facilities = [], isLoading: facilitiesLoading } = useFacilities(selectedStudioId)

  const form = useForm<BulkTimeSlotFormValues>({
    resolver: zodResolver(bulkTimeSlotSchema),
    defaultValues: {
      studio_id: "",
      facility_id: "",
      start_date: "",
      end_date: "",
      time_ranges: [{ start_time: "09:00", end_time: "10:30" }],
      skip_weekends: true,
    },
  })

  const { fields, append, remove } = useFieldArray({
    control: form.control,
    name: "time_ranges",
  })

  const onSubmit = async (data: BulkTimeSlotFormValues) => {
    bulkCreateMutation.mutate(
      data,
      {
        onSuccess: () => {
          onTimeSlotsSaved()
          onOpenChange(false)
          form.reset()
        }
      }
    )
  }

  const handleStudioChange = (studioId: string) => {
    setSelectedStudioId(studioId)
    form.setValue("studio_id", studioId)
    form.setValue("facility_id", "") // Reset facility when studio changes
  }

  const addTimeRange = () => {
    append({ start_time: "09:00", end_time: "10:30" })
  }

  const isLoading = bulkCreateMutation.isPending

  // Generate time options (every 30 minutes from 06:00 to 22:00)
  const timeOptions: string[] = []
  for (let hour = 6; hour <= 22; hour++) {
    for (let minute = 0; minute < 60; minute += 30) {
      const timeString = `${hour.toString().padStart(2, '0')}:${minute.toString().padStart(2, '0')}`
      timeOptions.push(timeString)
    }
  }

  // Calculate estimated slots
  const calculateEstimatedSlots = () => {
    const startDate = form.watch("start_date")
    const endDate = form.watch("end_date")
    const skipWeekends = form.watch("skip_weekends")
    const timeRanges = form.watch("time_ranges")

    if (!startDate || !endDate || !timeRanges?.length) return 0

    const start = new Date(startDate)
    const end = new Date(endDate)
    let dayCount = 0

    for (let date = new Date(start); date <= end; date.setDate(date.getDate() + 1)) {
      if (skipWeekends && (date.getDay() === 0 || date.getDay() === 6)) {
        continue
      }
      dayCount++
    }

    return dayCount * timeRanges.length
  }

  const estimatedSlots = calculateEstimatedSlots()

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[700px] max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <CalendarDays className="h-5 w-5" />
            Bulk Create Time Slots
          </DialogTitle>
        </DialogHeader>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
            {/* Studio & Facility Selection */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="studio_id"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Studio</FormLabel>
                    <Select onValueChange={handleStudioChange} value={field.value} disabled={studiosLoading}>
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

              <FormField
                control={form.control}
                name="facility_id"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Fasilitas</FormLabel>
                    <Select 
                      onValueChange={field.onChange} 
                      value={field.value} 
                      disabled={facilitiesLoading || !selectedStudioId}
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
            </div>

            {/* Date Range */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="start_date"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Tanggal Mulai</FormLabel>
                    <FormControl>
                      <Input type="date" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="end_date"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Tanggal Selesai</FormLabel>
                    <FormControl>
                      <Input type="date" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            {/* Skip Weekends */}
            <FormField
              control={form.control}
              name="skip_weekends"
              render={({ field }) => (
                <FormItem className="flex flex-row items-center justify-between rounded-lg border p-4">
                  <div className="space-y-0.5">
                    <FormLabel className="text-base">Skip Weekend</FormLabel>
                    <FormDescription>
                      Tidak membuat time slot untuk hari Sabtu dan Minggu
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

            {/* Time Ranges */}
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-lg font-medium flex items-center gap-2">
                    <Clock className="h-5 w-5" />
                    Time Ranges
                  </h3>
                  <p className="text-sm text-muted-foreground">
                    Tambahkan range waktu yang akan dibuat untuk setiap hari
                  </p>
                </div>
                <Button type="button" variant="outline" size="sm" onClick={addTimeRange}>
                  <Plus className="h-4 w-4 mr-2" />
                  Tambah Range
                </Button>
              </div>

              <div className="space-y-3">
                {fields.map((field, index) => (
                  <Card key={field.id}>
                    <CardContent className="pt-4">
                      <div className="flex items-center gap-4">
                        <div className="grid grid-cols-2 gap-2 flex-1">
                          <FormField
                            control={form.control}
                            name={`time_ranges.${index}.start_time`}
                            render={({ field }) => (
                              <FormItem>
                                <FormLabel className="text-sm">Waktu Mulai</FormLabel>
                                <Select onValueChange={field.onChange} value={field.value}>
                                  <FormControl>
                                    <SelectTrigger className="h-9">
                                      <SelectValue />
                                    </SelectTrigger>
                                  </FormControl>
                                  <SelectContent>
                                    {timeOptions.map((time) => (
                                      <SelectItem key={`start-${time}-${index}`} value={time}>
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
                            name={`time_ranges.${index}.end_time`}
                            render={({ field }) => (
                              <FormItem>
                                <FormLabel className="text-sm">Waktu Selesai</FormLabel>
                                <Select onValueChange={field.onChange} value={field.value}>
                                  <FormControl>
                                    <SelectTrigger className="h-9">
                                      <SelectValue />
                                    </SelectTrigger>
                                  </FormControl>
                                  <SelectContent>
                                    {timeOptions.map((time) => (
                                      <SelectItem key={`end-${time}-${index}`} value={time}>
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

                        {fields.length > 1 && (
                          <Button
                            type="button"
                            variant="outline"
                            size="icon"
                            className="h-9 w-9 mt-6"
                            onClick={() => remove(index)}
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        )}
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </div>

            {/* Estimated Slots */}
            {estimatedSlots > 0 && (
              <Card className="bg-blue-50 border-blue-200">
                <CardContent className="pt-4">
                  <div className="flex items-center gap-2 text-blue-800">
                    <CalendarDays className="h-5 w-5" />
                    <span className="font-medium">
                      Estimasi: {estimatedSlots} time slots akan dibuat
                    </span>
                  </div>
                </CardContent>
              </Card>
            )}

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
              <Button type="submit" disabled={isLoading || estimatedSlots === 0}>
                {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                Buat {estimatedSlots} Time Slots
              </Button>
            </div>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  )
}