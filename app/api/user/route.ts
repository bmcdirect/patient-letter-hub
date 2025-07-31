import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import handler from "@/auth";
import { prisma } from "@/lib/db";
import type { Session } from "next-auth";

export async function GET() {
  const session = await getServerSession(handler) as Session | null;
  
  if (!session?.user?.email) {
    return NextResponse.json({ user: null }, { status: 401 });
  }
  
  const user = await prisma.user.findUnique({
    where: { email: session.user.email },
  });
  
  return NextResponse.json({ user });
}
