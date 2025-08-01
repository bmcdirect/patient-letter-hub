import { NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import { getCurrentUser } from "@/lib/session-manager";

export async function GET() {
  try {
    const { userId } = await auth();
    
    if (!userId) {
      return new NextResponse("Unauthorized", { status: 401 });
    }

    const user = await getCurrentUser();
    
    if (!user) {
      return new NextResponse("User not found", { status: 404 });
    }

    return NextResponse.json({
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
        role: user.role,
        practiceId: user.practiceId,
        practice: user.practice,
      },
    });
  } catch (error) {
    console.error("Error fetching user:", error);
    return new NextResponse("Internal Server Error", { status: 500 });
  }
}
