"use client";

import Link from "next/link";
import { useUser } from "@clerk/nextjs";
import { ModeToggle } from "./mode-toggle";
import { UserAccountNav } from "./user-account-nav";

export function NavBar() {
  const { isSignedIn, user } = useUser();

  return (
    <header className="sticky top-0 z-50 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="container flex h-14 items-center">
        <div className="mr-4 hidden md:flex">
          <Link href="/" className="mr-6 flex items-center space-x-2">
            <span className="hidden font-bold sm:inline-block">
              Patient Letter Hub
            </span>
          </Link>
        </div>
        <div className="flex flex-1 items-center justify-between space-x-2 md:justify-end">
          <div className="w-full flex-1 md:w-auto md:flex-none">
            {/* Add search or other nav items here */}
          </div>
          <nav className="flex items-center space-x-2">
            <ModeToggle />
            {isSignedIn ? (
              <UserAccountNav />
            ) : (
              <Link
                href="/sign-in"
                className="inline-flex h-9 items-center justify-center rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground shadow transition-colors hover:bg-primary/90 focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:pointer-events-none disabled:opacity-50"
              >
                Sign In
              </Link>
            )}
          </nav>
        </div>
      </div>
    </header>
  );
}
