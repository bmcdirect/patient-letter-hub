"use client"

import { SignIn, useAuth } from "@clerk/nextjs"
import { useRouter } from "next/navigation"
import { useEffect, useRef } from "react"

export default function SignInPage() {
  const didRedirect = useRef(false)
  const { isLoaded, userId } = useAuth()
  const router = useRouter()

  useEffect(() => {
    if (!isLoaded || didRedirect.current) return;
    if (userId) {
      didRedirect.current = true;
      router.replace("/dashboard");
    }
  }, [isLoaded, userId, router])

  // Don't render anything while Clerk is loading
  if (!isLoaded) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </div>
    )
  }

  // Don't render sign-in if user is already signed in (prevents flash)
  if (userId) {
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
