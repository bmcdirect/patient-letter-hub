"use server";

import { getServerSession } from "next-auth";
import handler from "@/auth";
import { prisma } from "@/lib/db";
import { userRoleSchema } from "@/lib/validations/user";
import { revalidatePath } from "next/cache";

export type FormData = {
  role: string;
};

export async function updateUserRole(userId: string, data: FormData) {
  try {
    const session = await getServerSession(handler);

    if (!session?.user || session?.user.id !== userId) {
      throw new Error("Unauthorized");
    }

    const { role } = userRoleSchema.parse(data);

    // Update the user role.
    await prisma.user.update({
      where: {
        id: userId,
      },
      data: {
        role: role,
      },
    });

    revalidatePath('/dashboard/settings');
    return { status: "success" };
  } catch (error) {
    // console.log(error)
    return { status: "error" }
  }
}
