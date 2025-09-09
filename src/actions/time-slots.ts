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
      .gte('end_time', startTime.toTimeString().substring(0, 5))
      .lte('start_time', endTime.toTimeString().substring(0, 5))

    if (reservationError) {
      console.error('Error fetching conflicting reservations:', reservationError)
      return false
    }

    // Check if any required facilities are already booked
    const requiredFacilityIds = packageFacilities.map(pf => pf.facility_id)
    
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