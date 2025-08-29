import Image from "next/image";
import Link from "next/link";

import { getCurrentUser } from "@/lib/session-manager";
import { getUserSubscriptionPlan } from "@/lib/subscription";
import { constructMetadata } from "@/lib/utils";
import { ComparePlans } from "@/components/pricing/compare-plans";
import { PricingCards } from "@/components/pricing/pricing-cards";
import { PricingFaq } from "@/components/pricing/pricing-faq";

export const metadata = constructMetadata({
  title: "Pricing - PatientLetterHub HIPAA-Compliant Patient Communications",
  description: "Simple, transparent pricing for HIPAA-compliant patient communications. Pay only for what you mail with no hidden fees.",
});

export default async function PricingPage() {
  const user = await getCurrentUser();

  if (user?.role === "ADMIN") {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center">
        <h1 className="text-5xl font-bold">Seriously?</h1>
        <Image
          src="/_static/illustrations/call-waiting.svg"
          alt="403"
          width={560}
          height={560}
          className="pointer-events-none -my-20 dark:invert"
        />
        <p className="text-balance px-4 text-center text-2xl font-medium">
          You are an {user.role}. Back to{" "}
          <Link
            href="/admin"
            className="text-muted-foreground underline underline-offset-4 hover:text-purple-500"
          >
            Dashboard
          </Link>
          .
        </p>
      </div>
    );
  }

  let subscriptionPlan;
  if (user && user.id) {
    subscriptionPlan = await getUserSubscriptionPlan(user.id);
  }

  return (
    <div className="flex w-full flex-col gap-16 py-8 md:py-8">
      {/* Hero Section */}
      <div className="container mx-auto px-4 text-center">
        <h1 className="mb-4 text-4xl font-bold text-gray-900 lg:text-5xl">
          Simple, Transparent Pricing
        </h1>
        <p className="mb-8 text-xl text-gray-600">
          Pay only for what you mail. No monthly fees, no hidden costs, no surprises.
        </p>
      </div>
      
      <PricingCards userId={user?.id} subscriptionPlan={subscriptionPlan} />
      <hr className="container" />
      <ComparePlans />
      <PricingFaq />
      
      {/* Additional Pricing Information */}
      <div className="container mx-auto px-4">
        <div className="mx-auto max-w-4xl text-center">
          <h2 className="mb-8 text-3xl font-bold text-gray-900">
            What's Included in Every Plan
          </h2>
          <div className="grid gap-6 md:grid-cols-3">
            <div className="rounded-lg bg-blue-50 p-6">
              <h3 className="mb-3 text-lg font-semibold text-blue-900">HIPAA Compliance</h3>
              <p className="text-sm text-blue-700">
                Full HIPAA compliance, Business Associate Agreements, and audit trails
              </p>
            </div>
            <div className="rounded-lg bg-green-50 p-6">
              <h3 className="mb-3 text-lg font-semibold text-green-900">Address Hygiene</h3>
              <p className="text-sm text-green-700">
                Automatic NCOA updates and address validation for accurate delivery
              </p>
            </div>
            <div className="rounded-lg bg-purple-50 p-6">
              <h3 className="mb-3 text-lg font-semibold text-purple-900">24/7 Support</h3>
              <p className="text-sm text-purple-700">
                Expert healthcare communication support whenever you need it
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
