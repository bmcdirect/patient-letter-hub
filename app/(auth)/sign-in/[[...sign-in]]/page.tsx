"use client"

import { SignIn, useUser } from "@clerk/nextjs"
import { useRouter } from "next/navigation"
import { useEffect, useRef } from "react"

export default function SignInPage() {
  const { isSignedIn, isLoaded } = useUser()
  const router = useRouter()
  const hasRedirected = useRef(false)

  useEffect(() => {
    // Only redirect if user is signed in, Clerk has loaded, and we haven't redirected yet
    if (isLoaded && isSignedIn && !hasRedirected.current) {
      hasRedirected.current = true
      router.push("/dashboard")
    }
  }, [isSignedIn, isLoaded, router])

  // Don't render anything while Clerk is loading
  if (!isLoaded) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </div>
    )
  }

  // Don't render sign-in if user is already signed in (prevents flash)
  if (isSignedIn) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </div>
    )
  }

  return (
    <div className="flex items-center justify-center min-h-screen bg-gray-50">
      <div className="w-full max-w-md">
        <SignIn 
          appearance={{
            elements: {
              formButtonPrimary: "bg-blue-600 hover:bg-blue-700 text-sm",
              card: "shadow-xl"
            }
          }}
          redirectUrl="/dashboard"
          signUpUrl="/sign-up"
        />
      </div>
    </div>
  )
}
