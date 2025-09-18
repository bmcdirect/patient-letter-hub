# Database Environment Rollback Plan

## Current State
- Both local (.env.local) and Vercel environments point to the same Azure PostgreSQL database
- Database: `patientletterhub-dev-postgres.postgres.database.azure.com:5432/postgres`
- SSL Mode: `require`
- All environments use the same database for unified testing

## Rollback Plan: Split Dev/Prod Environments

### Step 1: Create Development Database
1. Create a new Azure PostgreSQL database for development:
   - Server: `patientletterhub-dev-postgres.postgres.database.azure.com`
   - Database Name: `patientletterhub_dev_db` (or similar)
   - Or create a completely separate Azure PostgreSQL server for dev

### Step 2: Update Local Environment
1. Update `.env.local`:
   ```bash
   DATABASE_URL="postgresql://plh_admin:<PASSWORD>@patientletterhub-dev-postgres.postgres.database.azure.com:5432/patientletterhub_dev_db?sslmode=require"
   ```

### Step 3: Keep Production Environment
1. Keep Vercel environment variables pointing to production database:
   ```bash
   DATABASE_URL="postgresql://plh_admin:<PASSWORD>@patientletterhub-dev-postgres.postgres.database.azure.com:5432/postgres?sslmode=require"
   ```

### Step 4: Apply Migrations and Seed
1. Run migrations on both databases:
   ```bash
   # For local dev
   npx prisma migrate deploy
   npm run db:seed
   
   # For production (via Vercel deployment)
   # Migrations will run automatically on deployment
   ```

### Step 5: Verify Separation
1. Test local endpoints show dev database
2. Test production endpoints show production database
3. Confirm data isolation between environments

## Seed Script Safety
- The seed script (`prisma/seed.ts`) is idempotent
- Uses upsert patterns for both Practices and Users
- Safe to run multiple times without duplication
- Can be run on both dev and prod databases independently

## Environment Variables to Update

### Local (.env.local)
```bash
DATABASE_URL="postgresql://plh_admin:<PASSWORD>@patientletterhub-dev-postgres.postgres.database.azure.com:5432/patientletterhub_dev_db?sslmode=require"
```

### Vercel (Project Settings → Environment Variables)
```bash
DATABASE_URL="postgresql://plh_admin:<PASSWORD>@patientletterhub-dev-postgres.postgres.database.azure.com:5432/postgres?sslmode=require"
```

## Verification Commands
```bash
# Test local database
curl http://localhost:3002/api/db/where
curl http://localhost:3002/api/test-db-connection

# Test production database (after deployment)
curl https://your-app.vercel.app/api/db/where
curl https://your-app.vercel.app/api/test-db-connection
```

## Notes
- The current unified setup allows for easy testing and development
- Rollback can be performed at any time without data loss
- Both environments will have the same schema and seed data
- Clerk user mappings will work in both environments
