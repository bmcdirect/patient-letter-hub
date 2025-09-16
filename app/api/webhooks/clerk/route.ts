// app/api/webhooks/clerk/route.ts
import { NextResponse } from "next/server";
import { headers } from "next/headers";
import { Webhook, WebhookRequiredHeaders } from "svix";
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

export async function POST(req: Request) {
  const body = await req.text();

  // 1) Verify Svix signature
  const headerList = headers();
  const svix_id = headerList.get("svix-id");
  const svix_timestamp = headerList.get("svix-timestamp");
  const svix_signature = headerList.get("svix-signature");

  if (!svix_id || !svix_timestamp || !svix_signature) {
    return new NextResponse("Missing Svix signature headers", { status: 400 });
  }

  const secret = process.env.CLERK_WEBHOOK_SECRET || "";
  if (!secret) {
    return new NextResponse("Missing CLERK_WEBHOOK_SECRET", { status: 500 });
  }

  let evt: any;
  try {
    const wh = new Webhook(secret);
    evt = wh.verify(
      body,
      {
        "svix-id": svix_id,
        "svix-timestamp": svix_timestamp,
        "svix-signature": svix_signature,
      } as WebhookRequiredHeaders
    );
  } catch (err) {
    return new NextResponse("Invalid signature", { status: 400 });
  }

  // 2) Idempotency: short-circuit if already processed
  try {
    await prisma.webhookEvent.create({
      data: { id: svix_id, processedAt: new Date() },
    });
  } catch {
    // unique violation -> already processed
    return NextResponse.json({ ok: true, deduped: true });
  }

  // 3) Handle events
  const type = evt.type as string;

  if (type === "user.created" || type === "user.updated") {
    const user = evt.data;
    const clerkId = user.id as string;
    const email = (user.email_addresses?.[0]?.email_address ?? "").toLowerCase();
    const firstName = user.first_name ?? "";
    const lastName = user.last_name ?? "";
    const imageUrl = user.image_url ?? "";

    await prisma.user.upsert({
      where: { clerkId }, // your User model must have unique clerkId
      update: {
        email,
        name: `${firstName} ${lastName}`.trim(),
        image: imageUrl,
        updatedAt: new Date(),
      },
      create: {
        clerkId,
        email,
        name: `${firstName} ${lastName}`.trim(),
        image: imageUrl,
        role: "USER",
      },
    });
  }

  if (type === "user.deleted") {
    const clerkId = evt.data?.id as string | undefined;
    if (clerkId) {
      await prisma.user.updateMany({
        where: { clerkId },
        data: { updatedAt: new Date() }, // soft delete by updating timestamp
      });
    }
  }

  return NextResponse.json({ ok: true });
}