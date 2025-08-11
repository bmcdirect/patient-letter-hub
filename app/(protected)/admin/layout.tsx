import { redirect } from "next/navigation";
import { getCurrentUser, getAuthUrls } from "@/lib/session-manager";

interface AdminLayoutProps {
  children: React.ReactNode;
}

export default async function AdminLayout({ children }: AdminLayoutProps) {
  const user = await getCurrentUser();
  const authUrls = getAuthUrls();
  
  // Check if user exists and has ADMIN role
  if (!user) {
    console.log("❌ No user found, redirecting to login");
    redirect(authUrls.loginUrl);
  }

  if (user.role !== "ADMIN") {
    console.log("❌ User is not ADMIN, redirecting to dashboard");
    console.log("User role:", user.role, "Email:", user.email);
    redirect("/dashboard");
  }

  console.log("✅ Admin access granted for:", user.email);

  return <>{children}</>;
}
