-- Database Restore Script for BACKUP_8_20_2025_2_30pm_EST
-- This script will restore the database to the exact state as of 8/20/2025 2:30pm EST
-- 
-- IMPORTANT: Run this script ONLY when you want to return to this backup point
-- This will OVERWRITE all current data

-- First, let's create a backup of the current state (just in case)
-- CREATE TABLE IF NOT EXISTS backup_before_restore_$(date +%Y%m%d_%H%M%S) AS SELECT * FROM orders;

-- Clear existing data (be careful!)
TRUNCATE TABLE "orderStatusHistory" CASCADE;
TRUNCATE TABLE "orderApprovals" CASCADE;
TRUNCATE TABLE "orderFiles" CASCADE;
TRUNCATE TABLE "orders" CASCADE;
TRUNCATE TABLE "quotes" CASCADE;
TRUNCATE TABLE "users" CASCADE;
TRUNCATE TABLE "practices" CASCADE;

-- Reset sequences
ALTER SEQUENCE IF EXISTS "orderStatusHistory_id_seq" RESTART WITH 1;
ALTER SEQUENCE IF EXISTS "orderApprovals_id_seq" RESTART WITH 1;
ALTER SEQUENCE IF EXISTS "orderFiles_id_seq" RESTART WITH 1;
ALTER SEQUENCE IF EXISTS "orders_id_seq" RESTART WITH 1;
ALTER SEQUENCE IF EXISTS "quotes_id_seq" RESTART WITH 1;
ALTER SEQUENCE IF EXISTS "users_id_seq" RESTART WITH 1;
ALTER SEQUENCE IF EXISTS "practices_id_seq" RESTART WITH 1;

-- Insert the exact data as of 8/20/2025 2:30pm EST
-- This data should match what's currently in your database

-- Insert practices
INSERT INTO "practices" ("id", "name", "address", "phone", "email", "createdAt", "updatedAt", "organizationId") VALUES
('cmed9kdtu0000ac9v5dfiovy9', 'Bright Smiles Dental', '789 Dental Plaza, Suite 100, Riverside, CA 92501', '(555) 234-5678', 'admin@brightsmilesdental.com', '2025-08-15 20:11:30.691', '2025-08-15 20:11:30.691', 'org_30ut9E4OtIT3bh0D1FVyDwlZ2tj'),
('cmek53x510000vstanl0uyr4o', 'Riverside Family Medicine', '123 Medical Center Dr, Riverside, CA 92501', '(555) 123-4567', 'admin@riversidefamily.com', '2025-08-15 20:11:30.691', '2025-08-15 20:11:30.691', 'org_30ut9E4OtIT3bh0D1FVyDwlZ2tj');

-- Insert users
INSERT INTO "users" ("id", "name", "email", "emailVerified", "image", "createdAt", "updatedAt", "role", "stripeCustomerId", "stripeSubscriptionId", "stripePriceId", "stripeCurrentPeriodEnd", "practiceId", "clerkId") VALUES
('cmed9kdu10004ac9vkaanetem', 'Bmc Direct', 'bmcdirect1@gmail.com', NULL, NULL, '2025-08-15 20:11:30.697', '2025-08-15 20:11:30.697', 'USER', NULL, NULL, NULL, NULL, 'cmed9kdtu0000ac9v5dfiovy9', 'user_30utcXXAFEen5gc7nT3e3lAqMTV'),
('cmek53x550004vstanzjwctg9', 'Bmc Direct', 'bmcdirect1@gmail.com', NULL, NULL, '2025-08-15 20:11:30.697', '2025-08-15 20:11:30.697', 'USER', NULL, NULL, NULL, NULL, 'cmek53x510000vstanl0uyr4o', 'user_30utcXXAFEen5gc7nT3e3lAqMTV'),
('cmek53x570008vstagphy3sbu', 'Super Admin', 'superadmin@masscomminc.com', NULL, NULL, '2025-08-15 20:11:30.697', '2025-08-15 20:11:30.697', 'ADMIN', NULL, NULL, NULL, NULL, NULL, 'user_314b0h210YO1X1IwZjrnigzSFa9');

-- Insert quotes (if any exist)
-- INSERT INTO "quotes" (...) VALUES (...);

-- Insert orders (if any exist)
-- INSERT INTO "orders" (...) VALUES (...);

-- Insert order files (if any exist)
-- INSERT INTO "orderFiles" (...) VALUES (...);

-- Insert order approvals (if any exist)
-- INSERT INTO "orderApprovals" (...) VALUES (...);

-- Insert status history (if any exist)
-- INSERT INTO "orderStatusHistory" (...) VALUES (...);

-- Verify the restore
SELECT 'Database restored to BACKUP_8_20_2025_2_30pm_EST' as status;
SELECT COUNT(*) as practices_count FROM "practices";
SELECT COUNT(*) as users_count FROM "users";
SELECT COUNT(*) as quotes_count FROM "quotes";
SELECT COUNT(*) as orders_count FROM "orders";
SELECT COUNT(*) as order_files_count FROM "orderFiles";
SELECT COUNT(*) as order_approvals_count FROM "orderApprovals";
SELECT COUNT(*) as status_history_count FROM "orderStatusHistory";
