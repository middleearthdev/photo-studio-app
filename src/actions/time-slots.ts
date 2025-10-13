"use server"

import { prisma } from '@/lib/prisma'
import { auth } from '@/lib/auth'
import { addHours, format, isBefore, startOfDay } from 'date-fns'
import { headers } from 'next/headers'
import { PaginationParams, PaginatedResult, calculatePagination } from '@/lib/constants/pagination'

export interface TimeSlot {
  id: string
  studio_id: string | null
  facility_id: string | null
  slot_date: string
  start_time: string
  end_time: string
  is_available: boolean | null
  is_blocked: boolean | null
  notes: string | null
  facility?: {
    id: string
    name: string
    capacity: string
  }
}

export interface AvailableSlot {
  id: string
  time: string
  available: boolean
  facility_id?: string
  facility_name?: string
}

export interface ActionResult<T = any> {
  success: boolean
  data?: T
  error?: string
}

// Helper function to get current user session
async function getCurrentUser() {
  const session = await auth.api.getSession({
    headers: await headers()
  })
  return session?.user || null
}

// Helper function to check if specific facilities are available at a given time
export async function checkFacilityAvailability(
  studioId: string,
  date: string,
  startTime: Date,
  endTime: Date,
  packageId: string
): Promise<boolean> {
  try {
    // Get facilities required by the package
    const packageFacilities = await prisma.packageFacility.findMany({
      where: { package_id: packageId },
      select: { facility_id: true }
    })

    // If package doesn't require any facilities, it's always available
    if (!packageFacilities || packageFacilities.length === 0) {
      return true
    }

    // Get existing reservations that overlap with the requested time slot
    const conflictingReservations = await prisma.reservation.findMany({
      where: {
        studio_id: studioId,
        reservation_date: new Date(date),
        status: {
          in: ['pending', 'confirmed', 'in_progress']
        },
        AND: [
          {
            start_time: {
              lt: endTime.toTimeString().substring(0, 5)
            }
          },
          {
            end_time: {
              gt: startTime.toTimeString().substring(0, 5)
            }
          }
        ]
      },
      select: {
        id: true,
        selected_facilities: true
      }
    })

    // Check if any required facilities are already booked
    const requiredFacilityIds = packageFacilities.map((pf: any) => pf.facility_id)

    for (const reservation of conflictingReservations || []) {
      if (reservation.selected_facilities) {
        // Parse selected_facilities JSON and check conflicts
        const selectedFacilities = Array.isArray(reservation.selected_facilities)
          ? reservation.selected_facilities
          : JSON.parse(reservation.selected_facilities as string)
        
        // Check if any of the required facilities are already booked
        for (const facility of selectedFacilities) {
          if (requiredFacilityIds.includes(facility.id)) {
            return false // Facility is already booked
          }
        }
      }
    }

    return true // All required facilities are available
  } catch (error) {
    console.error('Error in checkFacilityAvailability:', error)
    return false
  }
}

