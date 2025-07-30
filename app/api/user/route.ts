import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import handler from "@/auth";
import { prisma } from "@/lib/db";

export async function GET() {
  const session = await getServerSession(handler);
  if (!session?.user?.email) {
    return NextResponse.json({ user: null }, { status: 401 });
  }
  const user = await prisma.user.findUnique({
    where: { email: session.user.email },
  });
  return NextResponse.json({ user });
}
