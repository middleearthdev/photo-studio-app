"use server"

import { createClient } from '@/lib/supabase/server'
import { revalidatePath } from 'next/cache'
import { PaginationParams, PaginatedResult, calculatePagination } from '@/lib/constants/pagination'

export interface Addon {
  id: string
  studio_id: string
  facility_id: string | null
  name: string
  description: string | null
  price: number
  type: 'photography' | 'service' | 'printing' | 'storage' | 'makeup' | 'styling' | 'wardrobe' | 'time' | 'equipment' | 'decoration' | 'video'
  max_quantity: number
  is_conditional: boolean
  conditional_logic: any
  is_active: boolean
  created_at: string
  updated_at: string
  // Relations
  facility?: {
    id: string
    name: string
  }
}

export interface CreateAddonData {
  studio_id: string
  facility_id?: string
  name: string
  description?: string
  price: number
  type: Addon['type']
  max_quantity?: number
  is_conditional?: boolean
  conditional_logic?: any
  is_active?: boolean
}

export interface UpdateAddonData {
  name?: string
  description?: string
  price?: number
  type?: Addon['type']
  max_quantity?: number
  is_conditional?: boolean
  conditional_logic?: any
  is_active?: boolean
  facility_id?: string | null
}

// Get all addons for a studio (legacy - without pagination)
export async function getAddons(studioId: string): Promise<Addon[]> {
  const supabase = await createClient()
  
  const { data, error } = await supabase
    .from('addons')
    .select(`
      *,
      facility:facilities(id, name)
    `)
    .eq('studio_id', studioId)
    .order('created_at', { ascending: false })
  
  if (error) {
    console.error('Error fetching addons:', error)
    throw new Error(`Failed to fetch addons: ${error.message}`)
  }
  
  return data || []
}

// Get paginated addons for a studio
export async function getPaginatedAddons(
  studioId: string,
  params: PaginationParams & {
    status?: 'active' | 'inactive' | 'all'
    type?: string
    facilityId?: string
  } = {}
): Promise<PaginatedResult<Addon>> {
  const supabase = await createClient()
  
  const { page = 1, pageSize = 10, search = '', status = 'all', type, facilityId } = params
  const { offset, pageSize: validPageSize } = calculatePagination(page, pageSize, 0)

  // Build the query
  let query = supabase
    .from('addons')
    .select(`
      *,
      facility:facilities(id, name)
    `, { count: 'exact' })
    .eq('studio_id', studioId)

  // Apply filters
  if (status !== 'all') {
    query = query.eq('is_active', status === 'active')
  }

  if (type && type !== 'all') {
    query = query.eq('type', type)
  }

  if (facilityId && facilityId !== 'all') {
    if (facilityId === 'general') {
      query = query.is('facility_id', null)
    } else {
      query = query.eq('facility_id', facilityId)
    }
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
    console.error('Error fetching paginated addons:', error)
    throw new Error(`Failed to fetch addons: ${error.message}`)
  }

  const total = count || 0
  const pagination = calculatePagination(page, validPageSize, total)

  return {
    data: data || [],
    pagination
  }
}

// Get addon by ID
export async function getAddonById(id: string): Promise<Addon | null> {
  const supabase = await createClient()
  
  const { data, error } = await supabase
    .from('addons')
    .select(`
      *,
      facility:facilities(id, name)
    `)
    .eq('id', id)
    .single()
  
  if (error) {
    if (error.code === 'PGRST116') {
      return null
    }
    console.error('Error fetching addon:', error)
    throw new Error(`Failed to fetch addon: ${error.message}`)
  }
  
  return data
}

// Create new addon
export async function createAddon(data: CreateAddonData): Promise<Addon> {
  const supabase = await createClient()
  
  const addonData = {
    studio_id: data.studio_id,
    facility_id: data.facility_id || null,
    name: data.name,
    description: data.description || null,
    price: data.price,
    type: data.type,
    max_quantity: data.max_quantity || 1,
    is_conditional: data.is_conditional || false,
    conditional_logic: data.conditional_logic || {},
    is_active: data.is_active ?? true,
  }
  
  const { data: addon, error } = await supabase
    .from('addons')
    .insert(addonData)
    .select(`
      *,
      facility:facilities(id, name)
    `)
    .single()
  
  if (error) {
    console.error('Error creating addon:', error)
    throw new Error(`Failed to create addon: ${error.message}`)
  }
  
  revalidatePath('/admin/packages/addons')
  return addon
}

