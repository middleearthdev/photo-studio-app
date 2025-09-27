"use server"

import { createClient } from '@/lib/supabase/server'
import { revalidatePath } from 'next/cache'

export interface HomepageBanner {
  id: string
  studio_id: string
  title: string
  subtitle: string | null
  description: string | null
  banner_type: string
  background_image_url: string | null
  icon_name: string | null
  gradient_from: string
  gradient_to: string
  text_color: string
  is_active: boolean
  priority: number
  auto_rotate: boolean
  rotation_duration: number
  start_date: string | null
  end_date: string | null
  view_count: number
  created_at: string
  updated_at: string
}

export interface CreateBannerData {
  studio_id: string
  title: string
  subtitle?: string
  description?: string
  banner_type?: string
  background_image_url?: string
  icon_name?: string
  gradient_from?: string
  gradient_to?: string
  text_color?: string
  priority?: number
  auto_rotate?: boolean
  rotation_duration?: number
  start_date?: string
  end_date?: string
}

export interface UpdateBannerData extends Partial<CreateBannerData> {
  is_active?: boolean
}

export interface ActionResult<T = unknown> {
  success: boolean
  data?: T
  error?: string
}

export async function getBannersAction(studioId?: string): Promise<ActionResult<HomepageBanner[]>> {
  try {
    const supabase = await createClient()

    // Get current user to check permissions
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    if (authError || !user) {
      return { success: false, error: 'Unauthorized' }
    }

    let query = supabase
      .from('homepage_banners')
      .select('*')
      .order('priority', { ascending: false })
      .order('created_at', { ascending: false })

    // Filter by studio if provided
    if (studioId) {
      query = query.eq('studio_id', studioId)
    }

    const { data, error } = await query

    if (error) {
      console.error('Error fetching banners:', error)
      return { success: false, error: 'Failed to fetch banners' }
    }

    return { success: true, data: data || [] }
  } catch (error) {
    console.error('Error in getBannersAction:', error)
    return { success: false, error: 'Unexpected error occurred' }
  }
}

export async function getActiveBannersAction(studioId: string): Promise<ActionResult<HomepageBanner[]>> {
  try {
    const supabase = await createClient()

    const now = new Date().toISOString()

    const { data, error } = await supabase
      .from('homepage_banners')
      .select('*')
      .eq('studio_id', studioId)
      .eq('is_active', true)
      .or(`start_date.is.null,start_date.lte.${now}`)
      .or(`end_date.is.null,end_date.gte.${now}`)
      .order('priority', { ascending: false })
      .order('created_at', { ascending: false })

    if (error) {
      console.error('Error fetching active banners:', error)
      return { success: false, error: 'Failed to fetch active banners' }
    }

    return { success: true, data: data || [] }
  } catch (error) {
    console.error('Error in getActiveBannersAction:', error)
    return { success: false, error: 'Unexpected error occurred' }
  }
}

export async function getBannerAction(id: string): Promise<ActionResult<HomepageBanner>> {
  try {
    const supabase = await createClient()

    // Get current user to check permissions
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    if (authError || !user) {
      return { success: false, error: 'Unauthorized' }
    }

    const { data, error } = await supabase
      .from('homepage_banners')
      .select('*')
      .eq('id', id)
      .single()

    if (error) {
      console.error('Error fetching banner:', error)
      return { success: false, error: 'Banner not found' }
    }

    return { success: true, data }
  } catch (error) {
    console.error('Error in getBannerAction:', error)
    return { success: false, error: 'Unexpected error occurred' }
  }
}

export async function createBannerAction(bannerData: CreateBannerData): Promise<ActionResult<HomepageBanner>> {
  try {
    const supabase = await createClient()

    // Get current user to check permissions
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    if (authError || !user) {
      return { success: false, error: 'Unauthorized' }
    }

    // Validate required fields
    if (!bannerData.title || !bannerData.studio_id) {
      return { success: false, error: 'Title and studio are required' }
    }

    // Set default values
    const bannerToCreate = {
      ...bannerData,
      banner_type: bannerData.banner_type || 'promotional',
      gradient_from: bannerData.gradient_from || '#b0834d',
      gradient_to: bannerData.gradient_to || '#00052e',
      text_color: bannerData.text_color || 'text-white',
      priority: bannerData.priority || 0,
      auto_rotate: bannerData.auto_rotate ?? true,
      rotation_duration: bannerData.rotation_duration || 5000,
    }

    const { data, error } = await supabase
      .from('homepage_banners')
      .insert([bannerToCreate])
      .select()
      .single()

    if (error) {
      console.error('Error creating banner:', error)
      return { success: false, error: 'Failed to create banner' }
    }

    revalidatePath('/admin/homepage/banners')
    revalidatePath('/')

    return { success: true, data }
  } catch (error) {
    console.error('Error in createBannerAction:', error)
    return { success: false, error: 'Unexpected error occurred' }
  }
}

