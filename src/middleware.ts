import { createMiddlewareClient } from '@supabase/auth-helpers-nextjs'
import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'
import type { Database } from '@/lib/supabase'
import { createServerClient } from '@supabase/ssr'

// Define protected routes by role
const protectedRoutes = {
  admin: ['/admin'],
  cs: ['/cs'],
  customer: ['/profile', '/bookings', '/history', '/dashboard']
}

// Public routes that don't require authentication
const publicRoutes = [
  '/',
  '/login',
  '/staff/login',
  '/register',
  '/forgot-password',
  '/reset-password',
  '/studios',
  '/packages',
  '/portfolio',
  '/booking',
  '/guest',
  '/auth/callback',
  '/api'
]

export async function middleware(req: NextRequest) {
  const res = NextResponse.next()


  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return req.cookies.getAll()
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value, options }) => {
            req.cookies.set(name, value)
            res.cookies.set(name, value, options)
          })
        },
      },
    }
  )

  // Refresh session jika expired
  const {
    data: { user },
  } = await supabase.auth.getUser()


  const { pathname } = req.nextUrl

  // Check if route is public
  const isPublicRoute = publicRoutes.some(route =>
    pathname === route || pathname.startsWith(route + '/')
  )

  // If it's a public route, allow access
  if (isPublicRoute) {
    return res
  }

  // If no session and trying to access protected route, redirect to login
  if (!user) {
    const redirectUrl = new URL('/login', req.url)
    redirectUrl.searchParams.set('redirectTo', pathname)
    return NextResponse.redirect(redirectUrl)
  }

  // Get user profile to check role
  const { data: profile } = await supabase
    .from('user_profiles')
    .select('role, studio_id, is_active')
    .eq('id', user.id)
    .single()

  // If no profile or inactive user, redirect to login
  if (!profile || !profile.is_active) {
    const redirectUrl = new URL('/login', req.url)
    redirectUrl.searchParams.set('error', 'Account inactive or not found')
    return NextResponse.redirect(redirectUrl)
  }

  // Check role-based access
  const userRole = profile.role

  // Admin routes
  if (pathname.startsWith('/admin')) {
    if (userRole !== 'admin') {
      return NextResponse.redirect(new URL('/unauthorized', req.url))
    }
  }


  // Customer Service routes
  if (pathname.startsWith('/cs')) {
    if (userRole !== 'cs' && userRole !== 'admin') {
      return NextResponse.redirect(new URL('/unauthorized', req.url))
    }
  }

  // Customer-only routes
  if (protectedRoutes.customer.some(route => pathname.startsWith(route))) {
    if (userRole !== 'customer') {
      return NextResponse.redirect(new URL('/unauthorized', req.url))
    }
  }

  // Redirect authenticated users away from auth pages
  if (user && (pathname === '/login' || pathname === '/staff/login' || pathname === '/register')) {
    if (userRole === 'admin') {
      return NextResponse.redirect(new URL('/admin/dashboard', req.url))
    } else if (userRole === 'cs') {
      return NextResponse.redirect(new URL('/cs', req.url))
    } else {
      return NextResponse.redirect(new URL('/dashboard', req.url))
    }
  }

  return res
}

export const config = {
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     * - public folder
     */
    '/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)',
  ],
}