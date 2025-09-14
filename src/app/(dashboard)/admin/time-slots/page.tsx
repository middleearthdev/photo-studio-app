"use client"

import { useState, useEffect } from "react"
import {
  Plus,
  Search,
  MoreHorizontal,
  Edit,
  Trash,
  CalendarDays,
  Clock,
  MapPin,
  Eye,
  EyeOff,
  Filter,
  Calendar,
  Users,
  Building,
  AlertCircle,
  Layers,
  Zap,
  Ban,
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
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { Badge } from "@/components/ui/badge"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Skeleton } from "@/components/ui/skeleton"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog"
import { Calendar as CalendarComponent } from "@/components/ui/calendar"
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover"
import { TimeSlotDialog } from "@/app/(dashboard)/admin/_components/time-slot-dialog"
import { BulkTimeSlotsDialog } from "@/app/(dashboard)/admin/_components/bulk-time-slots-dialog"
import { usePaginatedTimeSlots, useDeleteTimeSlot, useToggleTimeSlotBlocking } from "@/hooks/use-time-slots"
import { useFacilities } from "@/hooks/use-facilities"
import { useStudios } from "@/hooks/use-studios"
import { type TimeSlot } from "@/actions/time-slots"
import { PaginationControls } from "@/components/pagination-controls"
import { DEFAULT_PAGE_SIZE } from "@/lib/constants/pagination"
import { format } from "date-fns"
import { id } from "date-fns/locale"

