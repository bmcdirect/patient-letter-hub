import { redirect } from "next/navigation";
import { getCurrentUser, getAuthUrls } from "@/lib/session-manager";

interface AdminLayoutProps {
  children: React.ReactNode;
}

export default async function AdminLayout({ children }: AdminLayoutProps) {
  const user = await getCurrentUser();
  const authUrls = getAuthUrls();
  
  if (!user || user.role !== "ADMIN") redirect(authUrls.loginUrl);

  return <>{children}</>;
}
