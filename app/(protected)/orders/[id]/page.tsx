"use client";

import { useUser } from "@clerk/nextjs";
import { useRouter } from "next/navigation";
import { useEffect } from "react";

export default function OrderDetailPage() {
  const { isSignedIn, user } = useUser();
  const router = useRouter();

  useEffect(() => {
    if (!isSignedIn) {
      router.push("/sign-in");
    }
  }, [isSignedIn, router]);

  if (!isSignedIn) {
    return <div>Loading...</div>;
  }

  return (
    <div className="container mx-auto py-8">
      <h1 className="text-2xl font-bold mb-4">Order Details</h1>
      <p>Welcome, {user?.fullName || user?.emailAddresses[0]?.emailAddress}</p>
      {/* Your order details would go here */}
    </div>
  );
} 