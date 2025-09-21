import { AUTH_CONFIG } from './auth-config.client';
import { prisma } from './db';
import { auth } from '@clerk/nextjs/server';
import { clerkClient } from '@clerk/nextjs/server';

export async function getCurrentUser() {
  try {
    console.log('🔍 getCurrentUser() called')
    
    const { userId } = await auth()
    console.log('📝 Clerk userId from auth():', userId)
    console.log('📝 userId type:', typeof userId)
    console.log('📝 userId exists:', !!userId)
    
    if (!userId) {
      console.log('❌ No userId from Clerk auth(), returning null')
      return null
    }

    console.log('🔍 Querying database for user with clerkId:', userId)
    
    const user = await prisma.user.findUnique({
      where: {
        clerkId: userId
      },
      select: {
        id: true,
        email: true,
        name: true,
        role: true,
        clerkId: true,
        createdAt: true,
        updatedAt: true
      }
    })

    console.log('📊 Database query result:', user)
    console.log('📊 User found:', !!user)
    
    if (user) {
      console.log('✅ User found in database:', user.email)
    } else {
      console.log('❌ No user found in database for clerkId:', userId)
      
      // Show all users for comparison
      const allUsers = await prisma.user.findMany({
        select: { email: true, clerkId: true }
      })
      console.log('📋 All users in database:', allUsers)
    }

    return user
  } catch (error) {
    console.error('💥 getCurrentUser() error:', error)
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