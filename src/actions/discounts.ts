"use server"

import { prisma } from '@/lib/prisma'
import { auth } from '@/lib/auth'
import { revalidatePath } from 'next/cache'
import { headers } from 'next/headers'

export interface Discount {
  id: string
  studio_id: string | null
  code: string | null
  name: string
  description: string | null
  type: string
  value: number
  minimum_amount: number
  maximum_discount: number | null
  is_active: boolean | null
  valid_from: string | null
  valid_until: string | null
  usage_limit: number | null
  used_count: number | null
  applies_to: string | null
  created_by: string | null
  created_at: string
  updated_at: string
  // Relations
  studio?: {
    id: string
    name: string
  } | null
  created_by_profile?: {
    id: string
    name: string | null
  } | null
}

// Helper function to convert Prisma discount data to Discount interface
function formatDiscountForClient(discount: any): Discount {
  return {
    ...discount,
    value: Number(discount.value),
    minimum_amount: Number(discount.minimum_amount),
    maximum_discount: discount.maximum_discount ? Number(discount.maximum_discount) : null,
    created_at: discount.created_at?.toISOString() || '',
    updated_at: discount.updated_at?.toISOString() || '',
    valid_from: discount.valid_from?.toISOString() || null,
    valid_until: discount.valid_until?.toISOString() || null,
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
    name: string | null
  }
}

export interface CreateDiscountData {
  studio_id: string
  code?: string
  name: string
  description?: string
  type: string
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
    // Get current user session
    const session = await auth.api.getSession({
      headers: await headers()
    })
    
    if (!session?.user) {
      return { success: false, error: 'Unauthorized' }
    }

    // Get current user with role
    const currentUser = await prisma.user.findUnique({
      where: { id: session.user.id },
      select: { role: true, studio_id: true }
    })

    if (!currentUser || !['admin', 'cs'].includes(currentUser.role)) {
      return { success: false, error: 'Insufficient permissions' }
    }

    // Build where clause
    const where: any = {}
    
    // Filter by studio - admin can see all, cs only their studio
    if (currentUser.role === 'cs') {
      where.studio_id = currentUser.studio_id
    } else if (studioId) {
      where.studio_id = studioId
    }

    const discounts = await prisma.discount.findMany({
      where,
      include: {
        studio: {
          select: {
            id: true,
            name: true
          }
        },
        creator: {
          select: {
            id: true,
            name: true
          }
        }
      },
      orderBy: { created_at: 'desc' }
    })

    const formattedDiscounts = discounts.map(discount => ({
      ...formatDiscountForClient(discount),
      created_by_profile: discount.creator
    }))

    return { success: true, data: formattedDiscounts }
  } catch (error: any) {
    console.error('Error in getDiscountsAction:', error)
    return { success: false, error: error.message || 'An error occurred' }
  }
}

// Get active discounts for a studio (for booking form)
export async function getActiveDiscountsAction(studioId: string): Promise<ActionResult<Discount[]>> {
  try {
    const now = new Date()
    
    const discounts = await prisma.discount.findMany({
      where: {
        studio_id: studioId,
        is_active: true,
        OR: [
          { valid_from: null },
          { valid_from: { lte: now } }
        ],
        AND: [
          {
            OR: [
              { valid_until: null },
              { valid_until: { gte: now } }
            ]
          }
        ]
      },
      include: {
        studio: {
          select: {
            id: true,
            name: true
          }
        }
      },
      orderBy: { name: 'asc' }
    })

    // Filter out discounts that have reached usage limit
    const availableDiscounts = discounts.filter(discount => {
      if (discount.usage_limit === null) return true
      return (discount.used_count || 0) < discount.usage_limit
    })

    const formattedDiscounts = availableDiscounts.map(formatDiscountForClient)

    return { success: true, data: formattedDiscounts }
  } catch (error: any) {
    console.error('Error in getActiveDiscountsAction:', error)
    return { success: false, error: error.message || 'An error occurred' }
  }
}