// Helper function to generate time slots based on studio operating hours
export async function generateTimeSlotsForDate(
  studioId: string,
  date: string,
  packageDurationMinutes: number = 90,
  packageId?: string,
  excludeReservationId?: string
): Promise<ActionResult<AvailableSlot[]>> {
  try {
    console.log('🔍 generateTimeSlotsForDate:', { studioId, date, packageDurationMinutes, packageId, excludeReservationId })
    
    // Get studio operating hours from studio settings
    const studioData = await prisma.studio.findUnique({
      where: { id: studioId },
      select: { operating_hours: true, settings: true }
    })

    if (!studioData) {
      return { success: false, error: 'Studio not found' }
    }

    // Get day of week (0 = Sunday, 6 = Saturday)
    const targetDate = new Date(date)
    const dayOfWeek = targetDate.getDay()

    // Default operating hours if not set
    const defaultHours = {
      monday: { open: '09:00', close: '18:00', isOpen: true },
      tuesday: { open: '09:00', close: '18:00', isOpen: true },
      wednesday: { open: '09:00', close: '18:00', isOpen: true },
      thursday: { open: '09:00', close: '18:00', isOpen: true },
      friday: { open: '09:00', close: '18:00', isOpen: true },
      saturday: { open: '09:00', close: '17:00', isOpen: true },
      sunday: { open: '10:00', close: '16:00', isOpen: false }
    }

    const operatingHours = (studioData.operating_hours as any) || defaultHours
    const dayNames = ['sunday', 'monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday']
    const dayName = dayNames[dayOfWeek]
    const dayHours = operatingHours[dayName]

    console.log('dayHours', dayHours)

    // Check if studio is open on this day
    if (!dayHours || !dayHours.isOpen) {
      return { success: true, data: [] }
    }

    // Pre-fetch all required data in parallel to avoid N+1 queries
    const [
      existingReservations,
      blockedSlots,
      packageFacilities,
      allReservationsForFacilityCheck
    ] = await Promise.all([
      // Get existing reservations for this date and studio with their facilities
      prisma.reservation.findMany({
        where: {
          studio_id: studioId,
          reservation_date: new Date(date),
          status: {
            in: ['pending', 'confirmed', 'in_progress']
          },
          ...(excludeReservationId && {
            id: {
              not: excludeReservationId
            }
          })
        },
        select: {
          start_time: true,
          end_time: true,
          total_duration: true,
          selected_facilities: true
        }
      }),

      // Get blocked time slots with facility info
      prisma.timeSlot.findMany({
        where: {
          studio_id: studioId,
          slot_date: new Date(date),
          is_blocked: true
        },
        select: {
          start_time: true,
          end_time: true,
          facility_id: true
        }
      }),

      // Get package facilities once if packageId provided
      packageId ? prisma.packageFacility.findMany({
        where: { package_id: packageId },
        select: { facility_id: true }
      }) : null,

      // Get ALL reservations for the date for facility conflict checking
      packageId ? prisma.reservation.findMany({
        where: {
          studio_id: studioId,
          reservation_date: new Date(date),
          status: {
            in: ['pending', 'confirmed', 'in_progress']
          },
          ...(excludeReservationId && {
            id: {
              not: excludeReservationId
            }
          })
        },
        select: {
          id: true,
          start_time: true,
          end_time: true,
          selected_facilities: true
        }
      }) : null
    ])

    // Pre-calculate required facility IDs for faster lookup
    const requiredFacilityIds = packageFacilities?.map((pf: any) => pf.facility_id) || []
    console.log('📦 Package facilities required:', requiredFacilityIds)
    console.log('🔍 Existing reservations found:', existingReservations?.length || 0, 
                excludeReservationId ? `(excluding ${excludeReservationId})` : '')

    // Generate available time slots
    const slots: AvailableSlot[] = []
    const startTime = dayHours.open
    const endTime = dayHours.close
    const slotInterval = 30 // 30 minutes between slots

    // Parse start and end times
    const [startHour, startMinute] = startTime.split(':').map(Number)
    const [endHour, endMinute] = endTime.split(':').map(Number)

    const startDateTime = new Date(targetDate)
    startDateTime.setHours(startHour, startMinute, 0, 0)

    const endDateTime = new Date(targetDate)
    endDateTime.setHours(endHour, endMinute, 0, 0)

    const currentTime = new Date(startDateTime)
    let slotId = 1

    while (currentTime < endDateTime) {
      const slotEndTime = new Date(currentTime.getTime() + packageDurationMinutes * 60000)

      // Check if slot end time exceeds operating hours
      if (slotEndTime > endDateTime) break

      const timeString = format(currentTime, 'HH:mm')
      const slotEndTimeString = format(slotEndTime, 'HH:mm')

      // Check if this slot conflicts with existing reservations
      let isConflictingWithReservation = false

      if (packageId && requiredFacilityIds.length > 0) {
        // Package WITH facility requirements - check facility conflict
        isConflictingWithReservation = existingReservations?.some((reservation: any) => {
          const reservationStart = new Date(`${date} ${reservation.start_time.toTimeString().substring(0, 5)}`)
          const reservationEnd = new Date(`${date} ${reservation.end_time.toTimeString().substring(0, 5)}`)

          // Check time overlap
          const timeOverlap = (
            (currentTime >= reservationStart && currentTime < reservationEnd) ||
            (slotEndTime > reservationStart && slotEndTime <= reservationEnd) ||
            (currentTime <= reservationStart && slotEndTime >= reservationEnd)
          )

          // Only conflict if there's time overlap AND facility conflict
          if (timeOverlap && reservation.selected_facilities) {
            const selectedFacilities = Array.isArray(reservation.selected_facilities)
              ? reservation.selected_facilities
              : JSON.parse(reservation.selected_facilities as string)
            
            const hasConflictingFacility = selectedFacilities.some((facility: any) =>
              requiredFacilityIds.includes(facility.id)
            )
            if (hasConflictingFacility) {
              console.log('⚠️  Facility conflict detected:', {
                time: timeString,
                requiredFacilities: requiredFacilityIds,
                reservedFacilities: selectedFacilities.map((f: any) => f.id),
                reservationTime: `${reservation.start_time.toTimeString().substring(0, 5)}-${reservation.end_time.toTimeString().substring(0, 5)}`
              })
            }
            return hasConflictingFacility
          }
          return false
        }) || false
      } else if (packageId && requiredFacilityIds.length === 0) {
        // Package WITHOUT facility requirements - only conflict if time overlap
        isConflictingWithReservation = existingReservations?.some((reservation: any) => {
          const reservationStart = new Date(`${date} ${reservation.start_time.toTimeString().substring(0, 5)}`)
          const reservationEnd = new Date(`${date} ${reservation.end_time.toTimeString().substring(0, 5)}`)

          // Check time overlap
          const timeOverlap = (
            (currentTime >= reservationStart && currentTime < reservationEnd) ||
            (slotEndTime > reservationStart && slotEndTime <= reservationEnd) ||
            (currentTime <= reservationStart && slotEndTime >= reservationEnd)
          )

          if (timeOverlap) {
            console.log('⚠️  Time conflict for package without facilities:', {
              time: timeString,
              packageId,
              reservationTime: `${reservation.start_time.toTimeString().substring(0, 5)}-${reservation.end_time.toTimeString().substring(0, 5)}`,
              reason: 'Time slot overlap with existing reservation'
            })
          }

          return timeOverlap
        }) || false

        console.log('✅ Package has no facilities - checking time conflicts only:', {
          time: timeString,
          packageId,
          hasTimeConflict: isConflictingWithReservation
        })
      }

      // Check if this slot is blocked
      let isBlocked = false

      if (packageId && requiredFacilityIds.length > 0) {
        // Package WITH facility requirements - check if any required facilities are blocked
        isBlocked = blockedSlots?.some((blocked: any) => {
          const blockedStart = new Date(`${date} ${blocked.start_time.toTimeString().substring(0, 5)}`)
          const blockedEnd = new Date(`${date} ${blocked.end_time.toTimeString().substring(0, 5)}`)

          const timeOverlap = (
            (currentTime >= blockedStart && currentTime < blockedEnd) ||
            (slotEndTime > blockedStart && slotEndTime <= blockedEnd) ||
            (currentTime <= blockedStart && slotEndTime >= blockedEnd)
          )

          // Only blocked if there's time overlap AND the blocked facility is required by this package
          return timeOverlap && requiredFacilityIds.includes(blocked.facility_id)
        }) || false
      } else if (packageId && requiredFacilityIds.length === 0) {
        // Package WITHOUT facility requirements - not affected by facility blocks
        isBlocked = false
        console.log('✅ Package without facilities - not affected by facility blocks:', {
          time: timeString,
          packageId
        })
      } else {
        // No package specified - use general blocking logic
        isBlocked = blockedSlots?.some((blocked: any) => {
          const blockedStart = new Date(`${date} ${blocked.start_time.toTimeString().substring(0, 5)}`)
          const blockedEnd = new Date(`${date} ${blocked.end_time.toTimeString().substring(0, 5)}`)

          return (
            (currentTime >= blockedStart && currentTime < blockedEnd) ||
            (slotEndTime > blockedStart && slotEndTime <= blockedEnd) ||
            (currentTime <= blockedStart && slotEndTime >= blockedEnd)
          )
        }) || false
      }

      // Check if slot is in the past
      const now = new Date()
      const isPast = isBefore(currentTime, now)

      const isAvailable = !isConflictingWithReservation && !isBlocked && !isPast

      // Debug logging for available/unavailable slots
      if (isAvailable && packageId) {
        console.log('✅ Available slot:', {
          time: timeString,
          packageId,
          requiredFacilities: requiredFacilityIds,
          hasFacilityRequirements: requiredFacilityIds.length > 0
        })
      } else if (!isAvailable && packageId) {
        console.log('❌ Unavailable slot:', {
          time: timeString,
          packageId,
          reasons: {
            hasReservationConflict: isConflictingWithReservation,
            isBlocked: isBlocked,
            isPast: isPast
          }
        })
      } else if (isAvailable && !packageId) {
        console.log('✅ Available slot (no package specified):', {
          time: timeString
        })
      }

      slots.push({
        id: slotId.toString(),
        time: timeString,
        available: isAvailable
      })

      // Move to next slot
      currentTime.setTime(currentTime.getTime() + slotInterval * 60000)
      slotId++
    }
    console.log('slots', slots)

    return { success: true, data: slots }
  } catch (error: any) {
    console.error('Error in generateTimeSlotsForDate:', error)
    return { success: false, error: error.message || 'An error occurred' }
  }
}

