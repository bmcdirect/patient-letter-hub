# Database Configuration - Single Source of Truth

## Overview
Both development and production environments now use the **same Azure PostgreSQL database** to eliminate confusion and provide a single source of truth for user data.

## Database Details
- **Provider**: Azure PostgreSQL
- **Server**: `patientletterhub-dev-postgres.postgres.database.azure.com`
- **Database**: `postgres`
- **Port**: `5432`
- **SSL**: Required (`sslmode=require`)

## Connection String
```
DATABASE_URL="postgresql://username:password@hostname:5432/database?sslmode=require"
```

**Note**: Password encoding: `password!@symbols` → `password%21%40symbols`

## Environment Configuration

### Local Development (.env.local)
```bash
DATABASE_URL="postgresql://username:password@hostname:5432/database?sslmode=require"
NEXT_PUBLIC_APP_URL=https://www.patientletterhub.com
NEXT_PUBLIC_USE_CLERK=true
NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY=pk_test_ZnJhbmstbWFuYXRlZS03Ni5jbGVyay5hY2NvdW50cy5kZXYk
CLERK_SECRET_KEY=sk_test_ixX6wP0gEPsm6LADsFSP310wX0mVBzDNF0wfTG6znJ
```

### Production (Vercel Environment Variables)
- **DATABASE_URL**: Same as above
- **CLERK_SECRET_KEY**: Live production key
- **NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY**: Live production key

## Current Database State
- **Users**: 4 users with Clerk IDs
- **Practices**: 3 practices
- **Authentication**: Working correctly with no redirect loops

## Benefits of Single Database Approach
1. **Single Source of Truth**: All user data in one place
2. **Simplified Development**: No need to sync between environments
3. **Consistent Authentication**: Same user records across environments
4. **Easier Testing**: Can test with real production data
5. **Reduced Complexity**: No database migration issues between environments

## Verification Commands
```bash
# Test database connection
npx prisma db pull

# Check current users
npx prisma studio

# Generate Prisma client
npx prisma generate
```

## Security Notes
- Database uses SSL encryption
- Credentials stored in environment variables
- Development uses test Clerk keys, production uses live keys
- Same database but different authentication keys per environment

## Status: ✅ CONFIGURED AND WORKING
- Database connectivity: ✅ Verified
- Authentication flow: ✅ Working (no redirect loops)
- User data: ✅ Available (4 users with Clerk IDs)
- Environment consistency: ✅ Both environments use same database
