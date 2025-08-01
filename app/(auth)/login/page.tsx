import { redirect } from "next/navigation";
import { AUTH_CONFIG } from "@/lib/auth-config.client";

export default function LoginPage() {
  if (AUTH_CONFIG.useClerk) {
    redirect("/sign-in");
  }

  // Fallback to NextAuth login if Clerk is not enabled
  return (
    <div className="container flex h-screen w-screen flex-col items-center justify-center">
      <div className="mx-auto flex w-full flex-col justify-center space-y-6 sm:w-[350px]">
        <div className="flex flex-col space-y-2 text-center">
          <h1 className="text-2xl font-semibold tracking-tight">
            NextAuth Login
          </h1>
          <p className="text-sm text-muted-foreground">
            This is the NextAuth login page (Clerk is disabled)
          </p>
        </div>
      </div>
    </div>
  );
}
