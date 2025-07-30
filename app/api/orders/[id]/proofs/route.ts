import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import handler from "@/auth";
import { prisma } from "@/lib/db";

export async function POST(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(handler);
    if (!session?.user?.email) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { proofUrl } = await req.json();

    const order = await prisma.order.update({
      where: { id: params.id },
      data: { proofUrl },
    });

    return NextResponse.json({ order });
  } catch (error) {
    return NextResponse.json(
      { error: "Failed to update proof" },
      { status: 500 }
    );
  }
} 