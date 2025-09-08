-- Migration script to insert existing Clerk users into Azure PostgreSQL database
-- This script preserves role integrity and user data

-- Insert users with proper Clerk IDs and roles
-- Using INSERT ... ON CONFLICT to handle existing users gracefully

-- 1. David Sweeney (Business Owner) - ADMIN role
INSERT INTO "User" (
    "id",
    "clerkId",
    "email",
    "name",
    "role",
    "practiceId",
    "createdAt",
    "updatedAt"
) VALUES (
    'user_daves_' || extract(epoch from now())::text,
    'user_32NOEPQuaOEb4Nkccrvxb4qB5pb',
    'daves@masscomminc.com',
    'David Sweeney',
    'ADMIN',
    NULL,
    NOW(),
    NOW()
) ON CONFLICT ("email") DO UPDATE SET
    "clerkId" = EXCLUDED."clerkId",
    "role" = EXCLUDED."role",
    "updatedAt" = NOW();

-- 2. BMC Direct User - USER role
INSERT INTO "User" (
    "id",
    "clerkId",
    "email",
    "name",
    "role",
    "practiceId",
    "createdAt",
    "updatedAt"
) VALUES (
    'user_bmc_' || extract(epoch from now())::text,
    'user_3298o2Q5dfmbuZ278wginn2FFd9',
    'bmcdirect1@gmail.com',
    'BMC Direct User',
    'USER',
    NULL,
    NOW(),
    NOW()
) ON CONFLICT ("email") DO UPDATE SET
    "clerkId" = EXCLUDED."clerkId",
    "role" = EXCLUDED."role",
    "updatedAt" = NOW();

-- 3. Super Admin - ADMIN role
INSERT INTO "User" (
    "id",
    "clerkId",
    "email",
    "name",
    "role",
    "practiceId",
    "createdAt",
    "updatedAt"
) VALUES (
    'user_superadmin_' || extract(epoch from now())::text,
    'user_314b0h210YO1X1IwZjrnigzSFa9',
    'superadmin@masscomminc.com',
    'Super Admin',
    'ADMIN',
    NULL,
    NOW(),
    NOW()
) ON CONFLICT ("email") DO UPDATE SET
    "clerkId" = EXCLUDED."clerkId",
    "role" = EXCLUDED."role",
    "updatedAt" = NOW();

-- Verification queries
-- Check that all users were inserted correctly
SELECT 
    "email",
    "clerkId",
    "role",
    "practiceId",
    "createdAt"
FROM "User" 
WHERE "email" IN (
    'daves@masscomminc.com',
    'bmcdirect1@gmail.com', 
    'superadmin@masscomminc.com'
)
ORDER BY "email";

-- Security validation - count admin users
SELECT 
    "role",
    COUNT(*) as count
FROM "User" 
GROUP BY "role";

-- List all admin users for security verification
SELECT 
    "email",
    "clerkId",
    "role"
FROM "User" 
WHERE "role" = 'ADMIN'
ORDER BY "email";
