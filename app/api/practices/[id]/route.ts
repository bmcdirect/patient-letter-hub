import { NextRequest, NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import { prisma } from "@/lib/db";

export async function GET(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
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

    const practiceId = params.id;

    // Get practice based on user role and access
    let practice;
    if (user.role === "ADMIN") {
      // Admins can see any practice
      practice = await prisma.practice.findUnique({
        where: { id: practiceId },
        include: {
          users: {
            select: {
              id: true,
              name: true,
              email: true,
              role: true
            }
          }
        }
      });
    } else {
      // Regular users can only see their own practice
      if (user.practiceId !== practiceId) {
        return NextResponse.json({ error: "Access denied" }, { status: 403 });
      }
      
      practice = await prisma.practice.findUnique({
        where: { id: practiceId },
        include: {
          users: {
            select: {
              id: true,
              name: true,
              email: true,
              role: true
            }
          }
        }
      });
    }

    if (!practice) {
      return NextResponse.json({ error: "Practice not found" }, { status: 404 });
    }

    return NextResponse.json({ practice });
  } catch (err) {
    console.error("Error fetching practice:", err);
    return NextResponse.json({ error: "Failed to fetch practice" }, { status: 500 });
  }
} 