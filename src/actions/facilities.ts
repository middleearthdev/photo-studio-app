"use server"

import { prisma } from '@/lib/prisma'
import { auth } from '@/lib/auth'
import { revalidatePath } from 'next/cache'
import { headers } from 'next/headers'
import { PaginationParams, PaginatedResult, calculatePagination } from '@/lib/constants/pagination'

export interface Facility {
  id: string
  studio_id: string | null
  name: string
  description: string | null
  capacity: number
  equipment: Record<string, boolean>
  hourly_rate: number | null
  is_available: boolean | null
  icon: string | null
  created_at: string
  updated_at: string
}

export interface CreateFacilityData {
  studio_id: string
  name: string
  description?: string
  capacity: number
  equipment?: Record<string, boolean>
  hourly_rate?: number | null
  icon?: string
}

export interface UpdateFacilityData extends Partial<CreateFacilityData> {
  is_available?: boolean
}

export interface ActionResult<T = unknown> {
  success: boolean
  data?: T
  error?: string
}

export async function getFacilitiesAction(studioId?: string): Promise<ActionResult<Facility[]>> {
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

    if (!currentUser || currentUser.role !== 'admin') {
      return { success: false, error: 'Insufficient permissions' }
    }

    // Filter by studio if specified, otherwise use user's studio
    const targetStudioId = studioId || currentUser.studio_id
    const where: any = {}
    if (targetStudioId) {
      where.studio_id = targetStudioId
    }

    const facilities = await prisma.facility.findMany({
      where,
      orderBy: { created_at: 'desc' }
    })

    const formattedFacilities = facilities.map(facility => ({
      ...facility,
      created_at: facility.created_at?.toISOString() || '',
      updated_at: facility.updated_at?.toISOString() || '',
      capacity: facility.capacity || 1,
      equipment: facility.equipment as Record<string, boolean> || {},
      hourly_rate: facility.hourly_rate ? Number(facility.hourly_rate) : null,
      is_available: facility.is_available || false
    }))

    return { success: true, data: formattedFacilities }
  } catch (error: unknown) {
    console.error('Error in getFacilitiesAction:', error)
    const errorMessage = error instanceof Error ? error.message : 'An error occurred'
    return { success: false, error: errorMessage }
  }
}

// Get paginated facilities for a studio
export async function getPaginatedFacilities(
  studioId: string,
  params: PaginationParams & {
    status?: 'available' | 'unavailable' | 'all'
  } = {}
): Promise<PaginatedResult<Facility>> {
  const { page = 1, pageSize = 10, search = '', status = 'all' } = params
  const { offset, pageSize: validPageSize } = calculatePagination(page, pageSize, 0)

  // Build where clause
  const where: any = { studio_id: studioId }

  // Apply filters
  if (status !== 'all') {
    where.is_available = status === 'available'
  }

  // Apply search
  if (search.trim()) {
    where.OR = [
      { name: { contains: search, mode: 'insensitive' } },
      { description: { contains: search, mode: 'insensitive' } }
    ]
  }

  // Get facilities with count
  const [facilities, total] = await Promise.all([
    prisma.facility.findMany({
      where,
      orderBy: { created_at: 'desc' },
      skip: offset,
      take: validPageSize
    }),
    prisma.facility.count({ where })
  ])

  const pagination = calculatePagination(page, validPageSize, total)

  const formattedFacilities = facilities.map(facility => ({
    ...facility,
    created_at: facility.created_at?.toISOString() || '',
    updated_at: facility.updated_at?.toISOString() || '',
    capacity: facility.capacity || 1,
    equipment: facility.equipment as Record<string, boolean> || {},
    hourly_rate: facility.hourly_rate ? Number(facility.hourly_rate) : null,
    is_available: facility.is_available || false
  }))

  return {
    data: formattedFacilities,
    pagination
  }
}

