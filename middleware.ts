// middleware.ts
import { clerkMiddleware, createRouteMatcher } from "@clerk/nextjs/server";
import { NextResponse } from "next/server";

const isProtected = createRouteMatcher([
  "/dashboard(.*)",
  "/admin(.*)",
  "/orders(.*)",
  "/quotes(.*)",
  "/api/orders(.*)",
  "/api/quotes(.*)",
  "/api/admin(.*)",
]);

export default clerkMiddleware(async (auth, req) => {
  const authResult = await auth();
  const { userId } = authResult;

  // Enhanced debug logging for session persistence investigation
  const cookies = req.headers.get('cookie') || '';
  const clerkCookies = cookies.split(';').filter(cookie => 
    cookie.includes('__session') || 
    cookie.includes('__clerk') || 
    cookie.includes('clerk')
  );

  console.log("🔍 Enhanced Middleware Debug:", {
    url: req.url,
    pathname: req.nextUrl.pathname,
    userId: userId,
    userIdType: typeof userId,
    userIdExists: !!userId,
    isProtected: isProtected(req),
    userAgent: req.headers.get('user-agent')?.substring(0, 50) + '...',
    timestamp: new Date().toISOString(),
    // Full auth result for debugging
    authResult: authResult,
    // Session cookies analysis
    allCookies: cookies ? cookies.split(';').length : 0,
    clerkCookies: clerkCookies,
    clerkCookieCount: clerkCookies.length,
    // Clerk-specific headers
    clerkHeaders: {
      'clerk-auth-message': req.headers.get('clerk-auth-message'),
      'clerk-auth-reason': req.headers.get('clerk-auth-reason'),
      'clerk-auth-status': req.headers.get('clerk-auth-status'),
    }
  });

  if (isProtected(req) && !userId) {
    console.log("🚫 Middleware - Redirecting to sign-in:", {
      reason: "Protected route without userId",
      originalUrl: req.url,
      redirectUrl: `/sign-in?redirect_url=${encodeURIComponent(req.url)}`
    });
    const url = new URL("/sign-in", req.url);
    url.searchParams.set("redirect_url", req.url);
    return NextResponse.redirect(url);
  }

  if (userId && (req.nextUrl.pathname.startsWith("/sign-in") || req.nextUrl.pathname.startsWith("/sign-up"))) {
    console.log("🔄 Middleware - Redirecting authenticated user to dashboard:", {
      userId: userId,
      from: req.nextUrl.pathname,
      to: "/dashboard"
    });
    return NextResponse.redirect(new URL("/dashboard", req.url));
  }

  console.log("✅ Middleware - Allowing request to proceed:", {
    url: req.url,
    userId: userId,
    isProtected: isProtected(req)
  });

  return NextResponse.next();
});

export const config = {
  matcher: ["/((?!.+\\.[\\w]+$|_next).*)", "/", "/(api|trpc)(.*)"],
};