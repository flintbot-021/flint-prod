import { createServerClient } from '@supabase/ssr'
import { NextResponse, type NextRequest } from 'next/server'

export async function middleware(request: NextRequest) {
  const url = request.nextUrl.clone()
  
  // Debug logging for password reset flows
  if (url.searchParams.get('type') === 'recovery' || url.searchParams.get('token')) {
    console.log('Middleware - Password reset detected:', {
      pathname: url.pathname,
      searchParams: Object.fromEntries(url.searchParams.entries()),
      fullUrl: request.url
    })
  }

  let supabaseResponse = NextResponse.next({
    request,
  })

  // Define auth routes that need special handling
  const authRoutes = ['/auth/login', '/auth/signup', '/auth/sign-up']
  const publicRoutes = ['/', '/c/'] // Public campaign routes
  
  // Check if current path is an auth route
  const isAuthRoute = authRoutes.some(route => 
    url.pathname.startsWith(route)
  )
  
  // Check if current path is a public route
  const isPublicRoute = publicRoutes.some(route => 
    url.pathname === route || url.pathname.startsWith(route)
  )

  // Special handling for password reset flows - don't redirect to dashboard
  if (url.searchParams.get('type') === 'recovery' || url.searchParams.get('token')) {
    console.log('Middleware - Allowing password reset flow to continue')
    return supabaseResponse
  }

  // Only check auth for auth routes and public routes that might need redirects
  if (isAuthRoute || isPublicRoute) {
    const supabase = createServerClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      {
        cookies: {
          get(name: string) {
            return request.cookies.get(name)?.value
          },
          set(name: string, value: string, options: any) {
            request.cookies.set({
              name,
              value,
              ...options,
            })
            supabaseResponse = NextResponse.next({
              request: {
                headers: request.headers,
              },
            })
            supabaseResponse.cookies.set({
              name,
              value,
              ...options,
            })
          },
          remove(name: string, options: any) {
            request.cookies.set({
              name,
              value: '',
              ...options,
            })
            supabaseResponse = NextResponse.next({
              request: {
                headers: request.headers,
              },
            })
            supabaseResponse.cookies.set({
              name,
              value: '',
              ...options,
            })
          },
        },
      }
    )

    // Get the current session only when needed
    const {
      data: { user },
    } = await supabase.auth.getUser()

    // If user is authenticated and trying to access auth routes, redirect to dashboard
    if (user && isAuthRoute) {
      return NextResponse.redirect(new URL('/dashboard', request.url))
    }
  }

  // For protected routes, let the client-side handle auth checks
  // This eliminates the middleware bottleneck for authenticated users
  return supabaseResponse
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
