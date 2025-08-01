import { AUTH_CONFIG } from './auth-config';
import { prisma } from './db';
import { auth } from '@clerk/nextjs/server';
import { clerkClient } from '@clerk/nextjs/server';

export async function getCurrentUser() {
  try {
    console.log('🔧 Starting Clerk session check...');

    const { userId } = auth();
    console.log('🔧 Clerk userId:', userId);

    if (!userId) {
      console.log('❌ No Clerk user ID found - user not authenticated');
      return null;
    }

    // 1. Try to find user in your DB by clerkId
    let user = await prisma.user.findUnique({
      where: { clerkId: userId },
      include: { practice: true }
    });

    if (user) {
      console.log('✅ Found user by clerkId:', user.email);
      return user;
    }

    // 2. If not found by clerkId, fetch user from Clerk
    const clerkUser = await clerkClient.users.getUser(userId);
    const clerkEmail = clerkUser.emailAddresses[0]?.emailAddress;

    console.log('🔧 Clerk user data:', {
      id: clerkUser.id,
      email: clerkEmail,
      firstName: clerkUser.firstName,
      lastName: clerkUser.lastName
    });

    if (!clerkEmail) {
      console.log('❌ No email found in Clerk user');
      return null;
    }

    // 3. Try to find existing user by email (for linking existing accounts)
    user = await prisma.user.findUnique({
      where: { email: clerkEmail },
      include: { practice: true }
    });

    if (user) {
      // 4. Link existing Prisma user to Clerk
      console.log('🔗 Linking existing Prisma user to Clerk:', user.email);
      user = await prisma.user.update({
        where: { id: user.id },
        data: { clerkId: userId },
        include: { practice: true }
      });
      console.log('✅ Successfully linked user to Clerk');
      return user;
    }

    // 5. Create new user if not found anywhere
    console.log('🆕 Creating new user from Clerk data');
    user = await prisma.user.create({
      data: {
        clerkId: userId,
        email: clerkEmail,
        name: `${clerkUser.firstName ?? ""} ${clerkUser.lastName ?? ""}`.trim() || clerkEmail,
        role: "USER", // Default role
        // practiceId will be null - needs to be assigned by admin
      },
      include: { practice: true }
    });

    console.log('✅ Created new user:', user.email);
    return user;

  } catch (error) {
    console.error('❌ Error in getCurrentUser:', error);
    return null;
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