"use server"

import { createClient } from '@/lib/supabase/server'
import { revalidatePath } from 'next/cache'

export type UserRole = 'customer' | 'admin' | 'customer_service'

export interface UserProfile {
  id: string
  studio_id: string | null
  role: UserRole
  full_name: string | null
  phone: string | null
  address: string | null
  avatar_url: string | null
  is_active: boolean
  last_login: string | null
  created_at: string
  updated_at: string
  email?: string
}

export interface CreateUserData {
  email: string
  password: string
  full_name: string
  phone?: string
  role: UserRole
  is_active: boolean
}

export interface UpdateUserData {
  full_name: string
  phone?: string
  role: UserRole
  is_active: boolean
  password?: string
}

export interface ActionResult<T = any> {
  success: boolean
  data?: T
  error?: string
}

export async function getUsersAction(): Promise<ActionResult<UserProfile[]>> {
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

    // Get users from user_profiles table
    const { data: profiles, error: profilesError } = await supabase
      .from('user_profiles')
      .select('*')
      .order('created_at', { ascending: false })

    if (profilesError) {
      console.error('Error fetching users:', profilesError)
      return { success: false, error: 'Failed to fetch users' }
    }

    // Get auth users to get email information
    const { data: { users: authUsers }, error: authError2 } = await supabase.auth.admin.listUsers()

    if (authError2) {
      console.error('Error fetching auth users:', authError2)
      // Continue without email data if auth fetch fails
    }

    // Merge profiles with email data
    const usersWithEmail = profiles?.map(profile => {
      const authUser = authUsers?.find(user => user.id === profile.id)
      return {
        ...profile,
        email: authUser?.email || 'No email'
      }
    }) as UserProfile[]

    return { success: true, data: usersWithEmail || [] }
  } catch (error: any) {
    console.error('Error in getUsersAction:', error)
    return { success: false, error: error.message || 'An error occurred' }
  }
}

export async function createUserAction(userData: CreateUserData): Promise<ActionResult> {
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

    // Create new user with admin API
    const { data: authData, error: authError2 } = await supabase.auth.admin.createUser({
      email: userData.email,
      password: userData.password,
      email_confirm: true,
      user_metadata: {
        full_name: userData.full_name,
        phone: userData.phone,
      }
    })

    if (authError2) {
      return { success: false, error: authError2.message }
    }

    if (!authData.user) {
      return { success: false, error: 'Failed to create user' }
    }

    // Create user profile
    const { error: profileError } = await supabase
      .from('user_profiles')
      .insert({
        id: authData.user.id,
        studio_id: currentProfile.studio_id,
        role: userData.role,
        full_name: userData.full_name,
        phone: userData.phone,
        is_active: userData.is_active,
      })

    if (profileError) {
      // If profile creation fails, try to delete the auth user
      await supabase.auth.admin.deleteUser(authData.user.id)
      return { success: false, error: profileError.message }
    }


    revalidatePath('/admin/users')
    return { success: true }
  } catch (error: any) {
    console.error('Error in createUserAction:', error)
    return { success: false, error: error.message || 'Failed to create user' }
  }
}

export async function updateUserAction(userId: string, userData: UpdateUserData): Promise<ActionResult> {
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

    // Update user profile
    const { error: profileError } = await supabase
      .from('user_profiles')
      .update({
        full_name: userData.full_name,
        phone: userData.phone,
        role: userData.role,
        is_active: userData.is_active,
        updated_at: new Date().toISOString(),
      })
      .eq('id', userId)

    if (profileError) {
      return { success: false, error: profileError.message }
    }

    // Update password if provided
    if (userData.password && userData.password.length > 0) {
      const { error: authError2 } = await supabase.auth.admin.updateUserById(userId, {
        password: userData.password
      })

      if (authError2) {
        console.error('Password update error:', authError2)
        // Don't throw error for password update as profile update succeeded
      }
    }

    revalidatePath('/admin/users')
    return { success: true }
  } catch (error: any) {
    console.error('Error in updateUserAction:', error)
    return { success: false, error: error.message || 'Failed to update user' }
  }
}

export async function deactivateUserAction(userId: string): Promise<ActionResult> {
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

    // Deactivate user
    const { error } = await supabase
      .from('user_profiles')
      .update({
        is_active: false,
        updated_at: new Date().toISOString()
      })
      .eq('id', userId)

    if (error) {
      return { success: false, error: error.message }
    }

    revalidatePath('/admin/users')
    return { success: true }
  } catch (error: any) {
    console.error('Error in deactivateUserAction:', error)
    return { success: false, error: error.message || 'Failed to deactivate user' }
  }
}