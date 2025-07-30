import "server-only";

import { cache } from "react";
import { getServerSession } from "next-auth";
import handler from "@/auth";

export const getCurrentUser = cache(async () => {
  const session = await getServerSession(handler);
  return session?.user;
});