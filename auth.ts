import { UserRole } from "@prisma/client";
import NextAuth from "next-auth";
import Credentials from "next-auth/providers/credentials";
import { prisma } from "@/lib/db";

const handler = NextAuth({
  secret: process.env.AUTH_SECRET,
  session: { strategy: "jwt" },
  pages: {
    signIn: "/login",
  },
  providers: [
    Credentials({
      name: "Credentials",
      credentials: {
        email: { label: "Email", type: "email", placeholder: "test@example.com" },
        password: { label: "Password", type: "password" },
      },
      async authorize(credentials) {
        console.log("🔐 Auth attempt:", { email: credentials?.email, passwordLength: credentials?.password?.length });
        
        if (!credentials?.email || !credentials?.password) {
          console.log("❌ Missing credentials");
          return null;
        }

        // Simple password check for development (password123)
        if (credentials.password !== "password123") {
          console.log("❌ Wrong password");
          return null;
        }

        // Find user in database
        const user = await prisma.user.findUnique({
          where: { email: credentials.email },
          include: { practice: true }
        });

        if (!user) {
          console.log("❌ User not found:", credentials.email);
          return null;
        }

        console.log("✅ User authenticated:", user.email, user.role);
        
        // Return the user object that will be encoded in the JWT
        return {
          id: user.id,
          email: user.email,
          name: user.name,
          role: user.role,
          practiceId: user.practiceId,
        };
      },
    }),
  ],
  callbacks: {
    async jwt({ token, user }) {
      console.log("🔐 JWT callback:", { 
        hasUser: !!user, 
        userId: user?.id, 
        tokenId: token.id,
        tokenSub: token.sub 
      });
      
      // If we have a user object (from authorize), include their data in the token
      if (user) {
        token.id = user.id;
        token.email = user.email;
        token.name = user.name;
        token.role = user.role;
        token.practiceId = user.practiceId;
        console.log("✅ JWT token updated with user data:", { id: token.id, role: token.role });
      }
      
      return token;
    },
    async session({ token, session }) {
      console.log("🔐 Session callback:", { 
        tokenId: token.id, 
        tokenRole: token.role,
        sessionUserId: session.user?.id 
      });
      
      // In NextAuth v4, we need to manually assign the token data to the session
      if (token && session.user) {
        session.user.id = token.id as string;
        session.user.email = token.email as string;
        session.user.name = token.name as string;
        session.user.role = token.role as UserRole;
        session.user.practiceId = token.practiceId as string;
        session.user.image = token.picture as string;
        
        console.log("✅ Session updated with user data:", { 
          id: session.user.id, 
          role: session.user.role 
        });
      }
      
      return session;
    },
  },
});

export default handler;
