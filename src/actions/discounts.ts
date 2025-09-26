"use server"

import { createClient } from '@/lib/supabase/server'
import { revalidatePath } from 'next/cache'

export interface Discount {
  id: string
  studio_id: string
  code: string | null
  name: string
  description: string | null
  type: 'percentage' | 'fixed_amount'
  value: number
  minimum_amount: number
  maximum_discount: number | null
  is_active: boolean
  valid_from: string | null
  valid_until: string | null
  usage_limit: number | null
  used_count: number
  applies_to: 'all' | 'packages' | 'addons'
  created_by: string
  created_at: string
  updated_at: string
  // Relations
  studio?: {
    id: string
    name: string
  }
  created_by_profile?: {
    id: string
    full_name: string
  }
}

export interface ReservationDiscount {
  id: string
  reservation_id: string
  discount_id: string | null
  discount_code: string | null
  discount_name: string
  discount_type: 'percentage' | 'fixed_amount'
  discount_value: number
  discount_amount: number
  applied_by: string
  applied_at: string
  notes: string | null
  // Relations
  discount?: Discount
  applied_by_profile?: {
    id: string
    full_name: string
  }
}

export interface CreateDiscountData {
  studio_id: string
  code?: string
  name: string
  description?: string
  type: 'percentage' | 'fixed_amount'
  value: number
  minimum_amount?: number
  maximum_discount?: number
  is_active?: boolean
  valid_from?: string
  valid_until?: string
  usage_limit?: number
  applies_to?: 'all' | 'packages' | 'addons'
}

export interface UpdateDiscountData {
  code?: string
  name?: string
  description?: string
  type?: 'percentage' | 'fixed_amount'
  value?: number
  minimum_amount?: number
  maximum_discount?: number
  is_active?: boolean
  valid_from?: string
  valid_until?: string
  usage_limit?: number
  applies_to?: 'all' | 'packages' | 'addons'
}

export interface DiscountValidation {
  is_valid: boolean
  discount_amount: number
  error_message: string | null
  discount_info: any
}

export interface ActionResult<T = any> {
  success: boolean
  data?: T
  error?: string
}

// Get all discounts for a studio
export async function getDiscountsAction(studioId?: string): Promise<ActionResult<Discount[]>> {
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
      .from('discounts')
      .select(`
        *,
        studio:studios(id, name),
        created_by_profile:user_profiles!created_by(id, full_name)
      `)
      .order('created_at', { ascending: false })

    // Filter by studio - admin can see all, cs only their studio
    if (currentProfile.role === 'cs') {
      query = query.eq('studio_id', currentProfile.studio_id)
    } else if (studioId) {
      query = query.eq('studio_id', studioId)
    }

    const { data: discounts, error } = await query

    if (error) {
      console.error('Error fetching discounts:', error)
      return { success: false, error: 'Failed to fetch discounts' }
    }

    return { success: true, data: discounts || [] }
  } catch (error: any) {
    console.error('Error in getDiscountsAction:', error)
    return { success: false, error: error.message || 'An error occurred' }
  }
}

// Get active discounts for a studio (for booking form)
export async function getActiveDiscountsAction(studioId: string): Promise<ActionResult<Discount[]>> {
  try {
    const supabase = await createClient()

    const { data: discounts, error } = await supabase
      .from('discounts')
      .select(`
        *,
        studio:studios(id, name)
      `)
      .eq('studio_id', studioId)
      .eq('is_active', true)
      .or('valid_from.is.null,valid_from.lte.' + new Date().toISOString())
      .or('valid_until.is.null,valid_until.gte.' + new Date().toISOString())
      .order('name')

    if (error) {
      console.error('Error fetching active discounts:', error)
      return { success: false, error: 'Failed to fetch active discounts' }
    }

    // Filter out discounts that have reached usage limit
    const availableDiscounts = (discounts || []).filter(discount => {
      if (discount.usage_limit === null) return true
      return discount.used_count < discount.usage_limit
    })

    return { success: true, data: availableDiscounts }
  } catch (error: any) {
    console.error('Error in getActiveDiscountsAction:', error)
    return { success: false, error: error.message || 'An error occurred' }
  }
}

// Create new discount
export async function createDiscountAction(data: CreateDiscountData): Promise<ActionResult<Discount>> {
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

    // For CS users, ensure they can only create discounts for their studio
    if (currentProfile.role === 'cs' && data.studio_id !== currentProfile.studio_id) {
      return { success: false, error: 'Cannot create discount for different studio' }
    }

    // Validate data
    if (data.type === 'percentage' && (data.value <= 0 || data.value > 100)) {
      return { success: false, error: 'Percentage value must be between 1 and 100' }
    }

    if (data.type === 'fixed_amount' && data.value <= 0) {
      return { success: false, error: 'Fixed amount must be greater than 0' }
    }

    // Check if code already exists (if provided)
    if (data.code) {
      const { data: existingDiscount } = await supabase
        .from('discounts')
        .select('id')
        .eq('code', data.code)
        .single()

      if (existingDiscount) {
        return { success: false, error: 'Discount code already exists' }
      }
    }

    // Create discount
    const { data: createdDiscount, error: createError } = await supabase
      .from('discounts')
      .insert({
        ...data,
        created_by: user.id,
        minimum_amount: data.minimum_amount || 0,
        is_active: data.is_active !== false,
        applies_to: data.applies_to || 'all',
        used_count: 0
      })
      .select(`
        *,
        studio:studios(id, name),
        created_by_profile:user_profiles!created_by(id, full_name)
      `)
      .single()

    if (createError) {
      console.error('Error creating discount:', createError)
      return { success: false, error: createError.message }
    }

    revalidatePath('/admin/discounts')
    return { success: true, data: createdDiscount }
  } catch (error: any) {
    console.error('Error in createDiscountAction:', error)
    return { success: false, error: error.message || 'Failed to create discount' }
  }
}

