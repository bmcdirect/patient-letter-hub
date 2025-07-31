import { redirect } from "next/navigation";
import { getCurrentUser } from "@/lib/session-manager";
import { AUTH_CONFIG } from "@/lib/auth-config.client";

interface AuthLayoutProps {
  children: React.ReactNode;
}

export default async function AuthLayout({ children }: AuthLayoutProps) {
  if (AUTH_CONFIG.useClerk) {
    // For Clerk, we don't need to check authentication here
    // Clerk middleware will handle protected routes
    console.log("🔧 Using Clerk authentication");
    return <div className="min-h-screen">{children}</div>;
  }

  // NextAuth authentication check
  const user = await getCurrentUser();
  
  console.log("🔍 AuthLayout - getCurrentUser result:", {
    hasUser: !!user,
    userId: user?.id,
    userEmail: user?.email,
    userRole: user?.role,
    userPracticeId: user?.practiceId
  });

  if (user) {
    console.log("✅ User found, redirecting to:", user.role === "ADMIN" ? "/admin" : "/dashboard");
    if (user.role === "ADMIN") redirect("/admin");
    redirect("/dashboard");
  }

  console.log("❌ No user found, showing login page");
  return <div className="min-h-screen">{children}</div>;
}