// Public action to get available time slots for a specific date and studio
export async function getAvailableTimeSlotsAction(
  studioId: string,
  date: string,
  packageDurationMinutes: number = 90,
  packageId?: string,
  excludeReservationId?: string
): Promise<ActionResult<AvailableSlot[]>> {
  try {
    // Validate date is not in the past
    const targetDate = new Date(date)
    const today = startOfDay(new Date())

    if (isBefore(targetDate, today)) {
      return { success: true, data: [] } // No slots for past dates
    }

    return await generateTimeSlotsForDate(studioId, date, packageDurationMinutes, packageId, excludeReservationId)
  } catch (error: any) {
    console.error('Error in getAvailableTimeSlotsAction:', error)
    return { success: false, error: error.message || 'An error occurred' }
  }
}

// Admin action to get all time slots for management
export async function getTimeSlotsAction(studioId?: string, date?: string): Promise<ActionResult<TimeSlot[]>> {
  try {
    // Get current user to check permissions
    const user = await getCurrentUser()
    if (!user) {
      return { success: false, error: 'Unauthorized' }
    }

    // Get current user profile
    const currentProfile = await prisma.user.findUnique({
      where: { id: user.id },
      select: { role: true, studio_id: true }
    })

    if (!currentProfile || !['admin', 'cs'].includes(currentProfile.role)) {
      return { success: false, error: 'Insufficient permissions' }
    }

    // Build where clause
    const where: any = {}

    // Filter by studio - admin can see all, cs only their studio
    if (currentProfile.role === 'cs') {
      where.studio_id = currentProfile.studio_id
    } else if (studioId) {
      where.studio_id = studioId
    }

    // Filter by date if specified
    if (date) {
      where.slot_date = new Date(date)
    }

    const timeSlots = await prisma.timeSlot.findMany({
      where,
      include: {
        facility: {
          select: {
            id: true,
            name: true,
            capacity: true
          }
        }
      },
      orderBy: [
        { slot_date: 'asc' },
        { start_time: 'asc' }
      ]
    })

    const formattedTimeSlots: TimeSlot[] = timeSlots.map((slot: any) => ({
      ...slot,
      slot_date: slot.slot_date.toISOString().split('T')[0],
      start_time: slot.start_time.toTimeString().substring(0, 5),
      end_time: slot.end_time.toTimeString().substring(0, 5)
    }))

    return { success: true, data: formattedTimeSlots }
  } catch (error: any) {
    console.error('Error in getTimeSlotsAction:', error)
    return { success: false, error: error.message || 'An error occurred' }
  }
}

