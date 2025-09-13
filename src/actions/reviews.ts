"use server"

import { createClient } from '@/lib/supabase/server'
import { revalidatePath } from 'next/cache'

export interface Review {
  id: string
  reservation_id: string
  customer_id: string
  rating: number
  title: string | null
  comment: string | null
  photos: string[] | null
  is_featured: boolean
  is_approved: boolean
  replied_at: string | null
  reply_text: string | null
  created_at: string
  updated_at: string
  // Joined data
  customer: {
    full_name: string
    email: string
  } | null
  reservation: {
    booking_code: string
    package: {
      name: string
    } | null
  } | null
}

export interface ActionResult<T = any> {
  success: boolean
  data?: T
  error?: string
}

export async function getReviewsAction(): Promise<ActionResult<Review[]>> {
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

    if (!currentProfile || currentProfile.role !== 'admin') {
      return { success: false, error: 'Insufficient permissions' }
    }

    // Get reviews with related data
    const { data: reviews, error } = await supabase
      .from('reviews')
      .select(`
        *,
        customers:customer_id (
          full_name,
          email
        ),
        reservations:reservation_id (
          booking_code,
          packages:package_id (
            name
          )
        )
      `)
      .order('created_at', { ascending: false })

    if (error) {
      console.error('Error fetching reviews:', error)
      return { success: false, error: 'Failed to fetch reviews' }
    }

    const transformedReviews: Review[] = (reviews || []).map((review: any) => ({
      ...review,
      customer: review.customers,
      reservation: review.reservations
    }))

    return { success: true, data: transformedReviews }
  } catch (error: any) {
    console.error('Error in getReviewsAction:', error)
    return { success: false, error: error.message || 'An error occurred' }
  }
}

export async function updateReviewStatusAction(
  reviewId: string, 
  isApproved: boolean
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
      .select('role')
      .eq('id', user.id)
      .single()

    if (!currentProfile || currentProfile.role !== 'admin') {
      return { success: false, error: 'Insufficient permissions' }
    }

    // Update review status
    const { error } = await supabase
      .from('reviews')
      .update({
        is_approved: isApproved,
        updated_at: new Date().toISOString(),
      })
      .eq('id', reviewId)

    if (error) {
      console.error('Error updating review status:', error)
      return { success: false, error: error.message }
    }

    revalidatePath('/admin/reviews')
    return { success: true }
  } catch (error: any) {
    console.error('Error in updateReviewStatusAction:', error)
    return { success: false, error: error.message || 'Failed to update review status' }
  }
}

export async function toggleReviewFeaturedAction(reviewId: string): Promise<ActionResult> {
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
      .select('role')
      .eq('id', user.id)
      .single()

    if (!currentProfile || currentProfile.role !== 'admin') {
      return { success: false, error: 'Insufficient permissions' }
    }

    // Get current status
    const { data: review, error: fetchError } = await supabase
      .from('reviews')
      .select('is_featured')
      .eq('id', reviewId)
      .single()

    if (fetchError) {
      console.error('Error fetching review:', fetchError)
      return { success: false, error: 'Review not found' }
    }

    // Toggle featured status
    const { error } = await supabase
      .from('reviews')
      .update({
        is_featured: !review.is_featured,
        updated_at: new Date().toISOString(),
      })
      .eq('id', reviewId)

    if (error) {
      console.error('Error toggling review featured status:', error)
      return { success: false, error: error.message }
    }

    revalidatePath('/admin/reviews')
    return { success: true }
  } catch (error: any) {
    console.error('Error in toggleReviewFeaturedAction:', error)
    return { success: false, error: error.message || 'Failed to toggle featured status' }
  }
}

export async function replyToReviewAction(
  reviewId: string, 
  replyText: string
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
      .select('role')
      .eq('id', user.id)
      .single()

    if (!currentProfile || currentProfile.role !== 'admin') {
      return { success: false, error: 'Insufficient permissions' }
    }

    // Add reply to review
    const { error } = await supabase
      .from('reviews')
      .update({
        reply_text: replyText,
        replied_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      })
      .eq('id', reviewId)

    if (error) {
      console.error('Error replying to review:', error)
      return { success: false, error: error.message }
    }

    revalidatePath('/admin/reviews')
    return { success: true }
  } catch (error: any) {
    console.error('Error in replyToReviewAction:', error)
    return { success: false, error: error.message || 'Failed to reply to review' }
  }
}