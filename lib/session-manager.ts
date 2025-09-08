import { AUTH_CONFIG } from './auth-config.client';
import { prisma } from './db';
import { auth } from '@clerk/nextjs/server';
import { clerkClient } from '@clerk/nextjs/server';

export async function getCurrentUser() {
  try {
    const { userId } = auth()
    
    if (!userId) {
      return null
    }

    const user = await prisma.user.findUnique({
      where: {
        clerkId: userId
      },
      include: { practice: true }
    })

    return user
  } catch (error) {
    console.error("Error in getCurrentUser:", error)
    return null
  }
}

export function getAuthUrls() {
  return {
    loginUrl: "/sign-in",
    signUpUrl: "/sign-up",
  };
}

export function shouldUseClerk() {
  return AUTH_CONFIG.useClerk;
}

// Helper function to get user by Clerk ID
export async function getUserByClerkId(clerkId: string) {
  return await prisma.user.findUnique({
    where: { clerkId },
    include: { practice: true }
  });
}

// Helper function to create or update user with Clerk ID
export async function upsertUserWithClerkId(clerkId: string, userData: {
  email: string;
  name?: string;
  role?: 'ADMIN' | 'USER';
  practiceId?: string | null;
}) {
  return await prisma.user.upsert({
    where: { clerkId },
    update: {
      email: userData.email,
      name: userData.name,
      role: userData.role,
      practiceId: userData.practiceId,
    },
    create: {
      clerkId,
      email: userData.email,
      name: userData.name,
      role: userData.role || 'USER',
      practiceId: userData.practiceId || null,
    },
    include: { practice: true }
  });
} 