"use server"

import { prisma } from '@/lib/prisma'
import { auth } from '@/lib/auth'
import { revalidatePath } from 'next/cache'
import { headers } from 'next/headers'

export interface Review {
  id: string
  reservation_id: string | null
  customer_id: string | null
  rating: number | null
  title: string | null
  comment: string | null
  photos: string[] | null
  is_featured: boolean | null
  is_approved: boolean | null
  replied_at: string | null
  reply_text: string | null
  created_at: string
  updated_at: string
  // Joined data
  customer: {
    full_name: string | null
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

// Helper function to get current user session
async function getCurrentUser() {
  const session = await auth.api.getSession({
    headers: await headers()
  })
  return session?.user || null
}

export async function getReviewsAction(): Promise<ActionResult<Review[]>> {
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

    // Get reviews with related data
    const reviews = await prisma.review.findMany({
      include: {
        customer: {
          select: {
            full_name: true,
            email: true
          }
        },
        reservation: {
          select: {
            booking_code: true,
            package: {
              select: {
                name: true
              }
            }
          }
        }
      },
      orderBy: { created_at: 'desc' }
    })

    const transformedReviews: Review[] = reviews.map((review) => ({
      ...review,
      created_at: review.created_at?.toISOString() || '',
      updated_at: review.updated_at?.toISOString() || '',
      replied_at: review.replied_at?.toISOString() || null,
      photos: Array.isArray(review.photos) ? review.photos as string[] : null
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

    // Update review status
    await prisma.review.update({
      where: { id: reviewId },
      data: {
        is_approved: isApproved,
      }
    })

    revalidatePath('/admin/reviews')
    return { success: true }
  } catch (error: any) {
    console.error('Error in updateReviewStatusAction:', error)
    return { success: false, error: error.message || 'Failed to update review status' }
  }
}

export async function toggleReviewFeaturedAction(reviewId: string): Promise<ActionResult> {
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

    // Get current status
    const review = await prisma.review.findUnique({
      where: { id: reviewId },
      select: { is_featured: true }
    })

    if (!review) {
      return { success: false, error: 'Review not found' }
    }

    // Toggle featured status
    await prisma.review.update({
      where: { id: reviewId },
      data: {
        is_featured: !review.is_featured,
      }
    })

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

    // Add reply to review
    await prisma.review.update({
      where: { id: reviewId },
      data: {
        reply_text: replyText,
        replied_at: new Date(),
      }
    })

    revalidatePath('/admin/reviews')
    return { success: true }
  } catch (error: any) {
    console.error('Error in replyToReviewAction:', error)
    return { success: false, error: error.message || 'Failed to reply to review' }
  }
}