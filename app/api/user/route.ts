import { NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import { getCurrentUser } from "@/lib/session-manager";
import { prisma } from "@/lib/db";

export async function GET() {
  try {
    const { userId } = await auth();
    
    if (!userId) {
      return new NextResponse("Unauthorized", { status: 401 });
    }

    const user = await getCurrentUser();
    
    if (!user) {
      return new NextResponse("User not found", { status: 404 });
    }

    return NextResponse.json({
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
        title: user.title,
        role: user.role,
        practiceId: user.practiceId,
        practice: user.practice,
        taxonomyCode: user.taxonomyCode,
        npi1: user.npi1,
        npi2: user.npi2,
      },
    });
  } catch (error) {
    console.error("Error fetching user:", error);
    return new NextResponse("Internal Server Error", { status: 500 });
  }
}

export async function PUT(request: Request) {
  try {
    console.log("🔍 PUT /api/user called");
    
    const user = await getCurrentUser();
    console.log("🔍 getCurrentUser result:", user ? "User found" : "User not found");
    
    if (!user) {
      console.log("❌ User not found in database");
      return new NextResponse("User not found", { status: 404 });
    }

    console.log("🔍 User data:", {
      id: user.id,
      practiceId: user.practiceId,
      hasPractice: !!user.practice
    });

    const body = await request.json();
    const { userData, practiceData } = body;

    console.log("🔍 Profile update request:", { userData, practiceData });

    // Test database connection first
    try {
      await prisma.$queryRaw`SELECT 1`;
      console.log("✅ Database connection test successful");
    } catch (dbError) {
      console.error("❌ Database connection test failed:", dbError);
      throw new Error("Database connection failed");
    }

    // Update user information
    console.log("🔄 Updating user with data:", userData);
    const updatedUser = await prisma.user.update({
      where: { id: user.id },
      data: {
        name: userData.name,
        title: userData.title,
        taxonomyCode: userData.taxonomyCode,
        npi1: userData.npi1,
        npi2: userData.npi2,
        updatedAt: new Date(),
      },
      include: { practice: true },
    });

    console.log("✅ User updated:", updatedUser);

    // Update or create practice information
    let updatedPractice;
    if (practiceData) {
      if (user.practiceId) {
        // Update existing practice
        console.log("🔄 Updating existing practice:", user.practiceId);
        updatedPractice = await prisma.practice.update({
          where: { id: user.practiceId },
          data: {
            name: practiceData.name,
            addressLine1: practiceData.addressLine1,
            addressLine2: practiceData.addressLine2,
            city: practiceData.city,
            state: practiceData.state,
            zipCode: practiceData.zipCode,
            phone: practiceData.phone,
            email: practiceData.email,
            updatedAt: new Date(),
          },
        });
        console.log("✅ Practice updated:", updatedPractice);
      } else {
        // Create new practice
        console.log("🆕 Creating new practice");
        updatedPractice = await prisma.practice.create({
          data: {
            name: practiceData.name,
            addressLine1: practiceData.addressLine1,
            addressLine2: practiceData.addressLine2,
            city: practiceData.city,
            state: practiceData.state,
            zipCode: practiceData.zipCode,
            phone: practiceData.phone,
            email: practiceData.email,
            // organizationId will be null for now - can be updated later
          },
        });
        console.log("✅ Practice created:", updatedPractice);

        // Link practice to user
        await prisma.user.update({
          where: { id: user.id },
          data: { practiceId: updatedPractice.id },
        });
        console.log("✅ User linked to practice");
      }
    }

    return NextResponse.json({
      user: updatedUser,
      practice: updatedPractice,
      message: "Profile updated successfully",
    });
  } catch (error) {
    console.error("❌ Error updating user:", error);
    console.error("❌ Error details:", {
      message: error.message,
      stack: error.stack,
      name: error.name,
    });
    
    // Return more specific error information
    return NextResponse.json({
      error: "Profile update failed",
      details: error.message,
      timestamp: new Date().toISOString()
    }, { status: 500 });
  }
}
