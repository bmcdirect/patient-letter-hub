"use server";

import { getServerSession } from "next-auth";
import handler from "@/auth";
import { stripe } from "@/lib/stripe";
import { prisma } from "@/lib/db";

export async function generateUserStripe() {
  try {
    const session = await getServerSession(handler);

    if (!session?.user?.email) {
      throw new Error("Unauthorized");
    }

    const user = await prisma.user.findUnique({
      where: { email: session.user.email },
    });

    if (!user) {
      throw new Error("User not found");
    }

    // Create a Stripe customer if one doesn't exist
    if (!user.stripeCustomerId) {
      const customer = await stripe.customers.create({
        email: user.email,
        name: user.name,
      });

      await prisma.user.update({
        where: { id: user.id },
        data: { stripeCustomerId: customer.id },
      });

      return { customerId: customer.id };
    }

    return { customerId: user.stripeCustomerId };
  } catch (error) {
    return { error: "Error generating Stripe customer" };
  }
}