// Admin action to create/block a time slot
export async function createTimeSlotAction(
  studioId: string,
  facilityId: string,
  date: string,
  startTime: string,
  endTime: string,
  isBlocked: boolean = false,
  notes?: string
): Promise<ActionResult> {
  try {
    // Get current user to check permissions
    const user = await getCurrentUser()
    if (!user) {
      return { success: false, error: 'Unauthorized' }
    }

    // Get current user profile
    const currentProfile = await prisma.user.findUnique({
      where: { id: user.id },
      select: { role: true, studio_id: true }
    })

    if (!currentProfile) {
      return { success: false, error: 'User profile not found' }
    }

    // Check permissions - admin can manage all studios, cs can only manage their studio
    if (currentProfile.role === 'cs' && currentProfile.studio_id !== studioId) {
      return { success: false, error: 'Insufficient permissions' }
    }

    if (!['admin', 'cs'].includes(currentProfile.role)) {
      return { success: false, error: 'Insufficient permissions' }
    }

    // Create the time slot
    await prisma.timeSlot.create({
      data: {
        studio_id: studioId,
        facility_id: facilityId,
        slot_date: new Date(date),
        start_time: new Date(`1970-01-01T${startTime}:00`),
        end_time: new Date(`1970-01-01T${endTime}:00`),
        is_blocked: isBlocked,
        is_available: !isBlocked, // If blocked, not available; if not blocked, available
        notes: notes || null
      }
    })

    return { success: true }
  } catch (error: any) {
    console.error('Error in createTimeSlotAction:', error)
    return { success: false, error: error.message || 'Failed to create time slot' }
  }
}

