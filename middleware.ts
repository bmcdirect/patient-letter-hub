// middleware.ts
import { clerkMiddleware, createRouteMatcher } from "@clerk/nextjs/server";
import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";

const isProtected = createRouteMatcher([
  "/dashboard(.*)",
  "/admin(.*)",
  "/orders(.*)",
  "/quotes(.*)",
  "/api/orders(.*)",
  "/api/quotes(.*)",
  "/api/admin(.*)",
]);

const isProfilePage = createRouteMatcher([
  "/dashboard/profile",
]);

export default clerkMiddleware(async (auth, req) => {
  const { userId } = await auth();

  if (isProtected(req) && !userId) {
    const url = new URL("/sign-in", req.url);
    url.searchParams.set("redirect_url", req.url);
    return NextResponse.redirect(url);
  }

  if (userId && (req.nextUrl.pathname.startsWith("/sign-in") || req.nextUrl.pathname.startsWith("/sign-up"))) {
    return NextResponse.redirect(new URL("/dashboard", req.url));
  }

  // Check profile completion for authenticated users accessing dashboard
  if (userId && isProtected(req) && !isProfilePage(req)) {
    try {
      const user = await prisma.user.findUnique({
        where: { clerkId: userId },
        include: { practice: true }
      });

      // If user exists but has no practice (incomplete profile), redirect to profile
      if (user && !user.practiceId) {
        return NextResponse.redirect(new URL("/dashboard/profile", req.url));
      }
    } catch (error) {
      console.error("Error checking profile completion:", error);
      // Continue if there's an error - don't block user access
    }
  }

  return NextResponse.next();
});

export const config = {
  matcher: ["/((?!.+\\.[\\w]+$|_next).*)", "/", "/(api|trpc)(.*)"],
};