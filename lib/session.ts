import "server-only";

import { cache } from "react";
import { getServerSession } from "next-auth";
import handler from "@/auth";
import { prisma } from "@/lib/db";

export const getCurrentUser = cache(async () => {
  const session = await getServerSession(handler);
  
  console.log("🔍 getCurrentUser - session:", {
    hasSession: !!session,
    hasUser: !!session?.user,
    userId: session?.user?.id,
    userEmail: session?.user?.email,
    userRole: session?.user?.role
  });
  
  if (!session?.user?.id) {
    console.log("❌ No session or user ID");
    return undefined;
  }

  // Get full user data including practice information
  const user = await prisma.user.findUnique({
    where: { id: session.user.id },
    include: { 
      practice: true 
    }
  });

  console.log("🔍 getCurrentUser - database user:", {
    found: !!user,
    userId: user?.id,
    userEmail: user?.email,
    userRole: user?.role,
    practiceId: user?.practiceId
  });

  return user;
});