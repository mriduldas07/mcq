import NextAuth from "next-auth";
import Google from "next-auth/providers/google";
import { PrismaClient } from "@prisma/client";
import type { NextAuthConfig } from "next-auth";

const prisma = new PrismaClient();

export const authConfig = {
  providers: [
    Google({
      clientId: process.env.GOOGLE_CLIENT_ID!,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET!,
      authorization: {
        params: {
          prompt: "consent",
          access_type: "offline",
          response_type: "code"
        }
      }
    }),
  ],
  pages: {
    signIn: "/login",
  },
  callbacks: {
    async signIn({ user, account, profile }) {
      // Only allow Google sign-in
      if (account?.provider !== "google") {
        return false;
      }
      return true;
    },
    async jwt({ token, user, account, profile }) {
      // On first sign-in (when user object exists)
      if (user && account) {
        // Check if user exists in database
        let dbUser = await prisma.user.findUnique({
          where: { email: user.email! },
          select: {
            id: true,
            email: true,
            name: true,
            image: true,
            planType: true,
            freeExamsUsed: true,
            oneTimeExamsRemaining: true,
            provider: true,
            providerAccountId: true,
          },
        });

        // If user doesn't exist, create new user
        if (!dbUser) {
          dbUser = await prisma.user.create({
            data: {
              email: user.email!,
              name: user.name || "",
              image: user.image || null,
              provider: "google",
              providerAccountId: account.providerAccountId,
              planType: "FREE",
              freeExamsUsed: 0,
              oneTimeExamsRemaining: 0,
            },
            select: {
              id: true,
              email: true,
              name: true,
              image: true,
              planType: true,
              freeExamsUsed: true,
              oneTimeExamsRemaining: true,
              provider: true,
              providerAccountId: true,
            },
          });
        } else {
          // Update existing user's info (name, image) from Google
          dbUser = await prisma.user.update({
            where: { id: dbUser.id },
            data: {
              name: user.name || dbUser.name,
              image: user.image || dbUser.image,
            },
            select: {
              id: true,
              email: true,
              name: true,
              image: true,
              planType: true,
              freeExamsUsed: true,
              oneTimeExamsRemaining: true,
              provider: true,
              providerAccountId: true,
            },
          });
        }

        // Add user data to token
        token.userId = dbUser.id;
        token.email = dbUser.email;
        token.name = dbUser.name;
        token.picture = dbUser.image;
        token.planType = dbUser.planType;
        token.freeExamsUsed = dbUser.freeExamsUsed;
        token.oneTimeExamsRemaining = dbUser.oneTimeExamsRemaining;
      }

      return token;
    },
    async session({ session, token }) {
      // Add custom fields to session
      if (token && session.user) {
        session.user.id = token.userId as string;
        session.user.email = token.email as string;
        session.user.name = token.name as string;
        session.user.image = token.picture as string;
        session.user.planType = token.planType as string;
        session.user.freeExamsUsed = token.freeExamsUsed as number;
        session.user.oneTimeExamsRemaining = token.oneTimeExamsRemaining as number;
      }

      return session;
    },
  },
  session: {
    strategy: "jwt",
    maxAge: 7 * 24 * 60 * 60, // 7 days
  },
  trustHost: true,
  cookies: {
    sessionToken: {
      name: process.env.NODE_ENV === "production" 
        ? "__Secure-authjs.session-token" 
        : "authjs.session-token",
      options: {
        httpOnly: true,
        sameSite: "lax",
        path: "/",
        secure: process.env.NODE_ENV === "production",
      },
    },
  },
} satisfies NextAuthConfig;

export const { handlers, auth, signIn, signOut } = NextAuth(authConfig);
