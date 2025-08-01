import { clerkMiddleware } from '@clerk/nextjs/server';

export default clerkMiddleware({
  // Public routes that don't require authentication
  publicRoutes: [
    '/',
    '/sign-in',
    '/sign-up',
    '/api/webhooks/clerk',
    '/api/webhooks/stripe',
    '/api/og',
    '/blog(.*)',
    '/docs(.*)',
    '/guides(.*)',
    '/privacy',
    '/terms',
    '/pricing',
  ],
  ignoredRoutes: [
    '/api/webhooks/clerk',
    '/api/webhooks/stripe',
  ],
});

export const config = {
  matcher: [
    '/((?!_next|[^?]*\\.(?:html?|css|js(?!on)|jpe?g|webp|png|gif|svg|ttf|woff2?|ico|csv|docx?|xlsx?|zip|webmanifest)).*)',
    '/(api|trpc)(.*)',
  ],
}; 