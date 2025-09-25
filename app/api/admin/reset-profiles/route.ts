import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";

export async function POST(req: NextRequest) {
  try {
    console.log("🔄 Admin reset profiles request received");

    const emailsToReset = ['cora@masscomminc.com', 'donnam@masscomminc.com'];
    const results = [];

    for (const email of emailsToReset) {
      try {
        // Find the user by email
        const user = await prisma.user.findUnique({
          where: { email },
          include: { practice: true }
        });

        if (!user) {
          results.push({
            email,
            status: 'not_found',
            message: 'User not found'
          });
          continue;
        }

        console.log(`👤 Found user: ${user.name} (${user.email})`);
        console.log(`   Current practiceId: ${user.practiceId || 'None'}`);

        // Remove practice association to make them "new users" again
        const updatedUser = await prisma.user.update({
          where: { id: user.id },
          data: { 
            practiceId: null,
            // Clear profile data to force re-setup
            name: null,
            title: null,
            taxonomyCode: null,
            npi1: null,
            npi2: null,
          }
        });

        console.log(`✅ Reset user profile: ${updatedUser.email}`);

        results.push({
          email,
          status: 'success',
          message: 'Profile reset successfully - will trigger welcome email on next setup',
          previousPracticeId: user.practiceId,
          newPracticeId: updatedUser.practiceId
        });

      } catch (error) {
        console.error(`❌ Error resetting user ${email}:`, error);
        results.push({
          email,
          status: 'error',
          message: error.message
        });
      }
    }

    // Verify the reset
    const resetUsers = await prisma.user.findMany({
      where: { 
        email: { in: emailsToReset }
      },
      include: { practice: true }
    });

    return NextResponse.json({
      success: true,
      message: "Profile reset completed",
      results,
      verification: resetUsers.map(user => ({
        email: user.email,
        name: user.name,
        practiceId: user.practiceId,
        practice: user.practice?.name || 'None',
        readyForWelcomeEmail: !user.practiceId
      }))
    });

  } catch (error) {
    console.error('❌ Error in reset profiles:', error);
    return NextResponse.json({
      success: false,
      error: "Failed to reset profiles",
      message: error.message
    }, { status: 500 });
  }
}