// Admin action to delete a time slot
export async function deleteTimeSlotAction(id: string): Promise<ActionResult> {
  try {
    // Get current user to check permissions
    const user = await getCurrentUser()
    if (!user) {
      return { success: false, error: 'Unauthorized' }
    }

    // Get current user profile
    const currentProfile = await prisma.user.findUnique({
      where: { id: user.id },
      select: { role: true, studio_id: true }
    })

    if (!currentProfile) {
      return { success: false, error: 'User profile not found' }
    }

    // Check permissions - admin can manage all studios, cs can only manage their studio
    // First get the time slot to check studio ownership
    const timeSlot = await prisma.timeSlot.findUnique({
      where: { id },
      select: { studio_id: true }
    })

    if (!timeSlot) {
      return { success: false, error: 'Time slot not found' }
    }

    if (currentProfile.role === 'cs' && currentProfile.studio_id !== timeSlot.studio_id) {
      return { success: false, error: 'Insufficient permissions' }
    }

    if (!['admin', 'cs'].includes(currentProfile.role)) {
      return { success: false, error: 'Insufficient permissions' }
    }

    // Delete the time slot
    await prisma.timeSlot.delete({
      where: { id }
    })

    return { success: true }
  } catch (error: any) {
    console.error('Error in deleteTimeSlotAction:', error)
    return { success: false, error: error.message || 'Failed to delete time slot' }
  }
}

// Admin action to toggle time slot blocking status
export async function toggleTimeSlotBlockingAction(
  id: string,
  isBlocked: boolean
): Promise<ActionResult> {
  try {
    // Get current user to check permissions
    const user = await getCurrentUser()
    if (!user) {
      return { success: false, error: 'Unauthorized' }
    }

    // Get current user profile
    const currentProfile = await prisma.user.findUnique({
      where: { id: user.id },
      select: { role: true, studio_id: true }
    })

    if (!currentProfile) {
      return { success: false, error: 'User profile not found' }
    }

    // Check permissions - admin can manage all studios, cs can only manage their studio
    // First get the time slot to check studio ownership
    const timeSlot = await prisma.timeSlot.findUnique({
      where: { id },
      select: { studio_id: true }
    })

    if (!timeSlot) {
      return { success: false, error: 'Time slot not found' }
    }

    if (currentProfile.role === 'cs' && currentProfile.studio_id !== timeSlot.studio_id) {
      return { success: false, error: 'Insufficient permissions' }
    }

    if (!['admin', 'cs'].includes(currentProfile.role)) {
      return { success: false, error: 'Insufficient permissions' }
    }

    // Update the time slot blocking status
    await prisma.timeSlot.update({
      where: { id },
      data: {
        is_blocked: isBlocked,
        is_available: !isBlocked // If blocked, not available; if not blocked, available
      }
    })

    return { success: true }
  } catch (error: any) {
    console.error('Error in toggleTimeSlotBlockingAction:', error)
    return { success: false, error: error.message || 'Failed to update time slot' }
  }
}

