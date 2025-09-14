"use server"

import { createClient } from '@/lib/supabase/server'
import { revalidatePath } from 'next/cache'
import { calculatePagination, type PaginatedResult, type PaginationParams } from '@/lib/constants/pagination'

export interface Addon {
  id: string
  studio_id: string
  facility_id: string | null
  name: string
  description: string | null
  price: number
  type: string | null
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
    icon?: string
  }
  // Package addon relationship data
  package_addon?: {
    is_included: boolean
    discount_percentage: number
    is_recommended: boolean
    display_order: number
    final_price?: number // Calculated price after discount
  }
}

export interface ActionResult<T = any> {
  success: boolean
  data?: T
  error?: string
}

// Check if facility-based addon is available for specific time slot
export async function checkAddonFacilityAvailabilityAction(
  addonId: string, 
  studioId: string, 
  date: string, 
  startTime: string, 
  endTime: string
): Promise<ActionResult<boolean>> {
  try {
    const supabase = await createClient()

    // Get addon details to check if it's facility-based
    const { data: addon, error: addonError } = await supabase
      .from('addons')
      .select('facility_id')
      .eq('id', addonId)
      .single()

    if (addonError || !addon) {
      return { success: false, error: 'Addon not found' }
    }

    // If not facility-based, it's always available
    if (!addon.facility_id) {
      return { success: true, data: true }
    }

    // Check if facility is available at the requested time
    const { data: conflictingReservations } = await supabase
      .from('reservations')
      .select(`
        reservation_addons!inner(
          addon_id,
          addon:addons!inner(facility_id)
        )
      `)
      .eq('studio_id', studioId)
      .eq('reservation_date', date)
      .eq('reservation_addons.addon.facility_id', addon.facility_id)
      .in('status', ['confirmed', 'in_progress'])

    // Check for time conflicts
    const hasConflict = conflictingReservations?.some(reservation => {
      // Add your time conflict logic here
      return true // Simplified for now
    })

    return { success: true, data: !hasConflict }
  } catch (error: any) {
    console.error('Error checking addon availability:', error)
    return { success: false, error: error.message || 'Failed to check availability' }
  }
}

// Public action to get active addons for customers
export async function getPublicAddonsAction(studioId?: string): Promise<ActionResult<Addon[]>> {
  try {
    const supabase = await createClient()

    // Build query for active addons only
    let query = supabase
      .from('addons')
      .select(`
        *,
        facility:facilities(id, name, icon)
      `)
      .eq('is_active', true)
      .order('type', { ascending: true })
      .order('name', { ascending: true })

    // If studioId is provided, filter by studio
    if (studioId) {
      query = query.eq('studio_id', studioId)
    }

    const { data: addons, error } = await query

    if (error) {
      console.error('Error fetching public addons:', error)
      return { success: false, error: 'Failed to fetch addons' }
    }

    return { success: true, data: addons || [] }
  } catch (error: any) {
    console.error('Error in getPublicAddonsAction:', error)
    return { success: false, error: error.message || 'An error occurred' }
  }
}

// Public action to get package-specific addons
export async function getPackageAddonsAction(packageId: string): Promise<ActionResult<Addon[]>> {
  try {
    const supabase = await createClient()

    // Get package addons with all related data
    const { data: packageAddons, error } = await supabase
      .from('package_addons')
      .select(`
        *,
        addon:addons!inner(
          *,
          facility:facilities(id, name, icon)
        )
      `)
      .eq('package_id', packageId)
      .eq('addon.is_active', true)
      .order('display_order', { ascending: true })

    if (error) {
      console.error('Error fetching package addons:', error)
      return { success: false, error: 'Failed to fetch package addons' }
    }

    // Transform data to include package addon info
    const addons: Addon[] = (packageAddons || []).map(pa => {
      const addon = pa.addon
      const finalPrice = addon.price * (1 - pa.discount_percentage / 100)
      
      return {
        ...addon,
        package_addon: {
          is_included: pa.is_included,
          discount_percentage: pa.discount_percentage,
          is_recommended: pa.is_recommended,
          display_order: pa.display_order,
          final_price: finalPrice
        }
      }
    })

    return { success: true, data: addons }
  } catch (error: any) {
    console.error('Error in getPackageAddonsAction:', error)
    return { success: false, error: error.message || 'An error occurred' }
  }
}

