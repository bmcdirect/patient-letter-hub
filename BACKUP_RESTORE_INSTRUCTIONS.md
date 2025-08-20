# BACKUP & RESTORE INSTRUCTIONS
## BACKUP POINT: 8_20_2025_2_30pm_EST

**Date:** August 20, 2025  
**Time:** 2:30 PM EST  
**Status:** Complete working proofing system

### What's Working at This Backup Point:
✅ **Complete proofing system working**  
✅ **Status management dropdown fixed**  
✅ **User approvals flow to admin**  
✅ **All API endpoints functional**  
✅ **Database schema with filePath field**  
✅ **Clerk authentication restored**  
✅ **Multi-tenancy working correctly**  
✅ **File uploads working**  
✅ **Proof upload/download working**  
✅ **Status transitions working**  

### Git Backup Created:
- **Branch:** `working-app-v1-backup`
- **Tag:** `BACKUP_8_20_2025_2_30pm_EST`
- **Commit:** `8c42472`
- **Remote:** Pushed to GitHub

---

## HOW TO RESTORE TO THIS BACKUP POINT

### Option 1: Restore Code Only (Git)
```bash
# Navigate to your project directory
cd /path/to/your/project

# Fetch latest from remote
git fetch origin

# Checkout the backup branch
git checkout working-app-v1-backup

# Or checkout the specific tag
git checkout BACKUP_8_20_2025_2_30pm_EST

# Reset your current branch to this point (if needed)
git reset --hard BACKUP_8_20_2025_2_30pm_EST
```

### Option 2: Restore Code + Database
```bash
# 1. Restore code (see Option 1 above)

# 2. Restore database
# Connect to your PostgreSQL database
psql -h localhost -U your_username -d patientletterhub

# Run the restore script
\i scripts/restore-to-backup-point.sql
```

### Option 3: Complete Fresh Restore
```bash
# 1. Clone fresh from backup point
git clone -b working-app-v1-backup https://github.com/bmcdirect/patient-letter-hub.git
cd patient-letter-hub

# 2. Install dependencies
npm install

# 3. Set up environment variables
cp .env.example .env
# Edit .env with your database credentials

# 4. Restore database
psql -h localhost -U your_username -d patientletterhub -f scripts/restore-to-backup-point.sql

# 5. Generate Prisma client
npx prisma generate

# 6. Start the application
npm run dev
```

---

## DATABASE BACKUP FILES

### Export Current State:
```bash
# Run this to capture current database state
psql -h localhost -U your_username -d patientletterhub -f scripts/export-current-db-state.sql > current_db_backup.sql
```

### Restore to Backup Point:
```bash
# Run this to restore to backup point
psql -h localhost -U your_username -d patientletterhub -f scripts/restore-to-backup-point.sql
```

---

## VERIFICATION AFTER RESTORE

### Check Git Status:
```bash
git status
git log --oneline -5
git tag -l
```

### Check Database:
```bash
# Connect to database
psql -h localhost -U your_username -d patientletterhub

# Verify tables exist and have data
\dt
SELECT COUNT(*) FROM practices;
SELECT COUNT(*) FROM users;
SELECT COUNT(*) FROM orders;
SELECT COUNT(*) FROM "orderApprovals";
```

### Test Application:
1. Start the app: `npm run dev`
2. Navigate to `/admin` - should show admin dashboard
3. Navigate to `/orders` - should show user orders
4. Test proof upload as admin
5. Test proof review as user
6. Test status management dropdown

---

## IMPORTANT NOTES

⚠️ **WARNING:** The restore script will OVERWRITE all current data  
⚠️ **Always backup current state before restoring**  
⚠️ **Test restore in development environment first**  

### Before Restoring:
1. **Backup current database:**
   ```bash
   pg_dump -h localhost -U your_username -d patientletterhub > backup_before_restore_$(date +%Y%m%d_%H%M%S).sql
   ```

2. **Backup current code:**
   ```bash
   git add .
   git commit -m "Backup before restoring to 8_20_2025_2_30pm_EST"
   ```

3. **Verify backup files exist**

### After Restore:
1. **Verify all functionality works**
2. **Check database connections**
3. **Test key user flows**
4. **Verify file uploads work**
5. **Check status management**

---

## TROUBLESHOOTING

### Common Issues:

**Issue:** Prisma client out of sync  
**Solution:** `npx prisma generate`

**Issue:** Database connection failed  
**Solution:** Check `.env` file and database credentials

**Issue:** Missing tables  
**Solution:** Run `npx prisma db push`

**Issue:** File uploads not working  
**Solution:** Check `uploads/` directory permissions

**Issue:** Status management empty  
**Solution:** Verify `lib/status-management.ts` exists and is correct

---

## CONTACT & SUPPORT

If you encounter issues during restore:
1. Check this document first
2. Review the error logs
3. Verify all backup files exist
4. Test in a clean environment

**Backup Point ID:** `BACKUP_8_20_2025_2_30pm_EST`  
**Created:** August 20, 2025 at 2:30 PM EST  
**Status:** Verified Working ✅
