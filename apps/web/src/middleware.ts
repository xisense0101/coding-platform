import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'
import { createServerClient } from '@supabase/ssr'

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl
  
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

  // Refresh session if expired - this is crucial for maintaining auth on page refresh
  const { data: { session } } = await supabase.auth.getSession()

  // Protected routes that require authentication
  const protectedPaths = ['/admin', '/teacher', '/student']
  const isProtectedRoute = protectedPaths.some(path => pathname.startsWith(path))

  // Auth routes that authenticated users shouldn't access
  const authPaths = ['/auth/login', '/auth/register', '/auth/forgot-password']
  const isAuthRoute = authPaths.some(path => pathname.startsWith(path))

  // If trying to access protected route without session, redirect to login
  if (isProtectedRoute && !session) {
    const redirectUrl = new URL('/auth/login', request.url)
    redirectUrl.searchParams.set('next', pathname)
    return NextResponse.redirect(redirectUrl)
  }

  // If logged in user tries to access auth routes, redirect to appropriate dashboard
  if (isAuthRoute && session) {
    // Get user profile to determine role
    const { data: userProfile } = await supabase
      .from('users')
      .select('role')
      .eq('id', session.user.id)
      .single()

    const roleRedirects: Record<string, string> = {
      'teacher': '/teacher/dashboard',
      'admin': '/admin/dashboard',
      'student': '/student/dashboard',
      'super_admin': '/admin/dashboard'
    }

    const redirectPath = roleRedirects[userProfile?.role || 'student'] || '/student/dashboard'
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