// Public action to get package addons grouped by category
export async function getPackageAddonsGroupedAction(packageId: string): Promise<ActionResult<{[key: string]: Addon[]}>> {
  try {
    const result = await getPackageAddonsAction(packageId)
    
    if (!result.success || !result.data) {
      return result
    }

    // Group addons by type with same logic as before
    const grouped: {[key: string]: Addon[]} = {}
    
    result.data.forEach(addon => {
      let category = 'other'
      
      // Priority 1: Check addon type field first
      if (addon.type) {
        const type = addon.type.toLowerCase()
        if (type.includes('styling') || type.includes('makeup') || type.includes('hair')) {
          category = 'styling'
        } else if (type.includes('prop') || type.includes('backdrop')) {
          category = 'props'
        } else if (type.includes('light') || type.includes('pencahayaan')) {
          category = 'lighting'
        } else if (type.includes('photo') || type.includes('foto')) {
          category = 'photo'
        } else {
          category = type
        }
      }
      // Priority 2: Check addon name
      else if (addon.name) {
        const addonName = addon.name.toLowerCase()
        if (addonName.includes('makeup') || addonName.includes('hair') || addonName.includes('kostum') || addonName.includes('styling')) {
          category = 'styling'
        } else if (addonName.includes('prop') || addonName.includes('backdrop') || addonName.includes('dekor')) {
          category = 'props'
        } else if (addonName.includes('light') || addonName.includes('pencahayaan')) {
          category = 'lighting'
        } else if (addonName.includes('foto') || addonName.includes('photo') || addonName.includes('kamera')) {
          category = 'photo'
        }
      }
      // Priority 3: Check facility name
      else if (addon.facility?.name) {
        const facilityName = addon.facility.name.toLowerCase()
        if (facilityName.includes('makeup') || facilityName.includes('hair')) {
          category = 'styling'
        } else if (facilityName.includes('prop') || facilityName.includes('backdrop')) {
          category = 'props'
        } else if (facilityName.includes('light')) {
          category = 'lighting'
        } else if (facilityName.includes('photo') || facilityName.includes('camera')) {
          category = 'photo'
        }
      }

      if (!grouped[category]) {
        grouped[category] = []
      }
      grouped[category].push(addon)
    })

    return { success: true, data: grouped }
  } catch (error: any) {
    console.error('Error in getPackageAddonsGroupedAction:', error)
    return { success: false, error: error.message || 'An error occurred' }
  }
}

// Public action to get addons grouped by type/category (DEPRECATED - use package-specific instead)
export async function getPublicAddonsGroupedAction(studioId?: string): Promise<ActionResult<{[key: string]: Addon[]}>> {
  try {
    const result = await getPublicAddonsAction(studioId)
    
    if (!result.success || !result.data) {
      return result
    }

    // Group addons by type (using facility name or type field)
    const grouped: {[key: string]: Addon[]} = {}
    
    result.data.forEach(addon => {
      // Determine category with priority: type field > addon name > facility name
      let category = 'other'
      
      // Priority 1: Check addon type field first
      if (addon.type) {
        const type = addon.type.toLowerCase()
        // Map common type values to our categories
        if (type.includes('styling') || type.includes('makeup') || type.includes('hair')) {
          category = 'styling'
        } else if (type.includes('prop') || type.includes('backdrop')) {
          category = 'props'
        } else if (type.includes('light') || type.includes('pencahayaan')) {
          category = 'lighting'
        } else if (type.includes('photo') || type.includes('foto')) {
          category = 'photo'
        } else {
          category = type // Use type as-is if not matching predefined categories
        }
      }
      // Priority 2: Check addon name
      else if (addon.name) {
        const addonName = addon.name.toLowerCase()
        if (addonName.includes('makeup') || addonName.includes('hair') || addonName.includes('kostum') || addonName.includes('styling')) {
          category = 'styling'
        } else if (addonName.includes('prop') || addonName.includes('backdrop') || addonName.includes('dekor')) {
          category = 'props'
        } else if (addonName.includes('light') || addonName.includes('pencahayaan')) {
          category = 'lighting'
        } else if (addonName.includes('foto') || addonName.includes('photo') || addonName.includes('kamera')) {
          category = 'photo'
        }
      }
      // Priority 3: Check facility name (only if no type or name-based categorization)
      else if (addon.facility?.name && category === 'other') {
        const facilityName = addon.facility.name.toLowerCase()
        if (facilityName.includes('makeup') || facilityName.includes('hair')) {
          category = 'styling'
        } else if (facilityName.includes('prop') || facilityName.includes('backdrop')) {
          category = 'props'
        } else if (facilityName.includes('light')) {
          category = 'lighting'
        } else if (facilityName.includes('photo') || facilityName.includes('camera')) {
          category = 'photo'
        }
      }

      if (!grouped[category]) {
        grouped[category] = []
      }
      grouped[category].push(addon)
    })

    return { success: true, data: grouped }
  } catch (error: any) {
    console.error('Error in getPublicAddonsGroupedAction:', error)
    return { success: false, error: error.message || 'An error occurred' }
  }
}

