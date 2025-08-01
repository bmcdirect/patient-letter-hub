"use client";

import { SignIn } from "@clerk/nextjs";
import { useUser } from "@clerk/nextjs";
import { useEffect } from "react";
import { useRouter } from "next/navigation";

export default function SignInPage() {
  const { isSignedIn } = useUser();
  const router = useRouter();

  useEffect(() => {
    if (isSignedIn) {
      router.push("/dashboard"); // or /admin if role-based
    }
  }, [isSignedIn, router]);

  if (isSignedIn) return null;

  return (
    <div className="flex min-h-screen items-center justify-center">
      <SignIn routing="hash" />
    </div>
  );
}
