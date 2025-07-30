import Google from "next-auth/providers/google";
import Credentials from "next-auth/providers/credentials";

import { env } from "@/env.mjs";
import { prisma } from "@/lib/db";

export default {
  providers: [
    // Temporarily disabled to avoid OIDC errors
    // Google({
    //   clientId: env.GOOGLE_CLIENT_ID,
    //   clientSecret: env.GOOGLE_CLIENT_SECRET,
    // }),
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
              
              // Find the actual user in the database
              const user = await prisma.user.findUnique({
                where: { email: credentials.email },
                include: { practice: true }
              });
              
              if (!user) return null;
              
              return {
                id: user.id,
                name: user.name,
                email: user.email || '',
                role: user.role,
                practiceId: user.practiceId,
              };
            },
          }),
        ]
      : []),
  ],
};
