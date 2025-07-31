import { AUTH_CONFIG } from '@/lib/auth-config.client';

// Default middleware function
function defaultMiddleware() {
  // No middleware logic needed for NextAuth
}

// Try to use Clerk middleware if enabled
let middleware = defaultMiddleware;

if (AUTH_CONFIG.useClerk) {
  try {
    const { clerkMiddleware } = require('@clerk/nextjs/server');
    middleware = clerkMiddleware();
  } catch (error) {
    console.error('Clerk middleware error:', error);
    // Fallback to default middleware
    middleware = defaultMiddleware;
  }
}

export default middleware;

export const config = {
  matcher: [
    // Skip Next.js internals and all static files, unless found in search params
    '/((?!_next|[^?]*\\.(?:html?|css|js(?!on)|jpe?g|webp|png|gif|svg|ttf|woff2?|ico|csv|docx?|xlsx?|zip|webmanifest)).*)',
    // Always run for API routes
    '/(api|trpc)(.*)',
  ],
}; 