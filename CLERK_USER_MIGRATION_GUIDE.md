# Clerk User Migration Guide - CORRECTED ROLES

## Overview
This guide migrates existing Clerk users to Azure PostgreSQL with **CORRECT** role assignments.

## Critical Requirements
- **superadmin@masscomminc.com** → `ADMIN` role (ONLY admin account)
- **daves@masscomminc.com** → `USER` role (NOT admin - CORRECTED)
- **bmcdirect1@gmail.com** → `USER` role

## Prerequisites

### 1. Azure PostgreSQL Access
Ensure you have access to the Azure PostgreSQL database:
```
Server: patientletterhub-dev-postgres.postgres.database.azure.com
Port: 5432
Database: patientletterhub_dev_db
Username: plh_admin
Password: Maryland2!@pLh3
```

### 2. Firewall Configuration
Add your current IP address to the Azure PostgreSQL firewall rules:
1. Go to Azure Portal → PostgreSQL servers → patientletterhub-dev-postgres
2. Navigate to "Connection security"
3. Add your current IP address to the firewall rules
4. Save the configuration

### 3. Required Tools
- `psql` (PostgreSQL client)
- `tsx` (TypeScript execution) - `npm install -g tsx`

## Migration Methods

### Method 1: Direct SQL Execution (Recommended)

1. **Connect to the database:**
```bash
psql "postgresql://plh_admin:Maryland2%21%40pLh3@patientletterhub-dev-postgres.postgres.database.azure.com:5432/patientletterhub_dev_db?sslmode=require"
```

2. **Execute the migration SQL:**
```sql
-- CORRECTED Clerk User Migration to Azure PostgreSQL
-- This script migrates existing Clerk users with CORRECT role assignments

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
```

### Method 2: TypeScript Script Execution

1. **Set up environment:**
```bash
# Create .env.local file with Azure connection string
echo 'DATABASE_URL="postgresql://plh_admin:Maryland2%21%40pLh3@patientletterhub-dev-postgres.postgres.database.azure.com:5432/patientletterhub_dev_db?sslmode=require"' > .env.local
```

2. **Run the migration script:**
```bash
npx tsx scripts/migrate-clerk-users-corrected.ts
```

## Verification Steps

After running the migration, verify the results:

1. **Check user count:**
```sql
SELECT COUNT(*) as total_users FROM users;
-- Should return: 3
```

2. **Check role distribution:**
```sql
SELECT 
    role,
    COUNT(*) as count
FROM users 
GROUP BY role;
-- Should return: 1 ADMIN, 2 USER
```

3. **Verify specific users:**
```sql
SELECT email, name, role 
FROM users 
ORDER BY email;
-- Should show:
-- bmcdirect1@gmail.com | BMC Direct | USER
-- daves@masscomminc.com | Dave Sweeney | USER
-- superadmin@masscomminc.com | Super Admin | ADMIN
```

## Expected Results

✅ **SUCCESS CRITERIA:**
- Exactly **1 ADMIN** account: `superadmin@masscomminc.com`
- Exactly **2 USER** accounts: `daves@masscomminc.com`, `bmcdirect1@gmail.com`
- Total of **3 users** in the database
- Only `superadmin@masscomminc.com` has administrative privileges

## Troubleshooting

### Connection Issues
- **Error: "Can't reach database server"**
  - Check Azure PostgreSQL firewall rules
  - Verify the server is running
  - Confirm the connection string is correct

### Migration Issues
- **Error: "User already exists"**
  - The script will automatically remove existing users first
  - Check for any foreign key constraints

- **Error: "Role validation failed"**
  - Ensure the UserRole enum is properly defined in the database
  - Check that 'ADMIN' and 'USER' are valid enum values

## Files Created

1. `scripts/migrate-clerk-users-corrected.ts` - TypeScript migration script
2. `scripts/migrate-clerk-users-corrected.sql` - Direct SQL migration script
3. `scripts/test-db-connection.ts` - Database connection test script
4. `CLERK_USER_MIGRATION_GUIDE.md` - This comprehensive guide

## Security Notes

- The migration ensures only `superadmin@masscomminc.com` has administrative privileges
- All users are marked as email verified since they're migrating from Clerk
- User IDs are generated with Clerk prefixes for traceability
- The migration is idempotent - it can be run multiple times safely
