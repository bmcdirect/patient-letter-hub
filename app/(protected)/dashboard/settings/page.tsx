import { constructMetadata } from "@/lib/utils";
import { getCurrentUser, getAuthUrls } from "@/lib/session-manager";
import { redirect } from "next/navigation";
import { DashboardHeader } from "@/components/dashboard/header";
import { DeleteAccount } from "@/components/dashboard/delete-account";

export const metadata = constructMetadata({
  title: "Settings – SaaS Starter",
  description: "Manage your account settings.",
});

export default async function SettingsPage() {
  const user = await getCurrentUser();
  const authUrls = getAuthUrls();
  
  if (!user?.id) redirect(authUrls.loginUrl);

  return (
    <>
      <DashboardHeader
        heading="Settings"
        text="Manage your account settings and preferences."
      />
      <div className="grid gap-8">
        <DeleteAccount />
      </div>
    </>
  );
}