// Update addon
export async function updateAddon(id: string, data: UpdateAddonData): Promise<Addon> {
  const supabase = await createClient()
  
  const updateData = {
    ...data,
    facility_id: data.facility_id === '' ? null : data.facility_id,
    updated_at: new Date().toISOString(),
  }
  
  const { data: addon, error } = await supabase
    .from('addons')
    .update(updateData)
    .eq('id', id)
    .select(`
      *,
      facility:facilities(id, name)
    `)
    .single()
  
  if (error) {
    console.error('Error updating addon:', error)
    throw new Error(`Failed to update addon: ${error.message}`)
  }
  
  revalidatePath('/admin/packages/addons')
  return addon
}

// Delete addon
export async function deleteAddon(id: string): Promise<void> {
  const supabase = await createClient()
  
  // Check if addon is being used in any reservations
  const { data: reservationAddons } = await supabase
    .from('reservation_addons')
    .select('id')
    .eq('addon_id', id)
    .limit(1)
  
  if (reservationAddons && reservationAddons.length > 0) {
    throw new Error('Cannot delete addon that is being used in reservations')
  }
  
  const { error } = await supabase
    .from('addons')
    .delete()
    .eq('id', id)
  
  if (error) {
    console.error('Error deleting addon:', error)
    throw new Error(`Failed to delete addon: ${error.message}`)
  }
  
  revalidatePath('/admin/packages/addons')
}

// Toggle addon status
export async function toggleAddonStatus(id: string): Promise<Addon> {
  const supabase = await createClient()
  
  // Get current status
  const { data: currentAddon, error: fetchError } = await supabase
    .from('addons')
    .select('is_active')
    .eq('id', id)
    .single()
  
  if (fetchError) {
    console.error('Error fetching addon:', fetchError)
    throw new Error(`Failed to fetch addon: ${fetchError.message}`)
  }
  
  // Toggle status
  const { data: addon, error } = await supabase
    .from('addons')
    .update({ 
      is_active: !currentAddon.is_active,
      updated_at: new Date().toISOString()
    })
    .eq('id', id)
    .select(`
      *,
      facility:facilities(id, name)
    `)
    .single()
  
  if (error) {
    console.error('Error toggling addon status:', error)
    throw new Error(`Failed to toggle addon status: ${error.message}`)
  }
  
  revalidatePath('/admin/packages/addons')
  return addon
}


// Get addons by type
export async function getAddonsByType(studioId: string, type: Addon['type']): Promise<Addon[]> {
  const supabase = await createClient()
  
  const { data, error } = await supabase
    .from('addons')
    .select(`
      *,
      facility:facilities(id, name)
    `)
    .eq('studio_id', studioId)
    .eq('type', type)
    .eq('is_active', true)
    .order('name')
  
  if (error) {
    console.error('Error fetching addons by type:', error)
    throw new Error(`Failed to fetch addons: ${error.message}`)
  }
  
  return data || []
}

// Get available addons for a facility
export async function getAddonsByFacility(studioId: string, facilityId?: string): Promise<Addon[]> {
  const supabase = await createClient()
  
  let query = supabase
    .from('addons')
    .select(`
      *,
      facility:facilities(id, name)
    `)
    .eq('studio_id', studioId)
    .eq('is_active', true)
  
  if (facilityId) {
    query = query.or(`facility_id.is.null,facility_id.eq.${facilityId}`)
  } else {
    query = query.is('facility_id', null)
  }
  
  const { data, error } = await query.order('name')
  
  if (error) {
    console.error('Error fetching addons by facility:', error)
    throw new Error(`Failed to fetch addons: ${error.message}`)
  }
  
  return data || []
}