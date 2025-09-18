import { NextResponse } from "next/server";
import { PrismaClient } from "@prisma/client";
const prisma = new PrismaClient();

export async function GET() {
  try {
    const [row] = await prisma.$queryRaw<{ database_name: string }[]>`SELECT current_database() AS database_name`;
    const users = await prisma.user.count();
    const practices = await prisma.practice.count();
    return NextResponse.json({ database: row?.database_name, counts: { users, practices } });
  } catch (e: any) {
    return NextResponse.json({ error: e?.message ?? String(e) }, { status: 500 });
  }
}
