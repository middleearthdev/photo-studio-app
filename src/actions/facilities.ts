"use server"

import { createClient } from '@/lib/supabase/server'
import { revalidatePath } from 'next/cache'
import { PaginationParams, PaginatedResult, calculatePagination } from '@/lib/constants/pagination'

export interface Facility {
  id: string
  studio_id: string
  name: string
  description: string | null
  capacity: number
  equipment: Record<string, any>
  hourly_rate: number | null
  is_available: boolean
  icon: string | null
  created_at: string
  updated_at: string
}

export interface CreateFacilityData {
  studio_id: string
  name: string
  description?: string
  capacity: number
  equipment?: Record<string, any>
  hourly_rate?: number
  icon?: string
}

export interface UpdateFacilityData extends Partial<CreateFacilityData> {
  is_available?: boolean
}

export interface ActionResult<T = any> {
  success: boolean
  data?: T
  error?: string
}

export async function getFacilitiesAction(studioId?: string): Promise<ActionResult<Facility[]>> {
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
      .from('facilities')
      .select('*')
      .order('created_at', { ascending: false })

    // Filter by studio if specified, otherwise use user's studio
    const targetStudioId = studioId || currentProfile.studio_id
    if (targetStudioId) {
      query = query.eq('studio_id', targetStudioId)
    }

    const { data: facilities, error } = await query

    if (error) {
      console.error('Error fetching facilities:', error)
      return { success: false, error: 'Failed to fetch facilities' }
    }

    return { success: true, data: facilities || [] }
  } catch (error: any) {
    console.error('Error in getFacilitiesAction:', error)
    return { success: false, error: error.message || 'An error occurred' }
  }
}

// Get paginated facilities for a studio
export async function getPaginatedFacilities(
  studioId: string,
  params: PaginationParams & {
    status?: 'available' | 'unavailable' | 'all'
  } = {}
): Promise<PaginatedResult<Facility>> {
  const supabase = await createClient()
  
  const { page = 1, pageSize = 10, search = '', status = 'all' } = params
  const { offset, pageSize: validPageSize } = calculatePagination(page, pageSize, 0)

  // Build the query
  let query = supabase
    .from('facilities')
    .select('*', { count: 'exact' })
    .eq('studio_id', studioId)

  // Apply filters
  if (status !== 'all') {
    query = query.eq('is_available', status === 'available')
  }

  // Apply search
  if (search.trim()) {
    query = query.or(`name.ilike.%${search}%,description.ilike.%${search}%`)
  }

  // Apply pagination and ordering
  const { data, error, count } = await query
    .order('created_at', { ascending: false })
    .range(offset, offset + validPageSize - 1)

  if (error) {
    console.error('Error fetching paginated facilities:', error)
    throw new Error(`Failed to fetch facilities: ${error.message}`)
  }

  const total = count || 0
  const pagination = calculatePagination(page, validPageSize, total)

  return {
    data: data || [],
    pagination
  }
}

export async function getFacilityAction(facilityId: string): Promise<ActionResult<Facility>> {
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

    // Get facility
    const { data: facility, error } = await supabase
      .from('facilities')
      .select('*')
      .eq('id', facilityId)
      .single()

    if (error) {
      console.error('Error fetching facility:', error)
      return { success: false, error: 'Facility not found' }
    }

    return { success: true, data: facility }
  } catch (error: any) {
    console.error('Error in getFacilityAction:', error)
    return { success: false, error: error.message || 'An error occurred' }
  }
}

export async function createFacilityAction(facilityData: CreateFacilityData): Promise<ActionResult> {
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

    // Use user's studio_id if not provided
    const targetStudioId = facilityData.studio_id || currentProfile.studio_id

    // Create facility
    const { error } = await supabase
      .from('facilities')
      .insert({
        studio_id: targetStudioId,
        name: facilityData.name,
        description: facilityData.description,
        capacity: facilityData.capacity,
        equipment: facilityData.equipment || {},
        hourly_rate: facilityData.hourly_rate,
        icon: facilityData.icon,
      })

    if (error) {
      console.error('Error creating facility:', error)
      return { success: false, error: error.message }
    }

    revalidatePath('/admin/studio/facilities')
    return { success: true }
  } catch (error: any) {
    console.error('Error in createFacilityAction:', error)
    return { success: false, error: error.message || 'Failed to create facility' }
  }
}

export async function updateFacilityAction(facilityId: string, facilityData: UpdateFacilityData): Promise<ActionResult> {
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

    // Update facility
    const { error } = await supabase
      .from('facilities')
      .update({
        ...facilityData,
        updated_at: new Date().toISOString(),
      })
      .eq('id', facilityId)

    if (error) {
      console.error('Error updating facility:', error)
      return { success: false, error: error.message }
    }

    revalidatePath('/admin/studio/facilities')
    return { success: true }
  } catch (error: any) {
    console.error('Error in updateFacilityAction:', error)
    return { success: false, error: error.message || 'Failed to update facility' }
  }
}

export async function deleteFacilityAction(facilityId: string): Promise<ActionResult> {
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
      .select('role')
      .eq('id', user.id)
      .single()

    if (!currentProfile || currentProfile.role !== 'admin') {
      return { success: false, error: 'Insufficient permissions' }
    }

    // Check for related data that would prevent deletion
    const { data: timeslots, error: timeslotsError } = await supabase
      .from('time_slots')
      .select('id')
      .eq('facility_id', facilityId)
      .limit(1)

    if (timeslotsError) {
      console.error('Error checking time slots:', timeslotsError)
      return { success: false, error: 'Error checking related data' }
    }

    if (timeslots && timeslots.length > 0) {
      return { success: false, error: 'Cannot delete facility with existing time slots. Please remove all time slots first.' }
    }

    // Delete facility
    const { error } = await supabase
      .from('facilities')
      .delete()
      .eq('id', facilityId)

    if (error) {
      console.error('Error deleting facility:', error)
      return { success: false, error: error.message }
    }

    revalidatePath('/admin/studio/facilities')
    return { success: true }
  } catch (error: any) {
    console.error('Error in deleteFacilityAction:', error)
    return { success: false, error: error.message || 'Failed to delete facility' }
  }
}

export async function toggleFacilityAvailabilityAction(facilityId: string): Promise<ActionResult> {
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
      .select('role')
      .eq('id', user.id)
      .single()

    if (!currentProfile || currentProfile.role !== 'admin') {
      return { success: false, error: 'Insufficient permissions' }
    }

    // Get current facility status
    const { data: facility, error: fetchError } = await supabase
      .from('facilities')
      .select('is_available')
      .eq('id', facilityId)
      .single()

    if (fetchError) {
      console.error('Error fetching facility:', fetchError)
      return { success: false, error: 'Facility not found' }
    }

    // Toggle availability
    const newStatus = !facility.is_available
    const { error } = await supabase
      .from('facilities')
      .update({
        is_available: newStatus,
        updated_at: new Date().toISOString()
      })
      .eq('id', facilityId)

    if (error) {
      console.error('Error updating facility availability:', error)
      return { success: false, error: error.message }
    }

    revalidatePath('/admin/studio/facilities')
    return { success: true }
  } catch (error: any) {
    console.error('Error in toggleFacilityAvailabilityAction:', error)
    return { success: false, error: error.message || 'Failed to update facility availability' }
  }
}