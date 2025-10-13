"use server"

import { prisma } from '@/lib/prisma'
import { auth } from '@/lib/auth'
import { revalidatePath } from 'next/cache'
import { headers } from 'next/headers'

export interface Studio {
  id: string
  name: string
  description: string | null
  address: string
  phone: string | null
  email: string | null
  operating_hours: Record<string, { open: string; close: string }> | null
  is_active: boolean | null
  settings: Record<string, any> | null
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

// Helper function to get current user session
async function getCurrentUser() {
  const session = await auth.api.getSession({
    headers: await headers()
  })
  return session?.user || null
}

export async function getStudiosAction(): Promise<ActionResult<Studio[]>> {
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

    if (!currentProfile || currentProfile.role !== 'admin') {
      return { success: false, error: 'Insufficient permissions' }
    }

    // Get studios
    const studios = await prisma.studio.findMany({
      orderBy: { created_at: 'desc' }
    })

    const formattedStudios: Studio[] = studios.map(studio => ({
      ...studio,
      created_at: studio.created_at?.toISOString() || '',
      updated_at: studio.updated_at?.toISOString() || '',
      operating_hours: studio.operating_hours as Record<string, { open: string; close: string }> | null,
      settings: studio.settings as Record<string, any> | null
    }))

    return { success: true, data: formattedStudios }
  } catch (error: any) {
    console.error('Error in getStudiosAction:', error)
    return { success: false, error: error.message || 'An error occurred' }
  }
}

export async function getStudioAction(studioId: string): Promise<ActionResult<Studio>> {
  try {
    // Get current user to check permissions
    const user = await getCurrentUser()
    if (!user) {
      return { success: false, error: 'Unauthorized' }
    }

    // Get current user profile
    const currentProfile = await prisma.user.findUnique({
      where: { id: user.id },
      select: { role: true }
    })

    if (!currentProfile || currentProfile.role !== 'admin') {
      return { success: false, error: 'Insufficient permissions' }
    }

    // Get studio
    const studio = await prisma.studio.findUnique({
      where: { id: studioId }
    })

    if (!studio) {
      return { success: false, error: 'Studio not found' }
    }

    const formattedStudio: Studio = {
      ...studio,
      created_at: studio.created_at?.toISOString() || '',
      updated_at: studio.updated_at?.toISOString() || '',
      operating_hours: studio.operating_hours as Record<string, { open: string; close: string }> | null,
      settings: studio.settings as Record<string, any> | null
    }

    return { success: true, data: formattedStudio }
  } catch (error: any) {
    console.error('Error in getStudioAction:', error)
    return { success: false, error: error.message || 'Failed to fetch studio' }
  }
}

// Public action to get active studios for customers
export async function getPublicStudiosAction(): Promise<ActionResult<Studio[]>> {
  try {
    // Get active studios only
    const studios = await prisma.studio.findMany({
      where: { is_active: true },
      orderBy: { name: 'asc' }
    })

    const formattedStudios: Studio[] = studios.map(studio => ({
      ...studio,
      created_at: studio.created_at?.toISOString() || '',
      updated_at: studio.updated_at?.toISOString() || '',
      operating_hours: studio.operating_hours as Record<string, { open: string; close: string }> | null,
      settings: studio.settings as Record<string, any> | null
    }))

    return { success: true, data: formattedStudios }
  } catch (error: any) {
    console.error('Error in getPublicStudiosAction:', error)
    return { success: false, error: error.message || 'An error occurred' }
  }
}

export async function createStudioAction(studioData: CreateStudioData): Promise<ActionResult> {
  try {
    // Get current user to check permissions
    const user = await getCurrentUser()
    if (!user) {
      return { success: false, error: 'Unauthorized' }
    }

    // Get current user profile
    const currentProfile = await prisma.user.findUnique({
      where: { id: user.id },
      select: { role: true }
    })

    if (!currentProfile || currentProfile.role !== 'admin') {
      return { success: false, error: 'Insufficient permissions' }
    }

    // Create studio
    await prisma.studio.create({
      data: {
        name: studioData.name,
        description: studioData.description || null,
        address: studioData.address,
        phone: studioData.phone || null,
        email: studioData.email || null,
        operating_hours: studioData.operating_hours || undefined,
        settings: studioData.settings || {},
      }
    })

    revalidatePath('/admin/studio')
    return { success: true }
  } catch (error: any) {
    console.error('Error in createStudioAction:', error)
    return { success: false, error: error.message || 'Failed to create studio' }
  }
}