// Admin action to assign addon to package
export async function assignAddonToPackageAction(
  packageId: string,
  addonId: string,
  options: {
    is_included?: boolean
    discount_percentage?: number
    is_recommended?: boolean
    display_order?: number
  } = {}
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

    // For CS users, verify they own both the package and addon
    if (currentProfile.role === 'cs') {
      const { data: packageData } = await supabase
        .from('packages')
        .select('studio_id')
        .eq('id', packageId)
        .single()

      const { data: addonData } = await supabase
        .from('addons')
        .select('studio_id')
        .eq('id', addonId)
        .single()

      if (!packageData || !addonData || 
          packageData.studio_id !== currentProfile.studio_id ||
          addonData.studio_id !== currentProfile.studio_id) {
        return { success: false, error: 'Insufficient permissions for this studio' }
      }
    }

    // Insert or update package-addon relationship
    const { error } = await supabase
      .from('package_addons')
      .upsert({
        package_id: packageId,
        addon_id: addonId,
        is_included: options.is_included || false,
        discount_percentage: options.discount_percentage || 0,
        is_recommended: options.is_recommended || false,
        display_order: options.display_order || 0,
      })

    if (error) {
      console.error('Error assigning addon to package:', error)
      return { success: false, error: error.message }
    }

    revalidatePath('/admin/packages')
    return { success: true }
  } catch (error: any) {
    console.error('Error in assignAddonToPackageAction:', error)
    return { success: false, error: error.message || 'Failed to assign addon to package' }
  }
}

// Admin action to remove addon from package
export async function removeAddonFromPackageAction(packageId: string, addonId: string): Promise<ActionResult> {
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
    const query = supabase
      .from('package_addons')
      .delete()
      .eq('package_id', packageId)
      .eq('addon_id', addonId)

    // For CS users, add additional verification
    if (currentProfile.role === 'cs') {
      // This is a more complex check - we need to verify via joins
      const { data: packageAddon } = await supabase
        .from('package_addons')
        .select(`
          *,
          package:packages!inner(studio_id)
        `)
        .eq('package_id', packageId)
        .eq('addon_id', addonId)
        .eq('package.studio_id', currentProfile.studio_id)
        .single()

      if (!packageAddon) {
        return { success: false, error: 'Insufficient permissions for this studio' }
      }
    }

    const { error } = await query

    if (error) {
      console.error('Error removing addon from package:', error)
      return { success: false, error: error.message }
    }

    revalidatePath('/admin/packages')
    return { success: true }
  } catch (error: any) {
    console.error('Error in removeAddonFromPackageAction:', error)
    return { success: false, error: error.message || 'Failed to remove addon from package' }
  }
}

