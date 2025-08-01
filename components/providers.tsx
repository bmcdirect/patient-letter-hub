"use client";

import { ClerkProvider } from "@clerk/nextjs";
import { AUTH_CONFIG } from "@/lib/auth-config.client";
import { ThemeProvider } from "next-themes";
import { Toaster } from "sonner";

interface ProvidersProps {
  children: React.ReactNode;
}

export default function Providers({ children }: ProvidersProps) {
  if (AUTH_CONFIG.useClerk) {
    return (
      <ClerkProvider
        publishableKey={process.env.NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY!}
        appearance={{
          elements: {
            formButtonPrimary: "bg-primary text-primary-foreground hover:bg-primary/90",
            card: "bg-card text-card-foreground",
            headerTitle: "text-foreground",
            headerSubtitle: "text-muted-foreground",
            socialButtonsBlockButton: "bg-secondary text-secondary-foreground hover:bg-secondary/80",
            formFieldInput: "bg-background text-foreground border border-input",
            formFieldLabel: "text-foreground",
            footerActionLink: "text-primary hover:text-primary/90",
          },
        }}
        forceRedirectUrl="/dashboard"
      >
        <ThemeProvider
          attribute="class"
          defaultTheme="system"
          enableSystem
          disableTransitionOnChange
        >
          {children}
          <Toaster />
        </ThemeProvider>
      </ClerkProvider>
    );
  }

  // Fallback for non-Clerk mode (shouldn't be used anymore)
  return (
    <ThemeProvider
      attribute="class"
      defaultTheme="system"
      enableSystem
      disableTransitionOnChange
    >
      {children}
      <Toaster />
    </ThemeProvider>
  );
} 