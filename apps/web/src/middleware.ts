import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'
import { createServerClient } from '@supabase/ssr'

// Simple in-memory cache for middleware (resets on server restart)
const sessionCache = new Map<string, { session: any; userRole: string; expiresAt: number }>()
const orgCache = new Map<string, { org: any; expiresAt: number }>()
const CACHE_TTL = 5 * 60 * 1000 // 5 minutes
const ORG_CACHE_TTL = 10 * 60 * 1000 // 10 minutes for organizations

// Reserved subdomains that should not be used for organizations
const RESERVED_SUBDOMAINS = [
  'www', 'api', 'admin', 'app', 'mail', 'smtp', 
  'ftp', 'staging', 'dev', 'test', 'dashboard',
  'blog', 'docs', 'support', 'status', 'cdn'
]

// Clean cache periodically
setInterval(() => {
  const now = Date.now()
  for (const [key, value] of sessionCache.entries()) {
    if (value.expiresAt < now) {
      sessionCache.delete(key)
    }
  }
  for (const [key, value] of orgCache.entries()) {
    if (value.expiresAt < now) {
      orgCache.delete(key)
    }
  }
}, 60 * 1000) // Clean every minute

// Helper function to extract subdomain from hostname
function extractSubdomain(hostname: string): string | null {
  // Handle localhost, IP addresses, and ngrok tunnels
  if (hostname.includes('localhost') || /^\d+\.\d+\.\d+\.\d+/.test(hostname) || hostname.includes('ngrok')) {
    return null
  }
  
  const parts = hostname.split('.')
  
  // Need at least subdomain.domain.tld (3 parts)
  if (parts.length >= 3) {
    const subdomain = parts[0]
    // Don't treat 'www' or 'blockscode' as organization subdomain
    if (subdomain === 'www' || subdomain === 'blockscode') {
      return null
    }
    return subdomain
  }
  
  return null
}

// Helper function to get organization by subdomain
async function getOrganizationBySubdomain(supabase: any, subdomain: string | null): Promise<any> {
  if (!subdomain || RESERVED_SUBDOMAINS.includes(subdomain.toLowerCase())) {
    return null
  }
  
  // Check cache first
  const cached = orgCache.get(subdomain)
  if (cached && cached.expiresAt > Date.now()) {
    return cached.org
  }
  
  // Fetch from database
  const { data, error } = await supabase
    .from('organizations')
    .select('id, name, logo_url, subdomain, primary_color, secondary_color, is_active')
    .eq('subdomain', subdomain)
    .eq('is_active', true)
    .single()
  
  if (error || !data) {
    return null
  }
  
  // Cache the organization
  orgCache.set(subdomain, {
    org: data,
    expiresAt: Date.now() + ORG_CACHE_TTL
  })
  
  return data
}

export async function middleware(request: NextRequest) {
  const { pathname, searchParams } = request.nextUrl
  const hostname = request.headers.get('host') || ''
  
  // Get client IP
  const clientIp = request.ip || request.headers.get('x-forwarded-for')?.split(',')[0] || '127.0.0.1'
  
  // Skip middleware for static files and API routes
  if (pathname.startsWith('/_next') || pathname.startsWith('/favicon')) {
    return NextResponse.next()
  }
  
  // For API routes, we only want to inject the client IP and skip other checks
  if (pathname.startsWith('/api')) {
    const requestHeaders = new Headers(request.headers)
    requestHeaders.set('x-client-ip', clientIp)
    return NextResponse.next({
      request: {
        headers: requestHeaders,
      },
    })
  }
  
  // Create a response object that we can modify
  const requestHeaders = new Headers(request.headers)
  requestHeaders.set('x-client-ip', clientIp)

  let response = NextResponse.next({
    request: {
      headers: requestHeaders,
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

  // Extract subdomain from hostname
  let subdomain = extractSubdomain(hostname)
  
  // For local development: fallback to ?org= query parameter
  if (!subdomain && (hostname.includes('localhost') || hostname.includes('127.0.0.1') || hostname.includes('ngrok'))) {
    subdomain = searchParams.get('org')
  }
  
  // Get organization by subdomain if present
  let organization: any = null
  if (subdomain) {
    organization = await getOrganizationBySubdomain(supabase, subdomain)
    
    // If subdomain is provided but organization not found, redirect to error page
    if (!organization && !pathname.startsWith('/organization-not-found')) {
      return NextResponse.redirect(new URL('/organization-not-found', request.url))
    }
    
    // Inject organization context into request headers
    if (organization) {
      const requestHeaders = new Headers(request.headers)
      requestHeaders.set('x-organization-id', organization.id)
      requestHeaders.set('x-organization-name', organization.name)
      requestHeaders.set('x-organization-logo', organization.logo_url || '')
      requestHeaders.set('x-organization-subdomain', subdomain)
      requestHeaders.set('x-organization-primary-color', organization.primary_color || '#3B82F6')
      requestHeaders.set('x-organization-secondary-color', organization.secondary_color || '#1E40AF')
      
      response = NextResponse.next({
        request: {
          headers: requestHeaders,
        },
      })
      
      // Also set response headers for client-side access
      response.headers.set('x-organization-id', organization.id)
      response.headers.set('x-organization-name', organization.name)
      response.headers.set('x-organization-logo', organization.logo_url || '')
    }
  }

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
  let userOrgId: string | null = null
  
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

    // Fetch user role and organization if session exists
    if (session && sessionToken) {
      const { data: userProfile } = await supabase
        .from('users')
        .select('role, organization_id')
        .eq('id', session.user.id)
        .single()
      
      userRole = userProfile?.role || null
      userOrgId = userProfile?.organization_id || null
      
      // CRITICAL: Validate user belongs to the organization subdomain
      if (organization && userOrgId && userOrgId !== organization.id) {
        // User is logged in but trying to access a different organization's subdomain
        // Sign them out immediately to prevent unauthorized access
        await supabase.auth.signOut()
        
        // Clear session cache
        if (sessionToken) {
          sessionCache.delete(sessionToken)
        }
        
        // Redirect to unauthorized page
        if (!pathname.startsWith('/unauthorized')) {
          return NextResponse.redirect(new URL('/unauthorized', request.url))
        }
      }
      
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
