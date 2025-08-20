import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { auth } from "@clerk/nextjs/server";

export async function GET(req: NextRequest) {
  try {
    // Get the current user's Clerk session
    const { userId, orgId } = await auth();
    
    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Get the user from our database to check their role
    const user = await prisma.user.findUnique({
      where: { clerkId: userId },
      include: { practice: true }
    });

    if (!user) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    let practices;
    
    if (user.role === 'ADMIN') {
      // Super admin can see all practices
      practices = await prisma.practice.findMany({
        orderBy: { createdAt: "desc" },
      });
    } else {
      // Regular users can only see practices from their organization
      if (orgId) {
        practices = await prisma.practice.findMany({
          where: { organizationId: orgId },
          orderBy: { createdAt: "desc" },
        });
      } else {
        // Fallback: user can only see their assigned practice
        practices = user.practiceId ? [user.practice] : [];
      }
    }

    return NextResponse.json({ practices });
  } catch (err) {
    console.error('Error fetching practices:', err);
    return NextResponse.json({ error: "Failed to fetch practices" }, { status: 500 });
  }
} 