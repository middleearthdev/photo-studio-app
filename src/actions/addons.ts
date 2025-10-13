"use server"

import { prisma } from '@/lib/prisma'
import { auth } from '@/lib/auth'
import { headers } from 'next/headers'
import { revalidatePath } from 'next/cache'
import { calculatePagination, type PaginatedResult } from '@/lib/constants/pagination'

export interface Addon {
  id: string
  studio_id: string | null
  facility_id: string | null
  name: string
  description: string | null
  price: number
  type: string | null
  max_quantity: number | null
  is_conditional: boolean | null
  conditional_logic: any
  is_active: boolean | null
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
    // Get addon details to check if it's facility-based
    const addon = await prisma.addon.findUnique({
      where: { id: addonId },
      select: { facility_id: true }
    })

    if (!addon) {
      return { success: false, error: 'Addon not found' }
    }

    // If not facility-based, it's always available
    if (!addon.facility_id) {
      return { success: true, data: true }
    }

    // Check if facility is available at the requested time
    const conflictingReservations = await prisma.reservation.findMany({
      where: {
        studio_id: studioId,
        reservation_date: new Date(date),
        status: {
          in: ['pending', 'confirmed', 'in_progress']
        },
        reservation_addons: {
          some: {
            addon: {
              facility_id: addon.facility_id
            }
          }
        }
      },
      include: {
        reservation_addons: {
          include: {
            addon: true
          }
        }
      }
    })

    // Check for time conflicts
    const requestStart = new Date(`${date} ${startTime}`)
    const requestEnd = new Date(`${date} ${endTime}`)
    
