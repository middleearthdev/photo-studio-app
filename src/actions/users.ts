"use server"

import { createClient } from '@/lib/supabase/server'
import { revalidatePath } from 'next/cache'
import { PaginationParams, PaginatedResult, calculatePagination } from '@/lib/constants/pagination'

export type UserRole = 'customer' | 'admin' | 'cs'

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

export interface ActionResult<T = unknown> {
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
  } catch (error: unknown) {
    console.error('Error in getUsersAction:', error)
    const errorMessage = error instanceof Error ? error.message : 'An error occurred'
    return { success: false, error: errorMessage }
  }
}

// Get paginated users
export async function getPaginatedUsers(
  params: PaginationParams & {
    role?: UserRole | 'all'
    status?: 'active' | 'inactive' | 'all'
    studioId?: string
  } = {}
): Promise<PaginatedResult<UserProfile>> {
  const supabase = await createClient()

  const { page = 1, pageSize = 10, search = '', role = 'all', status = 'all', studioId } = params
  const { offset, pageSize: validPageSize } = calculatePagination(page, pageSize, 0)

  // Build the query
  let query = supabase
    .from('user_profiles')
    .select('*', { count: 'exact' })

  // Apply filters
  if (role !== 'all') {
    query = query.eq('role', role)
  }

  if (status !== 'all') {
    query = query.eq('is_active', status === 'active')
  }

  if (studioId && studioId !== 'all') {
    query = query.eq('studio_id', studioId)
  }

  // Apply search
  if (search.trim()) {
    query = query.or(`full_name.ilike.%${search}%,phone.ilike.%${search}%`)
  }

  // Apply pagination and ordering
  const { data: profiles, error, count } = await query
    .order('created_at', { ascending: false })
    .range(offset, offset + validPageSize - 1)

  if (error) {
    console.error('Error fetching paginated users:', error)
    throw new Error(`Failed to fetch users: ${error.message}`)
  }

  // Get auth users to get email information (for current page only)
  let usersWithEmail = profiles || []
  try {
    const { data: { users: authUsers }, error: authError } = await supabase.auth.admin.listUsers()

    if (!authError && authUsers) {
      usersWithEmail = profiles?.map(profile => {
        const authUser = authUsers.find(user => user.id === profile.id)
        return {
          ...profile,
          email: authUser?.email || 'No email'
        }
      }) as UserProfile[] || []
    }
  } catch (error) {
    console.warn('Could not fetch email data:', error)
  }

  const total = count || 0
  const pagination = calculatePagination(page, validPageSize, total)

  return {
    data: usersWithEmail,
    pagination
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
    // Admin users have studio_id = null (general access)
    // CS users have studio_id = currentProfile.studio_id (studio-specific access)
    const { error: profileError } = await supabase
      .from('user_profiles')
      .insert({
        id: authData.user.id,
        studio_id: userData.role === 'admin' ? null : currentProfile.studio_id,
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
  } catch (error: unknown) {
    console.error('Error in createUserAction:', error)
    const errorMessage = error instanceof Error ? error.message : 'Failed to create user'
    return { success: false, error: errorMessage }
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
  } catch (error: unknown) {
    console.error('Error in updateUserAction:', error)
    const errorMessage = error instanceof Error ? error.message : 'Failed to update user'
    return { success: false, error: errorMessage }
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

    // Prevent self-deactivation
    if (userId === user.id) {
      return { success: false, error: 'Cannot deactivate your own account' }
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
  } catch (error: unknown) {
    console.error('Error in deactivateUserAction:', error)
    const errorMessage = error instanceof Error ? error.message : 'Failed to deactivate user'
    return { success: false, error: errorMessage }
  }
}

export async function activateUserAction(userId: string): Promise<ActionResult> {
  try {
    const supabase = await createClient()

    // Get current user to check permissions
    const { data: { user }, error: authError1 } = await supabase.auth.getUser()
    if (authError1 || !user) {
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

    // Activate user
    const { error } = await supabase
      .from('user_profiles')
      .update({
        is_active: true,
        updated_at: new Date().toISOString()
      })
      .eq('id', userId)

    if (error) {
      return { success: false, error: error.message }
    }

    revalidatePath('/admin/users')
    return { success: true }
  } catch (error: unknown) {
    console.error('Error in activateUserAction:', error)
    const errorMessage = error instanceof Error ? error.message : 'Failed to activate user'
    return { success: false, error: errorMessage }
  }
}

export async function deleteUserPermanentlyAction(userId: string): Promise<ActionResult> {
  try {
    const supabase = await createClient()

    // Get current user to check permissions
    const { data: { user }, error: authError1 } = await supabase.auth.getUser()
    if (authError1 || !user) {
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

    // Prevent self-deletion
    if (userId === user.id) {
      return { success: false, error: 'Cannot delete your own account' }
    }

    // Get user to be deleted
    const { data: userToDelete } = await supabase
      .from('user_profiles')
      .select('role')
      .eq('id', userId)
      .single()

    if (!userToDelete) {
      return { success: false, error: 'User not found' }
    }

    // Check if user has related data that would prevent deletion
    const { data: relatedData } = await supabase
      .from('reservations')
      .select('id')
      .eq('user_id', userId)
      .limit(1)

    if (relatedData && relatedData.length > 0) {
      return { 
        success: false, 
        error: 'Cannot delete user with existing reservations. Deactivate instead.' 
      }
    }

    // Start transaction-like operations
    // 1. Delete user profile first
    const { error: profileError } = await supabase
      .from('user_profiles')
      .delete()
      .eq('id', userId)

    if (profileError) {
      return { success: false, error: profileError.message }
    }

    // 2. Delete from auth.users (this will cascade delete the profile via trigger)
    const { error: authError2 } = await supabase.auth.admin.deleteUser(userId)

    if (authError2) {
      console.error('Warning: Profile deleted but auth user deletion failed:', authError2)
      // Don't return error here as profile is already deleted
    }

    revalidatePath('/admin/users')
    return { success: true }
  } catch (error: unknown) {
    console.error('Error in deleteUserPermanentlyAction:', error)
    const errorMessage = error instanceof Error ? error.message : 'Failed to delete user permanently'
    return { success: false, error: errorMessage }
  }
}