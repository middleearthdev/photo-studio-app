"use server"

import { createClient } from "@/lib/supabase/server"
import { revalidatePath } from "next/cache"

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
    const supabase = await createClient()

    // Check if user is admin
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    if (authError || !user) {
      return { success: false, error: 'Unauthorized' }
    }

    const { data: profile } = await supabase
      .from('user_profiles')
      .select('role')
      .eq('id', user.id)
      .single()

    if (!profile || profile.role !== 'admin') {
      return { success: false, error: 'Admin access required' }
    }

    const { data, error } = await supabase
      .from('hero_images')
      .select('*')
      .order('display_order', { ascending: true })

    if (error) {
      console.error('Error fetching hero images:', error)
      return { success: false, error: error.message }
    }

    return { success: true, data: data || [] }
  } catch (error: any) {
    console.error('Error in getHeroImagesAction:', error)
    return { success: false, error: error.message || 'Failed to fetch hero images' }
  }
}

// Get active hero images (public)
export async function getActiveHeroImagesAction(): Promise<ActionResult<HeroImage[]>> {
  try {
    const supabase = await createClient()

    const { data, error } = await supabase
      .from('hero_images')
      .select('*')
      .eq('is_active', true)
      .order('display_order', { ascending: true })
      .limit(5)

    if (error) {
      console.error('Error fetching active hero images:', error)
      return { success: false, error: error.message }
    }

    return { success: true, data: data || [] }
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
    const supabase = await createClient()

    // Check if user is admin
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    if (authError || !user) {
      return { success: false, error: 'Unauthorized' }
    }

    const { data: profile } = await supabase
      .from('user_profiles')
      .select('role')
      .eq('id', user.id)
      .single()

    if (!profile || profile.role !== 'admin') {
      return { success: false, error: 'Admin access required' }
    }

    // Check hero images count limit (max 5)
    const { count } = await supabase
      .from('hero_images')
      .select('*', { count: 'exact', head: true })

    if (count && count >= 5) {
      return { success: false, error: 'Maximum 5 hero images allowed' }
    }

    const { data: heroImage, error } = await supabase
      .from('hero_images')
      .insert([{
        title: data.title,
        description: data.description || null,
        image_url: data.image_url,
        alt_text: data.alt_text || null,
        display_order: data.display_order,
        is_active: data.is_active ?? true
      }])
      .select()
      .single()

    if (error) {
      console.error('Error creating hero image:', error)
      return { success: false, error: error.message }
    }

    revalidatePath('/')
    return { success: true, data: heroImage }
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
    const supabase = await createClient()

    // Check if user is admin
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    if (authError || !user) {
      return { success: false, error: 'Unauthorized' }
    }

    const { data: profile } = await supabase
      .from('user_profiles')
      .select('role')
      .eq('id', user.id)
      .single()

    if (!profile || profile.role !== 'admin') {
      return { success: false, error: 'Admin access required' }
    }

    const { data: heroImage, error } = await supabase
      .from('hero_images')
      .update(data)
      .eq('id', id)
      .select()
      .single()

    if (error) {
      console.error('Error updating hero image:', error)
      return { success: false, error: error.message }
    }

    revalidatePath('/')
    return { success: true, data: heroImage }
  } catch (error: any) {
    console.error('Error in updateHeroImageAction:', error)
    return { success: false, error: error.message || 'Failed to update hero image' }
  }
}

// Delete hero image
export async function deleteHeroImageAction(id: string): Promise<ActionResult> {
  try {
    const supabase = await createClient()

    // Check if user is admin
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    if (authError || !user) {
      return { success: false, error: 'Unauthorized' }
    }

    const { data: profile } = await supabase
      .from('user_profiles')
      .select('role')
      .eq('id', user.id)
      .single()

    if (!profile || profile.role !== 'admin') {
      return { success: false, error: 'Admin access required' }
    }

    const { error } = await supabase
      .from('hero_images')
      .delete()
      .eq('id', id)

    if (error) {
      console.error('Error deleting hero image:', error)
      return { success: false, error: error.message }
    }

    revalidatePath('/')
    return { success: true }
  } catch (error: any) {
    console.error('Error in deleteHeroImageAction:', error)
    return { success: false, error: error.message || 'Failed to delete hero image' }
  }
}