"use server"

import { createClient } from '@/lib/supabase/server'
import { revalidatePath } from 'next/cache'
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
  notes?: string | null
  created_at: string
  updated_at: string
  // Relations
  facility?: {
    id: string
    name: string
    capacity: number
  }
  studio?: {
    id: string
    name: string
  }
}

export interface CreateTimeSlotData {
  studio_id: string
  facility_id: string
  slot_date: string
  start_time: string
  end_time: string
  is_available?: boolean
  is_blocked?: boolean
  notes?: string
}

export interface UpdateTimeSlotData extends Partial<CreateTimeSlotData> {
  is_available?: boolean
  is_blocked?: boolean
}

export interface ActionResult<T = any> {
  success: boolean
  data?: T
  error?: string
}

// Get time slots with optional filters
export async function getTimeSlotsAction(
  studioId?: string,
  facilityId?: string,
  startDate?: string,
  endDate?: string
): Promise<ActionResult<TimeSlot[]>> {
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

    if (!currentProfile || currentProfile.role !== 'admin') {
      return { success: false, error: 'Insufficient permissions' }
    }

    // Build query
    let query = supabase
      .from('time_slots')
      .select(`
        *,
        facility:facilities(id, name, capacity),
        studio:studios(id, name)
      `)
      .order('slot_date', { ascending: true })
      .order('start_time', { ascending: true })

    // Apply filters
    if (studioId) {
      query = query.eq('studio_id', studioId)
    }

    if (facilityId) {
      query = query.eq('facility_id', facilityId)
    }

    if (startDate) {
      query = query.gte('slot_date', startDate)
    }

    if (endDate) {
      query = query.lte('slot_date', endDate)
    }

    const { data, error } = await query

    if (error) {
      console.error('Error fetching time slots:', error)
      return { success: false, error: error.message }
    }

    return { success: true, data: data || [] }
  } catch (error: any) {
    console.error('Error in getTimeSlotsAction:', error)
    return { success: false, error: error.message || 'An error occurred' }
  }
}

// Get paginated time slots
export async function getPaginatedTimeSlots(
  studioId: string,
  params: PaginationParams & {
    facilityId?: string
    status?: 'available' | 'blocked' | 'unavailable' | 'all'
    startDate?: string
    endDate?: string
  } = {}
): Promise<PaginatedResult<TimeSlot>> {
  const supabase = await createClient()
  
  const { page = 1, pageSize = 10, search = '', status = 'all', facilityId, startDate, endDate } = params
  const { offset, pageSize: validPageSize } = calculatePagination(page, pageSize, 0)

  // Build the query
  let query = supabase
    .from('time_slots')
    .select(`
      *,
      facility:facilities(id, name, capacity),
      studio:studios(id, name)
    `, { count: 'exact' })
    .eq('studio_id', studioId)

  // Apply facility filter
  if (facilityId && facilityId !== 'all') {
    query = query.eq('facility_id', facilityId)
  }

  // Apply status filter
  if (status !== 'all') {
    switch (status) {
      case 'available':
        query = query.eq('is_available', true).eq('is_blocked', false)
        break
      case 'blocked':
        query = query.eq('is_blocked', true)
        break
      case 'unavailable':
        query = query.eq('is_available', false)
        break
    }
  }

  // Apply date range filters
  if (startDate) {
    query = query.gte('slot_date', startDate)
  }
  
  if (endDate) {
    query = query.lte('slot_date', endDate)
  }

  // Apply search (search in notes or facility name)
  if (search.trim()) {
    query = query.or(`notes.ilike.%${search}%,facility.name.ilike.%${search}%`)
  }

  // Apply pagination and ordering
  const { data, error, count } = await query
    .order('slot_date', { ascending: false })
    .order('start_time', { ascending: true })
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
}