// Admin action to get all addons
export async function getAddonsAction(studioId?: string): Promise<ActionResult<Addon[]>> {
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
      .from('addons')
      .select(`
        *,
        facility:facilities(id, name, icon)
      `)
      .order('type', { ascending: true })
      .order('name', { ascending: true })

    // Filter by studio - admin can see all, cs only their studio
    if (currentProfile.role === 'cs') {
      query = query.eq('studio_id', currentProfile.studio_id)
    } else if (studioId) {
      query = query.eq('studio_id', studioId)
    }

    const { data: addons, error } = await query

    if (error) {
      console.error('Error fetching addons:', error)
      return { success: false, error: 'Failed to fetch addons' }
    }

    return { success: true, data: addons || [] }
  } catch (error: any) {
    console.error('Error in getAddonsAction:', error)
    return { success: false, error: error.message || 'An error occurred' }
  }
}

// Admin action to get paginated addons
export async function getPaginatedAddonsAction(
  params: {
    studioId?: string
    page?: number
    pageSize?: number
    search?: string
    status?: 'all' | 'active' | 'inactive'
    type?: string
    facilityId?: string
  } = {}
): Promise<ActionResult<PaginatedResult<Addon>>> {
  try {
    const supabase = await createClient()
    
    const {
      studioId,
      page = 1,
      pageSize = 10,
      search = '',
      status = 'all',
      type,
      facilityId
    } = params
    
    const { offset, pageSize: validPageSize } = calculatePagination(page, pageSize, 0)

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

    // Build query with count for pagination
    let query = supabase
      .from('addons')
      .select(`
        *,
        facility:facilities(id, name, icon)
      `, { count: 'exact' })
      .order('type', { ascending: true })
      .order('name', { ascending: true })

    // Filter by studio - admin can see all, cs only their studio
    if (currentProfile.role === 'cs') {
      query = query.eq('studio_id', currentProfile.studio_id)
    } else if (studioId) {
      query = query.eq('studio_id', studioId)
    }

    // Apply status filter
    if (status === 'active') {
      query = query.eq('is_active', true)
    } else if (status === 'inactive') {
      query = query.eq('is_active', false)
    }

    // Apply type filter
    if (type && type !== 'all') {
      query = query.eq('type', type)
    }

    // Apply facility filter
    if (facilityId) {
      if (facilityId === 'general') {
        query = query.is('facility_id', null)
      } else {
        query = query.eq('facility_id', facilityId)
      }
    }

    // Apply search filter
    if (search && search.trim()) {
      query = query.or(`name.ilike.%${search}%,description.ilike.%${search}%`)
    }

    // Apply pagination
    const { data, error, count } = await query
      .range(offset, offset + validPageSize - 1)

    if (error) {
      console.error('Error fetching paginated addons:', error)
      throw new Error(`Failed to fetch addons: ${error.message}`)
    }

    const total = count || 0
    const pagination = calculatePagination(page, validPageSize, total)

    return {
      success: true,
      data: {
        data: data || [],
        pagination
      }
    }
  } catch (error: any) {
    console.error('Error in getPaginatedAddonsAction:', error)
    throw error
  }
}

// Admin action to create addon
export async function createAddonAction(
  addonData: {
    studio_id: string
    facility_id?: string
    name: string
    description?: string
    price: number
    type?: string
    max_quantity: number
    is_conditional: boolean
    conditional_logic?: any
    is_active: boolean
  }
): Promise<ActionResult<Addon>> {
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

    // For CS users, verify they own the studio
    if (currentProfile.role === 'cs' && addonData.studio_id !== currentProfile.studio_id) {
      return { success: false, error: 'Insufficient permissions for this studio' }
    }

    // Create addon
    const { data: newAddon, error } = await supabase
      .from('addons')
      .insert(addonData)
      .select(`
        *,
        facility:facilities(id, name, icon)
      `)
      .single()

    if (error) {
      console.error('Error creating addon:', error)
      return { success: false, error: error.message }
    }

    revalidatePath('/admin/packages/addons')
    return { success: true, data: newAddon }
  } catch (error: any) {
    console.error('Error in createAddonAction:', error)
    return { success: false, error: error.message || 'Failed to create addon' }
  }
}

