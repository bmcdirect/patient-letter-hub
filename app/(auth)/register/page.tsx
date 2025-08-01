import { redirect } from "next/navigation";
import { AUTH_CONFIG } from "@/lib/auth-config.client";

export default function RegisterPage() {
  if (AUTH_CONFIG.useClerk) {
    redirect("/sign-up");
  }

  // Fallback to NextAuth register if Clerk is not enabled
  return (
    <div className="container grid h-screen w-screen flex-col items-center justify-center lg:max-w-none lg:grid-cols-2 lg:px-0">
      <div className="hidden h-full bg-muted lg:block" />
      <div className="lg:p-8">
        <div className="mx-auto flex w-full flex-col justify-center space-y-6 sm:w-[350px]">
          <div className="flex flex-col space-y-2 text-center">
            <h1 className="text-2xl font-semibold tracking-tight">
              NextAuth Register
            </h1>
            <p className="text-sm text-muted-foreground">
              This is the NextAuth register page (Clerk is disabled)
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