// Get single time slot
export async function getTimeSlotAction(timeSlotId: string): Promise<ActionResult<TimeSlot>> {
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

    if (!currentProfile || currentProfile.role !== 'admin') {
      return { success: false, error: 'Insufficient permissions' }
    }

    // Get time slot
    const { data: timeSlot, error } = await supabase
      .from('time_slots')
      .select(`
        *,
        facility:facilities(id, name, capacity),
        studio:studios(id, name)
      `)
      .eq('id', timeSlotId)
      .single()

    if (error) {
      console.error('Error fetching time slot:', error)
      return { success: false, error: 'Time slot not found' }
    }

    return { success: true, data: timeSlot }
  } catch (error: any) {
    console.error('Error in getTimeSlotAction:', error)
    return { success: false, error: error.message || 'An error occurred' }
  }
}

// Create time slot
export async function createTimeSlotAction(timeSlotData: CreateTimeSlotData): Promise<ActionResult> {
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

    if (!currentProfile || currentProfile.role !== 'admin') {
      return { success: false, error: 'Insufficient permissions' }
    }

    // Validate that facility belongs to the studio
    const { data: facility, error: facilityError } = await supabase
      .from('facilities')
      .select('studio_id')
      .eq('id', timeSlotData.facility_id)
      .single()

    if (facilityError || !facility) {
      return { success: false, error: 'Facility not found' }
    }

    if (facility.studio_id !== timeSlotData.studio_id) {
      return { success: false, error: 'Facility does not belong to the specified studio' }
    }

    // Check for time conflicts
    const { data: conflicts, error: conflictError } = await supabase
      .from('time_slots')
      .select('id')
      .eq('facility_id', timeSlotData.facility_id)
      .eq('slot_date', timeSlotData.slot_date)
      .or(`start_time.lt.${timeSlotData.end_time},end_time.gt.${timeSlotData.start_time}`)

    if (conflictError) {
      console.error('Error checking time conflicts:', conflictError)
      return { success: false, error: 'Error checking time conflicts' }
    }

    if (conflicts && conflicts.length > 0) {
      return { success: false, error: 'Time slot conflicts with existing slots' }
    }

    // Create time slot
    const { error } = await supabase
      .from('time_slots')
      .insert({
        studio_id: timeSlotData.studio_id,
        facility_id: timeSlotData.facility_id,
        slot_date: timeSlotData.slot_date,
        start_time: timeSlotData.start_time,
        end_time: timeSlotData.end_time,
        is_available: timeSlotData.is_available ?? true,
        is_blocked: timeSlotData.is_blocked ?? false,
        notes: timeSlotData.notes,
      })

    if (error) {
      console.error('Error creating time slot:', error)
      return { success: false, error: error.message }
    }

    revalidatePath('/admin/time-slots')
    return { success: true }
  } catch (error: any) {
    console.error('Error in createTimeSlotAction:', error)
    return { success: false, error: error.message || 'Failed to create time slot' }
  }
}

// Update time slot
export async function updateTimeSlotAction(timeSlotId: string, timeSlotData: UpdateTimeSlotData): Promise<ActionResult> {
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

    if (!currentProfile || currentProfile.role !== 'admin') {
      return { success: false, error: 'Insufficient permissions' }
    }

    // Get existing time slot
    const { data: existingSlot, error: existingError } = await supabase
      .from('time_slots')
      .select('*')
      .eq('id', timeSlotId)
      .single()

    if (existingError || !existingSlot) {
      return { success: false, error: 'Time slot not found' }
    }

    // If time/date is being changed, check for conflicts
    if (timeSlotData.slot_date || timeSlotData.start_time || timeSlotData.end_time) {
      const newDate = timeSlotData.slot_date || existingSlot.slot_date
      const newStartTime = timeSlotData.start_time || existingSlot.start_time
      const newEndTime = timeSlotData.end_time || existingSlot.end_time

      const { data: conflicts, error: conflictError } = await supabase
        .from('time_slots')
        .select('id')
        .eq('facility_id', existingSlot.facility_id)
        .eq('slot_date', newDate)
        .or(`start_time.lt.${newEndTime},end_time.gt.${newStartTime}`)
        .neq('id', timeSlotId)

      if (conflictError) {
        console.error('Error checking time conflicts:', conflictError)
        return { success: false, error: 'Error checking time conflicts' }
      }

      if (conflicts && conflicts.length > 0) {
        return { success: false, error: 'Time slot conflicts with existing slots' }
      }
    }

    // Update time slot
    const { error } = await supabase
      .from('time_slots')
      .update(timeSlotData)
      .eq('id', timeSlotId)

    if (error) {
      console.error('Error updating time slot:', error)
      return { success: false, error: error.message }
    }

    revalidatePath('/admin/time-slots')
    return { success: true }
  } catch (error: any) {
    console.error('Error in updateTimeSlotAction:', error)
    return { success: false, error: error.message || 'Failed to update time slot' }
  }
}

