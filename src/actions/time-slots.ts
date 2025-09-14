"use server"

import { createClient } from '@/lib/supabase/server'
import { addHours, format, isBefore, startOfDay } from 'date-fns'
import { PaginationParams, PaginatedResult, calculatePagination } from '@/lib/constants/pagination'

export interface TimeSlot {
  id: string
  studio_id: string
  facility_id: string
  slot_date: string
  start_time: string
  end_time: string
  is_available: boolean
  is_blocked: boolean
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

// Helper function to check if specific facilities are available at a given time
export async function checkFacilityAvailability(
  supabase: any,
  studioId: string,
  date: string,
  startTime: Date,
  endTime: Date,
  packageId: string
): Promise<boolean> {
  try {
    // Get facilities required by the package
    const { data: packageFacilities, error: facilityError } = await supabase
      .from('package_facilities')
      .select('facility_id')
      .eq('package_id', packageId)

    if (facilityError) {
      console.error('Error fetching package facilities:', facilityError)
      return false
    }

    // If package doesn't require any facilities, it's always available
    if (!packageFacilities || packageFacilities.length === 0) {
      return true
    }

    // Get existing reservations that overlap with the requested time slot
    const { data: conflictingReservations, error: reservationError } = await supabase
      .from('reservations')
      .select(`
        id,
        selected_facilities
      `)
      .eq('studio_id', studioId)
      .eq('reservation_date', date)
      .in('status', ['confirmed', 'in_progress'])
      .lt('start_time', endTime.toTimeString().substring(0, 5))
      .gt('end_time', startTime.toTimeString().substring(0, 5))

    if (reservationError) {
      console.error('Error fetching conflicting reservations:', reservationError)
      return false
    }

    // Check if any required facilities are already booked
    const requiredFacilityIds = packageFacilities.map((pf: any) => pf.facility_id)

    for (const reservation of conflictingReservations || []) {
      if (reservation.selected_facilities) {
        // Check if any of the required facilities are already booked
        for (const facility of reservation.selected_facilities) {
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
  packageId?: string
): Promise<ActionResult<AvailableSlot[]>> {
  try {
    const supabase = await createClient()
    console.log('🔍 generateTimeSlotsForDate:', { studioId, date, packageDurationMinutes, packageId })
    // Get studio operating hours from studio settings
    const { data: studioData, error: studioError } = await supabase
      .from('studios')
      .select('operating_hours, settings')
      .eq('id', studioId)
      .single()

    if (studioError || !studioData) {
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

    const operatingHours = studioData.operating_hours || defaultHours
    const dayNames = ['sunday', 'monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday']
    const dayName = dayNames[dayOfWeek]
    const dayHours = operatingHours[dayName]

    console.log('dayHours', dayHours)
    console.log('dayHours', dayHours)

    // Check if studio is open on this day
    if (!dayHours || !dayHours.isOpen) {
      return { success: true, data: [] }
    }

    // Pre-fetch all required data in parallel to avoid N+1 queries
    const [
      reservationsResult,
      blockedSlotsResult,
      packageFacilitiesResult,
      allReservationsForFacilityCheckResult
    ] = await Promise.all([
      // Get existing reservations for this date and studio with their facilities
      supabase
        .from('reservations')
        .select(`
          start_time, 
          end_time, 
          total_duration,
          selected_facilities
        `)
        .eq('studio_id', studioId)
        .eq('reservation_date', date)
        .in('status', ['confirmed', 'in_progress']),

      // Get blocked time slots with facility info
      supabase
        .from('time_slots')
        .select('start_time, end_time, facility_id')
        .eq('studio_id', studioId)
        .eq('slot_date', date)
        .eq('is_blocked', true),

      // Get package facilities once if packageId provided
      packageId ? supabase
        .from('package_facilities')
        .select('facility_id')
        .eq('package_id', packageId) : { data: null, error: null },

      // Get ALL reservations for the date for facility conflict checking
      packageId ? supabase
        .from('reservations')
        .select(`
          id,
          start_time,
          end_time,
          selected_facilities
        `)
        .eq('studio_id', studioId)
        .eq('reservation_date', date)
        .in('status', ['confirmed', 'in_progress']) : { data: null, error: null }
    ])

    // Extract data and handle errors
    const existingReservations = reservationsResult.data
    const blockedSlots = blockedSlotsResult.data
    const packageFacilities = packageFacilitiesResult.data
    const allReservationsForFacilityCheck = allReservationsForFacilityCheckResult.data

    if (reservationsResult.error) {
      console.error('Error fetching reservations:', reservationsResult.error)
    }
    if (blockedSlotsResult.error) {
      console.error('Error fetching blocked slots:', blockedSlotsResult.error)
    }
    if (packageFacilitiesResult.error) {
      console.error('Error fetching package facilities:', packageFacilitiesResult.error)
    }
    if (allReservationsForFacilityCheckResult.error) {
      console.error('Error fetching facility check reservations:', allReservationsForFacilityCheckResult.error)
    }

    // Pre-calculate required facility IDs for faster lookup
    const requiredFacilityIds = packageFacilities?.map((pf: any) => pf.facility_id) || []
    console.log('📦 Package facilities required:', requiredFacilityIds)

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
      // Logic berdasarkan ada/tidaknya facility requirement
      let isConflictingWithReservation = false

      if (packageId && requiredFacilityIds.length > 0) {
        // Package DENGAN facility requirements - check facility conflict
        isConflictingWithReservation = existingReservations?.some(reservation => {
          const reservationStart = new Date(`${date} ${reservation.start_time}`)
          const reservationEnd = new Date(`${date} ${reservation.end_time}`)

          // Check time overlap
          const timeOverlap = (
            (currentTime >= reservationStart && currentTime < reservationEnd) ||
            (slotEndTime > reservationStart && slotEndTime <= reservationEnd) ||
            (currentTime <= reservationStart && slotEndTime >= reservationEnd)
          )

          // Only conflict if there's time overlap AND facility conflict
          if (timeOverlap && reservation.selected_facilities) {
            const hasConflictingFacility = reservation.selected_facilities.some((facility: any) =>
              requiredFacilityIds.includes(facility.id)
            )
            if (hasConflictingFacility) {
              console.log('⚠️  Facility conflict detected:', {
                time: timeString,
                requiredFacilities: requiredFacilityIds,
                reservedFacilities: reservation.selected_facilities.map((f: any) => f.id),
                reservationTime: `${reservation.start_time}-${reservation.end_time}`
              })
            }
            return hasConflictingFacility
          }
          return false
        }) || false
      } else if (packageId && requiredFacilityIds.length === 0) {
        // Package TANPA facility requirements - hanya conflict jika ada reservation yang overlap waktu
        // Package tanpa facility requirements bisa booking asal tidak bentrok dengan reservation lain
        isConflictingWithReservation = existingReservations?.some(reservation => {
          const reservationStart = new Date(`${date} ${reservation.start_time}`)
          const reservationEnd = new Date(`${date} ${reservation.end_time}`)

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
              reservationTime: `${reservation.start_time}-${reservation.end_time}`,
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

      // Check if this slot is blocked - need to check facility-specific blocks
      let isBlocked = false
      
      if (packageId && requiredFacilityIds.length > 0) {
        // Package DENGAN facility requirements - check if any required facilities are blocked
        isBlocked = blockedSlots?.some(blocked => {
          const blockedStart = new Date(`${date} ${blocked.start_time}`)
          const blockedEnd = new Date(`${date} ${blocked.end_time}`)

          const timeOverlap = (
            (currentTime >= blockedStart && currentTime < blockedEnd) ||
            (slotEndTime > blockedStart && slotEndTime <= blockedEnd) ||
            (currentTime <= blockedStart && slotEndTime >= blockedEnd)
          )

          // Only blocked if there's time overlap AND the blocked facility is required by this package
          // Note: blocked.facility_id should be checked against required facilities
          return timeOverlap && requiredFacilityIds.includes(blocked.facility_id)
        }) || false
      } else if (packageId && requiredFacilityIds.length === 0) {
        // Package TANPA facility requirements - tidak terpengaruh oleh facility blocks
        // Hanya terblokir jika ada general time block (yang seharusnya jarang)
        isBlocked = false
        console.log('✅ Package without facilities - not affected by facility blocks:', {
          time: timeString,
          packageId
        })
      } else {
        // No package specified - use general blocking logic
        isBlocked = blockedSlots?.some(blocked => {
          const blockedStart = new Date(`${date} ${blocked.start_time}`)
          const blockedEnd = new Date(`${date} ${blocked.end_time}`)

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
  packageId?: string
): Promise<ActionResult<AvailableSlot[]>> {
  try {
    // Validate date is not in the past
    const targetDate = new Date(date)
    const today = startOfDay(new Date())


    if (isBefore(targetDate, today)) {
      return { success: true, data: [] } // No slots for past dates
    }



    return await generateTimeSlotsForDate(studioId, date, packageDurationMinutes, packageId)
  } catch (error: any) {
    console.error('Error in getAvailableTimeSlotsAction:', error)
    return { success: false, error: error.message || 'An error occurred' }
  }
}

// Admin action to get all time slots for management
export async function getTimeSlotsAction(studioId?: string, date?: string): Promise<ActionResult<TimeSlot[]>> {
  try {
    const supabase = await createClient()

    // Get current user to check permissions
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    if (authError || !user) {
      return { success: false, error: 'Unauthorized' }
    }

    // Get current user profile
    const { data: currentProfile } = await supabase
      .from('user_profiles')
      .select('role, studio_id')
      .eq('id', user.id)
      .single()

    if (!currentProfile || !['admin', 'cs'].includes(currentProfile.role)) {
      return { success: false, error: 'Insufficient permissions' }
    }

    // Build query
    let query = supabase
      .from('time_slots')
      .select(`
        *,
        facility:facilities(id, name)
      `)
      .order('slot_date', { ascending: true })
      .order('start_time', { ascending: true })

    // Filter by studio - admin can see all, cs only their studio
    if (currentProfile.role === 'cs') {
      query = query.eq('studio_id', currentProfile.studio_id)
    } else if (studioId) {
      query = query.eq('studio_id', studioId)
    }

    // Filter by date if specified
    if (date) {
      query = query.eq('slot_date', date)
    }

    const { data: timeSlots, error } = await query

    if (error) {
      console.error('Error fetching time slots:', error)
      return { success: false, error: 'Failed to fetch time slots' }
    }

    return { success: true, data: timeSlots || [] }
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
    const supabase = await createClient()

    // Get current user to check permissions
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    if (authError || !user) {
      return { success: false, error: 'Unauthorized' }
    }

    // Get current user profile
    const { data: currentProfile } = await supabase
      .from('user_profiles')
      .select('role, studio_id')
      .eq('id', user.id)
      .single()

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
    const { error } = await supabase
      .from('time_slots')
      .insert({
        studio_id: studioId,
        facility_id: facilityId,
        slot_date: date,
        start_time: startTime,
        end_time: endTime,
        is_blocked: isBlocked,
        is_available: !isBlocked, // If blocked, not available; if not blocked, available
        notes: notes || null
      })

    if (error) {
      console.error('Error creating time slot:', error)
      return { success: false, error: `Failed to create time slot: ${error.message}` }
    }

    return { success: true }
  } catch (error: any) {
    console.error('Error in createTimeSlotAction:', error)
    return { success: false, error: error.message || 'An error occurred' }
  }
}


// Admin action to delete a time slot
export async function deleteTimeSlotAction(id: string): Promise<ActionResult> {
  try {
    const supabase = await createClient()

    // Get current user to check permissions
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    if (authError || !user) {
      return { success: false, error: 'Unauthorized' }
    }

    // Get current user profile
    const { data: currentProfile } = await supabase
      .from('user_profiles')
      .select('role, studio_id')
      .eq('id', user.id)
      .single()

    if (!currentProfile) {
      return { success: false, error: 'User profile not found' }
    }

    // Check permissions - admin can manage all studios, cs can only manage their studio
    // First get the time slot to check studio ownership
    const { data: timeSlot } = await supabase
      .from('time_slots')
      .select('studio_id')
      .eq('id', id)
      .single()

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
    const { error } = await supabase
      .from('time_slots')
      .delete()
      .eq('id', id)

    if (error) {
      console.error('Error deleting time slot:', error)
      return { success: false, error: `Failed to delete time slot: ${error.message}` }
    }

    return { success: true }
  } catch (error: any) {
    console.error('Error in deleteTimeSlotAction:', error)
    return { success: false, error: error.message || 'An error occurred' }
  }
}

// Admin action to toggle time slot blocking status
export async function toggleTimeSlotBlockingAction(
  id: string,
  isBlocked: boolean
): Promise<ActionResult> {
  try {
    const supabase = await createClient()

    // Get current user to check permissions
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    if (authError || !user) {
      return { success: false, error: 'Unauthorized' }
    }

    // Get current user profile
    const { data: currentProfile } = await supabase
      .from('user_profiles')
      .select('role, studio_id')
      .eq('id', user.id)
      .single()

    if (!currentProfile) {
      return { success: false, error: 'User profile not found' }
    }

    // Check permissions - admin can manage all studios, cs can only manage their studio
    // First get the time slot to check studio ownership
    const { data: timeSlot } = await supabase
      .from('time_slots')
      .select('studio_id')
      .eq('id', id)
      .single()

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
    const { error } = await supabase
      .from('time_slots')
      .update({
        is_blocked: isBlocked,
        is_available: !isBlocked // If blocked, not available; if not blocked, available
      })
      .eq('id', id)

    if (error) {
      console.error('Error toggling time slot blocking:', error)
      return { success: false, error: `Failed to update time slot: ${error.message}` }
    }

    return { success: true }
  } catch (error: any) {
    console.error('Error in toggleTimeSlotBlockingAction:', error)
    return { success: false, error: error.message || 'An error occurred' }
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
    const supabase = await createClient();

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
    } = params;

    const { offset, pageSize: validPageSize } = calculatePagination(page, pageSize, 0);

    // Get current user to check permissions
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    if (authError || !user) {
      throw new Error('Unauthorized')
    }

    // Get current user profile
    const { data: currentProfile } = await supabase
      .from('user_profiles')
      .select('role, studio_id')
      .eq('id', user.id)
      .single()

    if (!currentProfile || !['admin', 'cs'].includes(currentProfile.role)) {
      throw new Error('Insufficient permissions')
    }

    // Build query
    let query = supabase
      .from('time_slots')
      .select(`
        *,
        facility:facilities(id, name)
      `, { count: 'exact' })
      .order('slot_date', { ascending: true })
      .order('start_time', { ascending: true })

    // Filter by studio - admin can see all, cs only their studio
    if (currentProfile.role === 'cs') {
      query = query.eq('studio_id', currentProfile.studio_id)
    } else if (studioId) {
      query = query.eq('studio_id', studioId)
    }

    // Apply status filter
    if (status === 'available') {
      query = query.eq('is_available', true).eq('is_blocked', false)
    } else if (status === 'blocked') {
      query = query.eq('is_blocked', true)
    } else if (status === 'unavailable') {
      query = query.eq('is_available', false)
    }

    // Apply facility filter
    if (facilityId) {
      query = query.eq('facility_id', facilityId)
    }

    // Apply date range filter
    if (startDate && endDate) {
      query = query.gte('slot_date', startDate).lte('slot_date', endDate)
    } else if (startDate) {
      query = query.eq('slot_date', startDate)
    }

    // Apply search filter
    const searchStr = search ?? '';
    if (typeof searchStr === 'string' && searchStr.trim()) {
      query = query.or(`notes.ilike.%${searchStr}%`);
    }

    // Apply pagination
    const { data, error, count } = await query
      .range(offset, offset + validPageSize - 1)

    if (error) {
      console.error('Error fetching paginated time slots:', error)
      throw new Error(`Failed to fetch time slots: ${error.message}`)
    }

    const total = count || 0
    const pagination = calculatePagination(page, validPageSize, total)

    return {
      data: data || [],
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
    const supabase = await createClient()

    // Get current user to check permissions
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    if (authError || !user) {
      return { success: false, error: 'Unauthorized' }
    }

    // Get current user profile
    const { data: currentProfile } = await supabase
      .from('user_profiles')
      .select('role, studio_id')
      .eq('id', user.id)
      .single()

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
          slot_date: date,
          start_time: range.startTime,
          end_time: range.endTime,
          is_available: false,
          is_blocked: true
        })
      }
    }

    // Insert all time slots
    const { error } = await supabase
      .from('time_slots')
      .insert(timeSlotsToCreate)

    if (error) {
      console.error('Error bulk creating time slots:', error)
      return { success: false, error: `Failed to create time slots: ${error.message}` }
    }

    return { success: true }
  } catch (error: any) {
    console.error('Error in bulkCreateTimeSlotsAction:', error)
    return { success: false, error: error.message || 'An error occurred' }
  }
}