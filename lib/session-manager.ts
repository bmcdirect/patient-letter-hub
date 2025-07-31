import { AUTH_CONFIG } from './auth-config';
import { getCurrentUser as getNextAuthUser } from './session';
import { prisma } from './db';
import { auth } from '@clerk/nextjs/server';

export async function getCurrentUser() {
  if (AUTH_CONFIG.useClerk) {
    try {
      // Use Clerk session management
      const { userId } = auth();
      console.log('🔧 Clerk session check:', { userId });
      
      if (!userId) {
        console.log('❌ No Clerk user ID found');
        return null;
      }
      
      // Get user from database using clerkId
      const user = await prisma.user.findUnique({
        where: { clerkId: userId },
        include: { practice: true }
      });
      
      if (user) {
        console.log('✅ Clerk user found in database:', { 
          id: user.id, 
          email: user.email, 
          role: user.role 
        });
        return user;
      } else {
        console.log('❌ Clerk user not found in database, creating placeholder user');
        // For testing, create a placeholder user
        const placeholderUser = await prisma.user.create({
          data: {
            clerkId: userId,
            email: `clerk-${userId}@example.com`,
            name: 'Clerk User',
            role: 'USER',
            practiceId: 'default-practice-id', // This will need to be handled properly
          },
          include: { practice: true }
        });
        
        console.log('✅ Created placeholder Clerk user:', { 
          id: placeholderUser.id, 
          email: placeholderUser.email 
        });
        return placeholderUser;
      }
    } catch (error) {
      console.error('❌ Clerk session error:', error);
      return null;
    }
  } else {
    // Use existing NextAuth session management
    return await getNextAuthUser();
  }
}

export function getAuthUrls() {
  return AUTH_CONFIG.useClerk ? AUTH_CONFIG.clerk : AUTH_CONFIG.nextAuth;
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
  practiceId?: string;
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
      practiceId: userData.practiceId || '', // This will need to be handled properly
    },
    include: { practice: true }
  });
} 