export default function TimeSlotsPage() {
  const [searchTerm, setSearchTerm] = useState('')
  const [selectedTimeSlot, setSelectedTimeSlot] = useState<TimeSlot | null>(null)
  const [isDialogOpen, setIsDialogOpen] = useState(false)
  const [isBulkDialogOpen, setIsBulkDialogOpen] = useState(false)
  const [timeSlotToDelete, setTimeSlotToDelete] = useState<TimeSlot | null>(null)
  const [timeSlotToToggle, setTimeSlotToToggle] = useState<TimeSlot | null>(null)
  const [selectedStudioId, setSelectedStudioId] = useState<string>('')
  const [selectedFacilityId, setSelectedFacilityId] = useState<string>('all')
  const [selectedStatus, setSelectedStatus] = useState<'all' | 'available' | 'blocked' | 'unavailable'>('all')
  const [selectedDate, setSelectedDate] = useState<Date | undefined>(undefined)
  const [isCalendarOpen, setIsCalendarOpen] = useState(false)
  const [currentPage, setCurrentPage] = useState(1)
  const [pageSize, setPageSize] = useState(DEFAULT_PAGE_SIZE)

  const { data: studios = [], isLoading: studiosLoading } = useStudios()
  const { data: facilities = [] } = useFacilities(selectedStudioId)

  // Format date for API calls - using Jakarta timezone
  const formatDateForApi = (date: Date | undefined): string | undefined => {
    if (!date) return undefined;

    // Format date as YYYY-MM-DD in local timezone
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  }

  const startDate = formatDateForApi(selectedDate)
  const endDate = startDate // For single date filtering

  // Use paginated hook instead of regular hook
  const {
    data: paginatedResult,
    isLoading: loading,
    error,
    refetch
  } = usePaginatedTimeSlots({
    studioId: selectedStudioId,
    page: currentPage,
    pageSize,
    search: searchTerm,
    status: selectedStatus,
    facilityId: selectedFacilityId === 'all' ? undefined : selectedFacilityId,
    startDate,
    endDate,
  })

  const timeSlots = paginatedResult?.data || []
  const pagination = paginatedResult?.pagination

  const deleteTimeSlotMutation = useDeleteTimeSlot()
  const toggleBlockingMutation = useToggleTimeSlotBlocking()

  // Set default studio
  useEffect(() => {
    if (studios.length > 0 && !selectedStudioId) {
      setSelectedStudioId(studios[0].id)
    }
  }, [studios, selectedStudioId])

  // Reset pagination when filters change
  useEffect(() => {
    setCurrentPage(1)
  }, [searchTerm, selectedStatus, selectedFacilityId, selectedDate, selectedStudioId])

  const handlePageChange = (page: number) => {
    setCurrentPage(page)
  }

  const handlePageSizeChange = (newPageSize: number) => {
    setPageSize(newPageSize)
    setCurrentPage(1)
  }

  // Reset facility when studio changes
  useEffect(() => {
    setSelectedFacilityId('all')
  }, [selectedStudioId])

  // Server-side filtering is now handled in the API, no need for client-side filtering

  const handleEdit = (timeSlot: TimeSlot) => {
    setSelectedTimeSlot(timeSlot)
    setIsDialogOpen(true)
  }

  const handleAdd = () => {
    setSelectedTimeSlot(null)
    setIsDialogOpen(true)
  }

  const handleDelete = async (timeSlot: TimeSlot) => {
    deleteTimeSlotMutation.mutate(timeSlot.id, {
      onSuccess: () => {
        setTimeSlotToDelete(null)
      }
    })
  }

  const handleToggleBlocking = async (timeSlot: TimeSlot) => {
    toggleBlockingMutation.mutate(
      {
        id: timeSlot.id,
        isBlocked: !timeSlot.is_blocked // Toggle the current blocking status
      },
      {
        onSuccess: () => {
          setTimeSlotToToggle(null)
        }
      }
    )
  }

  const handleTimeSlotSaved = () => {
    refetch()
  }

  const formatTime = (time: string) => {
    return time.slice(0, 5) // Remove seconds if present
  }

  const formatDate = (date: string) => {
    return new Date(date).toLocaleDateString('id-ID', {
      weekday: 'short',
      day: 'numeric',
      month: 'short',
      year: 'numeric'
    })
  }

  // Statistics - use pagination total for overall stats, current page for detailed breakdown
  const stats = {
    total: pagination?.total || timeSlots.length,
    available: timeSlots.filter(s => s.is_available && !s.is_blocked).length,
    blocked: timeSlots.filter(s => s.is_blocked).length,
    unavailable: timeSlots.filter(s => !s.is_available).length,
  }

  if (error) {
    return (
      <div className="p-8">
        <Card>
          <CardContent className="pt-6">
            <div className="text-center text-muted-foreground">
              <AlertCircle className="h-8 w-8 mx-auto mb-2" />
              Terjadi kesalahan saat memuat data time slots
            </div>
          </CardContent>
        </Card>
      </div>
    )
  }

  return (
    <div className="p-6">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold flex items-center gap-2">
            <CalendarDays className="h-7 w-7" />
            Time Slots Management
          </h1>
          <p className="text-muted-foreground">
            Kelola jadwal waktu tersedia untuk booking studio
          </p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" onClick={() => setIsBulkDialogOpen(true)} disabled={!selectedStudioId}>
            <Layers className="h-4 w-4 mr-2" />
            Bulk Create
          </Button>
          <Button onClick={handleAdd} disabled={!selectedStudioId}>
            <Ban className="h-4 w-4 mr-2" />
            Blokir Time Slot
          </Button>
        </div>
      </div>

      <div className="space-y-4">
        {/* Studio Selection & Stats */}
        <Card>
          <CardContent className="pt-6">
            <div className="flex flex-col md:flex-row gap-4 items-start md:items-center justify-between">
              <div className="flex flex-col md:flex-row gap-4 items-start md:items-center">
                <div className="space-y-2">
                  <label className="text-sm font-medium">Pilih Studio</label>
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
                        {stats.total}
                      </div>
                      <div className="text-sm text-muted-foreground">Total Slots</div>
                    </div>
                    <div className="text-center">
                      <div className="text-2xl font-bold text-green-600">
                        {stats.available}
                      </div>
                      <div className="text-sm text-muted-foreground">Tersedia</div>
                    </div>
                    <div className="text-center">
                      <div className="text-2xl font-bold text-orange-600">
                        {stats.blocked}
                      </div>
                      <div className="text-sm text-muted-foreground">Diblokir</div>
                    </div>
                    <div className="text-center">
                      <div className="text-2xl font-bold text-gray-600">
                        {stats.unavailable}
                      </div>
                      <div className="text-sm text-muted-foreground">Tidak Tersedia</div>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Filters and Controls */}
        {selectedStudioId && (
          <Card>
            <CardContent className="pt-6">
              <div className="flex flex-col md:flex-row gap-4 items-start md:items-center justify-between">
                <div className="flex flex-col md:flex-row gap-4 items-start md:items-center">
                  <div className="relative flex-1 min-w-[250px]">
                    <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
                    <Input
                      placeholder="Cari fasilitas, catatan..."
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                      className="pl-10"
                    />
                  </div>

                  <Select value={selectedFacilityId} onValueChange={setSelectedFacilityId}>
                    <SelectTrigger className="w-[180px]">
                      <Building className="h-4 w-4 mr-2" />
                      <SelectValue placeholder="Semua Fasilitas" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">Semua Fasilitas</SelectItem>
                      {facilities.filter(f => f.is_available).map((facility) => (
                        <SelectItem key={facility.id} value={facility.id}>
                          {facility.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>

                  <Select value={selectedStatus} onValueChange={(value: any) => setSelectedStatus(value)}>
                    <SelectTrigger className="w-[150px]">
                      <Filter className="h-4 w-4 mr-2" />
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">Semua Status</SelectItem>
                      <SelectItem value="available">Tersedia</SelectItem>
                      <SelectItem value="blocked">Diblokir</SelectItem>
                    </SelectContent>
                  </Select>

                  <div className="flex items-center gap-2">
                    <Popover open={isCalendarOpen} onOpenChange={setIsCalendarOpen}>
                      <PopoverTrigger asChild>
                        <Button
                          variant="outline"
                          className="w-[150px] justify-start text-left font-normal"
                        >
                          <Calendar className="h-4 w-4 mr-2" />
                          {selectedDate ? format(selectedDate, "dd MMM yyyy", { locale: id }) : "Pilih Tanggal"}
                        </Button>
                      </PopoverTrigger>
                      <PopoverContent className="w-auto p-0" align="start">
                        <CalendarComponent
                          mode="single"
                          selected={selectedDate}
                          onSelect={(date) => {
                            // Check if date is not in the past
                            if (date) {
                              const today = new Date()
                              today.setHours(0, 0, 0, 0)
                              if (date < today) {
                                // Don't allow backdating
                                return
                              }

                              // Check if date is not more than 1 month ahead
                              const maxDate = new Date()
                              maxDate.setMonth(maxDate.getMonth() + 1)
                              maxDate.setHours(0, 0, 0, 0)
                              if (date > maxDate) {
                                // Don't allow dates more than 1 month ahead
                                return
                              }
                            }

                            setSelectedDate(date)
                            setIsCalendarOpen(false)
                          }}
                          disabled={(date) => {
                            const today = new Date()
                            today.setHours(0, 0, 0, 0)
                            const maxDate = new Date()
                            maxDate.setMonth(maxDate.getMonth() + 1)
                            maxDate.setHours(0, 0, 0, 0)
                            return date < today || date > maxDate
                          }}
                          initialFocus
                        />
                      </PopoverContent>
                    </Popover>
                    {selectedDate && (
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => setSelectedDate(undefined)}
                      >
                        Clear
                      </Button>
                    )}
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Time Slots Display */}
        {!selectedStudioId ? (
          <Card>
            <CardContent className="pt-6">
              <div className="text-center text-muted-foreground">
                <AlertCircle className="h-8 w-8 mx-auto mb-2" />
                Silakan pilih studio terlebih dahulu untuk melihat time slots
              </div>
            </CardContent>
          </Card>
        ) : loading ? (
          <div className="space-y-2">
            {[...Array(5)].map((_, i) => (
              <Skeleton key={i} className="h-20 w-full" />
            ))}
          </div>
        ) : (
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Clock className="h-5 w-5" />
                Daftar Time Slots
              </CardTitle>
              <CardDescription>
                Kelola jadwal waktu yang tersedia untuk booking
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="rounded-md border">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Tanggal</TableHead>
                      <TableHead>Waktu</TableHead>
                      <TableHead>Fasilitas</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>Catatan</TableHead>
                      <TableHead className="w-[100px]">Aksi</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {timeSlots.length === 0 ? (
                      <TableRow>
                        <TableCell colSpan={6} className="text-center h-24 text-muted-foreground">
                          {searchTerm ? "Tidak ada time slots yang cocok dengan pencarian" : "Belum ada time slots yang terdaftar"}
                        </TableCell>
                      </TableRow>
                    ) : (
                      timeSlots.map((slot) => (
                        <TableRow key={slot.id}>
                          <TableCell>
                            <div className="font-medium">
                              {formatDate(slot.slot_date)}
                            </div>
                          </TableCell>
                          <TableCell>
                            <div className="flex items-center space-x-1">
                              <Clock className="h-4 w-4 text-muted-foreground" />
                              <span className="font-mono">
                                {formatTime(slot.start_time)} - {formatTime(slot.end_time)}
                              </span>
                            </div>
                          </TableCell>
                          <TableCell>
                            <div>
                              <div className="font-medium">{slot.facility?.name}</div>
                              <div className="text-sm text-muted-foreground flex items-center gap-1">
                                <Users className="h-3 w-3" />
                                Kapasitas: {slot.facility?.capacity}
                              </div>
                            </div>
                          </TableCell>
                          <TableCell>
                            <div className="flex flex-col gap-1">
                              <Badge
                                variant={slot.is_available && !slot.is_blocked ? "default" : "secondary"}
                              >
                                {slot.is_blocked
                                  ? "Diblokir"
                                  : slot.is_available
                                    ? "Tersedia"
                                    : "Tidak Tersedia"
                                }
                              </Badge>
                            </div>
                          </TableCell>
                          <TableCell>
                            {slot.notes ? (
                              <div className="text-sm text-muted-foreground line-clamp-2 max-w-xs">
                                {slot.notes}
                              </div>
                            ) : (
                              <span className="text-muted-foreground">-</span>
                            )}
                          </TableCell>
                          <TableCell>
                            <DropdownMenu>
                              <DropdownMenuTrigger asChild>
                                <Button variant="ghost" className="h-8 w-8 p-0">
                                  <MoreHorizontal className="h-4 w-4" />
                                </Button>
                              </DropdownMenuTrigger>
                              <DropdownMenuContent align="end">
                                <DropdownMenuLabel>Aksi</DropdownMenuLabel>
                                <DropdownMenuSeparator />
                                <DropdownMenuItem
                                  onClick={() => setTimeSlotToToggle(slot)}
                                  className="text-orange-600"
                                >
                                  {!slot.is_blocked && (
                                    <><Ban className="mr-2 h-4 w-4" />Blokir</>
                                  )}
                                </DropdownMenuItem>
                                <DropdownMenuItem
                                  className="text-red-600"
                                  onClick={() => setTimeSlotToDelete(slot)}
                                >
                                  <Trash className="mr-2 h-4 w-4" />
                                  Hapus
                                </DropdownMenuItem>
                              </DropdownMenuContent>
                            </DropdownMenu>
                          </TableCell>
                        </TableRow>
                      ))
                    )}
                  </TableBody>
                </Table>
              </div>
            </CardContent>
          </Card>
        )}
      </div>

      {/* Pagination */}
      {pagination && pagination.totalPages > 1 && (
        <div className="mt-8">
          <PaginationControls
            currentPage={pagination.page}
            totalPages={pagination.totalPages}
            pageSize={pagination.pageSize}
            total={pagination.total}
            onPageChange={handlePageChange}
            onPageSizeChange={handlePageSizeChange}
          />
        </div>
      )}

      {/* Dialogs */}
      <TimeSlotDialog
        open={isDialogOpen}
        onOpenChange={setIsDialogOpen}
        timeSlotData={selectedTimeSlot}
        onTimeSlotSaved={handleTimeSlotSaved}
      />

      <BulkTimeSlotsDialog
        open={isBulkDialogOpen}
        onOpenChange={setIsBulkDialogOpen}
        onTimeSlotsSaved={handleTimeSlotSaved}
      />

      {/* Toggle Blocking Dialog */}
      <AlertDialog open={!!timeSlotToToggle} onOpenChange={() => setTimeSlotToToggle(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>
              {timeSlotToToggle?.is_blocked ? "Aktifkan Time Slot" : "Blokir Time Slot"}
            </AlertDialogTitle>
            <AlertDialogDescription>
              {timeSlotToToggle?.is_blocked
                ? "Apakah Anda yakin ingin mengaktifkan time slot ini? Time slot akan tersedia untuk booking."
                : "Apakah Anda yakin ingin memblokir time slot ini? Time slot tidak akan tersedia untuk booking."
              }
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Batal</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => timeSlotToToggle && handleToggleBlocking(timeSlotToToggle)}
              className={timeSlotToToggle?.is_blocked ? "bg-green-600 hover:bg-green-700" : "bg-orange-600 hover:bg-orange-700"}
            >
              {timeSlotToToggle?.is_blocked ? "Aktifkan" : "Blokir"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Delete Dialog */}
      <AlertDialog open={!!timeSlotToDelete} onOpenChange={() => setTimeSlotToDelete(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Hapus Time Slot</AlertDialogTitle>
            <AlertDialogDescription>
              <div className="space-y-2">
                <p className="font-semibold text-red-600">⚠️ PERINGATAN: Aksi ini tidak dapat dibatalkan!</p>
                <p>
                  Apakah Anda yakin ingin menghapus time slot pada tanggal{" "}
                  <strong>{timeSlotToDelete && formatDate(timeSlotToDelete.slot_date)}</strong>{" "}
                  waktu <strong>{timeSlotToDelete && formatTime(timeSlotToDelete.start_time)} - {timeSlotToDelete && formatTime(timeSlotToDelete.end_time)}</strong>?
                </p>
                <p className="text-sm text-muted-foreground">
                  Time slot akan dihapus permanen dari sistem. Pastikan tidak ada booking yang menggunakan time slot ini.
                </p>
              </div>
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Batal</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => timeSlotToDelete && handleDelete(timeSlotToDelete)}
              className="bg-red-600 hover:bg-red-700"
            >
              Hapus Permanen
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  )
}