export async function getFacilityAction(facilityId: string): Promise<ActionResult<Facility>> {
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

    if (!currentUser || currentUser.role !== 'admin') {
      return { success: false, error: 'Insufficient permissions' }
    }

    // Get facility
    const facility = await prisma.facility.findUnique({
      where: { id: facilityId }
    })

    if (!facility) {
      return { success: false, error: 'Facility not found' }
    }

    const formattedFacility = {
      ...facility,
      created_at: facility.created_at?.toISOString() || '',
      updated_at: facility.updated_at?.toISOString() || '',
      capacity: facility.capacity || 1,
      equipment: facility.equipment as Record<string, boolean> || {},
      hourly_rate: facility.hourly_rate ? Number(facility.hourly_rate) : null,
      is_available: facility.is_available || false
    }

    return { success: true, data: formattedFacility }
  } catch (error: unknown) {
    console.error('Error in getFacilityAction:', error)
    const errorMessage = error instanceof Error ? error.message : 'An error occurred'
    return { success: false, error: errorMessage }
  }
}

export async function createFacilityAction(facilityData: CreateFacilityData): Promise<ActionResult> {
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

    if (!currentUser || currentUser.role !== 'admin') {
      return { success: false, error: 'Insufficient permissions' }
    }

    // Use user's studio_id if not provided
    const targetStudioId = facilityData.studio_id || currentUser.studio_id

    if (!targetStudioId) {
      return { success: false, error: 'Studio ID is required' }
    }

    // Create facility
    await prisma.facility.create({
      data: {
        studio_id: targetStudioId,
        name: facilityData.name,
        description: facilityData.description,
        capacity: facilityData.capacity,
        equipment: facilityData.equipment || {},
        hourly_rate: facilityData.hourly_rate,
        icon: facilityData.icon,
      }
    })

    revalidatePath('/admin/facilities')
    return { success: true }
  } catch (error: unknown) {
    console.error('Error in createFacilityAction:', error)
    const errorMessage = error instanceof Error ? error.message : 'Failed to create facility'
    return { success: false, error: errorMessage }
  }
}

export async function updateFacilityAction(facilityId: string, facilityData: UpdateFacilityData): Promise<ActionResult> {
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

    if (!currentUser || currentUser.role !== 'admin') {
      return { success: false, error: 'Insufficient permissions' }
    }

    // Update facility
    await prisma.facility.update({
      where: { id: facilityId },
      data: facilityData
    })

    revalidatePath('/admin/facilities')
    return { success: true }
  } catch (error: unknown) {
    console.error('Error in updateFacilityAction:', error)
    const errorMessage = error instanceof Error ? error.message : 'Failed to update facility'
    return { success: false, error: errorMessage }
  }
}

export async function deleteFacilityAction(facilityId: string): Promise<ActionResult> {
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
      select: { role: true }
    })

    if (!currentUser || currentUser.role !== 'admin') {
      return { success: false, error: 'Insufficient permissions' }
    }

    // Check for related data that would prevent deletion
    const timeslotsCount = await prisma.timeSlot.count({
      where: { facility_id: facilityId }
    })

    if (timeslotsCount > 0) {
      return { success: false, error: 'Cannot delete facility with existing time slots. Please remove all time slots first.' }
    }

    // Delete facility
    await prisma.facility.delete({
      where: { id: facilityId }
    })

    revalidatePath('/admin/facilities')
    return { success: true }
  } catch (error: unknown) {
    console.error('Error in deleteFacilityAction:', error)
    const errorMessage = error instanceof Error ? error.message : 'Failed to delete facility'
    return { success: false, error: errorMessage }
  }
}

export async function toggleFacilityAvailabilityAction(facilityId: string, isAvailable: boolean): Promise<ActionResult> {
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
      select: { role: true }
    })

    if (!currentUser || currentUser.role !== 'admin') {
      return { success: false, error: 'Insufficient permissions' }
    }

    // Update availability directly to the specified value
    await prisma.facility.update({
      where: { id: facilityId },
      data: {
        is_available: isAvailable
      }
    })

    revalidatePath('/admin/facilities')
    return { success: true }
  } catch (error: unknown) {
    console.error('Error in toggleFacilityAvailabilityAction:', error)
    const errorMessage = error instanceof Error ? error.message : 'Failed to update facility availability'
    return { success: false, error: errorMessage }
  }
}