// Update discount
export async function updateDiscountAction(
  discountId: string,
  data: UpdateDiscountData
): Promise<ActionResult<Discount>> {
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

    // Validate data if type is being updated
    if (data.type === 'percentage' && data.value && (data.value <= 0 || data.value > 100)) {
      return { success: false, error: 'Percentage value must be between 1 and 100' }
    }

    if (data.type === 'fixed_amount' && data.value && data.value <= 0) {
      return { success: false, error: 'Fixed amount must be greater than 0' }
    }

    // Check if code already exists (if being updated)
    if (data.code) {
      const { data: existingDiscount } = await supabase
        .from('discounts')
        .select('id')
        .eq('code', data.code)
        .neq('id', discountId)
        .single()

      if (existingDiscount) {
        return { success: false, error: 'Discount code already exists' }
      }
    }

    // Build update query with studio check for CS users
    let query = supabase
      .from('discounts')
      .update(data)
      .eq('id', discountId)

    // CS users can only update their studio's discounts
    if (currentProfile.role === 'cs') {
      query = query.eq('studio_id', currentProfile.studio_id)
    }

    const { data: updatedDiscount, error: updateError } = await query
      .select(`
        *,
        studio:studios(id, name),
        created_by_profile:user_profiles!created_by(id, full_name)
      `)
      .single()

    if (updateError) {
      console.error('Error updating discount:', updateError)
      return { success: false, error: updateError.message }
    }

    revalidatePath('/admin/discounts')
    return { success: true, data: updatedDiscount }
  } catch (error: any) {
    console.error('Error in updateDiscountAction:', error)
    return { success: false, error: error.message || 'Failed to update discount' }
  }
}

// Delete discount
export async function deleteDiscountAction(discountId: string): Promise<ActionResult> {
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

    // Check if discount has been used
    const { data: usageCount } = await supabase
      .from('reservation_discounts')
      .select('id')
      .eq('discount_id', discountId)

    if (usageCount && usageCount.length > 0) {
      return { success: false, error: 'Cannot delete discount that has been used. Deactivate it instead.' }
    }

    // Build delete query with studio check for CS users
    let query = supabase
      .from('discounts')
      .delete()
      .eq('id', discountId)

    // CS users can only delete their studio's discounts
    if (currentProfile.role === 'cs') {
      query = query.eq('studio_id', currentProfile.studio_id)
    }

    const { error: deleteError } = await query

    if (deleteError) {
      console.error('Error deleting discount:', deleteError)
      return { success: false, error: deleteError.message }
    }

    revalidatePath('/admin/discounts')
    return { success: true }
  } catch (error: any) {
    console.error('Error in deleteDiscountAction:', error)
    return { success: false, error: error.message || 'Failed to delete discount' }
  }
}

// Validate discount for booking
export async function validateDiscountAction(
  discountId: string,
  reservationTotal: number,
  studioId: string
): Promise<ActionResult<DiscountValidation>> {
  try {
    const supabase = await createClient()

    // Call the database function
    const { data, error } = await supabase
      .rpc('validate_discount', {
        p_discount_id: discountId,
        p_reservation_total: reservationTotal,
        p_studio_id: studioId
      })

    if (error) {
      console.error('Error validating discount:', error)
      return { success: false, error: 'Failed to validate discount' }
    }

    if (!data || data.length === 0) {
      return { success: false, error: 'Invalid validation response' }
    }

    const validationResult = data[0]
    return {
      success: true,
      data: {
        is_valid: validationResult.is_valid,
        discount_amount: validationResult.discount_amount,
        error_message: validationResult.error_message || null,
        discount_info: validationResult.discount_info
      }
    }
  } catch (error: any) {
    console.error('Error in validateDiscountAction:', error)
    return { success: false, error: error.message || 'Failed to validate discount' }
  }
}

// Get discount by code
export async function getDiscountByCodeAction(
  code: string,
  studioId: string
): Promise<ActionResult<Discount>> {
  try {
    const supabase = await createClient()

    const { data: discount, error } = await supabase
      .from('discounts')
      .select(`
        *,
        studio:studios(id, name)
      `)
      .eq('code', code)
      .eq('studio_id', studioId)
      .eq('is_active', true)
      .single()

    if (error || !discount) {
      return { success: false, error: 'Discount code not found' }
    }

    return { success: true, data: discount }
  } catch (error: any) {
    console.error('Error in getDiscountByCodeAction:', error)
    return { success: false, error: error.message || 'Failed to get discount' }
  }
}