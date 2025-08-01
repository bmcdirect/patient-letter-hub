import { constructMetadata } from "@/lib/utils";
import { getCurrentUser, getAuthUrls } from "@/lib/session-manager";
import { redirect } from "next/navigation";
import { BillingForm } from "@/components/forms/billing-form";

export const metadata = constructMetadata({
  title: "Billing – SaaS Starter",
  description: "Manage your billing and subscription.",
});

export default async function BillingPage() {
  const user = await getCurrentUser();
  const authUrls = getAuthUrls();
  
  if (!user) redirect(authUrls.loginUrl);

  return (
    <div className="max-w-4xl mx-auto py-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold">Billing</h1>
        <p className="text-muted-foreground">
          Manage your billing and subscription settings.
        </p>
      </div>
      <BillingForm />
    </div>
  );
}
