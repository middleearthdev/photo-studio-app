"use server"

import { prisma } from '@/lib/prisma'
import { auth } from '@/lib/auth'
import { revalidatePath } from 'next/cache'
import { headers } from 'next/headers'

export interface HeroImage {
  id: string
  title: string
  description?: string | null
  image_url: string
  alt_text?: string | null
  display_order: number
  is_active: boolean
  created_at: string
  updated_at: string
}

export interface ActionResult<T = any> {
  success: boolean
  data?: T
  error?: string
}

// Get all hero images (admin only)
export async function getHeroImagesAction(): Promise<ActionResult<HeroImage[]>> {
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
      return { success: false, error: 'Admin access required' }
    }

    const heroImages = await prisma.heroImage.findMany({
      orderBy: { display_order: 'asc' }
    })

    const formattedHeroImages = heroImages.map(image => ({
      ...image,
      created_at: image.created_at.toISOString(),
      updated_at: image.updated_at.toISOString(),
      is_active: image.is_active || false
    }))

    return { success: true, data: formattedHeroImages }
  } catch (error: any) {
    console.error('Error in getHeroImagesAction:', error)
    return { success: false, error: error.message || 'Failed to fetch hero images' }
  }
}

// Get active hero images (public)
export async function getActiveHeroImagesAction(): Promise<ActionResult<HeroImage[]>> {
  try {
    const heroImages = await prisma.heroImage.findMany({
      where: { is_active: true },
      orderBy: { display_order: 'asc' },
      take: 5
    })

    const formattedHeroImages = heroImages.map(image => ({
      ...image,
      created_at: image.created_at.toISOString(),
      updated_at: image.updated_at.toISOString(),
      is_active: image.is_active || false
    }))

    return { success: true, data: formattedHeroImages }
  } catch (error: any) {
    console.error('Error in getActiveHeroImagesAction:', error)
    return { success: false, error: error.message || 'Failed to fetch hero images' }
  }
}

// Create hero image
export async function createHeroImageAction(data: {
  title: string
  description?: string
  image_url: string
  alt_text?: string
  display_order: number
  is_active?: boolean
}): Promise<ActionResult<HeroImage>> {
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
      return { success: false, error: 'Admin access required' }
    }

    // Check hero images count limit (max 5)
    const count = await prisma.heroImage.count()

    if (count >= 5) {
      return { success: false, error: 'Maximum 5 hero images allowed' }
    }

    const heroImage = await prisma.heroImage.create({
      data: {
        title: data.title,
        description: data.description || null,
        image_url: data.image_url,
        alt_text: data.alt_text || null,
        display_order: data.display_order,
        is_active: data.is_active ?? true
      }
    })

    const formattedHeroImage = {
      ...heroImage,
      created_at: heroImage.created_at.toISOString(),
      updated_at: heroImage.updated_at.toISOString(),
      is_active: heroImage.is_active || false
    }

    revalidatePath('/')
    return { success: true, data: formattedHeroImage }
  } catch (error: any) {
    console.error('Error in createHeroImageAction:', error)
    return { success: false, error: error.message || 'Failed to create hero image' }
  }
}

// Update hero image
export async function updateHeroImageAction(
  id: string,
  data: {
    title?: string
    description?: string
    image_url?: string
    alt_text?: string
    display_order?: number
    is_active?: boolean
  }
): Promise<ActionResult<HeroImage>> {
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
      return { success: false, error: 'Admin access required' }
    }

    const heroImage = await prisma.heroImage.update({
      where: { id },
      data
    })

    const formattedHeroImage = {
      ...heroImage,
      created_at: heroImage.created_at.toISOString(),
      updated_at: heroImage.updated_at.toISOString(),
      is_active: heroImage.is_active || false
    }

    revalidatePath('/')
    return { success: true, data: formattedHeroImage }
  } catch (error: any) {
    console.error('Error in updateHeroImageAction:', error)
    return { success: false, error: error.message || 'Failed to update hero image' }
  }
}

// Delete hero image
export async function deleteHeroImageAction(id: string): Promise<ActionResult> {
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
      return { success: false, error: 'Admin access required' }
    }

    await prisma.heroImage.delete({
      where: { id }
    })

    revalidatePath('/')
    return { success: true }
  } catch (error: any) {
    console.error('Error in deleteHeroImageAction:', error)
    return { success: false, error: error.message || 'Failed to delete hero image' }
  }
}