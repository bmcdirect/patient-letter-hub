import { UserRole } from "@prisma/client";
import NextAuth, { type DefaultSession } from "next-auth";
import Credentials from "next-auth/providers/credentials";

// More info: https://authjs.dev/getting-started/typescript#module-augmentation
declare module "next-auth" {
  interface Session {
    user: {
      role: UserRole;
    } & DefaultSession["user"];
  }
}

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
        // For development, accept any email/password combination
        if (!credentials?.email || !credentials?.password) {
          return null;
        }

        return {
          id: "dev-user",
          email: credentials.email,
          name: "Development User",
          role: "USER" as UserRole,
        };
      },
    }),
  ],
  callbacks: {
    async session({ token, session }) {
      if (session.user) {
        if (token.sub) {
          session.user.id = token.sub;
        }
        if (token.email) {
          session.user.email = token.email;
        }
        if (token.role) {
          session.user.role = token.role;
        }
        session.user.name = token.name;
        session.user.image = token.picture;
      }
      return session;
    },
    async jwt({ token }) {
      if (!token.sub) return token;
      
      // For development, set default values
      token.name = token.name || "Development User";
      token.email = token.email || "dev@example.com";
      token.role = token.role || "USER";
      
      return token;
    },
  },
});

export default handler;
