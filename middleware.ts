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

export default clerkMiddleware((auth, req) => {
  // Redirect unauthenticated users to sign-in for protected routes
  if (isProtectedRoute(req) && !auth().userId) {
    return NextResponse.redirect(new URL('/sign-in', req.url))
  }
  
  // Redirect authenticated users away from auth pages
  if (auth().userId && (req.nextUrl.pathname.startsWith('/sign-in') || req.nextUrl.pathname.startsWith('/sign-up'))) {
    return NextResponse.redirect(new URL('/dashboard', req.url))
  }
})

export const config = {
  matcher: ['/((?!.+\\.[\\w]+$|_next).*)', '/', '/(api|trpc)(.*)'],
}