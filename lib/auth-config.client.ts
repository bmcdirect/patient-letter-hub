// lib/auth-config.client.ts
export const AUTH_CONFIG = {
  useClerk: process.env.NEXT_PUBLIC_USE_CLERK === "true",
  nextAuth: {
    loginUrl: "/login",
    logoutUrl: "/api/auth/signout",
    sessionUrl: "/api/auth/session",
  },
  clerk: {
    loginUrl: "/sign-in",
    logoutUrl: "/sign-out",
    sessionUrl: "/api/clerk/session",
  }
} as const;

export function getAuthUrls() {
  return AUTH_CONFIG.useClerk ? AUTH_CONFIG.clerk : AUTH_CONFIG.nextAuth;
}

export function shouldUseClerk() {
  return AUTH_CONFIG.useClerk;
}

// Helper to check if we're in a transition period
export function isAuthTransitionEnabled() {
  return process.env.NODE_ENV === 'development' && AUTH_CONFIG.useClerk;
} 