// Create new discount
export async function createDiscountAction(data: CreateDiscountData): Promise<ActionResult<Discount>> {
  try {
    // Get current user session
    const session = await auth.api.getSession({
      headers: await headers()
    })
    
    if (!session?.user) {
      return { success: false, error: 'Unauthorized' }
    }

    // Get current user with role
    const currentUser = await prisma.user.findUnique({
      where: { id: session.user.id },
      select: { role: true, studio_id: true }
    })

    if (!currentUser || !['admin', 'cs'].includes(currentUser.role)) {
      return { success: false, error: 'Insufficient permissions' }
    }

    // For CS users, ensure they can only create discounts for their studio
    if (currentUser.role === 'cs' && data.studio_id !== currentUser.studio_id) {
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
      const existingDiscount = await prisma.discount.findUnique({
        where: { code: data.code }
      })

      if (existingDiscount) {
        return { success: false, error: 'Discount code already exists' }
      }
    }

    // Create discount
    const discountData = {
      ...data,
      created_by: session.user.id,
      minimum_amount: data.minimum_amount || 0,
      is_active: data.is_active !== false,
      applies_to: data.applies_to || 'all',
      used_count: 0,
      valid_from: data.valid_from ? new Date(data.valid_from) : null,
      valid_until: data.valid_until ? new Date(data.valid_until) : null,
    }

    const createdDiscount = await prisma.discount.create({
      data: discountData,
      include: {
        studio: {
          select: {
            id: true,
            name: true
          }
        },
        creator: {
          select: {
            id: true,
            name: true
          }
        }
      }
    })

    const formattedDiscount = {
      ...formatDiscountForClient(createdDiscount),
      created_by_profile: createdDiscount.creator
    }

    revalidatePath('/admin/discounts')
    return { success: true, data: formattedDiscount }
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
    // Get current user session
    const session = await auth.api.getSession({
      headers: await headers()
    })
    
    if (!session?.user) {
      return { success: false, error: 'Unauthorized' }
    }

    // Get current user with role
    const currentUser = await prisma.user.findUnique({
      where: { id: session.user.id },
      select: { role: true, studio_id: true }
    })

    if (!currentUser || !['admin', 'cs'].includes(currentUser.role)) {
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
      const existingDiscount = await prisma.discount.findFirst({
        where: {
          code: data.code,
          NOT: { id: discountId }
        }
      })

      if (existingDiscount) {
        return { success: false, error: 'Discount code already exists' }
      }
    }

    // Build where clause for CS users
    const where: any = { id: discountId }
    if (currentUser.role === 'cs') {
      where.studio_id = currentUser.studio_id
    }

    // Prepare update data
    const updateData: any = { ...data }
    if (data.valid_from) {
      updateData.valid_from = new Date(data.valid_from)
    }
    if (data.valid_until) {
      updateData.valid_until = new Date(data.valid_until)
    }

    const updatedDiscount = await prisma.discount.update({
      where,
      data: updateData,
      include: {
        studio: {
          select: {
            id: true,
            name: true
          }
        },
        creator: {
          select: {
            id: true,
            name: true
          }
        }
      }
    })

    const formattedDiscount = {
      ...formatDiscountForClient(updatedDiscount),
      created_by_profile: updatedDiscount.creator
    }

    revalidatePath('/admin/discounts')
    return { success: true, data: formattedDiscount }
  } catch (error: any) {
    console.error('Error in updateDiscountAction:', error)
    return { success: false, error: error.message || 'Failed to update discount' }
  }
}

