"use server";

import { getServerSession } from "next-auth";
import handler from "@/auth";
import { stripe } from "@/lib/stripe";
import { prisma } from "@/lib/db";

export async function openCustomerPortal() {
  try {
    const session = await getServerSession(handler);

    if (!session?.user?.email) {
      throw new Error("Unauthorized");
    }

    const user = await prisma.user.findUnique({
      where: { email: session.user.email },
    });

    if (!user?.stripeCustomerId) {
      throw new Error("No Stripe customer ID found");
    }

    const portalSession = await stripe.billingPortal.sessions.create({
      customer: user.stripeCustomerId,
      return_url: `${process.env.NEXT_PUBLIC_APP_URL}/dashboard/billing`,
    });

    return { url: portalSession.url };
  } catch (error) {
    return { error: "Error opening customer portal" };
  }
}
