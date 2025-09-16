import { Suspense } from "react";
import PricingCardsClient from "./pricing-cards.client";
import { UserSubscriptionPlan } from "@/types";

interface PricingCardsServerProps {
  userId?: string;
  subscriptionPlan?: UserSubscriptionPlan;
}

export default async function PricingCardsServer({ userId, subscriptionPlan }: PricingCardsServerProps) {
  return (
    <Suspense fallback={null}>
      <PricingCardsClient userId={userId} subscriptionPlan={subscriptionPlan} />
    </Suspense>
  );
}