// Admin action to get paginated time slots for management
export async function getPaginatedTimeSlots(
  params: PaginationParams & {
    studioId?: string
    search?: string
    status?: 'all' | 'available' | 'blocked' | 'unavailable'
    facilityId?: string
    startDate?: string
    endDate?: string
  } = {}
): Promise<PaginatedResult<TimeSlot>> {
  try {
    // Set defaults for params
    const {
      page = 1,
      pageSize = 10,
      search,
      studioId,
      status = 'all',
      facilityId,
      startDate,
      endDate
    } = params

    const { offset, pageSize: validPageSize } = calculatePagination(page, pageSize, 0)

    // Get current user to check permissions
    const user = await getCurrentUser()
    if (!user) {
      throw new Error('Unauthorized')
    }

    // Get current user profile
    const currentProfile = await prisma.user.findUnique({
      where: { id: user.id },
      select: { role: true, studio_id: true }
    })

    if (!currentProfile || !['admin', 'cs'].includes(currentProfile.role)) {
      throw new Error('Insufficient permissions')
    }

    // Build where clause
    const where: any = {}

    // Filter by studio - admin can see all, cs only their studio
    if (currentProfile.role === 'cs') {
      where.studio_id = currentProfile.studio_id
    } else if (studioId) {
      where.studio_id = studioId
    }

    // Apply status filter
    if (status === 'available') {
      where.is_available = true
      where.is_blocked = false
    } else if (status === 'blocked') {
      where.is_blocked = true
    } else if (status === 'unavailable') {
      where.is_available = false
    }

    // Apply facility filter
    if (facilityId) {
      where.facility_id = facilityId
    }

    // Apply date range filter
    if (startDate && endDate) {
      where.slot_date = {
        gte: new Date(startDate),
        lte: new Date(endDate)
      }
    } else if (startDate) {
      where.slot_date = new Date(startDate)
    }

    // Apply search filter
    if (search && search.trim()) {
      where.notes = {
        contains: search,
        mode: 'insensitive'
      }
    }

    // Get data with count
    const [timeSlots, total] = await Promise.all([
      prisma.timeSlot.findMany({
        where,
        include: {
          facility: {
            select: {
              id: true,
              name: true,
              capacity: true
            }
          }
        },
        orderBy: [
          { slot_date: 'asc' },
          { start_time: 'asc' }
        ],
        skip: offset,
        take: validPageSize
      }),
      prisma.timeSlot.count({ where })
    ])

    const formattedData: TimeSlot[] = timeSlots.map((slot: any) => ({
      ...slot,
      slot_date: slot.slot_date.toISOString().split('T')[0],
      start_time: slot.start_time.toTimeString().substring(0, 5),
      end_time: slot.end_time.toTimeString().substring(0, 5)
    }))

    const pagination = calculatePagination(page, validPageSize, total)

    return {
      data: formattedData,
      pagination
    }
  } catch (error: any) {
    console.error('Error in getPaginatedTimeSlots:', error)
    throw error
  }
}

// Admin action to bulk create time slots
export async function bulkCreateTimeSlotsAction(
  studioId: string,
  facilityId: string,
  startDate: string,
  endDate: string,
  timeRanges: { startTime: string; endTime: string }[],
  skipWeekends: boolean = false
): Promise<ActionResult> {
  try {
    // Get current user to check permissions
    const user = await getCurrentUser()
    if (!user) {
      return { success: false, error: 'Unauthorized' }
    }

    // Get current user profile
    const currentProfile = await prisma.user.findUnique({
      where: { id: user.id },
      select: { role: true, studio_id: true }
    })

    if (!currentProfile) {
      return { success: false, error: 'User profile not found' }
    }

    // Check permissions - admin can manage all studios, cs can only manage their studio
    if (currentProfile.role === 'cs' && currentProfile.studio_id !== studioId) {
      return { success: false, error: 'Insufficient permissions' }
    }

    if (!['admin', 'cs'].includes(currentProfile.role)) {
      return { success: false, error: 'Insufficient permissions' }
    }

    // Generate dates between start and end date
    const start = new Date(startDate)
    const end = new Date(endDate)
    const dates: string[] = []

    for (let d = new Date(start); d <= end; d.setDate(d.getDate() + 1)) {
      // Skip weekends if requested
      if (skipWeekends && (d.getDay() === 0 || d.getDay() === 6)) {
        continue
      }
      dates.push(d.toISOString().split('T')[0])
    }

    // Create time slots for each date and time range
    const timeSlotsToCreate = []
    for (const date of dates) {
      for (const range of timeRanges) {
        timeSlotsToCreate.push({
          studio_id: studioId,
          facility_id: facilityId,
          slot_date: new Date(date),
          start_time: new Date(`1970-01-01T${range.startTime}:00`),
          end_time: new Date(`1970-01-01T${range.endTime}:00`),
          is_available: false,
          is_blocked: true
        })
      }
    }

    // Insert all time slots
    await prisma.timeSlot.createMany({
      data: timeSlotsToCreate
    })

    return { success: true }
  } catch (error: any) {
    console.error('Error in bulkCreateTimeSlotsAction:', error)
    return { success: false, error: error.message || 'Failed to create time slots' }
  }
}