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

// Helper function to generate time slots based on studio operating hours
export async function generateTimeSlotsForDate(
  studioId: string,
  date: string,
  packageDurationMinutes: number = 90
): Promise<ActionResult<AvailableSlot[]>> {
  try {
    const supabase = await createClient()
    console.log('studioId', studioId)
    console.log('date', date)
    console.log('packageDurationMinutes', packageDurationMinutes)
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

    // Get existing reservations for this date and studio
    const { data: existingReservations, error: reservationError } = await supabase
      .from('reservations')
      .select('start_time, end_time, total_duration')
      .eq('studio_id', studioId)
      .eq('reservation_date', date)
      .in('status', ['confirmed', 'in_progress'])

    if (reservationError) {
      console.error('Error fetching reservations:', reservationError)
    }

    // Get blocked time slots
    const { data: blockedSlots, error: blockedError } = await supabase
      .from('time_slots')
      .select('start_time, end_time')
      .eq('studio_id', studioId)
      .eq('slot_date', date)
      .eq('is_blocked', true)

    if (blockedError) {
      console.error('Error fetching blocked slots:', blockedError)
    }

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

    let currentTime = new Date(startDateTime)
    let slotId = 1

    while (currentTime < endDateTime) {
      const slotEndTime = new Date(currentTime.getTime() + packageDurationMinutes * 60000)

      // Check if slot end time exceeds operating hours
      if (slotEndTime > endDateTime) break

      const timeString = format(currentTime, 'HH:mm')
      const slotEndTimeString = format(slotEndTime, 'HH:mm')

      // Check if this slot conflicts with existing reservations
      const isConflictingWithReservation = existingReservations?.some(reservation => {
        const reservationStart = new Date(`${date} ${reservation.start_time}`)
        const reservationEnd = new Date(`${date} ${reservation.end_time}`)

        return (
          (currentTime >= reservationStart && currentTime < reservationEnd) ||
          (slotEndTime > reservationStart && slotEndTime <= reservationEnd) ||
          (currentTime <= reservationStart && slotEndTime >= reservationEnd)
        )
      })

      // Check if this slot is blocked
      const isBlocked = blockedSlots?.some(blocked => {
        const blockedStart = new Date(`${date} ${blocked.start_time}`)
        const blockedEnd = new Date(`${date} ${blocked.end_time}`)

        return (
          (currentTime >= blockedStart && currentTime < blockedEnd) ||
          (slotEndTime > blockedStart && slotEndTime <= blockedEnd) ||
          (currentTime <= blockedStart && slotEndTime >= blockedEnd)
        )
      })

      // Check if slot is in the past
      const now = new Date()
      const isPast = isBefore(currentTime, now)

      const isAvailable = !isConflictingWithReservation && !isBlocked && !isPast

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
  packageDurationMinutes: number = 90
): Promise<ActionResult<AvailableSlot[]>> {
  try {
    // Validate date is not in the past
    const targetDate = new Date(date)
    const today = startOfDay(new Date())


    if (isBefore(targetDate, today)) {
      return { success: true, data: [] } // No slots for past dates
    }



    return await generateTimeSlotsForDate(studioId, date, packageDurationMinutes)
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

    if (!currentProfile || !['admin', 'cs'].includes(currentProfile.role)) {
      return { success: false, error: 'Insufficient permissions' }
    }

    // Check if user has permission for this studio
    if (currentProfile.role === 'cs' && currentProfile.studio_id !== studioId) {
      return { success: false, error: 'Insufficient permissions for this studio' }
    }

    // Create time slot
    const { error } = await supabase
      .from('time_slots')
      .insert({
        studio_id: studioId,
        facility_id: facilityId,
        slot_date: date,
        start_time: startTime,
        end_time: endTime,
        is_available: !isBlocked,
        is_blocked: isBlocked,
        notes: notes
      })

    if (error) {
      console.error('Error creating time slot:', error)
      return { success: false, error: error.message }
    }

    return { success: true }
  } catch (error: any) {
    console.error('Error in createTimeSlotAction:', error)
    return { success: false, error: error.message || 'Failed to create time slot' }
  }
}

// Admin action to update time slot availability
export async function updateTimeSlotAction(
  slotId: string,
  updates: {
    is_available?: boolean
    is_blocked?: boolean
    notes?: string
  }
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

    if (!currentProfile || !['admin', 'cs'].includes(currentProfile.role)) {
      return { success: false, error: 'Insufficient permissions' }
    }

    // Build update query with studio check for CS users
    let query = supabase
      .from('time_slots')
      .update({
        ...updates,
        updated_at: new Date().toISOString()
      })
      .eq('id', slotId)

    // CS users can only update their studio's slots
    if (currentProfile.role === 'cs') {
      query = query.eq('studio_id', currentProfile.studio_id)
    }

    const { error } = await query

    if (error) {
      console.error('Error updating time slot:', error)
      return { success: false, error: error.message }
    }

    return { success: true }
  } catch (error: any) {
    console.error('Error in updateTimeSlotAction:', error)
    return { success: false, error: error.message || 'Failed to update time slot' }
  }
}

// Admin action to delete a time slot
export async function deleteTimeSlotAction(slotId: string): Promise<ActionResult> {
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

    // Build delete query with studio check for CS users
    let query = supabase
      .from('time_slots')
      .delete()
      .eq('id', slotId)

    // CS users can only delete their studio's slots
    if (currentProfile.role === 'cs') {
      query = query.eq('studio_id', currentProfile.studio_id)
    }

    const { error } = await query

    if (error) {
      console.error('Error deleting time slot:', error)
      return { success: false, error: error.message }
    }

    return { success: true }
  } catch (error: any) {
    console.error('Error in deleteTimeSlotAction:', error)
    return { success: false, error: error.message || 'Failed to delete time slot' }
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

    if (!currentProfile || !['admin', 'cs'].includes(currentProfile.role)) {
      return { success: false, error: 'Insufficient permissions' }
    }

    // Check if user has permission for this studio
    if (currentProfile.role === 'cs' && currentProfile.studio_id !== studioId) {
      return { success: false, error: 'Insufficient permissions for this studio' }
    }

    // Generate dates between start and end date
    const dates: string[] = []
    const currentDate = new Date(startDate)
    const end = new Date(endDate)

    while (currentDate <= end) {
      // Skip weekends if requested
      if (skipWeekends) {
        const day = currentDate.getDay()
        if (day === 0 || day === 6) { // Sunday = 0, Saturday = 6
          currentDate.setDate(currentDate.getDate() + 1)
          continue
        }
      }

      dates.push(currentDate.toISOString().split('T')[0])
      currentDate.setDate(currentDate.getDate() + 1)
    }

    // Create time slots for each date and time range
    const slotsToCreate = []
    for (const date of dates) {
      for (const range of timeRanges) {
        slotsToCreate.push({
          studio_id: studioId,
          facility_id: facilityId,
          slot_date: date,
          start_time: range.startTime,
          end_time: range.endTime,
          is_available: true,
          is_blocked: false,
          notes: null
        })
      }
    }

    // Insert all time slots
    const { error } = await supabase
      .from('time_slots')
      .insert(slotsToCreate)

    if (error) {
      console.error('Error creating time slots:', error)
      return { success: false, error: error.message }
    }

    return { success: true }
  } catch (error: any) {
    console.error('Error in bulkCreateTimeSlotsAction:', error)
    return { success: false, error: error.message || 'Failed to create time slots' }
  }
}

