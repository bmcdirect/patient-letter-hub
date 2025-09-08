import { NextRequest, NextResponse } from "next/server"
import { auth } from "@clerk/nextjs/server"
import { prisma } from "@/lib/db"

export async function GET(request: NextRequest) {
  try {
    const { userId } = auth()

    if (!userId) {
      return NextResponse.json({ user: null }, { status: 401 })
    }

    const user = await prisma.user.findUnique({
      where: {
        clerkId: userId
      },
      select: {
        id: true,
        clerkId: true,
        email: true,
        name: true,
        role: true,
        createdAt: true,
        updatedAt: true
      }
    })

    if (!user) {
      console.warn(`User ${userId} exists in Clerk but not in database`)
      return NextResponse.json({ 
        user: null, 
        error: "User not found in database" 
      }, { status: 404 })
    }

    return NextResponse.json({ user })
  } catch (error) {
    console.error("Error fetching current user:", error)
    return NextResponse.json({ 
      user: null, 
      error: "Internal server error" 
    }, { status: 500 })
  }
}
