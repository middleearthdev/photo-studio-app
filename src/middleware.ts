import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'

// Public routes that don't require authentication
const publicRoutes = [
  '/',
  '/staff/login',
  '/register',
  '/forgot-password',
  '/reset-password',
  '/studios',
  '/packages',
  '/portfolio',
  '/booking',
  '/guest',
  '/auth',
  '/api'
]

// Admin/Staff routes that require staff authentication
const staffRoutes = [
  '/admin',
  '/cs'
]

export async function middleware(req: NextRequest) {
  const { pathname } = req.nextUrl

  // Check if route is public
  const isPublicRoute = publicRoutes.some(route =>
    pathname === route || pathname.startsWith(route + '/')
  )

  // If it's a public route, allow access
  if (isPublicRoute) {
    return NextResponse.next()
  }

  // Check if it's a staff/admin route
  const isStaffRoute = staffRoutes.some(route =>
    pathname.startsWith(route)
  )

  if (isStaffRoute) {
    // Check for session cookie to determine if user is authenticated
    const sessionCookie = req.cookies.get('__Secure-studio.session_token')

    if (!sessionCookie) {
      // Redirect to staff login if no session
      const loginUrl = new URL('/staff/login', req.url)
      loginUrl.searchParams.set('redirect', pathname)
      return NextResponse.redirect(loginUrl)
    }
  }

  // For other protected routes or authenticated staff routes, continue
  return NextResponse.next()
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