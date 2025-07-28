import { NextRequest, NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/session";

export async function GET(req: NextRequest) {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json({ error: "No user found", user: null });
    }
    return NextResponse.json({ 
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
        role: user.role,
        image: user.image
      }
    });
  } catch (err) {
    return NextResponse.json({ error: "Failed to get user", details: err });
  }
} 