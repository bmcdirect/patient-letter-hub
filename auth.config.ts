import type { NextAuthConfig } from "next-auth";
import Google from "next-auth/providers/google";
import Resend from "next-auth/providers/resend";
import Credentials from "next-auth/providers/credentials";

import { env } from "@/env.mjs";
import { sendVerificationRequest } from "@/lib/email";

export default {
  providers: [
    Google({
      clientId: env.GOOGLE_CLIENT_ID,
      clientSecret: env.GOOGLE_CLIENT_SECRET,
    }),
    Resend({
      apiKey: env.RESEND_API_KEY,
      from: env.EMAIL_FROM,
      // sendVerificationRequest,
    }),
    ...(process.env.NODE_ENV !== "production"
      ? [
          Credentials({
            name: "Credentials",
            credentials: {
              email: { label: "Email", type: "email", placeholder: "test@example.com" },
              password: { label: "Password", type: "password" },
            },
            async authorize(credentials) {
              // Accept any credentials for dev, or check against a test user
              if (!credentials?.email) return null;
              return {
                id: "test-user-id",
                name: "Test User",
                email: String(credentials.email),
                role: "ADMIN",
                practiceId: "test-practice-id",
              };
            },
          }),
        ]
      : []),
  ],
} satisfies NextAuthConfig;
