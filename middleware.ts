import { clerkMiddleware, createRouteMatcher } from '@clerk/nextjs/server'
import { NextResponse } from 'next/server'

const isPublicRoute = createRouteMatcher([
  '/sign-in(.*)', 
  '/sign-up(.*)', 
  '/',
  '/api/webhooks/clerk'
])

export default clerkMiddleware(async (auth, req) => {
  const { userId } = await auth()
  
  console.log('🔍 Middleware - Route:', req.nextUrl.pathname, '| UserId:', userId)
  
  // If it's a protected route and no user, redirect to sign-in
  if (!isPublicRoute(req) && !userId) {
    console.log('❌ Middleware - Redirecting to sign-in (no userId)')
    return NextResponse.redirect(new URL('/sign-in', req.url))
  }
  
  // If user is authenticated and trying to access auth pages, redirect to dashboard
  if (userId && (req.nextUrl.pathname.startsWith('/sign-in') || req.nextUrl.pathname.startsWith('/sign-up'))) {
    console.log('✅ Middleware - Redirecting to dashboard (user authenticated)')
    return NextResponse.redirect(new URL('/dashboard', req.url))
  }
  
  console.log('✅ Middleware - Allowing request to proceed')
})

export const config = {
  matcher: [
    '/((?!_next|[^?]*\\.(?:html?|css|js(?!on)|jpe?g|webp|png|gif|svg|ttf|woff2?|ico|csv|docx?|xlsx?|zip|webmanifest)).*)',
    '/(api|trpc)(.*)',
  ],
}