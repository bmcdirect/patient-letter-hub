import { NextRequest, NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import { prisma } from "@/lib/db";

export async function GET(req: NextRequest) {
  try {
    const { userId } = await auth();
    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Get the user from the database
    const user = await prisma.user.findUnique({
      where: { clerkId: userId }
    });

    if (!user) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    // Get practices based on user role
    let practices;
    if (user.role === "ADMIN") {
      // Admins can see all practices
      practices = await prisma.practice.findMany({
        orderBy: { createdAt: "desc" },
      });
    } else {
      // Regular users can only see their own practice
      if (user.practiceId) {
        const practice = await prisma.practice.findUnique({
          where: { id: user.practiceId },
        });
        practices = practice ? [practice] : [];
      } else {
        // User has no practice assigned
        practices = [];
      }
    }

    return NextResponse.json({ practices });
  } catch (err) {
    console.error("Error fetching practices:", err);
    return NextResponse.json({ error: "Failed to fetch practices" }, { status: 500 });
  }
} 