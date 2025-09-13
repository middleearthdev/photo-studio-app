"use server"


import { revalidatePath } from 'next/cache'
import { createClient } from '@/lib/supabase/server'

export type UserRole = 'customer' | 'admin' | 'cs'

export interface AuthResult {
  success: boolean
  error?: string
  redirectTo?: string
}

export async function signInAction(
  email: string,
  password: string,
  userType: 'staff' | 'customer' = 'customer'
): Promise<AuthResult> {
  const supabase = await createClient();

  try {
    console.log('🔐 Server Auth: Attempting login for:', email)
    
    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password,
    })

    if (error) {
      console.error('❌ Server Auth: Login error:', error.message)
      return { success: false, error: error.message }
    }

    if (!data.user) {
      console.error('❌ Server Auth: No user data returned')
      return { success: false, error: 'Login gagal' }
    }

    console.log('✅ Server Auth: User authenticated:', data.user.email)

    // Get user profile to check role
    const { data: profile, error: profileError } = await supabase
      .from('user_profiles')
      .select('role, is_active, studio_id')
      .eq('id', data.user.id)
      .single()

    if (profileError || !profile) {
      console.error('Profile error:', profileError)
      await supabase.auth.signOut()
      return { success: false, error: 'Profil pengguna tidak ditemukan' }
    }

    if (!profile.is_active) {
      await supabase.auth.signOut()
      return { success: false, error: 'Akun Anda telah dinonaktifkan' }
    }

    // Validate user type matches role
    const isStaff = ['admin', 'cs'].includes(profile.role)

    if (userType === 'staff' && !isStaff) {
      await supabase.auth.signOut()
      return { success: false, error: 'Akun Anda tidak memiliki akses staff' }
    }

    if (userType === 'customer' && isStaff) {
      await supabase.auth.signOut()
      return { success: false, error: 'Silakan gunakan portal staff untuk login' }
    }

    // Update last login
    await supabase
      .from('user_profiles')
      .update({ last_login: new Date().toISOString() })
      .eq('id', data.user.id)

    console.log('✅ Server Auth: Profile verified. Role:', profile.role)

    // Determine redirect path based on role
    let redirectTo = '/dashboard' // Default for customers
    if (profile.role === 'admin') {
      redirectTo = '/admin/dashboard'
    } else if (profile.role === 'cs') {
      redirectTo = '/cs'
    }

    console.log('✅ Server Auth: Login successful, redirecting to:', redirectTo)

    revalidatePath('/', 'layout')
    return { success: true, redirectTo }
  } catch (error) {
    console.error('Sign in error:', error)
    return { success: false, error: 'Terjadi kesalahan saat login' }
  }
}

export async function signUpAction(
  email: string,
  password: string,
  fullName: string,
  phone?: string
): Promise<AuthResult> {
  const supabase = await createClient();


  try {
    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: {
          full_name: fullName,
          phone: phone || null,
          role: 'customer' // Always customer for registration
        }
      }
    })

    if (error) {
      return { success: false, error: error.message }
    }

    if (!data.user) {
      return { success: false, error: 'Registrasi gagal' }
    }

    // If email confirmation is disabled, create customer record
    if (data.session) {
      await supabase
        .from('customers')
        .insert({
          user_id: data.user.id,
          full_name: fullName,
          email: email,
          phone: phone || null,
          is_guest: false
        })
    }

    return {
      success: true,
      error: 'Registrasi berhasil! Silakan cek email untuk verifikasi.'
    }
  } catch (error) {
    console.error('Sign up error:', error)
    return { success: false, error: 'Terjadi kesalahan saat registrasi' }
  }
}

export async function signOutAction(): Promise<AuthResult> {
  const supabase = await createClient();


  try {
    const { error } = await supabase.auth.signOut()

    if (error) {
      return { success: false, error: error.message }
    }

    revalidatePath('/', 'layout')
    return { success: true }
  } catch (error) {
    console.error('Sign out error:', error)
    return { success: false, error: 'Terjadi kesalahan saat logout' }
  }
}

export async function resetPasswordAction(email: string): Promise<AuthResult> {
  const supabase = await createClient();


  try {
    const { error } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: `${process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000'}/reset-password`,
    })

    if (error) {
      return { success: false, error: error.message }
    }

    return {
      success: true,
      error: 'Link reset password telah dikirim ke email Anda'
    }
  } catch (error) {
    console.error('Reset password error:', error)
    return { success: false, error: 'Terjadi kesalahan saat reset password' }
  }
}

export async function updatePasswordAction(password: string): Promise<AuthResult> {
  const supabase = await createClient();


  try {
    const { error } = await supabase.auth.updateUser({ password })

    if (error) {
      return { success: false, error: error.message }
    }

    return { success: true }
  } catch (error) {
    console.error('Update password error:', error)
    return { success: false, error: 'Terjadi kesalahan saat update password' }
  }
}

export async function createStaffUserAction(
  email: string,
  password: string,
  fullName: string,
  role: 'admin' | 'cs',
  phone?: string,
  studioId?: string
): Promise<AuthResult> {
  const supabase = await createClient();

  try {
    // Check if current user is admin
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) {
      return { success: false, error: 'Unauthorized' }
    }

    const { data: currentProfile } = await supabase
      .from('user_profiles')
      .select('role, studio_id')
      .eq('id', user.id)
      .single()

    if (!currentProfile || currentProfile.role !== 'admin') {
      return { success: false, error: 'Hanya admin yang dapat membuat user staff' }
    }

    // Create user using admin API
    const { data, error } = await supabase.auth.admin.createUser({
      email,
      password,
      user_metadata: {
        full_name: fullName,
        phone: phone || null
      },
      email_confirm: true
    })

    if (error) {
      return { success: false, error: error.message }
    }

    if (!data.user) {
      return { success: false, error: 'Gagal membuat user' }
    }

    // Create/update profile with staff role
    const { error: profileError } = await supabase
      .from('user_profiles')
      .upsert({
        id: data.user.id,
        studio_id: studioId || currentProfile.studio_id,
        role: role,
        full_name: fullName,
        phone: phone || null,
        is_active: true
      })

    if (profileError) {
      // Try to delete the created user if profile creation fails
      await supabase.auth.admin.deleteUser(data.user.id)
      return { success: false, error: 'Gagal membuat profil user' }
    }


    revalidatePath('/admin/users')
    return { success: true }
  } catch (error) {
    console.error('Create staff user error:', error)
    return { success: false, error: 'Terjadi kesalahan saat membuat user' }
  }
}