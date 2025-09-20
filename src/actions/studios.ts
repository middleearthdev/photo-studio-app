"use server"

import { createClient } from '@/lib/supabase/server'
import { revalidatePath } from 'next/cache'

export interface Studio {
  id: string
  name: string
  description: string | null
  address: string
  phone: string | null
  email: string | null
  operating_hours: Record<string, { open: string; close: string }> | null
  is_active: boolean
  settings: Record<string, any>
  created_at: string
  updated_at: string
}

export interface CreateStudioData {
  name: string
  description?: string
  address: string
  phone?: string
  email?: string
  operating_hours?: Record<string, { open: string; close: string }>
  settings?: Record<string, any>
}

export interface UpdateStudioData extends Partial<CreateStudioData> {
  is_active?: boolean
}

export interface ActionResult<T = any> {
  success: boolean
  data?: T
  error?: string
}

export async function getStudiosAction(): Promise<ActionResult<Studio[]>> {
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

    // Get studios
    const { data: studios, error } = await supabase
      .from('studios')
      .select('*')
      .order('created_at', { ascending: false })

    if (error) {
      console.error('Error fetching studios:', error)
      return { success: false, error: 'Failed to fetch studios' }
    }

    return { success: true, data: studios || [] }
  } catch (error: any) {
    console.error('Error in getStudiosAction:', error)
    return { success: false, error: error.message || 'An error occurred' }
  }
}


export async function getStudioAction(studioId: string): Promise<ActionResult<Studio>> {
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

    // Get studio
    const { data: studio, error } = await supabase
      .from('studios')
      .select('*')
      .eq('id', studioId)
      .single()

    if (error) {
      console.error('Error fetching studio:', error)
      return { success: false, error: 'Studio not found' }
    }

    return { success: true, data: studio }
  } catch (error: any) {
    console.error('Error in getStudioAction:', error)
    return { success: false, error: error.message || 'Failed to fetch studio' }
  }
}

// Public action to get active studios for customers
export async function getPublicStudiosAction(): Promise<ActionResult<Studio[]>> {
  try {
    const supabase = await createClient()

    // Build query for active studios only
    const { data: studios, error } = await supabase
      .from('studios')
      .select('*')
      .eq('is_active', true)
      .order('name', { ascending: true })

    if (error) {
      console.error('Error fetching public studios:', error)
      return { success: false, error: 'Failed to fetch studios' }
    }

    return { success: true, data: studios || [] }
  } catch (error: any) {
    console.error('Error in getPublicStudiosAction:', error)
    return { success: false, error: error.message || 'An error occurred' }
  }
}

export async function createStudioAction(studioData: CreateStudioData): Promise<ActionResult> {
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

    // Create studio
    const { error } = await supabase
      .from('studios')
      .insert({
        name: studioData.name,
        description: studioData.description,
        address: studioData.address,
        phone: studioData.phone,
        email: studioData.email,
        operating_hours: studioData.operating_hours,
        settings: studioData.settings || {},
      })

    if (error) {
      console.error('Error creating studio:', error)
      return { success: false, error: error.message }
    }

    revalidatePath('/admin/studio')
    return { success: true }
  } catch (error: any) {
    console.error('Error in createStudioAction:', error)
    return { success: false, error: error.message || 'Failed to create studio' }
  }
}

export async function updateStudioAction(studioId: string, studioData: UpdateStudioData): Promise<ActionResult> {
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

    // Update studio
    const { error } = await supabase
      .from('studios')
      .update({
        ...studioData,
        updated_at: new Date().toISOString(),
      })
      .eq('id', studioId)

    if (error) {
      console.error('Error updating studio:', error)
      return { success: false, error: error.message }
    }

    revalidatePath('/admin/studio')
    return { success: true }
  } catch (error: any) {
    console.error('Error in updateStudioAction:', error)
    return { success: false, error: error.message || 'Failed to update studio' }
  }
}

export async function deleteStudioAction(studioId: string): Promise<ActionResult> {
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

    // Get current studio status
    const { data: studio, error: fetchError } = await supabase
      .from('studios')
      .select('is_active')
      .eq('id', studioId)
      .single()

    if (fetchError) {
      console.error('Error fetching studio:', fetchError)
      return { success: false, error: 'Studio not found' }
    }

    // Toggle studio status
    const newStatus = !studio.is_active
    const { error } = await supabase
      .from('studios')
      .update({
        is_active: newStatus,
        updated_at: new Date().toISOString()
      })
      .eq('id', studioId)

    if (error) {
      console.error('Error updating studio status:', error)
      return { success: false, error: error.message }
    }

    revalidatePath('/admin/studio')
    return { success: true }
  } catch (error: any) {
    console.error('Error in deleteStudioAction:', error)
    return { success: false, error: error.message || 'Failed to update studio status' }
  }
}

export async function hardDeleteStudioAction(studioId: string): Promise<ActionResult> {
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

    // Check if studio is inactive (required for hard delete)
    const { data: studio, error: fetchError } = await supabase
      .from('studios')
      .select('is_active')
      .eq('id', studioId)
      .single()

    if (fetchError) {
      console.error('Error fetching studio:', fetchError)
      return { success: false, error: 'Studio not found' }
    }

    if (studio.is_active) {
      return { success: false, error: 'Cannot permanently delete active studio. Please deactivate first.' }
    }

    // Check for related data that would prevent deletion
    const { data: facilities, error: facilitiesError } = await supabase
      .from('facilities')
      .select('id')
      .eq('studio_id', studioId)
      .limit(1)

    if (facilitiesError) {
      console.error('Error checking facilities:', facilitiesError)
      return { success: false, error: 'Error checking related data' }
    }

    const { data: reservations, error: reservationsError } = await supabase
      .from('reservations')
      .select('id')
      .eq('studio_id', studioId)
      .limit(1)

    if (reservationsError) {
      console.error('Error checking reservations:', reservationsError)
      return { success: false, error: 'Error checking related data' }
    }

    if (facilities && facilities.length > 0) {
      return { success: false, error: 'Cannot delete studio with existing facilities. Please remove all facilities first.' }
    }

    if (reservations && reservations.length > 0) {
      return { success: false, error: 'Cannot delete studio with existing reservations.' }
    }

    // Hard delete - permanently remove from database
    const { error: deleteError } = await supabase
      .from('studios')
      .delete()
      .eq('id', studioId)

    if (deleteError) {
      console.error('Error hard deleting studio:', deleteError)
      return { success: false, error: deleteError.message }
    }

    revalidatePath('/admin/studio')
    return { success: true }
  } catch (error: any) {
    console.error('Error in hardDeleteStudioAction:', error)
    return { success: false, error: error.message || 'Failed to permanently delete studio' }
  }
}