import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db';

export async function GET(request: NextRequest) {
  try {
    console.log('🔧 Starting practice setup...');

    // 1. Create Riverside Family Medicine Practice
    const practice = await prisma.practice.create({
      data: {
        organizationId: 'org_30ut6cLeepKYTXumxP21jmz6ree',
        name: 'Riverside Family Medicine',
        email: 'admin@riversidefamilymedicine.com',
        phone: '555-123-4567',
      },
    });

    console.log('✅ Created Riverside Family Medicine Practice:', practice.id);

    // 2. Update the user to link to this practice
    const updatedUser = await prisma.user.update({
      where: {
        id: 'cme3g2cko0000j2n2tn2fxubo',
      },
      data: {
        practiceId: practice.id,
      },
    });

    console.log('✅ Updated user to link to Riverside Family Medicine Practice');

    const result = {
      success: true,
      message: 'Practice setup completed successfully!',
      data: {
        practice: {
          id: practice.id,
          name: practice.name,
          organizationId: practice.organizationId,
          email: practice.email,
          phone: practice.phone,
          createdAt: practice.createdAt,
        },
        updatedUser: {
          id: updatedUser.id,
          name: updatedUser.name,
          email: updatedUser.email,
          practiceId: updatedUser.practiceId,
        },
      },
    };

    console.log('🎉 Practice setup completed successfully!');

    return NextResponse.json(result, { status: 200 });

  } catch (error) {
    console.error('❌ Error during practice setup:', error);
    
    return NextResponse.json(
      {
        success: false,
        message: 'Failed to set up practice',
        error: error instanceof Error ? error.message : 'Unknown error occurred',
      },
      { status: 500 }
    );
  }
}