// Admin action to toggle time slot availability
export async function toggleTimeSlotAvailabilityAction(slotId: string): Promise<ActionResult> {
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

    // Get the current time slot to determine what to toggle
    const { data: timeSlot, error: fetchError } = await supabase
      .from('time_slots')
      .select('is_available, is_blocked, studio_id')
      .eq('id', slotId)
      .single()

    if (fetchError) {
      console.error('Error fetching time slot:', fetchError)
      return { success: false, error: 'Time slot not found' }
    }

    // Check if CS user has permission for this studio
    if (currentProfile.role === 'cs' && timeSlot.studio_id !== currentProfile.studio_id) {
      return { success: false, error: 'Insufficient permissions for this studio' }
    }

    // Toggle availability: if blocked, unblock; if available, make unavailable; if unavailable, make available
    const updates = timeSlot.is_blocked
      ? { is_blocked: false, is_available: true }
      : { is_available: !timeSlot.is_available }

    // Update the time slot
    const { error } = await supabase
      .from('time_slots')
      .update({
        ...updates,
        updated_at: new Date().toISOString()
      })
      .eq('id', slotId)

    if (error) {
      console.error('Error toggling time slot availability:', error)
      return { success: false, error: error.message }
    }

    return { success: true }
  } catch (error: any) {
    console.error('Error in toggleTimeSlotAvailabilityAction:', error)
    return { success: false, error: error.message || 'Failed to toggle time slot availability' }
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