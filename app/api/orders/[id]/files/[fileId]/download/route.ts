import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import handler from "@/auth";
import { prisma } from "@/lib/db";
import { readFile } from "fs/promises";
import { join } from "path";

export async function GET(
  req: NextRequest,
  { params }: { params: { id: string; fileId: string } }
) {
  try {
    const session = await getServerSession(handler);
    if (!session?.user?.email) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const file = await prisma.orderFiles.findUnique({
      where: { id: params.fileId },
      include: { order: true }
    });

    if (!file) {
      return NextResponse.json({ error: "File not found" }, { status: 404 });
    }

    // Check permissions (admin or order owner)
    if (file.order.userId !== session.user.id && session.user.role !== "ADMIN") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 403 });
    }

    const filePath = join(process.cwd(), file.filePath);
    const fileBuffer = await readFile(filePath);

    return new NextResponse(fileBuffer, {
      headers: {
        "Content-Type": "application/octet-stream",
        "Content-Disposition": `attachment; filename="${file.fileName}"`,
      },
    });
  } catch (error) {
    return NextResponse.json(
      { error: "Failed to download file" },
      { status: 500 }
    );
  }
} 