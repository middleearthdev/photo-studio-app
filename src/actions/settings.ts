"use server"

import { prisma } from '@/lib/prisma'
import { auth } from '@/lib/auth'
import { revalidatePath } from 'next/cache'
import { headers } from 'next/headers'

export interface SystemSettings {
  id: string
  booking_settings: {
    auto_confirm: boolean
    require_dp: boolean
    dp_percentage: number
    advance_booking_days: number
    cancellation_hours: number
  }
  notification_settings: {
    email_notifications: boolean
    sms_notifications: boolean
    booking_reminders: boolean
    payment_reminders: boolean
  }
  created_at: string
  updated_at: string
}

export interface ProfileSettings {
  id: string
  full_name: string | null
  email: string
  phone: string | null
  avatar_url: string | null
  role: string
  studio_id: string | null
  last_login: string | null
  created_at: string
  updated_at: string
}

export interface ActionResult<T = unknown> {
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

// Get current user profile
export async function getCurrentProfile(): Promise<ActionResult<ProfileSettings>> {
  try {
    // Get current user
    const user = await getCurrentUser()
    if (!user) {
      return { success: false, error: 'Unauthorized' }
    }

    // Get user profile from User table (profile data is now integrated)
    const profile = await prisma.user.findUnique({
      where: { id: user.id },
      select: {
        id: true,
        email: true,
        full_name: true,
        phone: true,
        avatar_url: true,
        role: true,
        studio_id: true,
        last_login: true,
        createdAt: true,
        updatedAt: true
      }
    })

    if (!profile) {
      return { success: false, error: 'Profile not found' }
    }

    const profileData: ProfileSettings = {
      id: profile.id,
      full_name: profile.full_name,
      email: profile.email,
      phone: profile.phone,
      avatar_url: profile.avatar_url,
      role: profile.role,
      studio_id: profile.studio_id,
      last_login: profile.last_login?.toISOString() || null,
      created_at: profile.createdAt.toISOString(),
      updated_at: profile.updatedAt.toISOString()
    }

    return { success: true, data: profileData }
  } catch (error: unknown) {
    console.error('Error in getCurrentProfile:', error)
    const errorMessage = error instanceof Error ? error.message : 'An error occurred'
    return { success: false, error: errorMessage }
  }
}

// Update user profile
export async function updateProfile(profileData: {
  full_name: string
  phone?: string
}): Promise<ActionResult> {
  try {
    // Get current user
    const user = await getCurrentUser()
    if (!user) {
      return { success: false, error: 'Unauthorized' }
    }

    // Update user profile
    await prisma.user.update({
      where: { id: user.id },
      data: {
        full_name: profileData.full_name,
        phone: profileData.phone,
      }
    })

    revalidatePath('/admin/settings')
    return { success: true }
  } catch (error: unknown) {
    console.error('Error in updateProfile:', error)
    const errorMessage = error instanceof Error ? error.message : 'An error occurred'
    return { success: false, error: errorMessage }
  }
}

// Update user password using Better Auth
export async function updatePassword(passwords: {
  currentPassword: string
  newPassword: string
}): Promise<ActionResult> {
  try {
    // Get current user
    const user = await getCurrentUser()
    if (!user) {
      return { success: false, error: 'Unauthorized' }
    }

    // For Better Auth, we'll use the changePassword API
    // This is a simplified implementation - in production you'd want to verify the current password
    try {
      await auth.api.changePassword({
        body: {
          newPassword: passwords.newPassword,
          currentPassword: passwords.currentPassword,
        },
        headers: await headers()
      })
      
      return { success: true }
    } catch (authError: any) {
      console.error('Error updating password:', authError)
      return { success: false, error: authError.message || 'Failed to update password' }
    }
  } catch (error: unknown) {
    console.error('Error in updatePassword:', error)
    const errorMessage = error instanceof Error ? error.message : 'An error occurred'
    return { success: false, error: errorMessage }
  }
}

// Get studio settings
export async function getStudioSettings(studioId?: string): Promise<ActionResult<SystemSettings>> {
  try {
    // Get current user
    const user = await getCurrentUser()
    if (!user) {
      return { success: false, error: 'Unauthorized' }
    }

    // Get user profile to check permissions and get studio_id
    const userProfile = await prisma.user.findUnique({
      where: { id: user.id },
      select: { role: true, studio_id: true }
    })

    if (!userProfile || userProfile.role !== 'admin') {
      return { success: false, error: 'Insufficient permissions' }
    }

    const targetStudioId = studioId || userProfile.studio_id
    if (!targetStudioId) {
      return { success: false, error: 'No studio associated with user' }
    }

    // Get studio with settings
    const studio = await prisma.studio.findUnique({
      where: { id: targetStudioId },
      select: {
        id: true,
        settings: true,
        created_at: true,
        updated_at: true
      }
    })

    if (!studio) {
      return { success: false, error: 'Studio not found' }
    }

    // Parse settings or use defaults
    const defaultSettings = {
      booking_settings: {
        auto_confirm: false,
        require_dp: true,
        dp_percentage: 50,
        advance_booking_days: 30,
        cancellation_hours: 24
      },
      notification_settings: {
        email_notifications: true,
        sms_notifications: false,
        booking_reminders: true,
        payment_reminders: true
      }
    }

    let settings = defaultSettings
    if (studio.settings && typeof studio.settings === 'object') {
      settings = { ...defaultSettings, ...studio.settings as any }
    }

    const systemSettings: SystemSettings = {
      id: studio.id,
      ...settings,
      created_at: studio.created_at?.toISOString() || '',
      updated_at: studio.updated_at?.toISOString() || ''
    }

    return { success: true, data: systemSettings }
  } catch (error: unknown) {
    console.error('Error in getStudioSettings:', error)
    const errorMessage = error instanceof Error ? error.message : 'An error occurred'
    return { success: false, error: errorMessage }
  }
}

// Update studio settings
export async function updateStudioSettings(
  studioId: string,
  settings: {
    booking_settings?: Partial<SystemSettings['booking_settings']>
    notification_settings?: Partial<SystemSettings['notification_settings']>
  }
): Promise<ActionResult> {
  try {
    // Get current user
    const user = await getCurrentUser()
    if (!user) {
      return { success: false, error: 'Unauthorized' }
    }

    // Get user profile to check permissions
    const userProfile = await prisma.user.findUnique({
      where: { id: user.id },
      select: { role: true }
    })

    if (!userProfile || userProfile.role !== 'admin') {
      return { success: false, error: 'Insufficient permissions' }
    }

    // Get current settings
    const studio = await prisma.studio.findUnique({
      where: { id: studioId },
      select: { settings: true }
    })

    if (!studio) {
      return { success: false, error: 'Studio not found' }
    }

    // Merge with existing settings
    const currentSettings = studio.settings as any || {}
    const updatedSettings = {
      ...currentSettings,
      booking_settings: {
        ...currentSettings.booking_settings,
        ...settings.booking_settings
      },
      notification_settings: {
        ...currentSettings.notification_settings,
        ...settings.notification_settings
      }
    }

    // Update studio settings
    await prisma.studio.update({
      where: { id: studioId },
      data: {
        settings: updatedSettings
      }
    })

    revalidatePath('/admin/settings')
    return { success: true }
  } catch (error: unknown) {
    console.error('Error in updateStudioSettings:', error)
    const errorMessage = error instanceof Error ? error.message : 'An error occurred'
    return { success: false, error: errorMessage }
  }
}

// Backup data - simplified version
export async function createBackup(): Promise<ActionResult> {
  try {
    // Get current user to check permissions
    const user = await getCurrentUser()
    if (!user) {
      return { success: false, error: 'Unauthorized' }
    }

    // Get current user profile to check role
    const currentProfile = await prisma.user.findUnique({
      where: { id: user.id },
      select: { role: true }
    })

    if (!currentProfile || currentProfile.role !== 'admin') {
      return { success: false, error: 'Insufficient permissions' }
    }

    // For now, we'll just log this action and return success
    // In a real implementation, you would export data to files
    console.log('Backup requested by admin:', user.id, 'at', new Date().toISOString())

    return { success: true }
  } catch (error: unknown) {
    console.error('Error in createBackup:', error)
    const errorMessage = error instanceof Error ? error.message : 'An error occurred'
    return { success: false, error: errorMessage }
  }
}

// Delete all data - DANGEROUS operation
export async function deleteAllData(): Promise<ActionResult> {
  try {
    // Get current user to check permissions
    const user = await getCurrentUser()
    if (!user) {
      return { success: false, error: 'Unauthorized' }
    }

    // Get current user profile to check role
    const currentProfile = await prisma.user.findUnique({
      where: { id: user.id },
      select: { role: true }
    })

    if (!currentProfile || currentProfile.role !== 'admin') {
      return { success: false, error: 'Insufficient permissions' }
    }

    // This is a dangerous operation - for safety, we'll just log it
    // and not actually delete data unless specifically implemented
    console.log('DANGER: Delete all data requested by admin:', user.id, 'at', new Date().toISOString())

    return { success: false, error: 'Data deletion is disabled for safety. Contact system administrator.' }
  } catch (error: unknown) {
    console.error('Error in deleteAllData:', error)
    const errorMessage = error instanceof Error ? error.message : 'An error occurred'
    return { success: false, error: errorMessage }
  }
}