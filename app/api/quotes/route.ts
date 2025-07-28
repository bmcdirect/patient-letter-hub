import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";

export async function POST(req: NextRequest) {
  // TEMP: Bypass auth for testing
  // const session = await auth();
  // if (!session || !session.user?.email) {
  //   return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  // }

  // Use a test user for all actions
  const user = await prisma.user.findFirst();
  if (!user) {
    return NextResponse.json({ error: "User not found" }, { status: 404 });
  }

  const data = await req.json();
  if (!data.practiceId) {
    return NextResponse.json({ error: "Practice is required" }, { status: 400 });
  }

  // Create the quote
  const quote = await prisma.quotes.create({
    data: {
      practiceId: String(data.practiceId),
      userId: user.id,
      quoteNumber: `Q-${Date.now()}`,
      purchaseOrder: data.purchaseOrder ? String(data.purchaseOrder) : undefined,
      costCenter: data.costCenter ? String(data.costCenter) : undefined,
      subject: data.subject ? String(data.subject) : undefined,
      estimatedRecipients: typeof data.estimatedRecipients === 'number' ? data.estimatedRecipients : undefined,
      colorMode: data.colorMode ? String(data.colorMode) : undefined,
      dataCleansing: typeof data.dataCleansing === 'boolean' ? data.dataCleansing : undefined,
      ncoaUpdate: typeof data.ncoaUpdate === 'boolean' ? data.ncoaUpdate : undefined,
      firstClassPostage: typeof data.firstClassPostage === 'boolean' ? data.firstClassPostage : undefined,
      notes: data.notes ? String(data.notes) : undefined,
      status: "pending",
      totalCost: typeof data.totalCost === 'number' ? data.totalCost : 0,
    },
  });

  return NextResponse.json({ quote });
}

export async function GET(req: NextRequest) {
  // TEMP: Bypass auth for testing
  // if (process.env.NODE_ENV === "development") {
    const quotes = await prisma.quotes.findMany({
      orderBy: { createdAt: "desc" },
    });
    return NextResponse.json({ quotes });
  // }

  // const session = await auth();
  // if (!session || !session.user?.email) {
  //   return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  // }

  // const user = await prisma.user.findUnique({
  //   where: { email: session.user.email },
  // });
  // if (!user) {
  //   return NextResponse.json({ error: "User not found" }, { status: 404 });
  // }

  // // Get all quotes for the user (optionally filter by practice)
  // const quotes = await prisma.quotes.findMany({
  //   where: {
  //     userId: user.id,
  //   },
  //   orderBy: { createdAt: "desc" },
  // });

  // return NextResponse.json({ quotes });
} 