    const hasConflict = conflictingReservations?.some(reservation => {
      const reservationDate = reservation.reservation_date.toISOString().split('T')[0]
      const reservationStart = new Date(`${reservationDate} ${reservation.start_time}`)
      const reservationEnd = new Date(`${reservationDate} ${reservation.end_time}`)
      
      // Check if requested time overlaps with existing reservation
      return (requestStart < reservationEnd && requestEnd > reservationStart)
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
    const whereClause: any = {
      is_active: true
    }

    // If studioId is provided, filter by studio
    if (studioId) {
      whereClause.studio_id = studioId
    }

    const addons = await prisma.addon.findMany({
      where: whereClause,
      include: {
        facility: {
          select: {
            id: true,
            name: true,
            icon: true
          }
        }
      },
      orderBy: [
        { type: 'asc' },
        { name: 'asc' }
      ]
    })

    // Transform to match expected interface
    const transformedAddons: Addon[] = addons.map(addon => ({
      ...addon,
      studio_id: addon.studio_id || '',
      price: Number(addon.price),
      max_quantity: addon.max_quantity || 1,
      is_conditional: addon.is_conditional || false,
      is_active: addon.is_active || false,
      created_at: addon.created_at?.toISOString() || '',
      updated_at: addon.updated_at?.toISOString() || '',
      facility: addon.facility ? {
        id: addon.facility.id,
        name: addon.facility.name,
        icon: addon.facility.icon || undefined
      } : undefined
    }))

    return { success: true, data: transformedAddons }
  } catch (error: any) {
    console.error('Error in getPublicAddonsAction:', error)
    return { success: false, error: error.message || 'An error occurred' }
  }
}

// Public action to get package-specific addons
export async function getPackageAddonsAction(packageId: string): Promise<ActionResult<Addon[]>> {
  try {
    // Get package addons with all related data
    const packageAddons = await prisma.packageAddon.findMany({
      where: {
        package_id: packageId,
        addon: {
          is_active: true
        }
      },
      include: {
        addon: {
          include: {
            facility: {
              select: {
                id: true,
                name: true,
                icon: true
              }
            }
          }
        }
      },
      orderBy: {
        display_order: 'asc'
      }
    })

    // Transform data to include package addon info
    const addons: Addon[] = packageAddons
      .filter(pa => pa.addon !== null)
      .map(pa => {
        const addon = pa.addon!
        const finalPrice = Number(addon.price) * (1 - Number(pa.discount_percentage || 0) / 100)

        return {
          id: addon.id,
          studio_id: addon.studio_id || '',
          facility_id: addon.facility_id,
          name: addon.name,
          description: addon.description,
          price: Number(addon.price),
          type: addon.type,
          max_quantity: addon.max_quantity || 1,
          is_conditional: addon.is_conditional || false,
          conditional_logic: addon.conditional_logic,
          is_active: addon.is_active || false,
          created_at: addon.created_at?.toISOString() || '',
          updated_at: addon.updated_at?.toISOString() || '',
          facility: addon.facility ? {
            id: addon.facility.id,
            name: addon.facility.name,
            description: null
          } : undefined,
          package_addon: {
            is_included: pa.is_included || false,
            discount_percentage: Number(pa.discount_percentage || 0),
            is_recommended: pa.is_recommended || false,
            display_order: pa.display_order || 0,
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
export async function getPackageAddonsGroupedAction(packageId: string): Promise<ActionResult<{ [key: string]: Addon[] }>> {
  try {
    const result = await getPackageAddonsAction(packageId)

    if (!result.success || !result.data) {
      return {
        success: false,
        error: result.error || 'Failed to fetch addons'
      }
    }

    // Group addons by type with same logic as before
    const grouped: { [key: string]: Addon[] } = {}

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
export async function getPublicAddonsGroupedAction(studioId?: string): Promise<ActionResult<{ [key: string]: Addon[] }>> {
  try {
    const result = await getPublicAddonsAction(studioId)

    if (!result.success || !result.data) {
      return {
        success: false,
        error: result.error || 'Failed to fetch addons'
      }
    }

    // Group addons by type (using facility name or type field)
    const grouped: { [key: string]: Addon[] } = {}

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

// Helper function to get current user session
async function getCurrentUser() {
  const session = await auth.api.getSession({
    headers: await headers()
  })
  return session?.user || null
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
    // Get current user to check permissions
    const user = await getCurrentUser()
    if (!user) {
      return { success: false, error: 'Unauthorized' }
    }

    // Get current user profile
    const currentProfile = await prisma.user.findUnique({
      where: { id: user.id },
      select: { role: true, studio_id: true }
    })

    if (!currentProfile || !['admin', 'cs'].includes(currentProfile.role)) {
      return { success: false, error: 'Insufficient permissions' }
    }

    // For CS users, verify they own both the package and addon
    if (currentProfile.role === 'cs') {
      const packageData = await prisma.package.findUnique({
        where: { id: packageId },
        select: { studio_id: true }
      })

      const addonData = await prisma.addon.findUnique({
        where: { id: addonId },
        select: { studio_id: true }
      })

      if (!packageData || !addonData ||
        packageData.studio_id !== currentProfile.studio_id ||
        addonData.studio_id !== currentProfile.studio_id) {
        return { success: false, error: 'Insufficient permissions for this studio' }
      }
    }

    // Insert or update package-addon relationship
    await prisma.packageAddon.upsert({
      where: {
        unique_package_addon: {
          package_id: packageId,
          addon_id: addonId
        }
      },
      create: {
        package_id: packageId,
        addon_id: addonId,
        is_included: options.is_included || false,
        discount_percentage: options.discount_percentage || 0,
        is_recommended: options.is_recommended || false,
        display_order: options.display_order || 0,
      },
      update: {
        is_included: options.is_included || false,
        discount_percentage: options.discount_percentage || 0,
        is_recommended: options.is_recommended || false,
        display_order: options.display_order || 0,
        updated_at: new Date()
      }
    })

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
    // Get current user to check permissions
    const user = await getCurrentUser()
    if (!user) {
      return { success: false, error: 'Unauthorized' }
    }

    // Get current user profile
    const currentProfile = await prisma.user.findUnique({
      where: { id: user.id },
      select: { role: true, studio_id: true }
    })

    if (!currentProfile || !['admin', 'cs'].includes(currentProfile.role)) {
      return { success: false, error: 'Insufficient permissions' }
    }

    // For CS users, add additional verification
    if (currentProfile.role === 'cs') {
      const packageAddon = await prisma.packageAddon.findFirst({
        where: {
          package_id: packageId,
          addon_id: addonId,
          package: {
            studio_id: currentProfile.studio_id
          }
        }
      })

      if (!packageAddon) {
        return { success: false, error: 'Insufficient permissions for this studio' }
      }
    }

    await prisma.packageAddon.deleteMany({
      where: {
        package_id: packageId,
        addon_id: addonId
      }
    })

    revalidatePath('/admin/packages')
    return { success: true }
  } catch (error: any) {
    console.error('Error in removeAddonFromPackageAction:', error)
    return { success: false, error: error.message || 'Failed to remove addon from package' }
  }
}

// Admin action to bulk assign all available addons to package
export async function bulkAssignAddonsToPackageAction(
  packageId: string,
  defaultOptions: {
    is_included?: boolean
    discount_percentage?: number
    is_recommended?: boolean
    display_order_start?: number
  } = {}
): Promise<ActionResult<{ assigned: number; skipped: number }>> {
  try {
    // Get current user to check permissions
    const user = await getCurrentUser()
    if (!user) {
      return { success: false, error: 'Unauthorized' }
    }

    // Get current user profile
    const currentProfile = await prisma.user.findUnique({
      where: { id: user.id },
      select: { role: true, studio_id: true }
    })

    if (!currentProfile || !['admin', 'cs'].includes(currentProfile.role)) {
      return { success: false, error: 'Insufficient permissions' }
    }

    // Get package details to verify ownership
    const packageData = await prisma.package.findUnique({
      where: { id: packageId },
      select: { studio_id: true }
    })

    if (!packageData) {
      return { success: false, error: 'Package not found' }
    }

    // Check if user has access to this package's studio
    if (currentProfile.role === 'cs' && currentProfile.studio_id !== packageData.studio_id) {
      return { success: false, error: 'Insufficient permissions' }
    }

    // Get all addons for the studio
    const allAddons = await prisma.addon.findMany({
      where: {
        studio_id: packageData.studio_id,
        is_active: true
      },
      select: { id: true, name: true, type: true }
    })

    if (allAddons.length === 0) {
      return { success: false, error: 'No addons found to assign' }
    }

    // Get already assigned addons
    const existingAssignments = await prisma.packageAddon.findMany({
      where: { package_id: packageId },
      select: { addon_id: true }
    })

    const existingAddonIds = new Set(existingAssignments.map(item => item.addon_id))

    // Filter out already assigned addons
    const availableAddons = allAddons.filter(addon => !existingAddonIds.has(addon.id))

    if (availableAddons.length === 0) {
      return { success: true, data: { assigned: 0, skipped: allAddons.length } }
    }

    // Prepare bulk insert data
    const insertData = availableAddons.map((addon, index) => ({
      package_id: packageId,
      addon_id: addon.id,
      is_included: defaultOptions.is_included || false,
      discount_percentage: defaultOptions.discount_percentage || 0,
      is_recommended: defaultOptions.is_recommended || false,
      display_order: (defaultOptions.display_order_start || 0) + index
    }))

    // Bulk insert
    await prisma.packageAddon.createMany({
      data: insertData
    })

    revalidatePath('/admin/packages')
    return {
      success: true,
      data: {
        assigned: availableAddons.length,
        skipped: existingAddonIds.size
      }
    }
  } catch (error: any) {
    console.error('Error in bulkAssignAddonsToPackageAction:', error)
    return { success: false, error: error.message || 'Failed to bulk assign addons to package' }
  }
}

// Admin action to get all addons
export async function getAddonsAction(studioId?: string): Promise<ActionResult<Addon[]>> {
  try {
    // Get current user to check permissions
    const user = await getCurrentUser()
    if (!user) {
      return { success: false, error: 'Unauthorized' }
    }

    // Get current user profile
    const currentProfile = await prisma.user.findUnique({
      where: { id: user.id },
      select: { role: true, studio_id: true }
    })

    if (!currentProfile || !['admin', 'cs'].includes(currentProfile.role)) {
      return { success: false, error: 'Insufficient permissions' }
    }

    const whereClause: any = {}

    // Filter by studio - admin can see all, cs only their studio
    if (currentProfile.role === 'cs') {
      whereClause.studio_id = currentProfile.studio_id
    } else if (studioId) {
      whereClause.studio_id = studioId
    }

    const addons = await prisma.addon.findMany({
      where: whereClause,
      include: {
        facility: {
          select: {
            id: true,
            name: true,
            icon: true
          }
        }
      },
      orderBy: [
        { type: 'asc' },
        { name: 'asc' }
      ]
    })

    // Transform to match the expected interface
    const transformedAddons: Addon[] = addons.map(addon => ({
      ...addon,
      studio_id: addon.studio_id || '',
      price: Number(addon.price),
      max_quantity: addon.max_quantity || 1,
      is_conditional: addon.is_conditional || false,
      is_active: addon.is_active || false,
      created_at: addon.created_at?.toISOString() || '',
      updated_at: addon.updated_at?.toISOString() || '',
      facility: addon.facility ? {
        id: addon.facility.id,
        name: addon.facility.name,
        icon: addon.facility.icon || undefined
      } : undefined
    }))

    return { success: true, data: transformedAddons }
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
    const user = await getCurrentUser()
    if (!user) {
      throw new Error('Unauthorized')
    }

    // Get current user profile
    const currentProfile = await prisma.user.findUnique({
      where: { id: user.id },
      select: { role: true, studio_id: true }
    })

    if (!currentProfile || !['admin', 'cs'].includes(currentProfile.role)) {
      throw new Error('Insufficient permissions')
    }

    // Build where clause
    const whereClause: any = {}

    // Filter by studio - admin can see all, cs only their studio
    if (currentProfile.role === 'cs') {
      whereClause.studio_id = currentProfile.studio_id
    } else if (studioId) {
      whereClause.studio_id = studioId
    }

    // Apply status filter
    if (status === 'active') {
      whereClause.is_active = true
    } else if (status === 'inactive') {
      whereClause.is_active = false
    }

    // Apply type filter
    if (type && type !== 'all') {
      whereClause.type = type
    }

    // Apply facility filter
    if (facilityId) {
      if (facilityId === 'general') {
        whereClause.facility_id = null
      } else {
        whereClause.facility_id = facilityId
      }
    }

    // Apply search filter
    if (search && search.trim()) {
      whereClause.OR = [
        { name: { contains: search, mode: 'insensitive' } },
        { description: { contains: search, mode: 'insensitive' } }
      ]
    }

    // Get total count and data
    const [total, addons] = await Promise.all([
      prisma.addon.count({ where: whereClause }),
      prisma.addon.findMany({
        where: whereClause,
        include: {
          facility: {
            select: {
              id: true,
              name: true,
              icon: true
            }
          }
        },
        orderBy: [
          { type: 'asc' },
          { name: 'asc' }
        ],
        skip: offset,
        take: validPageSize
      })
    ])

    const pagination = calculatePagination(page, validPageSize, total)

    // Transform to match expected interface
    const transformedAddons: Addon[] = addons.map(addon => ({
      ...addon,
      studio_id: addon.studio_id || '',
      price: Number(addon.price),
      max_quantity: addon.max_quantity || 1,
      is_conditional: addon.is_conditional || false,
      is_active: addon.is_active || false,
      created_at: addon.created_at?.toISOString() || '',
      updated_at: addon.updated_at?.toISOString() || '',
      facility: addon.facility ? {
        id: addon.facility.id,
        name: addon.facility.name,
        icon: addon.facility.icon || undefined
      } : undefined
    }))

    return {
      success: true,
      data: {
        data: transformedAddons,
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
    // Get current user to check permissions
    const user = await getCurrentUser()
    if (!user) {
      return { success: false, error: 'Unauthorized' }
    }

    // Get current user profile
    const currentProfile = await prisma.user.findUnique({
      where: { id: user.id },
      select: { role: true, studio_id: true }
    })

    if (!currentProfile || !['admin', 'cs'].includes(currentProfile.role)) {
      return { success: false, error: 'Insufficient permissions' }
    }

    // For CS users, verify they own the studio
    if (currentProfile.role === 'cs' && addonData.studio_id !== currentProfile.studio_id) {
      return { success: false, error: 'Insufficient permissions for this studio' }
    }

    // Create addon
    const newAddon = await prisma.addon.create({
      data: addonData,
      include: {
        facility: {
          select: {
            id: true,
            name: true,
            icon: true
          }
        }
      }
    })

    // Transform to match expected interface
    const transformedAddon: Addon = {
      ...newAddon,
      studio_id: newAddon.studio_id || '',
      price: Number(newAddon.price),
      max_quantity: newAddon.max_quantity || 1,
      is_conditional: newAddon.is_conditional || false,
      is_active: newAddon.is_active || false,
      created_at: newAddon.created_at?.toISOString() || '',
      updated_at: newAddon.updated_at?.toISOString() || '',
      facility: newAddon.facility ? {
        id: newAddon.facility.id,
        name: newAddon.facility.name,
        icon: newAddon.facility.icon || undefined
      } : undefined
    }

    revalidatePath('/admin/packages/addons')
    return { success: true, data: transformedAddon }
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
    // Get current user to check permissions
    const user = await getCurrentUser()
    if (!user) {
      return { success: false, error: 'Unauthorized' }
    }

    // Get current user profile
    const currentProfile = await prisma.user.findUnique({
      where: { id: user.id },
      select: { role: true, studio_id: true }
    })

    if (!currentProfile || !['admin', 'cs'].includes(currentProfile.role)) {
      return { success: false, error: 'Insufficient permissions' }
    }

    // Get current addon to verify ownership
    const currentAddon = await prisma.addon.findUnique({
      where: { id: addonId },
      select: { studio_id: true }
    })

    if (!currentAddon) {
      return { success: false, error: 'Addon not found' }
    }

    // For CS users, verify they own the addon's studio
    if (currentProfile.role === 'cs' && currentAddon.studio_id !== currentProfile.studio_id) {
      return { success: false, error: 'Insufficient permissions for this studio' }
    }

    // Update addon
    const updatedAddon = await prisma.addon.update({
      where: { id: addonId },
      data: addonData,
      include: {
        facility: {
          select: {
            id: true,
            name: true,
            icon: true
          }
        }
      }
    })

    // Transform to match expected interface
    const transformedAddon: Addon = {
      ...updatedAddon,
      studio_id: updatedAddon.studio_id || '',
      price: Number(updatedAddon.price),
      max_quantity: updatedAddon.max_quantity || 1,
      is_conditional: updatedAddon.is_conditional || false,
      is_active: updatedAddon.is_active || false,
      created_at: updatedAddon.created_at?.toISOString() || '',
      updated_at: updatedAddon.updated_at?.toISOString() || '',
      facility: updatedAddon.facility ? {
        id: updatedAddon.facility.id,
        name: updatedAddon.facility.name,
        icon: updatedAddon.facility.icon || undefined
      } : undefined
    }

    revalidatePath('/admin/packages/addons')
    return { success: true, data: transformedAddon }
  } catch (error: any) {
    console.error('Error in updateAddonAction:', error)
    return { success: false, error: error.message || 'Failed to update addon' }
  }
}

// Admin action to delete addon
export async function deleteAddonAction(addonId: string): Promise<ActionResult> {
  try {
    // Get current user to check permissions
    const user = await getCurrentUser()
    if (!user) {
      return { success: false, error: 'Unauthorized' }
    }

    // Get current user profile
    const currentProfile = await prisma.user.findUnique({
      where: { id: user.id },
      select: { role: true, studio_id: true }
    })

    if (!currentProfile || !['admin', 'cs'].includes(currentProfile.role)) {
      return { success: false, error: 'Insufficient permissions' }
    }

    // Get current addon to verify ownership
    const currentAddon = await prisma.addon.findUnique({
      where: { id: addonId },
      select: { studio_id: true }
    })

    if (!currentAddon) {
      return { success: false, error: 'Addon not found' }
    }

    // For CS users, verify they own the addon's studio
    if (currentProfile.role === 'cs' && currentAddon.studio_id !== currentProfile.studio_id) {
      return { success: false, error: 'Insufficient permissions for this studio' }
    }

    // Check if addon is used in any package addons
    const packageAddonsCount = await prisma.packageAddon.count({
      where: { addon_id: addonId }
    })

    if (packageAddonsCount > 0) {
      return { success: false, error: 'Cannot delete addon that is assigned to packages. Remove addon from all packages first.' }
    }

    // Check if addon is used in any reservation addons
    const reservationAddonsCount = await prisma.reservationAddon.count({
      where: { addon_id: addonId }
    })

    if (reservationAddonsCount > 0) {
      return { success: false, error: 'Cannot delete addon that has been used in reservations.' }
    }

    // Delete addon
    await prisma.addon.delete({
      where: { id: addonId }
    })

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
    // Get current user to check permissions
    const user = await getCurrentUser()
    if (!user) {
      return { success: false, error: 'Unauthorized' }
    }

    // Get current user profile
    const currentProfile = await prisma.user.findUnique({
      where: { id: user.id },
      select: { role: true, studio_id: true }
    })

    if (!currentProfile || !['admin', 'cs'].includes(currentProfile.role)) {
      return { success: false, error: 'Insufficient permissions' }
    }

    // Get current addon to verify ownership and get current status
    const currentAddon = await prisma.addon.findUnique({
      where: { id: addonId },
      select: { studio_id: true, is_active: true }
    })

    if (!currentAddon) {
      return { success: false, error: 'Addon not found' }
    }

    // For CS users, verify they own the addon's studio
    if (currentProfile.role === 'cs' && currentAddon.studio_id !== currentProfile.studio_id) {
      return { success: false, error: 'Insufficient permissions for this studio' }
    }

    // Toggle status
    const newStatus = !currentAddon.is_active
    const updatedAddon = await prisma.addon.update({
      where: { id: addonId },
      data: { is_active: newStatus },
      include: {
        facility: {
          select: {
            id: true,
            name: true,
            icon: true
          }
        }
      }
    })

    // Transform to match expected interface
    const transformedAddon: Addon = {
      ...updatedAddon,
      studio_id: updatedAddon.studio_id || '',
      price: Number(updatedAddon.price),
      max_quantity: updatedAddon.max_quantity || 1,
      is_conditional: updatedAddon.is_conditional || false,
      is_active: updatedAddon.is_active || false,
      created_at: updatedAddon.created_at?.toISOString() || '',
      updated_at: updatedAddon.updated_at?.toISOString() || '',
      facility: updatedAddon.facility ? {
        id: updatedAddon.facility.id,
        name: updatedAddon.facility.name,
        icon: updatedAddon.facility.icon || undefined
      } : undefined
    }

    revalidatePath('/admin/packages/addons')
    return { success: true, data: transformedAddon }
  } catch (error: any) {
    console.error('Error in toggleAddonStatusAction:', error)
    return { success: false, error: error.message || 'Failed to toggle addon status' }
  }
}