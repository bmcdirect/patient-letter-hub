-- CORRECTED Clerk User Migration to Azure PostgreSQL
-- This script migrates existing Clerk users with CORRECT role assignments
-- 
-- CRITICAL: Only superadmin@masscomminc.com should have ADMIN role
-- daves@masscomminc.com should be USER (NOT admin)

-- Connect to Azure database using:
-- DATABASE_URL="postgresql://plh_admin:Maryland2!@pLh3@patientletterhub-dev-postgres.postgres.database.azure.com:5432/patientletterhub_dev_db?sslmode=require"

-- First, remove any existing users to ensure clean migration
DELETE FROM users 
WHERE email IN (
    'superadmin@masscomminc.com',
    'daves@masscomminc.com', 
    'bmcdirect1@gmail.com'
);

-- Insert users with CORRECT roles
-- 1. superadmin@masscomminc.com → ADMIN (only admin account)
INSERT INTO users (
    id,
    email,
    name,
    role,
    "emailVerified",
    "created_at",
    "updated_at"
) VALUES (
    'clerk_superadmin_' || extract(epoch from now())::text,
    'superadmin@masscomminc.com',
    'Super Admin',
    'ADMIN',
    NOW(),
    NOW(),
    NOW()
);

-- 2. daves@masscomminc.com → USER (NOT admin - CORRECTED)
INSERT INTO users (
    id,
    email,
    name,
    role,
    "emailVerified",
    "created_at",
    "updated_at"
) VALUES (
    'clerk_daves_' || extract(epoch from now())::text,
    'daves@masscomminc.com',
    'Dave Sweeney',
    'USER',
    NOW(),
    NOW(),
    NOW()
);

-- 3. bmcdirect1@gmail.com → USER
INSERT INTO users (
    id,
    email,
    name,
    role,
    "emailVerified",
    "created_at",
    "updated_at"
) VALUES (
    'clerk_bmc_' || extract(epoch from now())::text,
    'bmcdirect1@gmail.com',
    'BMC Direct',
    'USER',
    NOW(),
    NOW(),
    NOW()
);

-- Verify the migration results
SELECT 
    'MIGRATION VERIFICATION' as status,
    COUNT(*) as total_users,
    COUNT(CASE WHEN role = 'ADMIN' THEN 1 END) as admin_count,
    COUNT(CASE WHEN role = 'USER' THEN 1 END) as user_count
FROM users;

-- Show all users with their roles
SELECT 
    email,
    name,
    role,
    "created_at"
FROM users 
ORDER BY "created_at" ASC;

-- Verify critical requirement: exactly 1 ADMIN and 2 USER accounts
DO $$
DECLARE
    admin_count INTEGER;
    user_count INTEGER;
    total_count INTEGER;
BEGIN
    SELECT 
        COUNT(CASE WHEN role = 'ADMIN' THEN 1 END),
        COUNT(CASE WHEN role = 'USER' THEN 1 END),
        COUNT(*)
    INTO admin_count, user_count, total_count
    FROM users;
    
    IF admin_count = 1 AND user_count = 2 THEN
        RAISE NOTICE '✅ MIGRATION SUCCESSFUL! Exactly 1 ADMIN and 2 USER accounts created.';
        RAISE NOTICE '✓ Only superadmin@masscomminc.com has administrative privileges.';
    ELSE
        RAISE EXCEPTION '❌ MIGRATION FAILED! Expected 1 ADMIN and 2 USER, got % ADMIN and % USER (total: %)', 
            admin_count, user_count, total_count;
    END IF;
END $$;
