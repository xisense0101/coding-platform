import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'
import { createServerClient } from '@supabase/ssr'

// Simple in-memory cache for middleware (resets on server restart)
const sessionCache = new Map<string, { session: any; userRole: string; expiresAt: number }>()
const CACHE_TTL = 5 * 60 * 1000 // 5 minutes

// Clean cache periodically
setInterval(() => {
  const now = Date.now()
  for (const [key, value] of sessionCache.entries()) {
    if (value.expiresAt < now) {
      sessionCache.delete(key)
    }
  }
}, 60 * 1000) // Clean every minute

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl
  
  // Skip middleware for static files and API routes
  if (pathname.startsWith('/_next') || pathname.startsWith('/api') || pathname.startsWith('/favicon')) {
    return NextResponse.next()
  }
  
  // Create a response object that we can modify
  let response = NextResponse.next({
    request: {
      headers: request.headers,
    },
  })

  // Create Supabase client for middleware
  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll()
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value, options }) => {
            request.cookies.set(name, value)
            response.cookies.set(name, value, options)
          })
        },
      },
    }
  )

  // Try to get session token from various Supabase cookie names
  const allCookies = request.cookies.getAll()
  const supabaseCookie = allCookies.find(cookie => 
    cookie.name.includes('sb-') && cookie.name.includes('auth-token')
  )
  const sessionToken = supabaseCookie?.value
  
  // Protected routes that require authentication
  const protectedPaths = ['/admin', '/teacher', '/student']
  const isProtectedRoute = protectedPaths.some(path => pathname.startsWith(path))

  // Auth routes that authenticated users shouldn't access
  const authPaths = ['/auth/login', '/auth/register', '/auth/forgot-password']
  const isAuthRoute = authPaths.some(path => pathname.startsWith(path))

  // Check cache first
  let session: any = null
  let userRole: string | null = null
  
  if (sessionToken) {
    const cached = sessionCache.get(sessionToken)
    if (cached && cached.expiresAt > Date.now()) {
      session = cached.session
      userRole = cached.userRole
    }
  }

  // If not in cache or no session token, fetch from Supabase
  if (!session) {
    const { data: { session: freshSession } } = await supabase.auth.getSession()
    session = freshSession

    // Fetch user role if session exists
    if (session && sessionToken) {
      const { data: userProfile } = await supabase
        .from('users')
        .select('role')
        .eq('id', session.user.id)
        .single()
      
      userRole = userProfile?.role || null
      
      // Cache the session and role
      if (userRole) {
        sessionCache.set(sessionToken, {
          session,
          userRole,
          expiresAt: Date.now() + CACHE_TTL
        })
      }
    }
  }

  // If trying to access protected route without session, redirect to login
  if (isProtectedRoute && !session) {
    const redirectUrl = new URL('/auth/login', request.url)
    redirectUrl.searchParams.set('next', pathname)
    return NextResponse.redirect(redirectUrl)
  }

  // If logged in user tries to access auth routes, redirect to appropriate dashboard
  if (isAuthRoute && session && userRole) {
    const roleRedirects: Record<string, string> = {
      'teacher': '/teacher/dashboard',
      'admin': '/admin/dashboard',
      'student': '/student/dashboard',
      'super_admin': '/admin/dashboard'
    }

    const redirectPath = roleRedirects[userRole] || '/student/dashboard'
    return NextResponse.redirect(new URL(redirectPath, request.url))
  }

  return response
}

export const config = {
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     * - public files
     */
    '/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)',
  ],
}