export async function updateBannerAction(id: string, bannerData: UpdateBannerData): Promise<ActionResult<HomepageBanner>> {
  try {
    const supabase = await createClient()

    // Get current user to check permissions
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    if (authError || !user) {
      return { success: false, error: 'Unauthorized' }
    }

    const { data, error } = await supabase
      .from('homepage_banners')
      .update({
        ...bannerData,
        updated_at: new Date().toISOString()
      })
      .eq('id', id)
      .select()
      .single()

    if (error) {
      console.error('Error updating banner:', error)
      return { success: false, error: 'Failed to update banner' }
    }

    revalidatePath('/admin/homepage/banners')
    revalidatePath('/')

    return { success: true, data }
  } catch (error) {
    console.error('Error in updateBannerAction:', error)
    return { success: false, error: 'Unexpected error occurred' }
  }
}

export async function deleteBannerAction(id: string): Promise<ActionResult> {
  try {
    const supabase = await createClient()

    // Get current user to check permissions
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    if (authError || !user) {
      return { success: false, error: 'Unauthorized' }
    }

    const { error } = await supabase
      .from('homepage_banners')
      .delete()
      .eq('id', id)

    if (error) {
      console.error('Error deleting banner:', error)
      return { success: false, error: 'Failed to delete banner' }
    }

    revalidatePath('/admin/homepage/banners')
    revalidatePath('/')

    return { success: true }
  } catch (error) {
    console.error('Error in deleteBannerAction:', error)
    return { success: false, error: 'Unexpected error occurred' }
  }
}

export async function toggleBannerStatusAction(id: string): Promise<ActionResult<HomepageBanner>> {
  try {
    const supabase = await createClient()

    // Get current user to check permissions
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    if (authError || !user) {
      return { success: false, error: 'Unauthorized' }
    }

    // First get the current status
    const { data: currentBanner, error: fetchError } = await supabase
      .from('homepage_banners')
      .select('is_active')
      .eq('id', id)
      .single()

    if (fetchError) {
      return { success: false, error: 'Banner not found' }
    }

    // Toggle the status
    const { data, error } = await supabase
      .from('homepage_banners')
      .update({ 
        is_active: !currentBanner.is_active,
        updated_at: new Date().toISOString()
      })
      .eq('id', id)
      .select()
      .single()

    if (error) {
      console.error('Error toggling banner status:', error)
      return { success: false, error: 'Failed to update banner status' }
    }

    revalidatePath('/admin/homepage/banners')
    revalidatePath('/')

    return { success: true, data }
  } catch (error) {
    console.error('Error in toggleBannerStatusAction:', error)
    return { success: false, error: 'Unexpected error occurred' }
  }
}

export async function duplicateBannerAction(id: string): Promise<ActionResult<HomepageBanner>> {
  try {
    const supabase = await createClient()

    // Get current user to check permissions
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    if (authError || !user) {
      return { success: false, error: 'Unauthorized' }
    }

    // Get the banner to duplicate
    const { data: originalBanner, error: fetchError } = await supabase
      .from('homepage_banners')
      .select('*')
      .eq('id', id)
      .single()

    if (fetchError) {
      return { success: false, error: 'Banner not found' }
    }

    // Create the duplicate
    const { id: _, created_at, updated_at, view_count, ...bannerToDuplicate } = originalBanner
    
    const duplicatedBanner = {
      ...bannerToDuplicate,
      title: `${originalBanner.title} (Copy)`,
      is_active: false, // Duplicated banners start as inactive
      view_count: 0
    }

    const { data, error } = await supabase
      .from('homepage_banners')
      .insert([duplicatedBanner])
      .select()
      .single()

    if (error) {
      console.error('Error duplicating banner:', error)
      return { success: false, error: 'Failed to duplicate banner' }
    }

    revalidatePath('/admin/homepage/banners')

    return { success: true, data }
  } catch (error) {
    console.error('Error in duplicateBannerAction:', error)
    return { success: false, error: 'Unexpected error occurred' }
  }
}

export async function incrementBannerViewAction(id: string): Promise<ActionResult> {
  try {
    const supabase = await createClient()

    const { error } = await supabase
      .from('homepage_banners')
      .update({ 
        view_count: supabase.sql`view_count + 1`,
        updated_at: new Date().toISOString()
      })
      .eq('id', id)

    if (error) {
      console.error('Error incrementing banner view:', error)
      return { success: false, error: 'Failed to update view count' }
    }

    return { success: true }
  } catch (error) {
    console.error('Error in incrementBannerViewAction:', error)
    return { success: false, error: 'Unexpected error occurred' }
  }
}

export async function updateBannerPriorityAction(id: string, priority: number): Promise<ActionResult<HomepageBanner>> {
  try {
    const supabase = await createClient()

    // Get current user to check permissions
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    if (authError || !user) {
      return { success: false, error: 'Unauthorized' }
    }

    const { data, error } = await supabase
      .from('homepage_banners')
      .update({ 
        priority,
        updated_at: new Date().toISOString()
      })
      .eq('id', id)
      .select()
      .single()

    if (error) {
      console.error('Error updating banner priority:', error)
      return { success: false, error: 'Failed to update priority' }
    }

    revalidatePath('/admin/homepage/banners')
    revalidatePath('/')

    return { success: true, data }
  } catch (error) {
    console.error('Error in updateBannerPriorityAction:', error)
    return { success: false, error: 'Unexpected error occurred' }
  }
}