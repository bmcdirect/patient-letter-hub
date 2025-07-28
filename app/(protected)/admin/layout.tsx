import { notFound, redirect } from "next/navigation";
import { UserRole } from "@prisma/client";

import { getCurrentUser } from "@/lib/session";

interface ProtectedLayoutProps {
  children: React.ReactNode;
}

export default async function Dashboard({ children }: ProtectedLayoutProps) {
  const user = await getCurrentUser();
  // Temporarily bypass admin check for testing
  // if (!user || user.role !== "ADMIN") redirect("/login");
  if (!user) redirect("/login");

  return <>{children}</>;
}
