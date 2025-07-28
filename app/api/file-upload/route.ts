import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/auth";
import { prisma } from "@/lib/db";
import { randomUUID } from "crypto";
import path from "path";
import fs from "fs/promises";

export const runtime = "nodejs";

export async function POST(req: NextRequest) {
  // 1. Authenticate user
  const session = await auth();
  if (!session || !session.user?.email) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  // 2. Parse multipart form data
  const formData = await req.formData();
  const files: File[] = [];
  Array.from(formData.keys()).forEach((key) => {
    const value = formData.get(key);
    if (value instanceof File) {
      files.push(value);
    }
  });
  if (files.length === 0) {
    return NextResponse.json({ error: "No files uploaded" }, { status: 400 });
  }

  // 3. Get user and practice from DB
  const user = await prisma.user.findUnique({
    where: { email: session.user.email },
    include: { practice: true },
  });
  if (!user || !user.practiceId) {
    return NextResponse.json({ error: "User or practice not found" }, { status: 400 });
  }

  // 4. Save files to disk (or S3, etc.) and metadata to DB
  const uploadDir = path.join(process.cwd(), "public", "uploads");
  await fs.mkdir(uploadDir, { recursive: true });
  const savedFiles: any[] = [];
  for (const file of files) {
    const fileId = randomUUID();
    const ext = path.extname(file.name);
    const fileName = `${fileId}${ext}`;
    const filePath = path.join(uploadDir, fileName);
    const arrayBuffer = await file.arrayBuffer();
    await fs.writeFile(filePath, Buffer.from(arrayBuffer));
    // Save metadata to DB
    const dbFile = await prisma.orderFiles.create({
      data: {
        fileName: file.name,
        filePath: `/uploads/${fileName}`,
        fileType: file.type,
        uploadedBy: user.id,
        orderId: "", // TODO: Set correct orderId when available
      },
    });
    savedFiles.push(dbFile);
  }

  return NextResponse.json({ files: savedFiles });
} 