// Delete discount
export async function deleteDiscountAction(discountId: string): Promise<ActionResult> {
  try {
    // Get current user session
    const session = await auth.api.getSession({
      headers: await headers()
    })
    
    if (!session?.user) {
      return { success: false, error: 'Unauthorized' }
    }

    // Get current user with role
    const currentUser = await prisma.user.findUnique({
      where: { id: session.user.id },
      select: { role: true, studio_id: true }
    })

    if (!currentUser || !['admin', 'cs'].includes(currentUser.role)) {
      return { success: false, error: 'Insufficient permissions' }
    }

    // Check if discount has been used
    const usageCount = await prisma.reservationDiscount.count({
      where: { discount_id: discountId }
    })

    if (usageCount > 0) {
      return { success: false, error: 'Cannot delete discount that has been used. Deactivate it instead.' }
    }

    // Build where clause for CS users
    const where: any = { id: discountId }
    if (currentUser.role === 'cs') {
      where.studio_id = currentUser.studio_id
    }

    await prisma.discount.delete({ where })

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
    // Get discount details
    const discount = await prisma.discount.findUnique({
      where: { id: discountId },
      include: {
        studio: true
      }
    })

    if (!discount) {
      return {
        success: true,
        data: {
          is_valid: false,
          discount_amount: 0,
          error_message: 'Discount not found',
          discount_info: null
        }
      }
    }

    // Validate studio
    if (discount.studio_id !== studioId) {
      return {
        success: true,
        data: {
          is_valid: false,
          discount_amount: 0,
          error_message: 'Discount not available for this studio',
          discount_info: formatDiscountForClient(discount)
        }
      }
    }

    // Check if discount is active
    if (!discount.is_active) {
      return {
        success: true,
        data: {
          is_valid: false,
          discount_amount: 0,
          error_message: 'Discount is not active',
          discount_info: formatDiscountForClient(discount)
        }
      }
    }

    // Check date validity
    const now = new Date()
    if (discount.valid_from && discount.valid_from > now) {
      return {
        success: true,
        data: {
          is_valid: false,
          discount_amount: 0,
          error_message: 'Discount is not yet valid',
          discount_info: formatDiscountForClient(discount)
        }
      }
    }

    if (discount.valid_until && discount.valid_until < now) {
      return {
        success: true,
        data: {
          is_valid: false,
          discount_amount: 0,
          error_message: 'Discount has expired',
          discount_info: formatDiscountForClient(discount)
        }
      }
    }

    // Check usage limit
    if (discount.usage_limit && (discount.used_count || 0) >= discount.usage_limit) {
      return {
        success: true,
        data: {
          is_valid: false,
          discount_amount: 0,
          error_message: 'Discount usage limit reached',
          discount_info: formatDiscountForClient(discount)
        }
      }
    }

    // Check minimum amount
    if (Number(discount.minimum_amount) > reservationTotal) {
      return {
        success: true,
        data: {
          is_valid: false,
          discount_amount: 0,
          error_message: `Minimum order amount is ${discount.minimum_amount}`,
          discount_info: formatDiscountForClient(discount)
        }
      }
    }

    // Calculate discount amount
    let discountAmount = 0
    if (discount.type === 'percentage') {
      discountAmount = (reservationTotal * Number(discount.value)) / 100
    } else if (discount.type === 'fixed_amount') {
      discountAmount = Number(discount.value)
    }

    // Apply maximum discount limit
    if (discount.maximum_discount && discountAmount > Number(discount.maximum_discount)) {
      discountAmount = Number(discount.maximum_discount)
    }

    return {
      success: true,
      data: {
        is_valid: true,
        discount_amount: discountAmount,
        error_message: null,
        discount_info: formatDiscountForClient(discount)
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
    const discount = await prisma.discount.findFirst({
      where: {
        code: code,
        studio_id: studioId,
        is_active: true
      },
      include: {
        studio: {
          select: {
            id: true,
            name: true
          }
        }
      }
    })

    if (!discount) {
      return { success: false, error: 'Discount code not found' }
    }

    const formattedDiscount = formatDiscountForClient(discount)

    return { success: true, data: formattedDiscount }
  } catch (error: any) {
    console.error('Error in getDiscountByCodeAction:', error)
    return { success: false, error: error.message || 'Failed to get discount' }
  }
}