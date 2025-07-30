"use server";

import { z } from "zod";
import { getServerSession } from "next-auth";
import handler from "@/auth";
import { prisma } from "@/lib/db";
import { userNameSchema } from "@/lib/validations/user";

const routeContextSchema = z.object({
  params: z.object({
    userId: z.string(),
  }),
});

export async function PATCH(
  req: Request,
  context: z.infer<typeof routeContextSchema>
) {
  try {
    // Validate the request context.
    const { params } = routeContextSchema.parse(context);

    // Ensure user is authenticated and authorized.
    const session = await getServerSession(handler);
    if (!session?.user?.email) {
      return new Response("Unauthorized", { status: 401 });
    }

    // Get the request body and validate it.
    const json = await req.json();
    const body = userNameSchema.parse(json);

    // Update the user.
    await prisma.user.update({
      where: {
        id: params.userId,
      },
      data: {
        name: body.name,
      },
    });

    return new Response(null, { status: 200 });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return new Response(JSON.stringify(error.issues), { status: 422 });
    }

    return new Response(null, { status: 500 });
  }
}