export async function updateStudioAction(studioId: string, studioData: UpdateStudioData): Promise<ActionResult> {
  try {
    // Get current user to check permissions
    const user = await getCurrentUser()
    if (!user) {
      return { success: false, error: 'Unauthorized' }
    }

    // Get current user profile
    const currentProfile = await prisma.user.findUnique({
      where: { id: user.id },
      select: { role: true }
    })

    if (!currentProfile || currentProfile.role !== 'admin') {
      return { success: false, error: 'Insufficient permissions' }
    }

    // Update studio
    await prisma.studio.update({
      where: { id: studioId },
      data: {
        ...studioData,
        operating_hours: studioData.operating_hours || undefined,
        settings: studioData.settings || undefined
      }
    })

    revalidatePath('/admin/studio')
    return { success: true }
  } catch (error: any) {
    console.error('Error in updateStudioAction:', error)
    return { success: false, error: error.message || 'Failed to update studio' }
  }
}

export async function deleteStudioAction(studioId: string): Promise<ActionResult> {
  try {
    // Get current user to check permissions
    const user = await getCurrentUser()
    if (!user) {
      return { success: false, error: 'Unauthorized' }
    }

    // Get current user profile
    const currentProfile = await prisma.user.findUnique({
      where: { id: user.id },
      select: { role: true }
    })

    if (!currentProfile || currentProfile.role !== 'admin') {
      return { success: false, error: 'Insufficient permissions' }
    }

    // Get current studio status
    const studio = await prisma.studio.findUnique({
      where: { id: studioId },
      select: { is_active: true }
    })

    if (!studio) {
      return { success: false, error: 'Studio not found' }
    }

    // Toggle studio status
    const newStatus = !studio.is_active
    await prisma.studio.update({
      where: { id: studioId },
      data: {
        is_active: newStatus
      }
    })

    revalidatePath('/admin/studio')
    return { success: true }
  } catch (error: any) {
    console.error('Error in deleteStudioAction:', error)
    return { success: false, error: error.message || 'Failed to update studio status' }
  }
}

export async function hardDeleteStudioAction(studioId: string): Promise<ActionResult> {
  try {
    // Get current user to check permissions
    const user = await getCurrentUser()
    if (!user) {
      return { success: false, error: 'Unauthorized' }
    }

    // Get current user profile
    const currentProfile = await prisma.user.findUnique({
      where: { id: user.id },
      select: { role: true }
    })

    if (!currentProfile || currentProfile.role !== 'admin') {
      return { success: false, error: 'Insufficient permissions' }
    }

    // Check if studio is inactive (required for hard delete)
    const studio = await prisma.studio.findUnique({
      where: { id: studioId },
      select: { is_active: true }
    })

    if (!studio) {
      return { success: false, error: 'Studio not found' }
    }

    if (studio.is_active) {
      return { success: false, error: 'Cannot permanently delete active studio. Please deactivate first.' }
    }

    // Check for related data that would prevent deletion
    const facilitiesCount = await prisma.facility.count({
      where: { studio_id: studioId }
    })

    const reservationsCount = await prisma.reservation.count({
      where: { studio_id: studioId }
    })

    if (facilitiesCount > 0) {
      return { success: false, error: 'Cannot delete studio with existing facilities. Please remove all facilities first.' }
    }

    if (reservationsCount > 0) {
      return { success: false, error: 'Cannot delete studio with existing reservations.' }
    }

    // Hard delete - permanently remove from database
    await prisma.studio.delete({
      where: { id: studioId }
    })

    revalidatePath('/admin/studio')
    return { success: true }
  } catch (error: any) {
    console.error('Error in hardDeleteStudioAction:', error)
    return { success: false, error: error.message || 'Failed to permanently delete studio' }
  }
}