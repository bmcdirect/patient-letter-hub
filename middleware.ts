import { clerkMiddleware, createRouteMatcher } from "@clerk/nextjs/server"
import { NextResponse } from "next/server"

const isProtectedRoute = createRouteMatcher([
  '/dashboard(.*)',
  '/admin(.*)',
  '/orders(.*)',
  '/quotes(.*)',
  '/api/orders(.*)',
  '/api/quotes(.*)',
  '/api/admin(.*)',
])

const isPublicRoute = createRouteMatcher([
  '/',
  '/sign-in(.*)',
  '/sign-up(.*)',
])

export default clerkMiddleware((auth, req) => {
  // Protect routes that require authentication
  if (isProtectedRoute(req)) {
    auth().protect()
  }
  
  // Redirect authenticated users away from auth pages
  if (auth().userId && (req.nextUrl.pathname.startsWith('/sign-in') || req.nextUrl.pathname.startsWith('/sign-up'))) {
    return NextResponse.redirect(new URL('/dashboard', req.url))
  }
})

export const config = {
  matcher: ['/((?!.+\\.[\\w]+$|_next).*)', '/', '/(api|trpc)(.*)'],
}