import { createClient } from '@/lib/supabase/server'
import { NextRequest, NextResponse } from 'next/server'
import { cookies } from 'next/headers'

export async function GET(request: NextRequest) {
  const requestUrl = new URL(request.url)
  const code = requestUrl.searchParams.get('code')

  if (code) {

    const supabase = await createClient()

    try {
      // Exchange the code for a session
      const { data: { session }, error: sessionError } = await supabase.auth.exchangeCodeForSession(code)

      if (sessionError) {
        console.error('Session exchange error:', sessionError)
        return NextResponse.redirect(`${requestUrl.origin}/staff/login?error=auth_error`)
      }

      if (session?.user) {
        // Check if user profile exists
        const { data: existingProfile, error: profileError } = await supabase
          .from('user_profiles')
          .select('*')
          .eq('id', session.user.id)
          .single()

        if (profileError && profileError.code !== 'PGRST116') { // PGRST116 = no rows returned
          console.error('Profile check error:', profileError)
        }

        // If no profile exists, create one (for OAuth users)
        if (!existingProfile) {
          const { error: createError } = await supabase
            .from('user_profiles')
            .insert({
              id: session.user.id,
              full_name: session.user.user_metadata?.full_name ||
                session.user.user_metadata?.name ||
                null,
              role: 'customer',
              is_active: true
            })

          if (createError) {
            console.error('Profile creation error:', createError)
            // Continue anyway, trigger might have created the profile
          }
        }

        // Update last login
        await supabase
          .from('user_profiles')
          .update({ last_login: new Date().toISOString() })
          .eq('id', session.user.id)

        // Determine redirect based on user role
        const { data: profile } = await supabase
          .from('user_profiles')
          .select('role')
          .eq('id', session.user.id)
          .single()

        let redirectPath = '/'
        if (profile?.role === 'admin') {
          redirectPath = '/admin'
        } else if (profile?.role === 'cs') {
          redirectPath = '/customer-service'
        }

        // Set a cookie to indicate that we need to refresh the auth store
        const cookieStore = await cookies()
        cookieStore.set('auth-refresh-needed', 'true', {
          maxAge: 60, // 1 minute
          httpOnly: false,
          path: '/',
        })

        return NextResponse.redirect(`${requestUrl.origin}${redirectPath}`)
      }
    } catch (error) {
      console.error('OAuth callback error:', error)
      return NextResponse.redirect(`${requestUrl.origin}/staff/login?error=callback_error`)
    }
  }

  // If no code, redirect to login with error
  return NextResponse.redirect(`${requestUrl.origin}/staff/login?error=no_code`)
}