// Delete time slot
export async function deleteTimeSlotAction(timeSlotId: string): Promise<ActionResult> {
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

    if (!currentProfile || currentProfile.role !== 'admin') {
      return { success: false, error: 'Insufficient permissions' }
    }

    // Check if time slot is being used in any reservations
    const { data: reservations, error: reservationError } = await supabase
      .from('reservations')
      .select('id')
      .eq('status', 'confirmed')
      .eq('reservation_date', 'slot_date') // This would need more complex logic

    // For now, just delete the time slot (in real app, you'd want more complex validation)
    const { error } = await supabase
      .from('time_slots')
      .delete()
      .eq('id', timeSlotId)

    if (error) {
      console.error('Error deleting time slot:', error)
      return { success: false, error: error.message }
    }

    revalidatePath('/admin/time-slots')
    return { success: true }
  } catch (error: any) {
    console.error('Error in deleteTimeSlotAction:', error)
    return { success: false, error: error.message || 'Failed to delete time slot' }
  }
}

// Toggle time slot availability
export async function toggleTimeSlotAvailabilityAction(timeSlotId: string): Promise<ActionResult> {
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

    if (!currentProfile || currentProfile.role !== 'admin') {
      return { success: false, error: 'Insufficient permissions' }
    }

    // Get current time slot
    const { data: timeSlot, error: timeSlotError } = await supabase
      .from('time_slots')
      .select('is_available')
      .eq('id', timeSlotId)
      .single()

    if (timeSlotError || !timeSlot) {
      return { success: false, error: 'Time slot not found' }
    }

    // Toggle availability
    const { error } = await supabase
      .from('time_slots')
      .update({ is_available: !timeSlot.is_available })
      .eq('id', timeSlotId)

    if (error) {
      console.error('Error toggling time slot availability:', error)
      return { success: false, error: error.message }
    }

    revalidatePath('/admin/time-slots')
    return { success: true }
  } catch (error: any) {
    console.error('Error in toggleTimeSlotAvailabilityAction:', error)
    return { success: false, error: error.message || 'Failed to toggle time slot availability' }
  }
}

// Bulk create time slots
export async function bulkCreateTimeSlotsAction(data: {
  studio_id: string
  facility_id: string
  start_date: string
  end_date: string
  time_ranges: { start_time: string; end_time: string }[]
  skip_weekends?: boolean
}): Promise<ActionResult> {
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

    if (!currentProfile || currentProfile.role !== 'admin') {
      return { success: false, error: 'Insufficient permissions' }
    }

    // Generate date range
    const startDate = new Date(data.start_date)
    const endDate = new Date(data.end_date)
    const timeSlots: CreateTimeSlotData[] = []

    for (let date = new Date(startDate); date <= endDate; date.setDate(date.getDate() + 1)) {
      // Skip weekends if requested
      if (data.skip_weekends && (date.getDay() === 0 || date.getDay() === 6)) {
        continue
      }

      const dateString = date.toISOString().split('T')[0]

      for (const timeRange of data.time_ranges) {
        timeSlots.push({
          studio_id: data.studio_id,
          facility_id: data.facility_id,
          slot_date: dateString,
          start_time: timeRange.start_time,
          end_time: timeRange.end_time,
          is_available: true,
          is_blocked: false,
        })
      }
    }

    // Insert all time slots
    const { error } = await supabase
      .from('time_slots')
      .insert(timeSlots)

    if (error) {
      console.error('Error bulk creating time slots:', error)
      return { success: false, error: error.message }
    }

    revalidatePath('/admin/time-slots')
    return { success: true, data: { created_count: timeSlots.length } }
  } catch (error: any) {
    console.error('Error in bulkCreateTimeSlotsAction:', error)
    return { success: false, error: error.message || 'Failed to bulk create time slots' }
  }
}