// Admin action to update addon
export async function updateAddonAction(
  addonId: string,
  addonData: Partial<{
    facility_id?: string | null
    name?: string
    description?: string | null
    price?: number
    type?: string | null
    max_quantity?: number
    is_conditional?: boolean
    conditional_logic?: any
    is_active?: boolean
  }>
): Promise<ActionResult<Addon>> {
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

    // Get current addon to verify ownership
    const { data: currentAddon } = await supabase
      .from('addons')
      .select('studio_id')
      .eq('id', addonId)
      .single()

    if (!currentAddon) {
      return { success: false, error: 'Addon not found' }
    }

    // For CS users, verify they own the addon's studio
    if (currentProfile.role === 'cs' && currentAddon.studio_id !== currentProfile.studio_id) {
      return { success: false, error: 'Insufficient permissions for this studio' }
    }

    // Update addon
    const { data: updatedAddon, error } = await supabase
      .from('addons')
      .update(addonData)
      .eq('id', addonId)
      .select(`
        *,
        facility:facilities(id, name, icon)
      `)
      .single()

    if (error) {
      console.error('Error updating addon:', error)
      return { success: false, error: error.message }
    }

    revalidatePath('/admin/packages/addons')
    return { success: true, data: updatedAddon }
  } catch (error: any) {
    console.error('Error in updateAddonAction:', error)
    return { success: false, error: error.message || 'Failed to update addon' }
  }
}

// Admin action to delete addon
export async function deleteAddonAction(addonId: string): Promise<ActionResult> {
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

    // Get current addon to verify ownership
    const { data: currentAddon } = await supabase
      .from('addons')
      .select('studio_id')
      .eq('id', addonId)
      .single()

    if (!currentAddon) {
      return { success: false, error: 'Addon not found' }
    }

    // For CS users, verify they own the addon's studio
    if (currentProfile.role === 'cs' && currentAddon.studio_id !== currentProfile.studio_id) {
      return { success: false, error: 'Insufficient permissions for this studio' }
    }

    // Check if addon is used in any package addons
    const { data: packageAddons } = await supabase
      .from('package_addons')
      .select('id')
      .eq('addon_id', addonId)
      .limit(1)

    if (packageAddons && packageAddons.length > 0) {
      return { success: false, error: 'Cannot delete addon that is assigned to packages. Remove addon from all packages first.' }
    }

    // Check if addon is used in any reservation addons
    const { data: reservationAddons } = await supabase
      .from('reservation_addons')
      .select('id')
      .eq('addon_id', addonId)
      .limit(1)

    if (reservationAddons && reservationAddons.length > 0) {
      return { success: false, error: 'Cannot delete addon that has been used in reservations.' }
    }

    // Delete addon
    const { error } = await supabase
      .from('addons')
      .delete()
      .eq('id', addonId)

    if (error) {
      console.error('Error deleting addon:', error)
      return { success: false, error: error.message }
    }

    revalidatePath('/admin/packages/addons')
    return { success: true }
  } catch (error: any) {
    console.error('Error in deleteAddonAction:', error)
    return { success: false, error: error.message || 'Failed to delete addon' }
  }
}

// Admin action to toggle addon status
export async function toggleAddonStatusAction(addonId: string): Promise<ActionResult<Addon>> {
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

    // Get current addon to verify ownership and get current status
    const { data: currentAddon, error: fetchError } = await supabase
      .from('addons')
      .select('studio_id, is_active')
      .eq('id', addonId)
      .single()

    if (fetchError || !currentAddon) {
      return { success: false, error: 'Addon not found' }
    }

    // For CS users, verify they own the addon's studio
    if (currentProfile.role === 'cs' && currentAddon.studio_id !== currentProfile.studio_id) {
      return { success: false, error: 'Insufficient permissions for this studio' }
    }

    // Toggle status
    const newStatus = !currentAddon.is_active
    const { data: updatedAddon, error } = await supabase
      .from('addons')
      .update({ is_active: newStatus })
      .eq('id', addonId)
      .select(`
        *,
        facility:facilities(id, name, icon)
      `)
      .single()

    if (error) {
      console.error('Error toggling addon status:', error)
      return { success: false, error: error.message }
    }

    revalidatePath('/admin/packages/addons')
    return { success: true, data: updatedAddon }
  } catch (error: any) {
    console.error('Error in toggleAddonStatusAction:', error)
    return { success: false, error: error.message || 'Failed to toggle addon status' }
  }
}