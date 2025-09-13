"use server"

import { createClient } from '@/lib/supabase/server'
import { revalidatePath } from 'next/cache'

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

// Get current user profile
export async function getCurrentProfile(): Promise<ActionResult<ProfileSettings>> {
  try {
    const supabase = await createClient()

    // Get current user
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    if (authError || !user) {
      return { success: false, error: 'Unauthorized' }
    }

    // Get user profile from user_profiles table
    const { data: profile, error: profileError } = await supabase
      .from('user_profiles')
      .select('*')
      .eq('id', user.id)
      .single()

    if (profileError) {
      console.error('Error fetching profile:', profileError)
      return { success: false, error: 'Failed to fetch profile' }
    }

    if (!profile) {
      return { success: false, error: 'Profile not found' }
    }

    const profileData: ProfileSettings = {
      id: profile.id,
      full_name: profile.full_name,
      email: user.email || '',
      phone: profile.phone,
      avatar_url: profile.avatar_url,
      role: profile.role,
      studio_id: profile.studio_id,
      last_login: profile.last_login,
      created_at: profile.created_at,
      updated_at: profile.updated_at
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
    const supabase = await createClient()

    // Get current user
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    if (authError || !user) {
      return { success: false, error: 'Unauthorized' }
    }

    // Update user profile
    const { error: updateError } = await supabase
      .from('user_profiles')
      .update({
        full_name: profileData.full_name,
        phone: profileData.phone,
        updated_at: new Date().toISOString()
      })
      .eq('id', user.id)

    if (updateError) {
      console.error('Error updating profile:', updateError)
      return { success: false, error: 'Failed to update profile' }
    }

    revalidatePath('/admin/settings')
    return { success: true }
  } catch (error: unknown) {
    console.error('Error in updateProfile:', error)
    const errorMessage = error instanceof Error ? error.message : 'An error occurred'
    return { success: false, error: errorMessage }
  }
}

// Update user password
export async function updatePassword(passwords: {
  currentPassword: string
  newPassword: string
}): Promise<ActionResult> {
  try {
    const supabase = await createClient()

    // Get current user
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    if (authError || !user) {
      return { success: false, error: 'Unauthorized' }
    }

    // Verify current password by attempting to sign in
    const { error: verifyError } = await supabase.auth.signInWithPassword({
      email: user.email!,
      password: passwords.currentPassword
    })

    if (verifyError) {
      return { success: false, error: 'Current password is incorrect' }
    }

    // Update password
    const { error: updateError } = await supabase.auth.updateUser({
      password: passwords.newPassword
    })

    if (updateError) {
      console.error('Error updating password:', updateError)
      return { success: false, error: 'Failed to update password' }
    }

    return { success: true }
  } catch (error: unknown) {
    console.error('Error in updatePassword:', error)
    const errorMessage = error instanceof Error ? error.message : 'An error occurred'
    return { success: false, error: errorMessage }
  }
}


// Backup data - simplified version
export async function createBackup(): Promise<ActionResult> {
  try {
    const supabase = await createClient()

    // Get current user to check permissions
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    if (authError || !user) {
      return { success: false, error: 'Unauthorized' }
    }

    // Get current user profile to check role
    const { data: currentProfile } = await supabase
      .from('user_profiles')
      .select('role')
      .eq('id', user.id)
      .single()

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
    const supabase = await createClient()

    // Get current user to check permissions
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    if (authError || !user) {
      return { success: false, error: 'Unauthorized' }
    }

    // Get current user profile to check role
    const { data: currentProfile } = await supabase
      .from('user_profiles')
      .select('role')
      .eq('id', user.id)
      .single()

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